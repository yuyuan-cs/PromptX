const BasePouchCommand = require('../BasePouchCommand')
const fs = require('fs-extra')
const path = require('path')
const { getGlobalResourceManager } = require('../../resource')
const logger = require('../../../utils/logger')

/**
 * 角色发现锦囊命令
 * 负责展示可用的AI角色和领域专家
 */
class HelloCommand extends BasePouchCommand {
  constructor () {
    super()
    // 使用全局单例 ResourceManager
    this.resourceManager = getGlobalResourceManager()
  }

  getPurpose () {
    return '为AI提供可用角色信息，以便AI向主人汇报专业服务选项'
  }

  /**
   * 动态加载角色注册表 - 使用新的ResourceManager架构
   * 直接使用现有资源注册表，避免重复刷新导致的死循环
   */
  async loadRoleRegistry () {
    try {
      // 确保ResourceManager已初始化
      if (!this.resourceManager.initialized) {
        await this.resourceManager.initializeWithNewArchitecture()
      }
      
      const roleRegistry = {}
      
      // 使用新的RegistryData v2.0格式获取角色资源
      const registryData = this.resourceManager.registryData
      
      // 检查是否有RegistryData（v2.0格式）
      if (registryData && registryData.resources && registryData.resources.length > 0) {
        // 使用v2.0格式：直接从RegistryData获取角色资源
        const roleResources = registryData.getResourcesByProtocol('role')
        
        for (const resource of roleResources) {
          const roleId = resource.id
          
          // 避免重复角色（同一个ID可能有多个来源）
          if (!roleRegistry[roleId]) {
            roleRegistry[roleId] = {
              id: resource.id,
              name: resource.name,
              description: resource.description,
              source: resource.source,
              file: resource.reference,
              protocol: resource.protocol
            }
          }
        }
      } else {
        // 降级到旧格式处理（向后兼容）
        const registry = this.resourceManager.registry
        for (const [resourceId, reference] of registry.index) {
          let roleId = null
          let isRoleResource = false
          
          if (resourceId.startsWith('role:')) {
            roleId = resourceId.substring(5)
            isRoleResource = true
          } else if (resourceId.startsWith('package:') || resourceId.startsWith('project:') || resourceId.startsWith('user:')) {
            const parts = resourceId.split(':')
            if (parts.length === 2 && !parts[1].includes(':')) {
              roleId = parts[1]
              isRoleResource = true
            }
          } else if (!resourceId.includes(':')) {
            roleId = resourceId
            isRoleResource = true
          }
          
          if (isRoleResource && roleId && !roleRegistry[roleId]) {
            try {
              const result = await this.resourceManager.loadResource(resourceId)
              if (result.success) {
                const name = this.extractRoleNameFromContent(result.content) || roleId
                const description = this.extractDescriptionFromContent(result.content) || `${name}专业角色`
                
                roleRegistry[roleId] = {
                  id: roleId,
                  name,
                  description,
                  source: reference.startsWith('@package://') ? 'package' : 'project',
                  file: reference,
                  protocol: 'role'
                }
              }
            } catch (error) {
              // 静默处理，避免干扰用户界面
            }
          }
        }
      }

      // 如果没有任何角色，使用基础角色
      if (Object.keys(roleRegistry).length === 0) {
        roleRegistry.assistant = {
          id: 'assistant',
          name: '🙋 智能助手',
          description: '通用助理角色，提供基础的助理服务和记忆支持',
          source: 'fallback',
          file: '@package://prompt/domain/assistant/assistant.role.md',
          protocol: 'role'
        }
      }
      
      return roleRegistry
    } catch (error) {
      // 使用基础角色作为fallback
      return {
        assistant: {
          id: 'assistant',
          name: '🙋 智能助手',
          description: '通用助理角色，提供基础的助理服务和记忆支持',
          source: 'fallback',
          file: '@package://prompt/domain/assistant/assistant.role.md',
          protocol: 'role'
        }
      }
    }
  }

