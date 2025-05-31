const ResourceProtocolParser = require('./resourceProtocolParser');
const ResourceRegistry = require('./resourceRegistry');
const { ResourceResult } = require('./types');
const logger = require('../../utils/logger');
const fs = require('fs-extra');
const path = require('path');

// 导入协议实现
const PackageProtocol = require('./protocols/PackageProtocol');
const ProjectProtocol = require('./protocols/ProjectProtocol');
const UserProtocol = require('./protocols/UserProtocol');
const PromptProtocol = require('./protocols/PromptProtocol');

/**
 * 资源管理器 - 统一管理各种协议的资源加载
 */
class ResourceManager {
  constructor() {
    this.protocolHandlers = new Map();
    this.registry = null;
    this.initialized = false;
  }

  /**
   * 初始化资源管理器
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // 从统一注册表加载所有协议信息
      await this.loadUnifiedRegistry();
      
      // 注册协议处理器
      await this.registerProtocolHandlers();
      
      this.initialized = true;
    } catch (error) {
      throw new Error(`ResourceManager初始化失败: ${error.message}`);
    }
  }

  /**
   * 加载统一资源注册表
   */
  async loadUnifiedRegistry() {
    const registryPath = path.resolve(__dirname, '../../../resource.registry.json');
    
    if (!await fs.pathExists(registryPath)) {
      throw new Error(`统一资源注册表文件不存在: ${registryPath}`);
    }

    const registryContent = await fs.readJSON(registryPath);
    this.registry = registryContent;
  }

  /**
   * 注册协议处理器
   */
  async registerProtocolHandlers() {
    // 动态导入协议处理器
    const protocolsDir = path.join(__dirname, 'protocols');
    const protocolFiles = await fs.readdir(protocolsDir);
    
    for (const file of protocolFiles) {
      if (file.endsWith('.js') && file !== 'ResourceProtocol.js') {
        // 将文件名映射到协议名：ExecutionProtocol.js -> execution
        const protocolName = file.replace('Protocol.js', '').toLowerCase();
        const ProtocolClass = require(path.join(protocolsDir, file));
        const protocolHandler = new ProtocolClass();
        
        // 从统一注册表获取协议配置
        const protocolConfig = this.registry.protocols[protocolName];
        if (protocolConfig && protocolConfig.registry) {
          protocolHandler.setRegistry(protocolConfig.registry);
        }
        
        this.protocolHandlers.set(protocolName, protocolHandler);
      }
    }
  }

  /**
   * 解析资源路径并获取内容
   */
  async resolveResource(resourceUrl) {
    await this.initialize();

    const urlMatch = resourceUrl.match(/^([a-zA-Z]+):\/\/(.+)$/);
    if (!urlMatch) {
      throw new Error(`无效的资源URL格式: ${resourceUrl}`);
    }

    const [, protocol, path] = urlMatch;
    const handler = this.protocolHandlers.get(protocol);
    
    if (!handler) {
      throw new Error(`未注册的协议: ${protocol}`);
    }

    return await handler.resolve(path);
  }

  /**
   * resolve方法的别名，保持向后兼容
   */
  async resolve(resourceUrl) {
    return await this.resolveResource(resourceUrl);
  }

  /**
   * 获取协议的注册表信息
   */
  getProtocolRegistry(protocol) {
    if (!this.registry) {
      throw new Error('ResourceManager未初始化');
    }
    
    const protocolConfig = this.registry.protocols[protocol];
    return protocolConfig ? protocolConfig.registry : null;
  }

  /**
   * 获取所有已注册的协议
   */
  getAvailableProtocols() {
    return this.registry ? Object.keys(this.registry.protocols) : [];
  }

  /**
   * 获取协议的描述信息
   */
  getProtocolInfo(protocol) {
    if (!this.registry) {
      throw new Error('ResourceManager未初始化');
    }
    
    return this.registry.protocols[protocol];
  }
}

module.exports = ResourceManager; 