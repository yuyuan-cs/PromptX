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
      const depsListString = PnpmUtils.buildDependenciesList(dependencies);
      
      // 将依赖字符串转换为参数数组
      // buildDependenciesList 返回 "pkg1@ver1, pkg2@ver2" 格式的字符串
      const depsList = depsListString ? depsListString.split(', ') : [];
      
      // 构建完整的 pnpm 命令用于日志
      const fullArgs = [...pnpmArgs, ...depsList];
      const fullCommand = `pnpm ${fullArgs.join(' ')}`;
      
      logger.info(`[ElectronPnpmWorker] ========== Starting pnpm installation ==========`);
      logger.info(`[ElectronPnpmWorker] Binary path: ${pnpmBinaryPath}`);
      logger.info(`[ElectronPnpmWorker] Working dir: ${workingDir}`);
      logger.info(`[ElectronPnpmWorker] Command: ${fullCommand}`);
      logger.info(`[ElectronPnpmWorker] Dependencies to install: ${depsListString}`);
      logger.debug(`[ElectronPnpmWorker] Args array: ${JSON.stringify(fullArgs)}`);
      
      // 构建环境变量，过滤掉 undefined 和 null 值
      // 根据 Electron 文档和 VSCode issue #254516，env 不能包含 undefined 值
      const envVars = Object.entries(process.env).reduce((acc, [key, value]) => {
        // 只包含有值的环境变量
        if (value !== undefined && value !== null) {
          // 转换为字符串，因为环境变量应该是字符串
          acc[key] = String(value);
        }
        return acc;
      }, {});
      
      // 覆盖或添加必要的环境变量
      Object.assign(envVars, {
        NODE_ENV: 'production',
        CI: '1',
        npm_config_yes: 'true',
        npm_config_audit: 'false'
      });
      
      logger.debug(`[ElectronPnpmWorker] Environment variables count: ${Object.keys(envVars).length}`);
      
      // 直接用 utilityProcess fork pnpm！
      // 注意：pnpm.cjs 是 CLI 脚本，完成后可能不会自动退出
      const worker = utilityProcess.fork(pnpmBinaryPath, fullArgs, {
        cwd: workingDir,
        stdio: 'pipe',  // 需要捕获输出
        env: envVars
      });
      
      return new Promise((resolve, reject) => {
        let workerTimeout;
        let statusInterval;
        let isResolved = false;
        
        // 定期输出进程状态（每5秒）
        statusInterval = setInterval(() => {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          logger.debug(`[ElectronPnpmWorker] Process still running... (${elapsed}s elapsed)`);
        }, 5000);
        
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
          
          clearInterval(statusInterval);
          reject(new Error(`pnpm installation timeout after ${elapsed}s`));
        }, timeout);
        
        let stdout = '';
        let stderr = '';
        let hasError = false;
        let installCompleted = false;
        
        // 监听标准输出 - 实时输出所有日志
        worker.stdout?.on('data', (data) => {
          const output = data.toString();
          stdout += output;
          
          // 实时输出所有 pnpm 日志，按行分割处理
          output.split('\n').forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine) {
              // 根据内容类型使用不同日志级别
              if (trimmedLine.includes('ERR!') || trimmedLine.includes('error')) {
                logger.error(`[pnpm] ${trimmedLine}`);
                hasError = true;
              } else if (trimmedLine.includes('WARN')) {
                logger.warn(`[pnpm] ${trimmedLine}`);
              } else if (trimmedLine.includes('Progress:') || trimmedLine.includes('Done')) {
                logger.info(`[pnpm] ${trimmedLine}`);
                
                // 检测 pnpm 完成信号 - 多种模式匹配
                // 模式1: "Done in XXXms"
                // 模式2: "Progress: resolved X, reused X, downloaded X, added X, done"
                if ((trimmedLine.includes('Done in') && trimmedLine.includes('ms')) ||
                    (trimmedLine.includes('Progress:') && trimmedLine.includes(', done'))) {
                  
                  logger.info(`[ElectronPnpmWorker] Detected pnpm completion signal: ${trimmedLine}`);
                  installCompleted = true;
                  
                  // 延迟一小段时间确保所有输出都被捕获，然后解析成功
                  if (!isResolved) {
                    setTimeout(() => {
                      if (!isResolved && !hasError) {
                        isResolved = true;
                        clearTimeout(workerTimeout);
                        clearInterval(statusInterval);
                        
                        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                        logger.info(`[ElectronPnpmWorker] pnpm completed successfully in ${elapsed}s (output detection)`);
                        
                        // 强制终止进程
                        try {
                          worker.kill();
                        } catch (e) {
                          logger.debug(`[ElectronPnpmWorker] Error killing worker: ${e.message}`);
                        }
                        
                        resolve({
                          stdout: stdout || '',
                          stderr: stderr || '',
                          elapsed: elapsed
                        });
                      }
                    }, 1000); // 等待1秒收集剩余输出
                  }
                }
              } else {
                logger.debug(`[pnpm] ${trimmedLine}`);
              }
            }
          });
        });
        
        // 监听标准错误 - 输出所有错误
        worker.stderr?.on('data', (data) => {
          const error = data.toString();
          stderr += error;
          
          // 实时输出所有错误日志
          error.split('\n').forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine) {
              logger.warn(`[pnpm-stderr] ${trimmedLine}`);
              
              // 检测 pnpm 错误
              if (trimmedLine.includes('ERR!') || trimmedLine.includes('ERROR')) {
                logger.error(`[ElectronPnpmWorker] Detected pnpm error: ${trimmedLine}`);
                if (!isResolved) {
                  isResolved = true;
                  clearTimeout(workerTimeout);
                  clearInterval(statusInterval);
                  
                  setTimeout(() => {
                    try {
                      worker.kill();
                    } catch (e) {
                      // 忽略错误
                    }
                  }, 100);
                  
                  reject(new Error(`pnpm error: ${trimmedLine}`));
                }
              }
            }
          });
        });
        
        // 监听worker进程事件
        worker.on('spawn', () => {
          logger.debug(`[ElectronPnpmWorker] pnpm process spawned successfully`);
        });
        
        // 监听 close 事件 - 在所有 stdio 流关闭后触发
        // 注意：由于 pnpm.cjs 是 CLI 脚本，这个事件可能永远不会触发
        worker.on('close', (code) => {
          logger.debug(`[ElectronPnpmWorker] Process closed with code ${code}`);
          
          // 如果还没有通过输出检测解决，这里作为备份
          if (!isResolved && installCompleted) {
            isResolved = true;
            clearTimeout(workerTimeout);
            clearInterval(statusInterval);
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            
            if (code === 0 || installCompleted) {
              logger.info(`[ElectronPnpmWorker] pnpm completed via close event after ${elapsed}s`);
              resolve({
                stdout: stdout || '',
                stderr: stderr || '',
                elapsed: elapsed
              });
            } else {
              logger.error(`[ElectronPnpmWorker] pnpm failed with code ${code}`);
              reject(new Error(`pnpm exited with code ${code}: ${stderr}`));
            }
          }
        });
        
        // 监听 exit 事件 - 通常会触发但进程可能不会真正退出
        worker.on('exit', (code) => {
          logger.debug(`[ElectronPnpmWorker] Process exit event with code ${code}`);
          // 由于 pnpm.cjs 的特殊性，exit 事件可能触发但进程仍在运行
          // 所以这里不做处理，依赖输出检测
        });
        
        worker.on('error', (error) => {
          if (isResolved) return;
          isResolved = true;
          
          clearTimeout(workerTimeout);
          clearInterval(statusInterval);
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