const fs = require('fs');
const path = require('path');
const os = require('os');
const logger = require('./logger');
const { getDirectoryService } = require('./DirectoryService');

/**
 * 执行上下文检测工具 (已重构)
 * 
 * 现在使用统一的DirectoryService提供路径解析
 * 保持向后兼容的API，但内部使用新的架构
 * 
 * @deprecated 推荐直接使用 DirectoryService
 * 
 * 注意：此文件主要保留向后兼容的同步API
 * 新代码请直接使用 DirectoryService 的异步API
 */

/**
 * 获取执行上下文信息
 * @returns {Object} 包含模式和工作目录的上下文对象
 */
function getExecutionContext() {
  const args = process.argv;
  const command = args[2]; // 第一个命令参数
  
  const isMCPMode = command === 'mcp-server';
  
  return {
    mode: isMCPMode ? 'MCP' : 'CLI',
    command: command,
    workingDirectory: isMCPMode ? getMCPWorkingDirectory() : process.cwd(),
    originalCwd: process.cwd()
  };
}

/**
 * MCP模式下获取工作目录
 * 使用新的DirectoryService进行路径解析
 * @returns {string} 工作目录路径
 */
function getMCPWorkingDirectory() {
  try {
    const directoryService = getDirectoryService();
    
    // 使用新的统一路径解析服务
    // 注意：这是异步操作，但为了保持API兼容性，我们需要同步处理
    // 在实际使用中，建议迁移到异步版本
    const context = {
      startDir: process.cwd(),
      platform: process.platform,
      avoidUserHome: true
    };
    
    // 同步获取工作空间目录
    // TODO: 在后续版本中迁移到异步API
    return getWorkspaceSynchronous(context);
    
  } catch (error) {
    logger.warn('[executionContext] 使用新服务失败，回退到旧逻辑:', error.message);
    return getMCPWorkingDirectoryLegacy();
  }
}

/**
 * 同步获取工作空间（临时解决方案）
 * @param {Object} context - 查找上下文
 * @returns {string} 工作空间路径
 */
function getWorkspaceSynchronous(context) {
  // 🔍 增加详细的路径诊断日志
  console.error('🔍 [executionContext-DIAGNOSIS] ===== getWorkspaceSynchronous 诊断开始 =====')
  console.error(`🔍 [executionContext-DIAGNOSIS] context: ${JSON.stringify(context)}`)
  console.error(`🔍 [executionContext-DIAGNOSIS] process.cwd(): ${process.cwd()}`)
  
  // 策略1：IDE环境变量
  const workspacePaths = process.env.WORKSPACE_FOLDER_PATHS;
  console.error(`🔍 [executionContext-DIAGNOSIS] 策略1 - WORKSPACE_FOLDER_PATHS: ${workspacePaths || 'undefined'}`)
  if (workspacePaths) {
    try {
      const folders = JSON.parse(workspacePaths);
      if (Array.isArray(folders) && folders.length > 0) {
        const firstFolder = folders[0];
        if (isValidDirectory(firstFolder)) {
          console.error(`🔍 [executionContext-DIAGNOSIS] 策略1成功: ${firstFolder}`)
          console.error(`[执行上下文] 使用WORKSPACE_FOLDER_PATHS: ${firstFolder}`);
          return firstFolder;
        }
      }
    } catch {
      // 忽略解析错误，尝试直接使用
      const firstPath = workspacePaths.split(path.delimiter)[0];
      if (firstPath && isValidDirectory(firstPath)) {
        console.error(`🔍 [executionContext-DIAGNOSIS] 策略1备用成功: ${firstPath}`)
        console.error(`[执行上下文] 使用WORKSPACE_FOLDER_PATHS: ${firstPath}`);
        return firstPath;
      }
    }
  }

  // 策略2：PromptX专用环境变量
  const promptxWorkspaceEnv = process.env.PROMPTX_WORKSPACE;
  console.error(`🔍 [executionContext-DIAGNOSIS] 策略2 - PROMPTX_WORKSPACE: ${promptxWorkspaceEnv || 'undefined'}`)
  if (promptxWorkspaceEnv && promptxWorkspaceEnv.trim() !== '') {
    const promptxWorkspace = normalizePath(expandHome(promptxWorkspaceEnv));
    if (isValidDirectory(promptxWorkspace)) {
      console.error(`🔍 [executionContext-DIAGNOSIS] 策略2成功: ${promptxWorkspace}`)
      console.error(`[执行上下文] 使用PROMPTX_WORKSPACE: ${promptxWorkspace}`);
      return promptxWorkspace;
    }
  }

  // 策略3：现有.promptx目录
  console.error(`🔍 [executionContext-DIAGNOSIS] 策略3 - 查找现有.promptx目录，起始目录: ${context.startDir}`)
  const existingPrompxRoot = findExistingPromptxDirectory(context.startDir);
  console.error(`🔍 [executionContext-DIAGNOSIS] 策略3结果: ${existingPrompxRoot || 'null'}`)
  if (existingPrompxRoot) {
    console.error(`🔍 [executionContext-DIAGNOSIS] 策略3成功: ${existingPrompxRoot}`)
    console.error(`[执行上下文] 发现现有.promptx目录: ${existingPrompxRoot}`);
    return existingPrompxRoot;
  }

  // 策略4：PWD环境变量
  const pwd = process.env.PWD;
  console.error(`🔍 [executionContext-DIAGNOSIS] 策略4 - PWD: ${pwd || 'undefined'}`)
  if (pwd && isValidDirectory(pwd) && pwd !== process.cwd()) {
    console.error(`🔍 [executionContext-DIAGNOSIS] 策略4成功: ${pwd}`)
    console.error(`[执行上下文] 使用PWD环境变量: ${pwd}`);
    return pwd;
  }

  // 策略5：项目根目录
  const projectRoot = findProjectRoot(context.startDir);
  console.error(`🔍 [executionContext-DIAGNOSIS] 策略5结果: ${projectRoot || 'null'}`)
  if (projectRoot && projectRoot !== process.cwd()) {
    console.error(`🔍 [executionContext-DIAGNOSIS] 策略5成功: ${projectRoot}`)
    console.error(`[执行上下文] 智能推测项目根目录: ${projectRoot}`);
    return projectRoot;
  }

  // 策略6：回退到当前目录
  const fallbackPath = process.cwd()
  console.error(`🔍 [executionContext-DIAGNOSIS] 策略6 - 回退到process.cwd(): ${fallbackPath}`)
  console.error(`[执行上下文] 回退到process.cwd(): ${fallbackPath}`);
  console.error(`[执行上下文] 提示：建议在MCP配置中添加 "env": {"PROMPTX_WORKSPACE": "你的项目目录"}`);
  console.error('🔍 [executionContext-DIAGNOSIS] ===== getWorkspaceSynchronous 诊断结束 =====')
  return fallbackPath;
}

