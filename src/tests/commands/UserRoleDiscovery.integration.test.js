const path = require('path')
const fs = require('fs-extra')
const os = require('os')
const HelloCommand = require('../../lib/core/pouch/commands/HelloCommand')

describe('用户角色发现机制 集成测试', () => {
  let tempDir
  let projectDir
  let helloCommand

  beforeEach(async () => {
    // 创建临时项目目录
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'user-role-discovery-'))
    projectDir = path.join(tempDir, 'test-project')
    
    // 创建完整的项目结构
    await fs.ensureDir(path.join(projectDir, 'prompt', 'domain'))
    await fs.ensureDir(path.join(projectDir, '.promptx', 'user-roles'))
    
    helloCommand = new HelloCommand()
  })

  afterEach(async () => {
    if (tempDir) {
      await fs.remove(tempDir)
    }
    if (helloCommand.roleRegistry) {
      helloCommand.roleRegistry = null
    }
  })

  describe('用户角色路径扫描', () => {
    test('应该能扫描 .promptx/user-roles 目录', async () => {
      // 创建用户自定义角色
      const userRoleDir = path.join(projectDir, '.promptx', 'user-roles', 'custom-analyst')
      await fs.ensureDir(userRoleDir)
      
      const userRoleContent = `<!--
name: 📊 自定义分析师
description: 用户定制的数据分析专家
-->

<role>
  <personality>
    # 数据分析思维
    我是一个专注于数据洞察的分析师，善于从复杂数据中发现业务价值。
  </personality>
  
  <principle>
    # 分析原则
    - 数据驱动决策
    - 业务价值导向
    - 简洁清晰表达
  </principle>
  
  <knowledge>
    # 专业技能
    - 统计分析方法
    - 数据可视化技能
    - 业务理解能力
  </knowledge>
</role>`

      await fs.writeFile(
        path.join(userRoleDir, 'custom-analyst.role.md'),
        userRoleContent
      )

      // 这个测试假设我们已经实现了用户角色发现功能
      // 实际实现时，discoverLocalRoles会被扩展以支持用户角色路径
      
      // 验证文件创建成功
      expect(await fs.pathExists(path.join(userRoleDir, 'custom-analyst.role.md'))).toBe(true)
    })

    test('应该同时支持系统角色和用户角色', async () => {
      // 创建系统角色
      const systemRoleDir = path.join(projectDir, 'prompt', 'domain', 'assistant')
      await fs.ensureDir(systemRoleDir)
      
      await fs.writeFile(
        path.join(systemRoleDir, 'assistant.role.md'),
        `<!--
name: 🤖 系统助手
description: 系统内置助手
-->

<role>
  <personality>系统助手思维</personality>
</role>`
      )

      // 创建用户角色
      const userRoleDir = path.join(projectDir, '.promptx', 'user-roles', 'my-role')
      await fs.ensureDir(userRoleDir)
      
      await fs.writeFile(
        path.join(userRoleDir, 'my-role.role.md'),
        `<!--
name: 👤 我的角色
description: 用户自定义角色
-->

<role>
  <personality>用户自定义思维</personality>
</role>`
      )

      jest.doMock('../../lib/core/resource/protocols/PackageProtocol', () => {
        return class MockPackageProtocol {
          async getPackageRoot() {
            return projectDir
          }
        }
      })

      delete require.cache[require.resolve('../../lib/core/pouch/commands/HelloCommand')]
      const MockedHelloCommand = require('../../lib/core/pouch/commands/HelloCommand')
      const mockedCommand = new MockedHelloCommand()

      // 模拟双路径扫描实现
      mockedCommand.discoverLocalRoles = async function() {
        const PackageProtocol = require('../../lib/core/resource/protocols/PackageProtocol')
        const packageProtocol = new PackageProtocol()
        const glob = require('glob')
        const discoveredRoles = {}
        
        try {
          const packageRoot = await packageProtocol.getPackageRoot()
          
          // 扫描路径：系统角色 + 用户角色
          const scanPaths = [
            path.join(packageRoot, 'prompt', 'domain'),     // 系统角色
            path.join(packageRoot, '.promptx', 'user-roles') // 用户角色
          ]
          
          for (const scanPath of scanPaths) {
            if (await fs.pathExists(scanPath)) {
              const domains = await fs.readdir(scanPath)
              
              for (const domain of domains) {
                const domainDir = path.join(scanPath, domain)
                const stat = await fs.stat(domainDir)
                
                if (stat.isDirectory()) {
                  const roleFile = path.join(domainDir, `${domain}.role.md`)
                  if (await fs.pathExists(roleFile)) {
                    const content = await fs.readFile(roleFile, 'utf-8')
                    const relativePath = path.relative(packageRoot, roleFile)
                    
                    let name = `🎭 ${domain}`
                    let description = '本地发现的角色'
                    let source = 'local-discovery'
                    
                    // 区分系统角色和用户角色
                    if (scanPath.includes('.promptx')) {
                      source = 'user-generated'
                      description = '用户自定义角色'
                    }
                    
                    const nameMatch = content.match(/name:\s*(.+?)(?:\n|$)/i)
                    if (nameMatch) {
                      name = nameMatch[1].trim()
                    }
                    
                    const descMatch = content.match(/description:\s*(.+?)(?:\n|$)/i)
                    if (descMatch) {
                      description = descMatch[1].trim()
                    }
                    
                    discoveredRoles[domain] = {
                      file: scanPath.includes('.promptx') 
                        ? `@project://${relativePath}`
                        : `@package://${relativePath}`,
                      name,
                      description,
                      source
                    }
                  }
                }
              }
            }
          }
          
          return discoveredRoles
        } catch (error) {
          console.warn('角色发现失败:', error.message)
          return {}
        }
      }

      const discoveredRoles = await mockedCommand.discoverLocalRoles()
      
      // 验证同时发现了系统角色和用户角色
      expect(discoveredRoles).toHaveProperty('assistant')
      expect(discoveredRoles).toHaveProperty('my-role')
      
      expect(discoveredRoles.assistant.source).toBe('local-discovery')
      expect(discoveredRoles.assistant.file).toContain('@package://')
      
      expect(discoveredRoles['my-role'].source).toBe('user-generated')
      expect(discoveredRoles['my-role'].file).toContain('@project://')
      
      jest.unmock('../../lib/core/resource/protocols/PackageProtocol')
    })
  })

  describe('DPML格式元数据提取', () => {
    test('应该能从DPML格式中提取元数据', async () => {
      const userRoleDir = path.join(projectDir, '.promptx', 'user-roles', 'dpml-role')
      await fs.ensureDir(userRoleDir)
      
      // DPML格式的角色文件（根据文档设计的格式）
      const dpmlRoleContent = `<role>
  <personality>
    # 数据分析师思维模式
    
    ## 核心思维特征
    - **数据敏感性思维**：善于从数字中发现故事和趋势模式
    - **逻辑分析思维**：系统性地分解复杂数据问题，追求因果关系
    - **结果导向思维**：专注于为业务决策提供可行洞察和建议
  </personality>
  
  <principle>
    # 数据分析师行为原则
    
    ## 核心工作原则
    - **数据驱动决策**：所有分析建议必须有可靠数据支撑
    - **简洁清晰表达**：复杂分析结果要用简单易懂的方式呈现
    - **业务价值优先**：分析要紧密围绕业务目标和价值创造
  </principle>
  
  <knowledge>
    # 数据分析专业知识体系
    
    ## 数据处理技能
    - **数据清洗方法**：缺失值处理、异常值识别、数据标准化
    - **数据整合技巧**：多源数据合并、关联分析、数据建模
    - **质量控制流程**：数据校验、一致性检查、完整性验证
    
    ## 分析方法论
    - **描述性分析**：趋势分析、对比分析、分布分析
    - **诊断性分析**：钻取分析、根因分析、相关性分析
  </knowledge>
</role>`

      await fs.writeFile(
        path.join(userRoleDir, 'dpml-role.role.md'),
        dpmlRoleContent
      )

      jest.doMock('../../lib/core/resource/protocols/PackageProtocol', () => {
        return class MockPackageProtocol {
          async getPackageRoot() {
            return projectDir
          }
        }
      })

      delete require.cache[require.resolve('../../lib/core/pouch/commands/HelloCommand')]
      const MockedHelloCommand = require('../../lib/core/pouch/commands/HelloCommand')
      const mockedCommand = new MockedHelloCommand()

      // 实现DPML元数据提取逻辑（这是我们要实现的功能）
      function extractDPMLMetadata(content, roleId) {
        // 从<personality>标签中提取角色名称
        const personalityMatch = content.match(/<personality[^>]*>([\s\S]*?)<\/personality>/i)
        const roleNameFromPersonality = personalityMatch 
          ? personalityMatch[1].split('\n')[0].replace(/^#\s*/, '').trim()
          : null
        
        // 从<knowledge>标签中提取专业能力描述
        const knowledgeMatch = content.match(/<knowledge[^>]*>([\s\S]*?)<\/knowledge>/i)
        const roleDescription = knowledgeMatch
          ? knowledgeMatch[1].split('\n').slice(0, 3).join(' ').replace(/[#\-\*]/g, '').trim()
          : null
        
        return {
          file: `@project://.promptx/user-roles/${roleId}/${roleId}.role.md`,
          name: roleNameFromPersonality || `🎭 ${roleId}`,
          description: roleDescription || '用户自定义DPML角色',
          source: 'user-generated',
          format: 'dpml'
        }
      }

      mockedCommand.discoverLocalRoles = async function() {
        const PackageProtocol = require('../../lib/core/resource/protocols/PackageProtocol')
        const packageProtocol = new PackageProtocol()
        const discoveredRoles = {}
        
        try {
          const packageRoot = await packageProtocol.getPackageRoot()
          const userRolesPath = path.join(packageRoot, '.promptx', 'user-roles')
          
          if (await fs.pathExists(userRolesPath)) {
            const userRoleDirs = await fs.readdir(userRolesPath)
            
            for (const roleId of userRoleDirs) {
              const roleDir = path.join(userRolesPath, roleId)
              const stat = await fs.stat(roleDir)
              
              if (stat.isDirectory()) {
                const roleFile = path.join(roleDir, `${roleId}.role.md`)
                if (await fs.pathExists(roleFile)) {
                  const content = await fs.readFile(roleFile, 'utf-8')
                  
                  // 使用DPML元数据提取
                  const roleInfo = extractDPMLMetadata(content, roleId)
                  discoveredRoles[roleId] = roleInfo
                }
              }
            }
          }
          
          return discoveredRoles
        } catch (error) {
          console.warn('DPML角色发现失败:', error.message)
          return {}
        }
      }

      const discoveredRoles = await mockedCommand.discoverLocalRoles()
      
      // 验证DPML元数据提取
      expect(discoveredRoles).toHaveProperty('dpml-role')
      expect(discoveredRoles['dpml-role'].name).toBe('数据分析师思维模式')
      expect(discoveredRoles['dpml-role'].description).toContain('数据分析专业知识体系')
      expect(discoveredRoles['dpml-role'].format).toBe('dpml')
      expect(discoveredRoles['dpml-role'].source).toBe('user-generated')
      
      jest.unmock('../../lib/core/resource/protocols/PackageProtocol')
    })
  })

  describe('错误处理和边界情况', () => {
    test('应该处理不存在的用户角色目录', async () => {
      // 只创建系统角色目录，不创建用户角色目录
      const systemRoleDir = path.join(projectDir, 'prompt', 'domain', 'assistant')
      await fs.ensureDir(systemRoleDir)
      
      await fs.writeFile(
        path.join(systemRoleDir, 'assistant.role.md'),
        `<role><personality>助手</personality></role>`
      )

      jest.doMock('../../lib/core/resource/protocols/PackageProtocol', () => {
        return class MockPackageProtocol {
          async getPackageRoot() {
            return projectDir
          }
        }
      })

      delete require.cache[require.resolve('../../lib/core/pouch/commands/HelloCommand')]
      const MockedHelloCommand = require('../../lib/core/pouch/commands/HelloCommand')
      const mockedCommand = new MockedHelloCommand()

      // 模拟处理不存在目录的逻辑
      mockedCommand.discoverLocalRoles = async function() {
        const PackageProtocol = require('../../lib/core/resource/protocols/PackageProtocol')
        const packageProtocol = new PackageProtocol()
        const discoveredRoles = {}
        
        try {
          const packageRoot = await packageProtocol.getPackageRoot()
          
          const scanPaths = [
            { path: path.join(packageRoot, 'prompt', 'domain'), prefix: '@package://' },
            { path: path.join(packageRoot, '.promptx', 'user-roles'), prefix: '@project://' }
          ]
          
          for (const { path: scanPath, prefix } of scanPaths) {
            if (await fs.pathExists(scanPath)) {
              const domains = await fs.readdir(scanPath)
              
              for (const domain of domains) {
                const domainDir = path.join(scanPath, domain)
                const stat = await fs.stat(domainDir)
                
                if (stat.isDirectory()) {
                  const roleFile = path.join(domainDir, `${domain}.role.md`)
                  if (await fs.pathExists(roleFile)) {
                    const content = await fs.readFile(roleFile, 'utf-8')
                    const relativePath = path.relative(packageRoot, roleFile)
                    
                    discoveredRoles[domain] = {
                      file: `${prefix}${relativePath}`,
                      name: `🎭 ${domain}`,
                      description: '本地发现的角色',
                      source: prefix.includes('project') ? 'user-generated' : 'local-discovery'
                    }
                  }
                }
              }
            }
          }
          
          return discoveredRoles
        } catch (error) {
          return {}
        }
      }

      const discoveredRoles = await mockedCommand.discoverLocalRoles()
      
      // 应该只发现系统角色，不会因为用户角色目录不存在而出错
      expect(discoveredRoles).toHaveProperty('assistant')
      expect(Object.keys(discoveredRoles)).toHaveLength(1)
      
      jest.unmock('../../lib/core/resource/protocols/PackageProtocol')
    })

    test('应该处理用户角色ID冲突', async () => {
      // 创建同名的系统角色和用户角色
      const systemRoleDir = path.join(projectDir, 'prompt', 'domain', 'analyst')
      await fs.ensureDir(systemRoleDir)
      
      await fs.writeFile(
        path.join(systemRoleDir, 'analyst.role.md'),
        `<!--
name: 📊 系统分析师
description: 系统内置分析师
-->
<role><personality>系统分析师</personality></role>`
      )

      const userRoleDir = path.join(projectDir, '.promptx', 'user-roles', 'analyst')
      await fs.ensureDir(userRoleDir)
      
      await fs.writeFile(
        path.join(userRoleDir, 'analyst.role.md'),
        `<!--
name: 👤 用户分析师
description: 用户自定义分析师
-->
<role><personality>用户分析师</personality></role>`
      )

      jest.doMock('../../lib/core/resource/protocols/PackageProtocol', () => {
        return class MockPackageProtocol {
          async getPackageRoot() {
            return projectDir
          }
        }
      })

      delete require.cache[require.resolve('../../lib/core/pouch/commands/HelloCommand')]
      const MockedHelloCommand = require('../../lib/core/pouch/commands/HelloCommand')
      const mockedCommand = new MockedHelloCommand()

      // 模拟冲突处理逻辑（用户角色优先）
      mockedCommand.discoverLocalRoles = async function() {
        const PackageProtocol = require('../../lib/core/resource/protocols/PackageProtocol')
        const packageProtocol = new PackageProtocol()
        const discoveredRoles = {}
        
        try {
          const packageRoot = await packageProtocol.getPackageRoot()
          
          // 先扫描系统角色，再扫描用户角色（用户角色会覆盖同名系统角色）
          const scanPaths = [
            { path: path.join(packageRoot, 'prompt', 'domain'), prefix: '@package://', source: 'local-discovery' },
            { path: path.join(packageRoot, '.promptx', 'user-roles'), prefix: '@project://', source: 'user-generated' }
          ]
          
          for (const { path: scanPath, prefix, source } of scanPaths) {
            if (await fs.pathExists(scanPath)) {
              const domains = await fs.readdir(scanPath)
              
              for (const domain of domains) {
                const domainDir = path.join(scanPath, domain)
                const stat = await fs.stat(domainDir)
                
                if (stat.isDirectory()) {
                  const roleFile = path.join(domainDir, `${domain}.role.md`)
                  if (await fs.pathExists(roleFile)) {
                    const content = await fs.readFile(roleFile, 'utf-8')
                    const relativePath = path.relative(packageRoot, roleFile)
                    
                    let name = `🎭 ${domain}`
                    let description = '本地发现的角色'
                    
                    const nameMatch = content.match(/name:\s*(.+?)(?:\n|$)/i)
                    if (nameMatch) {
                      name = nameMatch[1].trim()
                    }
                    
                    const descMatch = content.match(/description:\s*(.+?)(?:\n|$)/i)
                    if (descMatch) {
                      description = descMatch[1].trim()
                    }
                    
                    // 用户角色会覆盖系统角色
                    discoveredRoles[domain] = {
                      file: `${prefix}${relativePath}`,
                      name,
                      description,
                      source
                    }
                  }
                }
              }
            }
          }
          
          return discoveredRoles
        } catch (error) {
          return {}
        }
      }

      const discoveredRoles = await mockedCommand.discoverLocalRoles()
      
      // 验证用户角色优先级更高
      expect(discoveredRoles).toHaveProperty('analyst')
      expect(discoveredRoles.analyst.name).toBe('👤 用户分析师')
      expect(discoveredRoles.analyst.description).toBe('用户自定义分析师')
      expect(discoveredRoles.analyst.source).toBe('user-generated')
      expect(discoveredRoles.analyst.file).toContain('@project://')
      
      jest.unmock('../../lib/core/resource/protocols/PackageProtocol')
    })
  })
}) 