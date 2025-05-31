const BasePouchCommand = require('../BasePouchCommand')
const fs = require('fs-extra')
const path = require('path')
const { COMMANDS, buildCommand } = require('../../../../constants')

/**
 * 记忆保存锦囊命令
 * 负责将知识、经验和最佳实践保存到记忆库中
 */
class RememberCommand extends BasePouchCommand {
  constructor () {
    super()
  }

  getPurpose () {
    return '增强AI长期记忆能力，主动内化专业知识、最佳实践和项目经验'
  }

  async getContent (args) {
    const [key, ...valueParts] = args
    const value = valueParts.join(' ')

    if (!key) {
      return this.getUsageHelp()
    }

    if (!value) {
      return `❌ 请提供要内化的知识内容

🔍 使用方法：
\`\`\`bash
${buildCommand.remember('<记忆标识>', '<知识内容>')}
\`\`\`

📝 示例：
\`\`\`bash
${buildCommand.remember('copywriter-tips', '"视频文案要有强烈的画面感和节奏感"')}
${buildCommand.remember('scrum-daily', '"每日站会应该控制在15分钟内，关注昨天、今天、阻碍"')}
\`\`\``
    }

    try {
      const memoryEntry = await this.saveMemory(key, value)

      return this.formatSaveResponse(key, value, memoryEntry)
    } catch (error) {
      return `❌ 记忆内化失败：${error.message}

💡 可能的原因：
- AI记忆体系目录权限不足
- 磁盘空间不够
- 记忆标识格式不正确

🔧 解决方案：
1. 检查 .promptx 目录权限
2. 确保磁盘空间充足
3. 使用简洁的记忆标识（字母、数字、连字符）`
    }
  }

