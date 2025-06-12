const ResourceRegistry = require('../../../lib/core/resource/resourceRegistry')
const fs = require('fs')

// Mock fs for testing
jest.mock('fs')

describe('ResourceRegistry - Unit Tests', () => {
  let registry
  let mockRegistryData

  beforeEach(() => {
    registry = new ResourceRegistry()
    
    // Mock registry data
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
    test('应该初始化为空索引', () => {
      expect(registry.index).toBeInstanceOf(Map)
      expect(registry.index.size).toBe(0)
    })

    test('应该从文件加载注册表', () => {
      fs.readFileSync.mockReturnValue(JSON.stringify(mockRegistryData))
      
      registry.loadFromFile('test-registry.json')
      
      expect(registry.index.has('role:java-backend-developer')).toBe(true)
      expect(registry.index.has('execution:spring-ecosystem')).toBe(true)
      expect(registry.index.has('thought:recall')).toBe(true)
    })

    test('应该注册新资源', () => {
      registry.register('role:test-role', '@package://test/role.md')
      
      expect(registry.index.get('role:test-role')).toBe('@package://test/role.md')
    })

    test('应该解析资源ID到引用', () => {
      fs.readFileSync.mockReturnValue(JSON.stringify(mockRegistryData))
      registry.loadFromFile()
      
      const reference = registry.resolve('role:java-backend-developer')
      expect(reference).toBe('@package://prompt/domain/java-backend-developer/java-backend-developer.role.md')
    })

    test('应该支持向后兼容的ID解析', () => {
      fs.readFileSync.mockReturnValue(JSON.stringify(mockRegistryData))
      registry.loadFromFile()
      
      // Should resolve without protocol prefix (backward compatibility)
      const reference = registry.resolve('java-backend-developer')
      expect(reference).toBe('@package://prompt/domain/java-backend-developer/java-backend-developer.role.md')
    })

    test('应该处理协议优先级', () => {
      registry.register('role:test', '@package://role/test.md')
      registry.register('thought:test', '@package://thought/test.md')
      
      // Should return role protocol first (higher priority)
      const reference = registry.resolve('test')
      expect(reference).toBe('@package://role/test.md')
    })

    test('应该在资源未找到时抛出错误', () => {
      expect(() => {
        registry.resolve('non-existent-resource')
      }).toThrow("Resource 'non-existent-resource' not found")
    })
  })

  describe('文件格式兼容性', () => {
    test('应该处理字符串格式的资源信息', () => {
      const stringFormatData = {
        protocols: {
          role: {
            registry: {
              "simple-role": "@package://simple.role.md"
            }
          }
        }
      }
      
      fs.readFileSync.mockReturnValue(JSON.stringify(stringFormatData))
      registry.loadFromFile()
      
      expect(registry.resolve('simple-role')).toBe('@package://simple.role.md')
    })

    test('应该处理对象格式的资源信息', () => {
      const objectFormatData = {
        protocols: {
          role: {
            registry: {
              "complex-role": {
                file: "@package://complex.role.md",
                description: "Complex role description"
              }
            }
          }
        }
      }
      
      fs.readFileSync.mockReturnValue(JSON.stringify(objectFormatData))
      registry.loadFromFile()
      
      expect(registry.resolve('complex-role')).toBe('@package://complex.role.md')
    })

    test('应该处理缺失协议部分', () => {
      fs.readFileSync.mockReturnValue(JSON.stringify({}))
      
      registry.loadFromFile()
      
      expect(registry.index.size).toBe(0)
    })

    test('应该处理空注册表', () => {
      const emptyData = {
        protocols: {
          role: {},
          execution: { registry: {} }
        }
      }
      
      fs.readFileSync.mockReturnValue(JSON.stringify(emptyData))
      registry.loadFromFile()
      
      expect(registry.index.size).toBe(0)
    })
  })

  describe('错误处理', () => {
    test('应该处理格式错误的JSON', () => {
      fs.readFileSync.mockReturnValue('invalid json')
      
      expect(() => {
        registry.loadFromFile()
      }).toThrow()
    })

    test('应该覆盖现有注册', () => {
      registry.register('role:test', '@package://old.md')
      registry.register('role:test', '@package://new.md')
      
      expect(registry.resolve('role:test')).toBe('@package://new.md')
    })

    test('应该使用默认注册表路径', () => {
      fs.readFileSync.mockReturnValue(JSON.stringify(mockRegistryData))
      
      registry.loadFromFile()
      
      expect(fs.readFileSync).toHaveBeenCalledWith('src/resource.registry.json', 'utf8')
    })
  })
})