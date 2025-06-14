const DiscoveryManager = require('../../../../lib/core/resource/discovery/DiscoveryManager')

describe('DiscoveryManager - Registry Merge', () => {
  let manager

  beforeEach(() => {
    manager = new DiscoveryManager()
  })

  describe('discoverRegistries', () => {
    test('should merge registries from all discoveries with priority order', async () => {
      // Mock discoveries to return Map instances
      const packageRegistry = new Map([
        ['role:java-developer', '@package://prompt/domain/java-developer/java-developer.role.md'],
        ['thought:remember', '@package://prompt/core/thought/remember.thought.md'],
        ['role:shared', '@package://prompt/domain/shared/shared.role.md'] // 会被project覆盖
      ])

      const projectRegistry = new Map([
        ['role:custom-role', '@project://prompt/custom-role/custom-role.role.md'],
        ['execution:custom-exec', '@project://prompt/execution/custom-exec.execution.md'],
        ['role:shared', '@project://prompt/custom/shared.role.md'] // 覆盖package的同名资源
      ])

      // Mock discoverRegistry methods
      manager.discoveries[0].discoverRegistry = jest.fn().mockResolvedValue(packageRegistry)
      manager.discoveries[1].discoverRegistry = jest.fn().mockResolvedValue(projectRegistry)

      const mergedRegistry = await manager.discoverRegistries()

      expect(mergedRegistry).toBeInstanceOf(Map)
      expect(mergedRegistry.size).toBe(5)
      
      // 验证package级资源
      expect(mergedRegistry.get('role:java-developer')).toBe('@package://prompt/domain/java-developer/java-developer.role.md')
      expect(mergedRegistry.get('thought:remember')).toBe('@package://prompt/core/thought/remember.thought.md')
      
      // 验证project级资源
      expect(mergedRegistry.get('role:custom-role')).toBe('@project://prompt/custom-role/custom-role.role.md')
      expect(mergedRegistry.get('execution:custom-exec')).toBe('@project://prompt/execution/custom-exec.execution.md')
      
      // 验证优先级：按设计，package(priority=1)应该覆盖project(priority=2)，因为数字越小优先级越高
      expect(mergedRegistry.get('role:shared')).toBe('@package://prompt/domain/shared/shared.role.md')
    })

    test('should handle discovery failures gracefully', async () => {
      const packageRegistry = new Map([
        ['role:java-developer', '@package://prompt/domain/java-developer/java-developer.role.md']
      ])

      manager.discoveries[0].discoverRegistry = jest.fn().mockResolvedValue(packageRegistry)
      manager.discoveries[1].discoverRegistry = jest.fn().mockRejectedValue(new Error('Project discovery failed'))

      const mergedRegistry = await manager.discoverRegistries()

      expect(mergedRegistry).toBeInstanceOf(Map)
      expect(mergedRegistry.size).toBe(1)
      expect(mergedRegistry.get('role:java-developer')).toBe('@package://prompt/domain/java-developer/java-developer.role.md')
    })

    test('should return empty registry if all discoveries fail', async () => {
      manager.discoveries[0].discoverRegistry = jest.fn().mockRejectedValue(new Error('Package discovery failed'))
      manager.discoveries[1].discoverRegistry = jest.fn().mockRejectedValue(new Error('Project discovery failed'))

      const mergedRegistry = await manager.discoverRegistries()

      expect(mergedRegistry).toBeInstanceOf(Map)
      expect(mergedRegistry.size).toBe(0)
    })

    test('should respect discovery priority when merging', async () => {
      // 添加一个自定义的高优先级discovery
      const highPriorityDiscovery = {
        source: 'HIGH_PRIORITY',
        priority: 0,
        discover: jest.fn().mockResolvedValue([]), // 需要提供discover方法
        discoverRegistry: jest.fn().mockResolvedValue(new Map([
          ['role:override', '@high://prompt/override.role.md']
        ]))
      }

      manager.addDiscovery(highPriorityDiscovery)

      // 低优先级的discoveries
      manager.discoveries[1].discoverRegistry = jest.fn().mockResolvedValue(new Map([
        ['role:override', '@package://prompt/original.role.md']
      ]))
      manager.discoveries[2].discoverRegistry = jest.fn().mockResolvedValue(new Map([
        ['role:override', '@project://prompt/project.role.md']
      ]))

      const mergedRegistry = await manager.discoverRegistries()

      // 高优先级的应该被保留
      expect(mergedRegistry.get('role:override')).toBe('@high://prompt/override.role.md')
    })
  })

  describe('discoverRegistryBySource', () => {
    test('should discover registry from specific source', async () => {
      const packageRegistry = new Map([
        ['role:java-developer', '@package://prompt/domain/java-developer/java-developer.role.md']
      ])

      manager.discoveries[0].discoverRegistry = jest.fn().mockResolvedValue(packageRegistry)

      const registry = await manager.discoverRegistryBySource('PACKAGE')

      expect(registry).toBeInstanceOf(Map)
      expect(registry.size).toBe(1)
      expect(registry.get('role:java-developer')).toBe('@package://prompt/domain/java-developer/java-developer.role.md')
      expect(manager.discoveries[0].discoverRegistry).toHaveBeenCalled()
    })

    test('should throw error if source not found', async () => {
      await expect(manager.discoverRegistryBySource('NON_EXISTENT')).rejects.toThrow('Discovery source NON_EXISTENT not found')
    })
  })

  describe('_mergeRegistries', () => {
    test('should merge multiple registries with earlier ones having higher priority', () => {
      // 模拟按优先级排序的注册表：数字越小优先级越高
      const registry1 = new Map([
        ['role:a', '@source1://a.md'],
        ['role:shared', '@source1://shared.md'] // 优先级最高，应该被保留
      ])

      const registry2 = new Map([
        ['role:b', '@source2://b.md'],
        ['role:shared', '@source2://shared.md'] // 优先级较低，应该被覆盖
      ])

      const registry3 = new Map([
        ['role:c', '@source3://c.md'],
        ['role:shared', '@source3://shared.md'] // 优先级最低，应该被覆盖
      ])

      const merged = manager._mergeRegistries([registry1, registry2, registry3])

      expect(merged).toBeInstanceOf(Map)
      expect(merged.size).toBe(4)
      expect(merged.get('role:a')).toBe('@source1://a.md')
      expect(merged.get('role:b')).toBe('@source2://b.md')
      expect(merged.get('role:c')).toBe('@source3://c.md')
      expect(merged.get('role:shared')).toBe('@source1://shared.md') // 被高优先级registry1保留
    })

    test('should handle empty registries', () => {
      const registry1 = new Map([['role:a', '@source1://a.md']])
      const registry2 = new Map()
      const registry3 = new Map([['role:c', '@source3://c.md']])

      const merged = manager._mergeRegistries([registry1, registry2, registry3])

      expect(merged.size).toBe(2)
      expect(merged.get('role:a')).toBe('@source1://a.md')
      expect(merged.get('role:c')).toBe('@source3://c.md')
    })

    test('should handle empty input array', () => {
      const merged = manager._mergeRegistries([])

      expect(merged).toBeInstanceOf(Map)
      expect(merged.size).toBe(0)
    })
  })

  // 保持向后兼容性测试
  describe('backward compatibility', () => {
    test('should still support discoverAll() method returning resource arrays', async () => {
      // 确保旧的discoverAll()方法仍然工作
      const packageResources = [
        { id: 'role:java-developer', reference: '@package://test1.md', metadata: { source: 'PACKAGE', priority: 1 } }
      ]

      manager.discoveries[0].discover = jest.fn().mockResolvedValue(packageResources)
      manager.discoveries[1].discover = jest.fn().mockResolvedValue([])

      const allResources = await manager.discoverAll()

      expect(Array.isArray(allResources)).toBe(true)
      expect(allResources).toHaveLength(1)
      expect(allResources[0].id).toBe('role:java-developer')
    })
  })
}) 