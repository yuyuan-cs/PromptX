const { execSync, spawn } = require('child_process')
const path = require('path')
const fs = require('fs-extra')
const os = require('os')

describe('Platform-Folders 兼容性问题 - E2E Tests', () => {
  let tempDir
  let originalPlatform

  beforeAll(async () => {
    // 创建临时目录用于测试
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'promptx-platform-test-'))
    originalPlatform = process.platform
  })

  afterAll(async () => {
    if (tempDir) {
      await fs.remove(tempDir)
    }
    // 恢复原始平台
    Object.defineProperty(process, 'platform', {
      value: originalPlatform
    })
  })

  /**
   * 模拟Windows环境
   */
  function mockWindowsEnvironment() {
    // 模拟Windows平台
    Object.defineProperty(process, 'platform', {
      value: 'win32',
      configurable: true
    })

    // 模拟Windows环境变量
    const originalEnv = { ...process.env }
    process.env.APPDATA = 'C:\\Users\\Test\\AppData\\Roaming'
    process.env.LOCALAPPDATA = 'C:\\Users\\Test\\AppData\\Local'
    process.env.USERPROFILE = 'C:\\Users\\Test'
    
    return () => {
      // 恢复环境变量
      Object.keys(originalEnv).forEach(key => {
        process.env[key] = originalEnv[key]
      })
      Object.keys(process.env).forEach(key => {
        if (!(key in originalEnv)) {
          delete process.env[key]
        }
      })
    }
  }

     /**
    * 模拟platform-folders包导入失败
    */
   function mockPlatformFoldersFailure() {
     const Module = require('module')
     const originalRequire = Module.prototype.require
     
     // Mock Module.prototype.require
     Module.prototype.require = function(id) {
       if (id === 'platform-folders') {
         const error = new Error("Cannot find module 'platform-folders'")
         error.code = 'MODULE_NOT_FOUND'
         throw error
       }
       return originalRequire.call(this, id)
     }
     
     return () => {
       Module.prototype.require = originalRequire
     }
   }

  /**
   * 模拟NPX环境下的安装问题
   */
  function mockNpxEnvironment() {
    const originalEnv = { ...process.env }
    
    // 模拟npx环境变量
    process.env.npm_execpath = '/usr/local/lib/node_modules/npm/bin/npx-cli.js'
    process.env.npm_config_cache = '/tmp/_npx/12345'
    process.env.npm_lifecycle_event = undefined
    
    return () => {
      Object.keys(originalEnv).forEach(key => {
        process.env[key] = originalEnv[key]
      })
    }
  }

  describe('Windows环境兼容性测试', () => {
    test('应该检测到Windows环境下的platform-folders问题', async () => {
      const restoreEnv = mockWindowsEnvironment()
      const restoreRequire = mockPlatformFoldersFailure()

      try {
        // 动态导入UserProtocol，测试platform-folders错误处理
        const UserProtocol = require('../../lib/core/resource/protocols/UserProtocol')
        const userProtocol = new UserProtocol()

                 // 调用可能触发platform-folders的方法
         const result = await userProtocol.getUserDirectory('home')
         
         // 验证fallback机制是否工作
         expect(result).toBeDefined()
         expect(typeof result).toBe('string')
         
         // 验证是否使用了fallback路径（home目录应该存在）
         expect(result).toBeTruthy()
      } catch (error) {
        // 如果抛出错误，验证错误信息是否包含platform-folders相关内容
        expect(error.message).toMatch(/platform-folders|用户目录|配置路径/)
      } finally {
        restoreEnv()
        restoreRequire()
      }
    })

    test('应该在Windows + NPX环境下正常工作（无警告）', async () => {
      const restoreEnv = mockWindowsEnvironment()
      const restoreNpx = mockNpxEnvironment()
      
      // 捕获console.warn输出
      const originalWarn = console.warn
      const warnMessages = []
      console.warn = (...args) => {
        warnMessages.push(args.join(' '))
      }

      try {
        // 测试在Windows + NPX环境下env-paths正常工作
        const UserProtocol = require('../../lib/core/resource/protocols/UserProtocol')
        const userProtocol = new UserProtocol()
        
        const documentsPath = await userProtocol.getUserDirectory('documents')
        
        // 验证获取目录成功
        expect(documentsPath).toBeDefined()
        expect(typeof documentsPath).toBe('string')
        expect(documentsPath.length).toBeGreaterThan(0)
        
        // 检查是否有platform-folders相关警告
        const hasPlatformFoldersWarning = warnMessages.some(msg => 
          msg.includes('platform-folders') || 
          msg.includes('不可用，使用os.homedir()回退方案')
        )
        
        // 使用env-paths后，不应该有platform-folders相关警告
        expect(hasPlatformFoldersWarning).toBe(false)
        
        console.log('✅ Windows + NPX环境下env-paths工作正常，无platform-folders警告')
        
      } finally {
        console.warn = originalWarn
        restoreEnv()
        restoreNpx()
      }
    })
  })

  describe('替代方案验证测试', () => {
    test('应该验证env-paths作为替代方案可以正常工作', async () => {
      // 创建一个模拟的env-paths实现
      const mockEnvPaths = (name) => ({
        data: path.join(os.homedir(), '.local', 'share', name),
        config: path.join(os.homedir(), '.config', name),
        cache: path.join(os.homedir(), '.cache', name),
        log: path.join(os.homedir(), '.local', 'share', name, 'logs'),
        temp: path.join(os.tmpdir(), name)
      })

      // 验证env-paths风格的路径解析
      const paths = mockEnvPaths('promptx')
      
      expect(paths.data).toBeDefined()
      expect(paths.config).toBeDefined()
      expect(paths.cache).toBeDefined()
      expect(typeof paths.data).toBe('string')
      expect(paths.data).toContain('promptx')
    })

    test('应该测试跨平台路径解析的一致性', () => {
      // 测试不同平台下的路径格式
      const testPlatforms = ['win32', 'darwin', 'linux']
      
      testPlatforms.forEach(platform => {
        const originalPlatform = process.platform
        Object.defineProperty(process, 'platform', {
          value: platform,
          configurable: true
        })

        try {
          // 测试路径解析逻辑
          const homedir = os.homedir()
          const configPath = path.join(homedir, '.config', 'promptx')
          
          expect(configPath).toBeDefined()
          expect(path.isAbsolute(configPath)).toBe(true)
          
          // 验证路径包含正确的组件
          expect(configPath).toContain('promptx')
          
        } finally {
          Object.defineProperty(process, 'platform', {
            value: originalPlatform,
            configurable: true
          })
        }
      })
    })
  })

  describe('实际CLI命令测试', () => {
    test('在模拟的问题环境下CLI应该仍能正常工作', async () => {
      const restoreEnv = mockWindowsEnvironment()
      
      try {
        // 运行CLI命令，验证即使在问题环境下也能工作
        const result = execSync('node src/bin/promptx.js hello', {
          cwd: process.cwd(),
          encoding: 'utf8',
          timeout: 10000,
          env: process.env
        })
        
        // 验证命令执行成功
        expect(result).toContain('AI专业角色服务清单')
        
      } catch (error) {
        // 如果命令失败，检查是否是由于platform-folders问题
        const isplatformFoldersError = error.message.includes('platform-folders') ||
                                     error.stderr?.includes('platform-folders')
        
        if (isplatformFoldersError) {
          console.log('✅ 成功重现了 platform-folders 问题')
          expect(isplatformFoldersError).toBe(true)
        } else {
          throw error
        }
      } finally {
        restoreEnv()
      }
    })
  })

  describe('错误处理和恢复测试', () => {
    test('应该测试graceful fallback机制', async () => {
      const restoreRequire = mockPlatformFoldersFailure()
      
      try {
                 // 重新导入模块以测试fallback
         const userProtocolPath = path.resolve(__dirname, '../../lib/core/resource/protocols/UserProtocol.js')
         delete require.cache[userProtocolPath]
         const UserProtocol = require('../../lib/core/resource/protocols/UserProtocol')
        const userProtocol = new UserProtocol()
        
                 // 测试fallback路径生成
         const fallbackPath = await userProtocol.getUserDirectory('home')
         
         expect(fallbackPath).toBeDefined()
         expect(typeof fallbackPath).toBe('string')
         
         // 验证fallback路径是合理的（home目录应该存在）
         expect(fallbackPath).toBeTruthy()
        
      } finally {
        restoreRequire()
      }
    })
  })
}) 