/**
 * 旧版MCP工作目录获取逻辑（兼容性备用）
 * @deprecated
 */
function getMCPWorkingDirectoryLegacy() {
  // 保留原始的同步逻辑作为备份
  return process.cwd();
}

/**
 * 向上查找现有的.promptx目录
 * @param {string} startDir 开始查找的目录
 * @returns {string|null} 包含.promptx目录的父目录路径或null
 */
function findExistingPromptxDirectory(startDir) {
  // 🔍 增加详细的路径诊断日志
  console.error('🔍 [findExistingPromptxDirectory-DIAGNOSIS] ===== 查找.promptx目录诊断开始 =====')
  console.error(`🔍 [findExistingPromptxDirectory-DIAGNOSIS] 起始目录: ${startDir}`)
  
  let currentDir = path.resolve(startDir);
  const root = path.parse(currentDir).root;
  console.error(`🔍 [findExistingPromptxDirectory-DIAGNOSIS] 解析后起始目录: ${currentDir}`)
  console.error(`🔍 [findExistingPromptxDirectory-DIAGNOSIS] 文件系统根目录: ${root}`)
  
  const foundDirectories = []
  let stepCount = 0

  while (currentDir !== root) {
    stepCount++
    console.error(`🔍 [findExistingPromptxDirectory-DIAGNOSIS] 第${stepCount}步 - 检查目录: ${currentDir}`)
    
    // 检查当前目录是否包含.promptx目录
    const promptxPath = path.join(currentDir, '.promptx');
    console.error(`🔍 [findExistingPromptxDirectory-DIAGNOSIS] 检查路径: ${promptxPath}`)
    
    if (fs.existsSync(promptxPath)) {
      console.error(`🔍 [findExistingPromptxDirectory-DIAGNOSIS] ✅ 发现.promptx目录: ${promptxPath}`)
      foundDirectories.push(currentDir)
      
      try {
        const stat = fs.statSync(promptxPath);
        if (stat.isDirectory()) {
          console.error(`🔍 [findExistingPromptxDirectory-DIAGNOSIS] ✅ 确认为有效目录，返回: ${currentDir}`)
          console.error(`🔍 [findExistingPromptxDirectory-DIAGNOSIS] 🎯 总共发现${foundDirectories.length}个.promptx目录: ${JSON.stringify(foundDirectories)}`)
          console.error('🔍 [findExistingPromptxDirectory-DIAGNOSIS] ===== 查找.promptx目录诊断结束 =====')
          return currentDir;
        } else {
          console.error(`🔍 [findExistingPromptxDirectory-DIAGNOSIS] ❌ .promptx存在但不是目录`)
        }
      } catch (error) {
        console.error(`🔍 [findExistingPromptxDirectory-DIAGNOSIS] ❌ 访问.promptx目录时出错: ${error.message}`)
        // 忽略权限错误等，继续查找
      }
    } else {
      console.error(`🔍 [findExistingPromptxDirectory-DIAGNOSIS] ❌ 当前目录无.promptx`)
    }

    // 向上一级目录
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      console.error(`🔍 [findExistingPromptxDirectory-DIAGNOSIS] 🔚 到达顶级目录，停止搜索`)
      break; // 防止无限循环
    }
    currentDir = parentDir;
    console.error(`🔍 [findExistingPromptxDirectory-DIAGNOSIS] ⬆️ 向上一级: ${currentDir}`)
  }

  console.error(`🔍 [findExistingPromptxDirectory-DIAGNOSIS] 🎯 搜索完成，总共发现${foundDirectories.length}个.promptx目录: ${JSON.stringify(foundDirectories)}`)
  console.error(`🔍 [findExistingPromptxDirectory-DIAGNOSIS] ❌ 未找到有效的.promptx目录`)
  console.error('🔍 [findExistingPromptxDirectory-DIAGNOSIS] ===== 查找.promptx目录诊断结束 =====')
  return null;
}

