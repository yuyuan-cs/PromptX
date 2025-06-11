const ActionCommand = require('../../lib/core/pouch/commands/ActionCommand')
const path = require('path')
const fs = require('fs-extra')

describe('ActionCommand DPML修复验证测试', () => {
  let actionCommand

  beforeEach(() => {
    actionCommand = new ActionCommand()
  })

  describe('角色内容解析修复验证', () => {
    test('应该完整解析internet-debater角色的直接内容', async () => {
      // 模拟角色信息
      const mockRoleInfo = {
        id: 'internet-debater',
        name: '互联网杠精',
        file: '.promptx/resource/domain/internet-debater/internet-debater.role.md'
      }

      // 检查角色文件是否存在
      const roleFilePath = path.join(process.cwd(), mockRoleInfo.file)
      const exists = await fs.pathExists(roleFilePath)
      
      if (!exists) {
        console.log('跳过测试：internet-debater角色文件不存在')
        return
      }

      // 分析角色依赖
      const dependencies = await actionCommand.analyzeRoleDependencies(mockRoleInfo)
      
      // 验证新的语义结构存在
      expect(dependencies).toHaveProperty('roleSemantics')
      expect(dependencies.roleSemantics).toHaveProperty('personality')
      expect(dependencies.roleSemantics).toHaveProperty('principle')
      expect(dependencies.roleSemantics).toHaveProperty('knowledge')
      
      // 验证personality直接内容
      const personality = dependencies.roleSemantics.personality
      expect(personality).toBeTruthy()
      expect(personality.directContent).toContain('网络杠精思维模式')
      expect(personality.directContent).toContain('挑刺思维')
      expect(personality.directContent).toContain('抬杠本能')
      expect(personality.directContent.length).toBeGreaterThan(400)
      
      // 验证principle直接内容
      const principle = dependencies.roleSemantics.principle
      expect(principle).toBeTruthy()
      expect(principle.directContent).toContain('网络杠精行为原则')
      expect(principle.directContent).toContain('逢言必反')
      expect(principle.directContent).toContain('抠字眼优先')
      expect(principle.directContent.length).toBeGreaterThan(500)
      
      // 验证knowledge直接内容
      const knowledge = dependencies.roleSemantics.knowledge
      expect(knowledge).toBeTruthy()
      expect(knowledge.directContent).toContain('网络杠精专业知识体系')
      expect(knowledge.directContent).toContain('逻辑谬误大全')
      expect(knowledge.directContent).toContain('稻草人谬误')
      expect(knowledge.directContent.length).toBeGreaterThan(800)
      
      console.log('✅ internet-debater角色直接内容解析成功')
      console.log(`   - personality: ${personality.directContent.length} 字符`)
      console.log(`   - principle: ${principle.directContent.length} 字符`)
      console.log(`   - knowledge: ${knowledge.directContent.length} 字符`)
      console.log(`   - 总内容: ${personality.directContent.length + principle.directContent.length + knowledge.directContent.length} 字符`)
    })

    test('应该生成包含完整内容的学习计划', async () => {
      const mockRoleInfo = {
        id: 'internet-debater',
        name: '互联网杠精',
        file: '.promptx/resource/domain/internet-debater/internet-debater.role.md'
      }

      const roleFilePath = path.join(process.cwd(), mockRoleInfo.file)
      const exists = await fs.pathExists(roleFilePath)
      
      if (!exists) {
        console.log('跳过测试：internet-debater角色文件不存在')
        return
      }

      // 分析依赖并生成学习计划
      const dependencies = await actionCommand.analyzeRoleDependencies(mockRoleInfo)
      
      // Mock executeRecall 方法避免实际调用
      actionCommand.executeRecall = jest.fn().mockResolvedValue('---\n## 🧠 自动记忆检索结果\n模拟记忆内容\n')
      
      const learningPlan = await actionCommand.generateLearningPlan(mockRoleInfo.id, dependencies)
      
      // 验证学习计划包含直接内容
      expect(learningPlan).toContain('角色激活完成：internet-debater')
      expect(learningPlan).toContain('网络杠精思维模式')
      expect(learningPlan).toContain('挑刺思维')
      expect(learningPlan).toContain('网络杠精行为原则')
      expect(learningPlan).toContain('逢言必反')
      expect(learningPlan).toContain('网络杠精专业知识体系')
      expect(learningPlan).toContain('逻辑谬误大全')
      
      // 验证角色组件信息
      expect(learningPlan).toContain('🎭 角色组件：👤 人格特征, ⚖️ 行为原则, 📚 专业知识')
      
      console.log('✅ 学习计划包含完整的角色内容')
      console.log(`   学习计划长度: ${learningPlan.length} 字符`)
    })

    test('修复前后对比：应该展示语义完整性的提升', async () => {
      // 创建混合内容测试
      const testContent = `<role>
  <personality>
    @!thought://remember
    @!thought://recall
    
    # 杠精思维特征
    - 挑刺思维：看到任何观点都先找问题
    - 抬杠本能：天生反对派
  </personality>
  <principle>
    @!execution://assistant
    
    # 杠精行为原则
    - 逢言必反：对任何观点都要找反对角度
    - 抠字眼优先：从用词表述找问题
  </principle>
</role>`

      // 使用新的DPMLContentParser解析
      const roleSemantics = actionCommand.dpmlParser.parseRoleDocument(testContent)
      
      // 验证混合内容解析
      expect(roleSemantics.personality.references).toHaveLength(2)
      expect(roleSemantics.personality.references.map(r => r.resource)).toEqual(['remember', 'recall'])
      expect(roleSemantics.personality.directContent).toContain('杠精思维特征')
      expect(roleSemantics.personality.directContent).toContain('挑刺思维')
      
      expect(roleSemantics.principle.references).toHaveLength(1)
      expect(roleSemantics.principle.references[0].resource).toBe('assistant')
      expect(roleSemantics.principle.directContent).toContain('杠精行为原则')
      expect(roleSemantics.principle.directContent).toContain('逢言必反')
      
      console.log('📊 修复验证结果：')
      console.log(`   personality: ${roleSemantics.personality.references.length}个引用 + ${roleSemantics.personality.directContent.length}字符直接内容`)
      console.log(`   principle: ${roleSemantics.principle.references.length}个引用 + ${roleSemantics.principle.directContent.length}字符直接内容`)
      console.log(`   🎯 混合内容解析成功：引用和直接内容都被完整保留`)
    })
  })

  describe('向下兼容性验证', () => {
    test('应该兼容纯@引用的系统角色', () => {
      const testContent = `<role>
  <personality>
    @!thought://remember
    @!thought://recall
    @!thought://assistant
  </personality>
  <principle>
    @!execution://assistant
  </principle>
</role>`

      const roleSemantics = actionCommand.dpmlParser.parseRoleDocument(testContent)
      
      // 验证引用解析正常
      expect(roleSemantics.personality.references).toHaveLength(3)
      expect(roleSemantics.principle.references).toHaveLength(1)
      
      // 验证没有直接内容
      expect(roleSemantics.personality.directContent).toBe('')
      expect(roleSemantics.principle.directContent).toBe('')
      
      // 验证内容类型
      expect(roleSemantics.personality.metadata.contentType).toBe('references-only')
      expect(roleSemantics.principle.metadata.contentType).toBe('references-only')
      
      console.log('✅ 向下兼容性验证通过：纯@引用角色正常解析')
    })
  })
})