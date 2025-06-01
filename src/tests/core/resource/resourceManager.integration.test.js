const ResourceManager = require('../../../lib/core/resource/resourceManager')
const fs = require('fs').promises
const path = require('path')
const os = require('os')

describe('ResourceManager - Integration Tests', () => {
  let manager

  beforeEach(() => {
    manager = new ResourceManager()
  })

  describe('基础功能测试', () => {
    test('应该能初始化ResourceManager', async () => {
      await manager.initialize()
      expect(manager.initialized).toBe(true)
    })

    test('应该加载统一资源注册表', async () => {
      await manager.initialize()
      expect(manager.registry).toBeDefined()
      expect(manager.registry.protocols).toBeDefined()
    })

    test('应该注册协议处理器', async () => {
      await manager.initialize()
      expect(manager.protocolHandlers.size).toBeGreaterThan(0)
      expect(manager.protocolHandlers.has('package')).toBe(true)
      expect(manager.protocolHandlers.has('project')).toBe(true)
      expect(manager.protocolHandlers.has('prompt')).toBe(true)
    })
  })

  describe('资源解析功能', () => {
    test('应该处理无效的资源URL格式', async () => {
      const result = await manager.resolve('invalid-reference')

      expect(result.success).toBe(false)
      expect(result.error.message).toContain('无效的资源URL格式')
    })

    test('应该处理未注册的协议', async () => {
      const result = await manager.resolve('@unknown://test')

      expect(result.success).toBe(false)
      expect(result.error.message).toContain('未注册的协议')
    })

    test('应该解析package协议资源', async () => {
      const result = await manager.resolve('@package://package.json')

      expect(result.success).toBe(true)
      expect(result.metadata.protocol).toBe('package')
    })

    test('应该解析prompt协议资源', async () => {
      const result = await manager.resolve('@prompt://protocols')

      // prompt协议可能找不到匹配文件，但应该不抛出解析错误
      if (!result.success) {
        expect(result.error.message).toContain('没有找到匹配的文件')
      } else {
        expect(result.metadata.protocol).toBe('prompt')
      }
    })
  })

  describe('工具方法', () => {
    test('应该获取可用协议列表', async () => {
      await manager.initialize()
      const protocols = manager.getAvailableProtocols()

      expect(Array.isArray(protocols)).toBe(true)
      expect(protocols.length).toBeGreaterThan(0)
      expect(protocols).toContain('package')
      expect(protocols).toContain('prompt')
    })

    test('应该获取协议信息', async () => {
      await manager.initialize()
      const info = manager.getProtocolInfo('package')

      expect(info).toBeDefined()
      expect(info.name).toBe('package')
    })

    test('应该获取协议注册表', async () => {
      await manager.initialize()
      const registry = manager.getProtocolRegistry('prompt')

      if (registry) {
        expect(typeof registry).toBe('object')
      }
    })
  })

  describe('查询参数解析', () => {
    test('应该解析带查询参数的资源', async () => {
      const result = await manager.resolve('@package://package.json?key=name')

      expect(result.success).toBe(true)
      expect(result.metadata.protocol).toBe('package')
    })

    test('应该解析加载语义', async () => {
      const result = await manager.resolve('@!package://package.json')

      expect(result.success).toBe(true)
      expect(result.metadata.protocol).toBe('package')
      expect(result.metadata.loadingSemantic).toBe('@!')
    })
  })

  describe('错误处理', () => {
    test('应该正确处理资源不存在的情况', async () => {
      const result = await manager.resolve('@package://nonexistent.json')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    test('未初始化时应该抛出错误', async () => {
      const uninitializedManager = new ResourceManager()
      
      try {
        await uninitializedManager.getProtocolRegistry('package')
        fail('应该抛出错误')
      } catch (error) {
        expect(error.message).toContain('ResourceManager未初始化')
      }
    })
  })
})

