const SemanticRenderer = require('../../../lib/core/resource/SemanticRenderer')
const DPMLContentParser = require('../../../lib/core/resource/DPMLContentParser')

describe('DPML语义渲染集成测试', () => {
  let renderer
  let parser
  let mockResourceManager

  beforeEach(() => {
    renderer = new SemanticRenderer()
    parser = new DPMLContentParser()
    mockResourceManager = {
      resolve: jest.fn()
    }
  })

  describe('完整的语义渲染流程', () => {
    test('应该实现从解析到渲染的完整语义保持', async () => {
      // Arrange - 模拟一个包含@引用的personality标签
      const personalityContent = `@!thought://remember

# 网络杠精思维模式
## 核心思维特征
- 挑刺思维：看到任何观点都先找问题和漏洞
- 抬杠本能：天生反对派，习惯性质疑一切表述

@!thought://recall

## 认知偏好模式
- 逆向思考优先：遇到任何论点先想如何反驳
- 细节放大镜效应：善于将小问题放大成大问题`

      // 模拟资源解析结果
      mockResourceManager.resolve
        .mockResolvedValueOnce({ 
          success: true, 
          content: `<thought>## 记忆基础思维
学会从过往经验中提取模式和规律</thought>` 
        })
        .mockResolvedValueOnce({ 
          success: true, 
          content: `<thought>## 回忆扩展思维
能够快速调用相关的历史案例和背景知识</thought>` 
        })

      // Act - 解析然后渲染
      const tagSemantics = parser.parseTagContent(personalityContent, 'personality')
      const renderedContent = await renderer.renderSemanticContent(tagSemantics, mockResourceManager)

      // Assert - 验证语义完整性
      expect(renderedContent).toContain('## 记忆基础思维')
      expect(renderedContent).toContain('学会从过往经验中提取模式和规律')
      expect(renderedContent).toContain('# 网络杠精思维模式')
      expect(renderedContent).toContain('## 回忆扩展思维')
      expect(renderedContent).toContain('能够快速调用相关的历史案例和背景知识')
      expect(renderedContent).toContain('## 认知偏好模式')
      
      // 验证位置语义：remember内容在最前面
      const rememberIndex = renderedContent.indexOf('## 记忆基础思维')
      const coreThinkingIndex = renderedContent.indexOf('# 网络杠精思维模式')
      const recallIndex = renderedContent.indexOf('## 回忆扩展思维')
      const cognitiveIndex = renderedContent.indexOf('## 认知偏好模式')
      
      expect(rememberIndex).toBeLessThan(coreThinkingIndex)
      expect(coreThinkingIndex).toBeLessThan(recallIndex)
      expect(recallIndex).toBeLessThan(cognitiveIndex)
    })

    test('应该处理引用解析失败的情况', async () => {
      // Arrange
      const content = `intro @!thought://missing middle @!thought://working end`
      
      mockResourceManager.resolve
        .mockResolvedValueOnce({ success: false, error: new Error('Resource not found') })
        .mockResolvedValueOnce({ success: true, content: '<thought>[working content]</thought>' })

      // Act
      const tagSemantics = parser.parseTagContent(content, 'test')
      const renderedContent = await renderer.renderSemanticContent(tagSemantics, mockResourceManager)

      // Assert
      expect(renderedContent).toContain('<!-- 引用解析失败: @!thought://missing')
      expect(renderedContent).toContain('[working content]')
    })

    test('应该处理复杂的嵌套结构', async () => {
      // Arrange
      const complexContent = `# 主标题
@!thought://intro

## 第一部分
这是第一部分的内容
@!execution://part1

### 子部分
- 列表项 1
- 列表项 2
@!thought://detail

## 第二部分
@!execution://part2
结束内容`

      mockResourceManager.resolve
        .mockResolvedValueOnce({ success: true, content: '<thought>引言思维内容</thought>' })
        .mockResolvedValueOnce({ success: true, content: '<execution>第一部分执行框架</execution>' })
        .mockResolvedValueOnce({ success: true, content: '<thought>详细思维补充</thought>' })
        .mockResolvedValueOnce({ success: true, content: '<execution>第二部分执行框架</execution>' })

      // Act
      const tagSemantics = parser.parseTagContent(complexContent, 'knowledge')
      const renderedContent = await renderer.renderSemanticContent(tagSemantics, mockResourceManager)

      // Assert
      expect(renderedContent).toContain('# 主标题')
      expect(renderedContent).toContain('引言思维内容')
      expect(renderedContent).toContain('第一部分执行框架')
      expect(renderedContent).toContain('详细思维补充')
      expect(renderedContent).toContain('第二部分执行框架')
      expect(renderedContent).toContain('结束内容')
      
      // 验证结构完整性
      expect(renderedContent.split('\n').length).toBeGreaterThan(10)
    })

    test('应该保持原始内容的格式', async () => {
      // Arrange
      const formattedContent = `# 标题

@!thought://base

## 子标题

- 项目1
- 项目2

@!thought://list`

      mockResourceManager.resolve
        .mockResolvedValueOnce({ success: true, content: '<thought>基础内容</thought>' })
        .mockResolvedValueOnce({ success: true, content: '<thought>列表补充</thought>' })

      // Act
      const tagSemantics = parser.parseTagContent(formattedContent, 'principle')
      const renderedContent = await renderer.renderSemanticContent(tagSemantics, mockResourceManager)

      // Assert
      // 验证格式保持：空行、标题层级、列表格式
      expect(renderedContent).toContain('# 标题')
      expect(renderedContent).toContain('基础内容')
      expect(renderedContent).toContain('## 子标题')
      expect(renderedContent).toContain('列表补充')
      expect(renderedContent).toContain('- 项目1')
      expect(renderedContent).toContain('- 项目2')
      expect(renderedContent).toContain('列表补充')
    })
  })

  describe('边界情况测试', () => {
    test('应该处理空标签内容', async () => {
      // Arrange
      const emptyContent = ''

      // Act
      const tagSemantics = parser.parseTagContent(emptyContent, 'empty')
      const renderedContent = await renderer.renderSemanticContent(tagSemantics, mockResourceManager)

      // Assert
      expect(renderedContent).toBe('')
      expect(mockResourceManager.resolve).not.toHaveBeenCalled()
    })

    test('应该处理只有引用的内容', async () => {
      // Arrange
      const onlyRefsContent = '@!thought://one @!thought://two'

      mockResourceManager.resolve
        .mockResolvedValueOnce({ success: true, content: '<thought>First content</thought>' })
        .mockResolvedValueOnce({ success: true, content: '<thought>Second content</thought>' })

      // Act
      const tagSemantics = parser.parseTagContent(onlyRefsContent, 'refs-only')
      const renderedContent = await renderer.renderSemanticContent(tagSemantics, mockResourceManager)

      // Assert
      expect(renderedContent).toContain('First content')
      expect(renderedContent).toContain('Second content')
    })

    test('应该处理没有引用的内容', async () => {
      // Arrange
      const noRefsContent = '这是纯文本内容，没有任何引用'

      // Act
      const tagSemantics = parser.parseTagContent(noRefsContent, 'no-refs')
      const renderedContent = await renderer.renderSemanticContent(tagSemantics, mockResourceManager)

      // Assert
      expect(renderedContent).toBe('这是纯文本内容，没有任何引用')
      expect(mockResourceManager.resolve).not.toHaveBeenCalled()
    })
  })

  describe('性能和稳定性测试', () => {
    test('应该处理大量引用', async () => {
      // Arrange
      const manyRefsContent = Array.from({ length: 10 }, (_, i) => 
        `section${i} @!thought://ref${i}`
      ).join(' ')

      // 模拟所有引用都能解析成功
      for (let i = 0; i < 10; i++) {
        mockResourceManager.resolve.mockResolvedValueOnce({ 
          success: true, 
          content: `<thought>content${i}</thought>` 
        })
      }

      // Act
      const tagSemantics = parser.parseTagContent(manyRefsContent, 'many-refs')
      const renderedContent = await renderer.renderSemanticContent(tagSemantics, mockResourceManager)

      // Assert
      expect(mockResourceManager.resolve).toHaveBeenCalledTimes(10)
      for (let i = 0; i < 10; i++) {
        expect(renderedContent).toContain(`content${i}`)
      }
    })

    test('应该处理混合成功和失败的引用解析', async () => {
      // Arrange
      const mixedContent = '@!thought://success @!thought://fail @!thought://success2'

      mockResourceManager.resolve
        .mockResolvedValueOnce({ success: true, content: '<thought>成功内容1</thought>' })
        .mockResolvedValueOnce({ success: false, error: new Error('解析失败') })
        .mockResolvedValueOnce({ success: true, content: '<thought>成功内容2</thought>' })

      // Act
      const tagSemantics = parser.parseTagContent(mixedContent, 'mixed')
      const renderedContent = await renderer.renderSemanticContent(tagSemantics, mockResourceManager)

      // Assert
      expect(renderedContent).toContain('成功内容1')
      expect(renderedContent).toContain('<!-- 引用解析失败: @!thought://fail')
      expect(renderedContent).toContain('解析失败')
      expect(renderedContent).toContain('成功内容2')
    })
  })
})