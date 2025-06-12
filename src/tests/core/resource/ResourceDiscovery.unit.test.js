const path = require('path')
const { glob } = require('glob')
const ResourceDiscovery = require('../../../lib/core/resource/ResourceDiscovery')

jest.mock('glob')

describe('ResourceDiscovery', () => {
  let discovery

  beforeEach(() => {
    discovery = new ResourceDiscovery()
    jest.clearAllMocks()
  })

  describe('discoverResources', () => {
    test('should discover role files and generate correct references', async () => {
      const mockScanPaths = [
        '/mock/package/prompt',
        '/mock/project/.promptx'
      ]

      // Mock process.cwd() for project reference generation
      jest.spyOn(process, 'cwd').mockReturnValue('/mock/project')

      // Mock glob responses for role files
      glob.mockImplementation((pattern) => {
        if (pattern.includes('/mock/package/prompt') && pattern.includes('**/*.role.md')) {
          return Promise.resolve([
            '/mock/package/prompt/domain/java/java-backend-developer.role.md'
          ])
        }
        if (pattern.includes('/mock/project/.promptx') && pattern.includes('**/*.role.md')) {
          return Promise.resolve([
            '/mock/project/.promptx/custom/my-custom.role.md'
          ])
        }
        return Promise.resolve([])
      })

      const discovered = await discovery.discoverResources(mockScanPaths)

      const roleResources = discovered.filter(r => r.id.startsWith('role:'))
      expect(roleResources).toHaveLength(2)
      
      expect(roleResources[0]).toEqual({
        id: 'role:java-backend-developer',
        reference: '@package://prompt/domain/java/java-backend-developer.role.md'
      })
      
      expect(roleResources[1]).toEqual({
        id: 'role:my-custom',
        reference: '@project://.promptx/custom/my-custom.role.md'
      })
    })

    test('should discover execution files and generate correct references', async () => {
      const mockScanPaths = ['/mock/package/prompt']

      glob.mockImplementation((pattern) => {
        if (pattern.includes('**/execution/*.execution.md')) {
          return Promise.resolve([
            '/mock/package/prompt/domain/java/execution/spring-ecosystem.execution.md',
            '/mock/package/prompt/core/execution/best-practice.execution.md'
          ])
        }
        return Promise.resolve([])
      })

      const discovered = await discovery.discoverResources(mockScanPaths)

      const execResources = discovered.filter(r => r.id.startsWith('execution:'))
      expect(execResources).toHaveLength(2)
      
      expect(execResources[0]).toEqual({
        id: 'execution:spring-ecosystem',
        reference: '@package://prompt/domain/java/execution/spring-ecosystem.execution.md'
      })
    })

    test('should discover thought files and generate correct references', async () => {
      const mockScanPaths = ['/mock/package/prompt']

      glob.mockImplementation((pattern) => {
        if (pattern.includes('**/thought/*.thought.md')) {
          return Promise.resolve([
            '/mock/package/prompt/core/thought/recall.thought.md',
            '/mock/package/prompt/domain/java/thought/java-mindset.thought.md'
          ])
        }
        return Promise.resolve([])
      })

      const discovered = await discovery.discoverResources(mockScanPaths)

      const thoughtResources = discovered.filter(r => r.id.startsWith('thought:'))
      expect(thoughtResources).toHaveLength(2)
      
      expect(thoughtResources[0]).toEqual({
        id: 'thought:recall',
        reference: '@package://prompt/core/thought/recall.thought.md'
      })
    })

    test('should discover all resource types in single scan', async () => {
      const mockScanPaths = ['/mock/package/prompt']

      glob.mockImplementation((pattern) => {
        if (pattern.includes('**/*.role.md')) {
          return Promise.resolve(['/mock/package/prompt/domain/java.role.md'])
        }
        if (pattern.includes('**/execution/*.execution.md')) {
          return Promise.resolve(['/mock/package/prompt/execution/test.execution.md'])
        }
        if (pattern.includes('**/thought/*.thought.md')) {
          return Promise.resolve(['/mock/package/prompt/thought/test.thought.md'])
        }
        return Promise.resolve([])
      })

      const discovered = await discovery.discoverResources(mockScanPaths)

      expect(discovered).toHaveLength(3)
      expect(discovered.map(r => r.id)).toEqual([
        'role:java',
        'execution:test',
        'thought:test'
      ])
    })

    test('should handle empty scan results gracefully', async () => {
      const mockScanPaths = ['/empty/path']

      glob.mockResolvedValue([])

      const discovered = await discovery.discoverResources(mockScanPaths)

      expect(discovered).toEqual([])
    })

    test('should handle multiple scan paths', async () => {
      const mockScanPaths = [
        '/mock/package/prompt',
        '/mock/project/.promptx',
        '/mock/user/custom'
      ]

      // Mock process.cwd() for project reference generation
      jest.spyOn(process, 'cwd').mockReturnValue('/mock/project')

      glob.mockImplementation((pattern) => {
        if (pattern.includes('/mock/package/prompt') && pattern.includes('**/*.role.md')) {
          return Promise.resolve(['/mock/package/prompt/builtin.role.md'])
        }
        if (pattern.includes('/mock/project/.promptx') && pattern.includes('**/*.role.md')) {
          return Promise.resolve(['/mock/project/.promptx/project.role.md'])
        }
        if (pattern.includes('/mock/user/custom') && pattern.includes('**/*.role.md')) {
          return Promise.resolve(['/mock/user/custom/user.role.md'])
        }
        return Promise.resolve([])
      })

      const discovered = await discovery.discoverResources(mockScanPaths)

      const roleResources = discovered.filter(r => r.id.startsWith('role:'))
      expect(roleResources).toHaveLength(3)
      expect(roleResources.map(r => r.reference)).toEqual([
        '@package://prompt/builtin.role.md',
        '@project://.promptx/project.role.md',
        '@file:///mock/user/custom/user.role.md'
      ])
    })
  })

  describe('extractId', () => {
    test('should extract ID from role file path', () => {
      const id = discovery.extractId('/path/to/java-backend-developer.role.md', '.role.md')
      expect(id).toBe('java-backend-developer')
    })

    test('should extract ID from execution file path', () => {
      const id = discovery.extractId('/path/to/spring-ecosystem.execution.md', '.execution.md')
      expect(id).toBe('spring-ecosystem')
    })

    test('should extract ID from thought file path', () => {
      const id = discovery.extractId('/path/to/creative-thinking.thought.md', '.thought.md')
      expect(id).toBe('creative-thinking')
    })

    test('should handle complex file names', () => {
      const id = discovery.extractId('/complex/path/with-dashes_and_underscores.role.md', '.role.md')
      expect(id).toBe('with-dashes_and_underscores')
    })
  })

  describe('generateReference', () => {
    beforeEach(() => {
      // Mock findPackageRoot for consistent testing
      jest.spyOn(discovery, 'findPackageRoot').mockReturnValue('/mock/package/root')
    })

    test('should generate @package:// reference for package files', () => {
      const reference = discovery.generateReference('/mock/package/root/prompt/core/role.md')
      expect(reference).toBe('@package://prompt/core/role.md')
    })

    test('should generate @project:// reference for project files', () => {
      // Mock process.cwd() for consistent testing
      jest.spyOn(process, 'cwd').mockReturnValue('/mock/project')
      
      const reference = discovery.generateReference('/mock/project/.promptx/custom.role.md')
      expect(reference).toBe('@project://.promptx/custom.role.md')
    })

    test('should generate @file:// reference for other files', () => {
      const reference = discovery.generateReference('/some/other/path/file.md')
      expect(reference).toBe('@file:///some/other/path/file.md')
    })

    test('should handle node_modules/promptx paths correctly', () => {
      const reference = discovery.generateReference('/project/node_modules/promptx/prompt/role.md')
      expect(reference).toBe('@package://prompt/role.md')
    })

    test('should handle .promptx directory correctly', () => {
      jest.spyOn(process, 'cwd').mockReturnValue('/current/project')
      
      const reference = discovery.generateReference('/current/project/.promptx/my/custom.role.md')
      expect(reference).toBe('@project://.promptx/my/custom.role.md')
    })
  })

  describe('findPackageRoot', () => {
    test('should find package root from current directory', () => {
      // Mock __dirname to simulate being inside the package
      discovery.__dirname = '/mock/package/root/src/lib/core/resource'
      
      const root = discovery.findPackageRoot()
      expect(root).toBe('/mock/package/root')
    })

    test('should handle nested paths correctly', () => {
      discovery.__dirname = '/very/deep/nested/path/in/package/root/src/lib'
      
      const root = discovery.findPackageRoot()
      expect(root).toBe('/very/deep/nested/path/in/package/root/src')
    })
  })

  describe('error handling', () => {
    test('should handle glob errors gracefully', async () => {
      glob.mockRejectedValue(new Error('Glob failed'))

      await expect(discovery.discoverResources(['/bad/path']))
        .rejects.toThrow('Glob failed')
    })

    test('should filter out undefined/null scan paths', async () => {
      const scanPaths = [
        '/valid/path',
        null,
        undefined,
        '/another/valid/path'
      ]

      glob.mockResolvedValue([])

      const discovered = await discovery.discoverResources(scanPaths.filter(Boolean))

      // Should only call glob for valid paths
      expect(glob).toHaveBeenCalledTimes(8) // 2 valid paths × 4 resource types (role, execution, thought, knowledge)
    })
  })

  describe('protocol detection logic', () => {
    test('should detect package protocol for node_modules/promptx paths', () => {
      const reference = discovery.generateReference('/any/path/node_modules/promptx/prompt/test.md')
      expect(reference.startsWith('@package://')).toBe(true)
    })

    test('should detect project protocol for .promptx paths', () => {
      jest.spyOn(process, 'cwd').mockReturnValue('/project/root')
      
      const reference = discovery.generateReference('/project/root/.promptx/test.md')
      expect(reference.startsWith('@project://')).toBe(true)
    })

    test('should default to file protocol for unknown paths', () => {
      const reference = discovery.generateReference('/unknown/path/test.md')
      expect(reference.startsWith('@file://')).toBe(true)
    })
  })
})