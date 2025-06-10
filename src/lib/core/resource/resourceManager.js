const ResourceProtocolParser = require('./resourceProtocolParser')
const ResourceRegistry = require('./resourceRegistry')
const { ResourceResult } = require('./types')
const logger = require('../../utils/logger')
const fs = require('fs-extra')
const path = require('path')

// 导入协议实现
const PackageProtocol = require('./protocols/PackageProtocol')
const ProjectProtocol = require('./protocols/ProjectProtocol')
const UserProtocol = require('./protocols/UserProtocol')
const PromptProtocol = require('./protocols/PromptProtocol')

// 常量定义
const USER_RESOURCE_DIR = '.promptx'
const RESOURCE_DOMAIN_PATH = ['resource', 'domain']
const SUPPORTED_RESOURCE_TYPES = ['role', 'thought', 'execution']
const DPML_TAGS = {
  role: { start: '<role>', end: '</role>' },
  thought: { start: '<thought>', end: '</thought>' },
  execution: { start: '<execution>', end: '</execution>' }
}

/**
 * 资源管理器 - 统一管理各种协议的资源加载
 */
class ResourceManager {
  constructor () {
    this.protocolHandlers = new Map()
    this.registry = null
    this.initialized = false
  }

  /**
   * 初始化资源管理器
   */
  async initialize () {
    if (this.initialized) return

    try {
      // 从统一注册表加载所有协议信息
      await this.loadUnifiedRegistry()

      // 注册协议处理器
      await this.registerProtocolHandlers()

      this.initialized = true
    } catch (error) {
      throw new Error(`ResourceManager初始化失败: ${error.message}`)
    }
  }

  /**
   * 加载统一资源注册表（合并系统和用户资源）
   */
  async loadUnifiedRegistry () {
    try {
      // 加载系统资源注册表
      const registryPath = path.resolve(__dirname, '../../../resource.registry.json')

      if (!await fs.pathExists(registryPath)) {
        throw new Error(`统一资源注册表文件不存在: ${registryPath}`)
      }

      const systemRegistry = await fs.readJSON(registryPath)
      
      // 发现用户资源
      const userResources = await this.discoverUserResources()
      
      // 从系统注册表中提取资源数据
      const extractedSystemResources = {}
      for (const resourceType of SUPPORTED_RESOURCE_TYPES) {
        const protocolConfig = systemRegistry.protocols[resourceType]
        if (protocolConfig && protocolConfig.registry) {
          extractedSystemResources[resourceType] = protocolConfig.registry
        }
      }
      
      // 合并资源，用户资源覆盖系统资源
      const mergedRegistry = { ...systemRegistry }
      
      // 合并各种资源类型
      for (const resourceType of SUPPORTED_RESOURCE_TYPES) {
        // 确保有基础结构
        if (!mergedRegistry[resourceType]) {
          mergedRegistry[resourceType] = {}
        }
        
        // 先添加系统资源
        if (extractedSystemResources[resourceType]) {
          if (!mergedRegistry[resourceType]) mergedRegistry[resourceType] = {}
          for (const [id, resourceInfo] of Object.entries(extractedSystemResources[resourceType])) {
            mergedRegistry[resourceType][id] = {
              ...resourceInfo,
              source: 'system'
            }
          }
        }
        
        // 再添加用户资源（覆盖同名的系统资源）
        if (userResources[resourceType]) {
          for (const [id, resourceInfo] of Object.entries(userResources[resourceType])) {
            let filePath = resourceInfo.file || resourceInfo
            
            // 将绝对路径转换为@project://相对路径格式
            if (path.isAbsolute(filePath)) {
              // 简单的路径转换：去掉项目根目录前缀
              const projectRoot = process.cwd()
              if (filePath.startsWith(projectRoot)) {
                const relativePath = path.relative(projectRoot, filePath)
                filePath = `@project://${relativePath}`
              }
            }
            
            // 对于role资源类型，需要保持对象格式以包含name和description
            if (resourceType === 'role') {
              mergedRegistry[resourceType][id] = {
                file: filePath,
                name: resourceInfo.name || id,
                description: resourceInfo.description || `${resourceInfo.name || id}专业角色`,
                source: 'user-generated',
                format: resourceInfo.format,
                type: resourceInfo.type
              }
            } else {
              // 对于thought和execution，协议处理器期望的是文件路径字符串
              if (!mergedRegistry[resourceType]) mergedRegistry[resourceType] = {}
              mergedRegistry[resourceType][id] = filePath
            }
          }
        }
      }
      
      this.registry = mergedRegistry
      return mergedRegistry
    } catch (error) {
      // 如果加载失败，至少返回一个基本结构
      logger.warn(`加载统一注册表失败: ${error.message}`)
      const fallbackRegistry = { role: {} }
      this.registry = fallbackRegistry
      return fallbackRegistry
    }
  }