  /**
   * 将知识内化到AI记忆体系（紧凑格式）
   */
  async saveMemory (key, value) {
    // 1. 确保AI记忆体系目录存在
    const memoryDir = await this.ensureMemoryDirectory()

    // 2. 使用单一记忆文件
    const memoryFile = path.join(memoryDir, 'declarative.md')

    // 3. 格式化为一行记忆
    const memoryLine = this.formatMemoryLine(key, value)

    // 4. 追加到记忆文件
    const action = await this.appendToMemoryFile(memoryFile, key, memoryLine)

    return {
      key,
      value,
      filePath: memoryFile,
      action,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 确保AI记忆体系目录存在
   */
  async ensureMemoryDirectory () {
    const promptxDir = path.join(process.cwd(), '.promptx')
    const memoryDir = path.join(promptxDir, 'memory')

    await fs.ensureDir(memoryDir)

    return memoryDir
  }

  /**
   * 格式化为一行记忆（紧凑格式）
   */
  formatMemoryLine (key, value) {
    const now = new Date()
    const timestamp = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    // 自动生成标签
    const tags = this.generateTags(key, value)

    return `- ${timestamp} ${value} #${key} ${tags} #评分:8 #有效期:长期`
  }

  /**
   * 自动生成标签
   */
  generateTags (key, value) {
    const tags = []
    const lowerKey = key.toLowerCase()
    const lowerValue = value.toLowerCase()

    // 基于key生成标签
    if (lowerKey.includes('scrum') || lowerKey.includes('agile')) tags.push('#敏捷开发')
    if (lowerKey.includes('test') || lowerKey.includes('qa')) tags.push('#测试')
    if (lowerKey.includes('deploy') || lowerKey.includes('发布')) tags.push('#部署')
    if (lowerKey.includes('react') || lowerKey.includes('前端')) tags.push('#前端开发')
    if (lowerKey.includes('api') || lowerKey.includes('后端')) tags.push('#后端开发')
    if (lowerKey.includes('prompt') || lowerKey.includes('ai')) tags.push('#AI')

    // 基于value生成标签
    if (lowerValue.includes('最佳实践') || lowerValue.includes('规则')) tags.push('#最佳实践')
    if (lowerValue.includes('流程') || lowerValue.includes('步骤')) tags.push('#流程管理')
    if (lowerValue.includes('命令') || lowerValue.includes('工具')) tags.push('#工具使用')

    return tags.join(' ') || '#其他'
  }

  /**
   * 追加到记忆文件
   */
  async appendToMemoryFile (memoryFile, key, memoryLine) {
    // 初始化文件（如果不存在）
    if (!await fs.pathExists(memoryFile)) {
      await fs.writeFile(memoryFile, `# 陈述性记忆

## 高价值记忆（评分 ≥ 7）

${memoryLine}

`)
      return 'created'
    }

    // 读取现有内容
    const content = await fs.readFile(memoryFile, 'utf-8')

    // 检查是否已存在相同key的记忆
    const keyPattern = new RegExp(`^- .*#${key}\\b`, 'm')
    if (keyPattern.test(content)) {
      // 替换现有记忆
      const updatedContent = content.replace(keyPattern, memoryLine)
      await fs.writeFile(memoryFile, updatedContent)
      return 'updated'
    } else {
      // 追加新记忆（在高价值记忆部分）
      const insertPosition = content.indexOf('\n\n') + 2
      const updatedContent = content.slice(0, insertPosition) + memoryLine + '\n\n' + content.slice(insertPosition)
      await fs.writeFile(memoryFile, updatedContent)
      return 'created'
    }
  }

  /**
   * 格式化保存响应（简化版本）
   */
  formatSaveResponse (key, value, memoryEntry) {
    const { action, timestamp } = memoryEntry

    const actionLabels = {
      created: '✅ AI已内化新记忆',
      updated: '🔄 AI已更新记忆'
    }

    return `${actionLabels[action]}：${key}

## 📋 记忆详情
- **记忆标识**: \`${key}\`
- **内化时间**: ${timestamp.split('T')[0]}
- **知识内容**: ${value.length > 100 ? value.substring(0, 100) + '...' : value}

## 🎯 能力增强效果
- ✅ **知识已内化到AI长期记忆**
- ✅ **可通过recall命令主动检索**
- ✅ **支持跨会话记忆保持**

## 🔄 下一步行动：
- 记忆检索: 验证知识内化效果
  命令: \`${buildCommand.recall(key)}\`
- 能力强化: 学习相关知识增强记忆
  命令: \`${buildCommand.learn('<protocol>://<resource-id>')}\`
- 应用实践: 在实际场景中运用记忆
  命令: \`${buildCommand.action('<role-id>')}\`

📍 当前状态：memory_saved`
  }

  /**
   * 获取使用帮助
   */
  getUsageHelp () {
    return `🧠 **Remember锦囊 - AI记忆增强系统**

## 📖 基本用法
\`\`\`bash
${buildCommand.remember('<记忆标识>', '<知识内容>')}
\`\`\`

## 💡 记忆内化示例

### 📝 AI记忆内化
AI学习和内化各种专业知识
\`\`\`bash
${buildCommand.remember('"deploy-process"', '"1.构建代码 2.运行测试 3.部署到staging 4.验证功能 5.发布生产"')}
${buildCommand.remember('"debug-case-001"', '"用户反馈视频加载慢，排查发现是CDN配置问题，修改后加载速度提升60%"')}
${buildCommand.remember('"react-hooks"', '"React Hooks允许在函数组件中使用state和其他React特性"')}
${buildCommand.remember('"code-review-rules"', '"每个PR至少需要2个人review，必须包含测试用例"')}
\`\`\`

## 💡 记忆标识规范
- 使用简洁的英文标识
- 支持连字符分隔
- 例如：\`copywriter-tips\`、\`scrum-daily\`、\`react-best-practice\`

## 🔍 记忆检索与应用
\`\`\`bash
${buildCommand.recall('<关键词>')}    # AI主动检索记忆
${buildCommand.action('<role-id>')}   # AI运用记忆激活角色
\`\`\`

🔄 下一步行动：
  - 开始记忆: 内化第一条知识
    命令: ${buildCommand.remember('<key>', '<content>')}
  - 学习资源: 学习新知识再内化
    命令: ${buildCommand.learn('<protocol>://<resource>')}`
  }

  /**
   * 获取PATEOAS导航信息
   */
  getPATEOAS (args) {
    const [key, ...valueParts] = args
    const value = valueParts.join(' ')

    if (!key) {
      return {
        currentState: 'remember_awaiting_input',
        availableTransitions: ['hello', 'learn', 'recall'],
        nextActions: [
          {
            name: '查看角色',
            description: '选择角色获取专业知识',
            command: COMMANDS.HELLO,
            priority: 'medium'
          },
          {
            name: '学习资源',
            description: '学习新知识然后保存',
            command: buildCommand.learn('<protocol>://<resource>'),
            priority: 'high'
          }
        ]
      }
    }

    if (!value) {
      return {
        currentState: 'remember_awaiting_content',
        availableTransitions: ['remember', 'recall'],
        nextActions: [
          {
            name: '重新输入',
            description: '提供完整的记忆内容',
            command: buildCommand.remember(key, '<content>'),
            priority: 'high'
          }
        ]
      }
    }

    return {
      currentState: 'memory_saved',
      availableTransitions: ['recall', 'learn', 'action', 'remember'],
      nextActions: [
        {
          name: '检索记忆',
          description: '测试记忆是否可检索',
          command: buildCommand.recall(key),
          priority: 'high'
        },
        {
          name: '学习强化',
          description: '学习相关知识加强记忆',
          command: buildCommand.learn('<protocol>://<resource>'),
          priority: 'medium'
        },
        {
          name: '应用记忆',
          description: '在实际场景中应用记忆',
          command: buildCommand.action('<role-id>'),
          priority: 'medium'
        },
        {
          name: '继续内化',
          description: 'AI继续内化更多知识',
          command: buildCommand.remember('<key>', '<content>'),
          priority: 'low'
        }
      ],
      metadata: {
        savedMemory: key,
        memoryLength: value.length,
        timestamp: new Date().toISOString(),
        systemVersion: '锦囊串联状态机 v1.0'
      }
    }
  }
}

module.exports = RememberCommand
