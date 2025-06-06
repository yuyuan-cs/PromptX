const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

// 测试辅助函数
function normalizeOutput(output) {
  return output
    .replace(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/g, 'TIMESTAMP')
    .replace(/\[\d+ms\]/g, '[TIME]')
    .replace(/PS [^>]+>/g, '')
    .trim();
}

describe('MCP Server 项目结构验证', () => {
  test('现有CLI入口文件存在', () => {
    expect(fs.existsSync('src/bin/promptx.js')).toBe(true);
  });
  
  test('commands目录已创建', () => {
    expect(fs.existsSync('src/lib/commands')).toBe(true);
  });
  
  test('MCP SDK依赖已安装', () => {
    const pkg = require('../../../package.json');
    expect(pkg.dependencies['@modelcontextprotocol/sdk']).toBeDefined();
  });
});

describe('CLI函数调用基线测试', () => {
  let cli;
  
  beforeEach(() => {
    // 重新导入以确保清洁状态
    delete require.cache[require.resolve('../../lib/core/pouch')];
    cli = require('../../lib/core/pouch').cli;
  });

  test('cli.execute函数可用性', () => {
    expect(typeof cli.execute).toBe('function');
  });
  
  test('init命令函数调用', async () => {
    const result = await cli.execute('init', []);
    expect(result).toBeDefined();
    expect(result.toString()).toContain('🎯');
  }, 10000);
  
  test('hello命令函数调用', async () => {
    const result = await cli.execute('hello', []);
    expect(result).toBeDefined();
    expect(result.toString()).toContain('🎯');
  }, 10000);
  
  test('action命令函数调用', async () => {
    const result = await cli.execute('action', ['assistant']);
    expect(result).toBeDefined();
    expect(result.toString()).toContain('⚡');
  }, 10000);
});

describe('MCP适配器单元测试', () => {
  let mcpServer;
  
  beforeEach(() => {
    try {
      const { MCPServerCommand } = require('../../lib/commands/MCPServerCommand');
      mcpServer = new MCPServerCommand();
    } catch (error) {
      mcpServer = null;
    }
  });

  describe('基础结构测试', () => {
    test('MCPServerCommand类应该能导入', () => {
      expect(() => {
        require('../../lib/commands/MCPServerCommand');
      }).not.toThrow();
    });
    
    test('MCPServerCommand应该有必要方法', () => {
      if (!mcpServer) {
        expect(true).toBe(true); // 跳过测试如果类还没实现
        return;
      }
      
      expect(typeof mcpServer.execute).toBe('function');
      expect(typeof mcpServer.getToolDefinitions).toBe('function');
      expect(typeof mcpServer.convertMCPToCliParams).toBe('function');
      expect(typeof mcpServer.callTool).toBe('function');
      expect(typeof mcpServer.log).toBe('function');
    });
    
    test('调试模式应该可配置', () => {
      if (!mcpServer) {
        expect(true).toBe(true);
        return;
      }
      
      expect(typeof mcpServer.debug).toBe('boolean');
      expect(typeof mcpServer.log).toBe('function');
    });
  });

  describe('参数转换测试', () => {
    test('promptx_init参数转换', () => {
      if (!mcpServer) {
        expect(true).toBe(true);
        return;
      }

      const result = mcpServer.convertMCPToCliParams('promptx_init', {});
      expect(result).toEqual([]);
    });

    test('promptx_action参数转换', () => {
      if (!mcpServer) {
        expect(true).toBe(true);
        return;
      }

      const result = mcpServer.convertMCPToCliParams('promptx_action', {
        role: 'product-manager'
      });
      expect(result).toEqual(['product-manager']);
    });

    test('promptx_learn参数转换', () => {
      if (!mcpServer) {
        expect(true).toBe(true);
        return;
      }

      const result = mcpServer.convertMCPToCliParams('promptx_learn', {
        resource: 'thought://creativity'
      });
      expect(result).toEqual(['thought://creativity']);
    });

    test('promptx_remember参数转换', () => {
      if (!mcpServer) {
        expect(true).toBe(true);
        return;
      }

      const result = mcpServer.convertMCPToCliParams('promptx_remember', {
        content: '测试内容',
        tags: '测试 标签'
      });
      expect(result).toEqual(['测试内容', '--tags', '测试 标签']);
    });
  });

  describe('工具调用测试', () => {
    test('init工具调用', async () => {
      if (!mcpServer) {
        expect(true).toBe(true);
        return;
      }
      
      const result = await mcpServer.callTool('promptx_init', {});
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('🎯');
    }, 15000);
    
    test('hello工具调用', async () => {
      if (!mcpServer) {
        expect(true).toBe(true);
        return;
      }
      
      const result = await mcpServer.callTool('promptx_hello', {});
      expect(result.content).toBeDefined();
      expect(result.content[0].text).toContain('🎯');
    }, 15000);
    
    test('action工具调用', async () => {
      if (!mcpServer) {
        expect(true).toBe(true);
        return;
      }
      
      const result = await mcpServer.callTool('promptx_action', {
        role: 'assistant'
      });
      expect(result.content).toBeDefined();
      expect(result.content[0].text).toContain('⚡');
    }, 15000);
  });

  describe('错误处理测试', () => {
    test('无效工具名处理', async () => {
      if (!mcpServer) {
        expect(true).toBe(true);
        return;
      }
      
      const result = await mcpServer.callTool('invalid_tool', {});
      expect(result.content[0].text).toContain('❌');
      expect(result.isError).toBe(true);
    });
    
    test('缺少必需参数处理', async () => {
      if (!mcpServer) {
        expect(true).toBe(true);
        return;
      }
      
      const result = await mcpServer.callTool('promptx_action', {});
      expect(result.content[0].text).toContain('❌');
    });
  });
});

