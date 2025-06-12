const path = require('path')
const fs = require('fs')
const ProtocolResolver = require('../../../lib/core/resource/ProtocolResolver')

describe('ProtocolResolver', () => {
  let resolver

  beforeEach(() => {
    resolver = new ProtocolResolver()
  })

  describe('parseReference', () => {
    test('should parse valid @package:// reference', () => {
      const result = resolver.parseReference('@package://prompt/core/role.md')
      
      expect(result.protocol).toBe('package')
      expect(result.resourcePath).toBe('prompt/core/role.md')
      expect(result.loadingSemantic).toBe('')
      expect(result.fullReference).toBe('@package://prompt/core/role.md')
    })

    test('should parse valid @project:// reference', () => {
      const result = resolver.parseReference('@project://.promptx/custom.role.md')
      
      expect(result.protocol).toBe('project')
      expect(result.resourcePath).toBe('.promptx/custom.role.md')
      expect(result.loadingSemantic).toBe('')
    })

    test('should parse valid @file:// reference', () => {
      const result = resolver.parseReference('@file:///absolute/path/to/file.md')
      
      expect(result.protocol).toBe('file')
      expect(result.resourcePath).toBe('/absolute/path/to/file.md')
      expect(result.loadingSemantic).toBe('')
    })

    test('should parse @! hot loading semantic', () => {
      const result = resolver.parseReference('@!package://prompt/core/role.md')
      
      expect(result.protocol).toBe('package')
      expect(result.resourcePath).toBe('prompt/core/role.md')
      expect(result.loadingSemantic).toBe('!')
      expect(result.fullReference).toBe('@!package://prompt/core/role.md')
    })

    test('should parse @? lazy loading semantic', () => {
      const result = resolver.parseReference('@?file://large-dataset.csv')
      
      expect(result.protocol).toBe('file')
      expect(result.resourcePath).toBe('large-dataset.csv')
      expect(result.loadingSemantic).toBe('?')
      expect(result.fullReference).toBe('@?file://large-dataset.csv')
    })

    test('should throw error for invalid reference format', () => {
      expect(() => {
        resolver.parseReference('invalid-reference')
      }).toThrow('Invalid reference format: invalid-reference')
    })

    test('should throw error for missing protocol', () => {
      expect(() => {
        resolver.parseReference('://no-protocol')
      }).toThrow('Invalid reference format: ://no-protocol')
    })

    test('should throw error for invalid loading semantic', () => {
      expect(() => {
        resolver.parseReference('@#package://invalid-semantic')
      }).toThrow('Invalid reference format: @#package://invalid-semantic')
    })
  })

  describe('resolve', () => {
    test('should resolve @package:// reference to absolute path', async () => {
      // Mock the package root finding
      jest.spyOn(resolver, 'findPackageRoot').mockResolvedValue('/mock/package/root')
      
      const result = await resolver.resolve('@package://prompt/core/role.md')
      
      expect(result).toBe(path.resolve('/mock/package/root', 'prompt/core/role.md'))
    })

    test('should resolve @project:// reference to project relative path', async () => {
      const result = await resolver.resolve('@project://.promptx/custom.role.md')
      
      expect(result).toBe(path.resolve(process.cwd(), '.promptx/custom.role.md'))
    })

    test('should resolve @file:// reference with absolute path', async () => {
      const result = await resolver.resolve('@file:///absolute/path/to/file.md')
      
      expect(result).toBe('/absolute/path/to/file.md')
    })

    test('should resolve @file:// reference with relative path', async () => {
      const result = await resolver.resolve('@file://relative/path/to/file.md')
      
      expect(result).toBe(path.resolve(process.cwd(), 'relative/path/to/file.md'))
    })

    test('should throw error for unsupported protocol', async () => {
      await expect(resolver.resolve('@unsupported://some/path')).rejects.toThrow('Unsupported protocol: unsupported')
    })
  })

  describe('findPackageRoot', () => {
    test('should find package root with promptx package.json', async () => {
      // Mock file system operations
      const originalExistsSync = fs.existsSync
      const originalReadFileSync = fs.readFileSync
      
      fs.existsSync = jest.fn()
      fs.readFileSync = jest.fn()

      // Mock directory structure
      const mockDirname = '/some/deep/nested/path'
      resolver.__dirname = mockDirname

      // Mock package.json exists in parent directory
      fs.existsSync
        .mockReturnValueOnce(false) // /some/deep/nested/path/package.json
        .mockReturnValueOnce(false) // /some/deep/nested/package.json
        .mockReturnValueOnce(false) // /some/deep/package.json
        .mockReturnValueOnce(true)  // /some/package.json

      fs.readFileSync.mockReturnValue(JSON.stringify({ name: 'promptx' }))
      
      // Mock path operations
      jest.spyOn(path, 'dirname')
        .mockReturnValueOnce('/some/deep/nested')
        .mockReturnValueOnce('/some/deep')
        .mockReturnValueOnce('/some')

      const result = await resolver.findPackageRoot()
      
      expect(result).toBe('/some')
      
      // Restore
      fs.existsSync = originalExistsSync
      fs.readFileSync = originalReadFileSync
    })

    test('should throw error when package root not found', async () => {
      // Mock file system operations
      const originalExistsSync = fs.existsSync
      fs.existsSync = jest.fn().mockReturnValue(false)

      // Mock reaching root directory
      jest.spyOn(path, 'parse').mockReturnValue({ root: '/' })
      
      await expect(resolver.findPackageRoot()).rejects.toThrow('PromptX package root not found')
      
      // Restore
      fs.existsSync = originalExistsSync
    })
  })

  describe('caching behavior', () => {
    test('should cache package root after first lookup', async () => {
      const mockRoot = '/mock/package/root'
      jest.spyOn(resolver, 'findPackageRoot').mockResolvedValue(mockRoot)

      // First call
      await resolver.resolve('@package://prompt/core/role.md')
      expect(resolver.findPackageRoot).toHaveBeenCalledTimes(1)

      // Second call should use cached value
      await resolver.resolve('@package://prompt/domain/java.role.md')
      expect(resolver.findPackageRoot).toHaveBeenCalledTimes(1) // Still only called once
    })
  })

  describe('cross-platform compatibility', () => {
    test('should handle Windows-style paths correctly', async () => {
      jest.spyOn(resolver, 'findPackageRoot').mockResolvedValue('C:\\mock\\package\\root')
      
      const result = await resolver.resolve('@package://prompt\\core\\role.md')
      
      expect(result).toBe(path.resolve('C:\\mock\\package\\root', 'prompt\\core\\role.md'))
    })

    test('should handle Unix-style paths correctly', async () => {
      jest.spyOn(resolver, 'findPackageRoot').mockResolvedValue('/mock/package/root')
      
      const result = await resolver.resolve('@package://prompt/core/role.md')
      
      expect(result).toBe(path.resolve('/mock/package/root', 'prompt/core/role.md'))
    })
  })
})