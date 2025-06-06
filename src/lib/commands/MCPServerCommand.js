const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { cli } = require('../core/pouch');
const { MCPOutputAdapter } = require('../adapters/MCPOutputAdapter');
const { getExecutionContext, getDebugInfo } = require('../utils/executionContext');

/**
 * MCP Server 适配器 - 函数调用架构
 * 将MCP协议请求转换为PromptX函数调用，实现零开销适配
 * 支持智能工作目录检测，确保MCP和CLI模式下的一致性
 */
class MCPServerCommand {
  constructor() {
    this.name = 'promptx-mcp-server';
    this.version = '1.0.0';
    this.debug = process.env.MCP_DEBUG === 'true';
    
    // 智能检测执行上下文
    this.executionContext = getExecutionContext();
    
    // 调试信息输出
    this.log(`🎯 检测到执行模式: ${this.executionContext.mode}`);
    this.log(`📍 原始工作目录: ${this.executionContext.originalCwd}`);
    this.log(`📁 目标工作目录: ${this.executionContext.workingDirectory}`);
    
    // 如果需要切换工作目录
    if (this.executionContext.workingDirectory !== this.executionContext.originalCwd) {
      this.log(`🔄 切换工作目录: ${this.executionContext.originalCwd} -> ${this.executionContext.workingDirectory}`);
      try {
        process.chdir(this.executionContext.workingDirectory);
        this.log(`✅ 工作目录切换成功`);
      } catch (error) {
        this.log(`❌ 工作目录切换失败: ${error.message}`);
        this.log(`🔄 继续使用原始目录: ${this.executionContext.originalCwd}`);
      }
    }
    
    this.log(`📂 最终工作目录: ${process.cwd()}`);
    this.log(`📋 预期记忆文件路径: ${require('path').join(process.cwd(), '.promptx/memory/declarative.md')}`);
    
    // 输出完整调试信息
    if (this.debug) {
      this.log(`🔍 完整调试信息: ${JSON.stringify(getDebugInfo(), null, 2)}`);
    }
    
    // 创建输出适配器
    this.outputAdapter = new MCPOutputAdapter();
    
    // 创建MCP服务器实例 - 使用正确的API
    this.server = new Server(
      {
        name: this.name,
        version: this.version
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );
    
    this.setupHandlers();
  }
  
  /**
   * 调试日志 - 输出到stderr，不影响MCP协议
   */
  log(message) {
    if (this.debug) {
      console.error(`[MCP DEBUG] ${message}`);
    }
  }
  
  /**
   * 启动MCP Server
   */
  async execute() {
    try {
      this.log('🚀 启动MCP Server...');
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      this.log('✅ MCP Server 已启动，等待连接...');
      
      // 保持进程运行
      return new Promise((resolve) => {
        // MCP服务器现在正在运行，监听stdin输入
        process.on('SIGINT', () => {
          this.log('🛑 收到终止信号，关闭MCP Server');
          resolve();
        });
        
        process.on('SIGTERM', () => {
          this.log('🛑 收到终止信号，关闭MCP Server');
          resolve();
        });
      });
    } catch (error) {
      // 输出到stderr
      console.error(`❌ MCP Server 启动失败: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * 设置MCP工具处理程序 - 使用正确的MCP SDK API
   */
  setupHandlers() {
    // 使用Schema常量进行注册
    const { 
      ListToolsRequestSchema, 
      CallToolRequestSchema 
    } = require('@modelcontextprotocol/sdk/types.js');
    
    // 注册工具列表处理程序
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.log('📋 收到工具列表请求');
      return {
        tools: this.getToolDefinitions()
      };
    });
    
    // 注册工具调用处理程序
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      this.log(`🔧 调用工具: ${name} 参数: ${JSON.stringify(args)}`);
      return await this.callTool(name, args || {});
    });
  }
  
  /**
   * 获取工具定义
   */
  getToolDefinitions() {
    return [
      {
        name: 'promptx_init',
        description: '🏗️ [流程启动锦囊] 启动PromptX专业能力增强流程，创建工作环境标识，自动引导到角色发现阶段',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'promptx_hello',
        description: '👋 [角色发现锦囊] 让AI浏览专业角色库（产品经理、Java开发者、设计师等），当需要专业能力时使用，引导角色激活',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'promptx_action',
        description: '⚡ [专家变身锦囊] 让AI获得指定专业角色的思维模式和核心能力，即时变身领域专家，开始提供专业服务',
        inputSchema: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
              description: '要激活的角色ID，如：copywriter, product-manager, java-backend-developer'
            }
          },
          required: ['role']
        }
      },
      {
        name: 'promptx_learn',
        description: '📚 [专业深化锦囊] 让AI学习特定领域的思维模式和执行模式（如敏捷开发、产品设计），强化当前专家角色能力',
        inputSchema: {
          type: 'object',
          properties: {
            resource: {
              type: 'string',
              description: '资源URL，支持格式：thought://creativity, execution://best-practice, knowledge://scrum'
            }
          },
          required: ['resource']
        }
      },
      {
        name: 'promptx_recall',
        description: '🔍 [经验检索锦囊] 让AI从专业记忆库中检索相关经验和最佳实践，当需要基于历史经验工作时使用',
        inputSchema: {
          type: 'object',
          properties: {
            random_string: {
              type: 'string',
              description: 'Dummy parameter for no-parameter tools'
            },
            query: {
              type: 'string',
              description: '检索关键词或描述，可选参数，不提供则返回所有记忆'
            }
          },
          required: ['random_string']
        }
      },
      {
        name: 'promptx_remember',
        description: '💾 [知识积累锦囊] 让AI将重要经验和专业知识保存到记忆库，构建可复用的专业知识体系，供未来检索应用',
        inputSchema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: '要保存的重要信息或经验'
            },
            tags: {
              type: 'string',
              description: '自定义标签，用空格分隔，可选'
            }
          },
          required: ['content']
        }
      }
    ];
  }
  
  /**
   * 执行工具调用
   */
  async callTool(toolName, args) {
    try {
      // 将MCP参数转换为CLI函数调用参数
      const cliArgs = this.convertMCPToCliParams(toolName, args);
      this.log(`🎯 CLI调用: ${toolName} -> ${JSON.stringify(cliArgs)}`);
      this.log(`🗂️ 当前工作目录: ${process.cwd()}`);
      
      // 直接调用PromptX CLI函数 - 启用静默模式避免console.log干扰MCP协议
      const result = await cli.execute(toolName.replace('promptx_', ''), cliArgs, true);
      this.log(`✅ CLI执行完成: ${toolName}`);
      
      // 使用输出适配器转换为MCP响应格式
      return this.outputAdapter.convertToMCPFormat(result);
      
    } catch (error) {
      this.log(`❌ 工具调用失败: ${toolName} - ${error.message}`);
      return this.outputAdapter.handleError(error);
    }
  }
  
  /**
   * 转换MCP参数为CLI函数调用参数
   */
  convertMCPToCliParams(toolName, mcpArgs) {
    const paramMapping = {
      'promptx_init': () => [],
      
      'promptx_hello': () => [],
      
      'promptx_action': (args) => [args.role],
      
      'promptx_learn': (args) => args.resource ? [args.resource] : [],
      
      'promptx_recall': (args) => {
        // 忽略random_string dummy参数，只处理query
        // 处理各种空值情况：undefined、null、空对象、空字符串
        if (!args || !args.query || typeof args.query !== 'string' || args.query.trim() === '') {
          return [];
        }
        return [args.query];
      },
      
      'promptx_remember': (args) => {
        const result = [args.content];
        if (args.tags) {
          result.push('--tags', args.tags);
        }
        return result;
      }
    };
    
    const mapper = paramMapping[toolName];
    if (!mapper) {
      throw new Error(`未知工具: ${toolName}`);
    }
    
    return mapper(mcpArgs);
  }
}

module.exports = { MCPServerCommand }; 