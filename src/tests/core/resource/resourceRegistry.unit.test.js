const ResourceRegistry = require('../../../lib/core/resource/resourceRegistry')

describe('ResourceRegistry - New Architecture Unit Tests', () => {
  let registry

  beforeEach(() => {
    registry = new ResourceRegistry()
  })

  describe('核心注册功能', () => {
    test('应该注册和获取资源', () => {
      const resourceId = 'role:java-developer'
      const reference = '@package://prompt/domain/java-developer/java-developer.role.md'

      registry.register(resourceId, reference)

      expect(registry.get(resourceId)).toBe(reference)
      expect(registry.has(resourceId)).toBe(true)
      expect(registry.size).toBe(1)
    })

    test('应该处理多个资源注册', () => {
      const resources = [
        ['role:java-developer', '@package://prompt/domain/java-developer/java-developer.role.md'],
        ['thought:analysis', '@package://prompt/core/thought/analysis.thought.md'],
        ['execution:code-review', '@package://prompt/core/execution/code-review.execution.md']
      ]

      resources.forEach(([id, ref]) => registry.register(id, ref))

      expect(registry.size).toBe(3)
      resources.forEach(([id, ref]) => {
        expect(registry.get(id)).toBe(ref)
        expect(registry.has(id)).toBe(true)
      })
    })

    test('应该覆盖现有注册', () => {
      const resourceId = 'role:test'
      const oldReference = '@package://old.md'
      const newReference = '@package://new.md'

      registry.register(resourceId, oldReference)
      expect(registry.get(resourceId)).toBe(oldReference)

      registry.register(resourceId, newReference)
      expect(registry.get(resourceId)).toBe(newReference)
      expect(registry.size).toBe(1) // Size should not change
    })

    test('应该处理不存在的资源', () => {
      expect(registry.get('non-existent')).toBeUndefined()
      expect(registry.has('non-existent')).toBe(false)
    })
  })

  describe('注册表操作', () => {
    beforeEach(() => {
      registry.register('role:assistant', '@package://assistant.role.md')
      registry.register('thought:analysis', '@package://analysis.thought.md')
      registry.register('execution:review', '@package://review.execution.md')
    })

    test('应该返回所有资源键', () => {
      const keys = registry.keys()
      expect(keys).toHaveLength(3)
      expect(keys).toContain('role:assistant')
      expect(keys).toContain('thought:analysis')
      expect(keys).toContain('execution:review')
    })

    test('应该返回所有条目', () => {
      const entries = registry.entries()
      expect(entries).toHaveLength(3)
      expect(entries).toContainEqual(['role:assistant', '@package://assistant.role.md'])
      expect(entries).toContainEqual(['thought:analysis', '@package://analysis.thought.md'])
      expect(entries).toContainEqual(['execution:review', '@package://review.execution.md'])
    })

    test('应该清空注册表', () => {
      expect(registry.size).toBe(3)
      
      registry.clear()
      
      expect(registry.size).toBe(0)
      expect(registry.keys()).toHaveLength(0)
      expect(registry.has('role:assistant')).toBe(false)
    })
  })

  describe('边界情况处理', () => {
    test('应该处理空字符串资源ID', () => {
      registry.register('', '@package://empty.md')
      expect(registry.get('')).toBe('@package://empty.md')
      expect(registry.has('')).toBe(true)
    })

    test('应该处理特殊字符的资源ID', () => {
      const specialId = 'role:java-developer@v2.0'
      const reference = '@package://special.md'
      
      registry.register(specialId, reference)
      expect(registry.get(specialId)).toBe(reference)
    })

    test('应该处理大量注册', () => {
      const count = 1000
      for (let i = 0; i < count; i++) {
        registry.register(`resource:${i}`, `@package://resource-${i}.md`)
      }

      expect(registry.size).toBe(count)
      expect(registry.get('resource:500')).toBe('@package://resource-500.md')
    })
  })

  describe('数据类型安全', () => {
    test('应该接受字符串类型的ID和引用', () => {
      // Valid strings
      registry.register('valid:id', 'valid-reference')
      expect(registry.get('valid:id')).toBe('valid-reference')
    })

    test('应该严格按键类型匹配', () => {
      // Number key
      registry.register(123, 'number-key-value')
      expect(registry.get(123)).toBe('number-key-value')
      expect(registry.get('123')).toBeUndefined() // String '123' ≠ Number 123

      // String key
      registry.register('456', 'string-key-value')
      expect(registry.get('456')).toBe('string-key-value')
      expect(registry.get(456)).toBeUndefined() // Number 456 ≠ String '456'
    })

    test('应该保持原始数据类型', () => {
      const id = 'role:test'
      const reference = '@package://test.md'
      
      registry.register(id, reference)
      
      expect(typeof registry.get(id)).toBe('string')
      expect(registry.get(id)).toBe(reference)
    })
  })
})