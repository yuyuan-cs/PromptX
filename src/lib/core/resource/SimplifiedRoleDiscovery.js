const fs = require('fs-extra')
const path = require('path')
const logger = require('../../utils/logger')

/**
 * SimplifiedRoleDiscovery - 简化的角色发现算法
 * 
 * 设计原则：
 * 1. 系统角色：完全依赖静态注册表，零动态扫描
 * 2. 用户角色：最小化文件系统操作，简单有效  
 * 3. 统一接口：单一发现入口，无重复逻辑
 * 4. 跨平台安全：使用Node.js原生API，避免glob
 */
class SimplifiedRoleDiscovery {
  constructor() {
    this.USER_RESOURCE_DIR = '.promptx'
    this.RESOURCE_DOMAIN_PATH = ['resource', 'domain']
  }

  /**
   * 发现所有角色（系统 + 用户）
   * @returns {Promise<Object>} 合并后的角色注册表
   */
  async discoverAllRoles() {
    logger.debug('[SimplifiedRoleDiscovery] 开始发现所有角色...')
    try {
      // 并行加载，提升性能
      const [systemRoles, userRoles] = await Promise.all([
        this.loadSystemRoles(),
        this.discoverUserRoles()
      ])
      
      logger.debug('[SimplifiedRoleDiscovery] 系统角色数量:', Object.keys(systemRoles).length)
      logger.debug('[SimplifiedRoleDiscovery] 用户角色数量:', Object.keys(userRoles).length)
      logger.debug('[SimplifiedRoleDiscovery] 用户角色列表:', Object.keys(userRoles))
      
      // 用户角色覆盖同名系统角色
      const mergedRoles = this.mergeRoles(systemRoles, userRoles)
      logger.debug('[SimplifiedRoleDiscovery] 合并后总角色数量:', Object.keys(mergedRoles).length)
      logger.debug('[SimplifiedRoleDiscovery] 最终角色列表:', Object.keys(mergedRoles))
      
      return mergedRoles
    } catch (error) {
      logger.warn(`[SimplifiedRoleDiscovery] 角色发现失败: ${error.message}`)
      return {}
    }
  }

  /**
   * 加载系统角色（零文件扫描）
   * @returns {Promise<Object>} 系统角色注册表
   */
  async loadSystemRoles() {
    try {
      const registryPath = path.resolve(__dirname, '../../../resource.registry.json')
      
      if (!await fs.pathExists(registryPath)) {
        console.warn('系统资源注册表文件不存在')
        return {}
      }

      const registry = await fs.readJSON(registryPath)
      return registry.protocols?.role?.registry || {}
    } catch (error) {
      console.warn(`加载系统角色失败: ${error.message}`)
      return {}
    }
  }

  /**
   * 发现用户角色（最小化扫描）
   * @returns {Promise<Object>} 用户角色注册表
   */
  async discoverUserRoles() {
    try {
      const userRolePath = await this.getUserRolePath()
      logger.debug('[SimplifiedRoleDiscovery] 用户角色路径:', userRolePath)
      
      // 快速检查：目录不存在直接返回
      if (!await fs.pathExists(userRolePath)) {
        logger.debug('[SimplifiedRoleDiscovery] 用户角色目录不存在')
        return {}
      }
      
      logger.debug('[SimplifiedRoleDiscovery] 开始扫描用户角色目录...')
      const result = await this.scanUserRolesOptimized(userRolePath)
      logger.debug('[SimplifiedRoleDiscovery] 用户角色扫描完成，发现角色:', Object.keys(result))
      return result
    } catch (error) {
      logger.warn(`[SimplifiedRoleDiscovery] 用户角色发现失败: ${error.message}`)
      return {}
    }
  }

