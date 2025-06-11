const ResourceProtocol = require('./ResourceProtocol')
const fs = require('fs-extra')
const path = require('path')

/**
 * 思维模式协议处理器
 * 处理 thought:// 协议的资源解析
 */
class ThoughtProtocol extends ResourceProtocol {
  constructor () {
    super('thought')
    this.registry = {}
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
      name: 'thought',
      description: '思维模式资源协议',
      location: 'thought://{thought_id}',
      examples: [
        'thought://prompt-developer',
        'thought://product-owner'
      ]
    }
  }

  /**
   * 解析资源路径
   */
  async resolvePath (resourcePath, queryParams) {
    const thoughtId = resourcePath.trim()

    if (!this.registry[thoughtId]) {
      throw new Error(`思维模式 "${thoughtId}" 未在注册表中找到`)
    }

    let resolvedPath = this.registry[thoughtId]

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
      throw new Error(`无法加载思维模式文件 ${resolvedPath}: ${error.message}`)
    }
  }

  /**
   * 验证资源路径
   */
  validatePath (resourcePath) {
    return /^[a-zA-Z0-9_-]+$/.test(resourcePath)
  }
}

module.exports = ThoughtProtocol
