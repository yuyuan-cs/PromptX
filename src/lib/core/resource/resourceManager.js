const fs = require('fs')
const ResourceRegistry = require('./resourceRegistry')
const ResourceProtocolParser = require('./resourceProtocolParser') 
const DiscoveryManager = require('./discovery/DiscoveryManager')

// 导入协议处理器
const PackageProtocol = require('./protocols/PackageProtocol')
const ProjectProtocol = require('./protocols/ProjectProtocol')
const RoleProtocol = require('./protocols/RoleProtocol')
const ThoughtProtocol = require('./protocols/ThoughtProtocol')
const ExecutionProtocol = require('./protocols/ExecutionProtocol')
const KnowledgeProtocol = require('./protocols/KnowledgeProtocol')

class ResourceManager {
  constructor() {
    this.registry = new ResourceRegistry()
    this.protocolParser = new ResourceProtocolParser()
    this.parser = new ResourceProtocolParser() // 向后兼容别名
    this.discoveryManager = new DiscoveryManager() // 新发现管理器
    
    // 初始化协议处理器
    this.protocols = new Map()
    this.initializeProtocols()
  }

  /**
   * 初始化所有协议处理器
   */
  initializeProtocols() {
    // 基础协议 - 直接文件系统映射
    this.protocols.set('package', new PackageProtocol())
    this.protocols.set('project', new ProjectProtocol()) 

    // 逻辑协议 - 需要注册表查询
    this.protocols.set('role', new RoleProtocol())
    this.protocols.set('thought', new ThoughtProtocol())
    this.protocols.set('execution', new ExecutionProtocol())
    this.protocols.set('knowledge', new KnowledgeProtocol())
  }

  /**
   * 新架构初始化方法
   */
  async initializeWithNewArchitecture() {
    try {
      // 1. 直接发现并注册资源（无需中间合并步骤）
      await this.discoveryManager.discoverAndDirectRegister(this.registry)

      // 2. 为逻辑协议设置注册表引用
      this.setupLogicalProtocols()

      // 3. 设置初始化状态
      this.initialized = true

      // 初始化完成，不输出日志避免干扰用户界面
    } catch (error) {
      console.warn(`[ResourceManager] New architecture initialization failed: ${error.message}`)
      console.warn('[ResourceManager] Continuing with empty registry')
      this.initialized = true // 即使失败也标记为已初始化，避免重复尝试
    }
  }

  /**
   * 为逻辑协议设置注册表引用
   */
  setupLogicalProtocols() {
    // 将统一注册表传递给逻辑协议处理器
    const roleProtocol = this.protocols.get('role')
    const executionProtocol = this.protocols.get('execution')
    const thoughtProtocol = this.protocols.get('thought')
    const knowledgeProtocol = this.protocols.get('knowledge')
    
    if (roleProtocol) {
      roleProtocol.setRegistryManager(this)
    }
    if (executionProtocol) {
      executionProtocol.setRegistryManager(this)
    }
    if (thoughtProtocol) {
      thoughtProtocol.setRegistryManager(this)
    }
    if (knowledgeProtocol) {
      knowledgeProtocol.setRegistryManager(this)
    }
    
    // 逻辑协议设置完成，不输出日志避免干扰用户界面
  }

  /**
   * 通过协议解析加载资源内容
   * @param {string} reference - 资源引用
   * @returns {Promise<string>} 资源内容
   */
  async loadResourceByProtocol(reference) {
    // 1. 使用ResourceProtocolParser解析DPML语法
    const parsed = this.protocolParser.parse(reference)
    
    // 2. 获取对应的协议处理器
    const protocol = this.protocols.get(parsed.protocol)
    if (!protocol) {
      throw new Error(`不支持的协议: ${parsed.protocol}`)
    }

    // 3. 委托给协议处理器解析并加载内容
    const result = await protocol.resolve(parsed.path, parsed.queryParams)
    
    // 4. 确保返回字符串内容，解包可能的对象格式
    if (typeof result === 'string') {
      return result
    } else if (result && typeof result === 'object' && result.content) {
      return result.content
    } else {
      throw new Error(`协议${parsed.protocol}返回了无效的内容格式`)
    }
  }

