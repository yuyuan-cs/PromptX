const BaseDiscovery = require('./BaseDiscovery')
const fs = require('fs-extra')
const path = require('path')
const CrossPlatformFileScanner = require('./CrossPlatformFileScanner')

/**
 * ProjectDiscovery - 项目级资源发现器
 * 
 * 负责发现项目本地的资源：
 * 1. 扫描 .promptx/resource/ 目录
 * 2. 发现用户自定义的角色、执行模式、思维模式等
 * 
 * 优先级：2
 */
class ProjectDiscovery extends BaseDiscovery {
  constructor() {
    super('PROJECT', 2)
    this.fileScanner = new CrossPlatformFileScanner()
  }

  /**
   * 发现项目级资源
   * @returns {Promise<Array>} 发现的资源列表
   */
  async discover() {
    try {
      // 1. 查找项目根目录
      const projectRoot = await this._findProjectRoot()
      
      // 2. 检查.promptx目录是否存在
      const hasPrompxDir = await this._checkPrompxDirectory(projectRoot)
      if (!hasPrompxDir) {
        return []
      }

      // 3. 扫描项目资源
      const resources = await this._scanProjectResources(projectRoot)

      // 4. 规范化所有资源
      return resources.map(resource => this.normalizeResource(resource))

    } catch (error) {
      console.warn(`[ProjectDiscovery] Discovery failed: ${error.message}`)
      return []
    }
  }

  /**
   * 发现项目级资源注册表 (新架构方法)
   * @returns {Promise<Map>} 发现的资源注册表 Map<resourceId, reference>
   */
  async discoverRegistry() {
    try {
      // 1. 查找项目根目录
      const projectRoot = await this._findProjectRoot()
      
      // 2. 检查.promptx目录是否存在
      const hasPrompxDir = await this._checkPrompxDirectory(projectRoot)
      if (!hasPrompxDir) {
        return new Map()
      }

      // 3. 扫描项目资源
      const resources = await this._scanProjectResources(projectRoot)

      // 4. 构建注册表
      return this._buildRegistryFromResources(resources)

    } catch (error) {
      console.warn(`[ProjectDiscovery] Registry discovery failed: ${error.message}`)
      return new Map()
    }
  }

  /**
   * 从资源列表构建注册表
   * @param {Array} resources - 资源列表
   * @returns {Map} 资源注册表 Map<resourceId, reference>
   */
  _buildRegistryFromResources(resources) {
    const registry = new Map()

    for (const resource of resources) {
      if (resource.id && resource.reference) {
        registry.set(resource.id, resource.reference)
      }
    }

    return registry
  }

  /**
   * 查找项目根目录
   * @returns {Promise<string>} 项目根目录路径
   */
  async _findProjectRoot() {
    const cacheKey = 'projectRoot'
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return cached
    }

    let currentDir = process.cwd()

    // 向上查找包含package.json的目录
    while (currentDir !== path.dirname(currentDir)) {
      const packageJsonPath = path.join(currentDir, 'package.json')
      
      if (await this._fsExists(packageJsonPath)) {
        this.setCache(cacheKey, currentDir)
        return currentDir
      }
      
      currentDir = path.dirname(currentDir)
    }

    // 如果没找到package.json，返回当前工作目录
    const fallbackRoot = process.cwd()
    this.setCache(cacheKey, fallbackRoot)
    return fallbackRoot
  }

  /**
   * 检查.promptx目录是否存在
   * @param {string} projectRoot - 项目根目录
   * @returns {Promise<boolean>} 是否存在.promptx/resource目录
   */
  async _checkPrompxDirectory(projectRoot) {
    const promptxResourcePath = path.join(projectRoot, '.promptx', 'resource')
    return await this._fsExists(promptxResourcePath)
  }

  /**
   * 扫描项目资源
   * @param {string} projectRoot - 项目根目录
   * @returns {Promise<Array>} 扫描发现的资源列表
   */
  async _scanProjectResources(projectRoot) {
    try {
      const resourcesDir = path.join(projectRoot, '.promptx', 'resource')
      const resources = []

      // 定义要扫描的资源类型
      const resourceTypes = ['role', 'execution', 'thought', 'knowledge']

      // 并行扫描所有资源类型
      for (const resourceType of resourceTypes) {
        try {
          const files = await this.fileScanner.scanResourceFiles(resourcesDir, resourceType)
          
          for (const filePath of files) {
            // 验证文件内容
            const isValid = await this._validateResourceFile(filePath, resourceType)
            if (!isValid) {
              continue
            }

            const suffix = `.${resourceType}.md`
            const id = this._extractResourceId(filePath, resourceType, suffix)
            const reference = this._generateProjectReference(filePath, projectRoot)

            resources.push({
              id: id,
              reference: reference
            })
          }
        } catch (error) {
          console.warn(`[ProjectDiscovery] Failed to scan ${resourceType} resources: ${error.message}`)
        }
      }

      return resources
    } catch (error) {
      console.warn(`[ProjectDiscovery] Failed to scan project resources: ${error.message}`)
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
   * 文件系统存在性检查（可以被测试mock）
   * @param {string} filePath - 文件路径
   * @returns {Promise<boolean>} 文件是否存在
   */
  async _fsExists(filePath) {
    return await fs.pathExists(filePath)
  }

  /**
   * 读取文件内容（可以被测试mock）
   * @param {string} filePath - 文件路径
   * @returns {Promise<string>} 文件内容
   */
  async _readFile(filePath) {
    return await fs.readFile(filePath, 'utf8')
  }

  /**
   * 验证资源文件格式
   * @param {string} filePath - 文件路径
   * @param {string} protocol - 协议类型
   * @returns {Promise<boolean>} 是否是有效的资源文件
   */
  async _validateResourceFile(filePath, protocol) {
    try {
      const content = await this._readFile(filePath)

      if (!content || typeof content !== 'string') {
        return false
      }

      const trimmedContent = content.trim()
      if (trimmedContent.length === 0) {
        return false
      }

      // 根据协议类型验证DPML标签
      switch (protocol) {
        case 'role':
          return trimmedContent.includes('<role>') && trimmedContent.includes('</role>')
        case 'execution':
          return trimmedContent.includes('<execution>') && trimmedContent.includes('</execution>')
        case 'thought':
          return trimmedContent.includes('<thought>') && trimmedContent.includes('</thought>')
        case 'knowledge':
          // knowledge类型比较灵活，只要文件有内容就认为是有效的
          // 可以是纯文本、链接、图片等任何形式的知识内容
          return true
        default:
          return false
      }
    } catch (error) {
      console.warn(`[ProjectDiscovery] Failed to validate ${filePath}: ${error.message}`)
      return false
    }
  }

  /**
   * 生成项目引用路径
   * @param {string} filePath - 文件绝对路径
   * @param {string} projectRoot - 项目根目录
   * @returns {string} @project://相对路径
   */
  _generateProjectReference(filePath, projectRoot) {
    const relativePath = this.fileScanner.getRelativePath(projectRoot, filePath)
    return `@project://${relativePath}`
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

module.exports = ProjectDiscovery