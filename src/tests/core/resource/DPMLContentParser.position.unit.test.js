const DPMLContentParser = require('../../../lib/core/resource/DPMLContentParser')

describe('DPMLContentParser - Position Extension', () => {
  let parser

  beforeEach(() => {
    parser = new DPMLContentParser()
  })

  describe('extractReferencesWithPosition', () => {
    test('应该提取引用的位置信息', () => {
      // Arrange
      const content = 'intro @!thought://A middle @!thought://B end'

      // Act
      const references = parser.extractReferencesWithPosition(content)

      // Assert
      expect(references).toHaveLength(2)
      expect(references[0]).toEqual({
        fullMatch: '@!thought://A',
        priority: '!',
        protocol: 'thought',
        resource: 'A',
        position: 6,
        isRequired: true,
        isOptional: false
      })
      expect(references[1]).toEqual({
        fullMatch: '@!thought://B',
        priority: '!',
        protocol: 'thought',
        resource: 'B',
        position: 27,
        isRequired: true,
        isOptional: false
      })
    })

    test('应该按位置排序返回引用', () => {
      // Arrange
      const content = '@!thought://second @!thought://first'

      // Act
      const references = parser.extractReferencesWithPosition(content)

      // Assert
      expect(references).toHaveLength(2)
      expect(references[0].resource).toBe('second')
      expect(references[0].position).toBe(0)
      expect(references[1].resource).toBe('first')
      expect(references[1].position).toBe(19)
    })

    test('应该处理复杂布局中的位置信息', () => {
      // Arrange
      const content = `# 标题
@!thought://base

## 子标题  
- 列表项1
@!execution://action
- 列表项2`

      // Act
      const references = parser.extractReferencesWithPosition(content)

      // Assert
      expect(references).toHaveLength(2)
      
      const baseRef = references.find(ref => ref.resource === 'base')
      const actionRef = references.find(ref => ref.resource === 'action')
      
      expect(baseRef.position).toBe(5) // 在"# 标题\n"之后
      expect(actionRef.position).toBeGreaterThan(baseRef.position)
    })

    test('应该处理可选引用', () => {
      // Arrange
      const content = 'content @?optional://resource more'

      // Act
      const references = parser.extractReferencesWithPosition(content)

      // Assert
      expect(references).toHaveLength(1)
      expect(references[0]).toEqual({
        fullMatch: '@?optional://resource',
        priority: '?',
        protocol: 'optional',
        resource: 'resource',
        position: 8,
        isRequired: false,
        isOptional: true
      })
    })

    test('应该处理普通引用（无优先级标记）', () => {
      // Arrange
      const content = 'content @normal://resource more'

      // Act
      const references = parser.extractReferencesWithPosition(content)

      // Assert
      expect(references).toHaveLength(1)
      expect(references[0]).toEqual({
        fullMatch: '@normal://resource',
        priority: '',
        protocol: 'normal',
        resource: 'resource',
        position: 8,
        isRequired: false,
        isOptional: false
      })
    })

    test('应该处理空内容', () => {
      // Arrange
      const content = ''

      // Act
      const references = parser.extractReferencesWithPosition(content)

      // Assert
      expect(references).toEqual([])
    })

    test('应该处理没有引用的内容', () => {
      // Arrange
      const content = '这是一段没有任何引用的普通文本内容'

      // Act
      const references = parser.extractReferencesWithPosition(content)

      // Assert
      expect(references).toEqual([])
    })

    test('应该处理多行内容中的引用位置', () => {
      // Arrange
      const content = `第一行内容
@!thought://first
第二行内容
@!thought://second
第三行内容`

      // Act
      const references = parser.extractReferencesWithPosition(content)

      // Assert
      expect(references).toHaveLength(2)
      expect(references[0].resource).toBe('first')
      expect(references[0].position).toBe(6) // 在"第一行内容\n"之后
      expect(references[1].resource).toBe('second')
      expect(references[1].position).toBeGreaterThan(references[0].position)
    })
  })

  describe('parseTagContent - 位置信息集成', () => {
    test('应该在parseTagContent中包含位置信息', () => {
      // Arrange
      const content = 'intro @!thought://A middle @!thought://B end'

      // Act
      const result = parser.parseTagContent(content, 'personality')

      // Assert
      expect(result.references).toHaveLength(2)
      expect(result.references[0].position).toBe(6)
      expect(result.references[1].position).toBe(27)
    })
  })
})