  /**
   * 从角色内容中提取角色名称
   * @param {string} content - 角色文件内容
   * @returns {string|null} 角色名称
   */
  extractRoleNameFromContent(content) {
    if (!content || typeof content !== 'string') {
      return null
    }
    
    // 提取Markdown标题
    const match = content.match(/^#\s*(.+)$/m)
    return match ? match[1].trim() : null
  }

  /**
   * 从角色内容中提取描述
   * @param {string} content - 角色文件内容
   * @returns {string|null} 角色描述
   */
  extractDescriptionFromContent(content) {
    if (!content || typeof content !== 'string') {
      return null
    }
    
    // 提取Markdown引用（描述）
    const match = content.match(/^>\s*(.+)$/m)
    return match ? match[1].trim() : null
  }

  /**
   * 从角色信息中提取描述（保持向后兼容）
   * @param {Object} roleInfo - 角色信息对象
   * @returns {string} 角色描述
   */
  extractDescription(roleInfo) {
    // 尝试从不同字段提取描述
    if (roleInfo.description) {
      return roleInfo.description
    }
    
    // 如果有更多元数据，可以在这里扩展提取逻辑
    return null
  }

  /**
   * 获取所有角色列表（转换为数组格式）
   */
  async getAllRoles () {
    const registry = await this.loadRoleRegistry()
    return Object.entries(registry).map(([id, roleInfo]) => ({
      id,
      name: roleInfo.name,
      description: roleInfo.description,
      file: roleInfo.file,
      source: roleInfo.source
    }))
  }

  /**
   * 获取来源标签
   * @param {string} source - 资源来源
   * @returns {string} 来源标签
   */
  getSourceLabel(source) {
    switch (source) {
      case 'package':
        return '📦 系统角色'
      case 'project':
        return '🏗️ 项目角色'
      case 'user':
        return '�� 用户角色'
      case 'merged':
        return '📦 系统角色' // merged来源的资源主要来自package
      case 'fallback':
        return '🔄 默认角色'
      default:
        return '❓ 未知来源'
    }
  }

  async getContent (args) {
    const roleRegistry = await this.loadRoleRegistry()
    const allRoles = Object.values(roleRegistry)
    const totalRoles = allRoles.length

    let content = `🤖 **AI专业角色服务清单** (共 ${totalRoles} 个专业角色可供选择)

> 💡 **重要说明**：以下是可激活的AI专业角色。每个角色都有唯一的ID，可通过MCP工具激活。

## 📋 可用角色列表

`

    // 按来源分组显示角色
    const rolesBySource = {}
    allRoles.forEach(role => {
      const source = role.source || 'unknown'
      if (!rolesBySource[source]) {
        rolesBySource[source] = []
      }
      rolesBySource[source].push(role)
    })

    let roleIndex = 1
    
    // 优先显示系统角色
    const sourceOrder = ['package', 'merged', 'project', 'user', 'fallback', 'unknown']
    
    for (const source of sourceOrder) {
      if (!rolesBySource[source] || rolesBySource[source].length === 0) continue
      
      const sourceLabel = this.getSourceLabel(source)
      content += `### ${sourceLabel}\n\n`
      
      rolesBySource[source].forEach(role => {
        content += `#### ${roleIndex}. ${role.name}
**角色ID**: \`${role.id}\`  
**专业能力**: ${role.description}  
**来源**: ${sourceLabel}

---

`
        roleIndex++
      })
    }

    content += `
## 🎯 **角色激活指南**

### 🔧 激活方式
- 使用 **MCP PromptX 工具** 中的 \`action\` 功能
- 选择需要的角色ID进行激活

### ⚡ 激活后效果
- ✅ **获得专业能力** - AI将具备该角色的专业技能
- ✅ **学习技能组合** - 自动学习角色需要的思维和行为模式
- ✅ **即时专业化** - 立即可以提供该领域的专业服务
`

    return content
  }

  async getPATEOAS (args) {
    const allRoles = await this.getAllRoles()
    const availableRoles = allRoles.map(role => ({
      roleId: role.id,
      name: role.name,
      source: role.source
    }))

    return {
      currentState: 'role_discovery',
      availableTransitions: ['action', 'learn', 'init', 'recall'],
      nextActions: [
        {
          name: '向主人汇报服务选项',
          description: '将上述专业服务清单告知主人，并询问需求',
          method: 'MCP PromptX action 工具',
          priority: 'critical',
          instruction: '必须先询问主人需求，不要自主选择角色'
        }
      ],
      metadata: {
        totalRoles: allRoles.length,
        availableRoles,
        dataSource: 'resource.registry.json',
        systemVersion: '锦囊串联状态机 v1.0',
        designPhilosophy: 'AI use MCP tools for role activation'
      }
    }
  }

  /**
   * 获取角色信息（提供给其他命令使用）
   */
  async getRoleInfo (roleId) {
    logger.debug(`[HelloCommand] getRoleInfo调用，角色ID: ${roleId}`)
    
    const registry = await this.loadRoleRegistry()
    logger.debug(`[HelloCommand] 注册表加载完成，包含角色:`, Object.keys(registry))
    
    const roleData = registry[roleId]
    logger.debug(`[HelloCommand] 查找角色${roleId}结果:`, roleData ? '找到' : '未找到')

    if (!roleData) {
      logger.debug(`[HelloCommand] 角色${roleId}在注册表中不存在`)
      return null
    }

    const result = {
      id: roleId,
      name: roleData.name,
      description: roleData.description,
      file: roleData.file
    }
    
    logger.debug(`[HelloCommand] 返回角色信息:`, result)
    return result
  }

  /**
   * 未来扩展：动态角色发现
   * TODO: 实现真正的文件扫描和解析
   */
  async discoverAvailableDomains () {
    // 现在基于注册表返回角色ID列表
    const allRoles = await this.getAllRoles()
    return allRoles.map(role => role.id)
  }

  /**
   * 注意：原来的discoverLocalRoles方法已被移除
   * 现在使用SimplifiedRoleDiscovery.discoverAllRoles()替代
   * 这避免了glob依赖和跨平台兼容性问题
   */

  /**
   * 调试方法：打印所有注册的资源
   */
  async debugRegistry() {
    await this.loadRoleRegistry()
    
    logger.info('\n🔍 HelloCommand - 注册表调试信息')
    logger.info('='.repeat(50))
    
    if (this.roleRegistry && Object.keys(this.roleRegistry).length > 0) {
      logger.info(`📊 发现 ${Object.keys(this.roleRegistry).length} 个角色资源:\n`)
      
      Object.entries(this.roleRegistry).forEach(([id, roleInfo]) => {
        logger.info(`🎭 ${id}`)
        logger.info(`   名称: ${roleInfo.name || '未命名'}`)
        logger.info(`   描述: ${roleInfo.description || '无描述'}`)
        logger.info(`   文件: ${roleInfo.file}`)
        logger.info(`   来源: ${roleInfo.source || '未知'}`)
        logger.info('')
      })
    } else {
      logger.info('🔍 没有发现任何角色资源')
    }
    
    // 同时显示ResourceManager的注册表
    logger.info('\n📋 ResourceManager 注册表:')
    logger.info('-'.repeat(30))
    this.resourceManager.registry.printAll('底层资源注册表')
  }
}

module.exports = HelloCommand
