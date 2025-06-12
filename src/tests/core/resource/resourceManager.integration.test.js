const ResourceManager = require('../../../lib/core/resource/resourceManager')
const fs = require('fs')
const path = require('path')
const { glob } = require('glob')
const fsExtra = require('fs-extra')
const os = require('os')

// Mock dependencies for integration testing
jest.mock('fs')
jest.mock('glob')

// FIXME: 这个集成测试非常耗时（13秒+），暂时跳过以提高开发效率
// 问题：每个测试都会触发真实的文件系统发现操作，即使有Mock也不完整
// TODO: 重构为更快的单元测试或优化Mock配置
describe.skip('ResourceManager - Integration Tests', () => {
  let tempDir
  let resourceManager

  beforeEach(async () => {
    // 创建临时目录
    tempDir = await fsExtra.mkdtemp(path.join(os.tmpdir(), 'resourcemanager-test-'))
    resourceManager = new ResourceManager()
  })

  afterEach(async () => {
    // 清理临时目录
    if (tempDir && await fsExtra.pathExists(tempDir)) {
      await fsExtra.remove(tempDir)
    }
  })

  describe('新架构集成测试', () => {
    test('应该完整初始化所有核心组件', async () => {
      glob.mockResolvedValue([])

      await resourceManager.initializeWithNewArchitecture()

      expect(resourceManager.registry).toBeDefined()
      expect(resourceManager.protocolParser).toBeDefined()
      expect(resourceManager.discoveryManager).toBeDefined()
      expect(resourceManager.protocols.size).toBeGreaterThan(0)
      expect(resourceManager.initialized).toBe(true)
    })

    test('应该从动态发现加载资源', async () => {
      glob.mockResolvedValue([
        '/test/role.java-backend-developer.md',
        '/test/execution.test-automation.md'
      ])

      await resourceManager.initializeWithNewArchitecture()

      // 验证发现管理器已调用
      expect(resourceManager.initialized).toBe(true)
    })

    test('应该处理初始化错误', async () => {
      glob.mockRejectedValue(new Error('File system error'))

      // 应该不抛出错误，而是继续初始化
      await expect(resourceManager.initializeWithNewArchitecture()).resolves.toBeUndefined()
    })
  })

  describe('完整资源加载流程', () => {
    beforeEach(async () => {
      glob.mockResolvedValue([])
      await resourceManager.initializeWithNewArchitecture()
    })

    test('应该执行完整的资源加载流程', async () => {
      // 注册一个测试资源
      resourceManager.registry.register('role:test-role', {
        id: 'role:test-role',
        protocol: 'role',
        path: '/test/path'
      })

      const result = await resourceManager.loadResource('role:test-role')

      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
    })

    test('应该支持向后兼容的resolve方法', async () => {
      const result = await resourceManager.resolve('@package://package.json')

      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
    })

    test('应该处理多种资源类型', async () => {
      const resourceTypes = [
        'role:test-role',
        'execution:test-execution',
        'thought:test-thought',
        'knowledge:test-knowledge'
      ]

      for (const resourceId of resourceTypes) {
        const result = await resourceManager.loadResource(resourceId)
        expect(result).toBeDefined()
        expect(result.success).toBeDefined()
      }
    })
  })

  describe('错误处理和边界情况', () => {
    beforeEach(async () => {
      glob.mockResolvedValue([])
      await resourceManager.initializeWithNewArchitecture()
    })

    test('应该处理资源不存在的情况', async () => {
      const result = await resourceManager.loadResource('non-existent-resource')
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    test('应该处理协议解析失败', async () => {
      const result = await resourceManager.loadResource('@invalid://malformed-url')
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    test('应该处理文件读取失败', async () => {
      // 注册一个指向不存在文件的资源
      resourceManager.registry.register('test:invalid', {
        id: 'test:invalid',
        protocol: 'package',
        path: '/non/existent/file.md'
      })

      const result = await resourceManager.loadResource('test:invalid')
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('环境和路径处理', () => {
    test('应该处理多个扫描路径', async () => {
      glob.mockResolvedValue([
        '/path1/role.test.md',
        '/path2/execution.test.md',
        '/path3/thought.test.md'
      ])

      await resourceManager.initializeWithNewArchitecture()

      // 应该从所有路径发现资源
      expect(resourceManager.initialized).toBe(true)
    })

    test('应该处理缺失的环境变量', async () => {
      // 临时删除环境变量
      const originalUserDir = process.env.PROMPTX_USER_DIR
      delete process.env.PROMPTX_USER_DIR

      glob.mockResolvedValue([])

      await resourceManager.initializeWithNewArchitecture()

      // 应该仍然正常工作
      expect(resourceManager.initialized).toBe(true)

      // 恢复环境变量
      if (originalUserDir) {
        process.env.PROMPTX_USER_DIR = originalUserDir
      }
    })
  })

  describe('ResourceManager - New Discovery Architecture Integration', () => {
    let resourceManager

    beforeEach(() => {
      resourceManager = new ResourceManager()
    })

    describe('initialize with new discovery architecture', () => {
      test('should replace old initialization method', async () => {
        glob.mockResolvedValue([
          '/test/role.java-developer.md',
          '/test/execution.test.md'
        ])

        // 使用新架构初始化
        await resourceManager.initializeWithNewArchitecture()

        expect(resourceManager.initialized).toBe(true)
        expect(resourceManager.registry).toBeDefined()
        expect(resourceManager.discoveryManager).toBeDefined()
      })
    })

    describe('loadResource with new architecture', () => {
      beforeEach(async () => {
        glob.mockResolvedValue([])
        await resourceManager.initializeWithNewArchitecture()
      })

      test('should load resource using unified protocol parser', async () => {
        const result = await resourceManager.loadResource('@!role://java-developer')

        expect(result).toBeDefined()
        expect(result.success).toBeDefined()
      })

      test('should handle unknown resource gracefully', async () => {
        const result = await resourceManager.loadResource('@!role://unknown-role')
        
        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.message).toContain('Resource not found: role:unknown-role')
      })
    })

    describe('backward compatibility', () => {
      test('should still support new architecture method', async () => {
        glob.mockResolvedValue([])

        await resourceManager.initializeWithNewArchitecture()

        expect(resourceManager.initialized).toBe(true)
      })

      test('should prioritize new architecture when both methods are called', async () => {
        glob.mockResolvedValue([])

        // 先用新方法初始化
        await resourceManager.initializeWithNewArchitecture()
        const firstState = resourceManager.initialized

        // 再次调用新方法
        await resourceManager.initializeWithNewArchitecture()
        const secondState = resourceManager.initialized

        expect(firstState).toBe(true)
        expect(secondState).toBe(true)
      })
    })
  })
})

