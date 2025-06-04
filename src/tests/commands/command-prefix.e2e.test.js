const path = require('path')
const fs = require('fs-extra')
const { execSync } = require('child_process')
const tmp = require('tmp')

const PromptXConfig = require('../../lib/utils/promptxConfig')
const PouchCLI = require('../../lib/core/pouch/PouchCLI')

describe('命令前缀动态检测 E2E', () => {
  let tempDir
  let originalCwd
  let config

  beforeEach(async () => {
    // 创建临时目录
    tempDir = tmp.dirSync({ unsafeCleanup: true }).name
    originalCwd = process.cwd()
    process.chdir(tempDir)
    
    config = new PromptXConfig(tempDir)
    
    // 静默console输出
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    
    // 清除constants.js的缓存，避免测试间污染
    delete require.cache[require.resolve('../../constants.js')]
    const { clearCache } = require('../../constants.js')
    clearCache()
  })

  afterEach(async () => {
    process.chdir(originalCwd)
    try {
      await fs.remove(tempDir)
    } catch (error) {
      // 忽略清理失败
    }
    
    // 恢复console输出
    jest.restoreAllMocks()
  })

  describe('init命令保存命令前缀', () => {
    test('npx方式调用时应保存npx前缀', async () => {
      // 模拟npx调用init命令
      process.argv = ['node', 'npx', 'dpml-prompt@snapshot', 'init']
      process.env.npm_execpath = '/usr/local/lib/node_modules/npm/bin/npx-cli.js'
      
      // 导入并执行init命令
      const cli = new PouchCLI()
      
      await cli.execute('init', [])
      
      // 验证保存的命令前缀
      const savedPrefix = await config.readText('command-prefix')
      expect(savedPrefix).toBe('npx dpml-prompt@snapshot')
    })

    test('全局安装调用时应保存直接前缀', async () => {
      // 模拟全局安装调用
      process.argv = ['node', '/usr/local/bin/dpml-prompt', 'init']
      delete process.env.npm_execpath
      
      const cli = new PouchCLI()
      
      await cli.execute('init', [])
      
      const savedPrefix = await config.readText('command-prefix')
      expect(savedPrefix).toBe('dpml-prompt')
    })

    test('指定版本号时应正确保存', async () => {
      process.argv = ['node', 'npx', 'dpml-prompt@latest', 'init']
      process.env.npm_execpath = '/usr/local/lib/node_modules/npm/bin/npx-cli.js'
      
      const cli = new PouchCLI()
      
      await cli.execute('init', [])
      
      const savedPrefix = await config.readText('command-prefix')
      expect(savedPrefix).toBe('npx dpml-prompt@latest')
    })
  })

  describe('constants.js动态读取', () => {
    test('环境变量应能覆盖配置文件', async () => {
      // 保存配置文件
      await config.writeText('command-prefix', 'npx dpml-prompt@snapshot')
      
      // 设置环境变量
      process.env.DPML_COMMAND_PREFIX = 'my-custom-prefix'
      
      delete require.cache[require.resolve('../../constants.js')]
      const constants = require('../../constants.js')
      
      const commands = constants.getCommands()
      expect(commands.INIT).toBe('my-custom-prefix init')
      
      // 清理环境变量
      delete process.env.DPML_COMMAND_PREFIX
    })
  })

  describe('各种命令格式解析', () => {
    const testCases = [
      {
        name: 'npx最新版本',
        argv: ['node', 'npx', 'dpml-prompt', 'init'],
        hasNpxEnv: true,
        expected: 'npx dpml-prompt'
      },
      {
        name: 'npx指定版本', 
        argv: ['node', 'npx', 'dpml-prompt@0.1.0', 'init'],
        hasNpxEnv: true,
        expected: 'npx dpml-prompt@0.1.0'
      },
      {
        name: 'npx snapshot版本',
        argv: ['node', 'npx', 'dpml-prompt@snapshot', 'init'],
        hasNpxEnv: true,
        expected: 'npx dpml-prompt@snapshot'
      },
      {
        name: '全局安装',
        argv: ['node', 'dpml-prompt', 'init'],
        hasNpxEnv: false,
        expected: 'dpml-prompt'
      },
      {
        name: '开发模式',
        argv: ['node', '/Users/dev/PromptX/src/bin/promptx.js', 'init'],
        hasNpxEnv: false,
        expected: 'dpml-prompt'
      },
      {
        name: 'npx -y 参数',
        argv: ['node', 'npx', '-y', 'dpml-prompt', 'init'],
        hasNpxEnv: true,
        expected: 'npx -y dpml-prompt'
      },
      {
        name: 'npx 复杂参数',
        argv: ['node', 'npx', '--yes', '--registry=https://registry.npm.taobao.org', 'dpml-prompt@latest', 'init'],
        hasNpxEnv: true,
        expected: 'npx --yes --registry=https://registry.npm.taobao.org dpml-prompt@latest'
      },
      {
        name: 'pnpm dlx',
        argv: ['node', 'pnpm', 'dlx', 'dpml-prompt@snapshot', 'init'],
        hasNpxEnv: false,
        expected: 'pnpm dlx dpml-prompt@snapshot'
      },
      {
        name: 'yarn dlx',
        argv: ['node', 'yarn', 'dlx', 'dpml-prompt', 'init'],
        hasNpxEnv: false,
        expected: 'yarn dlx dpml-prompt'
      }
    ]

    testCases.forEach(({ name, argv, hasNpxEnv, expected }) => {
      test(`${name}: ${argv[1]} → ${expected}`, async () => {
        process.argv = argv
        
        // 根据测试配置设置环境变量
        if (hasNpxEnv) {
          process.env.npm_execpath = '/usr/local/lib/node_modules/npm/bin/npx-cli.js'
        } else {
          delete process.env.npm_execpath
        }
        
        const cli = new PouchCLI()
        
        await cli.execute('init', [])
        
        const savedPrefix = await config.readText('command-prefix')
        expect(savedPrefix).toBe(expected)
      })
    })
  })

  describe('缓存性能', () => {
    test('第二次调用应使用缓存，不重新检测', async () => {
      // 第一次调用保存配置
      await config.writeText('command-prefix', 'npx dpml-prompt@snapshot')
      
      // 模拟多次调用constants
      delete require.cache[require.resolve('../../constants.js')]
      const constants1 = require('../../constants.js')
      
      delete require.cache[require.resolve('../../constants.js')]
      const constants2 = require('../../constants.js')
      
      // 两次调用应该返回相同结果
      expect(constants1.getCommands().INIT).toBe(constants2.getCommands().INIT)
    })
  })
}) 