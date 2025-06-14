const BaseDiscovery = require('../../../../lib/core/resource/discovery/BaseDiscovery')

describe('BaseDiscovery', () => {
  let discovery

  beforeEach(() => {
    discovery = new BaseDiscovery('test', 1)
  })

  describe('constructor', () => {
    test('should initialize with source and priority', () => {
      expect(discovery.source).toBe('test')
      expect(discovery.priority).toBe(1)
    })

    test('should throw error if source is not provided', () => {
      expect(() => new BaseDiscovery()).toThrow('Discovery source is required')
    })

    test('should use default priority if not provided', () => {
      const defaultDiscovery = new BaseDiscovery('test')
      expect(defaultDiscovery.priority).toBe(0)
    })
  })

  describe('discover method', () => {
    test('should throw error for abstract method', async () => {
      await expect(discovery.discover()).rejects.toThrow('discover method must be implemented by subclass')
    })
  })

  describe('getDiscoveryInfo', () => {
    test('should return discovery metadata', () => {
      const info = discovery.getDiscoveryInfo()
      expect(info).toEqual({
        source: 'test',
        priority: 1,
        description: expect.any(String)
      })
    })
  })

  describe('validateResource', () => {
    test('should validate resource structure', () => {
      const validResource = {
        id: 'role:test',
        reference: '@package://test.md',
        metadata: {
          source: 'test',
          priority: 1
        }
      }

      expect(() => discovery.validateResource(validResource)).not.toThrow()
    })

    test('should throw error for invalid resource', () => {
      const invalidResource = { id: 'test' } // missing reference

      expect(() => discovery.validateResource(invalidResource)).toThrow('Resource must have id and reference')
    })
  })

  describe('normalizeResource', () => {
    test('should add metadata to resource', () => {
      const resource = {
        id: 'role:test',
        reference: '@package://test.md'
      }

      const normalized = discovery.normalizeResource(resource)
      
      expect(normalized).toEqual({
        id: 'role:test',
        reference: '@package://test.md',
        metadata: {
          source: 'test',
          priority: 1,
          timestamp: expect.any(Date)
        }
      })
    })

    test('should preserve existing metadata', () => {
      const resource = {
        id: 'role:test',
        reference: '@package://test.md',
        metadata: {
          customField: 'value'
        }
      }

      const normalized = discovery.normalizeResource(resource)
      
      expect(normalized.metadata.customField).toBe('value')
      expect(normalized.metadata.source).toBe('test')
    })
  })
})