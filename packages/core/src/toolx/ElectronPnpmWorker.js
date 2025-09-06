/**
 * ElectronPnpmWorker - Electron环境下的pnpm安装器
 * 
 * 使用utilityProcess创建隔离的Node.js进程执行pnpm安装
 * 完全避免Electron主进程的副作用（如自动更新检查）
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
      // 获取utilityProcess - 从主进程传递的global对象中获取
      if (!process.versions.electron) {
        throw new Error('Not running in Electron environment');
      }
      
      // 检查主进程是否已配置utilityProcess
      if (process.env.PROMPTX_UTILITY_PROCESS_AVAILABLE !== 'true') {
        throw new Error('UtilityProcess not available from main process');
      }
      
      // 从global对象获取主进程传递的utilityProcess
      const utilityProcess = global.PROMPTX_UTILITY_PROCESS;
      
      if (!utilityProcess) {
        throw new Error('UtilityProcess not found in global.PROMPTX_UTILITY_PROCESS');
      }
      
      logger.debug(`[ElectronPnpmWorker] utilityProcess obtained successfully`);
      
      if (typeof utilityProcess.fork !== 'function') {
        throw new Error('utilityProcess.fork is not a function - Electron version may be too old (need >= 22.0.0)');
      }
      
      logger.debug(`[ElectronPnpmWorker] utilityProcess.fork is available`);
      
      // 获取 pnpm 路径和参数
      const pnpmBinaryPath = PnpmUtils.getPnpmBinaryPath();
      const pnpmArgs = PnpmUtils.getOptimizedPnpmArgs();
      const depsList = PnpmUtils.buildDependenciesList(dependencies);
      
      logger.debug(`[ElectronPnpmWorker] Running pnpm directly: ${pnpmBinaryPath}`);
      logger.debug(`[ElectronPnpmWorker] Working directory: ${workingDir}`);
      logger.debug(`[ElectronPnpmWorker] Dependencies: [${depsList}]`);
      
      // 直接用 utilityProcess fork pnpm！
      // utilityProcess.fork(modulePath, args, options)
      const worker = utilityProcess.fork(pnpmBinaryPath, pnpmArgs, {
        cwd: workingDir,
        stdio: 'pipe',  // 需要捕获输出
        env: {
          // 保留必要的系统环境变量
          PATH: process.env.PATH,
          HOME: process.env.HOME,
          USER: process.env.USER,
          USERPROFILE: process.env.USERPROFILE,
          APPDATA: process.env.APPDATA,
          LOCALAPPDATA: process.env.LOCALAPPDATA,
          
          // 设置Node.js和pnpm相关环境
          NODE_ENV: 'production',
          CI: '1',
          
          // 设置pnpm配置
          PNPM_HOME: process.env.PNPM_HOME,
          
          // 确保非交互模式
          npm_config_yes: 'true',
          npm_config_audit: 'false'
        }
      });
      
      return new Promise((resolve, reject) => {
        let workerTimeout;
        let isResolved = false;
        
        // 设置超时
        workerTimeout = setTimeout(() => {
          if (isResolved) return;
          isResolved = true;
          
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          logger.error(`[ElectronPnpmWorker] Installation timeout after ${elapsed}s`);
          
          try {
            worker.kill();
          } catch (killError) {
            logger.warn(`[ElectronPnpmWorker] Error killing worker: ${killError.message}`);
          }
          
          reject(new Error(`pnpm installation timeout after ${elapsed}s`));
        }, timeout);
        
        let stdout = '';
        let stderr = '';
        
        // 监听标准输出
        worker.stdout?.on('data', (data) => {
          const output = data.toString();
          stdout += output;
          // 只记录重要输出
          if (output.includes('Progress:') || output.includes('Done') || output.includes('error')) {
            logger.debug(`[ElectronPnpmWorker] stdout: ${output.trim()}`);
          }
        });
        
        // 监听标准错误
        worker.stderr?.on('data', (data) => {
          const error = data.toString();
          stderr += error;
          logger.debug(`[ElectronPnpmWorker] stderr: ${error.trim()}`);
        });
        
        // 监听worker进程事件
        worker.on('spawn', () => {
          logger.debug(`[ElectronPnpmWorker] pnpm process spawned successfully`);
        });
        
        worker.on('exit', (code) => {
          if (isResolved) return;
          isResolved = true;
          
          clearTimeout(workerTimeout);
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          
          if (code === 0) {
            // pnpm 成功完成
            logger.info(`[ElectronPnpmWorker] pnpm completed successfully in ${elapsed}s`);
            resolve({
              stdout: stdout || '',
              stderr: stderr || '',
              elapsed: elapsed
            });
          } else {
            // pnpm 失败
            logger.error(`[ElectronPnpmWorker] pnpm exited with code ${code} after ${elapsed}s`);
            reject(new Error(`pnpm exited with code ${code}: ${stderr}`));
          }
        });
        
        worker.on('error', (error) => {
          if (isResolved) return;
          isResolved = true;
          
          clearTimeout(workerTimeout);
          logger.error(`[ElectronPnpmWorker] pnpm process error: ${error.message}`);
          reject(new Error(`pnpm process error: ${error.message}`));
        });
      });
      
    } catch (error) {
      logger.error(`[ElectronPnpmWorker] Failed to create utilityProcess: ${error.message}`);
      throw new Error(`Failed to create pnpm worker: ${error.message}`);
    }
  }
}

module.exports = ElectronPnpmWorker;