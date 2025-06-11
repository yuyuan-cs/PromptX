const SemanticRenderer = require('../../../lib/core/resource/SemanticRenderer')

describe('SemanticRenderer', () => {
  let renderer
  let mockResourceManager

  beforeEach(() => {
    renderer = new SemanticRenderer()
    mockResourceManager = {
      resolve: jest.fn()
    }
  })

  describe('renderSemanticContent', () => {
    test('应该保持@引用的位置语义', async () => {
      // Arrange
      const tagSemantics = {
        fullSemantics: 'intro @!thought://A middle @!thought://B end',
        references: [
          {
            fullMatch: '@!thought://A',
            priority: '!',
            protocol: 'thought',
            resource: 'A',
            position: 6,
            isRequired: true,
            isOptional: false
          },
          {
            fullMatch: '@!thought://B',
            priority: '!',
            protocol: 'thought',
            resource: 'B',
            position: 32,
            isRequired: true,
            isOptional: false
          }
        ]
      }

      mockResourceManager.resolve
        .mockResolvedValueOnce({ success: true, content: '<thought>[A的内容]</thought>' })
        .mockResolvedValueOnce({ success: true, content: '<thought>[B的内容]</thought>' })

      // Act
      const result = await renderer.renderSemanticContent(tagSemantics, mockResourceManager)

      // Assert
      expect(result).toContain('[A的内容]')
      expect(result).toContain('[B的内容]')
      expect(mockResourceManager.resolve).toHaveBeenCalledTimes(2)
    })

    test('应该处理复杂的@引用布局', async () => {
      // Arrange
      const content = `# 标题
@!thought://base

## 子标题  
- 列表项1
@!execution://action
- 列表项2`

      const tagSemantics = {
        fullSemantics: content,
        references: [
          {
            fullMatch: '@!thought://base',
            priority: '!',
            protocol: 'thought',
            resource: 'base',
            position: 5,
            isRequired: true,
            isOptional: false
          },
          {
            fullMatch: '@!execution://action',
            priority: '!',
            protocol: 'execution',
            resource: 'action',
            position: 40,
            isRequired: true,
            isOptional: false
          }
        ]
      }

      mockResourceManager.resolve
        .mockResolvedValueOnce({ success: true, content: '<thought>基础思维框架内容</thought>' })
        .mockResolvedValueOnce({ success: true, content: '<execution>执行动作框架内容</execution>' })

      // Act
      const result = await renderer.renderSemanticContent(tagSemantics, mockResourceManager)

      // Assert
      expect(result).toContain('基础思维框架内容')
      expect(result).toContain('执行动作框架内容')
      expect(result).toContain('# 标题')
      expect(result).toContain('- 列表项1')
      expect(result).toContain('- 列表项2')
    })

    test('应该优雅处理引用解析失败', async () => {
      // Arrange
      const tagSemantics = {
        fullSemantics: 'content with @!thought://missing reference',
        references: [
          {
            fullMatch: '@!thought://missing',
            priority: '!',
            protocol: 'thought',
            resource: 'missing',
            position: 13,
            isRequired: true,
            isOptional: false
          }
        ]
      }

      mockResourceManager.resolve.mockResolvedValueOnce({ success: false, error: new Error('Resource not found') })

      // Act
      const result = await renderer.renderSemanticContent(tagSemantics, mockResourceManager)

      // Assert
      expect(result).toContain('content with <!-- 引用解析失败: @!thought://missing')
      expect(result).toContain('Resource not found')
      expect(result).toContain('reference')
    })

    test('应该处理空的references数组', async () => {
      // Arrange
      const tagSemantics = {
        fullSemantics: 'simple content without references',
        references: []
      }

      // Act
      const result = await renderer.renderSemanticContent(tagSemantics, mockResourceManager)

      // Assert
      expect(result).toBe('simple content without references')
      expect(mockResourceManager.resolve).not.toHaveBeenCalled()
    })

    test('应该处理包含换行符的内容', async () => {
      // Arrange
      const tagSemantics = {
        fullSemantics: `第一段内容
@!thought://multiline

第二段内容`,
        references: [
          {
            fullMatch: '@!thought://multiline',
            priority: '!',
            protocol: 'thought',
            resource: 'multiline',
            position: 6,
            isRequired: true,
            isOptional: false
          }
        ]
      }

      mockResourceManager.resolve.mockResolvedValueOnce({ 
        success: true, 
        content: `<thought>插入的
多行
内容</thought>` 
      })

      // Act
      const result = await renderer.renderSemanticContent(tagSemantics, mockResourceManager)

      // Assert
      expect(result).toContain('第一段内容')
      expect(result).toContain('插入的')
      expect(result).toContain('多行')
      expect(result).toContain('内容')
      expect(result).toContain('第二段内容')
    })

    test('应该按位置顺序处理引用', async () => {
      // Arrange
      const tagSemantics = {
        fullSemantics: '@!thought://second @!thought://first',
        references: [
          {
            fullMatch: '@!thought://first',
            priority: '!',
            protocol: 'thought',
            resource: 'first',
            position: 19,
            isRequired: true,
            isOptional: false
          },
          {
            fullMatch: '@!thought://second',
            priority: '!',
            protocol: 'thought',
            resource: 'second',
            position: 0,
            isRequired: true,
            isOptional: false
          }
        ]
      }

      mockResourceManager.resolve
        .mockResolvedValueOnce({ success: true, content: '<thought>SECOND</thought>' })
        .mockResolvedValueOnce({ success: true, content: '<thought>FIRST</thought>' })

      // Act
      const result = await renderer.renderSemanticContent(tagSemantics, mockResourceManager)

      // Assert
      expect(result).toContain('SECOND')
      expect(result).toContain('FIRST')
      expect(mockResourceManager.resolve).toHaveBeenCalledTimes(2)
    })
  })
})