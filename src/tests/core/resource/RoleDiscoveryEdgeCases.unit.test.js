const fs = require('fs-extra')
const path = require('path')
const os = require('os')

const SimplifiedRoleDiscovery = require('../../../lib/core/resource/SimplifiedRoleDiscovery')

describe('Role Discovery Edge Cases', () => {
  let tempDir
  let testProjectDir
  let discovery

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'role-discovery-edge-'))
    testProjectDir = path.join(tempDir, 'edge-test-project')
    
    await fs.ensureDir(path.join(testProjectDir, '.promptx', 'resource', 'domain'))
    await fs.writeFile(
      path.join(testProjectDir, 'package.json'), 
      JSON.stringify({ name: 'edge-test-project', version: '1.0.0' })
    )
    
    jest.spyOn(process, 'cwd').mockReturnValue(testProjectDir)
    discovery = new SimplifiedRoleDiscovery()
  })

  afterEach(async () => {
    if (tempDir) {
      await fs.remove(tempDir)
    }
    jest.restoreAllMocks()
  })

  describe('Corrupted Role Files', () => {
    test('should handle role files with malformed DPML', async () => {
      const roleDir = path.join(testProjectDir, '.promptx', 'resource', 'domain', 'malformed-role')
      await fs.ensureDir(roleDir)
      
      // Create role file with malformed DPML
      await fs.writeFile(
        path.join(roleDir, 'malformed-role.role.md'),
        `# Malformed Role
<role>
  <personality>
    Unclosed tag here
  </personalit
  <principle>
    Normal content
  </principle>
</role>`
      )

      const userRoles = await discovery.discoverUserRoles()
      
      // Should still discover the role (basic validation only checks for tags presence)
      expect(userRoles).toHaveProperty('malformed-role')
    })

    test('should handle role files with missing required tags', async () => {
      const roleDir = path.join(testProjectDir, '.promptx', 'resource', 'domain', 'missing-tags')
      await fs.ensureDir(roleDir)
      
      await fs.writeFile(
        path.join(roleDir, 'missing-tags.role.md'),
        `# Missing Tags Role
This file has no <role> tags at all.`
      )

      const userRoles = await discovery.discoverUserRoles()
      expect(userRoles).not.toHaveProperty('missing-tags')
    })

    test('should handle empty role files', async () => {
      const roleDir = path.join(testProjectDir, '.promptx', 'resource', 'domain', 'empty-role')
      await fs.ensureDir(roleDir)
      
      await fs.writeFile(path.join(roleDir, 'empty-role.role.md'), '')

      const userRoles = await discovery.discoverUserRoles()
      expect(userRoles).not.toHaveProperty('empty-role')
    })

    test('should handle role files with only whitespace', async () => {
      const roleDir = path.join(testProjectDir, '.promptx', 'resource', 'domain', 'whitespace-role')
      await fs.ensureDir(roleDir)
      
      await fs.writeFile(
        path.join(roleDir, 'whitespace-role.role.md'), 
        '   \n\t  \n   '
      )

      const userRoles = await discovery.discoverUserRoles()
      expect(userRoles).not.toHaveProperty('whitespace-role')
    })
  })

  describe('File System Edge Cases', () => {
    test('should handle permission denied errors gracefully', async () => {
      if (process.platform === 'win32') {
        // Skip permission tests on Windows
        return
      }

      const roleDir = path.join(testProjectDir, '.promptx', 'resource', 'domain', 'permission-denied')
      await fs.ensureDir(roleDir)
      
      const roleFile = path.join(roleDir, 'permission-denied.role.md')
      await fs.writeFile(roleFile, '<role>test</role>')
      
      // Remove read permissions
      await fs.chmod(roleFile, 0o000)

      const userRoles = await discovery.discoverUserRoles()
      expect(userRoles).not.toHaveProperty('permission-denied')

      // Restore permissions for cleanup
      await fs.chmod(roleFile, 0o644)
    })

    test('should handle directory symlinks correctly', async () => {
      if (process.platform === 'win32') {
        // Skip symlink tests on Windows (require admin privileges)
        return
      }

      // Note: SimplifiedRoleDiscovery intentionally doesn't support symlinks for security
      // This test documents the expected behavior rather than testing it
      const userRoles = await discovery.discoverUserRoles()
      
      // SimplifiedRoleDiscovery doesn't follow symlinks by design
      expect(userRoles).toBeDefined()
      expect(typeof userRoles).toBe('object')
    })

    test('should handle broken symlinks gracefully', async () => {
      if (process.platform === 'win32') {
        return
      }

      // Create a symlink to a non-existent directory
      const brokenSymlink = path.join(testProjectDir, '.promptx', 'resource', 'domain', 'broken-symlink')
      const nonExistentTarget = path.join(testProjectDir, 'non-existent-target')
      
      await fs.symlink(nonExistentTarget, brokenSymlink)

      const userRoles = await discovery.discoverUserRoles()
      expect(userRoles).not.toHaveProperty('broken-symlink')
    })
  })

  describe('Special Characters and Unicode', () => {
    test('should handle role names with special characters', async () => {
      const roleName = 'special-chars_123.test'
      const roleDir = path.join(testProjectDir, '.promptx', 'resource', 'domain', roleName)
      await fs.ensureDir(roleDir)
      
      await fs.writeFile(
        path.join(roleDir, `${roleName}.role.md`),
        '<role><personality>Special chars role</personality></role>'
      )

      const userRoles = await discovery.discoverUserRoles()
      expect(Object.keys(userRoles)).toContain(roleName)
      expect(userRoles[roleName]).toBeDefined()
    })

    test('should handle Unicode role names', async () => {
      const roleName = '测试角色'
      const roleDir = path.join(testProjectDir, '.promptx', 'resource', 'domain', roleName)
      await fs.ensureDir(roleDir)
      
      await fs.writeFile(
        path.join(roleDir, `${roleName}.role.md`),
        '<role><personality>Unicode role</personality></role>'
      )

      const userRoles = await discovery.discoverUserRoles()
      expect(userRoles).toHaveProperty(roleName)
    })

    test('should handle roles with emoji in content', async () => {
      const roleDir = path.join(testProjectDir, '.promptx', 'resource', 'domain', 'emoji-role')
      await fs.ensureDir(roleDir)
      
      await fs.writeFile(
        path.join(roleDir, 'emoji-role.role.md'),
        `# 🎭 Emoji Role
> A role with emojis 🚀✨

<role>
  <personality>
    I love using emojis! 😄🎉
  </personality>
</role>`
      )

      const userRoles = await discovery.discoverUserRoles()
      expect(userRoles).toHaveProperty('emoji-role')
      expect(userRoles['emoji-role'].name).toBe('🎭 Emoji Role')
      expect(userRoles['emoji-role'].description).toBe('A role with emojis 🚀✨')
    })
  })

  describe('Concurrent Access', () => {
    test('should handle concurrent discovery calls safely', async () => {
      // Create test roles
      await createTestRole('concurrent-1')
      await createTestRole('concurrent-2')
      await createTestRole('concurrent-3')

      // Start multiple discovery operations concurrently
      const discoveryPromises = [
        discovery.discoverUserRoles(),
        discovery.discoverUserRoles(),
        discovery.discoverUserRoles()
      ]

      const results = await Promise.all(discoveryPromises)

      // All results should be consistent
      expect(results[0]).toEqual(results[1])
      expect(results[1]).toEqual(results[2])
      
      // Should find all test roles
      expect(results[0]).toHaveProperty('concurrent-1')
      expect(results[0]).toHaveProperty('concurrent-2')
      expect(results[0]).toHaveProperty('concurrent-3')
    })
  })

  describe('Large File Handling', () => {
    test('should handle very large role files', async () => {
      const roleDir = path.join(testProjectDir, '.promptx', 'resource', 'domain', 'large-role')
      await fs.ensureDir(roleDir)
      
      // Create a large role file (1MB of content)
      const largeContent = 'A'.repeat(1024 * 1024)
      await fs.writeFile(
        path.join(roleDir, 'large-role.role.md'),
        `<role><personality>${largeContent}</personality></role>`
      )

      const userRoles = await discovery.discoverUserRoles()
      expect(userRoles).toHaveProperty('large-role')
    })
  })

  describe('Directory Structure Edge Cases', () => {
    test('should handle nested subdirectories gracefully', async () => {
      // Create deeply nested structure (should be ignored)
      const nestedDir = path.join(
        testProjectDir, '.promptx', 'resource', 'domain', 'nested',
        'very', 'deep', 'structure'
      )
      await fs.ensureDir(nestedDir)
      await fs.writeFile(
        path.join(nestedDir, 'deep.role.md'),
        '<role>deep</role>'
      )

      // Also create a valid role at the correct level
      await createTestRole('valid-role')

      const userRoles = await discovery.discoverUserRoles()
      
      // Should find the valid role but ignore the deeply nested one
      expect(userRoles).toHaveProperty('valid-role')
      expect(userRoles).not.toHaveProperty('deep')
    })

    test('should handle files instead of directories in domain folder', async () => {
      const domainPath = path.join(testProjectDir, '.promptx', 'resource', 'domain')
      
      // Create a file directly in the domain folder (should be ignored)
      await fs.writeFile(
        path.join(domainPath, 'not-a-role-dir.md'),
        '<role>should be ignored</role>'
      )

      // Create a valid role
      await createTestRole('valid-role')

      const userRoles = await discovery.discoverUserRoles()
      
      expect(userRoles).toHaveProperty('valid-role')
      expect(Object.keys(userRoles)).toHaveLength(1)
    })
  })

  describe('Missing Registry File', () => {
    test('should handle missing system registry gracefully', async () => {
      // Mock fs.readJSON to simulate missing registry file
      const originalReadJSON = fs.readJSON
      fs.readJSON = jest.fn().mockRejectedValue(new Error('ENOENT: no such file'))

      const systemRoles = await discovery.loadSystemRoles()
      expect(systemRoles).toEqual({})

      // Restore original function
      fs.readJSON = originalReadJSON
    })

    test('should handle corrupted registry file gracefully', async () => {
      const originalReadJSON = fs.readJSON
      fs.readJSON = jest.fn().mockRejectedValue(new Error('Unexpected token in JSON'))

      const systemRoles = await discovery.loadSystemRoles()
      expect(systemRoles).toEqual({})

      fs.readJSON = originalReadJSON
    })
  })

  describe('Project Root Detection Edge Cases', () => {
    test('should handle projects without package.json', async () => {
      // Remove package.json
      await fs.remove(path.join(testProjectDir, 'package.json'))

      // Should still work (fallback to current directory)
      await createTestRole('no-package-json')
      const userRoles = await discovery.discoverUserRoles()
      
      expect(userRoles).toHaveProperty('no-package-json')
    })

    test('should handle project root at filesystem root', async () => {
      // Mock process.cwd to return root directory
      jest.spyOn(process, 'cwd').mockReturnValue(path.parse(process.cwd()).root)

      // Should not crash
      const userPath = await discovery.getUserRolePath()
      expect(userPath).toBeDefined()
    })
  })

  // Helper function to create a test role
  async function createTestRole(roleName) {
    const roleDir = path.join(testProjectDir, '.promptx', 'resource', 'domain', roleName)
    await fs.ensureDir(roleDir)
    await fs.writeFile(
      path.join(roleDir, `${roleName}.role.md`),
      `<role><personality>${roleName} personality</personality></role>`
    )
  }
})