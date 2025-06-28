const ToolValidator = require('./ToolValidator');
const { TOOL_ERROR_CODES } = require('./ToolInterface');

/**
 * ToolExecutor 工具执行器
 * 负责工具的加载、验证、执行和结果处理
 */
class ToolExecutor {
  constructor(options = {}) {
    this.options = {
      timeout: 30000,  // 默认30秒超时
      maxConcurrency: 10,  // 最大并发数
      enableCache: true,   // 启用工具缓存
      ...options
    };
    
    this.toolCache = new Map();  // 工具实例缓存
    this.runningTasks = new Set();  // 正在执行的任务
  }

  /**
   * 执行工具（从代码内容）
   * @param {string} toolContent - 工具JavaScript代码内容
   * @param {Object} parameters - 工具参数  
   * @param {Object} context - 执行上下文
   * @returns {Promise<Object>} 执行结果
   */
  async execute(toolContent, parameters = {}, context = {}) {
    const executionId = this.generateExecutionId();
    const startTime = Date.now();

    try {
      // 1. 并发控制
      if (this.runningTasks.size >= this.options.maxConcurrency) {
        throw new Error(`超出最大并发限制: ${this.options.maxConcurrency}`);
      }

      this.runningTasks.add(executionId);

      // 2. 执行工具代码并创建实例
      const tool = this.executeToolContent(toolContent, context.toolName || 'unknown');

      // 3. 参数验证
      const validation = this.validateParameters(tool, parameters);
      if (!validation.valid) {
        return this.formatError(TOOL_ERROR_CODES.VALIDATION_ERROR, '参数验证失败', {
          errors: validation.errors,
          parameters: parameters
        });
      }

      // 4. 执行工具（带超时控制）
      const result = await this.executeWithTimeout(tool, parameters);
      const executionTime = Date.now() - startTime;

      // 5. 格式化成功结果
      return this.formatSuccess(result, {
        executionId,
        executionTime: `${executionTime}ms`,
        tool: tool.getMetadata ? tool.getMetadata() : { name: context.toolName || 'unknown' }
      });

    } catch (error) {
      const executionTime = Date.now() - startTime;
      return this.formatError(
        this.getErrorCode(error),
        error.message,
        {
          executionId,
          executionTime: `${executionTime}ms`,
          stack: error.stack
        }
      );
    } finally {
      this.runningTasks.delete(executionId);
    }
  }


  /**
   * 执行工具内容并返回实例
   * @param {string} toolContent - 工具代码内容
   * @param {string} toolName - 工具名称
   * @returns {Object} 工具实例
   */
  executeToolContent(toolContent, toolName) {
    try {
      // 创建安全的执行环境
      const sandbox = this.createSandbox();
      
      // 执行工具代码
      const vm = require('vm');
      const script = new vm.Script(toolContent, { filename: `${toolName}.js` });
      const context = vm.createContext(sandbox);
      
      script.runInContext(context);
      
      // 获取导出的工具
      const exported = context.module.exports;
      
      if (!exported) {
        throw new Error(`工具未正确导出: ${toolName}`);
      }
      
      // 支持两种导出方式：
      // 1. 导出类（构造函数）- 需要实例化
      // 2. 导出对象 - 直接使用
      let toolInstance;
      
      if (typeof exported === 'function') {
        // 导出的是类，需要实例化
        toolInstance = new exported();
      } else if (typeof exported === 'object') {
        // 导出的是对象，直接使用
        toolInstance = exported;
      } else {
        throw new Error(`工具导出格式不正确，必须是类或对象: ${toolName}`);
      }
      
      return toolInstance;
      
    } catch (error) {
      throw new Error(`工具代码执行失败 ${toolName}: ${error.message}`);
    }
  }

