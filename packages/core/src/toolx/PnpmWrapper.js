/**
 * PnpmWrapper - pnpm CLI 执行包装器
 * 
 * 解决 utilityProcess.fork 执行 pnpm.cjs 后进程不退出的问题
 * 通过包装 pnpm 执行并主动调用 process.exit() 确保进程正常结束
 */

const { spawn } = require('child_process');
const path = require('path');

class PnpmWrapper {
  /**
   * 执行 pnpm 命令的包装方法
   * 这个方法会被 utilityProcess.fork 调用
   */
  static async execute() {
    try {
      // 从环境变量获取参数
      const args = process.argv.slice(2);
      
      // 获取 pnpm.cjs 路径
      // 在 asar 包中需要使用不同的方式获取路径
      const pnpmModulePath = require.resolve('pnpm');
      const pnpmPath = path.join(path.dirname(pnpmModulePath), 'bin', 'pnpm.cjs');
      
      console.log('[PnpmWrapper] Starting pnpm with args:', args);
      
      // 使用 spawn 执行 pnpm
      const pnpm = spawn(process.execPath, [pnpmPath, ...args], {
        stdio: 'inherit',  // 继承父进程的 stdio
        env: process.env
      });
      
      // 等待 pnpm 完成
      await new Promise((resolve, reject) => {
        pnpm.on('exit', (code) => {
          console.log(`[PnpmWrapper] pnpm exited with code ${code}`);
          if (code === 0) {
            resolve(code);
          } else {
            reject(new Error(`pnpm exited with code ${code}`));
          }
        });
        
        pnpm.on('error', (error) => {
          console.error('[PnpmWrapper] pnpm error:', error);
          reject(error);
        });
      });
      
      console.log('[PnpmWrapper] pnpm completed successfully');
      process.exit(0);  // 主动退出
      
    } catch (error) {
      console.error('[PnpmWrapper] Failed to execute pnpm:', error);
      process.exit(1);
    }
  }
}

// 如果作为主模块运行（被 fork 调用）
if (require.main === module) {
  PnpmWrapper.execute();
}

module.exports = PnpmWrapper;