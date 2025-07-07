const fs = require('fs-extra')
const path = require('path')
const os = require('os')
const crypto = require('crypto')

/**
 * 多项目管理器
 * 支持多个MCP实例同时绑定不同项目，彻底解决多项目开发环境下的角色混乱问题
 * 使用三元组唯一标识：MCP ID + IDE类型 + 项目Hash
 */
class ProjectManager {
  constructor() {
    this.promptxHomeDir = path.join(os.homedir(), '.promptx')
    this.projectsDir = path.join(this.promptxHomeDir, 'project')
  }

  /**
   * 注册项目到MCP实例
   * @param {string} projectPath - 项目绝对路径
   * @param {string} mcpId - MCP进程ID
   * @param {string} ideType - IDE类型（cursor/vscode等）
   * @returns {Promise<Object>} 项目配置对象
   */
  async registerProject(projectPath, mcpId, ideType) {
    // 验证项目路径
    if (!await this.validateProjectPath(projectPath)) {
      throw new Error(`无效的项目路径: ${projectPath}`)
    }

    // 生成项目配置
    const projectConfig = {
      mcpId: mcpId,
      ideType: ideType.toLowerCase(),
      projectPath: path.resolve(projectPath),
      projectHash: this.generateProjectHash(projectPath)
    }

    // 确保项目目录存在
    await fs.ensureDir(this.projectsDir)

    // 生成配置文件名并保存
    const fileName = this.generateConfigFileName(mcpId, ideType, projectPath)
    const configPath = path.join(this.projectsDir, fileName)
    
    await fs.writeJson(configPath, projectConfig, { spaces: 2 })
    
    return projectConfig
  }

  /**
   * 根据MCP ID获取单个项目配置（假设只有一个项目）
   * @param {string} mcpId - MCP进程ID
   * @returns {Promise<Object|null>} 项目配置对象
   */
  async getProjectByMcpId(mcpId) {
    const projects = await this.getProjectsByMcpId(mcpId)
    return projects.length > 0 ? projects[0] : null
  }

  /**
   * 根据MCP ID获取所有绑定的项目配置
   * @param {string} mcpId - MCP进程ID
   * @returns {Promise<Array>} 项目配置数组
   */
  async getProjectsByMcpId(mcpId) {
    if (!await fs.pathExists(this.projectsDir)) {
      return []
    }

    const files = await fs.readdir(this.projectsDir)
    const projects = []

    for (const file of files) {
      if (file.startsWith(`${mcpId}-`) && file.endsWith('.json')) {
        try {
          const configPath = path.join(this.projectsDir, file)
          const config = await fs.readJson(configPath)
          if (config.mcpId === mcpId) {
            projects.push(config)
          }
        } catch (error) {
          // 忽略损坏的配置文件
          console.warn(`跳过损坏的配置文件: ${file}`)
        }
      }
    }

    return projects
  }

  /**
   * 获取特定项目的所有实例（不同IDE/MCP的绑定）
   * @param {string} projectPath - 项目路径
   * @returns {Promise<Array>} 项目实例数组
   */
  async getProjectInstances(projectPath) {
    if (!await fs.pathExists(this.projectsDir)) {
      return []
    }

    const projectHash = this.generateProjectHash(projectPath)
    const files = await fs.readdir(this.projectsDir)
    const instances = []

    for (const file of files) {
      if (file.includes(`-${projectHash}.json`)) {
        try {
          const configPath = path.join(this.projectsDir, file)
          const config = await fs.readJson(configPath)
          if (config.projectHash === projectHash) {
            instances.push(config)
          }
        } catch (error) {
          console.warn(`跳过损坏的配置文件: ${file}`)
        }
      }
    }

    return instances
  }

  /**
   * 删除项目绑定
   * @param {string} mcpId - MCP进程ID
   * @param {string} ideType - IDE类型
   * @param {string} projectPath - 项目路径
   * @returns {Promise<boolean>} 是否删除成功
   */
  async removeProject(mcpId, ideType, projectPath) {
    const fileName = this.generateConfigFileName(mcpId, ideType, projectPath)
    const configPath = path.join(this.projectsDir, fileName)
    
    if (await fs.pathExists(configPath)) {
      await fs.remove(configPath)
      return true
    }
    
    return false
  }

