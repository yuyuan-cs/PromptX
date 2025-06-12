/**
 * 资源注册表
 * 新架构中用于存储动态发现的资源映射关系
 */
class ResourceRegistry {
  constructor() {
    this.index = new Map()
  }

  /**
   * 注册资源
   * @param {string} id - 资源ID (如 'role:java-developer')
   * @param {string} reference - 资源引用 (如 '@package://prompt/domain/java-developer/java-developer.role.md')
   */
  register(id, reference) {
    this.index.set(id, reference)
  }

  /**
   * 获取资源引用
   * @param {string} resourceId - 资源ID
   * @returns {string|undefined} 资源引用
   */
  get(resourceId) {
    return this.index.get(resourceId)
  }

  /**
   * 检查资源是否存在
   * @param {string} resourceId - 资源ID
   * @returns {boolean} 是否存在
   */
  has(resourceId) {
    return this.index.has(resourceId)
  }

  /**
   * 获取注册表大小
   * @returns {number} 注册的资源数量
   */
  get size() {
    return this.index.size
  }

  /**
   * 清空注册表
   */
  clear() {
    this.index.clear()
  }

  /**
   * 获取所有资源ID
   * @returns {Array<string>} 资源ID列表
   */
  keys() {
    return Array.from(this.index.keys())
  }

  /**
   * 获取所有资源条目
   * @returns {Array<[string, string]>} [resourceId, reference] 对的数组
   */
  entries() {
    return Array.from(this.index.entries())
  }

  /**
   * 打印所有注册的资源（调试用）
   * @param {string} title - 可选标题
   */
  printAll(title = '注册表资源清单') {
    console.log(`\n📋 ${title}`)
    console.log('='.repeat(50))
    
    if (this.size === 0) {
      console.log('🔍 注册表为空')
      return
    }

    console.log(`📊 总计: ${this.size} 个资源\n`)

    // 按协议分组显示
    const groupedResources = this.groupByProtocol()
    
    for (const [protocol, resources] of Object.entries(groupedResources)) {
      console.log(`🔖 ${protocol.toUpperCase()} 协议 (${resources.length}个):`)
      resources.forEach(({ id, reference }) => {
        const resourceName = id.split(':')[1] || id
        console.log(`   • ${resourceName}`)
        console.log(`     └─ ${reference}`)
      })
      console.log('')
    }
  }

  /**
   * 按协议分组资源
   * @returns {Object} 分组后的资源，格式：{ protocol: [{ id, reference }, ...] }
   */
  groupByProtocol() {
    const groups = {}
    
    for (const [id, reference] of this.entries()) {
      const protocol = id.includes(':') ? id.split(':')[0] : 'other'
      
      if (!groups[protocol]) {
        groups[protocol] = []
      }
      
      groups[protocol].push({ id, reference })
    }
    
    return groups
  }

  /**
   * 获取资源统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const groups = this.groupByProtocol()
    const stats = {
      total: this.size,
      byProtocol: {}
    }

    for (const [protocol, resources] of Object.entries(groups)) {
      stats.byProtocol[protocol] = resources.length
    }

    return stats
  }

  /**
   * 搜索资源
   * @param {string} searchTerm - 搜索词
   * @returns {Array<[string, string]>} 匹配的资源
   */
  search(searchTerm) {
    const term = searchTerm.toLowerCase()
    return this.entries().filter(([id, reference]) => 
      id.toLowerCase().includes(term) || 
      reference.toLowerCase().includes(term)
    )
  }

  /**
   * 以JSON格式导出注册表
   * @returns {Object} 注册表数据
   */
  toJSON() {
    return {
      size: this.size,
      resources: Object.fromEntries(this.entries()),
      stats: this.getStats()
    }
  }
}

module.exports = ResourceRegistry