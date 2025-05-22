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
 * 打印核心提示词内容
 */
function printCore() {
  const coreDir = path.join(promptxDir, 'core');
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
  
  // 收集核心目录下的所有文件
  const coreFiles = collectMarkdownFiles(coreDir);
  
  // 文件按字母顺序排序
  coreFiles.sort();
  
  // 合并到总文件列表
  allFiles = allFiles.concat(coreFiles);
  
  console.log(`从 core 目录收集了 ${coreFiles.length} 个文件`);
  
  // 没有文件时的提示
  if (allFiles.length === 0) {
    console.log("未找到任何核心提示词文件。请确认PromptX目录结构是否正确。");
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
  
  console.log(`\n总计读取了 ${allFiles.length} 个核心提示词文件。`);
}

/**
 * 打印指定角色内容
 */
function printRole(rolePath) {
  // 如果传入的是相对路径，则基于当前工作目录解析
  let fullPath;
  if (path.isAbsolute(rolePath)) {
    fullPath = rolePath;
  } else {
    fullPath = path.join(process.cwd(), rolePath);
  }
  
  if (!fs.existsSync(fullPath)) {
    console.error(`错误: 角色文件不存在: ${fullPath}`);
    return;
  }
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const separator = "=".repeat(80);
    console.log(`\n${separator}\n### 角色文件: ${path.relative(process.cwd(), fullPath)}\n${separator}\n`);
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
 * 解析记忆命令参数
 * @param {string} content - 记忆内容，可能包含标签、评分和有效期
 * @param {string[]} args - 其他参数
 */
function parseMemoryArgs(content, args) {
  const options = {
    tags: [],
    score: 5,
    duration: '短期'
  };
  
  // 从内容中提取标签、评分和有效期
  const contentParts = content.trim().split(/\s+/);
  let cleanContent = [];
  
  for (let part of contentParts) {
    if (part.startsWith('#')) {
      // 检查是否是特殊标记
      if (part.includes('评分:')) {
        const scoreText = part.split('评分:')[1].trim();
        const score = parseInt(scoreText);
        if (!isNaN(score) && score >= 1 && score <= 10) {
          options.score = score;
        }
      } else if (part.includes('有效期:')) {
        const duration = part.split('有效期:')[1].trim();
        if (['短期', '中期', '长期'].includes(duration)) {
          options.duration = duration;
        }
      } else {
        // 普通标签
        const tag = part.slice(1);
        if (tag) {
          options.tags.push(tag);
        }
      }
    } else {
      cleanContent.push(part);
    }
  }
  
  // 处理剩余的命令行参数
  for (let arg of args) {
    // 移除参数前后的引号（如果有）
    arg = arg.replace(/^['"]|['"]$/g, '').trim();
    
    if (arg.startsWith('#')) {
      // 检查是否是特殊标记
      if (arg.includes('评分:')) {
        const score = parseInt(arg.split('评分:')[1]);
        if (!isNaN(score) && score >= 1 && score <= 10) {
          options.score = score;
        }
      } else if (arg.includes('有效期:')) {
        const duration = arg.split('有效期:')[1];
        if (['短期', '中期', '长期'].includes(duration)) {
          options.duration = duration;
        }
      } else {
        // 普通标签
        const tag = arg.slice(1);
        if (tag) {
          options.tags.push(tag);
        }
      }
    }
  }
  
  // 如果没有标签,使用默认标签
  if (options.tags.length === 0) {
    options.tags = ['其他'];
  }
  
  // 返回清理后的内容和选项
  return {
    cleanContent: cleanContent.join(' '),
    options: options
  };
}

/**
 * 添加记忆条目
 * @param {string} content - 记忆内容
 * @param {object} options - 配置选项
 */
function addMemory(content, options = {}) {
  const defaultOptions = {
    tags: ['其他'],
    score: 5,
    duration: '短期',
    timestamp: new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  };

  // 确保选项中的数组和对象被正确合并
  const finalOptions = {
    ...defaultOptions,
    ...options,
    tags: options.tags && options.tags.length > 0 ? options.tags : defaultOptions.tags
  };
  
  // 构建记忆条目,确保格式统一
  const memoryEntry = `\n- ${finalOptions.timestamp} ${content.trim()} ${finalOptions.tags.map(tag => `#${tag}`).join(' ')} #评分:${finalOptions.score} #有效期:${finalOptions.duration}\n`;
  
  // 确保.memory目录存在
  const memoryDir = path.join(process.cwd(), '.memory');
  if (!fs.existsSync(memoryDir)) {
    fs.mkdirSync(memoryDir, { recursive: true });
  }
  
  // 追加到记忆文件
  const memoryFile = path.join(memoryDir, 'declarative.md');
  try {
    // 如果文件不存在,创建文件并添加标题
    if (!fs.existsSync(memoryFile)) {
      fs.writeFileSync(memoryFile, '# 陈述性记忆\n\n## 高价值记忆（评分 ≥ 7）\n');
    }
    
    fs.appendFileSync(memoryFile, memoryEntry);
    console.log('✅ 记忆已成功保存');
    
    // 如果评分大于等于7,输出高价值提醒
    if (finalOptions.score >= 7) {
      console.log('🌟 这是一条高价值记忆');
    }
  } catch (err) {
    console.error('❌ 记忆保存失败:', err);
  }
}

/**
 * 打印帮助信息
 */
function printHelp() {
  console.log(`
PromptX 工具 - 协议和角色内容查看器

使用方法:
  node promptx.js            - 打印所有协议内容 (按protocol、resource顺序)
  node promptx.js protocols  - 同上，打印所有协议内容
  node promptx.js core      - 打印所有核心提示词内容
  node promptx.js role <路径> - 打印指定角色文件内容
  node promptx.js file <路径> - 打印指定文件内容
  node promptx.js remember <内容> - 添加记忆条目，标签、评分和有效期可直接包含在内容中
  node promptx.js bootstrap  - 打印bootstrap.md内容
  node promptx.js help       - 显示此帮助信息

记忆命令用法:
  将标签、评分和有效期直接包含在内容字符串中，时间戳会自动添加到行首
  #标签名    - 添加标签 (可多个)
  #评分:数字  - 设置重要性评分 (1-10)
  #有效期:时长 - 设置有效期 (短期/中期/长期)

示例:
  node promptx.js remember "用户提出了重要建议 #用户反馈 #改进建议 #评分:8 #有效期:长期"
  node promptx.js remember "临时配置信息 #配置 #评分:3 #有效期:短期"
  `);
}

// 根据命令执行相应功能
switch (command) {
  case 'protocols':
    printProtocols();
    break;
  case 'core':
    printCore();
    break;
  case 'bootstrap':
    // 只打印 bootstrap.md
    printFile('bootstrap.md');
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
  case 'remember':
    if (!param) {
      console.error('错误: 缺少记忆内容');
      console.log('使用方法: node promptx.js remember "记忆内容 #标签1 #标签2 #评分:8 #有效期:长期"');
    } else {
      try {
        // 记忆内容就是传入的第一个参数
        const memoryContent = param;
        
        // 解析内容中的标签、评分和有效期
        const { cleanContent, options } = parseMemoryArgs(memoryContent, []);
        
        // 添加记忆
        addMemory(cleanContent, options);
      } catch (err) {
        console.error('错误:', err.message);
        console.log('使用方法: node promptx.js remember "记忆内容 #标签1 #标签2 #评分:8 #有效期:长期"');
      }
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