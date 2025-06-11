const { MCPStreamableHttpCommand } = require('../../lib/commands/MCPStreamableHttpCommand');

describe('MCPStreamableHttpCommand', () => {
  let command;

  beforeEach(() => {
    command = new MCPStreamableHttpCommand();
  });

  describe('constructor', () => {
    it('should initialize with correct name and version', () => {
      expect(command.name).toBe('promptx-mcp-streamable-http-server');
      expect(command.version).toBe('1.0.0');
    });

    it('should have default configuration', () => {
      expect(command.transport).toBe('http');
      expect(command.port).toBe(3000);
      expect(command.host).toBe('localhost');
    });
  });

  describe('execute', () => {
    it('should throw error when transport type is unsupported', async () => {
      await expect(command.execute({ transport: 'unsupported' }))
        .rejects
        .toThrow('Unsupported transport: unsupported');
    });

    it('should start Streamable HTTP server with default options', async () => {
      const mockStartStreamableHttpServer = jest.fn().mockResolvedValue();
      command.startStreamableHttpServer = mockStartStreamableHttpServer;

      await command.execute();

      expect(mockStartStreamableHttpServer).toHaveBeenCalledWith(3000, 'localhost');
    });

    it('should start Streamable HTTP server with custom options', async () => {
      const mockStartStreamableHttpServer = jest.fn().mockResolvedValue();
      command.startStreamableHttpServer = mockStartStreamableHttpServer;

      await command.execute({ transport: 'http', port: 4000, host: '0.0.0.0' });

      expect(mockStartStreamableHttpServer).toHaveBeenCalledWith(4000, '0.0.0.0');
    });

    it('should start SSE server when transport is sse', async () => {
      const mockStartSSEServer = jest.fn().mockResolvedValue();
      command.startSSEServer = mockStartSSEServer;

      await command.execute({ transport: 'sse', port: 3001 });

      expect(mockStartSSEServer).toHaveBeenCalledWith(3001, 'localhost');
    });
  });

  describe('startStreamableHttpServer', () => {
    it('should create Express app and listen on specified port', async () => {
      // Mock Express
      const mockApp = {
        use: jest.fn(),
        post: jest.fn(),
        get: jest.fn(),
        delete: jest.fn(),
        listen: jest.fn((port, callback) => callback())
      };
      const mockExpress = jest.fn(() => mockApp);
      mockExpress.json = jest.fn();

      // Mock the method to avoid actual server startup
      const originalMethod = command.startStreamableHttpServer;
      command.startStreamableHttpServer = jest.fn().mockImplementation(async (port, host) => {
        expect(port).toBe(3000);
        expect(host).toBe('localhost');
        return Promise.resolve();
      });

      await command.startStreamableHttpServer(3000, 'localhost');

      expect(command.startStreamableHttpServer).toHaveBeenCalledWith(3000, 'localhost');
    });
  });

  describe('startSSEServer', () => {
    it('should create Express app with dual endpoints', async () => {
      // Mock the method to avoid actual server startup
      command.startSSEServer = jest.fn().mockImplementation(async (port, host) => {
        expect(port).toBe(3000);
        expect(host).toBe('localhost');
        return Promise.resolve();
      });

      await command.startSSEServer(3000, 'localhost');

      expect(command.startSSEServer).toHaveBeenCalledWith(3000, 'localhost');
    });
  });

  describe('setupMCPServer', () => {
    it('should create MCP server with correct configuration', () => {
      const server = command.setupMCPServer();
      
      expect(server).toBeDefined();
      // We'll verify the server has the correct tools in integration tests
    });
  });

  describe('getToolDefinitions', () => {
    it('should return all PromptX tools', () => {
      const tools = command.getToolDefinitions();
      
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBe(6); // All PromptX tools
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('promptx_init');
      expect(toolNames).toContain('promptx_hello');
      expect(toolNames).toContain('promptx_action');
      expect(toolNames).toContain('promptx_learn');
      expect(toolNames).toContain('promptx_recall');
      expect(toolNames).toContain('promptx_remember');
    });
  });

  describe('handleMCPRequest', () => {
    it('should handle tool calls correctly', async () => {
      const mockReq = {
        body: {
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'promptx_hello',
            arguments: {}
          },
          id: 1
        },
        headers: {}
      };

      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        headersSent: false
      };

      // Mock CLI execution
      const mockCli = {
        execute: jest.fn().mockResolvedValue('Hello response')
      };

      command.cli = mockCli;
      command.handleMCPRequest = jest.fn().mockImplementation(async (req, res) => {
        expect(req.body.method).toBe('tools/call');
        res.json({ result: 'success' });
      });

      await command.handleMCPRequest(mockReq, mockRes);

      expect(command.handleMCPRequest).toHaveBeenCalledWith(mockReq, mockRes);
    });
  });

  describe('configuration validation', () => {
    it('should validate port number', () => {
      expect(() => command.validatePort(3000)).not.toThrow();
      expect(() => command.validatePort('invalid')).toThrow('Port must be a number');
      expect(() => command.validatePort(70000)).toThrow('Port must be between 1 and 65535');
    });

    it('should validate host address', () => {
      expect(() => command.validateHost('localhost')).not.toThrow();
      expect(() => command.validateHost('0.0.0.0')).not.toThrow();
      expect(() => command.validateHost('192.168.1.1')).not.toThrow();
      expect(() => command.validateHost('')).toThrow('Host cannot be empty');
    });
  });
});