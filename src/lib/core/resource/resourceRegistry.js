const path = require('path');
const { ProtocolInfo } = require('./types');

/**
 * 资源注册表管理器
 * 管理资源协议和ID到路径的映射
 */
class ResourceRegistry {
  constructor() {
    this.builtinRegistry = new Map();
    this.customRegistry = new Map();
    this.loadBuiltinRegistry();
  }

  /**
   * 加载内置注册表
   */
  loadBuiltinRegistry() {
    // PromptX 内置资源协议
    const promptProtocol = new ProtocolInfo();
    promptProtocol.name = 'prompt';
    promptProtocol.description = 'PromptX内置提示词资源协议';
    promptProtocol.location = 'prompt://{resource_id}';
    promptProtocol.registry = new Map([
      ['protocols', '@package://prompt/protocol/**/*.md'],
      ['core', '@package://prompt/core/**/*.md'],
      ['domain', '@package://prompt/domain/**/*.md'],
      ['resource', '@package://prompt/resource/**/*.md'],
      ['bootstrap', '@package://bootstrap.md']
    ]);
    this.builtinRegistry.set('prompt', promptProtocol);

    // File 协议（标准协议，无需注册表）
    const fileProtocol = new ProtocolInfo();
    fileProtocol.name = 'file';
    fileProtocol.description = '文件系统资源协议';
    fileProtocol.location = 'file://{absolute_or_relative_path}';
    fileProtocol.params = {
      line: 'string - 行范围，如 "1-10"',
      encoding: 'string - 文件编码，默认 utf8'
    };
    this.builtinRegistry.set('file', fileProtocol);

    // Memory 协议（项目记忆系统）
    const memoryProtocol = new ProtocolInfo();
    memoryProtocol.name = 'memory';
    memoryProtocol.description = '项目记忆系统协议';
    memoryProtocol.location = 'memory://{resource_id}';
    memoryProtocol.registry = new Map([
      ['declarative', '@project://.promptx/memory/declarative.md'],
      ['procedural', '@project://.promptx/memory/procedural.md'],
      ['episodic', '@project://.promptx/memory/episodic.md'],
      ['semantic', '@project://.promptx/memory/semantic.md']
    ]);
    this.builtinRegistry.set('memory', memoryProtocol);

    // HTTP/HTTPS 协议（标准协议）
    const httpProtocol = new ProtocolInfo();
    httpProtocol.name = 'http';
    httpProtocol.description = 'HTTP网络资源协议';
    httpProtocol.location = 'http://{url}';
    httpProtocol.params = {
      format: 'string - 响应格式，如 json, text',
      timeout: 'number - 超时时间（毫秒）',
      cache: 'boolean - 是否缓存响应'
    };
    this.builtinRegistry.set('http', httpProtocol);
    this.builtinRegistry.set('https', httpProtocol);
  }

  /**
   * 解析资源ID到具体路径
   * @param {string} protocol - 协议名
   * @param {string} resourceId - 资源ID
   * @returns {string} 解析后的路径
   */
  resolve(protocol, resourceId) {
    const protocolInfo = this.getProtocolInfo(protocol);
    
    if (!protocolInfo) {
      throw new Error(`Unknown protocol: ${protocol}`);
    }

    // 如果协议有注册表，尝试解析ID
    if (protocolInfo.registry && protocolInfo.registry.size > 0) {
      const resolvedPath = protocolInfo.registry.get(resourceId);
      if (resolvedPath) {
        return resolvedPath;
      }
      
      // 如果在注册表中找不到，但这是一个有注册表的协议，抛出错误
      throw new Error(`Resource ID '${resourceId}' not found in ${protocol} protocol registry`);
    }

    // 对于没有注册表的协议（如file, http），直接返回资源ID作为路径
    return resourceId;
  }

