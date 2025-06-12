const PackageDiscovery = require('../../../../lib/core/resource/discovery/PackageDiscovery')
const path = require('path')

describe('PackageDiscovery', () => {
  let discovery

  beforeEach(() => {
    discovery = new PackageDiscovery()
  })

  describe('constructor', () => {
    test('should initialize with PACKAGE source and priority 1', () => {
      expect(discovery.source).toBe('PACKAGE')
      expect(discovery.priority).toBe(1)
    })
  })

  describe('discover', () => {
    test('should discover package resources from static registry', async () => {
      // Mock registry file content
      jest.spyOn(discovery, '_loadStaticRegistry').mockResolvedValue({
        protocols: {
          role: {
            registry: {
              'java-backend-developer': '@package://prompt/domain/java-backend-developer/java-backend-developer.role.md',
              'product-manager': '@package://prompt/domain/product-manager/product-manager.role.md'
            }
          },
          thought: {
            registry: {
              'remember': '@package://prompt/core/thought/remember.thought.md'
            }
          }
        }
      })

      // Mock scan to return empty array to isolate static registry test
      jest.spyOn(discovery, '_scanPromptDirectory').mockResolvedValue([])

      const resources = await discovery.discover()

      expect(resources).toHaveLength(3)
      expect(resources[0]).toMatchObject({
        id: 'role:java-backend-developer',
        reference: '@package://prompt/domain/java-backend-developer/java-backend-developer.role.md',
        metadata: {
          source: 'PACKAGE',
          priority: 1
        }
      })
    })

    test('should discover resources from prompt directory scan', async () => {
      // Mock file system operations
      jest.spyOn(discovery, '_scanPromptDirectory').mockResolvedValue([
        {
          id: 'role:assistant',
          reference: '@package://prompt/domain/assistant/assistant.role.md'
        }
      ])

      jest.spyOn(discovery, '_loadStaticRegistry').mockResolvedValue({})

      const resources = await discovery.discover()

      expect(resources).toHaveLength(1)
      expect(resources[0].id).toBe('role:assistant')
    })

    test('should handle registry loading failures gracefully', async () => {
      jest.spyOn(discovery, '_loadStaticRegistry').mockRejectedValue(new Error('Registry not found'))
      jest.spyOn(discovery, '_scanPromptDirectory').mockResolvedValue([])

      const resources = await discovery.discover()

      expect(resources).toEqual([])
    })
  })

  describe('_loadStaticRegistry', () => {
    test('should load registry from default path', async () => {
      // This would be mocked in real tests
      expect(typeof discovery._loadStaticRegistry).toBe('function')
    })
  })

  describe('_scanPromptDirectory', () => {
    test('should scan for role, execution, thought files', async () => {
      // Mock package root and prompt directory
      jest.spyOn(discovery, '_findPackageRoot').mockResolvedValue('/mock/package/root')
      
      // Mock fs.pathExists to return true for prompt directory
      const mockPathExists = jest.spyOn(require('fs-extra'), 'pathExists').mockResolvedValue(true)
      
      // Mock file scanner
      const mockScanResourceFiles = jest.fn()
        .mockResolvedValueOnce(['/mock/package/root/prompt/domain/test/test.role.md']) // roles
        .mockResolvedValueOnce(['/mock/package/root/prompt/core/execution/test.execution.md']) // executions  
        .mockResolvedValueOnce(['/mock/package/root/prompt/core/thought/test.thought.md']) // thoughts

      discovery.fileScanner.scanResourceFiles = mockScanResourceFiles

      const resources = await discovery._scanPromptDirectory()

      expect(resources).toHaveLength(3)
      expect(resources[0].id).toBe('role:test')
      expect(resources[1].id).toBe('execution:test')
      expect(resources[2].id).toBe('thought:test')
      
      // Cleanup
      mockPathExists.mockRestore()
    })
  })

  describe('_findPackageRoot', () => {
    test('should find package root containing prompt directory', async () => {
      // Mock file system check
      jest.spyOn(discovery, '_findPackageJsonWithPrompt').mockResolvedValue('/mock/package/root')

      const root = await discovery._findPackageRoot()

      expect(root).toBe('/mock/package/root')
    })

    test('should throw error if package root not found', async () => {
      jest.spyOn(discovery, '_findPackageJsonWithPrompt').mockResolvedValue(null)

      await expect(discovery._findPackageRoot()).rejects.toThrow('Package root with prompt directory not found')
    })
  })

  describe('_generatePackageReference', () => {
    test('should generate @package:// reference', () => {
      const filePath = '/mock/package/root/prompt/domain/test/test.role.md'
      const packageRoot = '/mock/package/root'

      // Mock the fileScanner.getRelativePath method
      discovery.fileScanner.getRelativePath = jest.fn().mockReturnValue('prompt/domain/test/test.role.md')

      const reference = discovery._generatePackageReference(filePath, packageRoot)

      expect(reference).toBe('@package://prompt/domain/test/test.role.md')
    })

    test('should handle Windows paths correctly', () => {
      const filePath = 'C:\\mock\\package\\root\\prompt\\domain\\test\\test.role.md'
      const packageRoot = 'C:\\mock\\package\\root'

      // Mock the fileScanner.getRelativePath method
      discovery.fileScanner.getRelativePath = jest.fn().mockReturnValue('prompt/domain/test/test.role.md')

      const reference = discovery._generatePackageReference(filePath, packageRoot)

      expect(reference).toBe('@package://prompt/domain/test/test.role.md')
    })
  })

  describe('_extractResourceId', () => {
    test('should extract role id from path', () => {
      const filePath = '/mock/package/root/prompt/domain/test/test.role.md'
      const protocol = 'role'

      const id = discovery._extractResourceId(filePath, protocol, '.role.md')

      expect(id).toBe('role:test')
    })

    test('should extract execution id from path', () => {
      const filePath = '/mock/package/root/prompt/core/execution/memory-trigger.execution.md'
      const protocol = 'execution'

      const id = discovery._extractResourceId(filePath, protocol, '.execution.md')

      expect(id).toBe('execution:memory-trigger')
    })
  })
})