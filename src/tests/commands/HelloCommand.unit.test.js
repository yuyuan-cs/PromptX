const path = require('path')
const fs = require('fs-extra')
const os = require('os')
const HelloCommand = require('../../lib/core/pouch/commands/HelloCommand')

describe('HelloCommand 单元测试', () => {
  let helloCommand
  let tempDir
  let tempProjectDir

  beforeEach(async () => {
    helloCommand = new HelloCommand()
    
    // 创建临时目录模拟项目结构
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hello-command-test-'))
    tempProjectDir = path.join(tempDir, 'test-project')
    
    // 创建基础目录结构
    await fs.ensureDir(path.join(tempProjectDir, 'prompt', 'domain'))
    await fs.ensureDir(path.join(tempProjectDir, '.promptx', 'user-roles'))
  })

  afterEach(async () => {
    if (tempDir) {
      await fs.remove(tempDir)
    }
    // 清理 mock
    jest.clearAllMocks()
  })

  describe('基础功能测试', () => {
    test('应该能实例化HelloCommand', () => {
      expect(helloCommand).toBeInstanceOf(HelloCommand)
      expect(typeof helloCommand.loadRoleRegistry).toBe('function')
      expect(helloCommand.resourceManager).toBeDefined()
    })

    test('getPurpose应该返回正确的目的描述', () => {
      const purpose = helloCommand.getPurpose()
      expect(purpose).toContain('AI')
      expect(purpose).toContain('角色')
    })
  })

  describe('ResourceManager 集成测试', () => {
    test('应该能发现系统内置角色', async () => {
      // Mock ResourceManager的initializeWithNewArchitecture和registry
      const mockRegistry = new Map([
        ['role:assistant', '@package://prompt/domain/assistant/assistant.role.md']
      ])
      mockRegistry.index = mockRegistry // 向后兼容

      helloCommand.resourceManager.initializeWithNewArchitecture = jest.fn().mockResolvedValue()
      helloCommand.resourceManager.registry = { index: mockRegistry }
      helloCommand.resourceManager.loadResource = jest.fn().mockResolvedValue({
        success: true,
        content: '# 🙋 智能助手\n> 通用助理角色，提供基础的助理服务和记忆支持'
      })

      const roleRegistry = await helloCommand.loadRoleRegistry()
      
      expect(roleRegistry).toHaveProperty('assistant')
      expect(roleRegistry.assistant.name).toContain('智能助手')
      expect(roleRegistry.assistant.description).toContain('助理')
      expect(roleRegistry.assistant.source).toBe('system')
    })

    test('应该处理空的角色目录', async () => {
      // Mock ResourceManager返回空注册表
      const mockRegistry = new Map()
      mockRegistry.index = mockRegistry

      helloCommand.resourceManager.initializeWithNewArchitecture = jest.fn().mockResolvedValue()
      helloCommand.resourceManager.registry = { index: mockRegistry }

      const roleRegistry = await helloCommand.loadRoleRegistry()
      
      // 应该返回fallback assistant角色
      expect(roleRegistry).toHaveProperty('assistant')
      expect(roleRegistry.assistant.source).toBe('fallback')
    })

    test('应该使用ResourceManager处理错误', async () => {
      const mockedCommand = new HelloCommand()
      
      // Mock ResourceManager to throw an error
      mockedCommand.resourceManager.initializeWithNewArchitecture = jest.fn().mockRejectedValue(new Error('Mock error'))
      
      // 应该fallback到默认assistant角色
      const roleRegistry = await mockedCommand.loadRoleRegistry()
      expect(roleRegistry).toHaveProperty('assistant')
      expect(roleRegistry.assistant.source).toBe('fallback')
    })
  })

  describe('元数据提取测试', () => {
    test('应该正确提取角色名称', () => {
      const content = '# 测试角色\n> 这是一个测试角色的描述'
      const name = helloCommand.extractRoleNameFromContent(content)
      expect(name).toBe('测试角色')
    })

    test('应该正确提取角色描述', () => {
      const content = '# 测试角色\n> 这是一个测试角色的描述'
      const description = helloCommand.extractDescriptionFromContent(content)
      expect(description).toBe('这是一个测试角色的描述')
    })

    test('应该处理无效内容', () => {
      expect(helloCommand.extractRoleNameFromContent('')).toBeNull()
      expect(helloCommand.extractDescriptionFromContent(null)).toBeNull()
    })

    test('应该正确提取角色描述（向后兼容）', () => {
      const roleInfo = { description: '这是一个测试用的角色' }
      const extracted = helloCommand.extractDescription(roleInfo)
      expect(extracted).toBe('这是一个测试用的角色')
    })

    test('应该处理缺少元数据的角色文件', () => {
      const roleInfo = { name: 'test-role' }
      const extracted = helloCommand.extractDescription(roleInfo)
      expect(extracted).toBeNull()
    })
  })

  describe('角色注册表加载测试', () => {
    test('应该能加载角色注册表', async () => {
      const result = await helloCommand.loadRoleRegistry()
      
      expect(typeof result).toBe('object')
      expect(result).toBeDefined()
    })

    test('应该在失败时返回默认assistant角色', async () => {
      const mockedCommand = new HelloCommand()
      
      // Mock ResourceManager to throw an error
      mockedCommand.resourceManager.initializeWithNewArchitecture = jest.fn().mockRejectedValue(new Error('Mock error'))

      const result = await mockedCommand.loadRoleRegistry()
      
      expect(result).toHaveProperty('assistant')
      expect(result.assistant.name).toContain('智能助手')
      expect(result.assistant.source).toBe('fallback')
    })
  })

  describe('角色信息获取测试', () => {
    test('getRoleInfo应该返回正确的角色信息', async () => {
      // Mock loadRoleRegistry 方法
      helloCommand.loadRoleRegistry = jest.fn().mockResolvedValue({
        'test-role': {
          name: '测试角色',
          description: '测试描述',
          file: '@package://test/path'
        }
      })

      const roleInfo = await helloCommand.getRoleInfo('test-role')
      
      expect(roleInfo).toEqual({
        id: 'test-role',
        name: '测试角色',
        description: '测试描述',
        file: '@package://test/path'
      })
    })

    test('getRoleInfo对不存在的角色应该返回null', async () => {
      helloCommand.loadRoleRegistry = jest.fn().mockResolvedValue({})
      
      const roleInfo = await helloCommand.getRoleInfo('non-existent')
      expect(roleInfo).toBeNull()
    })
  })

  describe('getAllRoles测试', () => {
    test('应该返回角色数组格式', async () => {
      // Mock loadRoleRegistry 方法
      helloCommand.loadRoleRegistry = jest.fn().mockResolvedValue({
        'role1': {
          name: '角色1',
          description: '描述1',
          file: 'file1',
          source: 'system'
        },
        'role2': {
          name: '角色2',
          description: '描述2',
          file: 'file2',
          source: 'user-generated'
        }
      })

      const roles = await helloCommand.getAllRoles()
      
      expect(Array.isArray(roles)).toBe(true)
      expect(roles).toHaveLength(2)
      
      expect(roles[0]).toEqual({
        id: 'role1',
        name: '角色1',
        description: '描述1',
        file: 'file1',
        source: 'system'
      })
      
      expect(roles[1]).toEqual({
        id: 'role2',
        name: '角色2',
        description: '描述2',
        file: 'file2',
        source: 'user-generated'
      })
    })
  })
})