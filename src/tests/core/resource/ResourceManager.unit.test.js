const ResourceManager = require('../../../lib/core/resource/resourceManager')
const fs = require('fs-extra')
const path = require('path')
const os = require('os')

describe('ResourceManager - 用户资源发现', () => {
  let resourceManager
  let tempDir
  let mockPackageRoot

  beforeEach(async () => {
    // 创建临时测试目录
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'promptx-test-'))
    mockPackageRoot = tempDir
    
    // 模拟用户资源目录结构
    await fs.ensureDir(path.join(tempDir, '.promptx', 'resource', 'domain'))
    
    resourceManager = new ResourceManager()
    
    // Mock packageProtocol module
    jest.doMock('../../../lib/core/resource/protocols/PackageProtocol', () => {
      return class MockPackageProtocol {
        async getPackageRoot() {
          return mockPackageRoot
        }
      }
    })
  })

  afterEach(async () => {
    // 清理临时目录
    await fs.remove(tempDir)
    jest.restoreAllMocks()
  })

  describe('discoverUserResources', () => {
    it('应该返回空对象当用户资源目录不存在时', async () => {
      // 删除用户资源目录
      await fs.remove(path.join(tempDir, '.promptx'))
      
      const result = await resourceManager.discoverUserResources()
      
      expect(result).toEqual({})
    })

    it('应该发现用户创建的角色文件', async () => {
      // 创建测试角色文件
      const roleDir = path.join(tempDir, '.promptx', 'resource', 'domain', 'test-sales-analyst')
      await fs.ensureDir(roleDir)
      
      const roleContent = `<role>
  <personality>
    # 销售数据分析师思维模式
    ## 核心思维特征
    - **数据敏感性思维**：善于从数字中发现故事和趋势模式
  </personality>
  
  <principle>
    # 销售数据分析师行为原则
    ## 核心工作原则
    - **数据驱动决策**：所有分析建议必须有可靠数据支撑
  </principle>
  
  <knowledge>
    # 销售数据分析专业知识体系
    ## 数据处理技能
    - **数据清洗方法**：缺失值处理、异常值识别
  </knowledge>
</role>`
      
      await fs.writeFile(path.join(roleDir, 'test-sales-analyst.role.md'), roleContent)
      
      const result = await resourceManager.discoverUserResources()
      
      expect(result).toHaveProperty('role')
      expect(result.role).toHaveProperty('test-sales-analyst')
      expect(result.role['test-sales-analyst']).toMatchObject({
        file: expect.stringContaining('test-sales-analyst.role.md'),
        name: expect.stringContaining('销售数据分析师'),
        source: 'user-generated',
        format: 'dpml',
        type: 'role'
      })
    })

    it('应该支持多种资源类型发现', async () => {
      // 创建角色和相关资源
      const roleDir = path.join(tempDir, '.promptx', 'resource', 'domain', 'test-role')
      await fs.ensureDir(roleDir)
      await fs.ensureDir(path.join(roleDir, 'thought'))
      await fs.ensureDir(path.join(roleDir, 'execution'))
      
      // 创建角色文件
      await fs.writeFile(path.join(roleDir, 'test-role.role.md'), '<role><personality>Test</personality><principle>Test</principle><knowledge>Test</knowledge></role>')
      
      // 创建思维文件
      await fs.writeFile(path.join(roleDir, 'thought', 'test.thought.md'), '<thought><exploration>Test exploration</exploration><reasoning>Test reasoning</reasoning></thought>')
      
      // 创建执行文件
      await fs.writeFile(path.join(roleDir, 'execution', 'test.execution.md'), '<execution><constraint>Test constraint</constraint></execution>')
      
      const result = await resourceManager.discoverUserResources()
      
      expect(result).toHaveProperty('role')
      expect(result).toHaveProperty('thought')
      expect(result).toHaveProperty('execution')
      expect(result.role).toHaveProperty('test-role')
      expect(result.thought).toHaveProperty('test')
      expect(result.execution).toHaveProperty('test')
    })

    it('应该处理DPML格式错误的文件', async () => {
      // 创建格式错误的角色文件
      const roleDir = path.join(tempDir, '.promptx', 'resource', 'domain', 'invalid-role')
      await fs.ensureDir(roleDir)
      
      const invalidContent = `这不是有效的DPML格式`
      await fs.writeFile(path.join(roleDir, 'invalid-role.role.md'), invalidContent)
      
      const result = await resourceManager.discoverUserResources()
      
      // 应该跳过格式错误的文件，但不应该抛出错误
      expect(result.role || {}).not.toHaveProperty('invalid-role')
    })

    it('应该跨平台正确处理路径', async () => {
      // 在不同平台上创建角色文件
      const roleDir = path.join(tempDir, '.promptx', 'resource', 'domain', 'cross-platform-role')
      await fs.ensureDir(roleDir)
      
      const roleContent = '<role><personality>Test</personality><principle>Test</principle><knowledge>Test</knowledge></role>'
      await fs.writeFile(path.join(roleDir, 'cross-platform-role.role.md'), roleContent)
      
      const result = await resourceManager.discoverUserResources()
      
      expect(result.role).toHaveProperty('cross-platform-role')
      
      // 验证文件路径使用正确的分隔符
      const roleInfo = result.role['cross-platform-role']
      expect(roleInfo.file).toBe(path.normalize(roleInfo.file))
    })
  })

  describe('loadUnifiedRegistry', () => {
    it('应该合并系统资源和用户资源', async () => {
      // 模拟系统资源（使用正确的registry格式）
      const mockSystemResources = {
        protocols: {
          role: {
            registry: {
              'assistant': {
                file: '@package://prompt/domain/assistant/assistant.role.md',
                name: '🙋 智能助手',
                description: '通用助理角色，提供基础的助理服务和记忆支持'
              }
            }
          }
        }
      }
      
      // Mock fs.readJSON for system registry
      jest.spyOn(fs, 'readJSON')
        .mockImplementation((filePath) => {
          if (filePath.includes('resource.registry.json')) {
            return Promise.resolve(mockSystemResources)
          }
          return Promise.resolve({})
        })
      
      // 创建用户资源
      const roleDir = path.join(tempDir, '.promptx', 'resource', 'domain', 'user-role')
      await fs.ensureDir(roleDir)
      await fs.writeFile(
        path.join(roleDir, 'user-role.role.md'), 
        '<role><personality>User</personality><principle>User</principle><knowledge>User</knowledge></role>'
      )
      
      const result = await resourceManager.loadUnifiedRegistry()
      
      expect(result.role).toHaveProperty('assistant') // 系统资源
      expect(result.role).toHaveProperty('user-role') // 用户资源
    })

    it('应该让用户资源覆盖同名系统资源', async () => {
      // 模拟系统资源（使用正确的registry格式）
      const mockSystemResources = {
        protocols: {
          role: {
            registry: {
              'assistant': {
                file: '@package://prompt/domain/assistant/assistant.role.md',
                name: '🙋 智能助手',
                description: '通用助理角色，提供基础的助理服务和记忆支持'
              }
            }
          }
        }
      }
      
      // Mock fs.readJSON for system registry
      jest.spyOn(fs, 'readJSON')
        .mockImplementation((filePath) => {
          if (filePath.includes('resource.registry.json')) {
            return Promise.resolve(mockSystemResources)
          }
          return Promise.resolve({})
        })
      
      // 创建同名的用户资源
      const roleDir = path.join(tempDir, '.promptx', 'resource', 'domain', 'assistant')
      await fs.ensureDir(roleDir)
      await fs.writeFile(
        path.join(roleDir, 'assistant.role.md'), 
        '<role><personality># 自定义助手\n用户定制的助手</personality><principle>Custom</principle><knowledge>Custom</knowledge></role>'
      )
      
      const result = await resourceManager.loadUnifiedRegistry()
      
      expect(result.role.assistant.source).toBe('user-generated')
      expect(result.role.assistant.name).toContain('自定义助手')
    })
  })
}) 