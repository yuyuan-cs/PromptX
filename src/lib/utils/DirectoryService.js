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
    
    try {
      const result = await this.projectRootLocator.locate(context)
      this._lastProjectRoot = result
      this._lastContext = context
      
      logger.debug(`[DirectoryService] 项目根目录: ${result}`)
      return result
    } catch (error) {
      logger.error('[DirectoryService] 获取项目根目录失败:', error)
      // 回退到当前目录
      return context.startDir || process.cwd()
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
    
    return {
      platform: process.platform,
      projectRoot,
      workspace,
      promptxDirectory: promptxDir,
      isSame: projectRoot === workspace,
      environment: {
        WORKSPACE_FOLDER_PATHS: process.env.WORKSPACE_FOLDER_PATHS,
        PROMPTX_WORKSPACE: process.env.PROMPTX_WORKSPACE,
        PWD: process.env.PWD,
        NODE_ENV: process.env.NODE_ENV
      },
      context,
      cache: {
        projectRootCacheSize: this.projectRootLocator?.cache.size || 0,
        workspaceCacheSize: this.workspaceLocator?.cache.size || 0
      }
    }
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