/**
 * @promptx/mcp-server - MCP Server implementation for PromptX
 * Provides MCP protocol support with FastMCP integration
 */

// Export all MCP server implementations
export { FastMCPHttpServer } from './server/FastMCPHttpServer'
export { FastMCPStdioServer } from './server/FastMCPStdioServer'

// Export MCP output adapter
export { MCPOutputAdapter } from './MCPOutputAdapter'

// Export MCPServerManager for unified server management
export { MCPServerManager } from './MCPServerManager'
export type { MCPServerOptions } from './MCPServerManager'

// Export definitions
export * as definitions from './definitions/index'