const BasePouchCommand = require('../BasePouchCommand')
const { getGlobalResourceManager } = require('../../resource')
const { COMMANDS } = require('../../../../constants')
const { getDirectoryService } = require('../../../utils/DirectoryService')
const RegistryData = require('../../resource/RegistryData')
const ProjectDiscovery = require('../../resource/discovery/ProjectDiscovery')
const logger = require('../../../utils/logger')
const path = require('path')
const fs = require('fs-extra')

/**
 * 初始化锦囊命令
 * 负责准备工作环境和传达系统协议
 */
class InitCommand extends BasePouchCommand {
  constructor () {
    super()
    // 使用全局单例 ResourceManager
    this.resourceManager = getGlobalResourceManager()
    this.projectDiscovery = new ProjectDiscovery()
    this.directoryService = getDirectoryService()
  }

  getPurpose () {
    return '初始化PromptX工作环境，创建必要的配置目录和文件，生成项目级资源注册表'
  }

  async getContent (args) {
    const [workspacePath = '.'] = args

    // 构建统一的查找上下文
    // 对于init命令，我们优先使用当前目录，不向上查找现有.promptx
    const context = {
      startDir: workspacePath === '.' ? process.cwd() : path.resolve(workspacePath),
      platform: process.platform,
      avoidUserHome: true,  // 特别是Windows环境下避免用户家目录
      // init命令特有：优先当前目录，不查找现有.promptx
      strategies: [
        'currentWorkingDirectoryIfHasMarkers',
        'currentWorkingDirectory'  // 如果当前目录没有项目标识，就直接使用当前目录
      ]
    }

    // 1. 获取版本信息
    const version = await this.getVersionInfo()

    // 2. 基础环境准备 - 创建 .promptx 目录
    await this.ensurePromptXDirectory(context)

    // 3. 生成项目级资源注册表
    const registryStats = await this.generateProjectRegistry(context)

    // 4. 刷新全局 ResourceManager（确保新资源立即可用）
    await this.refreshGlobalResourceManager()

    return `🎯 PromptX 初始化完成！

## 📦 版本信息
✅ **PromptX v${version}** - AI专业能力增强框架

## 🏗️ 环境准备
✅ 创建了 \`.promptx\` 配置目录
✅ 工作环境就绪

## 📋 项目资源注册表
${registryStats.message}

## 🚀 下一步建议
- 使用 \`hello\` 发现可用的专业角色
- 使用 \`action\` 激活特定角色获得专业能力  
- 使用 \`learn\` 深入学习专业知识
- 使用 \`remember/recall\` 管理专业记忆

💡 **提示**: ${registryStats.totalResources > 0 ? '项目资源已优化为注册表模式，性能大幅提升！' : '现在可以开始创建项目级资源了！'}`
  }

  /**
   * 生成项目级资源注册表
   * @param {Object} context - 查找上下文
   * @returns {Promise<Object>} 注册表生成统计信息
   */
  async generateProjectRegistry(context) {
    try {
      // 1. 使用统一的目录服务获取项目根目录
      const projectRoot = await this.directoryService.getProjectRoot(context)
      const resourceDir = await this.directoryService.getResourceDirectory(context)
      const domainDir = path.join(resourceDir, 'domain')
      
      // 2. 确保目录结构存在
      await fs.ensureDir(domainDir)
      logger.debug(`[InitCommand] 确保目录结构存在: ${domainDir}`)

      // 3. 使用 ProjectDiscovery 的正确方法生成注册表
      logger.step('正在扫描项目资源...')
      const registryData = await this.projectDiscovery.generateRegistry(projectRoot)
      
      // 4. 生成统计信息
      const stats = registryData.getStats()
      const registryPath = await this.directoryService.getRegistryPath(context)

      if (registryData.size === 0) {
        return {
          message: `✅ 项目资源目录已创建，注册表已初始化
   📂 目录: ${path.relative(process.cwd(), domainDir)}
   💾 注册表: ${path.relative(process.cwd(), registryPath)}
   💡 现在可以在 domain 目录下创建角色资源了`,
          totalResources: 0
        }
      }

      return {
        message: `✅ 项目资源注册表已重新生成
   📊 总计: ${registryData.size} 个资源
   📋 分类: role(${stats.byProtocol.role || 0}), thought(${stats.byProtocol.thought || 0}), execution(${stats.byProtocol.execution || 0}), knowledge(${stats.byProtocol.knowledge || 0})
   💾 位置: ${path.relative(process.cwd(), registryPath)}`,
        totalResources: registryData.size
      }
      
    } catch (error) {
      logger.error('生成项目注册表时出错:', error)
      return {
        message: `❌ 生成项目注册表失败: ${error.message}`,
        totalResources: 0
      }
    }
  }

  /**
   * 确保 .promptx 基础目录存在
   * 使用统一的目录服务创建基础环境
   */
  async ensurePromptXDirectory (context) {
    const promptxDir = await this.directoryService.getPromptXDirectory(context)
    await fs.ensureDir(promptxDir)
    logger.debug(`[InitCommand] 确保.promptx目录存在: ${promptxDir}`)
  }

  /**
   * 刷新全局 ResourceManager
   * 确保新创建的资源立即可用，无需重启 MCP Server
   */
  async refreshGlobalResourceManager() {
    try {
      logger.debug('[InitCommand] 刷新全局 ResourceManager...')
      
      // 重新初始化 ResourceManager，清除缓存并重新发现资源
      await this.resourceManager.initializeWithNewArchitecture()
      
      logger.debug('[InitCommand] 全局 ResourceManager 刷新完成')
    } catch (error) {
      logger.warn(`[InitCommand] 刷新 ResourceManager 失败: ${error.message}`)
      // 不抛出错误，避免影响 init 命令的主要功能
    }
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
      logger.warn('无法读取版本信息:', error.message)
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
