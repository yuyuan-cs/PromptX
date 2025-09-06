/**
 * ElectronPnpmWorker - Electron环境下的pnpm安装器
 * 
 * 使用utilityProcess创建隔离的Node.js进程执行pnpm安装
 * 通过输出检测机制解决CLI脚本不自动退出的问题
 */

const path = require('path');
const logger = require('@promptx/logger');
const PnpmUtils = require('./PnpmUtils');

class ElectronPnpmWorker {
  /**
   * 在Electron环境中安装pnpm依赖
   * @param {Object} options - 安装选项
   * @param {string} options.workingDir - 工作目录
   * @param {Object|Array} options.dependencies - 依赖列表
   * @param {number} options.timeout - 超时时间（毫秒）
   * @returns {Promise<Object>} 安装结果
   */
  static async install({ workingDir, dependencies, timeout = 30000 }) {
    const startTime = Date.now();
    
    try {
      // 验证Electron环境
      this.validateElectronEnvironment();
      
      // 获取utilityProcess
      const utilityProcess = global.PROMPTX_UTILITY_PROCESS;
      if (!utilityProcess) {
        throw new Error('UtilityProcess not found in global.PROMPTX_UTILITY_PROCESS');
      }
      
      // 准备pnpm执行参数
      const { pnpmBinaryPath, fullArgs, depsListString } = this.preparePnpmCommand(dependencies);
      
      // 记录执行信息
      this.logExecutionInfo(pnpmBinaryPath, workingDir, fullArgs, depsListString);
      
      // 准备环境变量
      const envVars = this.prepareEnvironment();
      
      // 创建worker进程
      const worker = utilityProcess.fork(pnpmBinaryPath, fullArgs, {
        cwd: workingDir,
        stdio: 'pipe',
        env: envVars
      });
      
      // 执行安装并等待完成
      return await this.executeInstallation(worker, startTime, timeout);
      
    } catch (error) {
      logger.error(`[ElectronPnpmWorker] Failed to create utilityProcess: ${error.message}`);
      throw new Error(`Failed to create pnpm worker: ${error.message}`);
    }
  }
  
  /**
   * 验证Electron环境
   */
  static validateElectronEnvironment() {
    if (!process.versions.electron) {
      throw new Error('Not running in Electron environment');
    }
    
    if (process.env.PROMPTX_UTILITY_PROCESS_AVAILABLE !== 'true') {
      throw new Error('UtilityProcess not available from main process');
    }
  }
  
  /**
   * 准备pnpm命令参数
   */
  static preparePnpmCommand(dependencies) {
    const pnpmBinaryPath = PnpmUtils.getPnpmBinaryPath();
    const pnpmArgs = PnpmUtils.getOptimizedPnpmArgs();
    const depsListString = PnpmUtils.buildDependenciesList(dependencies);
    
    // 将依赖字符串转换为参数数组
    const depsList = depsListString ? depsListString.split(', ') : [];
    const fullArgs = [...pnpmArgs, ...depsList];
    
    return { pnpmBinaryPath, fullArgs, depsListString };
  }
  
  /**
   * 记录执行信息
   */
  static logExecutionInfo(pnpmBinaryPath, workingDir, fullArgs, depsListString) {
    const fullCommand = `pnpm ${fullArgs.join(' ')}`;
    
    logger.info(`[ElectronPnpmWorker] ========== Starting pnpm installation ==========`);
    logger.info(`[ElectronPnpmWorker] Binary path: ${pnpmBinaryPath}`);
    logger.info(`[ElectronPnpmWorker] Working dir: ${workingDir}`);
    logger.info(`[ElectronPnpmWorker] Command: ${fullCommand}`);
    logger.info(`[ElectronPnpmWorker] Dependencies: ${depsListString}`);
  }
  
