const PackageDiscovery = require('../../../../lib/core/resource/discovery/PackageDiscovery')
const fs = require('fs-extra')
const path = require('path')
const tmp = require('tmp')

describe('PackageDiscovery Environment Detection Integration', () => {
  let discovery
  let originalCwd
  let originalEnv
  let originalExecPath

  beforeEach(() => {
    discovery = new PackageDiscovery()
    originalCwd = process.cwd()
    originalEnv = process.env.NODE_ENV
    originalExecPath = process.env.npm_execpath
  })

  afterEach(() => {
    process.chdir(originalCwd)
    process.env.NODE_ENV = originalEnv
    process.env.npm_execpath = originalExecPath
  })

  describe('Environment Detection', () => {
    test('should detect development environment', async () => {
      // Mock development environment indicators
      jest.spyOn(fs, 'pathExists')
        .mockResolvedValueOnce(true) // src/bin/promptx.js exists
        .mockResolvedValueOnce(true) // package.json exists

      jest.spyOn(fs, 'readJSON').mockResolvedValue({
        name: 'dpml-prompt'
      })

      const environment = await discovery._detectExecutionEnvironment()
      expect(environment).toBe('development')
    })

    test('should detect npx execution via environment variable', async () => {
      process.env.npm_execpath = '/usr/local/bin/npx'
      
      // Mock non-development environment
      jest.spyOn(fs, 'pathExists').mockResolvedValue(false)

      const environment = await discovery._detectExecutionEnvironment()
      expect(environment).toBe('npx')
    })

    test('should detect npx execution via directory path', async () => {
      // Mock _getCurrentDirectory to simulate npx cache directory
      jest.spyOn(discovery, '_getCurrentDirectory').mockReturnValue('/home/user/.npm/_npx/abc123/node_modules/dpml-prompt')
      jest.spyOn(fs, 'pathExists').mockResolvedValue(false)

      const environment = await discovery._detectExecutionEnvironment()
      expect(environment).toBe('npx')
    })

    test('should detect local installation', async () => {
      // Mock _getCurrentDirectory to simulate node_modules installation
      jest.spyOn(discovery, '_getCurrentDirectory').mockReturnValue('/project/node_modules/dpml-prompt/src/lib/core/resource/discovery')
      jest.spyOn(fs, 'pathExists').mockResolvedValue(false)

      const environment = await discovery._detectExecutionEnvironment()
      expect(environment).toBe('local')
    })

    test('should return unknown for unrecognized environment', async () => {
      jest.spyOn(fs, 'pathExists').mockResolvedValue(false)
      
      const environment = await discovery._detectExecutionEnvironment()
      expect(environment).toBe('unknown')
    })
  })

  describe('Package Root Finding - Development Environment', () => {
    test('should find package root in development mode', async () => {
      // Setup development environment
      const tempDir = tmp.dirSync({ unsafeCleanup: true })
      const projectRoot = tempDir.name

      // Create development structure
      await fs.ensureDir(path.join(projectRoot, 'src', 'bin'))
      await fs.ensureDir(path.join(projectRoot, 'prompt'))
      await fs.writeJSON(path.join(projectRoot, 'package.json'), {
        name: 'dpml-prompt',
        version: '1.0.0'
      })
      await fs.writeFile(path.join(projectRoot, 'src', 'bin', 'promptx.js'), '// CLI entry')

      process.chdir(projectRoot)

      const packageRoot = await discovery._findDevelopmentRoot()
      // Use fs.realpathSync to handle symlinks and path resolution consistently
      expect(fs.realpathSync(packageRoot)).toBe(fs.realpathSync(projectRoot))
    })

    test('should return null if not dpml-prompt package', async () => {
      const tempDir = tmp.dirSync({ unsafeCleanup: true })
      const projectRoot = tempDir.name

      await fs.ensureDir(path.join(projectRoot, 'src', 'bin'))
      await fs.ensureDir(path.join(projectRoot, 'prompt'))
      await fs.writeJSON(path.join(projectRoot, 'package.json'), {
        name: 'other-package',
        version: '1.0.0'
      })

      process.chdir(projectRoot)

      const packageRoot = await discovery._findDevelopmentRoot()
      expect(packageRoot).toBeNull()
    })

    test('should return null if missing required directories', async () => {
      const tempDir = tmp.dirSync({ unsafeCleanup: true })
      process.chdir(tempDir.name)

      await fs.writeJSON(path.join(tempDir.name, 'package.json'), {
        name: 'dpml-prompt'
      })
      // Missing prompt directory

      const packageRoot = await discovery._findDevelopmentRoot()
      expect(packageRoot).toBeNull()
    })
  })

  describe('Package Root Finding - Installed Environment', () => {
    test('should find package root by searching upward', async () => {
      const tempDir = tmp.dirSync({ unsafeCleanup: true })
      const packagePath = path.join(tempDir.name, 'node_modules', 'dpml-prompt')
      const searchStartPath = path.join(packagePath, 'src', 'lib', 'core')

      // Create installed package structure
      await fs.ensureDir(searchStartPath)
      await fs.writeJSON(path.join(packagePath, 'package.json'), {
        name: 'dpml-prompt',
        version: '1.0.0'
      })

      // Mock _getCurrentDirectory to start search from nested directory
      jest.spyOn(discovery, '_getCurrentDirectory').mockReturnValue(searchStartPath)

      const packageRoot = await discovery._findInstalledRoot()
      expect(packageRoot).toBe(packagePath)
    })

    test('should return null if search finds wrong package', async () => {
      const tempDir = tmp.dirSync({ unsafeCleanup: true })
      const packagePath = path.join(tempDir.name, 'node_modules', 'other-package')
      const searchStartPath = path.join(packagePath, 'src', 'lib')

      await fs.ensureDir(searchStartPath)
      await fs.writeJSON(path.join(packagePath, 'package.json'), {
        name: 'other-package',
        version: '1.0.0'
      })

      jest.spyOn(discovery, '_getCurrentDirectory').mockReturnValue(searchStartPath)

      const packageRoot = await discovery._findInstalledRoot()
      expect(packageRoot).toBeNull()
    })
  })

  describe('Package Root Finding - Fallback', () => {
    test('should find package using module resolution', async () => {
      const tempDir = tmp.dirSync({ unsafeCleanup: true })
      const packagePath = path.join(tempDir.name, 'node_modules', 'dpml-prompt')

      // Create package structure
      await fs.ensureDir(packagePath)
      await fs.writeJSON(path.join(packagePath, 'package.json'), {
        name: 'dpml-prompt',
        version: '1.0.0'
      })

      // Mock resolve to find our package
      const resolve = require('resolve')
      jest.spyOn(resolve, 'sync').mockReturnValue(path.join(packagePath, 'package.json'))

      const packageRoot = await discovery._findFallbackRoot()
      expect(packageRoot).toBe(packagePath)
    })

    test('should return null if module resolution fails', async () => {
      const resolve = require('resolve')
      jest.spyOn(resolve, 'sync').mockImplementation(() => {
        throw new Error('Module not found')
      })

      const packageRoot = await discovery._findFallbackRoot()
      expect(packageRoot).toBeNull()
    })
  })

  describe('Registry Path Resolution', () => {
    test('should load registry from src/resource.registry.json in development', async () => {
      const tempDir = tmp.dirSync({ unsafeCleanup: true })
      const registryPath = path.join(tempDir.name, 'src', 'resource.registry.json')
      const testRegistry = { test: 'data' }

      await fs.ensureDir(path.dirname(registryPath))
      await fs.writeJSON(registryPath, testRegistry)

      jest.spyOn(discovery, '_findPackageRoot').mockResolvedValue(tempDir.name)

      const registry = await discovery._loadStaticRegistry()
      expect(registry).toEqual(testRegistry)
    })

    test('should fallback to alternative registry location', async () => {
      const tempDir = tmp.dirSync({ unsafeCleanup: true })
      const altRegistryPath = path.join(tempDir.name, 'resource.registry.json')
      const testRegistry = { test: 'alternative' }

      // No src/resource.registry.json, but alternative exists
      await fs.writeJSON(altRegistryPath, testRegistry)

      jest.spyOn(discovery, '_findPackageRoot').mockResolvedValue(tempDir.name)

      const registry = await discovery._loadStaticRegistry()
      expect(registry).toEqual(testRegistry)
    })

    test('should throw error if no registry found', async () => {
      const tempDir = tmp.dirSync({ unsafeCleanup: true })
      jest.spyOn(discovery, '_findPackageRoot').mockResolvedValue(tempDir.name)

      await expect(discovery._loadStaticRegistry()).rejects.toThrow('Static registry file not found')
    })
  })

  describe('Integration - Complete Package Discovery Flow', () => {
    test('should work end-to-end in development environment', async () => {
      const tempDir = tmp.dirSync({ unsafeCleanup: true })
      const projectRoot = tempDir.name

      // Setup complete development environment
      await fs.ensureDir(path.join(projectRoot, 'src', 'bin'))
      await fs.ensureDir(path.join(projectRoot, 'prompt'))
      await fs.writeJSON(path.join(projectRoot, 'package.json'), {
        name: 'dpml-prompt'
      })
      await fs.writeFile(path.join(projectRoot, 'src', 'bin', 'promptx.js'), '// CLI')
      await fs.writeJSON(path.join(projectRoot, 'src', 'resource.registry.json'), {
        protocols: {
          role: {
            registry: {
              'test-role': '@package://test.md'
            }
          }
        }
      })

      process.chdir(projectRoot)

      // Test complete discovery flow
      const resources = await discovery.discover()
      expect(resources.length).toBeGreaterThan(0)
      
      // Should find registry resources
      const roleResources = resources.filter(r => r.id.startsWith('role:'))
      expect(roleResources.length).toBeGreaterThan(0)
    })

    test('should work end-to-end in installed environment', async () => {
      const tempDir = tmp.dirSync({ unsafeCleanup: true })
      const packagePath = path.join(tempDir.name, 'node_modules', 'dpml-prompt')

      // Setup installed package structure
      await fs.ensureDir(path.join(packagePath, 'src'))
      await fs.ensureDir(path.join(packagePath, 'prompt'))
      await fs.writeJSON(path.join(packagePath, 'package.json'), {
        name: 'dpml-prompt'
      })
      await fs.writeJSON(path.join(packagePath, 'src', 'resource.registry.json'), {
        protocols: {
          role: {
            registry: {
              'installed-role': '@package://installed.md'
            }
          }
        }
      })

      // Mock environment detection to return 'local'
      jest.spyOn(discovery, '_detectExecutionEnvironment').mockResolvedValue('local')
      jest.spyOn(discovery, '_findInstalledRoot').mockResolvedValue(packagePath)

      const resources = await discovery.discover()
      expect(resources.length).toBeGreaterThan(0)
      
      const roleResources = resources.filter(r => r.id.startsWith('role:'))
      expect(roleResources.length).toBeGreaterThan(0)
    })
  })
})