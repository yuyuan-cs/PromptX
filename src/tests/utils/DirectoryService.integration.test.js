const path = require('path')
const fs = require('fs-extra')
const os = require('os')
const { 
  DirectoryService, 
  getDirectoryService, 
  getProjectRoot, 
  getWorkspace, 
  getPromptXDirectory 
} = require('../../lib/utils/DirectoryService')

describe('DirectoryService 集成测试', () => {
  let tempDir
  let originalCwd
  let originalEnv
  
  beforeEach(async () => {
    originalCwd = process.cwd()
    originalEnv = { ...process.env }
    
    // 创建临时测试目录
    const tempBase = os.tmpdir()
    tempDir = path.join(tempBase, `promptx-test-${Date.now()}`)
    await fs.ensureDir(tempDir)
    
    // 清除环境变量
    delete process.env.WORKSPACE_FOLDER_PATHS
    delete process.env.PROMPTX_WORKSPACE
    delete process.env.PWD
    
    // 清除服务缓存
    const service = getDirectoryService()
    service.clearCache()
  })
  
  afterEach(async () => {
    process.chdir(originalCwd)
    process.env = originalEnv
    
    // 清理临时目录
    if (tempDir && await fs.pathExists(tempDir)) {
      await fs.remove(tempDir)
    }
  })

     describe('Windows用户家目录问题修复', () => {
     // 跳过Windows特定测试如果不在Windows环境
     const skipIfNotWindows = process.platform !== 'win32' ? test.skip : test

         skipIfNotWindows('应该避免在用户家目录创建.promptx', async () => {
      // 模拟用户在家目录的某个子目录下工作
      const userHome = os.homedir()
      const desktopDir = path.join(userHome, 'Desktop', 'LUCKY')
      await fs.ensureDir(desktopDir)
      
      // 在家目录创建package.json（模拟用户场景）
      const homePackageJson = path.join(userHome, 'package.json')
      await fs.writeJSON(homePackageJson, { name: 'user-home-project' })
      
      // 在桌面目录创建一个真正的项目
      const projectPackageJson = path.join(desktopDir, 'package.json')
      await fs.writeJSON(projectPackageJson, { name: 'lucky-project' })
      
      process.chdir(desktopDir)
      
      const context = {
        startDir: desktopDir,
        platform: 'win32',
        avoidUserHome: true
      }
      
      const projectRoot = await getProjectRoot(context)
      const workspace = await getWorkspace(context)
      
      // 验证不会选择用户家目录
      expect(projectRoot).not.toBe(userHome)
      expect(workspace).not.toBe(userHome)
      
      // 应该选择桌面目录下的项目
      expect(projectRoot).toBe(desktopDir)
      expect(workspace).toBe(desktopDir)
      
      // 清理
      await fs.remove(homePackageJson)
      await fs.remove(desktopDir)
    })

         skipIfNotWindows('应该正确处理没有package.json的情况', async () => {
      const testDir = path.join(tempDir, 'no-package')
      await fs.ensureDir(testDir)
      process.chdir(testDir)
      
      const context = {
        startDir: testDir,
        platform: 'win32',
        avoidUserHome: true
      }
      
      const projectRoot = await getProjectRoot(context)
      const workspace = await getWorkspace(context)
      
      // 应该回退到当前目录而不是用户家目录
      expect(projectRoot).toBe(testDir)
      expect(workspace).toBe(testDir)
    })
  })

  describe('环境变量优先级测试', () => {
    test('WORKSPACE_FOLDER_PATHS应该有最高优先级', async () => {
      const workspaceDir = path.join(tempDir, 'ide-workspace')
      await fs.ensureDir(workspaceDir)
      
      // 设置IDE环境变量
      process.env.WORKSPACE_FOLDER_PATHS = JSON.stringify([workspaceDir])
      
      const workspace = await getWorkspace()
      expect(workspace).toBe(workspaceDir)
    })

    test('PROMPTX_WORKSPACE应该作为备选', async () => {
      const promptxWorkspace = path.join(tempDir, 'promptx-workspace')
      await fs.ensureDir(promptxWorkspace)
      
      process.env.PROMPTX_WORKSPACE = promptxWorkspace
      
      const workspace = await getWorkspace()
      expect(workspace).toBe(promptxWorkspace)
    })

    test('现有.promptx目录应该被识别', async () => {
      const projectDir = path.join(tempDir, 'existing-project')
      const promptxDir = path.join(projectDir, '.promptx')
      await fs.ensureDir(promptxDir)
      
      const subDir = path.join(projectDir, 'subdir')
      await fs.ensureDir(subDir)
      process.chdir(subDir)
      
      const context = { startDir: subDir }
      const workspace = await getWorkspace(context)
      
      expect(workspace).toBe(projectDir)
    })
  })

  describe('统一路径解析验证', () => {
    test('Init命令应该使用统一的路径逻辑', async () => {
      const projectDir = path.join(tempDir, 'init-test')
      await fs.ensureDir(projectDir)
      await fs.writeJSON(path.join(projectDir, 'package.json'), { name: 'test-project' })
      
      process.chdir(projectDir)
      
      const context = {
        startDir: projectDir,
        platform: process.platform,
        avoidUserHome: true
      }
      
      const service = getDirectoryService()
      
      const projectRoot = await service.getProjectRoot(context)
      const workspace = await service.getWorkspace(context)
      const promptxDir = await service.getPromptXDirectory(context)
      const resourceDir = await service.getResourceDirectory(context)
      const registryPath = await service.getRegistryPath(context)
      
      // 验证所有路径都基于同一个根目录
      expect(projectRoot).toBe(projectDir)
      expect(workspace).toBe(projectDir)
      expect(promptxDir).toBe(path.join(projectDir, '.promptx'))
      expect(resourceDir).toBe(path.join(projectDir, '.promptx', 'resource'))
      expect(registryPath).toBe(path.join(projectDir, '.promptx', 'resource', 'project.registry.json'))
    })

    test('所有命令应该使用相同的路径解析', async () => {
      const projectDir = path.join(tempDir, 'unified-test')
      await fs.ensureDir(projectDir)
      await fs.writeJSON(path.join(projectDir, 'package.json'), { name: 'unified-project' })
      
      process.chdir(projectDir)
      
      // 模拟不同命令使用相同的上下文
      const context = {
        startDir: projectDir,
        platform: process.platform,
        avoidUserHome: true
      }
      
      const projectRoot1 = await getProjectRoot(context)
      const workspace1 = await getWorkspace(context)
      const promptxDir1 = await getPromptXDirectory(context)
      
      // 第二次调用应该返回相同结果（缓存验证）
      const projectRoot2 = await getProjectRoot(context)
      const workspace2 = await getWorkspace(context)
      const promptxDir2 = await getPromptXDirectory(context)
      
      expect(projectRoot1).toBe(projectRoot2)
      expect(workspace1).toBe(workspace2)
      expect(promptxDir1).toBe(promptxDir2)
      
      // 所有路径应该一致
      expect(projectRoot1).toBe(projectDir)
      expect(workspace1).toBe(projectDir)
      expect(promptxDir1).toBe(path.join(projectDir, '.promptx'))
    })
  })

  describe('缓存机制验证', () => {
         test('缓存应该正常工作', async () => {
       const projectDir = path.join(tempDir, 'cache-test')
       await fs.ensureDir(projectDir)
       await fs.writeJSON(path.join(projectDir, 'package.json'), { name: 'cache-project' })
       
       process.chdir(projectDir)
       
       const context = { startDir: projectDir }
       
       // 第一次调用
       const result1 = await getProjectRoot(context)
       
       // 第二次调用应该返回相同结果（缓存验证）
       const result2 = await getProjectRoot(context)
       
       expect(result1).toBe(result2)
       expect(result1).toBe(projectDir)
     })

         test('缓存清除应该正常工作', async () => {
       const service = getDirectoryService()
       const projectDir = path.join(tempDir, 'clear-cache-test')
       await fs.ensureDir(projectDir)
       await fs.writeJSON(path.join(projectDir, 'package.json'), { name: 'clear-cache-project' })
       
       const context = { startDir: projectDir }
       
       // 填充缓存
       const result1 = await service.getProjectRoot(context)
       
       // 验证结果正确
       expect(result1).toBe(projectDir)
       
       // 清除缓存
       service.clearCache()
       
       // 再次调用应该仍然返回正确结果
       const result2 = await service.getProjectRoot(context)
       expect(result2).toBe(projectDir)
       expect(result1).toBe(result2)
     })
  })

  describe('调试信息验证', () => {
    test('应该提供完整的调试信息', async () => {
      const projectDir = path.join(tempDir, 'debug-test')
      await fs.ensureDir(projectDir)
      await fs.writeJSON(path.join(projectDir, 'package.json'), { name: 'debug-project' })
      
      process.chdir(projectDir)
      
      const service = getDirectoryService()
      const context = { startDir: projectDir }
      
      const debugInfo = await service.getDebugInfo(context)
      
      expect(debugInfo).toHaveProperty('platform')
      expect(debugInfo).toHaveProperty('projectRoot')
      expect(debugInfo).toHaveProperty('workspace')
      expect(debugInfo).toHaveProperty('promptxDirectory')
      expect(debugInfo).toHaveProperty('isSame')
      expect(debugInfo).toHaveProperty('environment')
      expect(debugInfo).toHaveProperty('context')
      expect(debugInfo).toHaveProperty('cache')
      
      expect(debugInfo.projectRoot).toBe(projectDir)
      expect(debugInfo.workspace).toBe(projectDir)
      expect(debugInfo.promptxDirectory).toBe(path.join(projectDir, '.promptx'))
      expect(debugInfo.isSame).toBe(true)
    })
  })
}) 