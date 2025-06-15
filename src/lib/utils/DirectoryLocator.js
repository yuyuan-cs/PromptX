const fs = require('fs-extra')
const path = require('path')
const os = require('os')

/**
 * 目录定位器基础抽象类
 * 统一管理所有路径解析逻辑，支持跨平台差异化实现
 */
class DirectoryLocator {
  constructor(options = {}) {
    this.options = options
    this.cache = new Map()
    this.platform = process.platform
  }

  /**
   * 抽象方法：定位目录
   * @param {Object} context - 定位上下文
   * @returns {Promise<string>} 定位到的目录路径
   */
  async locate(context = {}) {
    throw new Error('子类必须实现 locate 方法')
  }

  /**
   * 获取缓存
   */
  getCached(key) {
    return this.cache.get(key)
  }

  /**
   * 设置缓存
   */
  setCached(key, value) {
    this.cache.set(key, value)
    return value
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear()
  }

  /**
   * 检查路径是否存在且是目录
   */
  async isValidDirectory(dirPath) {
    try {
      const stat = await fs.stat(dirPath)
      return stat.isDirectory()
    } catch {
      return false
    }
  }

  /**
   * 规范化路径
   */
  normalizePath(inputPath) {
    if (!inputPath || typeof inputPath !== 'string') {
      return null
    }
    return path.resolve(inputPath)
  }

  /**
   * 展开家目录路径
   */
  expandHome(filepath) {
    if (!filepath || typeof filepath !== 'string') {
      return ''
    }
    
    if (filepath.startsWith('~/') || filepath === '~') {
      return path.join(os.homedir(), filepath.slice(2))
    }
    
    return filepath
  }
}

/**
 * 项目根目录定位器
 * 负责查找项目的根目录
 */
class ProjectRootLocator extends DirectoryLocator {
  constructor(options = {}) {
    super(options)
    
    // 可配置的查找策略优先级
    this.strategies = options.strategies || [
      'existingPromptxDirectory',
      'currentWorkingDirectoryIfHasMarkers',
      'packageJsonDirectory',
      'gitRootDirectory',
      'currentWorkingDirectory'
    ]
    
    // 项目标识文件
    this.projectMarkers = options.projectMarkers || [
      'package.json',
      '.git',
      'pyproject.toml',
      'Cargo.toml',
      'pom.xml',
      'build.gradle',
      'composer.json'
    ]
  }

  /**
   * 定位项目根目录
   */
  async locate(context = {}) {
    const { startDir = process.cwd() } = context
    const cacheKey = `projectRoot:${startDir}`
    
    // 检查缓存
    const cached = this.getCached(cacheKey)
    if (cached) {
      return cached
    }

    // 使用上下文中的策略或默认策略
    const strategies = context.strategies || this.strategies

    // 按策略优先级查找
    for (const strategy of strategies) {
      const result = await this._executeStrategy(strategy, startDir, context)
      if (result && await this._validateProjectRoot(result, context)) {
        return this.setCached(cacheKey, result)
      }
    }

    // 如果所有策略都失败，返回起始目录
    return this.setCached(cacheKey, startDir)
  }

  /**
   * 执行特定的查找策略
   */
  async _executeStrategy(strategy, startDir, context) {
    switch (strategy) {
      case 'existingPromptxDirectory':
        return await this._findByExistingPromptx(startDir)
      
      case 'currentWorkingDirectoryIfHasMarkers':
        return await this._checkCurrentDirForMarkers(startDir)
      
      case 'packageJsonDirectory':
        return await this._findByProjectMarkers(startDir)
      
      case 'gitRootDirectory':
        return await this._findByGitRoot(startDir)
      
      case 'currentWorkingDirectory':
        return startDir
      
      default:
        return null
    }
  }

  /**
   * 检查当前目录是否包含项目标识文件
   */
  async _checkCurrentDirForMarkers(startDir) {
    const currentDir = path.resolve(startDir)
    
    // 检查当前目录是否包含项目标识文件
    for (const marker of this.projectMarkers) {
      const markerPath = path.join(currentDir, marker)
      if (await fs.pathExists(markerPath)) {
        return currentDir
      }
    }
    
    return null
  }

  /**
   * 通过现有.promptx目录查找
   */
  async _findByExistingPromptx(startDir) {
    let currentDir = path.resolve(startDir)
    const root = path.parse(currentDir).root

    while (currentDir !== root) {
      const promptxPath = path.join(currentDir, '.promptx')
      if (await this.isValidDirectory(promptxPath)) {
        return currentDir
      }
      
      const parentDir = path.dirname(currentDir)
      if (parentDir === currentDir) break
      currentDir = parentDir
    }

    return null
  }

  /**
   * 通过项目标识文件查找
   */
  async _findByProjectMarkers(startDir) {
    let currentDir = path.resolve(startDir)
    const root = path.parse(currentDir).root

    while (currentDir !== root) {
      for (const marker of this.projectMarkers) {
        const markerPath = path.join(currentDir, marker)
        if (await fs.pathExists(markerPath)) {
          return currentDir
        }
      }
      
      const parentDir = path.dirname(currentDir)
      if (parentDir === currentDir) break
      currentDir = parentDir
    }

    return null
  }

  /**
   * 通过Git根目录查找
   */
  async _findByGitRoot(startDir) {
    let currentDir = path.resolve(startDir)
    const root = path.parse(currentDir).root

    while (currentDir !== root) {
      const gitPath = path.join(currentDir, '.git')
      if (await fs.pathExists(gitPath)) {
        return currentDir
      }
      
      const parentDir = path.dirname(currentDir)
      if (parentDir === currentDir) break
      currentDir = parentDir
    }

    return null
  }

