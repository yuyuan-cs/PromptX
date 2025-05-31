/**
 * Jest测试环境设置
 */

// 设置测试超时时间
jest.setTimeout(30000);

// 全局变量设置
global.TEST_ENV = 'test';

// 模拟console.log以减少测试输出噪音
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// 在测试环境中静默一些不必要的日志
if (process.env.NODE_ENV === 'test') {
  console.log = (...args) => {
    // 只有在明确需要时才输出
    if (args.some(arg => typeof arg === 'string' && arg.includes('TEST_OUTPUT'))) {
      originalConsoleLog(...args);
    }
  };
  
  console.warn = (...args) => {
    // 保留警告信息
    if (args.some(arg => typeof arg === 'string' && arg.includes('TEST_WARN'))) {
      originalConsoleWarn(...args);
    }
  };
  
  console.error = (...args) => {
    // 保留错误信息
    originalConsoleError(...args);
  };
}

// 测试结束后恢复console
afterAll(() => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

// 全局测试工具函数
global.testUtils = {
  /**
   * 等待一段时间
   * @param {number} ms - 毫秒数
   */
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * 创建延迟Promise
   * @param {any} value - 返回值
   * @param {number} delay - 延迟时间
   */
  delayed: (value, delay = 100) => 
    new Promise(resolve => setTimeout(() => resolve(value), delay)),
  
  /**
   * 创建拒绝的Promise
   * @param {any} error - 错误对象
   * @param {number} delay - 延迟时间
   */
  delayedReject: (error, delay = 100) =>
    new Promise((_, reject) => setTimeout(() => reject(error), delay))
};

// 全局断言扩展
expect.extend({
  /**
   * 检查是否为有效的DPML资源引用
   */
  toBeValidDpmlReference(received) {
    const dpmlPattern = /^@[!?]?[a-zA-Z][a-zA-Z0-9_-]*:\/\/.+/;
    const pass = typeof received === 'string' && dpmlPattern.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid DPML reference`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid DPML reference`,
        pass: false
      };
    }
  },
  
  /**
   * 检查对象是否包含必需的属性
   */
  toHaveRequiredProperties(received, properties) {
    const missingProps = properties.filter(prop => !(prop in received));
    const pass = missingProps.length === 0;
    
    if (pass) {
      return {
        message: () => `expected object not to have properties ${properties.join(', ')}`,
        pass: true
      };
    } else {
      return {
        message: () => `expected object to have properties ${missingProps.join(', ')}`,
        pass: false
      };
    }
  }
});

// 处理未捕获的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

console.log('🧪 Jest测试环境已初始化'); 