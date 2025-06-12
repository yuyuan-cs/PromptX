const ResourceProtocol = require('./ResourceProtocol')
const fs = require('fs-extra')
const path = require('path')

/**
 * 知识资源协议处理器
 * 处理 knowledge:// 协议的资源解析
 */
class KnowledgeProtocol extends ResourceProtocol {
  constructor () {
    super('knowledge')
    this.registry = {}
    this.registryManager = null // 统一注册表管理器
  }

  /**
   * 设置注册表管理器
   */
  setRegistryManager(manager) {
    this.registryManager = manager
  }

  /**
   * 设置注册表
   */
  setRegistry (registry) {
    this.registry = registry || {}
  }

  /**
   * 获取协议信息
   */
  getProtocolInfo () {
    return {
      name: 'knowledge',
      description: '知识资源协议',
      location: 'knowledge://{knowledge_id}',
      examples: [
        'knowledge://xiaohongshu-marketing',
        'knowledge://ai-tools-guide'
      ]
    }
  }

  /**
   * 解析资源路径
   */
  async resolvePath (resourcePath, queryParams) {
    const knowledgeId = resourcePath.trim()
    const fullResourceId = `knowledge:${knowledgeId}`

    // 优先使用统一注册表管理器
    if (this.registryManager) {
      const reference = this.registryManager.registry.get(fullResourceId)
      if (!reference) {
        const availableKnowledge = this.registryManager.registry.keys()
          .filter(id => id.startsWith('knowledge:'))
          .map(id => id.replace('knowledge:', ''))
        throw new Error(`知识资源 "${knowledgeId}" 未在注册表中找到。可用知识资源：${availableKnowledge.join(', ')}`)
      }

      let resolvedPath = reference

      // 处理 @package:// 前缀
      if (resolvedPath.startsWith('@package://')) {
        const PackageProtocol = require('./PackageProtocol')
        const packageProtocol = new PackageProtocol()
        const relativePath = resolvedPath.replace('@package://', '')
        resolvedPath = await packageProtocol.resolvePath(relativePath)
      } else if (resolvedPath.startsWith('@project://')) {
        // 处理 @project:// 前缀，转换为绝对路径
        const relativePath = resolvedPath.replace('@project://', '')
        resolvedPath = path.join(process.cwd(), relativePath)
      }

      return resolvedPath
    }

    // 向后兼容：使用旧的registry
    if (!this.registry[knowledgeId]) {
      throw new Error(`知识资源 "${knowledgeId}" 未在注册表中找到`)
    }

    let resolvedPath = this.registry[knowledgeId]

    // 处理 @package:// 前缀
    if (resolvedPath.startsWith('@package://')) {
      const PackageProtocol = require('./PackageProtocol')
      const packageProtocol = new PackageProtocol()
      const relativePath = resolvedPath.replace('@package://', '')
      resolvedPath = await packageProtocol.resolvePath(relativePath)
    } else if (resolvedPath.startsWith('@project://')) {
      // 处理 @project:// 前缀，转换为绝对路径
      const relativePath = resolvedPath.replace('@project://', '')
      resolvedPath = path.join(process.cwd(), relativePath)
    }

    return resolvedPath
  }

  /**
   * 加载资源内容
   */
  async loadContent (resolvedPath, queryParams) {
    try {
      const content = await fs.readFile(resolvedPath, 'utf-8')
      return content
    } catch (error) {
      throw new Error(`无法加载知识资源文件 ${resolvedPath}: ${error.message}`)
    }
  }

  /**
   * 验证资源路径
   */
  validatePath (resourcePath) {
    return /^[a-zA-Z0-9_-]+$/.test(resourcePath)
  }
}

module.exports = KnowledgeProtocol 