  /**
   * 优化的用户角色扫描算法
   * @param {string} basePath - 用户角色基础路径
   * @returns {Promise<Object>} 发现的用户角色
   */
  async scanUserRolesOptimized(basePath) {
    const roles = {}
    
    try {
      // 使用withFileTypes提升性能，一次读取获得文件类型
      const entries = await fs.readdir(basePath, { withFileTypes: true })
      
      // 只处理目录，跳过文件
      const directories = entries.filter(entry => entry.isDirectory())
      
      // 并行检查所有角色目录（性能优化）
      const rolePromises = directories.map(dir => 
        this.checkRoleDirectory(basePath, dir.name)
      )
      
      const roleResults = await Promise.allSettled(rolePromises)
      
      // 收集成功的角色
      roleResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          const roleName = directories[index].name
          roles[roleName] = result.value
        }
      })
      
    } catch (error) {
      console.warn(`扫描用户角色目录失败: ${error.message}`)
    }
    
    return roles
  }

  /**
   * 检查单个角色目录
   * @param {string} basePath - 基础路径
   * @param {string} roleName - 角色名称
   * @returns {Promise<Object|null>} 角色信息或null
   */
  async checkRoleDirectory(basePath, roleName) {
    logger.debug(`[SimplifiedRoleDiscovery] 检查角色目录: ${roleName}`)
    try {
      const roleDir = path.join(basePath, roleName)
      const roleFile = path.join(roleDir, `${roleName}.role.md`)
      logger.debug(`[SimplifiedRoleDiscovery] 角色文件路径: ${roleFile}`)
      
      // 核心检查：主角色文件必须存在
      const fileExists = await fs.pathExists(roleFile)
      logger.debug(`[SimplifiedRoleDiscovery] 角色文件${roleName}是否存在: ${fileExists}`)
      
      if (!fileExists) {
        logger.debug(`[SimplifiedRoleDiscovery] 角色${roleName}文件不存在，跳过`)
        return null
      }
      
      // 简化验证：只检查基础DPML标签
      logger.debug(`[SimplifiedRoleDiscovery] 读取角色文件内容: ${roleName}`)
      const content = await fs.readFile(roleFile, 'utf8')
      const isValid = this.isValidRoleFile(content)
      logger.debug(`[SimplifiedRoleDiscovery] 角色${roleName}内容验证: ${isValid}`)
      
      if (!isValid) {
        logger.debug(`[SimplifiedRoleDiscovery] 角色${roleName}内容格式无效，跳过`)
        return null
      }
      
      // 返回角色信息（简化元数据）
      const roleInfo = {
        file: roleFile,
        name: this.extractRoleName(content) || roleName,
        description: this.extractDescription(content) || `${roleName}专业角色`,
        source: 'user-generated'
      }
      
      logger.debug(`[SimplifiedRoleDiscovery] 角色${roleName}检查成功:`, roleInfo.name)
      return roleInfo
      
    } catch (error) {
      // 单个角色失败不影响其他角色
      logger.warn(`[SimplifiedRoleDiscovery] 角色${roleName}检查失败: ${error.message}`)
      logger.debug(`[SimplifiedRoleDiscovery] 错误堆栈:`, error.stack)
      return null
    }
  }

  /**
   * 简化的DPML验证（只检查关键标签）
   * @param {string} content - 文件内容
   * @returns {boolean} 是否为有效角色文件
   */
  isValidRoleFile(content) {
    if (!content || typeof content !== 'string') {
      return false
    }
    
    const trimmedContent = content.trim()
    if (trimmedContent.length === 0) {
      return false
    }
    
    return trimmedContent.includes('<role>') && trimmedContent.includes('</role>')
  }

  /**
   * 简化的角色名称提取
   * @param {string} content - 文件内容
   * @returns {string|null} 提取的角色名称
   */
  extractRoleName(content) {
    if (!content) return null
    
    // 提取Markdown标题
    const match = content.match(/^#\s*(.+)$/m)
    return match ? match[1].trim() : null
  }

  /**
   * 简化的描述提取
   * @param {string} content - 文件内容
   * @returns {string|null} 提取的描述
   */
  extractDescription(content) {
    if (!content) return null
    
    // 提取Markdown引用（描述）
    const match = content.match(/^>\s*(.+)$/m)
    return match ? match[1].trim() : null
  }

  /**
   * 合并角色（用户优先）
   * @param {Object} systemRoles - 系统角色
   * @param {Object} userRoles - 用户角色
   * @returns {Object} 合并后的角色注册表
   */
  mergeRoles(systemRoles, userRoles) {
    if (!systemRoles || typeof systemRoles !== 'object') {
      systemRoles = {}
    }
    
    if (!userRoles || typeof userRoles !== 'object') {
      userRoles = {}
    }
    
    return {
      ...systemRoles,  // 系统角色作为基础
      ...userRoles     // 用户角色覆盖同名系统角色
    }
  }

  /**
   * 获取用户角色路径
   * @returns {Promise<string>} 用户角色目录路径
   */
  async getUserRolePath() {
    const projectRoot = await this.findProjectRoot()
    return path.join(projectRoot, this.USER_RESOURCE_DIR, ...this.RESOURCE_DOMAIN_PATH)
  }

  /**
   * 简化的项目根目录查找
   * @returns {Promise<string>} 项目根目录路径
   */
  async findProjectRoot() {
    let currentDir = process.cwd()
    
    // 向上查找包含package.json的目录
    while (currentDir !== path.dirname(currentDir)) {
      const packageJsonPath = path.join(currentDir, 'package.json')
      
      try {
        if (await fs.pathExists(packageJsonPath)) {
          return currentDir
        }
      } catch (error) {
        // 忽略权限错误，继续向上查找
      }
      
      currentDir = path.dirname(currentDir)
    }
    
    // 如果没找到package.json，返回当前工作目录
    return process.cwd()
  }
}

module.exports = SimplifiedRoleDiscovery