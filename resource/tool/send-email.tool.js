/**
 * @tool send-email
 * @description 邮件发送工具（演示版）
 * @version 1.0.0
 */

module.exports = {
  /**
   * 获取工具元信息
   * @returns {Object} 工具元信息
   */
  getMetadata() {
    return {
      name: 'send-email',
      description: '邮件发送工具，支持发送格式化邮件（演示版本）',
      version: '1.0.0',
      author: 'PromptX Framework',
      category: 'communication',
      tags: ['email', 'communication', 'notification'],
      demo: true
    }
  },

  /**
   * 获取参数Schema
   * @returns {Object} JSON Schema定义
   */
  getSchema() {
    return {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          format: 'email',
          description: '收件人邮箱地址'
        },
        subject: {
          type: 'string',
          minLength: 1,
          description: '邮件主题'
        },
        content: {
          type: 'string',
          minLength: 1,
          description: '邮件内容'
        },
        cc: {
          type: 'array',
          items: {
            type: 'string',
            format: 'email'
          },
          description: '抄送邮箱列表（可选）'
        },
        priority: {
          type: 'string',
          enum: ['low', 'normal', 'high'],
          default: 'normal',
          description: '邮件优先级'
        }
      },
      required: ['to', 'subject', 'content'],
      additionalProperties: false
    }
  },

  /**
   * 验证参数
   * @param {Object} params - 输入参数
   * @returns {boolean} 验证结果
   */
  validate(params) {
    const { to, subject, content } = params
    
    // 检查必需参数
    if (!to || !subject || !content) {
      return false
    }
    
    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return false
    }
    
    // 检查抄送邮箱格式（如果存在）
    if (params.cc && Array.isArray(params.cc)) {
      for (const ccEmail of params.cc) {
        if (!emailRegex.test(ccEmail)) {
          return false
        }
      }
    }
    
    return true
  },

  /**
   * 发送邮件（演示版本）
   * @param {Object} params - 邮件参数
   * @param {string} params.to - 收件人邮箱
   * @param {string} params.subject - 邮件主题
   * @param {string} params.content - 邮件内容
   * @param {string[]} params.cc - 抄送邮箱列表（可选）
   * @param {string} params.priority - 邮件优先级（可选）
   * @returns {Object} 发送结果
   */
  async execute(params) {
    const { to, subject, content, cc = [], priority = 'normal' } = params
    
    // 生成邮件ID（演示用）
    const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 格式化邮件内容
    const formattedEmail = this.formatEmail({
      to,
      subject,
      content,
      cc,
      priority,
      timestamp: new Date().toISOString()
    })
    
    // 模拟发送延迟
    await this.simulateDelay(500)
    
    // 演示版本：不实际发送邮件，只返回格式化结果
    return {
      success: true,
      email_id: emailId,
      to,
      subject,
      content_preview: content.slice(0, 100) + (content.length > 100 ? '...' : ''),
      cc_count: cc.length,
      priority,
      timestamp: new Date().toISOString(),
      formatted_email: formattedEmail,
      demo_note: '这是演示版本，邮件未实际发送',
      status: 'demo_sent'
    }
  },

  /**
   * 格式化邮件内容
   * @param {Object} emailData - 邮件数据
   * @returns {string} 格式化的邮件
   */
  formatEmail(emailData) {
    const { to, subject, content, cc, priority, timestamp } = emailData
    
    let formatted = `收件人: ${to}\n`
    
    if (cc.length > 0) {
      formatted += `抄送: ${cc.join(', ')}\n`
    }
    
    formatted += `主题: ${subject}\n`
    formatted += `优先级: ${this.getPriorityText(priority)}\n`
    formatted += `时间: ${new Date(timestamp).toLocaleString('zh-CN')}\n`
    formatted += `\n内容:\n${content}\n`
    
    return formatted
  },

  /**
   * 获取优先级文本
   * @param {string} priority - 优先级
   * @returns {string} 优先级文本
   */
  getPriorityText(priority) {
    const priorityMap = {
      low: '低',
      normal: '普通',
      high: '高'
    }
    return priorityMap[priority] || '普通'
  },

  /**
   * 模拟网络延迟
   * @param {number} ms - 延迟毫秒数
   */
  async simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  },

  /**
   * 工具初始化
   */
  async init() {
    // 在实际版本中，这里可以初始化邮件服务连接
    return true
  },

  /**
   * 工具清理
   */
  async cleanup() {
    // 在实际版本中，这里可以关闭邮件服务连接
    return true
  }
}