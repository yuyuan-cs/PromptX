const { MCPStreamableHttpCommand } = require('../../lib/commands/MCPStreamableHttpCommand');
const http = require('http');

describe('MCP SSE Server Integration Tests', () => {
  let command;
  let port;

  beforeEach(() => {
    command = new MCPStreamableHttpCommand();
    port = 3001 + Math.floor(Math.random() * 1000);
  });

  afterEach(async () => {
    if (command.server && command.server.close) {
      await new Promise((resolve) => {
        command.server.close(resolve);
      });
    }
  });

  describe('SSE Transport', () => {
    it('should start SSE server and handle dual endpoints', async () => {
      // 启动 SSE 服务器
      await command.execute({ 
        transport: 'sse', 
        port, 
        host: 'localhost' 
      });

      // 等待服务器启动
      await new Promise(resolve => setTimeout(resolve, 200));

      // 测试健康检查端点
      const healthResponse = await makeHttpRequest({
        hostname: 'localhost',
        port,
        path: '/health',
        method: 'GET'
      });

      expect(healthResponse.statusCode).toBe(200);
      const healthData = JSON.parse(healthResponse.data);
      expect(healthData.status).toBe('ok');
    }, 10000);

    it('should establish SSE stream on GET /mcp', async () => {
      await command.execute({ transport: 'sse', port, host: 'localhost' });
      await new Promise(resolve => setTimeout(resolve, 200));

      // 尝试建立 SSE 连接
      const sseResponse = await makeHttpRequest({
        hostname: 'localhost',
        port,
        path: '/mcp',
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        }
      });

      expect(sseResponse.statusCode).toBe(200);
      expect(sseResponse.headers['content-type']).toContain('text/event-stream');
    }, 10000);

    it('should handle POST messages to /messages endpoint', async () => {
      await command.execute({ transport: 'sse', port, host: 'localhost' });
      await new Promise(resolve => setTimeout(resolve, 200));

      // 先建立 SSE 连接获取会话ID
      const sseResponse = await makeHttpRequest({
        hostname: 'localhost',
        port,
        path: '/mcp',
        method: 'GET',
        headers: { 'Accept': 'text/event-stream' }
      });

      // 解析 SSE 响应获取会话ID
      const sseData = sseResponse.data;
      const endpointMatch = sseData.match(/event: endpoint\ndata: (.+)/);
      let sessionId = 'test-session';
      
      if (endpointMatch) {
        const endpointData = JSON.parse(endpointMatch[1]);
        const urlObj = new URL(endpointData.uri);
        sessionId = urlObj.searchParams.get('sessionId');
      }

      // 发送初始化请求到 /messages 端点
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

      const response = await makeHttpRequest({
        hostname: 'localhost',
        port,
        path: `/messages?sessionId=${sessionId}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, JSON.stringify(initRequest));

      expect(response.statusCode).toBe(200);
    }, 10000);
  });

  describe('Transport Type Selection', () => {
    it('should start different transports based on parameter', async () => {
      // 测试默认 HTTP 传输
      const httpCommand = new MCPStreamableHttpCommand();
      const httpPort = port + 100;
      await httpCommand.execute({ transport: 'http', port: httpPort });
      
      const httpHealth = await makeHttpRequest({
        hostname: 'localhost',
        port: httpPort,
        path: '/health',
        method: 'GET'
      });
      expect(httpHealth.statusCode).toBe(200);
      
      // 清理
      if (httpCommand.server) {
        await new Promise(resolve => httpCommand.server.close(resolve));
      }

      // 测试 SSE 传输
      const sseCommand = new MCPStreamableHttpCommand();
      const ssePort = port + 200;
      await sseCommand.execute({ transport: 'sse', port: ssePort });
      
      const sseHealth = await makeHttpRequest({
        hostname: 'localhost',
        port: ssePort,
        path: '/health',
        method: 'GET'
      });
      expect(sseHealth.statusCode).toBe(200);
      
      // 清理
      if (sseCommand.server) {
        await new Promise(resolve => sseCommand.server.close(resolve));
      }
    }, 15000);
  });
});

// Helper function to make HTTP requests
function makeHttpRequest(options, data = null) {
  return new Promise((resolve, reject) => {
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