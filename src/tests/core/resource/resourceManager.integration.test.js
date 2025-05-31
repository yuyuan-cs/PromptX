const ResourceManager = require('../../../lib/core/resource/resourceManager');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

describe('ResourceManager - Integration Tests', () => {
  let manager;
  let tempDir;

  beforeAll(async () => {
    // 创建临时测试目录
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'promptx-test-'));
    
    // 创建测试文件
    await fs.writeFile(
      path.join(tempDir, 'test.md'),
      '# 测试文件\n\n这是一个测试文件。\n第三行内容。\n第四行内容。'
    );
    
    await fs.writeFile(
      path.join(tempDir, 'nested.md'),
      'nested content'
    );

    // 创建子目录和更多测试文件
    const subDir = path.join(tempDir, 'subdir');
    await fs.mkdir(subDir);
    await fs.writeFile(
      path.join(subDir, 'sub-test.md'),
      'subdirectory content'
    );
  });

  afterAll(async () => {
    // 清理临时目录
    await fs.rm(tempDir, { recursive: true });
  });

  beforeEach(() => {
    manager = new ResourceManager({
      workingDirectory: tempDir,
      enableCache: true
    });
  });

  describe('完整的资源解析流程', () => {
    test('应该解析并加载本地文件', async () => {
      const result = await manager.resolve('@file://test.md');
      
      expect(result.success).toBe(true);
      expect(result.content).toContain('测试文件');
      expect(result.metadata.protocol).toBe('file');
      expect(result.sources).toContain('test.md');
    });

    test('应该处理带查询参数的文件加载', async () => {
      const result = await manager.resolve('@file://test.md?line=2-3');
      
      expect(result.success).toBe(true);
      expect(result.content).not.toContain('# 测试文件');
      expect(result.content).toContain('这是一个测试文件');
      expect(result.content).not.toContain('第三行内容');
      expect(result.content).not.toContain('第四行内容');
    });

    test('应该处理通配符文件模式', async () => {
      const result = await manager.resolve('@file://*.md');
      
      expect(result.success).toBe(true);
      expect(result.content).toContain('test.md');
      expect(result.content).toContain('nested.md');
    });
  });

  describe('内置协议集成', () => {
    test('应该处理prompt协议的注册表解析', async () => {
      // 模拟prompt协议解析
      const mockProtocolFile = path.join(tempDir, 'protocols.md');
      await fs.writeFile(mockProtocolFile, '# PromptX 协议\n\nDPML协议说明');
      
      // 注册测试协议
      manager.registry.register('test-prompt', {
        name: 'test-prompt',
        description: '测试提示词协议',
        registry: {
          'protocols': `@file://${mockProtocolFile}`
        }
      });
      
      const result = await manager.resolve('@test-prompt://protocols');
      
      expect(result.success).toBe(true);
      expect(result.content).toContain('PromptX 协议');
      expect(result.content).toContain('DPML协议说明');
    });

    test('应该处理嵌套引用解析', async () => {
      // 创建指向嵌套文件的引用文件
      const refFile = path.join(tempDir, 'reference.md');
      await fs.writeFile(refFile, '@file://nested.md');
      
      manager.registry.register('test-nested', {
        registry: {
          'ref': `@file://${refFile}`
        }
      });

      const result = await manager.resolve('@test-nested://ref');
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('nested content');
    });
  });

  describe('缓存机制', () => {
    test('应该缓存已加载的资源', async () => {
      const firstResult = await manager.resolve('@file://test.md');
      const secondResult = await manager.resolve('@file://test.md');
      
      expect(firstResult.content).toBe(secondResult.content);
      expect(firstResult.success).toBe(true);
      expect(secondResult.success).toBe(true);
    });

    test('应该清除缓存', async () => {
      await manager.resolve('@file://test.md');
      expect(manager.cache.size).toBeGreaterThan(0);
      
      manager.clearCache();
      expect(manager.cache.size).toBe(0);
    });
  });

  describe('批量资源解析', () => {
    test('应该批量解析多个资源', async () => {
      const refs = [
        '@file://test.md',
        '@file://nested.md'
      ];
      
      const results = await manager.resolveMultiple(refs);
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[0].content).toContain('测试文件');
      expect(results[1].content).toContain('nested content');
    });
  });

  describe('错误处理', () => {
    test('应该处理文件不存在的情况', async () => {
      const result = await manager.resolve('@file://nonexistent.md');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('Failed to read file');
    });

    test('应该处理无效的协议', async () => {
      const result = await manager.resolve('@unknown://test');
      
      expect(result.success).toBe(false);
      expect(result.error.message).toContain('Unknown protocol');
    });

    test('应该处理无效的资源引用语法', async () => {
      const result = await manager.resolve('invalid-reference');
      
      expect(result.success).toBe(false);
      expect(result.error.message).toContain('Invalid resource reference syntax');
    });
  });

  describe('验证功能', () => {
    test('应该验证有效的资源引用', () => {
      expect(manager.isValidReference('@file://test.md')).toBe(true);
      expect(manager.isValidReference('@prompt://protocols')).toBe(true);
    });

    test('应该拒绝无效的资源引用', () => {
      expect(manager.isValidReference('invalid')).toBe(false);
      expect(manager.isValidReference('@unknown://test')).toBe(false);
    });
  });

  describe('工具功能', () => {
    test('应该列出可用协议', () => {
      const protocols = manager.listProtocols();
      
      expect(protocols).toContain('file');
      expect(protocols).toContain('prompt');
      expect(protocols).toContain('memory');
    });

    test('应该获取注册表信息', () => {
      const info = manager.getRegistryInfo('prompt');
      
      expect(info).toBeDefined();
      expect(info.name).toBe('prompt');
    });
  });
}); 