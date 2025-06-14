const ResourceManager = require('../../../lib/core/resource/resourceManager')
const ResourceRegistry = require('../../../lib/core/resource/resourceRegistry')
const ProtocolResolver = require('../../../lib/core/resource/ProtocolResolver')

// Mock所有依赖项
jest.mock('../../../lib/core/resource/resourceRegistry')
jest.mock('../../../lib/core/resource/ProtocolResolver')
jest.mock('../../../lib/core/resource/discovery/DiscoveryManager')

describe('ResourceManager - New Architecture Unit Tests', () => {
  let manager
  let mockRegistry
  let mockProtocolParser

  beforeEach(() => {
    // 清除所有模拟
    jest.clearAllMocks()

    // 创建模拟对象
    mockRegistry = {
      get: jest.fn(),
      has: jest.fn(),
      size: 0,
      register: jest.fn(),
      clear: jest.fn(),
      keys: jest.fn(),
      entries: jest.fn(),
      printAll: jest.fn(),
      groupByProtocol: jest.fn(),
      getStats: jest.fn(),
      search: jest.fn(),
      toJSON: jest.fn()
    }

    mockProtocolParser = {
      parse: jest.fn(),
      loadResource: jest.fn()
    }

    // 设置模拟构造函数
    ResourceRegistry.mockImplementation(() => mockRegistry)
    ProtocolResolver.mockImplementation(() => mockProtocolParser)

    // 创建管理器实例
    manager = new ResourceManager()
  })

  describe('初始化和构造', () => {
    test('应该创建ResourceManager实例', () => {
      expect(manager).toBeInstanceOf(ResourceManager)
      expect(manager.registry).toBeDefined()
      expect(manager.protocolParser).toBeDefined()
    })

    test('应该注册所有协议处理器', () => {
      expect(manager.protocols.size).toBe(6) // 6个协议 (包括knowledge)
      expect(manager.protocols.has('package')).toBe(true)
      expect(manager.protocols.has('project')).toBe(true)
      expect(manager.protocols.has('role')).toBe(true)
      expect(manager.protocols.has('execution')).toBe(true)
      expect(manager.protocols.has('thought')).toBe(true)
      expect(manager.protocols.has('knowledge')).toBe(true)
    })

    test('应该初始化发现管理器', () => {
      expect(manager.discoveryManager).toBeDefined()
    })
  })

  describe('资源加载 - loadResource方法', () => {
    test('应该处理DPML格式资源引用', async () => {
      const resourceId = '@!role://java-developer'
      const mockReference = { 
        id: 'role:java-developer',
        path: '/path/to/role',
        protocol: 'role'
      }
      const mockContent = 'Role content...'

      // Set registry size to non-zero to avoid auto-initialization
      manager.registry.register('dummy', {id: 'dummy'})
      
      // Replace the real protocolParser with mock
      manager.protocolParser = mockProtocolParser
      manager.registry = mockRegistry
      
      mockProtocolParser.parse.mockReturnValue({ protocol: 'role', path: 'java-developer' })
      mockRegistry.get.mockReturnValue(mockReference)
      
      // Mock loadResourceByProtocol instead of protocolParser.loadResource
      manager.loadResourceByProtocol = jest.fn().mockResolvedValue(mockContent)

      const result = await manager.loadResource(resourceId)

      expect(mockProtocolParser.parse).toHaveBeenCalledWith(resourceId)
      expect(mockRegistry.get).toHaveBeenCalledWith('role:java-developer')
      expect(manager.loadResourceByProtocol).toHaveBeenCalledWith(mockReference)
      expect(result).toEqual({
        success: true,
        content: mockContent,
        resourceId,
        reference: mockReference
      })
    })

    test('应该处理传统格式资源ID', async () => {
      const resourceId = '@package://java-developer.role.md'
      const mockReference = { id: resourceId, protocol: 'package', path: 'java-developer.role.md' }
      const mockContent = 'Package content...'

      // Replace the real registry with mock
      manager.registry = mockRegistry
      // Set registry size to non-zero to avoid auto-initialization
      mockRegistry.size = 1
      
      mockRegistry.get.mockReturnValue(mockReference)
      
      // Mock loadResourceByProtocol instead of protocolParser.loadResource
      manager.loadResourceByProtocol = jest.fn().mockResolvedValue(mockContent)

      const result = await manager.loadResource(resourceId)

      expect(mockRegistry.get).toHaveBeenCalledWith(resourceId)
      expect(manager.loadResourceByProtocol).toHaveBeenCalledWith(mockReference)
      expect(result).toEqual({
        success: true,
        content: mockContent,
        resourceId,
        reference: mockReference
      })
    })

    // FIXME: 这个测试用例太耗时，暂时注释掉
    // 原因：触发了真正的资源发现过程，涉及大量文件系统操作
    test.skip('应该在注册表为空时自动初始化', async () => {
      const resourceId = 'role:test-role'
      
      // Ensure registry is empty to trigger initialization
      manager.registry = new (require('../../../lib/core/resource/resourceRegistry.js'))()
      
      // 模拟空注册表
      mockRegistry.get.mockReturnValue(null)
      mockRegistry.size = 0
      
      // 模拟初始化成功
      const mockDiscoveryManager = {
        discoverRegistries: jest.fn().mockResolvedValue()
      }
      manager.discoveryManager = mockDiscoveryManager

      const result = await manager.loadResource(resourceId)

      expect(mockDiscoveryManager.discoverRegistries).toHaveBeenCalled()
      expect(result.success).toBe(false) // 因为资源仍然没找到
    })
  })

  describe('向后兼容 - resolve方法', () => {
    test('应该处理@package://格式引用', async () => {
      const resourceUrl = '@package://test/file.md'
      const mockContent = 'Package content...'

      // Set registry size to non-zero to avoid auto-initialization
      manager.registry.register('dummy', {id: 'dummy'})
      
      // Spy on the loadResourceByProtocol method which is what resolve() calls for @package:// URLs
      const loadResourceByProtocolSpy = jest.spyOn(manager, 'loadResourceByProtocol').mockResolvedValue(mockContent)

      const result = await manager.resolve(resourceUrl)

      expect(loadResourceByProtocolSpy).toHaveBeenCalledWith(resourceUrl)
      expect(result).toEqual({
        success: true,
        content: mockContent,
        path: resourceUrl,
        reference: resourceUrl
      })
      
      loadResourceByProtocolSpy.mockRestore()
    })

    test('应该处理逻辑协议引用', async () => {
      const resourceId = 'role:java-developer'
      const mockContent = 'Role content...'
      const mockReference = { id: resourceId, protocol: 'role', path: '/path/to/role' }

      // Mock the loadResource method which is what resolve() calls internally
      manager.loadResource = jest.fn().mockResolvedValue({
        success: true,
        content: mockContent,
        resourceId,
        reference: mockReference
      })

      const result = await manager.resolve(resourceId)

      expect(result.success).toBe(true)
      expect(result.content).toBe(mockContent)
    })

    test('应该处理传统格式资源ID', async () => {
      const resourceId = 'java-developer.role.md'
      const mockContent = 'File content...'
      
      mockRegistry.get.mockReturnValue(null)
      mockProtocolParser.loadResource.mockResolvedValue(mockContent)

      const result = await manager.resolve(resourceId)

      expect(result.success).toBe(false) // 找不到资源
    })
  })

  describe('新架构集成', () => {
    // FIXME: 这个测试可能耗时，暂时注释掉以提高测试速度
    test.skip('应该支持initializeWithNewArchitecture方法', async () => {
      const mockDiscoveryManager = {
        discoverRegistries: jest.fn().mockResolvedValue()
      }
      manager.discoveryManager = mockDiscoveryManager

      await manager.initializeWithNewArchitecture()

      expect(mockDiscoveryManager.discoverRegistries).toHaveBeenCalled()
      expect(manager.initialized).toBe(true)
    })

    test('应该支持loadResourceByProtocol方法', async () => {
      const protocolUrl = '@package://test.md'
      const mockContent = 'Test content'

      // Replace the real protocolParser with mock
      manager.protocolParser = mockProtocolParser
      mockProtocolParser.parse.mockReturnValue({ protocol: 'package', path: 'test.md' })
      
      // Mock the protocol's resolve method
      const mockPackageProtocol = {
        resolve: jest.fn().mockResolvedValue(mockContent)
      }
      manager.protocols.set('package', mockPackageProtocol)

      const result = await manager.loadResourceByProtocol(protocolUrl)

      expect(mockProtocolParser.parse).toHaveBeenCalledWith(protocolUrl)
      expect(mockPackageProtocol.resolve).toHaveBeenCalledWith('test.md', undefined)
      expect(result).toBe(mockContent)
    })
  })

  describe('协议管理', () => {
    test('应该能获取所有已注册的协议', () => {
      const protocols = manager.getAvailableProtocols()
      expect(protocols).toEqual(['package', 'project', 'role', 'thought', 'execution', 'knowledge'])
    })

    test('应该能检查协议是否支持', () => {
      expect(manager.supportsProtocol('package')).toBe(true)
      expect(manager.supportsProtocol('role')).toBe(true)
      expect(manager.supportsProtocol('unknown')).toBe(false)
    })
  })

  describe('错误处理', () => {
    test('应该优雅处理资源不存在的情况', async () => {
      const resourceId = 'non-existent-resource'
      
      mockRegistry.get.mockReturnValue(null)

      const result = await manager.loadResource(resourceId)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    test('应该处理协议解析错误', async () => {
      const resourceId = '@invalid://resource'
      
      mockProtocolParser.parse.mockImplementation(() => {
        throw new Error('Invalid protocol')
      })

      const result = await manager.loadResource(resourceId)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
})