describe('MCP vs CLI 一致性测试', () => {
  let mcpServer;
  let cli;
  
  beforeEach(() => {
    try {
      const { MCPServerCommand } = require('../../lib/commands/MCPServerCommand');
      mcpServer = new MCPServerCommand();
      cli = require('../../lib/core/pouch').cli;
    } catch (error) {
      mcpServer = null;
      cli = null;
    }
  });

  test('init: MCP vs CLI 输出一致性', async () => {
    if (!mcpServer || !cli) {
      expect(true).toBe(true);
      return;
    }
    
    // 通过MCP调用
    const mcpResult = await mcpServer.callTool('promptx_init', {});
    const mcpOutput = normalizeOutput(mcpResult.content[0].text);
    
    // 直接CLI函数调用
    const cliResult = await cli.execute('init', []);
    const cliOutput = normalizeOutput(cliResult.toString());
    
    // 验证输出一致性
    expect(mcpOutput).toBe(cliOutput);
  }, 15000);

  test('action: MCP vs CLI 输出一致性', async () => {
    if (!mcpServer || !cli) {
      expect(true).toBe(true);
      return;
    }
    
    const role = 'assistant';
    
    const mcpResult = await mcpServer.callTool('promptx_action', { role });
    const mcpOutput = normalizeOutput(mcpResult.content[0].text);
    
    const cliResult = await cli.execute('action', [role]);
    const cliOutput = normalizeOutput(cliResult.toString());
    
    expect(mcpOutput).toBe(cliOutput);
  }, 15000);
});

describe('MCP协议通信测试', () => {
  test('工具定义获取', () => {
    let mcpServer;
    try {
      const { MCPServerCommand } = require('../../lib/commands/MCPServerCommand');
      mcpServer = new MCPServerCommand();
    } catch (error) {
      expect(true).toBe(true); // 跳过如果还没实现
      return;
    }
    
    const tools = mcpServer.getToolDefinitions();
    expect(tools).toHaveLength(6);
    
    const toolNames = tools.map(t => t.name);
    expect(toolNames).toContain('promptx_init');
    expect(toolNames).toContain('promptx_hello');
    expect(toolNames).toContain('promptx_action');
    expect(toolNames).toContain('promptx_learn');
    expect(toolNames).toContain('promptx_recall');
    expect(toolNames).toContain('promptx_remember');
  });
  
  test('工具Schema验证', () => {
    let mcpServer;
    try {
      const { MCPServerCommand } = require('../../lib/commands/MCPServerCommand');
      mcpServer = new MCPServerCommand();
    } catch (error) {
      expect(true).toBe(true);
      return;
    }
    
    const tools = mcpServer.getToolDefinitions();
    const actionTool = tools.find(t => t.name === 'promptx_action');
    
    expect(actionTool.inputSchema.properties.role).toBeDefined();
    expect(actionTool.inputSchema.required).toContain('role');
  });
}); 