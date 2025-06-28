const BasePouchCommand = require('../core/pouch/BasePouchCommand')
const { getGlobalResourceManager } = require('../core/resource')
const ToolExecutor = require('../tool/ToolExecutor')
const logger = require('../utils/logger')

/**
 * PromptX Tool命令处理器
 * 实现promptx_tool MCP工具，执行通过@tool协议声明的工具
 */
class PromptXToolCommand extends BasePouchCommand {
  constructor() {
    super()
    this.toolExecutor = new ToolExecutor()
    this.resourceManager = null
  }

  /**
   * 获取或初始化ResourceManager
   */
  async getResourceManager() {
    if (!this.resourceManager) {
      this.resourceManager = getGlobalResourceManager()
      // 确保ResourceManager已初始化
      if (!this.resourceManager.initialized) {
        await this.resourceManager.initializeWithNewArchitecture()
      }
    }
    return this.resourceManager
  }

  // BasePouchCommand的抽象方法实现
  getPurpose() {
    return '执行通过@tool协议声明的JavaScript工具'
  }

  async getContent(args) {
    try {
      // 处理参数：如果是数组，取第一个元素；否则直接使用
      const toolArgs = Array.isArray(args) ? args[0] : args
      
      // 执行工具调用
      const result = await this.executeToolInternal(toolArgs)
      
      // 格式化响应
      if (result.success) {
        return `🔧 Tool执行成功

📋 工具资源: ${result.tool_resource}
📊 执行结果:
${JSON.stringify(result.result, null, 2)}

⏱️ 性能指标:
- 执行时间: ${result.metadata.execution_time_ms}ms
- 时间戳: ${result.metadata.timestamp}
- 版本: ${result.metadata.version}`
      } else {
        return `❌ Tool执行失败

📋 工具资源: ${result.tool_resource}
❌ 错误信息: ${result.error.message}
🏷️ 错误类型: ${result.error.type}
🔢 错误代码: ${result.error.code}

⏱️ 执行时间: ${result.metadata.execution_time_ms}ms`
      }
    } catch (error) {
      return `❌ Tool执行异常

错误详情: ${error.message}

💡 请检查:
1. 工具资源引用格式是否正确 (@tool://tool-name)
2. 工具参数是否有效
3. 工具文件是否存在并可执行`
    }
  }

  getPATEOAS(args) {
    return {
      currentState: 'tool_executed',
      nextActions: [
        {
          action: 'execute_another_tool',
          description: '执行其他工具',
          method: 'promptx tool'
        },
        {
          action: 'view_available_tools', 
          description: '查看可用工具',
          method: 'promptx welcome'
        }
      ]
    }
  }

  /**
   * 内部工具执行方法
   * @param {Object} args - 命令参数
   * @param {string} args.tool_resource - 工具资源引用，格式：@tool://tool-name
   * @param {Object} args.parameters - 传递给工具的参数
   * @param {Object} args.context - 执行上下文信息（可选）
   * @returns {Promise<Object>} 执行结果
   */
  async executeToolInternal(args) {
    const startTime = Date.now()
    
    try {
      // 1. 参数验证
      this.validateArguments(args)
      
      const { tool_resource, parameters, context = {} } = args
      
      logger.debug(`[PromptXTool] 开始执行工具: ${tool_resource}`)
      
      // 2. 通过ResourceManager解析工具资源
      const resourceManager = await this.getResourceManager()
      const toolInfo = await resourceManager.loadResource(tool_resource)
      
      // 3. 准备工具执行上下文
      const executionContext = {
        ...context,
        tool_resource,
        timestamp: new Date().toISOString(),
        execution_id: this.generateExecutionId()
      }
      
      // 4. 使用ToolExecutor执行工具
      const result = await this.toolExecutor.execute(
        toolInfo.content, 
        parameters, 
        executionContext
      )
      
      // 5. 格式化成功结果
      return this.formatSuccessResult(result, tool_resource, startTime)
      
    } catch (error) {
      // 6. 格式化错误结果
      logger.error(`[PromptXTool] 工具执行失败: ${error.message}`, error)
      return this.formatErrorResult(error, args.tool_resource, startTime)
    }
  }

  /**
   * 验证命令参数
   * @param {Object} args - 命令参数
   */
  validateArguments(args) {
    if (!args) {
      throw new Error('Missing arguments')
    }

    if (!args.tool_resource) {
      throw new Error('Missing required parameter: tool_resource')
    }

    if (!args.tool_resource.startsWith('@tool://')) {
      throw new Error('Invalid tool_resource format. Must start with @tool://')
    }

    if (!args.parameters || typeof args.parameters !== 'object') {
      throw new Error('Missing or invalid parameters. Must be an object')
    }
  }

  /**
   * 格式化成功结果
   * @param {*} result - 工具执行结果
   * @param {string} toolResource - 工具资源引用
   * @param {number} startTime - 开始时间
   * @returns {Object} 格式化的成功结果
   */
  formatSuccessResult(result, toolResource, startTime) {
    const duration = Date.now() - startTime
    
    return {
      success: true,
      tool_resource: toolResource,
      result: result,
      metadata: {
        execution_time_ms: duration,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    }
  }

  /**
   * 格式化错误结果
   * @param {Error} error - 错误对象
   * @param {string} toolResource - 工具资源引用（可能为空）
   * @param {number} startTime - 开始时间
   * @returns {Object} 格式化的错误结果
   */
  formatErrorResult(error, toolResource, startTime) {
    const duration = Date.now() - startTime
    
    return {
      success: false,
      tool_resource: toolResource || 'unknown',
      error: {
        type: error.constructor.name,
        message: error.message,
        code: this.getErrorCode(error)
      },
      metadata: {
        execution_time_ms: duration,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    }
  }

  /**
   * 根据错误类型获取错误代码
   * @param {Error} error - 错误对象
   * @returns {string} 错误代码
   */
  getErrorCode(error) {
    if (error.message.includes('not found')) {
      return 'TOOL_NOT_FOUND'
    }
    if (error.message.includes('Invalid tool_resource format')) {
      return 'INVALID_TOOL_RESOURCE'
    }
    if (error.message.includes('Missing')) {
      return 'MISSING_PARAMETER'
    }
    if (error.message.includes('syntax')) {
      return 'TOOL_SYNTAX_ERROR'
    }
    if (error.message.includes('timeout')) {
      return 'EXECUTION_TIMEOUT'
    }
    return 'UNKNOWN_ERROR'
  }

  /**
   * 生成执行ID
   * @returns {string} 唯一的执行ID
   */
  generateExecutionId() {
    return `tool_exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取工具命令的元信息
   * @returns {Object} 命令元信息
   */
  getMetadata() {
    return {
      name: 'promptx_tool',
      description: '执行通过@tool协议声明的工具',
      version: '1.0.0',
      author: 'PromptX Framework',
      supports: {
        protocols: ['@tool://'],
        formats: ['.tool.js'],
        features: [
          'JavaScript工具执行',
          '参数验证',
          '错误处理',
          '执行监控',
          '上下文传递'
        ]
      }
    }
  }
}

module.exports = PromptXToolCommand