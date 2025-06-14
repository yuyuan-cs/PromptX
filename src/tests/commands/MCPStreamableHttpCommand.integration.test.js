const { MCPStreamableHttpCommand } = require('../../lib/commands/MCPStreamableHttpCommand');
const http = require('http');

describe('MCPStreamableHttpCommand Integration Tests', () => {
  let command;
  let server;
  let port;

  beforeEach(() => {
    command = new MCPStreamableHttpCommand();
    port = 3001 + Math.floor(Math.random() * 1000); // 随机端口避免冲突
  });

  afterEach(async () => {
    if (server && server.close) {
      await new Promise((resolve) => {
        server.close(() => {
          server = null;
          resolve();
        });
      });
    }
    // 清理命令实例
    if (command && command.server) {
      command.server = null;
    }
  });

  describe('Streamable HTTP Server', () => {
    it('should start server and respond to health check', async () => {
      // 启动服务器
      server = await command.execute({ 
        transport: 'http', 
        port, 
        host: 'localhost' 
      });

      // 等待服务器启动
      await new Promise(resolve => setTimeout(resolve, 100));

      // 发送健康检查请求
      const response = await makeHttpRequest({
        hostname: 'localhost',
        port,
        path: '/health',
        method: 'GET'
      });

      expect(response.statusCode).toBe(200);
    }, 5000);

    it('should handle MCP initialize request', async () => {
      // 启动服务器
      server = await command.execute({ 
        transport: 'http', 
        port, 
        host: 'localhost' 
      });

      // 等待服务器启动
      await new Promise(resolve => setTimeout(resolve, 100));

      // 发送初始化请求
      const initRequest = {
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'test-client',
            version: '1.0.0'
          }
        },
        id: 1
      };

      const response = await makeHttpRequest({
        hostname: 'localhost',
        port,
        path: '/mcp',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream'
        }
      }, JSON.stringify(initRequest));

      expect(response.statusCode).toBe(200);
      const responseData = JSON.parse(response.data);
      expect(responseData.jsonrpc).toBe('2.0');
      expect(responseData.id).toBe(1);
    }, 5000);

    it('should handle tools/list request', async () => {
      // 启动服务器
      server = await command.execute({ 
        transport: 'http', 
        port, 
        host: 'localhost' 
      });

      // 等待服务器启动
      await new Promise(resolve => setTimeout(resolve, 100));

      // 先初始化
      const initRequest = {
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' }
        },
        id: 1
      };

      const initResponse = await makeHttpRequest({
        hostname: 'localhost',
        port,
        path: '/mcp',
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream'
        }
      }, JSON.stringify(initRequest));

      const initResponseData = JSON.parse(initResponse.data);
      const sessionId = initResponse.headers['mcp-session-id'];
      
      if (!sessionId) {
        throw new Error('Session ID not found in initialization response headers. Headers: ' + JSON.stringify(initResponse.headers) + ', Body: ' + JSON.stringify(initResponseData));
      }

      // 发送工具列表请求
      const toolsRequest = {
        jsonrpc: '2.0',
        method: 'tools/list',
        params: {},
        id: 2
      };

      const response = await makeHttpRequest({
        hostname: 'localhost',
        port,
        path: '/mcp',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'mcp-session-id': sessionId
        }
      }, JSON.stringify(toolsRequest));

      expect(response.statusCode).toBe(200);
      const responseData = JSON.parse(response.data);
      expect(responseData.result.tools).toBeDefined();
      expect(Array.isArray(responseData.result.tools)).toBe(true);
      expect(responseData.result.tools.length).toBe(6);
    }, 5000);

    it('should handle tool call request', async () => {
      // 启动服务器
      server = await command.execute({ 
        transport: 'http', 
        port, 
        host: 'localhost' 
      });

      // 等待服务器启动
      await new Promise(resolve => setTimeout(resolve, 100));

      // 先初始化
      const initRequest = {
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' }
        },
        id: 1
      };

      const initResponse = await makeHttpRequest({
        hostname: 'localhost',
        port,
        path: '/mcp',
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream'
        }
      }, JSON.stringify(initRequest));

      const initResponseData = JSON.parse(initResponse.data);
      const sessionId = initResponse.headers['mcp-session-id'];
      
      if (!sessionId) {
        throw new Error('Session ID not found in initialization response headers. Headers: ' + JSON.stringify(initResponse.headers));
      }

      // 发送工具调用请求
      const toolCallRequest = {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'promptx_hello',
          arguments: {}
        },
        id: 3
      };

      const response = await makeHttpRequest({
        hostname: 'localhost',
        port,
        path: '/mcp',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'mcp-session-id': sessionId
        }
      }, JSON.stringify(toolCallRequest));

      expect(response.statusCode).toBe(200);
      const responseData = JSON.parse(response.data);
      expect(responseData.result).toBeDefined();
    }, 5000);
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON requests', async () => {
      await command.execute({ transport: 'http', port, host: 'localhost' });
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await makeHttpRequest({
        hostname: 'localhost',
        port,
        path: '/mcp',
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream'
        }
      }, 'invalid json');

      expect(response.statusCode).toBe(400);
    }, 5000);

    it('should handle missing session ID for non-initialize requests', async () => {
      await command.execute({ transport: 'http', port, host: 'localhost' });
      await new Promise(resolve => setTimeout(resolve, 100));

      const request = {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'promptx_hello',
          arguments: {}
        },
        id: 1
      };

      const response = await makeHttpRequest({
        hostname: 'localhost',
        port,
        path: '/mcp',
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream'
        }
      }, JSON.stringify(request));

      expect(response.statusCode).toBe(400);
    }, 5000);
  });
});

// Helper function to make HTTP requests
function makeHttpRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    // 如果有数据，添加Content-Length header
    if (data && options.headers) {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }
    
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(data);
    }
    req.end();
  });
}