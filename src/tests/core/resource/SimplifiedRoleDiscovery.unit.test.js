const fs = require('fs-extra')
const path = require('path')
const os = require('os')

// This will be the implementation we're building towards
const SimplifiedRoleDiscovery = require('../../../lib/core/resource/SimplifiedRoleDiscovery')

describe('SimplifiedRoleDiscovery - TDD Implementation', () => {
  let tempDir
  let testProjectDir
  let discovery

  beforeEach(async () => {
    // Create temporary test environment
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'simplified-role-discovery-'))
    testProjectDir = path.join(tempDir, 'test-project')
    
    // Create test project structure
    await fs.ensureDir(path.join(testProjectDir, '.promptx', 'resource', 'domain'))
    await fs.writeFile(
      path.join(testProjectDir, 'package.json'), 
      JSON.stringify({ name: 'test-project', version: '1.0.0' })
    )
    
    // Mock process.cwd to point to our test project
    jest.spyOn(process, 'cwd').mockReturnValue(testProjectDir)
    
    discovery = new SimplifiedRoleDiscovery()
  })

  afterEach(async () => {
    if (tempDir) {
      await fs.remove(tempDir)
    }
    jest.restoreAllMocks()
  })

  describe('Core Algorithm API', () => {
    test('should expose discoverAllRoles method', () => {
      expect(typeof discovery.discoverAllRoles).toBe('function')
    })

    test('should expose loadSystemRoles method', () => {
      expect(typeof discovery.loadSystemRoles).toBe('function')
    })

    test('should expose discoverUserRoles method', () => {
      expect(typeof discovery.discoverUserRoles).toBe('function')
    })

    test('should expose mergeRoles method', () => {
      expect(typeof discovery.mergeRoles).toBe('function')
    })
  })

  describe('System Roles Loading', () => {
    test('should load system roles from static registry', async () => {
      const systemRoles = await discovery.loadSystemRoles()
      
      expect(systemRoles).toBeDefined()
      expect(typeof systemRoles).toBe('object')
      
      // Should contain known system roles
      expect(systemRoles).toHaveProperty('assistant')
      expect(systemRoles.assistant).toHaveProperty('name')
      expect(systemRoles.assistant).toHaveProperty('file')
      expect(systemRoles.assistant.name).toContain('智能助手')
    })

    test('should handle missing registry file gracefully', async () => {
      // Mock missing registry file
      const originalReadJSON = fs.readJSON
      fs.readJSON = jest.fn().mockRejectedValue(new Error('File not found'))
      
      const systemRoles = await discovery.loadSystemRoles()
      expect(systemRoles).toEqual({})
      
      fs.readJSON = originalReadJSON
    })
  })

  describe('User Roles Discovery', () => {
    test('should return empty object when user directory does not exist', async () => {
      const userRoles = await discovery.discoverUserRoles()
      expect(userRoles).toEqual({})
    })

    test('should discover valid user role', async () => {
      // Create test user role
      const roleDir = path.join(testProjectDir, '.promptx', 'resource', 'domain', 'test-role')
      await fs.ensureDir(roleDir)
      await fs.writeFile(
        path.join(roleDir, 'test-role.role.md'),
        `# Test Role
> A test role for unit testing

<role>
  <personality>
    Test personality
  </personality>
  <principle>
    Test principle
  </principle>
  <knowledge>
    Test knowledge
  </knowledge>
</role>`
      )

      const userRoles = await discovery.discoverUserRoles()
      
      expect(userRoles).toHaveProperty('test-role')
      expect(userRoles['test-role']).toHaveProperty('name', 'Test Role')
      expect(userRoles['test-role']).toHaveProperty('description', 'A test role for unit testing')
      expect(userRoles['test-role']).toHaveProperty('source', 'user-generated')
      expect(userRoles['test-role']).toHaveProperty('file')
    })

    test('should skip invalid role files', async () => {
      // Create invalid role file (missing <role> tags)
      const roleDir = path.join(testProjectDir, '.promptx', 'resource', 'domain', 'invalid-role')
      await fs.ensureDir(roleDir)
      await fs.writeFile(
        path.join(roleDir, 'invalid-role.role.md'),
        'This is not a valid role file'
      )

      const userRoles = await discovery.discoverUserRoles()
      expect(userRoles).not.toHaveProperty('invalid-role')
    })

    test('should handle missing role file gracefully', async () => {
      // Create directory but no role file
      const roleDir = path.join(testProjectDir, '.promptx', 'resource', 'domain', 'empty-role')
      await fs.ensureDir(roleDir)

      const userRoles = await discovery.discoverUserRoles()
      expect(userRoles).not.toHaveProperty('empty-role')
    })

    test('should handle file system errors gracefully', async () => {
      // Create a role directory with permission issues (Unix only)
      if (process.platform !== 'win32') {
        const roleDir = path.join(testProjectDir, '.promptx', 'resource', 'domain', 'restricted-role')
        await fs.ensureDir(roleDir)
        const roleFile = path.join(roleDir, 'restricted-role.role.md')
        await fs.writeFile(roleFile, '<role>test</role>')
        await fs.chmod(roleFile, 0o000) // Remove all permissions

        const userRoles = await discovery.discoverUserRoles()
        expect(userRoles).not.toHaveProperty('restricted-role')

        // Restore permissions for cleanup
        await fs.chmod(roleFile, 0o644)
      } else {
        // On Windows, just test that the method doesn't throw
        const userRoles = await discovery.discoverUserRoles()
        expect(userRoles).toBeDefined()
      }
    })
  })

  describe('Parallel Discovery Performance', () => {
    test('should process multiple user roles in parallel', async () => {
      const roleCount = 10
      const createRolePromises = []

      // Create multiple test roles
      for (let i = 0; i < roleCount; i++) {
        const roleName = `test-role-${i}`
        const roleDir = path.join(testProjectDir, '.promptx', 'resource', 'domain', roleName)
        
        createRolePromises.push(
          fs.ensureDir(roleDir).then(() =>
            fs.writeFile(
              path.join(roleDir, `${roleName}.role.md`),
              `<role><personality>Role ${i}</personality></role>`
            )
          )
        )
      }

      await Promise.all(createRolePromises)

      const startTime = Date.now()
      const userRoles = await discovery.discoverUserRoles()
      const endTime = Date.now()

      expect(Object.keys(userRoles)).toHaveLength(roleCount)
      expect(endTime - startTime).toBeLessThan(100) // Should be fast with parallel processing
    })
  })

  describe('Role Merging', () => {
    test('should merge system and user roles correctly', () => {
      const systemRoles = {
        'assistant': { name: 'System Assistant', source: 'system' },
        'system-only': { name: 'System Only', source: 'system' }
      }

      const userRoles = {
        'assistant': { name: 'User Assistant', source: 'user' },
        'user-only': { name: 'User Only', source: 'user' }
      }

      const merged = discovery.mergeRoles(systemRoles, userRoles)

      expect(merged).toHaveProperty('assistant')
      expect(merged).toHaveProperty('system-only')
      expect(merged).toHaveProperty('user-only')

      // User role should override system role
      expect(merged.assistant.source).toBe('user')
      expect(merged.assistant.name).toBe('User Assistant')

      // System-only role should remain
      expect(merged['system-only'].source).toBe('system')

      // User-only role should be included
      expect(merged['user-only'].source).toBe('user')
    })

    test('should handle empty input gracefully', () => {
      expect(discovery.mergeRoles({}, {})).toEqual({})
      expect(discovery.mergeRoles({ test: 'value' }, {})).toEqual({ test: 'value' })
      expect(discovery.mergeRoles({}, { test: 'value' })).toEqual({ test: 'value' })
    })
  })

  describe('Complete Discovery Flow', () => {
    test('should discover all roles (system + user)', async () => {
      // Create a test user role
      const roleDir = path.join(testProjectDir, '.promptx', 'resource', 'domain', 'custom-role')
      await fs.ensureDir(roleDir)
      await fs.writeFile(
        path.join(roleDir, 'custom-role.role.md'),
        '<role><personality>Custom role</personality></role>'
      )

      const allRoles = await discovery.discoverAllRoles()

      expect(allRoles).toBeDefined()
      expect(typeof allRoles).toBe('object')

      // Should contain system roles
      expect(allRoles).toHaveProperty('assistant')

      // Should contain user role
      expect(allRoles).toHaveProperty('custom-role')
      expect(allRoles['custom-role'].source).toBe('user-generated')
    })
  })

  describe('DPML Validation', () => {
    test('should validate basic DPML format', () => {
      const validContent = '<role><personality>test</personality></role>'
      const invalidContent = 'no role tags here'

      expect(discovery.isValidRoleFile(validContent)).toBe(true)
      expect(discovery.isValidRoleFile(invalidContent)).toBe(false)
    })

    test('should extract role name from markdown header', () => {
      const content = `# My Custom Role
<role>content</role>`

      expect(discovery.extractRoleName(content)).toBe('My Custom Role')
    })

    test('should extract description from markdown quote', () => {
      const content = `# Role Name
> This is the role description
<role>content</role>`

      expect(discovery.extractDescription(content)).toBe('This is the role description')
    })

    test('should handle missing metadata gracefully', () => {
      const content = '<role>content</role>'

      expect(discovery.extractRoleName(content)).toBeNull()
      expect(discovery.extractDescription(content)).toBeNull()
    })
  })

  describe('Cross-platform Path Handling', () => {
    test('should handle Windows paths correctly', () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', { value: 'win32' })

      // Test that path operations work correctly on Windows
      const userPath = discovery.getUserRolePath()
      expect(userPath).toBeDefined()

      Object.defineProperty(process, 'platform', { value: originalPlatform })
    })

    test('should handle Unix paths correctly', () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', { value: 'linux' })

      // Test that path operations work correctly on Unix
      const userPath = discovery.getUserRolePath()
      expect(userPath).toBeDefined()

      Object.defineProperty(process, 'platform', { value: originalPlatform })
    })
  })
})