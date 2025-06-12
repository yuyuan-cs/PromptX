const BasePouchCommand = require('../BasePouchCommand')
const fs = require('fs-extra')
const path = require('path')
const { buildCommand } = require('../../../../constants')
const ResourceManager = require('../../resource/resourceManager')
const logger = require('../../../utils/logger')

/**
 * 角色发现锦囊命令
 * 负责展示可用的AI角色和领域专家
 */
class HelloCommand extends BasePouchCommand {
  constructor () {
    super()
    // 使用新的ResourceManager架构替代SimplifiedRoleDiscovery
    this.resourceManager = new ResourceManager()
  }

  getPurpose () {
    return '为AI提供可用角色信息，以便AI向主人汇报专业服务选项'
  }

  /**
   * 动态加载角色注册表 - 使用新的ResourceManager架构
   * 移除缓存机制，每次都实时扫描，确保角色发现的一致性
   */
  async loadRoleRegistry () {
    try {
      // 无状态资源刷新，确保能发现新创建的角色
      await this.resourceManager.refreshResources()

      // 获取所有角色相关的资源
      const roleRegistry = {}
      
      // 从ResourceRegistry中获取所有role:开头的资源
      const registry = this.resourceManager.registry
      for (const [resourceId, reference] of registry.index) {
        if (resourceId.startsWith('role:')) {
          const roleId = resourceId.substring(5) // 移除 'role:' 前缀
          
          try {
            // 尝试加载角色内容以提取元数据
            const result = await this.resourceManager.loadResource(resourceId)
            if (result.success) {
              const name = this.extractRoleNameFromContent(result.content) || roleId
              const description = this.extractDescriptionFromContent(result.content) || `${name}专业角色`
              
              roleRegistry[roleId] = {
                file: reference,
                name,
                description,
                source: reference.startsWith('@package://') ? 'system' : 'user-generated'
              }
            }
          } catch (error) {
            // 单个角色加载失败不影响其他角色
            logger.warn(`角色${roleId}加载失败: ${error.message}`)
          }
        }
      }

      // 如果没有任何角色，使用基础角色
      if (Object.keys(roleRegistry).length === 0) {
        roleRegistry.assistant = {
          file: '@package://prompt/domain/assistant/assistant.role.md',
          name: '🙋 智能助手',
          description: '通用助理角色，提供基础的助理服务和记忆支持',
          source: 'fallback'
        }
      }
      
      return roleRegistry
    } catch (error) {
      logger.warn('角色注册表加载失败，使用基础角色:', error.message)
      
      // 使用基础角色作为fallback
      return {
        assistant: {
          file: '@package://prompt/domain/assistant/assistant.role.md',
          name: '🙋 智能助手',
          description: '通用助理角色，提供基础的助理服务和记忆支持',
          source: 'fallback'
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
      case 'user-generated':
        return '(用户生成)'
      case 'system':
        return '(系统角色)'
      case 'fallback':
        return '(默认角色)'
      default:
        return ''
    }
  }

  async getContent (args) {
    await this.loadRoleRegistry()
    const allRoles = await this.getAllRoles()
    const totalRoles = allRoles.length

    let content = `🤖 **AI专业角色服务清单** (共 ${totalRoles} 个专业角色可供选择)

> 💡 **重要说明**：以下是可激活的AI专业角色。每个角色都有唯一的ID，使用action命令激活。

## 📋 可用角色列表

`

    // 清楚显示角色ID和激活命令
    allRoles.forEach((role, index) => {
      const sourceLabel = this.getSourceLabel(role.source)
      content += `### ${index + 1}. ${role.name} ${sourceLabel}
**角色ID**: \`${role.id}\`  
**专业能力**: ${role.description}  
**激活命令**: \`${buildCommand.action(role.id)}\`

---

`
    })

    content += `
## 🎯 **角色激活指南**

### 🔧 激活步骤
1. **选择角色**: 从上述列表中选择需要的专业角色
2. **使用角色ID**: 复制对应的角色ID（如：\`${allRoles[0]?.id || 'assistant'}\`）
3. **执行命令**: 运行 \`${buildCommand.action('<角色ID>')}\`

### 📝 激活示例
\`\`\`bash
# 激活智能助手角色
${buildCommand.action(allRoles[0]?.id || 'assistant')}
\`\`\`

### ⚡ 激活后效果
- ✅ **获得专业能力** - AI将具备该角色的专业技能
- ✅ **学习技能组合** - 自动学习角色需要的思维和行为模式
- ✅ **即时专业化** - 立即可以提供该领域的专业服务

---

⚠️ **AI执行指令**：
📢 **向主人汇报角色选项，明确说明使用方法："请选择角色ID，然后我将执行对应的action命令"**
🎯 **等待主人指定具体的角色ID后，立即执行 \`${buildCommand.action('<角色ID>')}\`**
💡 **强调：action命令需要具体的角色ID，不是角色名称**
`

    return content
  }

  async getPATEOAS (args) {
    const allRoles = await this.getAllRoles()
    const availableRoles = allRoles.map(role => ({
      roleId: role.id,
      name: role.name,
      actionCommand: buildCommand.action(role.id)
    }))

    return {
      currentState: 'role_discovery',
      availableTransitions: ['action', 'learn', 'init', 'recall'],
      nextActions: [
        {
          name: '向主人汇报服务选项',
          description: '将上述专业服务清单告知主人，并询问需求',
          command: '等待主人选择后使用: ' + buildCommand.action('<选择的角色ID>'),
          priority: 'critical',
          instruction: '必须先询问主人需求，不要自主选择角色'
        }
      ],
      metadata: {
        totalRoles: allRoles.length,
        availableRoles,
        dataSource: 'resource.registry.json',
        systemVersion: '锦囊串联状态机 v1.0',
        designPhilosophy: 'AI use CLI get prompt for AI'
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
    
    console.log('\n🔍 HelloCommand - 注册表调试信息')
    console.log('='.repeat(50))
    
    if (this.roleRegistry && Object.keys(this.roleRegistry).length > 0) {
      console.log(`📊 发现 ${Object.keys(this.roleRegistry).length} 个角色资源:\n`)
      
      Object.entries(this.roleRegistry).forEach(([id, roleInfo]) => {
        console.log(`🎭 ${id}`)
        console.log(`   名称: ${roleInfo.name || '未命名'}`)
        console.log(`   描述: ${roleInfo.description || '无描述'}`)
        console.log(`   文件: ${roleInfo.file}`)
        console.log(`   来源: ${roleInfo.source || '未知'}`)
        console.log('')
      })
    } else {
      console.log('🔍 没有发现任何角色资源')
    }
    
    // 同时显示ResourceManager的注册表
    console.log('\n📋 ResourceManager 注册表:')
    console.log('-'.repeat(30))
    this.resourceManager.registry.printAll('底层资源注册表')
  }
}

module.exports = HelloCommand
