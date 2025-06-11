const BasePouchCommand = require('../BasePouchCommand')
const { ResourceManager } = require('../../resource')
const { COMMANDS } = require('../../../../constants')
const PromptXConfig = require('../../../utils/promptxConfig')
const path = require('path')
const fs = require('fs-extra')

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
    return '初始化PromptX工作环境，创建必要的配置目录和文件'
  }

  async getContent (args) {
    const [workspacePath = '.'] = args

    // 1. 获取版本信息
    const version = await this.getVersionInfo()

    // 2. 基础环境准备 - 只创建 .promptx 目录
    await this.ensurePromptXDirectory(workspacePath)

    return `🎯 PromptX 初始化完成！

## 📦 版本信息
✅ **PromptX v${version}** - AI专业能力增强框架

## 🏗️ 环境准备
✅ 创建了 \`.promptx\` 配置目录
✅ 工作环境就绪

## 🚀 下一步建议
- 使用 \`hello\` 发现可用的专业角色
- 使用 \`action\` 激活特定角色获得专业能力  
- 使用 \`learn\` 深入学习专业知识
- 使用 \`remember/recall\` 管理专业记忆

💡 **提示**: 现在可以开始使用专业角色系统来增强AI能力了！`
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
   * 获取版本信息
   */
  async getVersionInfo () {
    try {
      const packageJsonPath = path.resolve(__dirname, '../../../../../package.json')
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJSON(packageJsonPath)
        const baseVersion = packageJson.version || '未知版本'
        const nodeVersion = process.version
        const packageName = packageJson.name || 'dpml-prompt'
        
        return `${baseVersion} (${packageName}@${baseVersion}, Node.js ${nodeVersion})`
      }
    } catch (error) {
      console.warn('⚠️ 无法读取版本信息:', error.message)
    }
    return '未知版本'
  }

  async getPATEOAS (args) {
    const version = await this.getVersionInfo()
    return {
      currentState: 'initialized',
      availableTransitions: ['hello', 'action', 'learn', 'recall', 'remember'],
      nextActions: [
        {
          name: '发现专业角色',
          description: '查看所有可用的AI专业角色',
          command: COMMANDS.HELLO,
          priority: 'recommended'
        },
        {
          name: '激活专业角色',
          description: '直接激活特定专业角色（如果已知角色ID）',
          command: COMMANDS.ACTION,
          priority: 'optional'
        }
      ],
      metadata: {
        timestamp: new Date().toISOString(),
        version: version,
        description: 'PromptX专业能力增强系统已就绪'
      }
    }
  }
}

module.exports = InitCommand
