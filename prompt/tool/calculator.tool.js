/**
 * @tool calculator
 * @description 数学计算工具
 * @version 1.0.0
 */

module.exports = {
  /**
   * 获取工具元信息
   * @returns {Object} 工具元信息
   */
  getMetadata() {
    return {
      name: 'calculator',
      description: '提供基础数学计算功能，支持加减乘除运算',
      version: '1.0.0',
      author: 'PromptX Framework',
      category: 'math',
      tags: ['calculator', 'math', 'arithmetic']
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
        operation: {
          type: 'string',
          enum: ['add', 'subtract', 'multiply', 'divide'],
          description: '数学运算类型'
        },
        a: {
          type: 'number',
          description: '第一个操作数'
        },
        b: {
          type: 'number',
          description: '第二个操作数'
        }
      },
      required: ['operation', 'a', 'b'],
      additionalProperties: false
    }
  },

  /**
   * 验证参数
   * @param {Object} params - 输入参数
   * @returns {boolean} 验证结果
   */
  validate(params) {
    const { operation, a, b } = params
    
    // 检查必需参数
    if (!operation || typeof a !== 'number' || typeof b !== 'number') {
      return false
    }
    
    // 检查操作类型
    const validOperations = ['add', 'subtract', 'multiply', 'divide']
    if (!validOperations.includes(operation)) {
      return false
    }
    
    // 检查除零
    if (operation === 'divide' && b === 0) {
      return false
    }
    
    return true
  },

  /**
   * 执行计算
   * @param {Object} params - 计算参数
   * @param {string} params.operation - 运算类型 ('add', 'subtract', 'multiply', 'divide')
   * @param {number} params.a - 第一个操作数
   * @param {number} params.b - 第二个操作数
   * @returns {Object} 计算结果
   */
  async execute(params) {
    const { operation, a, b } = params
    
    let result
    let expression
    
    switch (operation) {
      case 'add':
        result = a + b
        expression = `${a} + ${b}`
        break
      case 'subtract':
        result = a - b
        expression = `${a} - ${b}`
        break
      case 'multiply':
        result = a * b
        expression = `${a} × ${b}`
        break
      case 'divide':
        if (b === 0) {
          throw new Error('Division by zero is not allowed')
        }
        result = a / b
        expression = `${a} ÷ ${b}`
        break
      default:
        throw new Error(`Unknown operation: ${operation}`)
    }
    
    return {
      expression,
      result,
      operation,
      operands: { a, b },
      formatted: `${expression} = ${result}`
    }
  },

  /**
   * 工具初始化（可选）
   */
  async init() {
    // 可以在这里进行工具初始化工作
    return true
  },

  /**
   * 工具清理（可选）
   */
  async cleanup() {
    // 可以在这里进行清理工作
    return true
  }
}