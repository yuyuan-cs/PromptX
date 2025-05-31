#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const packageJson = require('../../package.json');

// 导入命令模块
const helloCommand = require('../lib/commands/hello');
const initCommand = require('../lib/commands/init');
const learnCommand = require('../lib/commands/learn');
const recallCommand = require('../lib/commands/recall');
const rememberCommand = require('../lib/commands/remember');

// 创建主程序
const program = new Command();

// 设置程序信息
program
  .name('promptx')
  .description(packageJson.description)
  .version(packageJson.version, '-v, --version', 'display version number');

// 添加五大核心命令
program
  .command('init')
  .description('🏗️  项目集成 - 在当前项目中初始化PromptX集成')
  .option('-f, --force', '强制重新初始化(覆盖已存在的配置)')
  .action(initCommand);

program
  .command('hello')
  .description('🎯 系统入口 - AI助手接待用户并展示可用角色')
  .action(helloCommand);

program
  .command('learn <resource>')
  .description('📚 学习命令 - AI获取和理解提示词内容')
  .option('-f, --format <type>', '输出格式 (text|json)', 'text')
  .action(learnCommand);

program
  .command('recall')
  .description('🔍 记忆检索 - AI回忆和检索记忆内容')
  .option('-r, --recent', '显示最近的记忆')
  .option('-i, --important', '显示重要记忆 (评分≥7)')
  .option('-l, --limit <number>', '限制返回数量', '10')
  .action(recallCommand);

program
  .command('remember <content>')
  .description('🧠 记忆保存 - AI保存重要信息和经验')
  .option('-s, --score <number>', '重要性评分 (1-10)', '5')
  .option('-d, --duration <time>', '有效期 (短期|中期|长期)', '短期')
  .action(rememberCommand);

// 全局错误处理
program.configureHelp({
  helpWidth: 100,
  sortSubcommands: true
});

// 添加示例说明
program.addHelpText('after', `

${chalk.cyan('示例:')}
  ${chalk.gray('# 项目集成，初始化PromptX')}
  promptx init
  promptx init --force

  ${chalk.gray('# 系统入口，展示可用角色')}
  promptx hello

  ${chalk.gray('# 学习协议和核心内容')}
  promptx learn protocols
  promptx learn core

  ${chalk.gray('# 学习特定角色')}
  promptx learn prompt/domain/scrum/role/product-owner.role.md

  ${chalk.gray('# 检索记忆')}
  promptx recall --recent
  promptx recall --important

  ${chalk.gray('# 保存记忆')}
  promptx remember "重要发现" --score 8
  promptx remember "用户反馈" --score 7 --duration 长期

${chalk.cyan('AI认知循环:')}
  🏗️ ${chalk.cyan('init')} → 👋 ${chalk.yellow('hello')} → 📚 ${chalk.blue('learn')} → 🔍 ${chalk.green('recall')} → 🧠 ${chalk.magenta('remember')} → 循环

${chalk.cyan('更多信息:')}
  GitHub: ${chalk.underline('https://github.com/Deepractice/PromptX')}
  文档:   ${chalk.underline('https://deepractice.ai')}
`);

// 处理未知命令
program.on('command:*', () => {
  console.error(chalk.red(`错误: 未知命令 '${program.args.join(' ')}'`));
  console.log('');
  program.help();
});

// 如果没有参数，显示帮助
if (process.argv.length === 2) {
  program.help();
}

// 解析命令行参数
program.parse(process.argv); 