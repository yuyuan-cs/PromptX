const BasePouchCommand = require('../BasePouchCommand')
const { ResourceManager } = require('../../resource')
const { COMMANDS, COMMAND_PREFIX } = require('../../../../constants')
const PromptXConfig = require('../../../utils/promptxConfig')

/**
 * 初始化锦囊命令
 * 负责准备工作环境和传达系统协议
 */
class InitCommand extends BasePouchCommand {
  constructor () {
    super()
    this.resourceManager = new ResourceManager()
  }

  getPurpose () {
    return '初始化PromptX工作环境，传达系统基本诺记（协议体系）'
  }

  async getContent (args) {
    const [workspacePath = '.'] = args

    // 1. 基础环境准备 - 只创建 .promptx 目录
    await this.ensurePromptXDirectory(workspacePath)

    // 2. 加载协议体系
    const protocolContent = await this.loadProtocolSystem()

    return `🎯 PromptX 系统初始化完成！

## 🏗️ 技术环境准备
✅ 创建了 .promptx 配置目录
✅ 设置命令前缀：${COMMAND_PREFIX}
✅ 准备了锦囊状态机框架

## 📋 系统基本诺记 (协议体系)

${protocolContent}

### 🎒 核心锦囊状态机
\`\`\`
🏗️init(✅已完成) → 👋hello → ⚡action → 📚learn → 🔍recall → 循环
\`\`\`

---

⚠️ **AI执行指令**：
🚀 **立即执行下一个锦囊：${COMMANDS.HELLO}**
📢 **不要等待确认，直接进入hello命令发现可用角色！**
🎯 **记住：锦囊串联设计，init完成后必须自动进入hello！**`
  }

  /**
   * 确保 .promptx 基础目录存在
   * 这是 init 的唯一职责 - 创建基础环境标识
   */
  async ensurePromptXDirectory (workspacePath) {
    const config = new PromptXConfig(workspacePath)
    // 利用 PromptXConfig 的统一目录管理
    await config.ensureDir()
  }

  /**
   * 加载协议体系内容
   */
  async loadProtocolSystem () {
    try {
      // 加载完整协议体系：PATEOAS + DPML + 所有标签协议
      const result = await this.resourceManager.resolve('@prompt://protocols')

      if (result.success) {
        return result.content
      } else {
        console.warn('⚠️ 协议加载失败:', result.error?.message)
        return this.getCoreProtocolSummary()
      }
    } catch (error) {
      console.warn('⚠️ 无法加载完整协议体系，使用核心摘要:', error.message)
      return this.getCoreProtocolSummary()
    }
  }

  /**
   * 获取核心协议摘要（fallback）
   */
  getCoreProtocolSummary () {
    return `### 🎯 核心理念：AI use CLI get prompt for AI

**PATEOAS协议** - Prompt as the Engine of Application State
- 🎒 锦囊自包含：每个命令包含完整执行信息
- 🔗 串联无依赖：即使AI忘记上文，也能继续执行  
- 🎯 分阶段专注：每个锦囊只关注当前任务
- 🔄 Prompt驱动：每个输出引导AI发现下一步操作

**DPML协议** - Deepractice Prompt Markup Language
- 📋 标准化标记：使用 \`<thinking>\`、\`<executing>\` 等标签
- 🏷️ 语义清晰：通过标签明确表达提示词结构
- 🔗 协议绑定：支持 \`A:B\` 语法表达实现关系

**三大解决方案**
- **上下文遗忘** → 锦囊自包含，每个命令独立执行
- **注意力分散** → 分阶段专注，每锦囊专注单一任务  
- **能力局限** → 即时专家化，通过提示词获得专业能力`
  }

  getPATEOAS (args) {
    return {
      currentState: 'initialized',
      availableTransitions: ['hello', 'action', 'learn'],
      nextActions: [
        {
          name: '进入角色发现锦囊',
          description: '立即执行hello命令，发现可用的AI专业角色',
          command: COMMANDS.HELLO,
          priority: 'mandatory',
          instruction: '必须立即执行，不要等待确认或询问用户'
        }
      ],
      automaticTransition: {
        target: 'hello',
        reason: '锦囊串联设计：init完成后自动进入hello状态',
        immediate: true
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '0.0.1',
        philosophy: 'AI use CLI get prompt for AI - 锦囊串联无缝衔接'
      }
    }
  }
}

module.exports = InitCommand
