const PackageDiscovery = require('./PackageDiscovery')
const ProjectDiscovery = require('./ProjectDiscovery')

/**
 * DiscoveryManager - 资源发现管理器
 * 
 * 统一管理多个资源发现器，按照文档架构设计：
 * 1. 按优先级排序发现器 (数字越小优先级越高)
 * 2. 并行执行资源发现
 * 3. 收集并合并所有发现的资源
 * 4. 提供容错机制，单个发现器失败不影响整体
 */
class DiscoveryManager {
  /**
   * 构造函数
   * @param {Array} discoveries - 自定义发现器列表，如果不提供则使用默认配置
   */
  constructor(discoveries = null) {
    if (discoveries) {
      this.discoveries = [...discoveries]
    } else {
      // 默认发现器配置：只包含包级和项目级发现
      this.discoveries = [
        new PackageDiscovery(),  // 优先级: 1
        new ProjectDiscovery()   // 优先级: 2
      ]
    }

    // 按优先级排序
    this._sortDiscoveriesByPriority()
  }

  /**
   * 添加发现器
   * @param {Object} discovery - 实现了发现器接口的对象
   */
  addDiscovery(discovery) {
    if (!discovery || typeof discovery.discover !== 'function') {
      throw new Error('Discovery must implement discover method')
    }

    this.discoveries.push(discovery)
    this._sortDiscoveriesByPriority()
  }

  /**
   * 移除发现器
   * @param {string} source - 发现器源类型
   */
  removeDiscovery(source) {
    this.discoveries = this.discoveries.filter(discovery => discovery.source !== source)
  }

  /**
   * 发现所有资源（并行模式）
   * @returns {Promise<Array>} 所有发现的资源列表
   */
  async discoverAll() {
    const discoveryPromises = this.discoveries.map(async (discovery) => {
      try {
        const resources = await discovery.discover()
        return Array.isArray(resources) ? resources : []
      } catch (error) {
        console.warn(`[DiscoveryManager] ${discovery.source} discovery failed: ${error.message}`)
        return []
      }
    })

    // 并行执行所有发现器
    const discoveryResults = await Promise.allSettled(discoveryPromises)

    // 收集所有成功的结果
    const allResources = []
    discoveryResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allResources.push(...result.value)
      } else {
        console.warn(`[DiscoveryManager] ${this.discoveries[index].source} discovery rejected: ${result.reason}`)
      }
    })

    return allResources
  }

  /**
   * 按源类型发现资源
   * @param {string} source - 发现器源类型
   * @returns {Promise<Array>} 指定源的资源列表
   */
  async discoverBySource(source) {
    const discovery = this._findDiscoveryBySource(source)
    if (!discovery) {
      throw new Error(`Discovery source ${source} not found`)
    }

    return await discovery.discover()
  }

  /**
   * 获取所有发现器信息
   * @returns {Array} 发现器信息列表
   */
  getDiscoveryInfo() {
    return this.discoveries.map(discovery => {
      if (typeof discovery.getDiscoveryInfo === 'function') {
        return discovery.getDiscoveryInfo()
      } else {
        return {
          source: discovery.source || 'UNKNOWN',
          priority: discovery.priority || 0,
          description: 'No description available'
        }
      }
    })
  }

  /**
   * 清理所有发现器缓存
   */
  clearCache() {
    this.discoveries.forEach(discovery => {
      if (typeof discovery.clearCache === 'function') {
        discovery.clearCache()
      }
    })
  }

  /**
   * 获取发现器数量
   * @returns {number} 注册的发现器数量
   */
  getDiscoveryCount() {
    return this.discoveries.length
  }

  /**
   * 按优先级排序发现器
   * @private
   */
  _sortDiscoveriesByPriority() {
    this.discoveries.sort((a, b) => {
      const priorityA = a.priority || 0
      const priorityB = b.priority || 0
      return priorityA - priorityB // 升序排序，数字越小优先级越高
    })
  }

  /**
   * 根据源类型查找发现器
   * @param {string} source - 发现器源类型
   * @returns {Object|undefined} 找到的发现器或undefined
   * @private
   */
  _findDiscoveryBySource(source) {
    return this.discoveries.find(discovery => discovery.source === source)
  }
}

module.exports = DiscoveryManager