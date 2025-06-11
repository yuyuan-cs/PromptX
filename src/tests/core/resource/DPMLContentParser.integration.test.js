const DPMLContentParser = require('../../../lib/core/resource/DPMLContentParser')
const path = require('path')
const fs = require('fs-extra')

describe('DPMLContentParser 集成测试', () => {
  let parser
  
  beforeEach(() => {
    parser = new DPMLContentParser()
  })

  describe('真实角色文件测试', () => {
    test('应该正确解析internet-debater角色的完整内容', async () => {
      const roleFile = '/Users/sean/WorkSpaces/DeepracticeProjects/PromptX/.promptx/resource/domain/internet-debater/internet-debater.role.md'
      
      // 检查文件是否存在
      const exists = await fs.pathExists(roleFile)
      if (!exists) {
        console.log('跳过测试：internet-debater角色文件不存在')
        return
      }
      
      const roleContent = await fs.readFile(roleFile, 'utf-8')
      const roleSemantics = parser.parseRoleDocument(roleContent)
      
      // 验证personality解析
      expect(roleSemantics).toHaveProperty('personality')
      expect(roleSemantics.personality.metadata.contentType).toBe('direct-only')
      expect(roleSemantics.personality.directContent).toContain('网络杠精思维模式')
      expect(roleSemantics.personality.directContent).toContain('挑刺思维')
      expect(roleSemantics.personality.directContent).toContain('抬杠本能')
      
      // 验证principle解析
      expect(roleSemantics).toHaveProperty('principle')
      expect(roleSemantics.principle.metadata.contentType).toBe('direct-only')
      expect(roleSemantics.principle.directContent).toContain('网络杠精行为原则')
      expect(roleSemantics.principle.directContent).toContain('逢言必反')
      expect(roleSemantics.principle.directContent).toContain('抠字眼优先')
      
      // 验证knowledge解析
      expect(roleSemantics).toHaveProperty('knowledge')
      expect(roleSemantics.knowledge.metadata.contentType).toBe('direct-only')
      expect(roleSemantics.knowledge.directContent).toContain('网络杠精专业知识体系')
      expect(roleSemantics.knowledge.directContent).toContain('逻辑谬误大全')
      expect(roleSemantics.knowledge.directContent).toContain('稻草人谬误')
      
      console.log('✅ internet-debater角色内容完整解析成功')
      console.log(`   - personality: ${roleSemantics.personality.directContent.length} 字符`)
      console.log(`   - principle: ${roleSemantics.principle.directContent.length} 字符`)
      console.log(`   - knowledge: ${roleSemantics.knowledge.directContent.length} 字符`)
    })

    test('应该正确解析系统角色的@引用内容', async () => {
      const roleFile = '/Users/sean/WorkSpaces/DeepracticeProjects/PromptX/prompt/domain/assistant/assistant.role.md'
      
      const exists = await fs.pathExists(roleFile)
      if (!exists) {
        console.log('跳过测试：assistant角色文件不存在')
        return
      }
      
      const roleContent = await fs.readFile(roleFile, 'utf-8')
      const roleSemantics = parser.parseRoleDocument(roleContent)
      
      // 验证personality有@引用
      if (roleSemantics.personality) {
        expect(roleSemantics.personality.references.length).toBeGreaterThan(0)
        console.log('✅ assistant角色@引用解析成功')
        console.log(`   - personality引用数量: ${roleSemantics.personality.references.length}`)
      }
    })
  })

  describe('修复前后对比测试', () => {
    test('模拟ActionCommand当前解析vs新解析的差异', () => {
      const mixedContent = `@!thought://remember
@!thought://recall

# 网络杠精思维模式
## 核心思维特征
- 挑刺思维：看到任何观点都先找问题和漏洞
- 抬杠本能：天生反对派，习惯性质疑一切表述`

      // 模拟当前ActionCommand的解析（只提取@引用）
      const currentParsing = {
        thoughtReferences: ['remember', 'recall'],
        directContent: '' // 完全丢失
      }
      
      // 新的DPMLContentParser解析
      const newParsing = parser.parseTagContent(mixedContent, 'personality')
      
      // 对比结果
      expect(newParsing.references).toHaveLength(2)
      expect(newParsing.references.map(r => r.resource)).toEqual(['remember', 'recall'])
      expect(newParsing.directContent).toContain('网络杠精思维模式')
      expect(newParsing.directContent).toContain('挑刺思维')
      expect(newParsing.directContent).toContain('抬杠本能')
      
      console.log('📊 解析能力对比：')
      console.log(`   当前ActionCommand: 只解析${currentParsing.thoughtReferences.length}个引用，丢失${newParsing.directContent.length}字符直接内容`)
      console.log(`   新DPMLContentParser: 解析${newParsing.references.length}个引用 + ${newParsing.directContent.length}字符直接内容`)
      console.log(`   🎯 语义完整性提升: ${((newParsing.directContent.length / mixedContent.length) * 100).toFixed(1)}%`)
    })
  })
})