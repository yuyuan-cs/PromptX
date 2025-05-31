const chalk = require('chalk');
const logger = require('../utils/logger');

/**
 * promptx hello 命令
 * 系统入口 - AI助手接待用户并展示可用角色
 */
async function helloCommand(options) {
  try {
    logger.step('PromptX Hello - 系统初始化中...');
    
    // TODO: 实现在任务 2.1 中
    console.log(chalk.cyan(`
🎯 PromptX 系统入口

${chalk.yellow('功能:')} AI助手接待用户并展示可用角色
${chalk.yellow('状态:')} 待实现 (任务 2.1)

${chalk.green('下一步:')} 
  请执行任务 2.1 来实现完整的 hello 命令功能
    `));

    logger.info('Hello命令框架已就绪，等待具体实现');
    
  } catch (error) {
    logger.error('Hello命令执行失败:', error.message);
    process.exit(1);
  }
}

module.exports = helloCommand; 