  /**
   * 创建安全的执行沙箱
   * @returns {Object} 沙箱环境
   */
  createSandbox() {
    return {
      require: require,
      module: { exports: {} },
      exports: {},
      console: console,
      Buffer: Buffer,
      process: {
        env: process.env,
        hrtime: process.hrtime
      },
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      setInterval: setInterval,
      clearInterval: clearInterval,
      // 基础全局对象
      Object: Object,
      Array: Array,
      String: String,
      Number: Number,
      Boolean: Boolean,
      Date: Date,
      JSON: JSON,
      Math: Math,
      RegExp: RegExp,
      Error: Error
    };
  }


  /**
   * 带超时的工具执行
   * @param {BaseTool} tool - 工具实例
   * @param {Object} parameters - 参数
   * @returns {Promise<*>} 执行结果
   */
  async executeWithTimeout(tool, parameters) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`工具执行超时: ${this.options.timeout}ms`));
      }, this.options.timeout);

      tool.execute(parameters)
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * 生成执行ID
   * @returns {string} 唯一执行ID
   */
  generateExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 参数验证
   * @param {Object} tool - 工具实例
   * @param {Object} parameters - 参数
   * @returns {Object} 验证结果
   */
  validateParameters(tool, parameters) {
    // 如果工具有自定义validate方法，使用它
    if (typeof tool.validate === 'function') {
      const result = tool.validate(parameters);
      
      // 支持两种返回格式：
      // 1. boolean - 转换为标准格式
      // 2. {valid: boolean, errors?: array} - 标准格式
      if (typeof result === 'boolean') {
        return { valid: result, errors: result ? [] : ['Validation failed'] };
      } else if (result && typeof result === 'object') {
        return result;
      } else {
        return { valid: false, errors: ['Invalid validation result'] };
      }
    }
    
    // 否则使用默认验证
    return ToolValidator.defaultValidate(tool, parameters);
  }

  /**
   * 为工具增强默认实现
   * @param {Object} tool - 工具实例
   */
  enhanceToolWithDefaults(tool) {
    // 如果没有validate方法，提供默认实现
    if (!tool.validate) {
      tool.validate = (parameters) => ToolValidator.defaultValidate(tool, parameters);
    }

    // 如果没有cleanup方法，提供空实现
    if (!tool.cleanup) {
      tool.cleanup = () => {};
    }

    // 如果没有init方法，提供空实现
    if (!tool.init) {
      tool.init = () => {};
    }
  }

  /**
   * 获取错误代码
   * @param {Error} error - 错误对象
   * @returns {string} 错误代码
   */
  getErrorCode(error) {
    if (error.message.includes('超时')) return TOOL_ERROR_CODES.TIMEOUT_ERROR;
    if (error.message.includes('不存在')) return 'TOOL_NOT_FOUND';
    if (error.message.includes('验证失败')) return TOOL_ERROR_CODES.VALIDATION_ERROR;
    if (error.message.includes('并发限制')) return 'CONCURRENCY_ERROR';
    if (error.message.includes('接口不符合规范')) return 'INTERFACE_ERROR';
    return TOOL_ERROR_CODES.EXECUTION_ERROR;
  }

  /**
   * 格式化成功结果
   * @param {*} data - 结果数据
   * @param {Object} metadata - 元信息
   * @returns {Object} 标准化结果
   */
  formatSuccess(data, metadata = {}) {
    return {
      success: true,
      data: data,
      metadata: {
        executor: 'ToolExecutor',
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
  }

  /**
   * 格式化错误结果  
   * @param {string} code - 错误代码
   * @param {string} message - 错误消息
   * @param {Object} details - 错误详情
   * @returns {Object} 标准化错误
   */
  formatError(code, message, details = {}) {
    return {
      success: false,
      error: {
        code: code,
        message: message,
        details: details
      },
      metadata: {
        executor: 'ToolExecutor',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * 获取执行统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      runningTasks: this.runningTasks.size,
      cachedTools: this.toolCache.size,
      maxConcurrency: this.options.maxConcurrency,
      timeout: this.options.timeout
    };
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.toolCache.clear();
    this.runningTasks.clear();
  }
}

module.exports = ToolExecutor;