  /**
   * 验证项目根目录
   */
  async _validateProjectRoot(projectRoot, context = {}) {
    // Windows平台：避免用户家目录
    if (this.platform === 'win32' && context.avoidUserHome !== false) {
      const homeDir = os.homedir()
      if (path.resolve(projectRoot) === path.resolve(homeDir)) {
        return false
      }
    }

    return await this.isValidDirectory(projectRoot)
  }
}

/**
 * PromptX工作空间定位器
 * 负责确定.promptx目录的位置
 */
class PromptXWorkspaceLocator extends DirectoryLocator {
  constructor(options = {}) {
    super(options)
    this.projectRootLocator = options.projectRootLocator || new ProjectRootLocator(options)
  }

  /**
   * 定位PromptX工作空间
   */
  async locate(context = {}) {
    const cacheKey = `promptxWorkspace:${JSON.stringify(context)}`
    
    // 检查缓存
    const cached = this.getCached(cacheKey)
    if (cached) {
      return cached
    }

    // 策略1：IDE环境变量
    const workspaceFromIDE = await this._fromIDEEnvironment()
    if (workspaceFromIDE) {
      return this.setCached(cacheKey, workspaceFromIDE)
    }

    // 策略2：PromptX专用环境变量
    const workspaceFromEnv = await this._fromPromptXEnvironment()
    if (workspaceFromEnv) {
      return this.setCached(cacheKey, workspaceFromEnv)
    }

    // 策略3：如果上下文指定了特定策略（如init命令），直接使用项目根目录
    if (context.strategies) {
      const workspaceFromProject = await this._fromProjectRoot(context)
      if (workspaceFromProject) {
        return this.setCached(cacheKey, workspaceFromProject)
      }
    }

    // 策略4：现有.promptx目录
    const workspaceFromExisting = await this._fromExistingDirectory(context.startDir)
    if (workspaceFromExisting) {
      return this.setCached(cacheKey, workspaceFromExisting)
    }

    // 策略5：项目根目录
    const workspaceFromProject = await this._fromProjectRoot(context)
    if (workspaceFromProject) {
      return this.setCached(cacheKey, workspaceFromProject)
    }

    // 策略6：回退到当前目录
    return this.setCached(cacheKey, context.startDir || process.cwd())
  }

  /**
   * 从IDE环境变量获取
   */
  async _fromIDEEnvironment() {
    const workspaceFolders = process.env.WORKSPACE_FOLDER_PATHS
    if (workspaceFolders) {
      try {
        const folders = JSON.parse(workspaceFolders)
        if (Array.isArray(folders) && folders.length > 0) {
          const firstFolder = folders[0]
          if (await this.isValidDirectory(firstFolder)) {
            return firstFolder
          }
        }
      } catch {
        // 忽略解析错误
      }
    }
    return null
  }

  /**
   * 从PromptX环境变量获取
   */
  async _fromPromptXEnvironment() {
    const promptxWorkspaceEnv = process.env.PROMPTX_WORKSPACE
    if (promptxWorkspaceEnv && promptxWorkspaceEnv.trim() !== '') {
      const workspacePath = this.normalizePath(this.expandHome(promptxWorkspaceEnv))
      if (workspacePath && await this.isValidDirectory(workspacePath)) {
        return workspacePath
      }
    }
    return null
  }

  /**
   * 从现有.promptx目录获取
   */
  async _fromExistingDirectory(startDir) {
    const projectRoot = await this.projectRootLocator._findByExistingPromptx(startDir || process.cwd())
    return projectRoot
  }

  /**
   * 从项目根目录获取
   */
  async _fromProjectRoot(context) {
    const projectRoot = await this.projectRootLocator.locate(context)
    return projectRoot
  }
}

/**
 * 目录定位器工厂
 */
class DirectoryLocatorFactory {
  /**
   * 创建项目根目录定位器
   */
  static createProjectRootLocator(options = {}) {
    const platform = process.platform
    
    // 根据平台创建特定实现
    if (platform === 'win32') {
      return new WindowsProjectRootLocator(options)
    } else {
      return new ProjectRootLocator(options)
    }
  }

  /**
   * 创建PromptX工作空间定位器
   */
  static createPromptXWorkspaceLocator(options = {}) {
    const projectRootLocator = this.createProjectRootLocator(options)
    return new PromptXWorkspaceLocator({
      ...options,
      projectRootLocator
    })
  }

  /**
   * 获取平台信息
   */
  static getPlatform() {
    return process.platform
  }
}

/**
 * Windows平台的项目根目录定位器
 * 特殊处理Windows环境下的路径问题
 */
class WindowsProjectRootLocator extends ProjectRootLocator {
  constructor(options = {}) {
    super({
      ...options,
      // Windows默认避免用户家目录
      avoidUserHome: options.avoidUserHome !== false
    })
  }

  /**
   * Windows特有的项目根目录验证
   */
  async _validateProjectRoot(projectRoot, context = {}) {
    // 调用基类验证
    const baseValid = await super._validateProjectRoot(projectRoot, context)
    if (!baseValid) {
      return false
    }

    // Windows特有：避免系统关键目录
    const systemPaths = [
      'C:\\Windows',
      'C:\\Program Files',
      'C:\\Program Files (x86)',
      'C:\\System Volume Information'
    ]

    const resolvedPath = path.resolve(projectRoot).toUpperCase()
    for (const systemPath of systemPaths) {
      if (resolvedPath.startsWith(systemPath.toUpperCase())) {
        return false
      }
    }

    return true
  }
}

module.exports = {
  DirectoryLocator,
  ProjectRootLocator,
  PromptXWorkspaceLocator,
  DirectoryLocatorFactory,
  WindowsProjectRootLocator
} 