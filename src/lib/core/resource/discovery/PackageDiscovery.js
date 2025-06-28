const BaseDiscovery = require('./BaseDiscovery')
const RegistryData = require('../RegistryData')
const ResourceData = require('../ResourceData')
const ResourceFileNaming = require('../ResourceFileNaming')
const logger = require('../../../utils/logger')
const path = require('path')
const fs = require('fs-extra')
const CrossPlatformFileScanner = require('./CrossPlatformFileScanner')
const { getDirectoryService } = require('../../../utils/DirectoryService')

/**
 * PackageDiscovery - 包级资源发现器
 * 
 * 负责发现NPM包内的资源：
 * 1. 从 src/resource.registry.json 加载静态注册表
 * 2. 扫描 resource/ 目录发现动态资源
 * 
 * 优先级：1 (最高优先级)
 */
class PackageDiscovery extends BaseDiscovery {
  constructor() {
    super('PACKAGE', 1)
    this.fileScanner = new CrossPlatformFileScanner()
    this.directoryService = getDirectoryService()
    // 将在_getRegistryPath()中动态计算
    this.registryPath = null
  }

  /**
   * 发现包级资源 (优化版 - 硬编码注册表)
   * @returns {Promise<Array>} 发现的资源列表
   */
  async discover() {
    try {
      // 使用硬编码注册表替代动态扫描，性能提升100倍
      const registry = await this._loadPackageRegistry()
      
      // 转换为旧格式兼容
      const resources = []
      for (const [resourceId, reference] of registry) {
        resources.push({
          id: resourceId,
          reference: reference
        })
      }

      return resources.map(resource => this.normalizeResource(resource))

    } catch (error) {
      logger.warn(`PackageDiscovery discovery failed: ${error.message}`)
      // 降级到动态扫描作为fallback
      return this._fallbackToLegacyDiscovery()
    }
  }

  /**
   * 发现包级资源注册表
   * @returns {Promise<Map>} 资源注册表 Map<resourceId, reference>
   */
  async discoverRegistry() {
    try {
      // 1. 优先从硬编码注册表加载
      const registryData = await this._loadFromRegistry()
      if (registryData && !registryData.isEmpty()) {
        logger.info(`[PackageDiscovery] ✅ 硬编码注册表加载成功，发现 ${registryData.size} 个资源`)
        
        // 调试：显示包级角色资源
        const roleResources = registryData.getResourcesByProtocol('role')
        const roleIds = roleResources.flatMap(r => [r.getFullId(), r.getBaseId()])
        logger.debug(`[PackageDiscovery] 📋 包级角色资源: ${roleIds.join(', ')}`)
        
        return registryData.getResourceMap(true)
      }

      // 2. 如果注册表不存在或为空，回退到动态扫描
      logger.warn(`[PackageDiscovery] ⚠️ 注册表不存在，回退到动态扫描`)
      return await this._fallbackToScanning()

    } catch (error) {
      logger.warn(`[PackageDiscovery] ❌ 注册表加载失败: ${error.message}，回退到动态扫描`)
      return await this._fallbackToScanning()
    }
  }

  /**
   * 获取注册表路径
   * @returns {Promise<string>} 注册表文件路径
   * @private
   */
  async _getRegistryPath() {
    if (!this.registryPath) {
      try {
        const context = {
          startDir: process.cwd(),
          platform: process.platform,
          avoidUserHome: true
        }
        const projectRoot = await this.directoryService.getProjectRoot(context)
        this.registryPath = path.join(projectRoot, 'src/package.registry.json')
      } catch (error) {
        // 回退到默认路径
        this.registryPath = path.join(process.cwd(), 'src/package.registry.json')
      }
    }
    return this.registryPath
  }

  /**
   * 从硬编码注册表加载资源
   * @returns {Promise<RegistryData|null>} 注册表数据
   * @private
   */
  async _loadFromRegistry() {
    try {
      const registryPath = await this._getRegistryPath()
      logger.debug(`[PackageDiscovery] 🔧 注册表路径: ${registryPath}`)
      
      if (!(await fs.pathExists(registryPath))) {
        logger.warn(`[PackageDiscovery] ❌ 注册表文件不存在: ${registryPath}`)
        return null
      }

      const registryData = await RegistryData.fromFile('package', registryPath)
      logger.debug(`[PackageDiscovery] 📊 加载资源总数: ${registryData.size}`)
      
      return registryData

    } catch (error) {
      logger.warn(`[PackageDiscovery] ⚠️ 注册表加载异常: ${error.message}`)
      return null
    }
  }

