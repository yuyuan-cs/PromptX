const BasePouchCommand = require('../BasePouchCommand')
const fs = require('fs-extra')
const path = require('path')
const { COMMANDS, buildCommand } = require('../../../../constants')
const ResourceManager = require('../../resource/resourceManager')

/**
 * 角色激活锦囊命令
 * 负责分析角色文件，提取需要学习的thought、execution和knowledge
 */
class ActionCommand extends BasePouchCommand {
  constructor () {
    super()
    // 获取HelloCommand的角色注册表
    this.helloCommand = null
    this.resourceManager = new ResourceManager()
  }

  getPurpose () {
    return '激活特定AI角色，分析并生成具体的思维模式、行为模式和知识学习计划'
  }

  async getContent (args) {
    const [roleId] = args

    if (!roleId) {
      return `❌ 请指定要激活的角色ID

🔍 使用方法：
\`\`\`bash
${buildCommand.action('<角色ID>')}
\`\`\`

💡 查看可用角色：
\`\`\`bash
${COMMANDS.HELLO}
\`\`\``
    }

    try {
      // 1. 获取角色信息
      const roleInfo = await this.getRoleInfo(roleId)
      if (!roleInfo) {
        return `❌ 角色 "${roleId}" 不存在！

🔍 请使用以下命令查看可用角色：
\`\`\`bash
${COMMANDS.HELLO}
\`\`\``
      }

      // 2. 分析角色文件，提取依赖
      const dependencies = await this.analyzeRoleDependencies(roleInfo)

      // 3. 生成学习计划并直接加载所有内容
      return await this.generateLearningPlan(roleInfo.id, dependencies)
    } catch (error) {
      console.error('Action command error:', error)
      return `❌ 激活角色 "${roleId}" 时发生错误。

🔍 可能的原因：
- 角色文件不存在或格式错误
- 权限不足
- 系统资源问题

💡 请使用 \`${COMMANDS.HELLO}\` 查看可用角色列表。`
    }
  }

  /**
   * 获取角色信息（从HelloCommand）
   */
  async getRoleInfo (roleId) {
    // 懒加载HelloCommand实例
    if (!this.helloCommand) {
      const HelloCommand = require('./HelloCommand')
      this.helloCommand = new HelloCommand()
    }

    return await this.helloCommand.getRoleInfo(roleId)
  }

  /**
   * 分析角色文件，提取thought和execution依赖
   */
  async analyzeRoleDependencies (roleInfo) {
    try {
      // 处理文件路径，将@package://和@project://前缀替换为实际路径
      let filePath = roleInfo.file
      if (filePath.startsWith('@package://')) {
        filePath = filePath.replace('@package://', '')
      } else if (filePath.startsWith('@project://')) {
        // 对于@project://路径，使用当前工作目录作为基础路径
        const ProjectProtocol = require('../../resource/protocols/ProjectProtocol')
        const projectProtocol = new ProjectProtocol()
        const relativePath = filePath.replace('@project://', '')
        filePath = path.join(process.cwd(), relativePath)
      }

      // 读取角色文件内容
      const roleContent = await fs.readFile(filePath, 'utf-8')

      // 提取所有资源引用
      const resourceRegex = /@([!?]?)([a-zA-Z][a-zA-Z0-9_-]*):\/\/([a-zA-Z0-9_\/.,-]+?)(?=[\s\)\],]|$)/g
      const matches = Array.from(roleContent.matchAll(resourceRegex))

      const dependencies = {
        thoughts: new Set(),
        executions: new Set(),
        knowledge: [roleInfo.id] // 角色自身的knowledge
      }

      // 分类依赖
      matches.forEach(match => {
        const [fullMatch, priority, protocol, resource] = match

        if (protocol === 'thought') {
          dependencies.thoughts.add(resource)
        } else if (protocol === 'execution') {
          dependencies.executions.add(resource)
        }
      })

