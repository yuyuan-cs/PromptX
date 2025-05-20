#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 简单的命令行参数处理
const args = process.argv.slice(2);
const command = args[0] || 'protocols'; // 默认执行protocols命令，而不是help
const param = args[1]; // role命令时的角色文件路径

// 获取脚本所在目录和PromptX根目录
const scriptDir = __dirname;
const promptxDir = scriptDir; // 脚本现在就在PromptX目录内

/**
 * 打印所有协议内容
 */
function printProtocols() {
  // 定义目录优先级顺序
  const directories = [
    { path: path.join(promptxDir, 'protocol'), name: 'protocol' },
    { path: path.join(promptxDir, 'core'), name: 'core' },
    { path: path.join(promptxDir, 'resource'), name: 'resource' }
  ];
  
  let allFiles = [];
  
  // 递归查找文件函数
  function collectMarkdownFiles(dir) {
    if (!fs.existsSync(dir)) {
      console.warn(`警告: 目录不存在 ${dir}`);
      return [];
    }
    
    let files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        files = files.concat(collectMarkdownFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }
  
  // 按目录优先级收集文件
  for (const dir of directories) {
    const dirFiles = collectMarkdownFiles(dir.path);
    
    // 每个目录内的文件按字母顺序排序
    dirFiles.sort();
    
    // 合并到总文件列表
    allFiles = allFiles.concat(dirFiles);
    
    console.log(`从 ${dir.name} 目录收集了 ${dirFiles.length} 个文件`);
  }
  
  // 没有文件时的提示
  if (allFiles.length === 0) {
    console.log("未找到任何协议文件。请确认PromptX目录结构是否正确。");
    return;
  }
  
  // 打印每个文件
  for (const file of allFiles) {
    const relativePath = path.relative(promptxDir, file);
    const separator = "=".repeat(80);
    console.log(`\n${separator}\n### 文件: ${relativePath}\n${separator}\n`);
    
    try {
      const content = fs.readFileSync(file, 'utf8');
      console.log(content);
    } catch (err) {
      console.error(`读取文件错误: ${file}`, err);
    }
  }
  
  console.log(`\n总计读取了 ${allFiles.length} 个协议文件。`);
}

/**
 * 打印指定角色内容
 */
function printRole(rolePath) {
  // 如果传入的是相对路径，则基于PromptX目录解析
  let fullPath;
  if (path.isAbsolute(rolePath)) {
    fullPath = rolePath;
  } else {
    fullPath = path.join(promptxDir, rolePath);
  }
  
  if (!fs.existsSync(fullPath)) {
    console.error(`错误: 角色文件不存在: ${fullPath}`);
    return;
  }
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const separator = "=".repeat(80);
    console.log(`\n${separator}\n### 角色文件: ${path.relative(promptxDir, fullPath)}\n${separator}\n`);
    console.log(content);
  } catch (err) {
    console.error(`读取角色文件错误: ${fullPath}`, err);
  }
}

/**
 * 打印指定路径的文件内容
 */
function printFile(filePath) {
  // 如果传入的是相对路径，则基于PromptX目录解析
  let fullPath;
  if (path.isAbsolute(filePath)) {
    fullPath = filePath;
  } else {
    fullPath = path.join(promptxDir, filePath);
  }
  
  if (!fs.existsSync(fullPath)) {
    console.error(`错误: 文件不存在: ${fullPath}`);
    return;
  }
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const separator = "=".repeat(80);
    console.log(`\n${separator}\n### 文件: ${path.relative(promptxDir, fullPath)}\n${separator}\n`);
    console.log(content);
  } catch (err) {
    console.error(`读取文件错误: ${fullPath}`, err);
  }
}

/**
 * 打印帮助信息
 */
function printHelp() {
  console.log(`
PromptX 工具 - 协议和角色内容查看器

使用方法:
  node promptx.js            - 打印所有协议内容 (按protocol、core、resource顺序)
  node promptx.js protocols  - 同上，打印所有协议内容
  node promptx.js role <路径> - 打印指定角色文件内容
  node promptx.js file <路径> - 打印指定文件内容
  node promptx.js help       - 显示此帮助信息

路径说明:
  - 对于'role'和'file'命令，路径应该是相对于PromptX目录的路径
  - 也支持绝对路径

示例:
  node promptx.js
  node promptx.js role domain/prompt/prompt-developer.role.md
  node promptx.js file protocol/tag/thought.tag.md
  `);
}

// 根据命令执行相应功能
switch (command) {
  case 'protocols':
    printProtocols();
    break;
  case 'role':
    if (!param) {
      console.error('错误: 缺少角色文件路径');
      printHelp();
    } else {
      printRole(param);
    }
    break;
  case 'file':
    if (!param) {
      console.error('错误: 缺少文件路径');
      printHelp();
    } else {
      printFile(param);
    }
    break;
  case 'help':
    printHelp();
    break;
  default:
    console.error(`错误: 未知命令 "${command}"`);
    printHelp();
    break;
} 