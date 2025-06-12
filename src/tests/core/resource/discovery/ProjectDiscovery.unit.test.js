const ProjectDiscovery = require('../../../../lib/core/resource/discovery/ProjectDiscovery')
const path = require('path')

describe('ProjectDiscovery', () => {
  let discovery

  beforeEach(() => {
    discovery = new ProjectDiscovery()
  })

  describe('constructor', () => {
    test('should initialize with PROJECT source and priority 2', () => {
      expect(discovery.source).toBe('PROJECT')
      expect(discovery.priority).toBe(2)
    })
  })

  describe('discover', () => {
    test('should discover project resources from .promptx directory', async () => {
      // Mock project root and .promptx directory
      jest.spyOn(discovery, '_findProjectRoot').mockResolvedValue('/mock/project/root')
      jest.spyOn(discovery, '_checkPrompxDirectory').mockResolvedValue(true)
      
      jest.spyOn(discovery, '_scanProjectResources').mockResolvedValue([
        {
          id: 'role:custom-role',
          reference: '@project://.promptx/resource/domain/custom-role/custom-role.role.md'
        },
        {
          id: 'execution:custom-execution',
          reference: '@project://.promptx/resource/execution/custom-execution.execution.md'
        }
      ])

      const resources = await discovery.discover()

      expect(resources).toHaveLength(2)
      expect(resources[0]).toMatchObject({
        id: 'role:custom-role',
        reference: '@project://.promptx/resource/domain/custom-role/custom-role.role.md',
        metadata: {
          source: 'PROJECT',
          priority: 2
        }
      })
    })

    test('should return empty array if .promptx directory does not exist', async () => {
      jest.spyOn(discovery, '_findProjectRoot').mockResolvedValue('/mock/project/root')
      jest.spyOn(discovery, '_checkPrompxDirectory').mockResolvedValue(false)

      const resources = await discovery.discover()

      expect(resources).toEqual([])
    })

    test('should handle project root not found', async () => {
      jest.spyOn(discovery, '_findProjectRoot').mockRejectedValue(new Error('Project root not found'))

      const resources = await discovery.discover()

      expect(resources).toEqual([])
    })
  })

  describe('_findProjectRoot', () => {
    test('should find project root containing package.json', async () => {
      const mockFsExists = jest.fn()
        .mockResolvedValueOnce(false) // /current/dir/package.json
        .mockResolvedValueOnce(true)  // /current/package.json

      discovery._fsExists = mockFsExists

      // Mock process.cwd()
      const originalCwd = process.cwd
      process.cwd = jest.fn().mockReturnValue('/current/dir')

      const root = await discovery._findProjectRoot()

      expect(root).toBe('/current')
      
      // Restore
      process.cwd = originalCwd
    })

    test('should return current directory if no package.json found', async () => {
      const mockFsExists = jest.fn().mockResolvedValue(false)
      discovery._fsExists = mockFsExists

      const originalCwd = process.cwd
      process.cwd = jest.fn().mockReturnValue('/current/dir')

      const root = await discovery._findProjectRoot()

      expect(root).toBe('/current/dir')
      
      process.cwd = originalCwd
    })
  })

  describe('_checkPrompxDirectory', () => {
    test('should check if .promptx/resource directory exists', async () => {
      const mockFsExists = jest.fn().mockResolvedValue(true)
      discovery._fsExists = mockFsExists

      const exists = await discovery._checkPrompxDirectory('/mock/project/root')

      expect(exists).toBe(true)
      expect(mockFsExists).toHaveBeenCalledWith('/mock/project/root/.promptx/resource')
    })
  })

  describe('_scanProjectResources', () => {
    test('should scan for role, execution, thought files in .promptx', async () => {
      const projectRoot = '/mock/project/root'
      
      // Mock file scanner
      const mockScanResourceFiles = jest.fn()
        .mockResolvedValueOnce([`${projectRoot}/.promptx/resource/domain/test/test.role.md`]) // roles
        .mockResolvedValueOnce([`${projectRoot}/.promptx/resource/execution/test.execution.md`]) // executions
        .mockResolvedValueOnce([`${projectRoot}/.promptx/resource/thought/test.thought.md`]) // thoughts

      discovery.fileScanner.scanResourceFiles = mockScanResourceFiles
      
      // Mock file validation
      discovery._validateResourceFile = jest.fn().mockResolvedValue(true)

      const resources = await discovery._scanProjectResources(projectRoot)

      expect(resources).toHaveLength(3)
      expect(resources[0].id).toBe('role:test')
      expect(resources[1].id).toBe('execution:test')
      expect(resources[2].id).toBe('thought:test')
    })

    test('should handle scan errors gracefully', async () => {
      const projectRoot = '/mock/project/root'
      
      const mockScanResourceFiles = jest.fn().mockRejectedValue(new Error('Scan failed'))
      discovery.fileScanner.scanResourceFiles = mockScanResourceFiles

      const resources = await discovery._scanProjectResources(projectRoot)

      expect(resources).toEqual([])
    })
  })

  describe('_generateProjectReference', () => {
    test('should generate @project:// reference', () => {
      const filePath = '/mock/project/root/.promptx/resource/domain/test/test.role.md'
      const projectRoot = '/mock/project/root'

      // Mock the fileScanner.getRelativePath method
      discovery.fileScanner.getRelativePath = jest.fn().mockReturnValue('.promptx/resource/domain/test/test.role.md')

      const reference = discovery._generateProjectReference(filePath, projectRoot)

      expect(reference).toBe('@project://.promptx/resource/domain/test/test.role.md')
    })

    test('should handle Windows paths correctly', () => {
      const filePath = 'C:\\mock\\project\\root\\.promptx\\resource\\domain\\test\\test.role.md'
      const projectRoot = 'C:\\mock\\project\\root'

      // Mock the fileScanner.getRelativePath method
      discovery.fileScanner.getRelativePath = jest.fn().mockReturnValue('.promptx/resource/domain/test/test.role.md')

      const reference = discovery._generateProjectReference(filePath, projectRoot)

      expect(reference).toBe('@project://.promptx/resource/domain/test/test.role.md')
    })
  })

  describe('_extractResourceId', () => {
    test('should extract resource id with protocol prefix', () => {
      const filePath = '/mock/project/root/.promptx/resource/domain/test/test.role.md'
      const protocol = 'role'

      const id = discovery._extractResourceId(filePath, protocol, '.role.md')

      expect(id).toBe('role:test')
    })
  })

  describe('_validateResourceFile', () => {
    test('should validate role file contains required DPML tags', async () => {
      const filePath = '/mock/test.role.md'
      const mockContent = `
# Test Role

<role>
Test role content
</role>
      `

      const mockReadFile = jest.fn().mockResolvedValue(mockContent)
      discovery._readFile = mockReadFile

      const isValid = await discovery._validateResourceFile(filePath, 'role')

      expect(isValid).toBe(true)
    })

    test('should return false for invalid role file', async () => {
      const filePath = '/mock/test.role.md'
      const mockContent = 'Invalid content without DPML tags'

      const mockReadFile = jest.fn().mockResolvedValue(mockContent)
      discovery._readFile = mockReadFile

      const isValid = await discovery._validateResourceFile(filePath, 'role')

      expect(isValid).toBe(false)
    })

    test('should handle file read errors', async () => {
      const filePath = '/mock/test.role.md'

      const mockReadFile = jest.fn().mockRejectedValue(new Error('File not found'))
      discovery._readFile = mockReadFile

      const isValid = await discovery._validateResourceFile(filePath, 'role')

      expect(isValid).toBe(false)
    })
  })
})