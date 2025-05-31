const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

/**
 * promptx init 命令
 * 在用户项目中初始化PromptX集成
 */
async function init(options = {}) {
  console.log(chalk.blue.bold('🚀 初始化 PromptX 项目集成...\n'));

  try {
    const projectRoot = process.cwd();
    const promptxDir = path.join(projectRoot, '.promptx');
    const memoryDir = path.join(promptxDir, 'memory');

    // 检查是否已经初始化
    try {
      await fs.access(promptxDir);
      console.log(chalk.yellow('⚠️  项目已经初始化过 PromptX 集成'));
      console.log(chalk.gray(`   .promptx 目录已存在: ${promptxDir}`));
      
      if (!options.force) {
        console.log(chalk.gray('   使用 --force 参数强制重新初始化'));
        return;
      }
      console.log(chalk.blue('🔄 强制重新初始化...'));
    } catch (error) {
      // 目录不存在，继续初始化
    }

    // 创建 .promptx 目录
    await fs.mkdir(promptxDir, { recursive: true });
    console.log(chalk.green('✅ 创建 .promptx 目录'));

    // 创建 .promptx/memory 目录
    await fs.mkdir(memoryDir, { recursive: true });
    console.log(chalk.green('✅ 创建 memory 目录'));

    // 创建基础记忆文件
    const memoryFiles = [
      {
        name: 'declarative.md',
        content: `# 声明式记忆

## 项目重要信息
- 项目初始化时间: ${new Date().toISOString()}
- PromptX 集成状态: ✅ 已完成

## 使用说明
在这里记录项目的重要决策、配置信息和关键知识点。

### 示例条目
**时间**: 2024-01-01T00:00:00.000Z  
**重要性**: 8/10  
**内容**: 项目使用 PromptX 进行 AI 助手集成  
**有效期**: 长期  
`
      },
      {
        name: 'episodic.md', 
        content: `# 情景记忆

## 项目历程记录
记录项目开发过程中的重要事件和里程碑。

### 项目初始化
- **时间**: ${new Date().toISOString()}
- **事件**: PromptX 集成初始化完成
- **详情**: 使用 \`promptx init\` 命令完成项目集成设置
`
      },
      {
        name: 'procedural.md',
        content: `# 程序记忆

## 项目工作流程

### PromptX 使用流程
1. **学习阶段**: \`promptx learn <resource>\`
2. **记忆保存**: \`promptx remember <content>\`  
3. **记忆检索**: \`promptx recall\`
4. **助手切换**: \`promptx hello\`

### 项目开发流程
在这里记录项目特有的开发流程和最佳实践。
`
      },
      {
        name: 'semantic.md',
        content: `# 语义记忆

## 项目知识图谱

### PromptX 协议体系
- **@project://**: 指向当前项目根目录
- **@memory://**: 指向项目记忆系统
- **@package://**: 指向 PromptX 包资源
- **@prompt://**: 指向提示词资源

### 项目特定概念
在这里定义项目中的重要概念和术语。
`
      }
    ];

    for (const file of memoryFiles) {
      const filePath = path.join(memoryDir, file.name);
      await fs.writeFile(filePath, file.content, 'utf8');
      console.log(chalk.green(`✅ 创建记忆文件: ${file.name}`));
    }

    // 创建 .promptx/config.json 配置文件
    const config = {
      version: "0.0.1",
      initialized: new Date().toISOString(),
      settings: {
        memoryPath: "memory",
        defaultRole: null,
        autoRemember: false
      },
      protocols: {
        project: {
          root: ".",
          identifiers: [".promptx", "package.json", ".git"]
        },
        memory: {
          types: ["declarative", "episodic", "procedural", "semantic"]
        }
      }
    };

    const configPath = path.join(promptxDir, 'config.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
    console.log(chalk.green('✅ 创建配置文件: config.json'));

    // 创建 .gitignore (如果需要)
    const gitignorePath = path.join(projectRoot, '.gitignore');
    try {
      let gitignoreContent = '';
      try {
        gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
      } catch (error) {
        // .gitignore 不存在
      }

      if (!gitignoreContent.includes('.promptx')) {
        const appendContent = gitignoreContent.length > 0 ? '\n# PromptX\n.promptx/config.json\n' : '# PromptX\n.promptx/config.json\n';
        await fs.appendFile(gitignorePath, appendContent, 'utf8');
        console.log(chalk.green('✅ 更新 .gitignore 文件'));
      }
    } catch (error) {
      console.log(chalk.yellow('⚠️  无法更新 .gitignore 文件'));
    }

    // 完成提示
    console.log(chalk.green.bold('\n🎉 PromptX 项目集成初始化完成！\n'));
    
    console.log(chalk.blue('📁 创建的文件结构:'));
    console.log(chalk.gray('   .promptx/'));
    console.log(chalk.gray('   ├── config.json'));
    console.log(chalk.gray('   └── memory/'));
    console.log(chalk.gray('       ├── declarative.md'));
    console.log(chalk.gray('       ├── episodic.md'));
    console.log(chalk.gray('       ├── procedural.md'));
    console.log(chalk.gray('       └── semantic.md'));

    console.log(chalk.blue('\n🚀 可用的协议:'));
    console.log(chalk.gray('   @project://   - 访问项目文件'));
    console.log(chalk.gray('   @memory://    - 访问项目记忆'));
    console.log(chalk.gray('   @prompt://    - 访问提示词资源'));

    console.log(chalk.blue('\n🎯 下一步:'));
    console.log(chalk.gray('   1. 使用 promptx hello 选择 AI 角色'));
    console.log(chalk.gray('   2. 使用 promptx learn 学习项目知识'));
    console.log(chalk.gray('   3. 使用 promptx remember 保存重要信息'));
    console.log(chalk.gray('   4. 使用 promptx recall 检索记忆内容'));

  } catch (error) {
    console.error(chalk.red('❌ 初始化失败:'), error.message);
    process.exit(1);
  }
}

module.exports = init; 