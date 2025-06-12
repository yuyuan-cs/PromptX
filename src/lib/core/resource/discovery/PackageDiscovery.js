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
   * 发现包级资源
   * @returns {Promise<Array>} 发现的资源列表
   */
  async discover() {
    const resources = []

    try {
      // 1. 加载静态注册表资源
      const registryResources = await this._loadStaticRegistryResources()
      resources.push(...registryResources)

      // 2. 扫描prompt目录资源
      const scanResources = await this._scanPromptDirectory()
      resources.push(...scanResources)

      // 3. 规范化所有资源
      return resources.map(resource => this.normalizeResource(resource))

    } catch (error) {
      console.warn(`[PackageDiscovery] Discovery failed: ${error.message}`)
      return []
    }
  }

  /**
   * 从静态注册表加载资源
   * @returns {Promise<Array>} 注册表中的资源列表
   */
  async _loadStaticRegistryResources() {
    try {
      const registry = await this._loadStaticRegistry()
      const resources = []

      if (registry.protocols) {
        // 遍历所有协议
        for (const [protocol, protocolInfo] of Object.entries(registry.protocols)) {
          if (protocolInfo.registry) {
            // 遍历协议下的所有资源
            for (const [resourceId, resourceInfo] of Object.entries(protocolInfo.registry)) {
              const reference = typeof resourceInfo === 'string' 
                ? resourceInfo 
                : resourceInfo.file

              if (reference) {
                resources.push({
                  id: `${protocol}:${resourceId}`,
                  reference: reference
                })
              }
            }
          }
        }
      }

      return resources
    } catch (error) {
      console.warn(`[PackageDiscovery] Failed to load static registry: ${error.message}`)
      return []
    }
  }

  /**
   * 加载静态注册表文件
   * @returns {Promise<Object>} 注册表内容
   */
  async _loadStaticRegistry() {
    const packageRoot = await this._findPackageRoot()
    const registryPath = path.join(packageRoot, 'src', 'resource.registry.json')

    if (!await fs.pathExists(registryPath)) {
      throw new Error('Static registry file not found')
    }

    return await fs.readJSON(registryPath)
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
      const resourceTypes = ['role', 'execution', 'thought']

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
   * 查找包根目录
   * @returns {Promise<string>} 包根目录路径
   */
  async _findPackageRoot() {
    const cacheKey = 'packageRoot'
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return cached
    }

    const packageRoot = await this._findPackageJsonWithPrompt()
    if (!packageRoot) {
      throw new Error('Package root with prompt directory not found')
    }

    this.setCache(cacheKey, packageRoot)
    return packageRoot
  }

  /**
   * 查找包含prompt目录的package.json
   * @returns {Promise<string|null>} 包根目录路径或null
   */
  async _findPackageJsonWithPrompt() {
    let currentDir = __dirname

    while (currentDir !== path.parse(currentDir).root) {
      const packageJsonPath = path.join(currentDir, 'package.json')
      const promptDirPath = path.join(currentDir, 'prompt')

      // 检查是否同时存在package.json和prompt目录
      const [hasPackageJson, hasPromptDir] = await Promise.all([
        fs.pathExists(packageJsonPath),
        fs.pathExists(promptDirPath)
      ])

      if (hasPackageJson && hasPromptDir) {
        // 验证是否是PromptX包
        try {
          const packageJson = await fs.readJSON(packageJsonPath)
          if (packageJson.name === 'promptx' || packageJson.name === 'dpml-prompt') {
            return currentDir
          }
        } catch (error) {
          // 忽略package.json读取错误
        }
      }

      currentDir = path.dirname(currentDir)
    }

    return null
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