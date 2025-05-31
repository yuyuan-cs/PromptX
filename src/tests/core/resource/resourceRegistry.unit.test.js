const ResourceRegistry = require('../../../lib/core/resource/resourceRegistry')
const { ProtocolInfo } = require('../../../lib/core/resource/types')

describe('ResourceRegistry - Unit Tests', () => {
  let registry

  beforeEach(() => {
    registry = new ResourceRegistry()
  })

  describe('内置协议', () => {
    test('应该包含内置协议', () => {
      const protocols = registry.listProtocols()

      expect(protocols).toContain('prompt')
      expect(protocols).toContain('file')
      expect(protocols).toContain('memory')
    })

    test('应该正确获取prompt协议信息', () => {
      const protocolInfo = registry.getProtocolInfo('prompt')

      expect(protocolInfo).toBeDefined()
      expect(protocolInfo.name).toBe('prompt')
      expect(protocolInfo.description).toContain('PromptX内置提示词资源协议')
      expect(protocolInfo.location).toContain('prompt://')
    })

    test('应该为协议提供资源注册表', () => {
      const protocolInfo = registry.getProtocolInfo('memory')

      expect(protocolInfo.registry).toBeDefined()
      expect(protocolInfo.registry.size).toBeGreaterThan(0)
      expect(protocolInfo.registry.has('declarative')).toBe(true)
      expect(protocolInfo.registry.has('procedural')).toBe(true)
    })
  })

  describe('资源解析', () => {
    test('应该解析prompt协议的资源ID', () => {
      const resolved = registry.resolve('prompt', 'protocols')

      expect(resolved).toBe('@package://prompt/protocol/**/*.md')
    })

    test('应该解析memory协议的资源ID', () => {
      const resolved = registry.resolve('memory', 'declarative')

      expect(resolved).toBe('@project://.promptx/memory/declarative.md')
    })

    test('应该解析未注册协议的资源路径', () => {
      const resolved = registry.resolve('file', 'any/path.md')

      expect(resolved).toBe('any/path.md')
    })

    test('应该在资源ID不存在时抛出错误', () => {
      expect(() => registry.resolve('prompt', 'nonexistent')).toThrow('Resource ID \'nonexistent\' not found in prompt protocol registry')
    })
  })

  describe('自定义协议注册', () => {
    test('应该注册新的自定义协议', () => {
      const customProtocol = {
        description: '测试协议',
        location: 'test://{resource_id}',
        registry: {
          test1: '@file://test1.md',
          test2: '@file://test2.md'
        }
      }

      registry.register('test', customProtocol)

      expect(registry.hasProtocol('test')).toBe(true)
      expect(registry.resolve('test', 'test1')).toBe('@file://test1.md')
    })

    test('应该列出自定义协议的资源', () => {
      const customProtocol = {
        registry: {
          resource1: '@file://r1.md',
          resource2: '@file://r2.md'
        }
      }

      registry.register('custom', customProtocol)
      const resources = registry.listProtocolResources('custom')

      expect(resources).toContain('resource1')
      expect(resources).toContain('resource2')
    })
  })

  describe('验证功能', () => {
    test('应该验证有效的协议和资源ID', () => {
      expect(registry.validateReference('prompt', 'protocols')).toBe(true)
      expect(registry.validateReference('file', 'any-path.md')).toBe(true)
      expect(registry.validateReference('memory', 'declarative')).toBe(true)
    })

    test('应该拒绝无效的协议和资源ID', () => {
      expect(registry.validateReference('unknown', 'test')).toBe(false)
      expect(registry.validateReference('prompt', 'nonexistent')).toBe(false)
    })
  })

  describe('注册表信息', () => {
    test('应该返回完整的注册表信息', () => {
      const info = registry.getRegistryInfo()

      expect(info.builtin).toHaveProperty('prompt')
      expect(info.builtin).toHaveProperty('file')
      expect(info.builtin).toHaveProperty('memory')
      expect(info.custom).toEqual({})
    })

    test('应该返回协议的资源列表', () => {
      const resources = registry.listProtocolResources('prompt')

      expect(resources).toContain('protocols')
      expect(resources).toContain('core')
      expect(resources).toContain('domain')
      expect(resources).toContain('bootstrap')
    })

    test('应该为无注册表的协议返回空列表', () => {
      const resources = registry.listProtocolResources('file')

      expect(resources).toEqual([])
    })
  })
})
