const express = require('express');
const { randomUUID } = require('node:crypto');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const { isInitializeRequest } = require('@modelcontextprotocol/sdk/types.js');
const { cli } = require('../core/pouch');
const { MCPOutputAdapter } = require('../adapters/MCPOutputAdapter');
const logger = require('../utils/logger');

/**
 * MCP Streamable HTTP Server Command
 * 实现基于 Streamable HTTP 传输的 MCP 服务器
 * 同时提供 SSE 向后兼容支持
 */
class MCPStreamableHttpCommand {
  constructor() {
    this.name = 'promptx-mcp-streamable-http-server';
    this.version = '1.0.0';
    this.transport = 'http';
    this.port = 3000;
    this.host = 'localhost';
    this.transports = {}; // 存储会话传输
    this.outputAdapter = new MCPOutputAdapter();
    this.debug = process.env.MCP_DEBUG === 'true';
  }

  /**
   * 执行命令
   */
  async execute(options = {}) {
    const { 
      transport = 'http', 
      port = 3000, 
      host = 'localhost' 
    } = options;

    // 验证传输类型
    if (!['http', 'sse'].includes(transport)) {
      throw new Error(`Unsupported transport: ${transport}`);
    }

    // 验证配置
    this.validatePort(port);
    this.validateHost(host);

    if (transport === 'http') {
      return this.startStreamableHttpServer(port, host);
    } else if (transport === 'sse') {
      return this.startSSEServer(port, host);
    }
  }

