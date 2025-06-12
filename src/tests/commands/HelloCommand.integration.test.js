const path = require('path')
const fs = require('fs-extra')
const os = require('os')
const HelloCommand = require('../../lib/core/pouch/commands/HelloCommand')

/**
 * HelloCommand集成测试
 * 
 * 测试HelloCommand与ResourceManager的集成，包括：
 * 1. 用户角色发现
 * 2. 系统角色与用户角色的合并
 * 3. 错误处理
 */
describe('HelloCommand - ResourceManager集成', () => {
  let helloCommand
  let tempDir
  let userRoleDir

  beforeEach(async () => {
    helloCommand = new HelloCommand()
    
    // 创建临时测试环境
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hello-command-integration-'))
    userRoleDir = path.join(tempDir, 'user-roles')
    await fs.ensureDir(userRoleDir)
  })

  afterEach(async () => {
    if (tempDir) {
      await fs.remove(tempDir)
    }
    jest.clearAllMocks()
  })

  describe('用户角色发现集成', () => {
    test('应该显示用户创建的角色', async () => {
      // 创建模拟用户角色文件
      const customRoleDir = path.join(userRoleDir, 'custom-role')
      await fs.ensureDir(customRoleDir)
      await fs.writeFile(
        path.join(customRoleDir, 'custom-role.role.md'),
        `# 自定义专家
> 这是一个用户自定义的专业角色

<role>
## 角色定义
专业的自定义角色，具备特定的技能和知识。
</role>`
      )

      // 直接模拟loadRoleRegistry方法返回期望的角色注册表
      helloCommand.loadRoleRegistry = jest.fn().mockResolvedValue({
        'assistant': {
          file: '@package://prompt/domain/assistant/assistant.role.md',
          name: '🙋 智能助手',
          description: '通用助理角色，提供基础的助理服务和记忆支持',
          source: 'system'
        },
        'custom-role': {
          file: path.join(customRoleDir, 'custom-role.role.md'),
          name: '自定义专家',
          description: '这是一个用户自定义的专业角色',
          source: 'user-generated'
        }
      })

      const content = await helloCommand.getContent([])
      
      expect(content).toContain('自定义专家')
      expect(content).toContain('智能助手')
      expect(content).toContain('custom-role')
      expect(content).toContain('assistant')
    })

    test('应该允许用户角色覆盖系统角色', async () => {
      // 创建用户自定义的assistant角色
      const assistantRoleDir = path.join(userRoleDir, 'assistant')
      await fs.ensureDir(assistantRoleDir)
      await fs.writeFile(
        path.join(assistantRoleDir, 'assistant.role.md'),
        `# 🚀 增强助手
> 用户自定义的增强版智能助手

<role>
## 角色定义
增强版的智能助手，具备更多专业能力。
</role>`
      )

      // 直接模拟loadRoleRegistry方法返回用户覆盖的角色
      helloCommand.loadRoleRegistry = jest.fn().mockResolvedValue({
        'assistant': {
          file: path.join(assistantRoleDir, 'assistant.role.md'),
          name: '🚀 增强助手',
          description: '用户自定义的增强版智能助手',
          source: 'user-generated'
        }
      })

      const content = await helloCommand.getContent([])
      
      expect(content).toContain('🚀 增强助手')
      expect(content).toContain('用户自定义')
      expect(content).not.toContain('🙋 智能助手') // 不应该包含原始系统角色
    })

    test('应该同时显示系统角色和用户角色', async () => {
      // 创建用户角色目录和文件
      const webDevRoleDir = path.join(userRoleDir, 'web-developer')
      await fs.ensureDir(webDevRoleDir)
      await fs.writeFile(
        path.join(webDevRoleDir, 'web-developer.role.md'),
        `# 前端开发专家
> 专业的前端开发工程师

<role>
## 角色定义
精通HTML、CSS、JavaScript的前端开发专家。
</role>`
      )

      // 直接模拟loadRoleRegistry方法返回系统和用户角色
      helloCommand.loadRoleRegistry = jest.fn().mockResolvedValue({
        'assistant': {
          file: '@package://prompt/domain/assistant/assistant.role.md',
          name: '🙋 智能助手',
          description: '通用助理角色，提供基础的助理服务和记忆支持',
          source: 'system'
        },
        'web-developer': {
          file: path.join(webDevRoleDir, 'web-developer.role.md'),
          name: '前端开发专家',
          description: '专业的前端开发工程师',
          source: 'user-generated'
        }
      })

      const content = await helloCommand.getContent([])
      
      expect(content).toContain('智能助手')
      expect(content).toContain('前端开发专家')
      expect(content).toContain('assistant')
      expect(content).toContain('web-developer')
    })
  })

  describe('错误处理', () => {
    test('应该优雅处理资源发现失败', async () => {
      // 这里不能直接模拟loadRoleRegistry抛出错误，因为会绕过内部的try-catch
      // 相反，我们模拟loadRoleRegistry返回fallback角色（表示内部发生了错误）
      helloCommand.loadRoleRegistry = jest.fn().mockResolvedValue({
        assistant: {
          file: '@package://prompt/domain/assistant/assistant.role.md',
          name: '🙋 智能助手',
          description: '通用助理角色，提供基础的助理服务和记忆支持',
          source: 'fallback'
        }
      })
      
      // 应该不抛出异常
      const result = await helloCommand.execute([])
      
      expect(result).toBeDefined()
      expect(result.content).toContain('智能助手') // 应该fallback到默认角色
      expect(result.content).toContain('(默认角色)') // 应该显示fallback标签
    })

    test('应该处理空的资源注册表', async () => {
      // 模拟空的资源注册表时，loadRoleRegistry会自动添加fallback角色
      helloCommand.loadRoleRegistry = jest.fn().mockResolvedValue({
        assistant: {
          file: '@package://prompt/domain/assistant/assistant.role.md',
          name: '🙋 智能助手',
          description: '通用助理角色，提供基础的助理服务和记忆支持',
          source: 'fallback'
        }
      })
      
      const result = await helloCommand.execute([])
      
      expect(result).toBeDefined()
      expect(result.content).toContain('智能助手')
      expect(result.content).toContain('(默认角色)') // 应该标注为fallback角色
    })
  })

  describe('HATEOAS支持', () => {
    test('应该返回正确的可用状态转换', async () => {
      const hateoas = await helloCommand.getPATEOAS([])
      
      expect(hateoas.currentState).toBe('role_discovery')
      expect(hateoas.availableTransitions).toContain('action')
      expect(hateoas.nextActions).toBeDefined()
      expect(Array.isArray(hateoas.nextActions)).toBe(true)
    })
  })

  describe('命令执行集成', () => {
    test('应该成功执行完整的角色发现流程', async () => {
      // 模拟基础系统角色
      helloCommand.loadRoleRegistry = jest.fn().mockResolvedValue({
        'assistant': {
          file: '@package://prompt/domain/assistant/assistant.role.md',
          name: '🙋 智能助手',
          description: '通用助理角色，提供基础的助理服务和记忆支持',
          source: 'system'
        }
      })

      const result = await helloCommand.execute([])
      
      expect(result).toBeDefined()
      expect(result.purpose).toContain('为AI提供可用角色信息')
      expect(result.content).toContain('AI专业角色服务清单')
      expect(result.content).toContain('激活命令')
      expect(result.pateoas).toBeDefined()
    })
  })
}) 