/**
 * PromptX Tool Framework
 * 统一的工具框架入口文件
 */

const ToolExecutor = require('./ToolExecutor');
const ToolValidator = require('./ToolValidator');
const ToolUtils = require('./ToolUtils');
const { TOOL_INTERFACE, TOOL_ERROR_CODES, TOOL_RESULT_FORMAT, EXAMPLE_TOOL } = require('./ToolInterface');

// 创建全局工具实例
let globalExecutor = null;

/**
 * 获取全局工具执行器
 * @param {Object} options - 配置选项
 * @returns {ToolExecutor} 工具执行器实例
 */
function getGlobalToolExecutor(options = {}) {
  if (!globalExecutor) {
    globalExecutor = new ToolExecutor(options);
  }
  return globalExecutor;
}

/**
 * 初始化工具框架
 * @param {Object} options - 配置选项
 * @returns {Object} 初始化结果
 */
function initialize(options = {}) {
  try {
    const executor = getGlobalToolExecutor(options.executor);
    
    return {
      success: true,
      message: '工具框架初始化成功',
      executor: {
        maxConcurrency: executor.options.maxConcurrency,
        timeout: executor.options.timeout
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `工具框架初始化失败: ${error.message}`,
      error: error
    };
  }
}

/**
 * 执行工具的便捷方法
 * @param {string} toolContent - 工具JavaScript代码内容
 * @param {Object} parameters - 工具参数
 * @param {Object} context - 执行上下文
 * @returns {Promise<Object>} 执行结果
 */
async function executeTool(toolContent, parameters = {}, context = {}) {
  const executor = getGlobalToolExecutor();
  return await executor.execute(toolContent, parameters, context);
}

/**
 * 重置工具框架
 */
function reset() {
  if (globalExecutor) {
    globalExecutor.cleanup();
    globalExecutor = null;
  }
}

/**
 * 获取工具框架统计信息
 * @returns {Object} 统计信息
 */
function getStats() {
  const executorStats = globalExecutor ? globalExecutor.getStats() : {};
  
  return {
    executor: executorStats,
    framework: {
      initialized: !!globalExecutor,
      version: '1.0.0'
    }
  };
}

module.exports = {
  // 核心类
  ToolExecutor,
  ToolValidator,
  ToolUtils,
  
  // 接口规范
  TOOL_INTERFACE,
  TOOL_ERROR_CODES,
  TOOL_RESULT_FORMAT,
  EXAMPLE_TOOL,
  
  // 全局实例获取器
  getGlobalToolExecutor,
  
  // 便捷方法
  initialize,
  executeTool,
  reset,
  getStats
};