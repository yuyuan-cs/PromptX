/**
 * PromptX 系统常量配置
 * 统一管理命令格式、路径等配置信息
 */

const PromptXConfig = require('./lib/utils/promptxConfig')

// 缓存配置实例和命令前缀
let _config = null
let _cachedPrefix = null

/**
 * 获取配置实例
 */
function getConfig() {
  if (!_config) {
    _config = new PromptXConfig()
  }
  return _config
}

/**
 * 动态检测命令前缀
 * 优先级：环境变量 > npm环境变量检测 > 配置文件 > 默认值
 */
function detectCommandPrefix() {
  // 在 init 过程中，优先使用实时检测而不是缓存
  const isInitProcess = process.argv.includes('init')
  
  // 如果不是 init 过程且有缓存，返回缓存结果
  if (!isInitProcess && _cachedPrefix) {
    return _cachedPrefix
  }

  // 1. 环境变量优先（用于测试和自定义）
  if (process.env.DPML_COMMAND_PREFIX) {
    _cachedPrefix = process.env.DPML_COMMAND_PREFIX
    return _cachedPrefix
  }

  // 2. 如果不是 init 过程，优先尝试读取配置文件
  if (!isInitProcess) {
    try {
      const config = getConfig()
      const configPath = config.getPath('command-prefix')
      const fs = require('fs')
      if (fs.existsSync(configPath)) {
        const savedPrefix = fs.readFileSync(configPath, 'utf8').trim()
        if (savedPrefix) {
          _cachedPrefix = savedPrefix
          return _cachedPrefix
        }
      }
    } catch (error) {
      // 忽略读取错误，继续下一步检测
    }
  }

  // 3. npm环境变量检测
  if (process.env.npm_execpath?.includes('npx') || 
      process.env.npm_config_user_agent?.includes('npx')) {
    _cachedPrefix = 'npx -y dpml-prompt'
    return _cachedPrefix
  }

  // 4. 默认值
  _cachedPrefix = 'dpml-prompt'
  return _cachedPrefix
}

/**
 * 智能推测用户使用的命令前缀
 * 从 process.argv 中提取 init 之前的所有部分作为命令前缀
 */
function reconstructCommandPrefix() {
  try {
    // 从 process.argv 中找到 init 命令的位置
    const initIndex = process.argv.findIndex(arg => arg === 'init')
    
    if (initIndex > 0) {
      // 提取 init 之前的所有参数，跳过 node 可执行文件路径
      const prefixParts = process.argv.slice(1, initIndex)
      
      if (prefixParts.length > 0) {
        // 检查脚本路径是否包含典型的开发模式特征
        const firstPart = prefixParts[0]
        if (firstPart.includes('promptx.js') || 
            firstPart.includes('cli.js') || 
            firstPart.includes('bin/') ||
            firstPart.includes('src/bin/') ||
            firstPart.includes('/usr/local/bin/dpml-prompt') ||
            firstPart.endsWith('dpml-prompt')) {
          // 开发模式或全局安装，使用包名
          return 'dpml-prompt'
        }
        
        // 直接使用检测到的前缀
        return prefixParts.join(' ')
      }
    }
    
    // 如果找不到 init 或解析失败，使用环境变量判断
    if (process.env.npm_execpath && process.env.npm_execpath.includes('npx')) {
      return 'npx -y dpml-prompt'
    }
    
    return 'dpml-prompt'
  } catch (error) {
    // 解析失败时的回退逻辑
    return 'dpml-prompt'
  }
}

/**
 * 保存命令前缀到配置文件
 * 在init命令中调用
 */
async function saveCommandPrefix() {
  try {
    // 先清除缓存，确保使用最新的检测结果
    _cachedPrefix = null
    
    // 使用reconstructCommandPrefix来获取用户实际使用的命令
    const actualPrefix = reconstructCommandPrefix()
    const config = getConfig()
    await config.writeText('command-prefix', actualPrefix)
    
    // 保存后更新缓存
    _cachedPrefix = actualPrefix
    
    return actualPrefix
  } catch (error) {
    console.warn('保存命令前缀失败:', error.message)
    return null
  }
}

// 动态生成命令常量（函数式）
function getCommands() {
  const prefix = detectCommandPrefix()
  return {
    INIT: `${prefix} init`,
    HELLO: `${prefix} hello`,
    ACTION: `${prefix} action`,
    LEARN: `${prefix} learn`,
    RECALL: `${prefix} recall`,
    REMEMBER: `${prefix} remember`,
    HELP: `${prefix} help`
  }
}

// 带参数的命令构建函数
function getBuildCommand() {
  const prefix = detectCommandPrefix()
  return {
    action: (roleId) => `${prefix} action ${roleId}`,
    learn: (resource) => `${prefix} learn ${resource}`,
    recall: (query = '') => `${prefix} recall${query ? ' ' + query : ''}`,
    remember: (content = '<content>') => `${prefix} remember${content !== '<content>' ? ' "' + content + '"' : ' <content>'}`
  }
}

// 为了向后兼容，保留原有的静态导出方式
// 但实际上是动态计算的
const COMMANDS = new Proxy({}, {
  get(target, prop) {
    return getCommands()[prop]
  }
})

const buildCommand = new Proxy({}, {
  get(target, prop) {
    return getBuildCommand()[prop]
  }
})

// 系统路径配置（静态）
const PATHS = {
  POUCH_DIR: '.promptx',
  MEMORY_DIR: '.promptx/memory',
  STATE_FILE: '.promptx/pouch.json',
  MEMORY_FILE: '.promptx/memory/declarative.md'
}

// 版本信息
const VERSION = '0.0.1'

// 系统状态
const STATES = {
  INITIALIZED: 'initialized',
  ROLE_DISCOVERY: 'role_discovery',
  ACTION_PLAN_GENERATED: 'action_plan_generated',
  LEARNED_ROLE: 'learned_role',
  MEMORY_SAVED: 'memory_saved',
  RECALL_WAITING: 'recall-waiting'
}

/**
 * 清除缓存（主要用于测试）
 */
function clearCache() {
  _cachedPrefix = null
  _config = null
}

// 导出
module.exports = {
  // 新的函数式API（推荐）
  getCommands,
  getBuildCommand,
  detectCommandPrefix,
  reconstructCommandPrefix,
  saveCommandPrefix,
  clearCache,
  
  // 向后兼容的静态API
  COMMANDS,
  buildCommand,
  
  // 其他静态常量
  PATHS,
  VERSION,
  STATES
}
