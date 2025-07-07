#!/usr/bin/env node

/**
 * PromptX HTTP MCP 客户端测试脚本
 * 模拟真实 MCP 客户端调用 HTTP 服务的完整流程
 * 
 * 使用方式:
 * node scripts/test-http-mcp-client.js --help
 * node scripts/test-http-mcp-client.js health
 * node scripts/test-http-mcp-client.js init
 * node scripts/test-http-mcp-client.js welcome
 * node scripts/test-http-mcp-client.js action product-manager
 * node scripts/test-http-mcp-client.js learn thought://creativity
 * node scripts/test-http-mcp-client.js recall "矛盾分析"
 * node scripts/test-http-mcp-client.js remember "这是一个重要的经验" --tags "test,example"
 * node scripts/test-http-mcp-client.js tool @tool://calculator --params '{"operation":"add","a":2,"b":3}'
 * node scripts/test-http-mcp-client.js tools/list
 * node scripts/test-http-mcp-client.js session-demo
 */

const { Command } = require('commander');
const chalk = require('chalk');

class PromptXHttpClient {
  constructor(baseUrl = 'http://localhost:3000', debug = false) {
    this.baseUrl = baseUrl;
    this.sessionId = null;
    this.debug = debug;
    this.requestId = 1;
  }

  log(message, data = null) {
    if (this.debug) {
      console.log(chalk.gray(`[DEBUG] ${message}`));
      if (data) {
        console.log(chalk.gray(JSON.stringify(data, null, 2)));
      }
    }
  }

  async request(method, params = {}, requireSession = true) {
    const payload = {
      jsonrpc: '2.0',
      method: method,
      params: params,
      id: this.requestId++
    };

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream'
    };

    // 如果需要会话ID且已存在，则添加
    if (requireSession && this.sessionId) {
      headers['mcp-session-id'] = this.sessionId;
    }

    this.log(`发送请求: ${method}`, payload);

    try {
      const response = await fetch(`${this.baseUrl}/mcp`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });
      
