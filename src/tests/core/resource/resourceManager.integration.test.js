const ResourceManager = require('../../../lib/core/resource/resourceManager')
const fs = require('fs')
const path = require('path')
const { glob } = require('glob')

// Mock dependencies for integration testing
jest.mock('fs')
jest.mock('glob')

describe('ResourceManager - Integration Tests', () => {
  let manager
  let mockRegistryData

  beforeEach(() => {
    manager = new ResourceManager()
    
    // Mock registry data matching the new format
    mockRegistryData = {
      protocols: {
        role: {
          registry: {
            "java-backend-developer": "@package://prompt/domain/java-backend-developer/java-backend-developer.role.md",
            "product-manager": "@package://prompt/domain/product-manager/product-manager.role.md"
          }
        },
        execution: {
          registry: {
            "spring-ecosystem": "@package://prompt/domain/java-backend-developer/execution/spring-ecosystem.execution.md",
            "code-quality": "@package://prompt/domain/java-backend-developer/execution/code-quality.execution.md"
          }
        },
        thought: {
          registry: {
            "recall": "@package://prompt/core/thought/recall.thought.md",
            "remember": "@package://prompt/core/thought/remember.thought.md"
          }
        }
      }
    }

    jest.clearAllMocks()
  })

  describe('新架构集成测试', () => {
    test('应该完整初始化所有核心组件', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify(mockRegistryData))
      glob.mockResolvedValue([])

      await manager.initialize()

      expect(manager.registry).toBeDefined()
      expect(manager.resolver).toBeDefined()
      expect(manager.discovery).toBeDefined()
      expect(manager.registry.index.size).toBeGreaterThan(0)
    })

    test('应该从静态注册表和动态发现加载资源', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify(mockRegistryData))
      
      // Mock discovery finding additional resources
      glob.mockImplementation((pattern) => {
        if (pattern.includes('**/*.role.md')) {
          return Promise.resolve(['/discovered/new-role.role.md'])
        }
        return Promise.resolve([])
      })

      await manager.initialize()

      // Should have both static and discovered resources
      expect(manager.registry.index.has('role:java-backend-developer')).toBe(true)
      expect(manager.registry.index.has('role:new-role')).toBe(true)
    })

    test('应该优先使用静态注册表而非动态发现', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify(mockRegistryData))
      
      // Mock discovery finding conflicting resource
      glob.mockImplementation((pattern) => {
        if (pattern.includes('**/*.role.md')) {
          return Promise.resolve(['/discovered/java-backend-developer.role.md'])
        }
        return Promise.resolve([])
      })

      await manager.initialize()

      // Static registry should take precedence
      const reference = manager.registry.resolve('java-backend-developer')
      expect(reference).toBe('@package://prompt/domain/java-backend-developer/java-backend-developer.role.md')
    })
  })

  describe('完整资源加载流程', () => {
    beforeEach(async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify(mockRegistryData))
      glob.mockResolvedValue([])
      await manager.initialize()
    })

    test('应该执行完整的资源加载流程', async () => {
      const mockContent = '# Java Backend Developer Role\n专业的Java后端开发者...'
      const mockFilePath = '/resolved/path/java-backend-developer.role.md'
      
      // Mock the protocol resolver
      jest.spyOn(manager.resolver, 'resolve').mockResolvedValue(mockFilePath)
      
      // Mock file reading for content
      fs.readFileSync.mockReturnValue(mockContent)

      const result = await manager.loadResource('java-backend-developer')

      expect(result.content).toBe(mockContent)
      expect(result.path).toBe(mockFilePath)
      expect(result.reference).toBe('@package://prompt/domain/java-backend-developer/java-backend-developer.role.md')
    })

    test('应该支持向后兼容的resolve方法', async () => {
      const mockContent = 'Test content'
      const mockFilePath = '/test/path/file.md'
      
      jest.spyOn(manager.resolver, 'resolve').mockResolvedValue(mockFilePath)
      
      // Mock file system calls properly for the resolve method
      fs.readFileSync.mockImplementation((path) => {
        if (path === 'src/resource.registry.json') {
          return JSON.stringify(mockRegistryData)
        }
        return mockContent
      })

      // Test direct protocol format
      const result1 = await manager.resolve('@package://test/file.md')
      expect(result1.content).toBe(mockContent)
      expect(result1.reference).toBe('@package://test/file.md')

      // Test legacy ID format
      const result2 = await manager.resolve('java-backend-developer')
      expect(result2.content).toBe(mockContent)
    })

    test('应该处理多种资源类型', async () => {
      const mockContent = 'Resource content'
      const mockFilePath = '/test/path'
      
      jest.spyOn(manager.resolver, 'resolve').mockResolvedValue(mockFilePath)
      fs.readFileSync.mockReturnValue(mockContent)

      // Test role resource
      const roleResult = await manager.loadResource('java-backend-developer')
      expect(roleResult.reference).toContain('role.md')

      // Test execution resource
      const execResult = await manager.loadResource('spring-ecosystem')
      expect(execResult.reference).toContain('execution.md')

      // Test thought resource
      const thoughtResult = await manager.loadResource('recall')
      expect(thoughtResult.reference).toContain('thought.md')
    })
  })

  describe('错误处理和边界情况', () => {
    test('应该处理资源不存在的情况', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify(mockRegistryData))
      glob.mockResolvedValue([])
      await manager.initialize()

      const result = await manager.loadResource('non-existent-resource')
      expect(result.success).toBe(false)
      expect(result.message).toBe("Resource 'non-existent-resource' not found")
    })

    test('应该处理协议解析失败', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify(mockRegistryData))
      glob.mockResolvedValue([])
      await manager.initialize()

      jest.spyOn(manager.resolver, 'resolve').mockRejectedValue(new Error('Protocol resolution failed'))

      const result = await manager.loadResource('java-backend-developer')
      expect(result.success).toBe(false)
      expect(result.message).toBe('Protocol resolution failed')
    })

    test('应该处理文件读取失败', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify(mockRegistryData))
      glob.mockResolvedValue([])
      await manager.initialize()

      jest.spyOn(manager.resolver, 'resolve').mockResolvedValue('/non/existent/file.md')
      fs.readFileSync.mockImplementation((path) => {
        if (path === 'src/resource.registry.json') {
          return JSON.stringify(mockRegistryData)
        }
        throw new Error('File not found')
      })

      const result = await manager.loadResource('java-backend-developer')
      expect(result.success).toBe(false)
      expect(result.message).toBe('File not found')
    })

    test('应该处理初始化失败', async () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('Registry file not found')
      })

      await expect(manager.initialize()).rejects.toThrow('Registry file not found')
    })
  })

  describe('环境和路径处理', () => {
    test('应该处理多个扫描路径', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify(mockRegistryData))
      
      // Set environment variable
      process.env.PROMPTX_USER_DIR = '/user/custom'
      
      glob.mockImplementation((pattern) => {
        if (pattern.includes('prompt/') && pattern.includes('**/*.role.md')) {
          return Promise.resolve(['/package/test.role.md'])
        }
        if (pattern.includes('.promptx/') && pattern.includes('**/*.role.md')) {
          return Promise.resolve(['/project/test.role.md'])
        }
        if (pattern.includes('/user/custom') && pattern.includes('**/*.role.md')) {
          return Promise.resolve(['/user/test.role.md'])
        }
        return Promise.resolve([])
      })

      await manager.initialize()

      // Should discover from all scan paths
      expect(manager.registry.index.has('role:test')).toBe(true)
    })

    test('应该处理缺失的环境变量', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify(mockRegistryData))
      glob.mockResolvedValue([])

      // Remove environment variable
      delete process.env.PROMPTX_USER_DIR

      await manager.initialize()

      // Should still work with package and project paths
      expect(manager.registry.index.has('role:java-backend-developer')).toBe(true)
    })
  })
})

