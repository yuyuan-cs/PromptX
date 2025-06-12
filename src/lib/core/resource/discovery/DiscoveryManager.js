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
   * 发现资源并直接注册到指定注册表（新的简化方法）
   * @param {ResourceRegistry} registry - 目标注册表
   * @returns {Promise<void>}
   */
  async discoverAndDirectRegister(registry) {
    // 按优先级顺序直接注册，让高优先级的覆盖低优先级的
    for (const discovery of this.discoveries) {
      try {
        if (typeof discovery.discoverRegistry === 'function') {
          // 使用新的discoverRegistry方法
          const discoveredRegistry = await discovery.discoverRegistry()
          if (discoveredRegistry instanceof Map) {
            for (const [resourceId, reference] of discoveredRegistry) {
              registry.register(resourceId, reference)  // 直接注册，自动覆盖
            }
          }
        } else {
          // 向后兼容：使用discover()方法
          const resources = await discovery.discover()
          if (Array.isArray(resources)) {
            resources.forEach(resource => {
              if (resource.id && resource.reference) {
                registry.register(resource.id, resource.reference)  // 直接注册
              }
            })
          }
        }
      } catch (error) {
        console.warn(`[DiscoveryManager] ${discovery.source} direct registration failed: ${error.message}`)
        // 单个发现器失败不影响其他发现器
      }
    }
  }

  /**
   * 发现并合并所有注册表（新架构方法）
   * @returns {Promise<Map>} 合并后的资源注册表 Map<resourceId, reference>
   */
  async discoverRegistries() {
    const registryPromises = this.discoveries.map(async (discovery) => {
      try {
        // 优先使用新的discoverRegistry方法
        if (typeof discovery.discoverRegistry === 'function') {
          const registry = await discovery.discoverRegistry()
          return registry instanceof Map ? registry : new Map()
        } else {
          // 向后兼容：将discover()结果转换为注册表格式
          const resources = await discovery.discover()
          const registry = new Map()
          if (Array.isArray(resources)) {
            resources.forEach(resource => {
              if (resource.id && resource.reference) {
                registry.set(resource.id, resource.reference)
              }
            })
          }
          return registry
        }
      } catch (error) {
        console.warn(`[DiscoveryManager] ${discovery.source} registry discovery failed: ${error.message}`)
        return new Map()
      }
    })

    // 并行执行所有发现器
    const registryResults = await Promise.allSettled(registryPromises)

    // 收集所有成功的注册表
    const registries = []
    registryResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        registries.push(result.value)
      } else {
        console.warn(`[DiscoveryManager] ${this.discoveries[index].source} registry discovery rejected: ${result.reason}`)
        registries.push(new Map())
      }
    })

    // 按发现器优先级合并注册表
    return this._mergeRegistries(registries)
  }

  /**
   * 按源类型发现注册表
   * @param {string} source - 发现器源类型
   * @returns {Promise<Map>} 指定源的资源注册表
   */
  async discoverRegistryBySource(source) {
    const discovery = this._findDiscoveryBySource(source)
    if (!discovery) {
      throw new Error(`Discovery source ${source} not found`)
    }

    if (typeof discovery.discoverRegistry === 'function') {
      return await discovery.discoverRegistry()
    } else {
      // 向后兼容：将discover()结果转换为注册表格式
      const resources = await discovery.discover()
      const registry = new Map()
      if (Array.isArray(resources)) {
        resources.forEach(resource => {
          if (resource.id && resource.reference) {
            registry.set(resource.id, resource.reference)
          }
        })
      }
      return registry
    }
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
   * 合并多个注册表
   * @param {Array<Map>} registries - 注册表数组，按优先级排序（数字越小优先级越高）
   * @returns {Map} 合并后的注册表
   * @private
   */
  _mergeRegistries(registries) {
    const mergedRegistry = new Map()

    // 从后往前合并：先添加低优先级的，再让高优先级的覆盖
    // registries按优先级升序排列 [high(0), med(1), low(2)]
    // 我们从低优先级开始，让高优先级的覆盖
    for (let i = registries.length - 1; i >= 0; i--) {
      const registry = registries[i]
      if (registry instanceof Map) {
        for (const [key, value] of registry) {
          mergedRegistry.set(key, value) // 直接设置，让高优先级的最终覆盖
        }
      }
    }

    return mergedRegistry
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