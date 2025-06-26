const { DirectoryLocatorFactory } = require('./DirectoryLocator')
const logger = require('./logger')

/**
 * 全局目录服务
 * 为整个应用提供统一的路径解析服务
 * 单例模式，确保全局一致性
 */
class DirectoryService {
  constructor() {
    this.projectRootLocator = null
    this.workspaceLocator = null
    this.initialized = false
    
    // 缓存最后的结果，避免重复计算
    this._lastProjectRoot = null
    this._lastWorkspace = null
    this._lastContext = null
  }

  /**
   * 初始化服务
   */
  async initialize(options = {}) {
    if (this.initialized) {
      return
    }

    try {
      this.projectRootLocator = DirectoryLocatorFactory.createProjectRootLocator(options)
      this.workspaceLocator = DirectoryLocatorFactory.createPromptXWorkspaceLocator(options)
      this.initialized = true
      
      logger.debug('[DirectoryService] 初始化完成')
    } catch (error) {
      logger.error('[DirectoryService] 初始化失败:', error)
      throw error
    }
  }

  /**
   * 获取项目根目录
   * @param {Object} context - 查找上下文
   * @returns {Promise<string>} 项目根目录路径
   */
  async getProjectRoot(context = {}) {
    await this._ensureInitialized()
    
    // 🔍 增加详细的路径诊断日志
    console.error('🔍 [DirectoryService-DIAGNOSIS] ===== getProjectRoot 诊断开始 =====')
    console.error(`🔍 [DirectoryService-DIAGNOSIS] context: ${JSON.stringify(context)}`)
    console.error(`🔍 [DirectoryService-DIAGNOSIS] process.cwd(): ${process.cwd()}`)
    
    try {
      const result = await this.projectRootLocator.locate(context)
      this._lastProjectRoot = result
      this._lastContext = context
      
      console.error(`🔍 [DirectoryService-DIAGNOSIS] ProjectRootLocator结果: ${result}`)
      console.error('🔍 [DirectoryService-DIAGNOSIS] ===== getProjectRoot 诊断结束 =====')
      
      logger.debug(`[DirectoryService] 项目根目录: ${result}`)
      return result
    } catch (error) {
      console.error(`🔍 [DirectoryService-DIAGNOSIS] ❌ ProjectRootLocator失败: ${error.message}`)
      console.error('🔍 [DirectoryService-DIAGNOSIS] ===== getProjectRoot 诊断结束（出错） =====')
      
      logger.error('[DirectoryService] 获取项目根目录失败:', error)
      // 回退到当前工作目录
      const fallback = process.cwd()
      console.error(`🔍 [DirectoryService-DIAGNOSIS] 回退到process.cwd(): ${fallback}`)
      return fallback
    }
  }

  /**
   * 获取PromptX工作空间目录
   * @param {Object} context - 查找上下文
   * @returns {Promise<string>} 工作空间目录路径
   */
  async getWorkspace(context = {}) {
    await this._ensureInitialized()
    
    try {
      const result = await this.workspaceLocator.locate(context)
      this._lastWorkspace = result
      this._lastContext = context
      
      logger.debug(`[DirectoryService] 工作空间目录: ${result}`)
      return result
    } catch (error) {
      logger.error('[DirectoryService] 获取工作空间目录失败:', error)
      // 回退到项目根目录
      return await this.getProjectRoot(context)
    }
  }

  /**
   * 获取.promptx目录路径
   * @param {Object} context - 查找上下文
   * @returns {Promise<string>} .promptx目录路径
   */
  async getPromptXDirectory(context = {}) {
    const workspace = await this.getWorkspace(context)
    return require('path').join(workspace, '.promptx')
  }

  /**
   * 获取项目资源目录路径
   * @param {Object} context - 查找上下文
   * @returns {Promise<string>} 项目资源目录路径
   */
  async getResourceDirectory(context = {}) {
    const promptxDir = await this.getPromptXDirectory(context)
    return require('path').join(promptxDir, 'resource')
  }

  /**
   * 获取项目注册表文件路径
   * @param {Object} context - 查找上下文
   * @returns {Promise<string>} 注册表文件路径
   */
  async getRegistryPath(context = {}) {
    const resourceDir = await this.getResourceDirectory(context)
    return require('path').join(resourceDir, 'project.registry.json')
  }

  /**
   * 获取记忆目录路径
   * @param {Object} context - 查找上下文
   * @returns {Promise<string>} 记忆目录路径
   */
  async getMemoryDirectory(context = {}) {
    const promptxDir = await this.getPromptXDirectory(context)
    return require('path').join(promptxDir, 'memory')
  }