/**
 * 向上查找项目根目录
 * @param {string} startDir 开始查找的目录
 * @returns {string|null} 项目根目录或null
 */
function findProjectRoot(startDir) {
  const projectMarkers = [
    'package.json',
    '.git',
    'pyproject.toml',
    'Cargo.toml',
    'go.mod',
    'pom.xml',
    'build.gradle',
    '.gitignore'
  ];

  let currentDir = path.resolve(startDir);
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    // Windows特有：避免用户家目录
    if (process.platform === 'win32') {
      const homeDir = os.homedir();
      if (path.resolve(currentDir) === path.resolve(homeDir)) {
        console.error(`[executionContext] 跳过用户家目录: ${currentDir}`);
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) break;
        currentDir = parentDir;
        continue;
      }
    }

    // 检查是否包含项目标识文件
    for (const marker of projectMarkers) {
      const markerPath = path.join(currentDir, marker);
      if (fs.existsSync(markerPath)) {
        return currentDir;
      }
    }

    // 向上一级目录
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break; // 防止无限循环
    currentDir = parentDir;
  }

  return null;
}

/**
 * 验证目录是否有效
 * @param {string} dir 要验证的目录路径
 * @returns {boolean} 目录是否有效
 */
function isValidDirectory(dir) {
  try {
    if (!dir || typeof dir !== 'string') {
      return false;
    }
    
    const resolvedDir = path.resolve(dir);
    const stat = fs.statSync(resolvedDir);
    
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * 获取调试信息
 * @returns {Object} 调试信息对象
 */
function getDebugInfo() {
  const context = getExecutionContext();
  
  return {
    processArgv: process.argv,
    processCwd: process.cwd(),
    detectedMode: context.mode,
    detectedWorkingDirectory: context.workingDirectory,
    environmentVariables: {
      WORKSPACE_FOLDER_PATHS: process.env.WORKSPACE_FOLDER_PATHS || 'undefined',
      PROMPTX_WORKSPACE: process.env.PROMPTX_WORKSPACE || 'undefined',
      PWD: process.env.PWD || 'undefined'
    },
    nodeVersion: process.version,
    platform: process.platform
  };
}

/**
 * 规范化路径
 */
function normalizePath(p) {
  return path.normalize(p);
}

/**
 * 展开家目录路径
 */
function expandHome(filepath) {
  if (!filepath || typeof filepath !== 'string') {
    return '';
  }
  
  if (filepath.startsWith('~/') || filepath === '~') {
    return path.join(os.homedir(), filepath.slice(2));
  }
  
  return filepath;
}

module.exports = {
  getExecutionContext,
  isValidDirectory,
  getDebugInfo,
  findExistingPromptxDirectory,
  findProjectRoot
}; 