  /**
   * 注册协议处理器
   */
  async registerProtocolHandlers () {
    // 动态导入协议处理器
    const protocolsDir = path.join(__dirname, 'protocols')
    const protocolFiles = await fs.readdir(protocolsDir)

    // 首先创建所有协议处理器实例
    const handlers = new Map()

    for (const file of protocolFiles) {
      if (file.endsWith('.js') && file !== 'ResourceProtocol.js') {
        // 将文件名映射到协议名：ExecutionProtocol.js -> execution
        const protocolName = file.replace('Protocol.js', '').toLowerCase()
        const ProtocolClass = require(path.join(protocolsDir, file))
        const protocolHandler = new ProtocolClass()

        // 从统一注册表获取协议配置
        const protocolConfig = this.registry.protocols[protocolName]
        if (protocolConfig && protocolConfig.registry) {
          protocolHandler.setRegistry(protocolConfig.registry)
        }

        handlers.set(protocolName, protocolHandler)
      }
    }

    // 设置协议依赖关系
    const packageProtocol = handlers.get('package')
    const promptProtocol = handlers.get('prompt')

    if (promptProtocol && packageProtocol) {
      promptProtocol.setPackageProtocol(packageProtocol)
    }

    // 将所有处理器注册到管理器
    this.protocolHandlers = handlers
  }

  /**
   * 解析资源路径并获取内容
   */
  async resolveResource (resourceUrl) {
    await this.initialize()

    try {
      // 支持DPML资源引用语法: @protocol://path, @!protocol://path, @?protocol://path
      // 同时向后兼容标准URL格式: protocol://path
      const urlMatch = resourceUrl.match(/^(@[!?]?)?([a-zA-Z][a-zA-Z0-9_-]*):\/\/(.+)$/)
      if (!urlMatch) {
        throw new Error(`无效的资源URL格式: ${resourceUrl}。支持格式: @protocol://path, @!protocol://path, @?protocol://path`)
      }

      const [, loadingSemantic, protocol, resourcePath] = urlMatch
      const handler = this.protocolHandlers.get(protocol)

      if (!handler) {
        throw new Error(`未注册的协议: ${protocol}`)
      }

      // 解析查询参数（如果有的话）
      const { QueryParams, ResourceResult } = require('./types')
      let path = resourcePath
      const queryParams = new QueryParams()

      if (resourcePath.includes('?')) {
        const [pathPart, queryString] = resourcePath.split('?', 2)
        path = pathPart

        // 解析查询字符串
        const params = new URLSearchParams(queryString)
        for (const [key, value] of params) {
          queryParams.set(key, value)
        }
      }

      // 将加载语义信息添加到查询参数中（如果有的话）
      if (loadingSemantic) {
        queryParams.set('loadingSemantic', loadingSemantic)
      }

      const content = await handler.resolve(path, queryParams)

      // 返回ResourceResult格式
      return ResourceResult.success(content, {
        protocol,
        path,
        loadingSemantic,
        loadTime: Date.now()
      })
    } catch (error) {
      // 返回错误结果
      const { ResourceResult } = require('./types')
      return ResourceResult.error(error, {
        resourceUrl,
        loadTime: Date.now()
      })
    }
  }

  /**
   * resolve方法的别名，保持向后兼容
   */
  async resolve (resourceUrl) {
    return await this.resolveResource(resourceUrl)
  }

  /**
   * 获取协议的注册表信息
   */
  getProtocolRegistry (protocol) {
    if (!this.registry) {
      throw new Error('ResourceManager未初始化')
    }

    const protocolConfig = this.registry.protocols[protocol]
    return protocolConfig ? protocolConfig.registry : null
  }

  /**
   * 获取所有已注册的协议
   */
  getAvailableProtocols () {
    return this.registry ? Object.keys(this.registry.protocols) : []
  }

  /**
   * 获取协议的描述信息
   */
  getProtocolInfo (protocol) {
    if (!this.registry) {
      throw new Error('ResourceManager未初始化')
    }

    const handler = this.protocolHandlers.get(protocol)
    if (handler && typeof handler.getProtocolInfo === 'function') {
      return handler.getProtocolInfo()
    }

    const protocolConfig = this.registry.protocols[protocol]
    if (protocolConfig) {
      return {
        name: protocol,
        ...protocolConfig
      }
    }

    return null
  }

