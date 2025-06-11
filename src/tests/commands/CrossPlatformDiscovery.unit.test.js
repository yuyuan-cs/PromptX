const path = require('path')
const fs = require('fs-extra')
const os = require('os')

describe('跨平台角色发现兼容性测试', () => {
  let tempDir
  let projectDir

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cross-platform-test-'))
    projectDir = path.join(tempDir, 'test-project')
    
    await fs.ensureDir(path.join(projectDir, 'prompt', 'domain'))
    await fs.ensureDir(path.join(projectDir, '.promptx', 'user-roles'))
  })

  afterEach(async () => {
    if (tempDir) {
      await fs.remove(tempDir)
    }
  })

  describe('Node.js 原生 API 替代 glob', () => {
    test('应该能使用 fs.readdir 代替 glob.sync', async () => {
      // 创建测试角色文件
      const roleDir = path.join(projectDir, 'prompt', 'domain', 'test-role')
      await fs.ensureDir(roleDir)
      await fs.writeFile(
        path.join(roleDir, 'test-role.role.md'),
        '<role><personality>测试</personality></role>'
      )

      // 使用Node.js原生API实现角色发现（替代glob）
      async function discoverRolesWithNativeAPI(scanPath) {
        const discoveredRoles = {}
        
        try {
          if (await fs.pathExists(scanPath)) {
            const domains = await fs.readdir(scanPath)
            
            for (const domain of domains) {
              const domainDir = path.join(scanPath, domain)
              const stat = await fs.stat(domainDir)
              
              if (stat.isDirectory()) {
                const roleFile = path.join(domainDir, `${domain}.role.md`)
                if (await fs.pathExists(roleFile)) {
                  const content = await fs.readFile(roleFile, 'utf-8')
                  
                  discoveredRoles[domain] = {
                    file: roleFile,
                    name: `🎭 ${domain}`,
                    description: '原生API发现的角色',
                    source: 'native-api'
                  }
                }
              }
            }
          }
          
          return discoveredRoles
        } catch (error) {
          console.warn('原生API角色发现失败:', error.message)
          return {}
        }
      }

      const domainPath = path.join(projectDir, 'prompt', 'domain')
      const discoveredRoles = await discoverRolesWithNativeAPI(domainPath)
      
      expect(discoveredRoles).toHaveProperty('test-role')
      expect(discoveredRoles['test-role'].source).toBe('native-api')
    })

    test('应该能处理不同平台的路径分隔符', () => {
      const unixPath = 'prompt/domain/role/role.role.md'
      const windowsPath = 'prompt\\domain\\role\\role.role.md'
      
      // 使用path.join确保跨平台兼容性
      const normalizedPath = path.join('prompt', 'domain', 'role', 'role.role.md')
      
      // 在当前平台上验证路径处理
      if (process.platform === 'win32') {
        expect(normalizedPath).toContain('\\')
      } else {
        expect(normalizedPath).toContain('/')
      }
      
      // path.relative应该也能正常工作
      const relativePath = path.relative(projectDir, path.join(projectDir, normalizedPath))
      expect(relativePath).toBe(normalizedPath)
    })

    test('应该处理路径中的特殊字符', async () => {
      // 创建包含特殊字符的角色名（但符合文件系统要求）
      const specialRoleName = 'role-with_special.chars'
      const roleDir = path.join(projectDir, 'prompt', 'domain', specialRoleName)
      await fs.ensureDir(roleDir)
      
      const roleFile = path.join(roleDir, `${specialRoleName}.role.md`)
      await fs.writeFile(roleFile, '<role><personality>特殊角色</personality></role>')
      
      // 验证能正确处理特殊字符的文件名
      expect(await fs.pathExists(roleFile)).toBe(true)
      
      const content = await fs.readFile(roleFile, 'utf-8')
      expect(content).toContain('特殊角色')
    })
  })

  describe('文件系统权限处理', () => {
    test('应该优雅处理无权限访问的目录', async () => {
      if (process.platform === 'win32') {
        // Windows权限测试较为复杂，跳过
        expect(true).toBe(true)
        return
      }

      const restrictedDir = path.join(projectDir, 'restricted')
      await fs.ensureDir(restrictedDir)
      
      // 移除读权限
      await fs.chmod(restrictedDir, 0o000)
      
      // 角色发现应该不会因为权限问题而崩溃
      async function safeDiscoverRoles(scanPath) {
        try {
          if (await fs.pathExists(scanPath)) {
            const domains = await fs.readdir(scanPath)
            return domains
          }
          return []
        } catch (error) {
          // 应该优雅处理权限错误
          console.warn('权限不足，跳过目录:', scanPath)
          return []
        }
      }
      
      const result = await safeDiscoverRoles(restrictedDir)
      expect(Array.isArray(result)).toBe(true)
      
      // 恢复权限以便清理
      await fs.chmod(restrictedDir, 0o755)
    })
  })

  describe('错误恢复机制', () => {
    test('应该在部分文件失败时继续处理其他文件', async () => {
      // 创建多个角色，其中一个有问题
      const goodRoleDir = path.join(projectDir, 'prompt', 'domain', 'good-role')
      await fs.ensureDir(goodRoleDir)
      await fs.writeFile(
        path.join(goodRoleDir, 'good-role.role.md'),
        '<role><personality>正常角色</personality></role>'
      )
      
      const badRoleDir = path.join(projectDir, 'prompt', 'domain', 'bad-role')
      await fs.ensureDir(badRoleDir)
      await fs.writeFile(
        path.join(badRoleDir, 'bad-role.role.md'),
        '无效内容'
      )

      // 模拟容错的角色发现实现
      async function resilientDiscoverRoles(scanPath) {
        const discoveredRoles = {}
        const errors = []
        
        try {
          if (await fs.pathExists(scanPath)) {
            const domains = await fs.readdir(scanPath)
            
            for (const domain of domains) {
              try {
                const domainDir = path.join(scanPath, domain)
                const stat = await fs.stat(domainDir)
                
                if (stat.isDirectory()) {
                  const roleFile = path.join(domainDir, `${domain}.role.md`)
                  if (await fs.pathExists(roleFile)) {
                    const content = await fs.readFile(roleFile, 'utf-8')
                    
                    // 简单验证内容
                    if (content.includes('<role>')) {
                      discoveredRoles[domain] = {
                        file: roleFile,
                        name: `🎭 ${domain}`,
                        description: '容错发现的角色',
                        source: 'resilient-discovery'
                      }
                    } else {
                      throw new Error('无效的角色文件格式')
                    }
                  }
                }
              } catch (error) {
                // 记录错误但继续处理其他文件
                errors.push({ domain, error: error.message })
                console.warn(`跳过无效角色 ${domain}:`, error.message)
              }
            }
          }
        } catch (error) {
          console.warn('角色发现过程中出错:', error.message)
        }
        
        return { discoveredRoles, errors }
      }

      const domainPath = path.join(projectDir, 'prompt', 'domain')
      const result = await resilientDiscoverRoles(domainPath)
      
      // 应该发现正常角色，跳过问题角色
      expect(result.discoveredRoles).toHaveProperty('good-role')
      expect(result.discoveredRoles).not.toHaveProperty('bad-role')
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].domain).toBe('bad-role')
    })
  })
}) 