  /**
   * 清理过期的项目配置
   * @returns {Promise<number>} 清理的配置文件数量
   */
  async cleanupExpiredProjects() {
    if (!await fs.pathExists(this.projectsDir)) {
      return 0
    }

    const files = await fs.readdir(this.projectsDir)
    let cleanedCount = 0

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const configPath = path.join(this.projectsDir, file)
          const config = await fs.readJson(configPath)
          
          // 检查项目路径是否仍然存在
          if (!await fs.pathExists(config.projectPath)) {
            await fs.remove(configPath)
            cleanedCount++
            console.log(`清理过期项目配置: ${file}`)
          }
        } catch (error) {
          // 清理损坏的配置文件
          await fs.remove(path.join(this.projectsDir, file))
          cleanedCount++
          console.log(`清理损坏配置文件: ${file}`)
        }
      }
    }

    return cleanedCount
  }

  /**
   * 生成多项目环境下的AI提示词
   * @param {string} contextType - 上下文类型：'list'/'action'/'learn'
   * @param {string} mcpId - MCP进程ID
   * @param {string} ideType - IDE类型
   * @returns {Promise<string>} 格式化的AI提示词
   */
  async generateTopLevelProjectPrompt(contextType = 'list', mcpId, ideType) {
    const projects = await this.getProjectsByMcpId(mcpId)
    
    if (projects.length === 0) {
      // 未注册任何项目
      return `🛑 **项目环境未初始化** 🛑
⚠️ **当前MCP实例(${mcpId})尚未绑定任何项目**

💢 **立即执行**：
1. 调用 \`promptx_init\` 工具注册当前项目
2. 提供正确的 workingDirectory 参数
3. 确认项目绑定后重新开始

⛔ **严禁继续**：未初始化环境中的任何操作都可能失败！`
    }
    
    if (projects.length === 1) {
      // 单项目环境（保持现有体验）
      const project = projects[0]
      const basePrompt = `🛑 **项目环境验证** 🛑
📍 当前绑定项目: ${project.projectPath}
🔗 MCP实例: ${mcpId} (${ideType})

⚠️ **执行前确认**：上述路径是否为你当前工作的项目？`

      switch (contextType) {
        case 'action':
          return `${basePrompt}
如不一致，立即停止所有操作并使用 \`promptx_init\` 更新！

💥 **严重警告**：在错误项目路径下操作将导致不可预知的错误！`
        
        case 'learn':
          return `${basePrompt}
错误环境将导致知识关联失效！

💥 **严重警告**：项目环境不匹配将影响学习效果！`
        
        default:
          return `${basePrompt}
如不一致，必须使用 \`promptx_init\` 更新正确路径！

💥 **严重警告**：错误的项目环境将导致服务异常！`
      }
    }
    
    // 多项目环境
    const projectList = projects.map((proj, index) => 
      `${index + 1}. ${path.basename(proj.projectPath)} (${proj.projectPath})`
    ).join('\n')
    
    return `🎯 **多项目环境检测** 🎯
📍 当前MCP实例(${mcpId})已绑定 ${projects.length} 个项目：

${projectList}

⚠️ **请明确指定**：你要在哪个项目中执行操作？
💡 **建议**：在对话中明确说明项目名称或路径`
  }

  /**
   * 验证路径是否为有效的项目目录
   * @param {string} projectPath - 要验证的路径
   * @returns {Promise<boolean>} 是否为有效项目目录
   */
  async validateProjectPath(projectPath) {
    try {
      // 基础检查：路径存在且为目录
      const stat = await fs.stat(projectPath)
      if (!stat.isDirectory()) {
        return false
      }

      // 简单检查：避免明显错误的路径
      const resolved = path.resolve(projectPath)
      const homeDir = os.homedir()
      
      // 不允许是用户主目录
      if (resolved === homeDir) {
        return false
      }

      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 生成配置文件名
   * @param {string} mcpId - MCP进程ID
   * @param {string} ideType - IDE类型
   * @param {string} projectPath - 项目路径
   * @returns {string} 配置文件名
   */
  generateConfigFileName(mcpId, ideType, projectPath) {
    const projectHash = this.generateProjectHash(projectPath)
    const projectName = path.basename(projectPath).toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const ideTypeSafe = ideType.replace(/[^a-z0-9-]/g, '').toLowerCase() || 'unknown'
    return `${mcpId}-${ideTypeSafe}-${projectName}-${projectHash}.json`
  }

  /**
   * 生成项目路径的Hash值
   * @param {string} projectPath - 项目路径
   * @returns {string} 8位Hash值
   */
  generateProjectHash(projectPath) {
    return crypto.createHash('md5').update(path.resolve(projectPath)).digest('hex').substr(0, 8)
  }

  /**
   * 从配置文件中获取IDE类型
   * @param {string} mcpId - MCP进程ID
   * @returns {Promise<string>} IDE类型
   */
  async getIdeType(mcpId) {
    const project = await this.getProjectByMcpId(mcpId)
    return project ? project.ideType : 'unknown'
  }

  /**
   * 生成MCP进程ID - 基于进程ID确保实例唯一
   * @param {string} ideType - IDE类型（保留参数兼容性，实际不使用）
   * @returns {string} MCP进程ID
   */
  static generateMcpId(ideType = 'unknown') {
    return `mcp-${process.pid}`
  }
}

module.exports = ProjectManager