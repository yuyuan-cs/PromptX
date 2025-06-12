const ResourceManager = require('../../../lib/core/resource/resourceManager')
const fs = require('fs')
const { glob } = require('glob')

// Mock dependencies
jest.mock('fs')
jest.mock('glob')

describe('ResourceManager - Unit Tests', () => {
  let manager
  let mockRegistryData

  beforeEach(() => {
    manager = new ResourceManager()
    
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
            "spring-ecosystem": "@package://prompt/domain/java-backend-developer/execution/spring-ecosystem.execution.md"
          }
        },
        thought: {
          registry: {
            "recall": "@package://prompt/core/thought/recall.thought.md"
          }
        }
      }
    }

    jest.clearAllMocks()
  })

  describe('新架构核心功能', () => {
    test('应该初始化三个核心组件', () => {
      expect(manager.registry).toBeDefined()
      expect(manager.resolver).toBeDefined()
      expect(manager.discovery).toBeDefined()
    })

    test('应该初始化和加载资源', async () => {
      // Mock registry loading
      fs.readFileSync.mockReturnValue(JSON.stringify(mockRegistryData))
      
      // Mock resource discovery
      glob.mockResolvedValue([])
      
      await manager.initialize()
      
      expect(fs.readFileSync).toHaveBeenCalledWith('src/resource.registry.json', 'utf8')
      expect(manager.registry.index.has('role:java-backend-developer')).toBe(true)
    })

    test('应该发现并注册动态资源', async () => {
      // Mock registry loading
      fs.readFileSync.mockReturnValue(JSON.stringify(mockRegistryData))
      
      // Mock resource discovery
      glob.mockImplementation((pattern) => {
        if (pattern.includes('**/*.role.md')) {
          return Promise.resolve(['/discovered/new-role.role.md'])
        }
        return Promise.resolve([])
      })

      await manager.initialize()
      
      // Should have discovered and registered new resource
      expect(manager.registry.index.has('role:new-role')).toBe(true)
    })

    test('应该不覆盖静态注册表', async () => {
      // Mock registry loading
      fs.readFileSync.mockReturnValue(JSON.stringify(mockRegistryData))
      
      // Mock discovery returning conflicting resource
      glob.mockImplementation((pattern) => {
        if (pattern.includes('**/*.role.md')) {
          return Promise.resolve(['/discovered/java-backend-developer.role.md'])
        }
        return Promise.resolve([])
      })

      await manager.initialize()
      
      // Static registry should take precedence
      expect(manager.registry.resolve('java-backend-developer'))
        .toBe('@package://prompt/domain/java-backend-developer/java-backend-developer.role.md')
    })
  })

  describe('资源加载流程', () => {
    beforeEach(async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify(mockRegistryData))
      glob.mockResolvedValue([])
      await manager.initialize()
    })

    test('应该通过完整流程加载资源', async () => {
      const mockContent = '# Java Backend Developer Role\nExpert in Spring ecosystem...'
      
      // Mock protocol resolver
      jest.spyOn(manager.resolver, 'resolve').mockResolvedValue('/resolved/path/java.role.md')
      
      // Mock file reading for loadResource
      fs.readFileSync.mockReturnValue(mockContent)

      const result = await manager.loadResource('java-backend-developer')

      expect(result).toEqual({
        success: true,
        content: mockContent,
        path: '/resolved/path/java.role.md',
        reference: '@package://prompt/domain/java-backend-developer/java-backend-developer.role.md'
      })
    })

    test('应该支持向后兼容的 resolve 方法', async () => {
      const mockContent = 'Test content'
      
      jest.spyOn(manager.resolver, 'resolve').mockResolvedValue('/resolved/path/file.md')
      
      // Mock file system calls properly for the resolve method
      fs.readFileSync.mockImplementation((path) => {
        if (path === 'src/resource.registry.json') {
          return JSON.stringify(mockRegistryData)
        }
        return mockContent
      })

      // Test with @ prefix (direct protocol format)
      const result1 = await manager.resolve('@package://test/file.md')
      expect(result1.content).toBe(mockContent)
      expect(result1.reference).toBe('@package://test/file.md')

      // Test without @ prefix (legacy format)
      const result2 = await manager.resolve('java-backend-developer')
      expect(result2.content).toBe(mockContent)
    })

    test('应该处理资源未找到错误', async () => {
      const result = await manager.loadResource('non-existent-role')
      expect(result.success).toBe(false)
      expect(result.message).toBe("Resource 'non-existent-role' not found")
    })

    test('应该处理协议解析失败', async () => {
      jest.spyOn(manager.resolver, 'resolve').mockRejectedValue(new Error('Protocol resolution failed'))

      const result = await manager.loadResource('java-backend-developer')
      expect(result.success).toBe(false)
      expect(result.message).toBe('Protocol resolution failed')
    })

    test('应该处理文件读取失败', async () => {
      jest.spyOn(manager.resolver, 'resolve').mockResolvedValue('/non/existent/file.md')
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File not found')
      })

      const result = await manager.loadResource('java-backend-developer')
      expect(result.success).toBe(false)
      expect(result.message).toBe('File not found')
    })
  })

  describe('环境配置处理', () => {
    test('应该处理缺失的环境变量', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify(mockRegistryData))
      glob.mockResolvedValue([])

      // Test with undefined environment variable
      delete process.env.PROMPTX_USER_DIR

      await manager.initialize()

      // Should still work with only static registry
      expect(manager.registry.index.has('role:java-backend-developer')).toBe(true)
    })

    test('应该处理多个扫描路径', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify(mockRegistryData))
      
      // Mock process.env
      process.env.PROMPTX_USER_DIR = '/user/custom'
      
      glob.mockImplementation((pattern) => {
        if (pattern.includes('prompt/') && pattern.includes('**/*.role.md')) {
          return Promise.resolve(['/package/role.role.md'])
        }
        if (pattern.includes('.promptx/') && pattern.includes('**/*.role.md')) {
          return Promise.resolve(['/project/role.role.md'])
        }
        if (pattern.includes('/user/custom') && pattern.includes('**/*.role.md')) {
          return Promise.resolve(['/user/role.role.md'])
        }
        return Promise.resolve([])
      })

      await manager.initialize()

      // Should discover from all paths
      expect(manager.registry.index.has('role:role')).toBe(true)
    })
  })

  describe('错误处理和边界情况', () => {
    test('应该处理注册表加载失败', async () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('Registry file not found')
      })

      await expect(manager.initialize()).rejects.toThrow('Registry file not found')
    })

    test('应该处理发现失败', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify(mockRegistryData))
      glob.mockRejectedValue(new Error('Discovery failed'))

      await expect(manager.initialize()).rejects.toThrow('Discovery failed')
    })

    test('应该处理格式错误的注册表', async () => {
      fs.readFileSync.mockReturnValue('invalid json')
      glob.mockResolvedValue([])

      await expect(manager.initialize()).rejects.toThrow()
    })
  })
})