      // 检查是否返回了新的会话ID
      const newSessionId = response.headers.get('mcp-session-id');
      if (newSessionId && !this.sessionId) {
        this.sessionId = newSessionId;
        this.log(`获得会话ID: ${this.sessionId}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.log(`收到响应`, data);
      return data;
    } catch (error) {
      console.error(chalk.red(`❌ 请求失败: ${error.message}`));
      throw error;
    }
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log(chalk.green('✅ 服务健康检查通过'));
      console.log(JSON.stringify(data, null, 2));
      return data;
    } catch (error) {
      console.error(chalk.red('❌ 服务健康检查失败'));
      throw error;
    }
  }

  async initialize() {
    const params = {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      clientInfo: {
        name: 'promptx-http-test-client',
        version: '1.0.0'
      }
    };

    const result = await this.request('initialize', params, false);
    console.log(chalk.green('✅ MCP 会话初始化成功'));
    return result;
  }

  async listTools() {
    const result = await this.request('tools/list', {}, false);
    console.log(chalk.blue('📋 可用工具列表:'));
    if (result.result && result.result.tools) {
      result.result.tools.forEach(tool => {
        console.log(chalk.cyan(`  - ${tool.name}: ${tool.description}`));
      });
    }
    return result;
  }

  async callTool(toolName, args = {}) {
    const params = {
      name: toolName,
      arguments: args
    };

    const result = await this.request('tools/call', params, true);
    console.log(chalk.green(`✅ 工具 ${toolName} 调用成功`));
    
    if (result.result && result.result.content) {
      result.result.content.forEach(content => {
        if (content.type === 'text') {
          console.log(content.text);
        }
      });
    }
    
    return result;
  }

  // PromptX 特定工具方法
  async promptxInit(workingDirectory = null) {
    const args = workingDirectory ? { workingDirectory } : {};
    return await this.callTool('promptx_init', args);
  }

  async promptxWelcome() {
    return await this.callTool('promptx_welcome', {});
  }

  async promptxAction(role) {
    return await this.callTool('promptx_action', { role });
  }

  async promptxLearn(resource) {
    return await this.callTool('promptx_learn', { resource });
  }

  async promptxRecall(query = '') {
    const args = query ? { query } : {};
    return await this.callTool('promptx_recall', args);
  }

  async promptxRemember(content, tags = '') {
    const args = { content };
    if (tags) {
      args.tags = tags;
    }
    return await this.callTool('promptx_remember', args);
  }

  async promptxTool(toolResource, parameters) {
    return await this.callTool('promptx_tool', {
      tool_resource: toolResource,
      parameters: parameters
    });
  }

  // 完整会话演示
  async sessionDemo() {
    console.log(chalk.yellow('🚀 开始完整会话演示...\n'));

    try {
      // 1. 健康检查
      console.log(chalk.blue('1️⃣ 健康检查'));
      await this.healthCheck();
      console.log();

      // 2. 初始化会话
      console.log(chalk.blue('2️⃣ 初始化 MCP 会话'));
      await this.initialize();
      console.log();

      // 3. 获取工具列表
      console.log(chalk.blue('3️⃣ 获取工具列表'));
      await this.listTools();
      console.log();

      // 4. 初始化 PromptX
      console.log(chalk.blue('4️⃣ 初始化 PromptX'));
      await this.promptxInit();
      console.log();

      // 5. 角色发现
      console.log(chalk.blue('5️⃣ 角色发现'));
      await this.promptxWelcome();
      console.log();

      // 6. 激活角色
      console.log(chalk.blue('6️⃣ 激活产品经理角色'));
      await this.promptxAction('product-manager');
      console.log();

      // 7. 学习资源
      console.log(chalk.blue('7️⃣ 学习思维资源'));
      await this.promptxLearn('thought://creativity');
      console.log();

      // 8. 记忆存储
      console.log(chalk.blue('8️⃣ 存储记忆'));
      await this.promptxRemember('HTTP MCP 客户端测试完成', 'test,mcp,http');
      console.log();

      // 9. 记忆检索
      console.log(chalk.blue('9️⃣ 检索记忆'));
      await this.promptxRecall('test');
      console.log();

      console.log(chalk.green('✅ 完整会话演示完成！'));

    } catch (error) {
      console.error(chalk.red('❌ 会话演示失败:'), error.message);
    }
  }
}

// 命令行接口
const program = new Command();

program
  .name('test-http-mcp-client')
  .description('PromptX HTTP MCP 客户端测试工具')
  .version('1.0.0')
  .option('-u, --url <url>', 'MCP 服务器地址', 'http://localhost:3000')
  .option('-d, --debug', '启用调试模式', false);

program
  .command('health')
  .description('检查服务健康状态')
  .action(async () => {
    const client = new PromptXHttpClient(program.opts().url, program.opts().debug);
    await client.healthCheck();
  });

program
  .command('init [workingDirectory]')
  .description('初始化 PromptX')
  .action(async (workingDirectory) => {
    const client = new PromptXHttpClient(program.opts().url, program.opts().debug);
    await client.initialize();
    await client.promptxInit(workingDirectory);
  });

program
  .command('welcome')
  .description('角色发现')
  .action(async () => {
    const client = new PromptXHttpClient(program.opts().url, program.opts().debug);
    await client.initialize();
    await client.promptxWelcome();
  });

program
  .command('action <role>')
  .description('激活角色')
  .action(async (role) => {
    const client = new PromptXHttpClient(program.opts().url, program.opts().debug);
    await client.initialize();
    await client.promptxAction(role);
  });

program
  .command('learn <resource>')
  .description('学习资源')
  .action(async (resource) => {
    const client = new PromptXHttpClient(program.opts().url, program.opts().debug);
    await client.initialize();
    await client.promptxLearn(resource);
  });

program
  .command('recall [query]')
  .description('检索记忆')
  .action(async (query) => {
    const client = new PromptXHttpClient(program.opts().url, program.opts().debug);
    await client.initialize();
    await client.promptxRecall(query);
  });

program
  .command('remember <content>')
  .description('存储记忆')
  .option('-t, --tags <tags>', '标签 (逗号分隔)', '')
  .action(async (content, options) => {
    const client = new PromptXHttpClient(program.opts().url, program.opts().debug);
    await client.initialize();
    await client.promptxRemember(content, options.tags);
  });

program
  .command('tool <toolResource>')
  .description('执行工具')
  .option('-p, --params <params>', '工具参数 (JSON)', '{}')
  .action(async (toolResource, options) => {
    const client = new PromptXHttpClient(program.opts().url, program.opts().debug);
    await client.initialize();
    
    let params;
    try {
      params = JSON.parse(options.params);
    } catch (error) {
      console.error(chalk.red('❌ 参数格式错误，请提供有效的 JSON'));
      process.exit(1);
    }
    
    await client.promptxTool(toolResource, params);
  });

program
  .command('tools/list')
  .description('获取工具列表')
  .action(async () => {
    const client = new PromptXHttpClient(program.opts().url, program.opts().debug);
    await client.listTools();
  });

program
  .command('session-demo')
  .description('完整会话演示')
  .action(async () => {
    const client = new PromptXHttpClient(program.opts().url, program.opts().debug);
    await client.sessionDemo();
  });

// 自定义 MCP 方法调用
program
  .command('call <method>')
  .description('调用自定义 MCP 方法')
  .option('-p, --params <params>', '方法参数 (JSON)', '{}')
  .option('-s, --no-session', '不使用会话ID', false)
  .action(async (method, options) => {
    const client = new PromptXHttpClient(program.opts().url, program.opts().debug);
    
    if (options.session) {
      await client.initialize();
    }
    
    let params;
    try {
      params = JSON.parse(options.params);
    } catch (error) {
      console.error(chalk.red('❌ 参数格式错误，请提供有效的 JSON'));
      process.exit(1);
    }
    
    await client.request(method, params, options.session);
  });

// 添加帮助信息
program.addHelpText('after', `

${chalk.cyan('示例:')}
  ${chalk.gray('# 服务健康检查')}
  node scripts/test-http-mcp-client.js health

  ${chalk.gray('# 完整会话演示')}
  node scripts/test-http-mcp-client.js session-demo

  ${chalk.gray('# 初始化 PromptX')}
  node scripts/test-http-mcp-client.js init

  ${chalk.gray('# 角色发现')}
  node scripts/test-http-mcp-client.js welcome

  ${chalk.gray('# 激活角色')}
  node scripts/test-http-mcp-client.js action product-manager

  ${chalk.gray('# 学习资源')}
  node scripts/test-http-mcp-client.js learn thought://creativity

  ${chalk.gray('# 检索记忆')}
  node scripts/test-http-mcp-client.js recall "矛盾分析"

  ${chalk.gray('# 存储记忆')}
  node scripts/test-http-mcp-client.js remember "重要经验" --tags "test,demo"

  ${chalk.gray('# 执行工具')}
  node scripts/test-http-mcp-client.js tool @tool://calculator --params '{"operation":"add","a":2,"b":3}'

  ${chalk.gray('# 获取工具列表')}
  node scripts/test-http-mcp-client.js tools/list

  ${chalk.gray('# 调试模式')}
  node scripts/test-http-mcp-client.js --debug session-demo

  ${chalk.gray('# 指定服务器地址')}
  node scripts/test-http-mcp-client.js --url http://localhost:3001 health

${chalk.cyan('注意:')}
  - 确保 PromptX HTTP 服务已启动: ${chalk.yellow('node src/bin/promptx.js mcp-server -t http -p 3000')}
  - 某些命令需要有效的会话，脚本会自动处理会话初始化
  - 使用 --debug 查看详细的请求/响应信息
`);

// 错误处理
program.exitOverride();

try {
  program.parse(process.argv);
} catch (error) {
  if (error.code === 'commander.help') {
    process.exit(0);
  } else if (error.code === 'commander.version') {
    process.exit(0);
  } else {
    console.error(chalk.red(`❌ 命令执行失败: ${error.message}`));
    process.exit(1);
  }
}

// 如果没有提供命令，显示帮助
if (process.argv.length === 2) {
  program.help();
}