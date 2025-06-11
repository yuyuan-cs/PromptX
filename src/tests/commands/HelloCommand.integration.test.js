const HelloCommand = require('../../lib/core/pouch/commands/HelloCommand')
const ResourceManager = require('../../lib/core/resource/resourceManager')
const fs = require('fs-extra')
const path = require('path')
const os = require('os')

describe('HelloCommand - ResourceManager集成', () => {
  let helloCommand
  let tempDir
  let mockPackageRoot

  beforeEach(async () => {
    // 创建临时测试目录
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'promptx-hello-test-'))
    mockPackageRoot = tempDir
    
    // 模拟用户资源目录结构
    await fs.ensureDir(path.join(tempDir, '.promptx', 'resource', 'domain'))
    
    helloCommand = new HelloCommand()
  })

  afterEach(async () => {
    // 清理临时目录
    await fs.remove(tempDir)
    jest.restoreAllMocks()
  })

  describe('用户角色发现集成', () => {
    it('应该显示用户创建的角色', async () => {
      // 创建测试用户角色
      const roleDir = path.join(tempDir, '.promptx', 'resource', 'domain', 'sales-expert')
      await fs.ensureDir(roleDir)
      
      const roleContent = `<role>
  <personality>
    # 销售专家思维模式
    ## 核心特征
    - **客户导向思维**：始终以客户需求为出发点
  </personality>
  
  <principle>
    # 销售专家行为原则
    ## 核心原则
    - **诚信为本**：建立长期客户关系
  </principle>
  
  <knowledge>
    # 销售专业知识体系
    ## 销售技巧
    - **需求挖掘**：深度了解客户真实需求
  </knowledge>
</role>`
      
      await fs.writeFile(path.join(roleDir, 'sales-expert.role.md'), roleContent)
      
      // Mock ResourceManager的loadUnifiedRegistry方法
      jest.spyOn(ResourceManager.prototype, 'loadUnifiedRegistry')
        .mockResolvedValue({
          role: {
            'assistant': {
              file: '@package://prompt/domain/assistant/assistant.role.md',
              name: '🙋 智能助手',
              source: 'system',
              format: 'dpml',
              type: 'role'
            },
            'sales-expert': {
              file: path.join(roleDir, 'sales-expert.role.md'),
              name: '销售专家思维模式',
              source: 'user-generated',
              format: 'dpml',
              type: 'role'
            }
          }
        })
      
      // 模拟执行hello命令
      const result = await helloCommand.execute([])
      
      // 验证用户角色在输出中显示
      const allOutput = result.content || ''
      
      expect(allOutput).toContain('sales-expert')
      expect(allOutput).toContain('销售专家')
      expect(allOutput).toContain('(用户生成)')
    })

    it('应该允许用户角色覆盖系统角色', async () => {
      // 创建与系统角色同名的用户角色
      const roleDir = path.join(tempDir, '.promptx', 'resource', 'domain', 'assistant')
      await fs.ensureDir(roleDir)
      
      const customAssistantContent = `<role>
  <personality>
    # 定制智能助手
    ## 个性化特征
    - **专业导向**：专注于技术问题解决
  </personality>
  
  <principle>
    # 定制助手原则
    ## 核心原则
    - **精准回答**：提供准确的技术解决方案
  </principle>
  
  <knowledge>
    # 定制助手知识体系
    ## 技术领域
    - **编程语言**：多种编程语言的深度理解
  </knowledge>
</role>`
      
      await fs.writeFile(path.join(roleDir, 'assistant.role.md'), customAssistantContent)
      
      // Mock ResourceManager返回用户覆盖的角色
      jest.spyOn(ResourceManager.prototype, 'loadUnifiedRegistry')
        .mockResolvedValue({
          role: {
            'assistant': {
              file: path.join(roleDir, 'assistant.role.md'),
              name: '定制智能助手',
              source: 'user-generated',
              format: 'dpml',
              type: 'role'
            }
          }
        })
      
      const result = await helloCommand.execute([])
      
      const allOutput = result.content || ''
      
      // 验证显示的是用户版本
      expect(allOutput).toContain('定制智能助手')
      expect(allOutput).toContain('(用户生成)')
      expect(allOutput).not.toContain('🙋 智能助手')
    })

    it('应该同时显示系统角色和用户角色', async () => {
      // 创建用户角色
      const userRoleDir = path.join(tempDir, '.promptx', 'resource', 'domain', 'data-analyst')
      await fs.ensureDir(userRoleDir)
      
      const userRoleContent = `<role>
  <personality>
    # 数据分析师
    ## 分析思维
    - **逻辑思维**：系统性分析数据模式
  </personality>
  
  <principle>
    # 分析原则
    ## 核心原则
    - **数据驱动**：基于数据做决策
  </principle>
  
  <knowledge>
    # 分析知识
    ## 统计学
    - **描述统计**：数据的基本特征分析
  </knowledge>
</role>`
      
      await fs.writeFile(path.join(userRoleDir, 'data-analyst.role.md'), userRoleContent)
      
      // Mock ResourceManager返回系统和用户角色
      jest.spyOn(ResourceManager.prototype, 'loadUnifiedRegistry')
        .mockResolvedValue({
          role: {
            'assistant': {
              file: '@package://prompt/domain/assistant/assistant.role.md',
              name: '🙋 智能助手',
              source: 'system',
              format: 'dpml',
              type: 'role'
            },
            'java-backend-developer': {
              file: '@package://prompt/domain/java-backend-developer/java-backend-developer.role.md',
              name: '☕ Java后端开发专家',
              source: 'system',
              format: 'dpml',
              type: 'role'
            },
            'data-analyst': {
              file: path.join(userRoleDir, 'data-analyst.role.md'),
              name: '数据分析师',
              source: 'user-generated',
              format: 'dpml',
              type: 'role'
            }
          }
        })
      
      const result = await helloCommand.execute([])
      
      const allOutput = result.content || ''
      
      // 验证系统角色和用户角色都显示
      expect(allOutput).toContain('智能助手')
      expect(allOutput).toContain('Java后端开发专家')
      expect(allOutput).toContain('数据分析师')
      expect(allOutput).toContain('data-analyst')
    })
  })

  describe('错误处理', () => {
    it('应该优雅处理资源发现失败', async () => {
      // 模拟ResourceManager错误
      jest.spyOn(ResourceManager.prototype, 'loadUnifiedRegistry')
        .mockRejectedValue(new Error('资源发现失败'))
      
      // 应该不抛出异常
      const result = await helloCommand.execute([])
      
      // 应该显示基础角色（fallback）
      expect(result.content).toContain('智能助手')
    })

    it('应该处理空的资源注册表', async () => {
      // Mock空的资源注册表
      jest.spyOn(ResourceManager.prototype, 'loadUnifiedRegistry')
        .mockResolvedValue({ role: {} })
      
      const result = await helloCommand.execute([])
      
      // 应该显示基础角色（fallback）
      expect(result.content).toContain('智能助手')
    })
  })
}) 