  /**
   * 注册新的协议或更新现有协议
   * @param {string} protocolName - 协议名
   * @param {object} protocolDefinition - 协议定义
   */
  register(protocolName, protocolDefinition) {
    const protocolInfo = new ProtocolInfo();
    protocolInfo.name = protocolName;
    protocolInfo.description = protocolDefinition.description || '';
    protocolInfo.location = protocolDefinition.location || '';
    protocolInfo.params = protocolDefinition.params || {};
    
    // 设置注册表映射
    if (protocolDefinition.registry) {
      protocolInfo.registry = new Map();
      for (const [id, path] of Object.entries(protocolDefinition.registry)) {
        protocolInfo.registry.set(id, path);
      }
    }

    this.customRegistry.set(protocolName, protocolInfo);
  }

  /**
   * 获取协议信息
   * @param {string} protocolName - 协议名
   * @returns {ProtocolInfo|null} 协议信息
   */
  getProtocolInfo(protocolName) {
    return this.customRegistry.get(protocolName) || 
           this.builtinRegistry.get(protocolName) || 
           null;
  }

  /**
   * 列出所有可用协议
   * @returns {string[]} 协议名列表
   */
  listProtocols() {
    const protocols = new Set();
    
    for (const protocol of this.builtinRegistry.keys()) {
      protocols.add(protocol);
    }
    
    for (const protocol of this.customRegistry.keys()) {
      protocols.add(protocol);
    }
    
    return Array.from(protocols).sort();
  }

  /**
   * 检查协议是否存在
   * @param {string} protocolName - 协议名
   * @returns {boolean} 是否存在
   */
  hasProtocol(protocolName) {
    return this.builtinRegistry.has(protocolName) || 
           this.customRegistry.has(protocolName);
  }

  /**
   * 获取协议的注册表内容
   * @param {string} protocolName - 协议名
   * @returns {Map|null} 注册表映射
   */
  getProtocolRegistry(protocolName) {
    const protocolInfo = this.getProtocolInfo(protocolName);
    return protocolInfo ? protocolInfo.registry : null;
  }

  /**
   * 列出协议的所有可用资源ID
   * @param {string} protocolName - 协议名
   * @returns {string[]} 资源ID列表
   */
  listProtocolResources(protocolName) {
    const registry = this.getProtocolRegistry(protocolName);
    return registry ? Array.from(registry.keys()) : [];
  }

  /**
   * 展开通配符模式
   * @param {string} pattern - 通配符模式
   * @returns {string[]} 展开后的路径列表
   */
  expandWildcards(pattern) {
    // 这里暂时返回原样，实际实现需要结合文件系统
    // 在ResourceLocator中会有更详细的实现
    return [pattern];
  }

  /**
   * 验证资源引用
   * @param {string} protocol - 协议名
   * @param {string} resourceId - 资源ID
   * @returns {boolean} 是否有效
   */
  validateReference(protocol, resourceId) {
    if (!this.hasProtocol(protocol)) {
      return false;
    }

    const protocolInfo = this.getProtocolInfo(protocol);
    
    // 如果有注册表，检查ID是否存在
    if (protocolInfo.registry && protocolInfo.registry.size > 0) {
      return protocolInfo.registry.has(resourceId);
    }

    // 对于没有注册表的协议，只要协议存在就认为有效
    return true;
  }

  /**
   * 获取所有注册表信息（用于调试）
   * @returns {object} 注册表信息
   */
  getRegistryInfo() {
    const info = {
      builtin: {},
      custom: {}
    };

    for (const [name, protocol] of this.builtinRegistry) {
      info.builtin[name] = {
        description: protocol.description,
        location: protocol.location,
        params: protocol.params,
        registrySize: protocol.registry ? protocol.registry.size : 0,
        resources: protocol.registry ? Array.from(protocol.registry.keys()) : []
      };
    }

    for (const [name, protocol] of this.customRegistry) {
      info.custom[name] = {
        description: protocol.description,
        location: protocol.location,
        params: protocol.params,
        registrySize: protocol.registry ? protocol.registry.size : 0,
        resources: protocol.registry ? Array.from(protocol.registry.keys()) : []
      };
    }

    return info;
  }
}

module.exports = ResourceRegistry; 