  /**
   * 清除所有缓存
   */
  clearCache() {
    if (this.projectRootLocator) {
      this.projectRootLocator.clearCache()
    }
    if (this.workspaceLocator) {
      this.workspaceLocator.clearCache()
    }
    
    this._lastProjectRoot = null
    this._lastWorkspace = null
    this._lastContext = null
    
    logger.debug('[DirectoryService] 缓存已清除')
  }

  /**
   * 获取调试信息
   */
  async getDebugInfo(context = {}) {
    await this._ensureInitialized()
    
    const projectRoot = await this.getProjectRoot(context)
    const workspace = await this.getWorkspace(context)
    const promptxDir = await this.getPromptXDirectory(context)
    
    // 获取IDE检测信息
    const ideDetectionInfo = this.workspaceLocator?.getDetectionInfo() || {}
    
    return {
      platform: process.platform,
      projectRoot,
      workspace,
      promptxDirectory: promptxDir,
      isSame: projectRoot === workspace,
      ideDetection: {
        detectedIDE: ideDetectionInfo.detectedIDE,
        availableEnvVars: ideDetectionInfo.availableEnvVars,
        cwd: process.cwd(),
        args: process.argv.slice(2) // 隐藏node和脚本路径
      },
      environment: {
        // 主要IDE环境变量
        WORKSPACE_FOLDER_PATHS: process.env.WORKSPACE_FOLDER_PATHS,
        VSCODE_WORKSPACE_FOLDER: process.env.VSCODE_WORKSPACE_FOLDER,
        PROJECT_ROOT: process.env.PROJECT_ROOT,
        SUBLIME_PROJECT_PATH: process.env.SUBLIME_PROJECT_PATH,
        // PromptX专用
        PROMPTX_WORKSPACE: process.env.PROMPTX_WORKSPACE,
        // 系统环境
        PWD: process.env.PWD,
        NODE_ENV: process.env.NODE_ENV
      },
      context,
      cache: {
        projectRootCacheSize: this.projectRootLocator?.cache.size || 0,
        workspaceCacheSize: this.workspaceLocator?.cache.size || 0
      },
      recommendations: this._getPathRecommendations(ideDetectionInfo)
    }
  }

  /**
   * 获取路径配置建议
   */
  _getPathRecommendations(ideDetectionInfo = {}) {
    const recommendations = []
    
    if (!ideDetectionInfo.detectedIDE || ideDetectionInfo.detectedIDE === 'Unknown') {
      recommendations.push({
        type: 'env_var',
        message: '未检测到IDE环境变量，建议设置项目路径环境变量',
        suggestions: [
          'export PROMPTX_WORKSPACE="/path/to/your/project"',
          'export PROJECT_ROOT="/path/to/your/project"',
          'export WORKSPACE_ROOT="/path/to/your/project"'
        ]
      })
    }
    
    if (!ideDetectionInfo.availableEnvVars || Object.keys(ideDetectionInfo.availableEnvVars).length === 0) {
      recommendations.push({
        type: 'manual_config',
        message: '建议在IDE中配置MCP工作目录',
        suggestions: [
          'VSCode: 在settings.json中设置workspace.folders',
          'IntelliJ: 在Run Configuration中设置Working directory',
          'Claude IDE: 确保workspace路径正确传递'
        ]
      })
    }
    
    return recommendations
  }

  /**
   * 确保服务已初始化
   */
  async _ensureInitialized() {
    if (!this.initialized) {
      await this.initialize()
    }
  }

  /**
   * 重新加载配置
   * @param {Object} options - 新的配置选项
   */
  async reload(options = {}) {
    this.initialized = false
    this.clearCache()
    await this.initialize(options)
  }
}

// 创建全局单例
const globalDirectoryService = new DirectoryService()

/**
 * 获取全局目录服务实例
 * @returns {DirectoryService} 目录服务实例
 */
function getDirectoryService() {
  return globalDirectoryService
}

/**
 * 便捷方法：获取项目根目录
 * @param {Object} context - 查找上下文
 * @returns {Promise<string>} 项目根目录路径
 */
async function getProjectRoot(context = {}) {
  return await globalDirectoryService.getProjectRoot(context)
}

/**
 * 便捷方法：获取工作空间目录
 * @param {Object} context - 查找上下文
 * @returns {Promise<string>} 工作空间目录路径
 */
async function getWorkspace(context = {}) {
  return await globalDirectoryService.getWorkspace(context)
}

/**
 * 便捷方法：获取.promptx目录
 * @param {Object} context - 查找上下文
 * @returns {Promise<string>} .promptx目录路径
 */
async function getPromptXDirectory(context = {}) {
  return await globalDirectoryService.getPromptXDirectory(context)
}

module.exports = {
  DirectoryService,
  getDirectoryService,
  getProjectRoot,
  getWorkspace,
  getPromptXDirectory
} 