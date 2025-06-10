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
    // 清理缓存
    if (helloCommand.roleRegistry) {
      helloCommand.roleRegistry = null
    }
  })

  describe('基础功能测试', () => {
    test('应该能实例化HelloCommand', () => {
      expect(helloCommand).toBeInstanceOf(HelloCommand)
      expect(typeof helloCommand.discoverLocalRoles).toBe('function')
      expect(typeof helloCommand.loadRoleRegistry).toBe('function')
    })

    test('getPurpose应该返回正确的目的描述', () => {
      const purpose = helloCommand.getPurpose()
      expect(purpose).toContain('AI')
      expect(purpose).toContain('角色')
    })
  })

  describe('discoverLocalRoles 功能测试', () => {
    test('应该能发现系统内置角色', async () => {
      // 创建模拟的系统角色文件
      const assistantDir = path.join(tempProjectDir, 'prompt', 'domain', 'assistant')
      await fs.ensureDir(assistantDir)
      
      const roleFileContent = `<!--
name: 🙋 智能助手
description: 通用助理角色，提供基础的助理服务和记忆支持
-->

<role>
  <personality>
    @!thought://remember
    @!thought://recall
    @!thought://assistant
  </personality>
  
  <principle>
    @!execution://assistant
  </principle>
</role>`
      
      await fs.writeFile(
        path.join(assistantDir, 'assistant.role.md'),
        roleFileContent
      )

      // Mock PackageProtocol.getPackageRoot 返回临时目录
      const originalRequire = require
      jest.doMock('../../lib/core/resource/protocols/PackageProtocol', () => {
        return class MockPackageProtocol {
          async getPackageRoot() {
            return tempProjectDir
          }
        }
      })

      // 重新加载HelloCommand使用mock
      delete require.cache[require.resolve('../../lib/core/pouch/commands/HelloCommand')]
      const MockedHelloCommand = require('../../lib/core/pouch/commands/HelloCommand')
      const mockedCommand = new MockedHelloCommand()

      const discoveredRoles = await mockedCommand.discoverLocalRoles()
      
      expect(discoveredRoles).toHaveProperty('assistant')
      expect(discoveredRoles.assistant.name).toContain('智能助手')
      expect(discoveredRoles.assistant.description).toContain('通用助理角色')
      expect(discoveredRoles.assistant.source).toBe('local-discovery')

      // 恢复原始require
      jest.unmock('../../lib/core/resource/protocols/PackageProtocol')
    })

    test('应该处理空的角色目录', async () => {
      // Mock PackageProtocol.getPackageRoot 返回空目录
      jest.doMock('../../lib/core/resource/protocols/PackageProtocol', () => {
        return class MockPackageProtocol {
          async getPackageRoot() {
            return tempProjectDir
          }
        }
      })

      delete require.cache[require.resolve('../../lib/core/pouch/commands/HelloCommand')]
      const MockedHelloCommand = require('../../lib/core/pouch/commands/HelloCommand')
      const mockedCommand = new MockedHelloCommand()

      const discoveredRoles = await mockedCommand.discoverLocalRoles()
      expect(discoveredRoles).toEqual({})
      
      jest.unmock('../../lib/core/resource/protocols/PackageProtocol')
    })

    test('应该优雅处理文件读取错误', async () => {
      // 创建无效的角色文件（权限问题）
      const invalidRoleDir = path.join(tempProjectDir, 'prompt', 'domain', 'invalid')
      await fs.ensureDir(invalidRoleDir)
      
      const invalidRoleFile = path.join(invalidRoleDir, 'invalid.role.md')
      await fs.writeFile(invalidRoleFile, 'invalid content')
      
      // 修改文件权限使其不可读（仅在Unix系统上有效）
      if (process.platform !== 'win32') {
        await fs.chmod(invalidRoleFile, 0o000)
      }

      jest.doMock('../../lib/core/resource/protocols/PackageProtocol', () => {
        return class MockPackageProtocol {
          async getPackageRoot() {
            return tempProjectDir
          }
        }
      })

      delete require.cache[require.resolve('../../lib/core/pouch/commands/HelloCommand')]
      const MockedHelloCommand = require('../../lib/core/pouch/commands/HelloCommand')
      const mockedCommand = new MockedHelloCommand()

      // 应该不抛出异常，而是记录警告并跳过无效文件
      const discoveredRoles = await mockedCommand.discoverLocalRoles()
      expect(typeof discoveredRoles).toBe('object')
      
      // 恢复文件权限
      if (process.platform !== 'win32') {
        await fs.chmod(invalidRoleFile, 0o644)
      }
      
      jest.unmock('../../lib/core/resource/protocols/PackageProtocol')
    })
  })

  describe('元数据提取测试', () => {
    test('应该正确提取角色名称和描述', async () => {
      const testRoleDir = path.join(tempProjectDir, 'prompt', 'domain', 'test-role')
      await fs.ensureDir(testRoleDir)
      
      const roleContent = `<!--
name: 🧪 测试角色
description: 这是一个测试用的角色
-->

<role>
  <personality>
    测试思维模式
  </personality>
  
  <principle>
    测试行为原则
  </principle>
</role>`
      
      await fs.writeFile(
        path.join(testRoleDir, 'test-role.role.md'),
        roleContent
      )

      jest.doMock('../../lib/core/resource/protocols/PackageProtocol', () => {
        return class MockPackageProtocol {
          async getPackageRoot() {
            return tempProjectDir
          }
        }
      })

      delete require.cache[require.resolve('../../lib/core/pouch/commands/HelloCommand')]
      const MockedHelloCommand = require('../../lib/core/pouch/commands/HelloCommand')
      const mockedCommand = new MockedHelloCommand()

      const discoveredRoles = await mockedCommand.discoverLocalRoles()
      
      expect(discoveredRoles).toHaveProperty('test-role')
      expect(discoveredRoles['test-role'].name).toBe('🧪 测试角色')
      expect(discoveredRoles['test-role'].description).toBe('这是一个测试用的角色')
      
      jest.unmock('../../lib/core/resource/protocols/PackageProtocol')
    })

    test('应该处理缺少元数据的角色文件', async () => {
      const testRoleDir = path.join(tempProjectDir, 'prompt', 'domain', 'no-meta')
      await fs.ensureDir(testRoleDir)
      
      const roleContent = `<role>
  <personality>
    基础角色内容
  </personality>
</role>`
      
      await fs.writeFile(
        path.join(testRoleDir, 'no-meta.role.md'),
        roleContent
      )

      jest.doMock('../../lib/core/resource/protocols/PackageProtocol', () => {
        return class MockPackageProtocol {
          async getPackageRoot() {
            return tempProjectDir
          }
        }
      })

      delete require.cache[require.resolve('../../lib/core/pouch/commands/HelloCommand')]
      const MockedHelloCommand = require('../../lib/core/pouch/commands/HelloCommand')
      const mockedCommand = new MockedHelloCommand()

      const discoveredRoles = await mockedCommand.discoverLocalRoles()
      
      expect(discoveredRoles).toHaveProperty('no-meta')
      expect(discoveredRoles['no-meta'].name).toBe('🎭 no-meta')  // 默认格式
      expect(discoveredRoles['no-meta'].description).toBe('本地发现的角色')  // 默认描述
      
      jest.unmock('../../lib/core/resource/protocols/PackageProtocol')
    })
  })

  describe('角色注册表加载测试', () => {
    test('应该能加载角色注册表', async () => {
      const result = await helloCommand.loadRoleRegistry()
      
      expect(typeof result).toBe('object')
      expect(helloCommand.roleRegistry).toBe(result)
    })

    test('应该在失败时返回默认assistant角色', async () => {
      // Mock ResourceManager抛出异常
      jest.doMock('../../lib/core/resource/resourceManager', () => {
        return class MockResourceManager {
          async initialize() {
            throw new Error('Mock initialization failure')
          }
        }
      })

      // Mock discoverLocalRoles也失败
      jest.spyOn(helloCommand, 'discoverLocalRoles').mockRejectedValue(new Error('Mock discovery failure'))

      delete require.cache[require.resolve('../../lib/core/pouch/commands/HelloCommand')]
      const MockedHelloCommand = require('../../lib/core/pouch/commands/HelloCommand')
      const mockedCommand = new MockedHelloCommand()

      const result = await mockedCommand.loadRoleRegistry()
      
      expect(result).toHaveProperty('assistant')
      expect(result.assistant.name).toContain('智能助手')
      
      jest.unmock('../../lib/core/resource/resourceManager')
      helloCommand.discoverLocalRoles.mockRestore()
    })
  })

  describe('角色信息获取测试', () => {
    test('getRoleInfo应该返回正确的角色信息', async () => {
      // Mock注册表
      helloCommand.roleRegistry = {
        'test-role': {
          name: '测试角色',
          description: '测试描述',
          file: '@package://test/path'
        }
      }

      const roleInfo = await helloCommand.getRoleInfo('test-role')
      
      expect(roleInfo).toEqual({
        id: 'test-role',
        name: '测试角色',
        description: '测试描述',
        file: '@package://test/path'
      })
    })

    test('getRoleInfo对不存在的角色应该返回null', async () => {
      helloCommand.roleRegistry = {}
      
      const roleInfo = await helloCommand.getRoleInfo('non-existent')
      expect(roleInfo).toBeNull()
    })
  })

  describe('getAllRoles测试', () => {
    test('应该返回角色数组格式', async () => {
      helloCommand.roleRegistry = {
        'role1': { name: '角色1', description: '描述1', file: 'file1' },
        'role2': { name: '角色2', description: '描述2', file: 'file2' }
      }

      const allRoles = await helloCommand.getAllRoles()
      
      expect(Array.isArray(allRoles)).toBe(true)
      expect(allRoles).toHaveLength(2)
      expect(allRoles[0]).toHaveProperty('id')
      expect(allRoles[0]).toHaveProperty('name')
      expect(allRoles[0]).toHaveProperty('description')
      expect(allRoles[0]).toHaveProperty('file')
    })
  })
}) 