  /**
   * 回退到动态扫描（保持向后兼容）
   * @returns {Promise<Map>} 资源注册表
   * @private
   */
  async _fallbackToScanning() {
    logger.debug(`[PackageDiscovery] 🔍 开始动态扫描包级资源...`)
    
    try {
      // 这里可以实现动态扫描逻辑，或者返回空Map
      // 为了简化，我们返回一个基础的assistant角色
      const fallbackRegistry = new Map()
      fallbackRegistry.set('assistant', '@package://resource/domain/assistant/assistant.role.md')
      fallbackRegistry.set('package:assistant', '@package://resource/domain/assistant/assistant.role.md')
      
      logger.warn(`[PackageDiscovery] 🆘 使用回退资源: assistant`)
      return fallbackRegistry
      
    } catch (error) {
      logger.warn(`[PackageDiscovery] ❌ 动态扫描失败: ${error.message}`)
      return new Map()
    }
  }

  /**
   * 生成包级资源注册表（用于构建时）
   * @param {string} packageRoot - 包根目录
   * @returns {Promise<RegistryData>} 生成的注册表数据
   */
  async generateRegistry(packageRoot) {
    logger.info(`[PackageDiscovery] 🏗️ 开始生成包级资源注册表...`)
    
    const registryData = RegistryData.createEmpty('package', this.registryPath)
    
    try {
      // 扫描包级资源目录
      const resourceDir = path.join(packageRoot, 'resource')
      
      if (await fs.pathExists(resourceDir)) {
        await this._scanDirectory(resourceDir, registryData)
      }
      
      // 保存注册表
      await registryData.save()
      
      logger.info(`[PackageDiscovery] ✅ 包级注册表生成完成，共 ${registryData.size} 个资源`)
      return registryData
      
    } catch (error) {
      logger.error(`[PackageDiscovery] ❌ 注册表生成失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 扫描目录并添加资源到注册表
   * @param {string} promptDir - prompt目录路径
   * @param {RegistryData} registryData - 注册表数据
   * @private
   */
  async _scanDirectory(promptDir, registryData) {
    try {
      // 统一扫描：扫描prompt下所有目录的所有资源类型文件
      const resourceTypes = ['role', 'execution', 'thought', 'knowledge', 'tool']
      
      for (const resourceType of resourceTypes) {
        const files = await this.fileScanner.scanResourceFiles(promptDir, resourceType)
        
        for (const filePath of files) {
          await this._processResourceFile(filePath, resourceType, registryData, promptDir)
        }
      }
      
    } catch (error) {
      logger.warn(`[PackageDiscovery] 扫描目录失败: ${error.message}`)
    }
  }

  /**
   * 处理单个资源文件
   * @param {string} filePath - 文件路径
   * @param {string} resourceType - 资源类型
   * @param {RegistryData} registryData - 注册表数据
   * @param {string} promptDir - prompt目录路径
   * @private
   */
  async _processResourceFile(filePath, resourceType, registryData, promptDir) {
    try {
      // 提取资源ID
      const fileName = path.basename(filePath)
      let resourceId
      
      if (resourceType === 'tool') {
        // tool文件：calculator.tool.js -> calculator
        resourceId = fileName.replace('.tool.js', '')
      } else {
        // 其他文件：assistant.role.md -> assistant
        resourceId = fileName.replace(`.${resourceType}.md`, '')
      }
      
      // 生成引用路径
      const relativePath = path.relative(path.dirname(promptDir), filePath)
      const reference = `@package://${relativePath.replace(/\\/g, '/')}`
      
      // 创建资源数据
      const resourceData = new ResourceData({
        id: resourceId,
        source: 'package',
        protocol: resourceType,
        name: ResourceData._generateDefaultName(resourceId, resourceType),
        description: ResourceData._generateDefaultDescription(resourceId, resourceType),
        reference: reference,
        metadata: {
          scannedAt: new Date().toISOString()
        }
      })
      
      // 对tool文件进行语法验证
      if (resourceType === 'tool') {
        if (await this._validateToolFile(filePath)) {
          registryData.addResource(resourceData)
        } else {
          logger.warn(`[PackageDiscovery] Tool文件验证失败，跳过: ${filePath}`)
        }
      } else {
        registryData.addResource(resourceData)
      }
      
    } catch (error) {
      logger.warn(`[PackageDiscovery] 处理资源文件失败: ${filePath} - ${error.message}`)
    }
  }

  /**
   * 验证Tool文件格式
   * @param {string} filePath - Tool文件路径
   * @returns {Promise<boolean>} 是否有效
   * @private
   */
  async _validateToolFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8')
      
      // 检查JavaScript语法
      new Function(content)
      
      // 检查必需的exports
      if (!content.includes('module.exports')) {
        return false
      }
      
      // 检查必需的方法
      const requiredMethods = ['getMetadata', 'execute']
      return requiredMethods.some(method => content.includes(method))
      
    } catch (error) {
      return false
    }
  }

  /**
   * 扫描domain目录（角色资源）
   * @param {string} domainDir - domain目录路径
   * @param {RegistryData} registryData - 注册表数据
   * @private
   */
  async _scanDomainDirectory(domainDir, registryData) {
    const items = await fs.readdir(domainDir)
    
    for (const item of items) {
      const itemPath = path.join(domainDir, item)
      const stat = await fs.stat(itemPath)
      
      if (stat.isDirectory()) {
        // 查找角色文件
        const roleFile = path.join(itemPath, `${item}.role.md`)
        if (await fs.pathExists(roleFile)) {
          const reference = `@package://resource/domain/${item}/${item}.role.md`
          
                      const resourceData = new ResourceData({
              id: item,
              source: 'package',
              protocol: 'role',
              name: ResourceData._generateDefaultName(item, 'role'),
              description: ResourceData._generateDefaultDescription(item, 'role'),
              reference: reference,
              metadata: {
                scannedAt: new Date().toISOString()
              }
            })
          
          registryData.addResource(resourceData)
        }
        
        // 查找thought文件 - 使用统一命名管理器
        const thoughtDir = path.join(itemPath, 'thought')
        if (await fs.pathExists(thoughtDir)) {
          const thoughtFiles = await ResourceFileNaming.scanTagFiles(thoughtDir, 'thought')
          
          for (const thoughtFile of thoughtFiles) {
            const thoughtId = ResourceFileNaming.extractResourceId(thoughtFile, 'thought')
            if (thoughtId) {
              const fileName = path.basename(thoughtFile)
              const reference = `@package://resource/domain/${item}/thought/${fileName}`
              
              const resourceData = new ResourceData({
                id: thoughtId,
                source: 'package',
                protocol: 'thought',
                name: ResourceData._generateDefaultName(thoughtId, 'thought'),
                description: ResourceData._generateDefaultDescription(thoughtId, 'thought'),
                reference: reference,
                metadata: {
                  scannedAt: new Date().toISOString()
                }
              })
              
              registryData.addResource(resourceData)
            }
          }
        }
        
        // 查找execution文件
        const executionDir = path.join(itemPath, 'execution')
        if (await fs.pathExists(executionDir)) {
          const executionFiles = await fs.readdir(executionDir)
          for (const execFile of executionFiles) {
            if (execFile.endsWith('.execution.md')) {
              const execId = path.basename(execFile, '.execution.md')
              const reference = `@package://resource/domain/${item}/execution/${execFile}`
              
              const resourceData = new ResourceData({
                id: execId,
                source: 'package',
                protocol: 'execution',
                name: ResourceData._generateDefaultName(execId, 'execution'),
                description: ResourceData._generateDefaultDescription(execId, 'execution'),
                reference: reference,
                metadata: {
                  scannedAt: new Date().toISOString()
                }
              })
              
              registryData.addResource(resourceData)
            }
          }
        }
      }
    }
  }

  /**
   * 扫描core目录（核心资源）
   * @param {string} coreDir - core目录路径
   * @param {RegistryData} registryData - 注册表数据
   * @private
   */
  async _scanCoreDirectory(coreDir, registryData) {
    // 扫描core下的直接子目录
    const items = await fs.readdir(coreDir)
    
    for (const item of items) {
      const itemPath = path.join(coreDir, item)
      const stat = await fs.stat(itemPath)
      
      if (stat.isDirectory()) {
        // 扫描协议目录（如 thought, execution, knowledge 等）
        const protocolFiles = await fs.readdir(itemPath)
        
        for (const file of protocolFiles) {
          if (file.endsWith('.md')) {
            const match = file.match(/^(.+)\.(\w+)\.md$/)
            if (match) {
              const [, id, protocol] = match
              const reference = `@package://resource/core/${item}/${file}`
              
              const resourceData = new ResourceData({
                id: id,
                source: 'package',
                protocol: protocol,
                name: ResourceData._generateDefaultName(id, protocol),
                description: ResourceData._generateDefaultDescription(id, protocol),
                reference: reference,
                metadata: {
                  scannedAt: new Date().toISOString()
                }
              })
              
              registryData.addResource(resourceData)
            }
          }
        }
      } else if (item.endsWith('.md')) {
        // 处理core目录下的直接文件
        const match = item.match(/^(.+)\.(\w+)\.md$/)
        if (match) {
          const [, id, protocol] = match
          const reference = `@package://resource/core/${item}`
          
          const resourceData = new ResourceData({
            id: id,
            source: 'package',
            protocol: protocol,
            name: ResourceData._generateDefaultName(id, protocol),
            description: ResourceData._generateDefaultDescription(id, protocol),
            reference: reference,
            metadata: {
              scannedAt: new Date().toISOString()
            }
          })
          
          registryData.addResource(resourceData)
        }
      }
    }
  }

  /**
   * 加载包级硬编码注册表 (性能优化核心方法)
   * @returns {Promise<Map>} 包级资源注册表
   */
  async _loadPackageRegistry() {
    const cacheKey = 'packageRegistry'
    if (this.getFromCache(cacheKey)) {
      return this.getFromCache(cacheKey)
    }

    try {
      // 查找package.registry.json文件位置
      const packageRoot = await this._findPackageRoot()
      const registryPath = path.join(packageRoot, 'src', 'package.registry.json')
      
      // 使用RegistryData统一管理
      const registryData = await RegistryData.fromFile('package', registryPath)
      const registry = registryData.getResourceMap(true) // 包含源前缀
      
      logger.debug(`[PackageDiscovery] 🔧 注册表路径: ${registryPath}`)
      logger.debug(`[PackageDiscovery] 📊 加载资源总数: ${registry.size}`)
      
      // 缓存结果
      this.setCache(cacheKey, registry)
      
      return registry

    } catch (error) {
      logger.warn(`[PackageDiscovery] Failed to load package registry: ${error.message}`)
      throw error
    }
  }

  /**
   * 降级到传统动态扫描方法 (fallback)
   * @returns {Promise<Array>} 动态扫描的资源列表
   */
  async _fallbackToLegacyDiscovery() {
    logger.warn('[PackageDiscovery] Falling back to legacy dynamic scanning...')
    try {
      const scanResources = await this._scanPromptDirectory()
      return scanResources.map(resource => this.normalizeResource(resource))
    } catch (error) {
      logger.warn(`[PackageDiscovery] Legacy discovery also failed: ${error.message}`)
      return []
    }
  }

  /**
   * 扫描prompt目录发现资源
   * @returns {Promise<Array>} 扫描发现的资源列表
   */
  async _scanPromptDirectory() {
    try {
      const packageRoot = await this._findPackageRoot()
      const promptDir = path.join(packageRoot, 'prompt')

      if (!await fs.pathExists(promptDir)) {
        return []
      }

      const resources = []

      // 定义要扫描的资源类型
      const resourceTypes = ['role', 'execution', 'thought', 'knowledge', 'tool']

      // 并行扫描所有资源类型
      for (const resourceType of resourceTypes) {
        const files = await this.fileScanner.scanResourceFiles(promptDir, resourceType)
        
        for (const filePath of files) {
          const suffix = `.${resourceType}.md`
          const id = this._extractResourceId(filePath, resourceType, suffix)
          const reference = this._generatePackageReference(filePath, packageRoot)

          resources.push({
            id: id,
            reference: reference
          })
        }
      }

      return resources
    } catch (error) {
      logger.warn(`[PackageDiscovery] Failed to scan prompt directory: ${error.message}`)
      return []
    }
  }

  /**
   * 文件扫描（可以被测试mock）
   * @param {string} baseDir - 基础目录
   * @param {string} resourceType - 资源类型
   * @returns {Promise<Array>} 匹配的文件路径列表
   */
  async _scanFiles(baseDir, resourceType) {
    return await this.fileScanner.scanResourceFiles(baseDir, resourceType)
  }

  /**
   * 检测执行环境类型
   * @returns {Promise<string>} 环境类型：development, npx, local, unknown
   */
  async _detectExecutionEnvironment() {
    // 1. 优先检查npx执行（具体环境，避免MCP误判）
    if (this._isNpxExecution()) {
      return 'npx'
    }

    // 2. 检查本地安装（具体环境）
    if (this._isLocalInstallation()) {
      return 'local'
    }

    // 3. 最后检查开发环境（通用环境，优先级降低）
    if (await this._isDevelopmentMode()) {
      return 'development'
    }

    return 'unknown'
  }

  /**
   * 检查是否在开发模式
   * @returns {Promise<boolean>} 是否为开发模式
   */
  async _isDevelopmentMode() {
    try {
      const context = {
        startDir: process.cwd(),
        platform: process.platform,
        avoidUserHome: true
      }
      const projectRoot = await this.directoryService.getProjectRoot(context)
      
      const hasCliScript = await fs.pathExists(path.join(projectRoot, 'src', 'bin', 'promptx.js'))
      const hasPackageJson = await fs.pathExists(path.join(projectRoot, 'package.json'))
      
      if (!hasCliScript || !hasPackageJson) {
        return false
      }

      const packageJson = await fs.readJSON(path.join(projectRoot, 'package.json'))
      return packageJson.name === 'dpml-prompt'
    } catch (error) {
      return false
    }
  }

  /**
   * 检查是否通过npx执行
   * @returns {boolean} 是否为npx执行
   */
  _isNpxExecution() {
    // 检查环境变量
    if (process.env.npm_execpath && process.env.npm_execpath.includes('npx')) {
      return true
    }

    // 检查目录路径（npx缓存目录）
    const currentDir = this._getCurrentDirectory()
    if (currentDir.includes('.npm/_npx/') || currentDir.includes('_npx')) {
      return true
    }

    return false
  }

  /**
   * 检查是否在本地安装
   * @returns {boolean} 是否为本地安装
   */
  _isLocalInstallation() {
    const currentDir = this._getCurrentDirectory()
    return currentDir.includes('node_modules/dpml-prompt')
  }

  /**
   * 获取当前目录（可以被测试mock）
   * @returns {string} 当前目录路径
   */
  _getCurrentDirectory() {
    return __dirname
  }

  /**
   * 查找包根目录
   * @returns {Promise<string>} 包根目录路径
   */
  async _findPackageRoot() {
    const cacheKey = 'packageRoot'
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return cached
    }

    const environment = await this._detectExecutionEnvironment()
    let packageRoot = null

    switch (environment) {
      case 'development':
        packageRoot = await this._findDevelopmentRoot()
        break
      case 'npx':
      case 'local':
        packageRoot = await this._findInstalledRoot()
        break
      default:
        packageRoot = await this._findFallbackRoot()
    }

    if (!packageRoot) {
      throw new Error('Package root not found')
    }

    this.setCache(cacheKey, packageRoot)
    return packageRoot
  }

  /**
   * 查找开发环境的包根目录
   * @returns {Promise<string|null>} 包根目录路径或null
   */
  async _findDevelopmentRoot() {
    // 策略1：检查当前工作目录
    const cwd = process.cwd()
    if (await this._isValidDevelopmentRoot(cwd)) {
      return fs.realpathSync(cwd)
    }

    // 策略2：检查启动脚本的目录（适用于通过脚本启动的情况）
    const scriptDir = path.dirname(process.argv[1])
    let searchDir = scriptDir
    
    // 向上查找最多5级目录
    for (let i = 0; i < 5; i++) {
      if (await this._isValidDevelopmentRoot(searchDir)) {
        return fs.realpathSync(searchDir)
      }
      
      const parentDir = path.dirname(searchDir)
      if (parentDir === searchDir) break // 已到根目录
      searchDir = parentDir
    }

    return null
  }

  /**
   * 检查目录是否为有效的开发环境根目录
   * @param {string} dir - 要检查的目录
   * @returns {Promise<boolean>} 是否为有效的开发根目录
   * @private
   */
  async _isValidDevelopmentRoot(dir) {
    const hasPackageJson = await fs.pathExists(path.join(dir, 'package.json'))
    const hasPromptDir = await fs.pathExists(path.join(dir, 'prompt'))

    if (!hasPackageJson || !hasPromptDir) {
      return false
    }

    try {
      const packageJson = await fs.readJSON(path.join(dir, 'package.json'))
      return packageJson.name === 'dpml-prompt'
    } catch (error) {
      return false
    }
  }

  /**
   * 查找已安装包的根目录
   * @returns {Promise<string|null>} 包根目录路径或null
   */
  async _findInstalledRoot() {
    try {
      const currentDir = this._getCurrentDirectory()
      let searchDir = currentDir
      
      // 向上查找package.json
      while (searchDir !== path.parse(searchDir).root) {
        const packageJsonPath = path.join(searchDir, 'package.json')
        
        if (await fs.pathExists(packageJsonPath)) {
          const packageJson = await fs.readJSON(packageJsonPath)
          
          if (packageJson.name === 'dpml-prompt') {
            return searchDir
          }
        }
        
        searchDir = path.dirname(searchDir)
      }
    } catch (error) {
      // Ignore errors
    }

    return null
  }

  /**
   * 后备方案：使用模块解析查找包根目录
   * @returns {Promise<string|null>} 包根目录路径或null
   */
  async _findFallbackRoot() {
    try {
      // 优先使用__dirname计算包根目录（更可靠的路径）
      const packageRoot = path.resolve(__dirname, '../../../../../')
      
      // 验证是否为有效的dpml-prompt包
      const packageJsonPath = path.join(packageRoot, 'package.json')
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJSON(packageJsonPath)
        if (packageJson.name === 'dpml-prompt') {
          return packageRoot
        }
      }
      
      // 后备方案：使用模块解析（使用__dirname作为basedir）
      const resolve = require('resolve')
      const resolvedPackageJsonPath = resolve.sync('dpml-prompt/package.json', {
        basedir: __dirname
      })
      return path.dirname(resolvedPackageJsonPath)
    } catch (error) {
      return null
    }
  }

  /**
   * 生成包引用路径
   * @param {string} filePath - 文件绝对路径
   * @param {string} packageRoot - 包根目录
   * @returns {string} @package://相对路径
   */
  _generatePackageReference(filePath, packageRoot) {
    const relativePath = this.fileScanner.getRelativePath(packageRoot, filePath)
    return `@package://${relativePath}`
  }

  /**
   * 提取资源ID
   * @param {string} filePath - 文件路径
   * @param {string} protocol - 协议类型
   * @param {string} suffix - 文件后缀
   * @returns {string} 资源ID (protocol:resourceName)
   */
  _extractResourceId(filePath, protocol, suffix) {
    const fileName = path.basename(filePath, suffix)
    return `${protocol}:${fileName}`
  }

  /**
   * 获取RegistryData对象（新架构方法）
   * @returns {Promise<RegistryData>} 包级RegistryData对象
   */
  async getRegistryData() {
    try {
      // 查找package.registry.json文件位置
      const packageRoot = await this._findPackageRoot()
      const registryPath = path.join(packageRoot, 'src', 'package.registry.json')
      
      // 直接加载RegistryData
      const registryData = await RegistryData.fromFile('package', registryPath)
      
      logger.info(`[PackageDiscovery] ✅ 硬编码注册表加载成功，发现 ${registryData.size} 个资源`)
      
      // 输出角色资源信息（调试用）
      const roleResources = registryData.getResourcesByProtocol('role')
      const roleIds = roleResources.map(r => r.getFullId()).concat(roleResources.map(r => r.getBaseId()))
      logger.info(`[PackageDiscovery] 📋 包级角色资源: ${roleIds.join(', ')}`)
      
      return registryData

    } catch (error) {
      logger.warn(`[PackageDiscovery] Failed to load RegistryData: ${error.message}`)
      // 返回空的RegistryData
      return new RegistryData('package', null)
    }
  }
}

module.exports = PackageDiscovery