  /**
   * 启动 Streamable HTTP 服务器
   */
  async startStreamableHttpServer(port, host) {
    this.log(`🚀 启动 Streamable HTTP MCP Server...`);
    
    const app = express();
    
    // 中间件设置
    app.use(express.json());
    app.use(this.corsMiddleware.bind(this));

    // 健康检查端点
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        name: this.name, 
        version: this.version, 
        transport: 'http' 
      });
    });

    // MCP 端点
    app.post('/mcp', this.handleMCPPostRequest.bind(this));
    app.get('/mcp', this.handleMCPGetRequest.bind(this));
    app.delete('/mcp', this.handleMCPDeleteRequest.bind(this));

    // 错误处理中间件
    app.use(this.errorHandler.bind(this));

    return new Promise((resolve, reject) => {
      const server = app.listen(port, host, () => {
        this.log(`✅ Streamable HTTP MCP Server 运行在 http://${host}:${port}`);
        this.server = server;
        resolve(server);
      });

      server.on('error', reject);
    });
  }

  /**
   * CORS 中间件
   */
  corsMiddleware(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, mcp-session-id');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    
    next();
  }

  /**
   * 错误处理中间件
   */
  errorHandler(error, req, res, next) {
    this.log('Express 错误处理:', error);
    
    if (!res.headersSent) {
      // 检查是否是JSON解析错误
      if (error.type === 'entity.parse.failed' || error.message?.includes('JSON')) {
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32700,
            message: 'Parse error: Invalid JSON'
          },
          id: null
        });
      } else {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error'
          },
          id: null
        });
      }
    }
  }

  /**
   * 启动 SSE 服务器
   */
  async startSSEServer(port, host) {
    const app = express();
    app.use(express.json());

    this.log(`🚀 启动 SSE MCP Server...`);
    
    // 健康检查端点
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', name: this.name, version: this.version, transport: 'sse' });
    });

    // SSE 端点 - 建立事件流
    app.get('/mcp', async (req, res) => {
      await this.handleSSEConnection(req, res);
    });

    // 消息端点 - 接收客户端 JSON-RPC 消息
    app.post('/messages', async (req, res) => {
      await this.handleSSEMessage(req, res);
    });

    return new Promise((resolve, reject) => {
      const server = app.listen(port, host, () => {
        this.log(`✅ SSE MCP Server 运行在 http://${host}:${port}`);
        resolve(server);
      });

      server.on('error', reject);
      this.server = server;
    });
  }

  /**
   * 处理 SSE 连接建立
   */
  async handleSSEConnection(req, res) {
    this.log('建立 SSE 连接');
    
    try {
      // 创建 SSE 传输
      const transport = new SSEServerTransport('/messages', res);
      const sessionId = transport.sessionId;
      
      // 存储传输
      this.transports[sessionId] = transport;
      
      // 设置关闭处理程序
      transport.onclose = () => {
        this.log(`SSE 传输关闭: ${sessionId}`);
        delete this.transports[sessionId];
      };

      // 连接到 MCP 服务器
      const server = this.setupMCPServer();
      await server.connect(transport);
      
      this.log(`SSE 流已建立，会话ID: ${sessionId}`);
    } catch (error) {
      this.log('建立 SSE 连接错误:', error);
      if (!res.headersSent) {
        res.status(500).send('Error establishing SSE connection');
      }
    }
  }

  /**
   * 处理 SSE 消息
   */
  async handleSSEMessage(req, res) {
    this.log('收到 SSE 消息:', req.body);

    try {
      // 从查询参数获取会话ID
      const sessionId = req.query.sessionId;
      
      if (!sessionId) {
        res.status(400).send('Missing sessionId parameter');
        return;
      }

      const transport = this.transports[sessionId];
      if (!transport) {
        res.status(404).send('Session not found');
        return;
      }

      // 处理消息
      await transport.handlePostMessage(req, res, req.body);
    } catch (error) {
      this.log('处理 SSE 消息错误:', error);
      if (!res.headersSent) {
        res.status(500).send('Error handling request');
      }
    }
  }

  /**
   * 设置 MCP 服务器
   */
  setupMCPServer() {
    const server = new McpServer({
      name: this.name,
      version: this.version
    }, {
      capabilities: {
        tools: {},
        logging: {}
      }
    });

    // 注册所有 PromptX 工具
    this.setupMCPTools(server);

    return server;
  }

  /**
   * 设置 MCP 工具
   */
  setupMCPTools(server) {
    const { z } = require('zod');
    
    // 注册 promptx_init 工具
    server.tool('promptx_init', '🎯 [AI专业化启动器] ⚡ 零配置AI专家化系统 - 30秒内让AI获得任何领域的专家思维和技能组合，瞬间激活专业能力增强框架', {}, async (args, extra) => {
      this.log('🔧 调用工具: promptx_init');
      return await this.callTool('promptx_init', {});
    });

    // 注册 promptx_hello 工具
    server.tool('promptx_hello', '🎭 [专家角色发现雷达] 🔥 当需要特定专业能力时立即使用 - 发现60+预制专家角色库，包括产品经理、Java开发者、设计师等，一键查看所有可激活的AI专业身份', {}, async (args, extra) => {
      this.log('🔧 调用工具: promptx_hello');
      return await this.callTool('promptx_hello', {});
    });

    // 注册 promptx_action 工具
    server.tool('promptx_action', '⚡ [AI专业能力核心引擎] 🚀 每当需要专业服务时必备 - 瞬间激活角色的完整思维体系和技能矩阵，3秒内让AI变身领域专家并自动加载相关记忆，立即可用', {
      role: z.string().describe('要激活的角色ID，如：copywriter, product-manager, java-backend-developer')
    }, async (args, extra) => {
      this.log(`🔧 调用工具: promptx_action 参数: ${JSON.stringify(args)}`);
      return await this.callTool('promptx_action', args);
    });

    // 注册 promptx_learn 工具
    server.tool('promptx_learn', '🧠 [革命性智能学习引擎] 💎 突破传统AI学习边界 - 支持@引用语义渲染的DPML协议，让AI瞬间掌握思维模式、执行技能和专业知识，学习一次永久获得', {
      resource: z.string().describe('资源URL，支持格式：thought://creativity, execution://best-practice, knowledge://scrum')
    }, async (args, extra) => {
      this.log(`🔧 调用工具: promptx_learn 参数: ${JSON.stringify(args)}`);
      return await this.callTool('promptx_learn', args);
    });

    // 注册 promptx_recall 工具
    server.tool('promptx_recall', '🔍 [专业记忆检索雷达] ⚡ AI工作必备的智能大脑 - 从专业记忆库中秒速检索相关经验和最佳实践，当需要基于历史项目经验或专业知识工作时立即使用', {
      query: z.string().optional().describe('检索关键词或描述，可选参数，不提供则返回所有记忆')
    }, async (args, extra) => {
      this.log(`🔧 调用工具: promptx_recall 参数: ${JSON.stringify(args)}`);
      return await this.callTool('promptx_recall', args);
    });

    // 注册 promptx_remember 工具
    server.tool('promptx_remember', '💾 [AI长期记忆增强器] 🧠 构建AI专业知识基因库 - 将重要经验、最佳实践、项目解决方案永久内化到AI记忆体系，支持跨会话记忆保持和智能检索', {
      content: z.string().describe('要保存的重要信息或经验'),
      tags: z.string().optional().describe('自定义标签，用空格分隔，可选')
    }, async (args, extra) => {
      this.log(`🔧 调用工具: promptx_remember 参数: ${JSON.stringify(args)}`);
      return await this.callTool('promptx_remember', args);
    });
  }

  /**
   * 获取工具定义
   */
  getToolDefinitions() {
    return [
      {
        name: 'promptx_init',
        description: '🎯 [AI专业化启动器] ⚡ 零配置AI专家化系统 - 30秒内让AI获得任何领域的专家思维和技能组合，瞬间激活专业能力增强框架',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'promptx_hello',
        description: '🎭 [专家角色发现雷达] 🔥 当需要特定专业能力时立即使用 - 发现60+预制专家角色库，包括产品经理、Java开发者、设计师等，一键查看所有可激活的AI专业身份',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'promptx_action',
        description: '⚡ [AI专业能力核心引擎] 🚀 每当需要专业服务时必备 - 瞬间激活角色的完整思维体系和技能矩阵，3秒内让AI变身领域专家并自动加载相关记忆，立即可用',
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
        description: '🧠 [革命性智能学习引擎] 💎 突破传统AI学习边界 - 支持@引用语义渲染的DPML协议，让AI瞬间掌握思维模式、执行技能和专业知识，学习一次永久获得',
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
        description: '🔍 [专业记忆检索雷达] ⚡ AI工作必备的智能大脑 - 从专业记忆库中秒速检索相关经验和最佳实践，当需要基于历史项目经验或专业知识工作时立即使用',
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
        description: '💾 [AI长期记忆增强器] 🧠 构建AI专业知识基因库 - 将重要经验、最佳实践、项目解决方案永久内化到AI记忆体系，支持跨会话记忆保持和智能检索',
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
   * 处理 MCP POST 请求
   */
  async handleMCPPostRequest(req, res) {
    this.log('收到 MCP 请求:', req.body);

    try {
      // 检查现有会话 ID
      const sessionId = req.headers['mcp-session-id'];
      let transport;

      if (sessionId && this.transports[sessionId]) {
        // 复用现有传输
        transport = this.transports[sessionId];
      } else if (!sessionId && isInitializeRequest(req.body)) {
        // 新的初始化请求
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          enableJsonResponse: true,
          onsessioninitialized: (sessionId) => {
            this.log(`会话初始化: ${sessionId}`);
            this.transports[sessionId] = transport;
          }
        });

        // 设置关闭处理程序
        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid && this.transports[sid]) {
            this.log(`传输关闭: ${sid}`);
            delete this.transports[sid];
          }
        };

        // 连接到 MCP 服务器
        const server = this.setupMCPServer();
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      } else if (!sessionId && this.isStatelessRequest(req.body)) {
        // 无状态请求（如 tools/list, prompts/list 等）
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined, // 无状态模式
          enableJsonResponse: true
        });

        // 连接到 MCP 服务器
        const server = this.setupMCPServer();
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      } else {
        // 无效请求
        return res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: No valid session ID provided'
          },
          id: null
        });
      }

      // 处理现有传输的请求
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      this.log('处理 MCP 请求错误:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error'
          },
          id: null
        });
      }
    }
  }

  /**
   * 处理 MCP GET 请求（SSE）
   */
  async handleMCPGetRequest(req, res) {
    const sessionId = req.headers['mcp-session-id'];
    if (!sessionId || !this.transports[sessionId]) {
      return res.status(400).json({
        error: 'Invalid or missing session ID'
      });
    }

    this.log(`建立 SSE 流: ${sessionId}`);
    const transport = this.transports[sessionId];
    await transport.handleRequest(req, res);
  }

  /**
   * 处理 MCP DELETE 请求（会话终止）
   */
  async handleMCPDeleteRequest(req, res) {
    const sessionId = req.headers['mcp-session-id'];
    if (!sessionId || !this.transports[sessionId]) {
      return res.status(400).json({
        error: 'Invalid or missing session ID'
      });
    }

    this.log(`终止会话: ${sessionId}`);
    try {
      const transport = this.transports[sessionId];
      await transport.handleRequest(req, res);
    } catch (error) {
      this.log('处理会话终止错误:', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Error processing session termination'
        });
      }
    }
  }

  /**
   * 调用工具
   */
  async callTool(toolName, args) {
    try {
      // 将 MCP 参数转换为 CLI 函数调用参数
      const cliArgs = this.convertMCPToCliParams(toolName, args);
      this.log(`🎯 CLI调用: ${toolName} -> ${JSON.stringify(cliArgs)}`);
      
      // 直接调用 PromptX CLI 函数
      const result = await cli.execute(toolName.replace('promptx_', ''), cliArgs, true);
      this.log(`✅ CLI执行完成: ${toolName}`);
      
      // 使用输出适配器转换为MCP响应格式（与stdio模式保持一致）
      return this.outputAdapter.convertToMCPFormat(result);
      
    } catch (error) {
      this.log(`❌ 工具调用失败: ${toolName} - ${error.message}`);
      return this.outputAdapter.handleError(error);
    }
  }

  /**
   * 转换 MCP 参数为 CLI 函数调用参数
   */
  convertMCPToCliParams(toolName, mcpArgs) {
    const paramMapping = {
      'promptx_init': () => [],
      'promptx_hello': () => [],
      'promptx_action': (args) => args && args.role ? [args.role] : [],
      'promptx_learn': (args) => args && args.resource ? [args.resource] : [],
      'promptx_recall': (args) => {
        if (!args || !args.query || typeof args.query !== 'string' || args.query.trim() === '') {
          return [];
        }
        return [args.query];
      },
      'promptx_remember': (args) => {
        if (!args || !args.content) {
          throw new Error('content 参数是必需的');
        }
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
    
    return mapper(mcpArgs || {});
  }

  /**
   * 调试日志
   */
  log(message, ...args) {
    if (this.debug) {
      logger.debug(`[MCP DEBUG] ${message}`, ...args);
    }
  }

  /**
   * 验证端口号
   */
  validatePort(port) {
    if (typeof port !== 'number') {
      throw new Error('Port must be a number');
    }
    if (port < 1 || port > 65535) {
      throw new Error('Port must be between 1 and 65535');
    }
  }

  /**
   * 验证主机地址
   */
  validateHost(host) {
    if (!host || typeof host !== 'string' || host.trim() === '') {
      throw new Error('Host cannot be empty');
    }
  }

  /**
   * 判断是否为无状态请求（不需要会话ID）
   */
  isStatelessRequest(requestBody) {
    if (!requestBody || !requestBody.method) {
      return false;
    }

    // 这些方法可以无状态处理
    const statelessMethods = [
      'tools/list',
      'prompts/list',
      'resources/list'
    ];

    return statelessMethods.includes(requestBody.method);
  }
}

module.exports = { MCPStreamableHttpCommand };