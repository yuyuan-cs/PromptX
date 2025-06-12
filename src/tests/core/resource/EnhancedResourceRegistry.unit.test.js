const EnhancedResourceRegistry = require('../../../lib/core/resource/EnhancedResourceRegistry')

describe('EnhancedResourceRegistry', () => {
  let registry

  beforeEach(() => {
    registry = new EnhancedResourceRegistry()
  })

  describe('constructor', () => {
    test('should initialize with empty registry', () => {
      expect(registry.size()).toBe(0)
      expect(registry.list()).toEqual([])
    })
  })

  describe('register', () => {
    test('should register resource with metadata', () => {
      const resource = {
        id: 'role:test',
        reference: '@package://test.md',
        metadata: {
          source: 'PACKAGE',
          priority: 1,
          timestamp: new Date()
        }
      }

      registry.register(resource)

      expect(registry.has('role:test')).toBe(true)
      expect(registry.resolve('role:test')).toBe('@package://test.md')
    })

    test('should throw error for invalid resource', () => {
      expect(() => {
        registry.register({ id: 'test' }) // missing reference
      }).toThrow('Resource must have id and reference')
    })

    test('should throw error for missing metadata', () => {
      expect(() => {
        registry.register({
          id: 'role:test',
          reference: '@package://test.md'
          // missing metadata
        })
      }).toThrow('Resource must have metadata with source and priority')
    })
  })

  describe('registerBatch', () => {
    test('should register multiple resources at once', () => {
      const resources = [
        {
          id: 'role:test1',
          reference: '@package://test1.md',
          metadata: { source: 'PACKAGE', priority: 1, timestamp: new Date() }
        },
        {
          id: 'role:test2',
          reference: '@project://test2.md',
          metadata: { source: 'PROJECT', priority: 2, timestamp: new Date() }
        }
      ]

      registry.registerBatch(resources)

      expect(registry.size()).toBe(2)
      expect(registry.has('role:test1')).toBe(true)
      expect(registry.has('role:test2')).toBe(true)
    })

    test('should handle batch registration failures gracefully', () => {
      const resources = [
        {
          id: 'role:valid',
          reference: '@package://valid.md',
          metadata: { source: 'PACKAGE', priority: 1, timestamp: new Date() }
        },
        {
          id: 'role:invalid'
          // missing reference and metadata
        }
      ]

      // Should register valid resources and skip invalid ones
      registry.registerBatch(resources)

      expect(registry.size()).toBe(1)
      expect(registry.has('role:valid')).toBe(true)
      expect(registry.has('role:invalid')).toBe(false)
    })
  })

  describe('merge', () => {
    test('should merge with another registry using priority rules', () => {
      // Setup first registry with package resources
      const resource1 = {
        id: 'role:test',
        reference: '@package://test.md',
        metadata: { source: 'PACKAGE', priority: 1, timestamp: new Date('2023-01-01') }
      }
      registry.register(resource1)

      // Create second registry with project resources (higher priority)
      const otherRegistry = new EnhancedResourceRegistry()
      const resource2 = {
        id: 'role:test', // same ID, should override
        reference: '@project://test.md',
        metadata: { source: 'PROJECT', priority: 2, timestamp: new Date('2023-01-02') }
      }
      otherRegistry.register(resource2)

      // Merge - PROJECT should override PACKAGE due to higher priority
      registry.merge(otherRegistry)

      expect(registry.resolve('role:test')).toBe('@project://test.md')
      const metadata = registry.getMetadata('role:test')
      expect(metadata.source).toBe('PROJECT')
    })

    test('should handle same priority by timestamp (newer wins)', () => {
      const older = new Date('2023-01-01')
      const newer = new Date('2023-01-02')

      // Setup first registry
      const resource1 = {
        id: 'role:test',
        reference: '@package://old.md',
        metadata: { source: 'PACKAGE', priority: 1, timestamp: older }
      }
      registry.register(resource1)

      // Create second registry with same priority but newer timestamp
      const otherRegistry = new EnhancedResourceRegistry()
      const resource2 = {
        id: 'role:test',
        reference: '@package://new.md',
        metadata: { source: 'PACKAGE', priority: 1, timestamp: newer }
      }
      otherRegistry.register(resource2)

      registry.merge(otherRegistry)

      expect(registry.resolve('role:test')).toBe('@package://new.md')
    })

    test('should handle discovery source priority correctly', () => {
      // Test priority order: USER > PROJECT > PACKAGE > INTERNET
      const resources = [
        {
          id: 'role:test',
          reference: '@internet://remote.md',
          metadata: { source: 'INTERNET', priority: 4, timestamp: new Date() }
        },
        {
          id: 'role:test',
          reference: '@package://builtin.md',
          metadata: { source: 'PACKAGE', priority: 1, timestamp: new Date() }
        },
        {
          id: 'role:test',
          reference: '@project://project.md',
          metadata: { source: 'PROJECT', priority: 2, timestamp: new Date() }
        },
        {
          id: 'role:test',
          reference: '@user://custom.md',
          metadata: { source: 'USER', priority: 3, timestamp: new Date() }
        }
      ]

      // Register in random order
      registry.register(resources[0]) // INTERNET
      registry.register(resources[1]) // PACKAGE (should override INTERNET)
      registry.register(resources[2]) // PROJECT (should override PACKAGE)
      registry.register(resources[3]) // USER (should override PROJECT)

      expect(registry.resolve('role:test')).toBe('@user://custom.md')
    })
  })

  describe('resolve', () => {
    test('should resolve resource by exact ID', () => {
      const resource = {
        id: 'role:test',
        reference: '@package://test.md',
        metadata: { source: 'PACKAGE', priority: 1, timestamp: new Date() }
      }
      registry.register(resource)

      expect(registry.resolve('role:test')).toBe('@package://test.md')
    })

    test('should support backwards compatibility lookup', () => {
      const resource = {
        id: 'role:java-developer',
        reference: '@package://java.md',
        metadata: { source: 'PACKAGE', priority: 1, timestamp: new Date() }
      }
      registry.register(resource)

      // Should find by bare name if no exact match
      expect(registry.resolve('java-developer')).toBe('@package://java.md')
    })

    test('should throw error if resource not found', () => {
      expect(() => {
        registry.resolve('non-existent')
      }).toThrow('Resource \'non-existent\' not found')
    })
  })

  describe('list', () => {
    test('should list all resources', () => {
      const resources = [
        {
          id: 'role:test1',
          reference: '@package://test1.md',
          metadata: { source: 'PACKAGE', priority: 1, timestamp: new Date() }
        },
        {
          id: 'execution:test2',
          reference: '@project://test2.md',
          metadata: { source: 'PROJECT', priority: 2, timestamp: new Date() }
        }
      ]

      registry.registerBatch(resources)

      const list = registry.list()
      expect(list).toHaveLength(2)
      expect(list).toContain('role:test1')
      expect(list).toContain('execution:test2')
    })

    test('should filter by protocol', () => {
      const resources = [
        {
          id: 'role:test1',
          reference: '@package://test1.md',
          metadata: { source: 'PACKAGE', priority: 1, timestamp: new Date() }
        },
        {
          id: 'execution:test2',
          reference: '@project://test2.md',
          metadata: { source: 'PROJECT', priority: 2, timestamp: new Date() }
        },
        {
          id: 'role:test3',
          reference: '@user://test3.md',
          metadata: { source: 'USER', priority: 3, timestamp: new Date() }
        }
      ]

      registry.registerBatch(resources)

      const roleList = registry.list('role')
      expect(roleList).toHaveLength(2)
      expect(roleList).toContain('role:test1')
      expect(roleList).toContain('role:test3')

      const executionList = registry.list('execution')
      expect(executionList).toHaveLength(1)
      expect(executionList).toContain('execution:test2')
    })
  })

  describe('getMetadata', () => {
    test('should return resource metadata', () => {
      const timestamp = new Date()
      const resource = {
        id: 'role:test',
        reference: '@package://test.md',
        metadata: { source: 'PACKAGE', priority: 1, timestamp: timestamp }
      }
      registry.register(resource)

      const metadata = registry.getMetadata('role:test')
      expect(metadata).toEqual({
        source: 'PACKAGE',
        priority: 1,
        timestamp: timestamp
      })
    })

    test('should return null for non-existent resource', () => {
      const metadata = registry.getMetadata('non-existent')
      expect(metadata).toBeNull()
    })
  })

  describe('clear', () => {
    test('should clear all resources', () => {
      const resource = {
        id: 'role:test',
        reference: '@package://test.md',
        metadata: { source: 'PACKAGE', priority: 1, timestamp: new Date() }
      }
      registry.register(resource)

      expect(registry.size()).toBe(1)

      registry.clear()

      expect(registry.size()).toBe(0)
      expect(registry.list()).toEqual([])
    })
  })

  describe('size', () => {
    test('should return number of registered resources', () => {
      expect(registry.size()).toBe(0)

      const resources = [
        {
          id: 'role:test1',
          reference: '@package://test1.md',
          metadata: { source: 'PACKAGE', priority: 1, timestamp: new Date() }
        },
        {
          id: 'role:test2',
          reference: '@project://test2.md',
          metadata: { source: 'PROJECT', priority: 2, timestamp: new Date() }
        }
      ]

      registry.registerBatch(resources)

      expect(registry.size()).toBe(2)
    })
  })

  describe('has', () => {
    test('should check if resource exists', () => {
      const resource = {
        id: 'role:test',
        reference: '@package://test.md',
        metadata: { source: 'PACKAGE', priority: 1, timestamp: new Date() }
      }
      registry.register(resource)

      expect(registry.has('role:test')).toBe(true)
      expect(registry.has('non-existent')).toBe(false)
    })
  })

  describe('remove', () => {
    test('should remove resource', () => {
      const resource = {
        id: 'role:test',
        reference: '@package://test.md',
        metadata: { source: 'PACKAGE', priority: 1, timestamp: new Date() }
      }
      registry.register(resource)

      expect(registry.has('role:test')).toBe(true)

      registry.remove('role:test')

      expect(registry.has('role:test')).toBe(false)
      expect(registry.size()).toBe(0)
    })

    test('should do nothing if resource does not exist', () => {
      registry.remove('non-existent') // Should not throw
      expect(registry.size()).toBe(0)
    })
  })

  describe('loadFromDiscoveryResults', () => {
    test('should load resources from discovery manager results', () => {
      const discoveryResults = [
        {
          id: 'role:test1',
          reference: '@package://test1.md',
          metadata: { source: 'PACKAGE', priority: 1, timestamp: new Date() }
        },
        {
          id: 'role:test2',
          reference: '@project://test2.md',
          metadata: { source: 'PROJECT', priority: 2, timestamp: new Date() }
        }
      ]

      registry.loadFromDiscoveryResults(discoveryResults)

      expect(registry.size()).toBe(2)
      expect(registry.resolve('role:test1')).toBe('@package://test1.md')
      expect(registry.resolve('role:test2')).toBe('@project://test2.md')
    })

    test('should handle empty discovery results', () => {
      registry.loadFromDiscoveryResults([])
      expect(registry.size()).toBe(0)
    })

    test('should handle invalid discovery results gracefully', () => {
      const discoveryResults = [
        {
          id: 'role:valid',
          reference: '@package://valid.md',
          metadata: { source: 'PACKAGE', priority: 1, timestamp: new Date() }
        },
        {
          id: 'role:invalid'
          // missing reference and metadata
        },
        null,
        undefined
      ]

      registry.loadFromDiscoveryResults(discoveryResults)

      expect(registry.size()).toBe(1)
      expect(registry.has('role:valid')).toBe(true)
    })
  })
})