  async loadResource(resourceId) {
    try {
      // 每次都刷新资源（无状态设计）
      await this.refreshResources()
      
      // 处理@!开头的DPML格式（如 @!role://java-developer）
      if (resourceId.startsWith('@!')) {
        const parsed = this.protocolParser.parse(resourceId)
        const logicalResourceId = `${parsed.protocol}:${parsed.path}`
        
        // 从注册表查找对应的@package://引用
        const reference = this.registry.get(logicalResourceId)
        if (!reference) {
          throw new Error(`Resource not found: ${logicalResourceId}`)
        }
        
        // 通过协议解析加载内容
        const content = await this.loadResourceByProtocol(reference)
        
        return {
          success: true,
          content,
          resourceId,
          reference
        }
      }
      
      // 处理传统格式（如 role:java-developer）
      const reference = this.registry.get(resourceId)
      if (!reference) {
        throw new Error(`Resource not found: ${resourceId}`)
      }
      
      // 通过协议解析加载内容
      const content = await this.loadResourceByProtocol(reference)

      return {
        success: true,
        content,
        resourceId,
        reference
      }
    } catch (error) {
      return {
        success: false,
        error: error,
        message: error.message
      }
    }
  }

  /**
   * 统一协议解析入口点 - 按照架构文档设计
   */
  async resolveProtocolReference(reference) {
    // 1. 使用ResourceProtocolParser解析DPML语法
    const parsed = this.parser.parse(reference)
    
    // 2. 获取对应的协议处理器
    const protocol = this.protocols.get(parsed.protocol)
    if (!protocol) {
      throw new Error(`不支持的协议: ${parsed.protocol}`)
    }

    // 3. 委托给协议处理器解析
    return await protocol.resolve(parsed.path, parsed.queryParams)
  }

  /**
   * 获取所有已注册的协议
   * @returns {Array<string>} 协议名称列表
   */
  getAvailableProtocols() {
    return Array.from(this.protocols.keys())
  }

  /**
   * 检查是否支持指定协议
   * @param {string} protocol - 协议名称
   * @returns {boolean} 是否支持
   */
  supportsProtocol(protocol) {
    return this.protocols.has(protocol)
  }

  /**
   * 设置初始化状态
   */
  set initialized(value) {
    this._initialized = value
  }

  /**
   * 获取初始化状态
   */
  get initialized() {
    return this._initialized || false
  }

  // 向后兼容方法
  async resolve(resourceUrl) {
    try {
      // 每次都刷新资源（无状态设计）
      await this.refreshResources()
      
      // Handle old format: role:java-backend-developer or @package://...
      if (resourceUrl.startsWith('@')) {
        // Parse the reference to check if it's a custom protocol
        const parsed = this.protocolParser.parse(resourceUrl)
        
        // Check if it's a basic protocol that can be handled directly
        const basicProtocols = ['package', 'project', 'file']
        if (basicProtocols.includes(parsed.protocol)) {
          // Direct protocol format - use protocol resolution
          const content = await this.loadResourceByProtocol(resourceUrl)
          return {
            success: true,
            content,
            path: resourceUrl,
            reference: resourceUrl
          }
        } else {
          // Custom protocol - extract resource ID and use ResourceRegistry
          const resourceId = `${parsed.protocol}:${parsed.path}`
          return await this.loadResource(resourceId)
        }
      } else {
        // Legacy format: treat as resource ID
        return await this.loadResource(resourceUrl)
      }
    } catch (error) {
      return {
        success: false,
        error: error,
        message: error.message
      }
    }
  }

  /**
   * 无状态资源刷新（推荐方法）
   * 每次都重新发现并注册资源，无需维护初始化状态
   */
  async refreshResources() {
    try {
      // 1. 清空当前注册表
      this.registry.clear()
      
      // 2. 清除发现器缓存
      if (this.discoveryManager && typeof this.discoveryManager.clearCache === 'function') {
        this.discoveryManager.clearCache()
      }
      
      // 3. 重新发现并直接注册
      await this.discoveryManager.discoverAndDirectRegister(this.registry)
      
      // 4. 更新协议引用
      this.setupLogicalProtocols()
      
      // 无状态设计：不设置initialized标志
    } catch (error) {
      console.warn(`[ResourceManager] Resource refresh failed: ${error.message}`)
      // 失败时保持注册表为空状态，下次调用时重试
    }
  }

  /**
   * 强制重新初始化资源发现（清除缓存）
   * 用于解决新创建角色无法被发现的问题
   * @deprecated 推荐使用 refreshResources() 方法
   */
}

module.exports = ResourceManager