  /**
   * 发现用户资源
   * @returns {Promise<Object>} 用户资源注册表
   */
  async discoverUserResources() {
    try {
      const PackageProtocol = require('./protocols/PackageProtocol')
      const packageProtocol = new PackageProtocol()
      const packageRoot = await packageProtocol.getPackageRoot()
      
      const userResourcePath = path.join(packageRoot, USER_RESOURCE_DIR, ...RESOURCE_DOMAIN_PATH)
      
      // 检查用户资源目录是否存在
      if (!await fs.pathExists(userResourcePath)) {
        return {}
      }
      
      return await this.scanResourceDirectory(userResourcePath)
    } catch (error) {
      // 出错时返回空对象，不抛出异常
      logger.warn(`用户资源发现失败: ${error.message}`)
      return {}
    }
  }

  /**
   * 扫描资源目录
   * @param {string} basePath - 基础路径
   * @returns {Promise<Object>} 发现的资源
   */
  async scanResourceDirectory(basePath) {
    const resources = {}
    
    try {
      const directories = await fs.readdir(basePath)
      
      for (const roleDir of directories) {
        const rolePath = path.join(basePath, roleDir)
        
        try {
          const stat = await fs.stat(rolePath)
          
          if (stat.isDirectory()) {
            // 扫描角色文件
            await this.scanRoleResources(rolePath, roleDir, resources)
            
            // 扫描其他资源类型（thought, execution）
            await this.scanOtherResources(rolePath, roleDir, resources)
          }
        } catch (dirError) {
          // 跳过无法访问的目录
          logger.debug(`跳过目录 ${roleDir}: ${dirError.message}`)
        }
      }
    } catch (error) {
      logger.warn(`扫描资源目录失败 ${basePath}: ${error.message}`)
    }
    
    return resources
  }

  /**
   * 扫描角色资源
   * @param {string} rolePath - 角色目录路径
   * @param {string} roleId - 角色ID
   * @param {Object} resources - 资源容器
   */
  async scanRoleResources(rolePath, roleId, resources) {
    const roleFile = path.join(rolePath, `${roleId}.role.md`)
    
    if (await fs.pathExists(roleFile)) {
      try {
        const content = await fs.readFile(roleFile, 'utf8')
        
        // 验证DPML格式
        if (this.validateDPMLFormat(content, 'role')) {
          const name = this.extractRoleName(content)
          
          if (!resources.role) resources.role = {}
          resources.role[roleId] = {
            file: roleFile,
            name: name || roleId,
            source: 'user-generated',
            format: 'dpml',
            type: 'role'
          }
        }
      } catch (error) {
        // 忽略单个文件的错误
      }
    }
  }

  /**
   * 扫描其他资源类型
   * @param {string} rolePath - 角色目录路径
   * @param {string} roleId - 角色ID
   * @param {Object} resources - 资源容器
   */
  async scanOtherResources(rolePath, roleId, resources) {
    for (const resourceType of SUPPORTED_RESOURCE_TYPES.filter(type => type !== 'role')) {
      const resourceDir = path.join(rolePath, resourceType)
      
      if (await fs.pathExists(resourceDir)) {
        try {
          const files = await fs.readdir(resourceDir)
          
          for (const file of files) {
            if (file.endsWith(`.${resourceType}.md`)) {
              const resourceName = file.replace(`.${resourceType}.md`, '')
              const filePath = path.join(resourceDir, file)
              const content = await fs.readFile(filePath, 'utf8')
              
              if (this.validateDPMLFormat(content, resourceType)) {
                if (!resources[resourceType]) resources[resourceType] = {}
                resources[resourceType][resourceName] = {
                  file: filePath,
                  name: resourceName,
                  source: 'user-generated',
                  format: 'dpml',
                  type: resourceType
                }
              }
            }
          }
        } catch (error) {
          logger.debug(`扫描${resourceType}资源失败: ${error.message}`)
        }
      }
    }
  }

  /**
   * 验证DPML格式
   * @param {string} content - 文件内容
   * @param {string} type - 资源类型
   * @returns {boolean} 是否为有效格式
   */
  validateDPMLFormat(content, type) {
    const tags = DPML_TAGS[type]
    if (!tags) {
      return false
    }
    
    return content.includes(tags.start) && content.includes(tags.end)
  }

  /**
   * 从角色内容中提取名称
   * @param {string} content - 角色文件内容
   * @returns {string} 角色名称
   */
  extractRoleName(content) {
    // 简单的名称提取逻辑
    const match = content.match(/#\s*([^\n]+)/)
    return match ? match[1].trim() : null
  }

  /**
   * 加载系统资源注册表（兼容现有方法）
   * @returns {Promise<Object>} 系统资源注册表
   */
  async loadSystemRegistry() {
    const registryPath = path.resolve(__dirname, '../../../resource.registry.json')

    if (!await fs.pathExists(registryPath)) {
      throw new Error(`统一资源注册表文件不存在: ${registryPath}`)
    }

    return await fs.readJSON(registryPath)
  }
}

module.exports = ResourceManager