  /**
   * 准备环境变量
   */
  static prepareEnvironment() {
    // 过滤掉undefined和null值（Electron requirement）
    const envVars = Object.entries(process.env).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = String(value);
      }
      return acc;
    }, {});
    
    // 设置必要的环境变量
    Object.assign(envVars, {
      NODE_ENV: 'production',
      CI: '1',
      npm_config_yes: 'true',
      npm_config_audit: 'false'
    });
    
    return envVars;
  }
  
  /**
   * 执行安装并监控进程
   */
  static executeInstallation(worker, startTime, timeout) {
    return new Promise((resolve, reject) => {
      const state = {
        isResolved: false,
        stdout: '',
        stderr: '',
        hasError: false,
        installCompleted: false
      };
      
      // 设置超时和状态监控
      const { workerTimeout, statusInterval } = this.setupTimeoutAndMonitoring(
        worker, startTime, timeout, state, reject
      );
      
      // 设置输出处理
      this.setupOutputHandlers(worker, state, startTime, workerTimeout, statusInterval, resolve);
      
      // 设置进程事件处理
      this.setupProcessEventHandlers(worker, state, startTime, workerTimeout, statusInterval, resolve, reject);
    });
  }
  
  /**
   * 设置超时和状态监控
   */
  static setupTimeoutAndMonitoring(worker, startTime, timeout, state, reject) {
    // 定期输出进程状态
    const statusInterval = setInterval(() => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      logger.debug(`[ElectronPnpmWorker] Process still running... (${elapsed}s elapsed)`);
    }, 5000);
    
    // 设置超时
    const workerTimeout = setTimeout(() => {
      if (state.isResolved) return;
      state.isResolved = true;
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      logger.error(`[ElectronPnpmWorker] Installation timeout after ${elapsed}s`);
      
      try {
        worker.kill();
      } catch (e) {
        logger.warn(`[ElectronPnpmWorker] Error killing worker: ${e.message}`);
      }
      
      clearInterval(statusInterval);
      reject(new Error(`pnpm installation timeout after ${elapsed}s`));
    }, timeout);
    
    return { workerTimeout, statusInterval };
  }
  
  /**
   * 设置输出处理器
   */
  static setupOutputHandlers(worker, state, startTime, workerTimeout, statusInterval, resolve) {
    // 处理标准输出
    worker.stdout?.on('data', (data) => {
      const output = data.toString();
      state.stdout += output;
      
      // 按行处理输出
      output.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;
        
        // 处理不同类型的输出
        this.processOutputLine(trimmedLine, state);
        
        // 检测完成信号
        if (this.isCompletionSignal(trimmedLine)) {
          this.handleCompletion(state, startTime, worker, workerTimeout, statusInterval, resolve);
        }
      });
    });
    
    // 处理标准错误
    worker.stderr?.on('data', (data) => {
      const error = data.toString();
      state.stderr += error;
      
      error.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;
        
        logger.warn(`[pnpm-stderr] ${trimmedLine}`);
        
        // 检测严重错误
        if (trimmedLine.includes('ERR!') || trimmedLine.includes('ERROR')) {
          state.hasError = true;
          logger.error(`[ElectronPnpmWorker] Detected pnpm error: ${trimmedLine}`);
        }
      });
    });
  }
  
  /**
   * 处理输出行
   */
  static processOutputLine(line, state) {
    if (line.includes('ERR!') || line.includes('error')) {
      logger.error(`[pnpm] ${line}`);
      state.hasError = true;
    } else if (line.includes('WARN')) {
      logger.warn(`[pnpm] ${line}`);
    } else if (line.includes('Progress:') || line.includes('Done')) {
      logger.info(`[pnpm] ${line}`);
    } else {
      logger.debug(`[pnpm] ${line}`);
    }
  }
  
  /**
   * 检测是否为完成信号
   */
  static isCompletionSignal(line) {
    return (line.includes('Done in') && line.includes('ms')) ||
           (line.includes('Progress:') && line.includes(', done'));
  }
  
  /**
   * 处理完成信号
   */
  static handleCompletion(state, startTime, worker, workerTimeout, statusInterval, resolve) {
    if (state.isResolved || state.hasError) return;
    
    logger.info(`[ElectronPnpmWorker] Detected pnpm completion signal`);
    state.installCompleted = true;
    
    // 延迟一秒确保收集所有输出，然后解析成功
    setTimeout(() => {
      if (!state.isResolved && !state.hasError) {
        state.isResolved = true;
        clearTimeout(workerTimeout);
        clearInterval(statusInterval);
        
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        logger.info(`[ElectronPnpmWorker] pnpm completed successfully in ${elapsed}s`);
        
        // 强制终止进程（pnpm.cjs不会自动退出）
        try {
          worker.kill();
        } catch (e) {
          logger.debug(`[ElectronPnpmWorker] Error killing worker: ${e.message}`);
        }
        
        resolve({
          stdout: state.stdout,
          stderr: state.stderr,
          elapsed: elapsed
        });
      }
    }, 1000);
  }
  
  /**
   * 设置进程事件处理器
   */
  static setupProcessEventHandlers(worker, state, startTime, workerTimeout, statusInterval, resolve, reject) {
    // 进程启动事件
    worker.on('spawn', () => {
      logger.debug(`[ElectronPnpmWorker] pnpm process spawned successfully`);
    });
    
    // close事件 - 作为备份（通常不会触发）
    worker.on('close', (code) => {
      logger.debug(`[ElectronPnpmWorker] Process close event with code ${code}`);
    });
    
    // exit事件 - 仅记录（不依赖）
    worker.on('exit', (code) => {
      logger.debug(`[ElectronPnpmWorker] Process exit event with code ${code}`);
    });
    
    // 错误事件
    worker.on('error', (error) => {
      if (state.isResolved) return;
      state.isResolved = true;
      
      clearTimeout(workerTimeout);
      clearInterval(statusInterval);
      logger.error(`[ElectronPnpmWorker] pnpm process error: ${error.message}`);
      reject(new Error(`pnpm process error: ${error.message}`));
    });
  }
}

module.exports = ElectronPnpmWorker;