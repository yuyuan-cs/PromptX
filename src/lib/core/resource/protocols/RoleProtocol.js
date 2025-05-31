const ResourceProtocol = require('./ResourceProtocol')
const fs = require('fs-extra')
const path = require('path')

/**
 * AI角色协议处理器
 * 处理 role:// 协议的资源解析，直接加载完整role文件
 */
class RoleProtocol extends ResourceProtocol {
  constructor () {
    super('role')
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
      name: 'role',
      description: 'AI角色资源协议',
      location: 'role://{role_id}',
      examples: [
        'role://video-copywriter',
        'role://product-owner',
        'role://assistant',
        'role://prompt-developer'
      ]
    }
  }

  /**
   * 解析资源路径
   */
  async resolvePath (resourcePath, queryParams) {
    const roleId = resourcePath.trim()

    if (!this.registry[roleId]) {
      throw new Error(`角色 "${roleId}" 未在注册表中找到。可用角色：${Object.keys(this.registry).join(', ')}`)
    }

    let resolvedPath = this.registry[roleId]

    // 处理 @package:// 前缀
    if (resolvedPath.startsWith('@package://')) {
      resolvedPath = resolvedPath.replace('@package://', '')
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
      throw new Error(`无法加载角色文件 ${resolvedPath}: ${error.message}`)
    }
  }

  /**
   * 验证资源路径
   */
  validatePath (resourcePath) {
    return /^[a-zA-Z0-9_-]+$/.test(resourcePath)
  }
}

module.exports = RoleProtocol
