const fs = require('fs-extra')
const path = require('path')
const os = require('os')

/**
 * DACP用户级配置管理器
 * 管理 ~/.promptx/dacp/ 下的配置文件
 */
class DACPConfigManager {
  constructor() {
    this.userHome = os.homedir()
    this.dacpConfigDir = path.join(this.userHome, '.promptx', 'dacp')
  }

  /**
   * 确保DACP配置目录存在
   */
  async ensureConfigDir() {
    await fs.ensureDir(this.dacpConfigDir)
  }

  /**
   * 获取指定action的配置文件路径
   * @param {string} action - action名称，如 'send_email'
   * @returns {string} 配置文件完整路径
   */
  getConfigPath(action) {
    return path.join(this.dacpConfigDir, `${action}.json`)
  }

  /**
   * 读取action配置
   * @param {string} action - action名称
   * @returns {Promise<Object|null>} 配置对象或null
   */
  async readActionConfig(action) {
    const configPath = this.getConfigPath(action)
    
    try {
      if (await fs.pathExists(configPath)) {
        return await fs.readJson(configPath)
      }
      return null
    } catch (error) {
      console.warn(`读取DACP配置失败 ${action}:`, error.message)
      return null
    }
  }

  /**
   * 写入action配置
   * @param {string} action - action名称
   * @param {Object} config - 配置对象
   */
  async writeActionConfig(action, config) {
    await this.ensureConfigDir()
    const configPath = this.getConfigPath(action)
    await fs.writeJson(configPath, config, { spaces: 2 })
  }

  /**
   * 检查action配置是否存在
   * @param {string} action - action名称
   * @returns {Promise<boolean>}
   */
  async hasActionConfig(action) {
    const configPath = this.getConfigPath(action)
    return await fs.pathExists(configPath)
  }

  /**
   * 验证邮件配置
   * @param {Object} config - 邮件配置对象
   * @returns {Object} 验证结果 {valid: boolean, errors: string[]}
   */
  validateEmailConfig(config) {
    const errors = []
    
    if (!config) {
      errors.push('配置对象不能为空')
      return { valid: false, errors }
    }

    // 验证provider
    if (!config.provider) {
      errors.push('缺少邮件服务提供商(provider)配置')
    }

    // 验证SMTP配置
    if (!config.smtp) {
      errors.push('缺少SMTP配置')
    } else {
      if (!config.smtp.user) {
        errors.push('缺少SMTP用户名(smtp.user)')
      }
      if (!config.smtp.password) {
        errors.push('缺少SMTP密码(smtp.password)')
      }
    }

    // 验证发件人配置
    if (!config.sender) {
      errors.push('缺少发件人配置(sender)')
    } else {
      if (!config.sender.email) {
        errors.push('缺少发件人邮箱(sender.email)')
      }
      if (!config.sender.name) {
        errors.push('缺少发件人姓名(sender.name)')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 获取邮件服务提供商配置
   * @param {string} provider - 提供商名称
   * @returns {Object} 提供商配置
   */
  getProviderConfig(provider) {
    const providers = {
      gmail: {
        smtp: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireAuth: true
      },
      outlook: {
        smtp: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        requireAuth: true
      },
      qq: {
        smtp: 'smtp.qq.com',
        port: 465,
        secure: true,
        requireAuth: true
      },
      '163': {
        smtp: 'smtp.163.com',
        port: 465,
        secure: true,
        requireAuth: true
      },
      '126': {
        smtp: 'smtp.126.com',
        port: 465,
        secure: true,
        requireAuth: true
      }
    }

    return providers[provider] || null
  }

  /**
   * 生成配置错误提示信息
   * @param {string} action - action名称
   * @param {Object} validation - 验证结果
   * @returns {string} 错误提示信息
   */
  generateConfigErrorMessage(action, validation = null) {
    const configPath = this.getConfigPath(action)
    
    let message = `\n📧 DACP邮件服务配置缺失\n\n`
    
    if (!validation) {
      // 配置文件不存在
      message += `❌ 配置文件不存在: ${configPath}\n\n`
      message += `📝 请创建配置文件，内容如下:\n\n`
      message += `{\n`
      message += `  "provider": "gmail",\n`
      message += `  "smtp": {\n`
      message += `    "user": "your-email@gmail.com",\n`
      message += `    "password": "your-app-password"\n`
      message += `  },\n`
      message += `  "sender": {\n`
      message += `    "name": "Your Name",\n`
      message += `    "email": "your-email@gmail.com"\n`
      message += `  }\n`
      message += `}\n\n`
      message += `💡 支持的邮件服务商: gmail, outlook, qq, 163, 126\n\n`
      message += `🔐 Gmail用户需要使用应用专用密码:\n`
      message += `   1. 进入 Google 账户设置\n`
      message += `   2. 启用两步验证\n`
      message += `   3. 生成应用专用密码\n`
      message += `   4. 使用生成的密码替换上面的 "your-app-password"\n`
    } else {
      // 配置不完整
      message += `❌ 配置文件存在但不完整: ${configPath}\n\n`
      message += `缺少以下配置项:\n`
      validation.errors.forEach(error => {
        message += `  • ${error}\n`
      })
      message += `\n请检查并完善配置文件。\n`
    }
    
    return message
  }
}

module.exports = DACPConfigManager