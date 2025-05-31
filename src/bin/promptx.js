#!/usr/bin/env node

const { Command } = require('commander')
const chalk = require('chalk')
const packageJson = require('../../package.json')

// 导入锦囊框架
const { cli } = require('../lib/core/pouch')

// 创建主程序
const program = new Command()

// 设置程序信息
program
  .name('promptx')
  .description(packageJson.description)
  .version(packageJson.version, '-v, --version', 'display version number')

// 五大核心锦囊命令
program
  .command('init [workspacePath]')
  .description('🏗️ init锦囊 - 初始化工作环境，传达系统基本诺记')
  .action(async (workspacePath, options) => {
    await cli.execute('init', workspacePath ? [workspacePath] : [])
  })

program
  .command('hello')
  .description('👋 hello锦囊 - 发现并展示所有可用的AI角色和领域专家')
  .action(async (options) => {
    await cli.execute('hello', [])
  })

program
  .command('action <role>')
  .description('⚡ action锦囊 - 激活特定AI角色，获取专业提示词')
  .action(async (role, options) => {
    await cli.execute('action', [role])
  })

program
  .command('learn [resourceUrl]')
  .description('📚 learn锦囊 - 学习指定协议的资源内容(thought://、execution://等)')
  .action(async (resourceUrl, options) => {
    await cli.execute('learn', resourceUrl ? [resourceUrl] : [])
  })

program
  .command('recall [query]')
  .description('🔍 recall锦囊 - AI主动从记忆中检索相关的专业知识')
  .action(async (query, options) => {
    await cli.execute('recall', query ? [query] : [])
  })

program
  .command('remember <key> [value...]')
  .description('🧠 remember锦囊 - AI主动内化知识和经验到记忆体系')
  .action(async (key, value, options) => {
    const args = [key, ...(value || [])]
    await cli.execute('remember', args)
  })

// 全局错误处理
program.configureHelp({
  helpWidth: 100,
  sortSubcommands: true
})

// 添加示例说明
program.addHelpText('after', `

${chalk.cyan('💡 PromptX 锦囊框架 - AI use CLI get prompt for AI')}

${chalk.cyan('🎒 五大锦囊命令:')}
  🏗️ ${chalk.cyan('init')}   → 初始化环境，传达系统协议
  👋 ${chalk.yellow('hello')}  → 发现可用角色和领域专家  
  ⚡ ${chalk.red('action')} → 激活特定角色，获取专业能力
  📚 ${chalk.blue('learn')}  → 深入学习领域知识体系
  🔍 ${chalk.green('recall')} → AI主动检索应用记忆
  🧠 ${chalk.magenta('remember')} → AI主动内化知识增强记忆

${chalk.cyan('示例:')}
  ${chalk.gray('# 1️⃣ 初始化锦囊系统')}
  promptx init

  ${chalk.gray('# 2️⃣ 发现可用角色')}
  promptx hello

  ${chalk.gray('# 3️⃣ 激活专业角色')}
  promptx action copywriter
  promptx action scrum-master

  ${chalk.gray('# 4️⃣ 学习领域知识')}
  promptx learn scrum
  promptx learn copywriter

  ${chalk.gray('# 5️⃣ 检索相关经验')}
  promptx recall agile
  promptx recall
  
  ${chalk.gray('# 6️⃣ AI内化专业知识')}
  promptx remember "scrum-tips" "每日站会控制在15分钟内"
  promptx remember "deploy-flow" "测试→预发布→生产"

${chalk.cyan('🔄 PATEOAS状态机:')}
  每个锦囊输出都包含 PATEOAS 导航，引导 AI 发现下一步操作
  即使 AI 忘记上文，仍可通过锦囊独立执行

${chalk.cyan('💭 核心理念:')}
  • 锦囊自包含：每个命令包含完整执行信息
  • 串联无依赖：AI忘记上文也能继续执行
  • 分阶段专注：每个锦囊专注单一任务
  • Prompt驱动：输出引导AI发现下一步

${chalk.cyan('更多信息:')}
  GitHub: ${chalk.underline('https://github.com/Deepractice/PromptX')}
  组织:   ${chalk.underline('https://github.com/Deepractice')}
`)

// 处理未知命令
program.on('command:*', () => {
  console.error(chalk.red(`错误: 未知命令 '${program.args.join(' ')}'`))
  console.log('')
  program.help()
})

// 如果没有参数，显示帮助
if (process.argv.length === 2) {
  program.help()
}

// 解析命令行参数
program.parse(process.argv)
