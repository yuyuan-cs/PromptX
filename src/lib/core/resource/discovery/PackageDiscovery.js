const BaseDiscovery = require('./BaseDiscovery')
const fs = require('fs-extra')
const path = require('path')
const CrossPlatformFileScanner = require('./CrossPlatformFileScanner')

/**
 * PackageDiscovery - 包级资源发现器
 * 
 * 负责发现NPM包内的资源：
 * 1. 从 src/resource.registry.json 加载静态注册表
 * 2. 扫描 prompt/ 目录发现动态资源
 * 
 * 优先级：1 (最高优先级)
 */
class PackageDiscovery extends BaseDiscovery {
  constructor() {
    super('PACKAGE', 1)
    this.fileScanner = new CrossPlatformFileScanner()
  }

  /**
   * 发现包级资源 (新架构 - 纯动态扫描)
   * @returns {Promise<Array>} 发现的资源列表
   */
  async discover() {
    const resources = []

    try {
      // 扫描prompt目录资源（新架构只使用动态扫描）
      const scanResources = await this._scanPromptDirectory()
      resources.push(...scanResources)

      // 规范化所有资源
      return resources.map(resource => this.normalizeResource(resource))

    } catch (error) {
      console.warn(`[PackageDiscovery] Discovery failed: ${error.message}`)
      return []
    }
  }

  /**
   * 发现包级资源注册表 (新架构 - 纯动态扫描)
   * @returns {Promise<Map>} 发现的资源注册表 Map<resourceId, reference>
   */
  async discoverRegistry() {
    try {
      // 扫描动态资源（新架构只使用动态扫描）
      const scanResults = await this._scanPromptDirectory()
      const registry = this._buildRegistryFromScanResults(scanResults)

      return registry

    } catch (error) {
      console.warn(`[PackageDiscovery] Registry discovery failed: ${error.message}`)
      return new Map()
    }
  }



  /**
   * 从扫描结果构建Map
   * @param {Array} scanResults - 扫描结果数组
   * @returns {Map} 资源注册表 Map<resourceId, reference>
   */
  _buildRegistryFromScanResults(scanResults) {
    const registry = new Map()

    for (const resource of scanResults) {
      if (resource.id && resource.reference) {
        registry.set(resource.id, resource.reference)
      }
    }

    return registry
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
      const resourceTypes = ['role', 'execution', 'thought', 'knowledge']

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
      console.warn(`[PackageDiscovery] Failed to scan prompt directory: ${error.message}`)
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
    // 1. 检查是否在开发环境
    if (await this._isDevelopmentMode()) {
      return 'development'
    }

    // 2. 检查是否通过npx执行
    if (this._isNpxExecution()) {
      return 'npx'
    }

    // 3. 检查是否在node_modules中安装
    if (this._isLocalInstallation()) {
      return 'local'
    }

    return 'unknown'
  }

  /**
   * 检查是否在开发模式
   * @returns {Promise<boolean>} 是否为开发模式
   */
  async _isDevelopmentMode() {
    const cwd = process.cwd()
    const hasCliScript = await fs.pathExists(path.join(cwd, 'src', 'bin', 'promptx.js'))
    const hasPackageJson = await fs.pathExists(path.join(cwd, 'package.json'))
    
    if (!hasCliScript || !hasPackageJson) {
      return false
    }

    try {
      const packageJson = await fs.readJSON(path.join(cwd, 'package.json'))
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
    const cwd = process.cwd()
    const hasPackageJson = await fs.pathExists(path.join(cwd, 'package.json'))
    const hasPromptDir = await fs.pathExists(path.join(cwd, 'prompt'))

    if (!hasPackageJson || !hasPromptDir) {
      return null
    }

    try {
      const packageJson = await fs.readJSON(path.join(cwd, 'package.json'))
      if (packageJson.name === 'dpml-prompt') {
        return fs.realpathSync(cwd) // 解析符号链接
      }
    } catch (error) {
      // Ignore JSON parsing errors
    }

    return null
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
      const resolve = require('resolve')
      const packageJsonPath = resolve.sync('dpml-prompt/package.json', {
        basedir: process.cwd()
      })
      return path.dirname(packageJsonPath)
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
}

module.exports = PackageDiscovery