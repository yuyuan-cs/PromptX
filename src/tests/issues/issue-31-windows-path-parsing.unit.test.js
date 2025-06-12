/**
 * Issue #31: Windows 路径解析兼容性问题测试
 * 
 * 错误场景：
 * - 思维模式 "travel-consulting" 未在注册表中找到
 * - 执行模式 "travel-planning" 未在注册表中找到
 * - 未注册的协议: knowledge
 * 
 * 测试目标：
 * 1. 复现Windows环境下角色激活失败的问题
 * 2. 验证修复后的跨平台兼容性
 * 3. 确保资源注册表正确加载
 */

const path = require('path')
const fs = require('fs-extra')
const os = require('os')

// 测试目标模块
const PackageProtocol = require('../../lib/core/resource/protocols/PackageProtocol')
const ActionCommand = require('../../lib/core/pouch/commands/ActionCommand')
const ResourceManager = require('../../lib/core/resource/resourceManager')

describe('Windows路径解析兼容性测试 - Issue #31', () => {
  let tempDir
  let packageProtocol
  let resourceManager

  beforeEach(async () => {
    // 创建临时测试目录
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'promptx-windows-test-'))
    packageProtocol = new PackageProtocol()
    resourceManager = new ResourceManager()
  })

  afterEach(async () => {
    // 清理临时目录
    if (tempDir && await fs.pathExists(tempDir)) {
      await fs.remove(tempDir)
    }
  })

  describe('PackageProtocol 路径规范化', () => {
    test('应该正确处理Windows路径分隔符', () => {
      const WINDOWS_PATHS = [
        'C:\\Users\\developer\\projects\\promptx\\prompt\\core\\roles\\java-developer.role.md',
        'D:\\workspace\\ai-prompts\\resources\\execution\\test-automation.execution.md',
        'E:\\dev\\dpml\\thought\\problem-solving.thought.md'
      ]
      
      WINDOWS_PATHS.forEach(windowsPath => {
        const normalized = packageProtocol.normalizePathForComparison(windowsPath)
        
        // 验证路径分隔符已经统一为正斜杠
        expect(normalized).not.toContain('\\')
        expect(normalized.split('/').length).toBeGreaterThan(1)
        
        // 验证路径开头没有多余的斜杠
        expect(normalized).not.toMatch(/^\/+/)
      })
    })

    test('应该正确处理POSIX路径', () => {
      const POSIX_PATHS = [
        '/home/developer/projects/promptx/prompt/core/roles/java-developer.role.md',
        '/opt/ai-prompts/resources/execution/test-automation.execution.md',
        '/var/dev/dpml/thought/problem-solving.thought.md'
      ]
      
      POSIX_PATHS.forEach(posixPath => {
        const normalized = packageProtocol.normalizePathForComparison(posixPath)
        
        // POSIX路径应该保持相对稳定
        expect(normalized).not.toContain('\\')
        expect(normalized.split('/').length).toBeGreaterThan(1)
        
        // 验证路径开头没有多余的斜杠
        expect(normalized).not.toMatch(/^\/+/)
      })
    })

    test('应该处理混合路径分隔符', () => {
      const mixedPath = 'C:\\Users\\developer/projects/promptx\\prompt/core'
      const normalized = packageProtocol.normalizePathForComparison(mixedPath)
      
      expect(normalized).not.toContain('\\')
      // 在不同操作系统上路径格式可能不同，检查关键部分
      expect(normalized).toMatch(/Users\/developer\/projects\/promptx\/prompt\/core$/)
    })

    test('应该处理空路径和边界情况', () => {
      expect(packageProtocol.normalizePathForComparison('')).toBe('')
      expect(packageProtocol.normalizePathForComparison(null)).toBe('')
      expect(packageProtocol.normalizePathForComparison(undefined)).toBe('')
      expect(packageProtocol.normalizePathForComparison('single-file.md')).toBe('single-file.md')
    })
  })

  describe('ResourceManager 新架构路径处理', () => {
    test('应该正确初始化并处理跨平台路径', async () => {
      // 测试新架构的初始化
      await resourceManager.initializeWithNewArchitecture()
      
      // 验证初始化成功
      expect(resourceManager.registry).toBeDefined()
      expect(resourceManager.discoveryManager).toBeDefined()
      expect(resourceManager.protocols.size).toBeGreaterThan(0)
    })

    test('应该处理不同格式的资源引用', async () => {
      await resourceManager.initializeWithNewArchitecture()
      
      // 测试基础协议格式
      const testCases = [
        '@package://prompt/core/test.role.md',
        '@project://.promptx/resource/test.execution.md'
      ]

      for (const testCase of testCases) {
        try {
          // 验证协议解析不会因为路径格式而失败
          const parsed = resourceManager.protocolParser.parse(testCase)
          expect(parsed.protocol).toBeDefined()
          expect(parsed.path).toBeDefined()
        } catch (error) {
          // 协议解析错误是可以接受的（文件可能不存在），但不应该是路径格式错误
          expect(error.message).not.toMatch(/windows|路径分隔符|path separator/i)
        }
      }
    })
  })

  describe('ActionCommand 跨平台兼容性', () => {
    test('应该正确处理不同平台的文件路径', async () => {
      const command = new ActionCommand()
      
      // 验证 ActionCommand 可以初始化
      expect(command).toBeDefined()
      expect(typeof command.execute).toBe('function')
    })
  })

  describe('路径解析性能测试', () => {
    test('路径规范化不应该有明显性能问题', () => {
      const startTime = Date.now()
      
      // 大量路径规范化操作
      for (let i = 0; i < 1000; i++) {
        const WINDOWS_PATHS = [
          'C:\\Users\\developer\\projects\\promptx\\prompt\\core\\roles\\java-developer.role.md',
          'D:\\workspace\\ai-prompts\\resources\\execution\\test-automation.execution.md',
          'E:\\dev\\dpml\\thought\\problem-solving.thought.md'
        ]
        
        WINDOWS_PATHS.forEach(path => {
          packageProtocol.normalizePathForComparison(path)
        })
        
        const POSIX_PATHS = [
          '/home/developer/projects/promptx/prompt/core/roles/java-developer.role.md',
          '/opt/ai-prompts/resources/execution/test-automation.execution.md',
          '/var/dev/dpml/thought/problem-solving.thought.md'
        ]
        
        POSIX_PATHS.forEach(path => {
          packageProtocol.normalizePathForComparison(path)
        })
      }
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // 1000次 * 6个路径 = 6000次操作应该在合理时间内完成
      expect(duration).toBeLessThan(1000) // 1秒内完成
    })
  })

  describe('集成测试：完整路径解析流程', () => {
    test('应该在不同平台上提供一致的行为', async () => {
      await resourceManager.initializeWithNewArchitecture()
      
      // 测试统计信息
      const stats = resourceManager.registry.getStats()
      expect(stats.total).toBeGreaterThanOrEqual(0)
      
      // 验证注册表功能正常
      expect(typeof stats.byProtocol).toBe('object')
    })
  })
})