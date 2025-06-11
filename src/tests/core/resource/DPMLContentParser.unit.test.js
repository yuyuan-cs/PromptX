const DPMLContentParser = require('../../../lib/core/resource/DPMLContentParser')

describe('DPMLContentParser 单元测试', () => {
  let parser

  beforeEach(() => {
    parser = new DPMLContentParser()
  })

  describe('基础功能测试', () => {
    test('应该能实例化DPMLContentParser', () => {
      expect(parser).toBeInstanceOf(DPMLContentParser)
      expect(typeof parser.parseTagContent).toBe('function')
      expect(typeof parser.extractReferences).toBe('function')
      expect(typeof parser.extractDirectContent).toBe('function')
    })
  })

  describe('引用解析测试', () => {
    test('应该正确解析单个@引用', () => {
      const content = '@!thought://remember'
      const references = parser.extractReferences(content)
      
      expect(references).toHaveLength(1)
      expect(references[0]).toEqual({
        fullMatch: '@!thought://remember',
        priority: '!',
        protocol: 'thought',
        resource: 'remember',
        isRequired: true,
        isOptional: false
      })
    })

    test('应该正确解析多个@引用', () => {
      const content = `@!thought://remember
@?execution://assistant
@thought://recall`
      const references = parser.extractReferences(content)
      
      expect(references).toHaveLength(3)
      expect(references[0].resource).toBe('remember')
      expect(references[1].resource).toBe('assistant')
      expect(references[2].resource).toBe('recall')
      expect(references[0].isRequired).toBe(true)
      expect(references[1].isOptional).toBe(true)
      expect(references[2].isRequired).toBe(false)
    })

    test('应该处理没有@引用的内容', () => {
      const content = '# 这是直接内容\n- 列表项目'
      const references = parser.extractReferences(content)
      
      expect(references).toHaveLength(0)
    })
  })

  describe('直接内容提取测试', () => {
    test('应该正确提取纯直接内容', () => {
      const content = `# 网络杠精思维模式
## 核心思维特征
- 挑刺思维：看到任何观点都先找问题
- 抬杠本能：天生反对派`
      
      const directContent = parser.extractDirectContent(content)
      
      expect(directContent).toContain('网络杠精思维模式')
      expect(directContent).toContain('挑刺思维')
      expect(directContent).toContain('抬杠本能')
    })

    test('应该从混合内容中过滤掉@引用', () => {
      const content = `@!thought://remember

# 直接编写的个性特征
- 特征1
- 特征2

@!execution://assistant`
      
      const directContent = parser.extractDirectContent(content)
      
      expect(directContent).toContain('直接编写的个性特征')
      expect(directContent).toContain('特征1')
      expect(directContent).not.toContain('@!thought://remember')
      expect(directContent).not.toContain('@!execution://assistant')
    })

    test('应该处理只有@引用没有直接内容的情况', () => {
      const content = '@!thought://remember\n@!execution://assistant'
      const directContent = parser.extractDirectContent(content)
      
      expect(directContent).toBe('')
    })
  })

  describe('标签内容解析测试', () => {
    test('应该解析混合内容标签', () => {
      const content = `@!thought://remember
@!thought://recall

# 网络杠精思维模式
## 核心思维特征
- 挑刺思维：看到任何观点都先找问题和漏洞
- 抬杠本能：天生反对派，习惯性质疑一切表述`
      
      const result = parser.parseTagContent(content, 'personality')
      
      expect(result.fullSemantics).toBe(content.trim())
      expect(result.references).toHaveLength(2)
      expect(result.references[0].resource).toBe('remember')
      expect(result.references[1].resource).toBe('recall')
      expect(result.directContent).toContain('网络杠精思维模式')
      expect(result.directContent).toContain('挑刺思维')
      expect(result.metadata.tagName).toBe('personality')
      expect(result.metadata.hasReferences).toBe(true)
      expect(result.metadata.hasDirectContent).toBe(true)
      expect(result.metadata.contentType).toBe('mixed')
    })

    test('应该解析纯@引用标签', () => {
      const content = `@!thought://remember
@!thought://assistant
@!execution://assistant`
      
      const result = parser.parseTagContent(content, 'personality')
      
      expect(result.references).toHaveLength(3)
      expect(result.directContent).toBe('')
      expect(result.metadata.contentType).toBe('references-only')
    })

    test('应该解析纯直接内容标签', () => {
      const content = `# 网络杠精思维模式
## 核心思维特征
- 挑刺思维：看到任何观点都先找问题和漏洞`
      
      const result = parser.parseTagContent(content, 'personality')
      
      expect(result.references).toHaveLength(0)
      expect(result.directContent).toContain('网络杠精思维模式')
      expect(result.metadata.contentType).toBe('direct-only')
    })

    test('应该处理空标签', () => {
      const result = parser.parseTagContent('', 'personality')
      
      expect(result.fullSemantics).toBe('')
      expect(result.references).toHaveLength(0)
      expect(result.directContent).toBe('')
      expect(result.metadata.contentType).toBe('empty')
    })
  })

  describe('DPML文档解析测试', () => {
    test('应该从DPML文档中提取标签内容', () => {
      const dpmlContent = `<role>
  <personality>
    @!thought://remember
    # 个性特征
  </personality>
  <principle>
    @!execution://assistant
    # 行为原则
  </principle>
</role>`
      
      const personalityContent = parser.extractTagContent(dpmlContent, 'personality')
      const principleContent = parser.extractTagContent(dpmlContent, 'principle')
      
      expect(personalityContent).toContain('@!thought://remember')
      expect(personalityContent).toContain('个性特征')
      expect(principleContent).toContain('@!execution://assistant')
      expect(principleContent).toContain('行为原则')
    })

    test('应该解析完整的角色文档', () => {
      const roleContent = `<role>
  <personality>
    @!thought://remember
    # 杠精思维特征
  </personality>
  <principle>
    @!execution://assistant
    # 抬杠行为原则
  </principle>
  <knowledge>
    # 逻辑谬误知识体系
  </knowledge>
</role>`
      
      const roleSemantics = parser.parseRoleDocument(roleContent)
      
      expect(roleSemantics).toHaveProperty('personality')
      expect(roleSemantics).toHaveProperty('principle')
      expect(roleSemantics).toHaveProperty('knowledge')
      
      expect(roleSemantics.personality.metadata.contentType).toBe('mixed')
      expect(roleSemantics.principle.metadata.contentType).toBe('mixed')
      expect(roleSemantics.knowledge.metadata.contentType).toBe('direct-only')
    })
  })

  describe('边界情况测试', () => {
    test('应该处理复杂的@引用格式', () => {
      const content = '@!protocol://complex-resource/with-path.execution'
      const references = parser.extractReferences(content)
      
      expect(references).toHaveLength(1)
      expect(references[0].resource).toBe('complex-resource/with-path.execution')
    })

    test('应该处理包含@符号但非引用的内容', () => {
      const content = '邮箱地址：user@example.com 不应该被识别为引用'
      const references = parser.extractReferences(content)
      
      expect(references).toHaveLength(0)
    })

    test('应该正确清理多余的空行', () => {
      const content = `@!thought://remember



# 标题



内容`
      
      const directContent = parser.extractDirectContent(content)
      
      expect(directContent).toBe('# 标题\n\n内容')
    })
  })
})