      return {
        thoughts: dependencies.thoughts,
        executions: dependencies.executions,
        knowledge: dependencies.knowledge
      }
    } catch (error) {
      console.error('Error analyzing role dependencies:', error)
      // 如果分析失败，返回基础结构
      return {
        thoughts: [],
        executions: [],
        knowledge: [roleInfo.id]
      }
    }
  }

  /**
   * 生成学习指引（基于分析出的依赖）
   */
  generateLearningGuide (roleInfo, dependencies) {
    let guide = `🎬 **角色激活计划：${roleInfo.name}**

📋 **角色概述**
${roleInfo.description}

`

    // 思维模式部分
    if (dependencies.thoughts.length > 0) {
      guide += `## 🧠 第一步：学习思维模式
掌握角色所需的核心思考技能

`
      dependencies.thoughts.forEach((thought, index) => {
        guide += `### ${index + 1}. ${thought}
\`\`\`bash
promptx learn thought://${thought}
\`\`\`

`
      })
    }

    // 行为模式部分
    if (dependencies.executions.length > 0) {
      guide += `## ⚖️ 第二步：学习行为模式
掌握角色所需的核心执行技能

`
      dependencies.executions.forEach((execution, index) => {
        guide += `### ${index + 1}. ${execution}
\`\`\`bash
promptx learn execution://${execution}
\`\`\`

`
      })
    }

    // 知识部分
    guide += `## 📚 第三步：学习专业知识
获取角色的领域知识体系

`
    dependencies.knowledge.forEach((knowledge, index) => {
      guide += `### ${index + 1}. ${knowledge} 领域知识
\`\`\`bash
promptx learn knowledge://${knowledge}
\`\`\`

`
    })

    // 编排学习
    guide += `## 🎪 第四步：学习编排方式
理解如何组合使用已学的技能

\`\`\`bash
promptx learn personality://${roleInfo.id}
\`\`\`

\`\`\`bash
promptx learn principle://${roleInfo.id}
\`\`\`

## ✅ 角色激活确认

完成学习后，请确认角色激活：

1. **思维确认**：🧠 "我已掌握所需的思考技能！"
2. **行为确认**：⚖️ "我已掌握所需的执行技能！"  
3. **知识确认**：📚 "我已具备领域专业知识！"
4. **编排确认**：🎪 "我已理解技能的组合使用方式！"

## 🎯 下一步操作

角色激活完成后，可以：
- 📝 **开始专业工作** - 运用角色能力解决实际问题
- 🔍 **调用记忆** - 使用 \`promptx recall\` 检索相关经验
- 🔄 **切换角色** - 使用 \`promptx hello\` 选择其他专业角色

💡 **设计理念**：基于 DPML 基础协议组合，通过thought和execution的灵活编排实现角色能力。`

    return guide
  }

  /**
   * 加载学习内容（复用LearnCommand逻辑）
   */
  async loadLearnContent (resourceUrl) {
    try {
      const result = await this.resourceManager.resolve(resourceUrl)
      
      if (!result.success) {
        return `❌ 无法加载 ${resourceUrl}: ${result.error.message}\n\n`
      }

      // 解析协议信息
      const urlMatch = resourceUrl.match(/^(@[!?]?)?([a-zA-Z][a-zA-Z0-9_-]*):\/\/(.+)$/)
      if (!urlMatch) {
        return `❌ 无效的资源URL格式: ${resourceUrl}\n\n`
      }
      
      const [, loadingSemantic, protocol, resourceId] = urlMatch

      const protocolLabels = {
        thought: '🧠 思维模式',
        execution: '⚡ 执行模式',
        memory: '💾 记忆模式',
        personality: '👤 角色人格',
        principle: '⚖️ 行为原则',
        knowledge: '📚 专业知识'
      }

      const label = protocolLabels[protocol] || `📄 ${protocol}`

      return `## ✅ ${label}：${resourceId}
${result.content}
---
`
    } catch (error) {
      return `❌ 加载 ${resourceUrl} 时发生错误: ${error.message}\n\n`
    }
  }

  /**
   * 生成学习计划并直接加载所有内容
   */
  async generateLearningPlan (roleId, dependencies) {
    const { thoughts, executions } = dependencies

    let content = `🎭 **角色激活完成：${roleId}** - 所有技能已自动加载\n`

    // 加载思维模式
    if (thoughts.size > 0) {
      content += `# 🧠 思维模式技能 (${thoughts.size}个)\n`
      
      for (const thought of Array.from(thoughts)) {
        content += await this.loadLearnContent(`thought://${thought}`)
      }
    }

    // 加载执行技能
    if (executions.size > 0) {
      content += `# ⚡ 执行技能 (${executions.size}个)\n`
      
      for (const execution of Array.from(executions)) {
        content += await this.loadLearnContent(`execution://${execution}`)
      }
    }

    // 激活总结
    content += `# 🎯 角色激活总结\n`
    content += `✅ **${roleId} 角色已完全激活！**\n`
    content += `📋 **已获得能力**：\n`
    if (thoughts.size > 0) content += `- 🧠 思维模式：${Array.from(thoughts).join(', ')}\n`
    if (executions.size > 0) content += `- ⚡ 执行技能：${Array.from(executions).join(', ')}\n`
    content += `💡 **现在可以立即开始以 ${roleId} 身份提供专业服务！**\n`

    // 自动执行 recall 命令
    content += await this.executeRecall(roleId)

    return content
  }

  /**
   * 自动执行 recall 命令
   */
  async executeRecall (roleId) {
    try {
      // 懒加载 RecallCommand
      const RecallCommand = require('./RecallCommand')
      const recallCommand = new RecallCommand()
      
      // 执行 recall，获取所有记忆（不传入查询参数）
      const recallContent = await recallCommand.getContent([])
      
      return `---
## 🧠 自动记忆检索结果
${recallContent}
⚠️ **重要**: recall已自动执行完成，以上记忆将作为角色工作的重要参考依据
`
    } catch (error) {
      console.error('Auto recall error:', error)
      return `---
## 🧠 自动记忆检索结果
⚠️ **记忆检索出现问题**: ${error.message}
💡 **建议**: 可手动执行 \`${buildCommand.recall()}\` 来检索相关记忆
`
    }
  }

  getPATEOAS (args) {
    const [roleId] = args

    if (!roleId) {
      return {
        currentState: 'action_awaiting_role',
        availableTransitions: ['hello'],
        nextActions: [
          {
            name: '查看可用角色',
            description: '返回角色发现页面',
            command: COMMANDS.HELLO,
            priority: 'high'
          }
        ],
        metadata: {
          message: '需要指定角色ID'
        }
      }
    }

    return {
      currentState: 'role_activated_with_memory',
      availableTransitions: ['hello', 'remember', 'learn'],
      nextActions: [
        {
          name: '开始专业服务',
          description: '角色已激活并完成记忆检索，可直接提供专业服务',
          command: '开始对话',
          priority: 'high'
        },
        {
          name: '返回角色选择',
          description: '选择其他角色',
          command: COMMANDS.HELLO,
          priority: 'medium'
        },
        {
          name: '记忆新知识',
          description: '内化更多专业知识',
          command: buildCommand.remember('<新知识>'),
          priority: 'low'
        },
        {
          name: '学习新资源',
          description: '学习相关专业资源',
          command: buildCommand.learn('<protocol>://<resource>'),
          priority: 'low'
        }
      ],
      metadata: {
        targetRole: roleId,
        roleActivated: true,
        memoryRecalled: true,
        architecture: 'DPML协议组合',
        approach: '直接激活-自动记忆-立即可用',
        systemVersion: '锦囊串联状态机 v2.1',
        designPhilosophy: 'AI use CLI get prompt for AI - 一键专家化，自动记忆'
      }
    }
  }
}

module.exports = ActionCommand
