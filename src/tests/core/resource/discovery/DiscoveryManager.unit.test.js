const DiscoveryManager = require('../../../../lib/core/resource/discovery/DiscoveryManager')
const PackageDiscovery = require('../../../../lib/core/resource/discovery/PackageDiscovery')
const ProjectDiscovery = require('../../../../lib/core/resource/discovery/ProjectDiscovery')

describe('DiscoveryManager', () => {
  let manager

  beforeEach(() => {
    manager = new DiscoveryManager()
  })

  describe('constructor', () => {
    test('should initialize with default discoveries', () => {
      expect(manager.discoveries).toHaveLength(2)
      expect(manager.discoveries[0]).toBeInstanceOf(PackageDiscovery)
      expect(manager.discoveries[1]).toBeInstanceOf(ProjectDiscovery)
    })

    test('should allow custom discoveries in constructor', () => {
      const customDiscovery = new PackageDiscovery()
      const customManager = new DiscoveryManager([customDiscovery])

      expect(customManager.discoveries).toHaveLength(1)
      expect(customManager.discoveries[0]).toBe(customDiscovery)
    })
  })

  describe('addDiscovery', () => {
    test('should add discovery and sort by priority', () => {
      const customDiscovery = { source: 'CUSTOM', priority: 0, discover: jest.fn() }
      
      manager.addDiscovery(customDiscovery)

      expect(manager.discoveries).toHaveLength(3)
      expect(manager.discoveries[0].source).toBe('CUSTOM') // priority 0 comes first
      expect(manager.discoveries[1].source).toBe('PACKAGE') // priority 1
      expect(manager.discoveries[2].source).toBe('PROJECT') // priority 2
    })
  })

  describe('removeDiscovery', () => {
    test('should remove discovery by source', () => {
      manager.removeDiscovery('PACKAGE')

      expect(manager.discoveries).toHaveLength(1)
      expect(manager.discoveries[0].source).toBe('PROJECT')
    })

    test('should do nothing if discovery not found', () => {
      manager.removeDiscovery('NON_EXISTENT')

      expect(manager.discoveries).toHaveLength(2)
    })
  })

  describe('discoverAll', () => {
    test('should discover resources from all discoveries in parallel', async () => {
      // Mock discovery methods
      const packageResources = [
        { id: 'role:java-developer', reference: '@package://test1.md', metadata: { source: 'PACKAGE', priority: 1 } }
      ]
      const projectResources = [
        { id: 'role:custom-role', reference: '@project://test2.md', metadata: { source: 'PROJECT', priority: 2 } }
      ]

      manager.discoveries[0].discover = jest.fn().mockResolvedValue(packageResources)
      manager.discoveries[1].discover = jest.fn().mockResolvedValue(projectResources)

      const allResources = await manager.discoverAll()

      expect(allResources).toHaveLength(2)
      expect(allResources[0].id).toBe('role:java-developer')
      expect(allResources[1].id).toBe('role:custom-role')
      expect(manager.discoveries[0].discover).toHaveBeenCalled()
      expect(manager.discoveries[1].discover).toHaveBeenCalled()
    })

    test('should handle discovery failures gracefully', async () => {
      const packageResources = [
        { id: 'role:java-developer', reference: '@package://test1.md', metadata: { source: 'PACKAGE', priority: 1 } }
      ]

      manager.discoveries[0].discover = jest.fn().mockResolvedValue(packageResources)
      manager.discoveries[1].discover = jest.fn().mockRejectedValue(new Error('Project discovery failed'))

      const allResources = await manager.discoverAll()

      expect(allResources).toHaveLength(1)
      expect(allResources[0].id).toBe('role:java-developer')
    })

    test('should return empty array if all discoveries fail', async () => {
      manager.discoveries[0].discover = jest.fn().mockRejectedValue(new Error('Package discovery failed'))
      manager.discoveries[1].discover = jest.fn().mockRejectedValue(new Error('Project discovery failed'))

      const allResources = await manager.discoverAll()

      expect(allResources).toEqual([])
    })
  })

  describe('discoverBySource', () => {
    test('should discover resources from specific source', async () => {
      const packageResources = [
        { id: 'role:java-developer', reference: '@package://test1.md', metadata: { source: 'PACKAGE', priority: 1 } }
      ]

      manager.discoveries[0].discover = jest.fn().mockResolvedValue(packageResources)

      const resources = await manager.discoverBySource('PACKAGE')

      expect(resources).toEqual(packageResources)
      expect(manager.discoveries[0].discover).toHaveBeenCalled()
    })

    test('should throw error if source not found', async () => {
      await expect(manager.discoverBySource('NON_EXISTENT')).rejects.toThrow('Discovery source NON_EXISTENT not found')
    })
  })

  describe('getDiscoveryInfo', () => {
    test('should return info for all discoveries', () => {
      // Mock getDiscoveryInfo methods
      manager.discoveries[0].getDiscoveryInfo = jest.fn().mockReturnValue({
        source: 'PACKAGE',
        priority: 1,
        description: 'Package discovery'
      })
      manager.discoveries[1].getDiscoveryInfo = jest.fn().mockReturnValue({
        source: 'PROJECT',
        priority: 2,
        description: 'Project discovery'
      })

      const info = manager.getDiscoveryInfo()

      expect(info).toHaveLength(2)
      expect(info[0].source).toBe('PACKAGE')
      expect(info[1].source).toBe('PROJECT')
    })
  })

  describe('clearCache', () => {
    test('should clear cache for all discoveries', () => {
      // Mock clearCache methods
      manager.discoveries[0].clearCache = jest.fn()
      manager.discoveries[1].clearCache = jest.fn()

      manager.clearCache()

      expect(manager.discoveries[0].clearCache).toHaveBeenCalled()
      expect(manager.discoveries[1].clearCache).toHaveBeenCalled()
    })
  })

  describe('_sortDiscoveriesByPriority', () => {
    test('should sort discoveries by priority ascending', () => {
      const discovery1 = { source: 'A', priority: 3 }
      const discovery2 = { source: 'B', priority: 1 }
      const discovery3 = { source: 'C', priority: 2 }

      manager.discoveries = [discovery1, discovery2, discovery3]
      manager._sortDiscoveriesByPriority()

      expect(manager.discoveries[0].source).toBe('B') // priority 1
      expect(manager.discoveries[1].source).toBe('C') // priority 2
      expect(manager.discoveries[2].source).toBe('A') // priority 3
    })
  })

  describe('_findDiscoveryBySource', () => {
    test('should find discovery by source', () => {
      const packageDiscovery = manager._findDiscoveryBySource('PACKAGE')
      
      expect(packageDiscovery).toBeDefined()
      expect(packageDiscovery.source).toBe('PACKAGE')
    })

    test('should return undefined if source not found', () => {
      const discovery = manager._findDiscoveryBySource('NON_EXISTENT')
      
      expect(discovery).toBeUndefined()
    })
  })
})