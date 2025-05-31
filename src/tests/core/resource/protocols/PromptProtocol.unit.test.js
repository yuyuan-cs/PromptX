const PromptProtocol = require('../../../../lib/core/resource/protocols/PromptProtocol');
const PackageProtocol = require('../../../../lib/core/resource/protocols/PackageProtocol');
const { QueryParams } = require('../../../../lib/core/resource/types');

describe('PromptProtocol', () => {
  let promptProtocol;
  let mockPackageProtocol;

  beforeEach(() => {
    promptProtocol = new PromptProtocol();
    
    // 创建模拟的 PackageProtocol
    mockPackageProtocol = {
      getPackageRoot: jest.fn().mockResolvedValue('/mock/package/root'),
      loadContent: jest.fn(),
      exists: jest.fn()
    };
    
    promptProtocol.setPackageProtocol(mockPackageProtocol);
  });

  afterEach(() => {
    promptProtocol.clearCache();
  });

  describe('基础功能', () => {
    test('应该正确初始化协议', () => {
      expect(promptProtocol.name).toBe('prompt');
      expect(promptProtocol.registry).toBeInstanceOf(Map);
      expect(promptProtocol.registry.size).toBeGreaterThan(0);
    });

    test('应该提供协议信息', () => {
      const info = promptProtocol.getProtocolInfo();
      
      expect(info.name).toBe('prompt');
      expect(info.description).toContain('PromptX内置提示词资源协议');
      expect(info.location).toBe('prompt://{resource_id}');
      expect(info.availableResources).toContain('protocols');
      expect(info.availableResources).toContain('core');
      expect(info.availableResources).toContain('domain');
      expect(info.availableResources).toContain('bootstrap');
    });

    test('应该设置包协议依赖', () => {
      const newMockPackage = { test: 'protocol' };
      promptProtocol.setPackageProtocol(newMockPackage);
      expect(promptProtocol.packageProtocol).toBe(newMockPackage);
    });

    test('应该提供支持的查询参数', () => {
      const params = promptProtocol.getSupportedParams();
      expect(params.merge).toContain('是否合并多个文件内容');
      expect(params.separator).toContain('文件间分隔符');
      expect(params.include_filename).toContain('是否包含文件名标题');
    });
  });

  describe('路径验证', () => {
    test('应该验证有效的资源路径', () => {
      expect(promptProtocol.validatePath('protocols')).toBe(true);
      expect(promptProtocol.validatePath('core')).toBe(true);
      expect(promptProtocol.validatePath('domain')).toBe(true);
      expect(promptProtocol.validatePath('bootstrap')).toBe(true);
    });

    test('应该拒绝无效的资源路径', () => {
      expect(promptProtocol.validatePath('invalid')).toBe(false);
      expect(promptProtocol.validatePath('unknown')).toBe(false);
      expect(promptProtocol.validatePath('')).toBe(false);
      expect(promptProtocol.validatePath(null)).toBe(false);
    });
  });

  describe('路径解析', () => {
    test('应该解析有效的资源路径', async () => {
      const resolved = await promptProtocol.resolvePath('protocols');
      expect(resolved).toBe('@package://prompt/protocol/**/*.md');
    });

    test('应该解析所有注册的资源', async () => {
      for (const resourceId of promptProtocol.registry.keys()) {
        const resolved = await promptProtocol.resolvePath(resourceId);
        expect(resolved).toMatch(/@package:\/\//);
      }
    });

    test('应该拒绝未注册的资源', async () => {
      await expect(promptProtocol.resolvePath('nonexistent'))
        .rejects.toThrow('未找到 prompt 资源: nonexistent');
    });
  });

  describe('单个文件加载', () => {
    test('应该加载单个文件', async () => {
      const mockContent = '# Test Content\n\nThis is test content.';
      mockPackageProtocol.loadContent.mockResolvedValue({
        content: mockContent,
        metadata: { path: '/test/path' }
      });

      const content = await promptProtocol.loadSingleFile('@package://bootstrap.md');
      
      expect(content).toBe(mockContent);
      expect(mockPackageProtocol.loadContent).toHaveBeenCalledWith('bootstrap.md', undefined);
    });

    test('应该处理加载错误', async () => {
      mockPackageProtocol.loadContent.mockRejectedValue(new Error('File not found'));

      await expect(promptProtocol.loadSingleFile('@package://nonexistent.md'))
        .rejects.toThrow('加载单个文件失败');
    });
  });

  describe('多个文件加载', () => {
    test('应该加载多个文件并合并', async () => {
      const fs = require('fs').promises;
      const glob = require('glob');
      
      // 模拟 glob 返回文件列表
      const mockFiles = [
        '/mock/package/root/prompt/protocol/dpml.protocol.md',
        '/mock/package/root/prompt/protocol/pateoas.protocol.md'
      ];
      
      jest.doMock('glob', () => ({
        ...jest.requireActual('glob'),
        __esModule: true,
        default: jest.fn().mockImplementation((pattern, options, callback) => {
          if (typeof options === 'function') {
            callback = options;
            options = {};
          }
          callback(null, mockFiles);
        })
      }));

      // 模拟文件读取
      jest.spyOn(fs, 'readFile').mockImplementation((filePath) => {
        if (filePath.includes('dpml.protocol.md')) {
          return Promise.resolve('# DPML Protocol\n\nDPML content...');
        } else if (filePath.includes('pateoas.protocol.md')) {
          return Promise.resolve('# PATEOAS Protocol\n\nPATEOAS content...');
        }
        return Promise.reject(new Error('File not found'));
      });

      const content = await promptProtocol.loadMultipleFiles('@package://prompt/protocol/**/*.md');
      
      expect(content).toContain('# DPML Protocol');
      expect(content).toContain('# PATEOAS Protocol');
      expect(content).toContain('prompt/protocol/dpml.protocol.md');
      expect(content).toContain('prompt/protocol/pateoas.protocol.md');

      // 清理模拟
      fs.readFile.mockRestore();
    });

    test('应该处理没有匹配文件的情况', async () => {
      const glob = require('glob');
      
      jest.doMock('glob', () => ({
        ...jest.requireActual('glob'),
        __esModule: true,
        default: jest.fn().mockImplementation((pattern, options, callback) => {
          if (typeof options === 'function') {
            callback = options;
            options = {};
          }
          callback(null, []); // 返回空文件列表
        })
      }));

      await expect(promptProtocol.loadMultipleFiles('@package://prompt/nonexistent/**/*.md'))
        .rejects.toThrow('没有找到匹配的文件');
    });
  });

  describe('内容合并', () => {
    test('应该合并多个文件内容', () => {
      const contents = [
        { path: 'file1.md', content: '# File 1\n\nContent 1' },
        { path: 'file2.md', content: '# File 2\n\nContent 2' }
      ];

      const merged = promptProtocol.mergeContents(contents);
      
      expect(merged).toContain('# file1.md');
      expect(merged).toContain('# File 1');
      expect(merged).toContain('# file2.md');
      expect(merged).toContain('# File 2');
      expect(merged).toContain('---');
    });

    test('应该支持不合并返回JSON', () => {
      const contents = [
        { path: 'file1.md', content: 'Content 1' },
        { path: 'file2.md', content: 'Content 2' }
      ];

      const queryParams = new QueryParams();
      queryParams.set('merge', 'false');

      const result = promptProtocol.mergeContents(contents, queryParams);
      
      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(2);
      expect(parsed[0]).toHaveProperty('path', 'file1.md');
      expect(parsed[0]).toHaveProperty('content', 'Content 1');
    });

    test('应该支持自定义分隔符', () => {
      const contents = [
        { path: 'file1.md', content: 'Content 1' },
        { path: 'file2.md', content: 'Content 2' }
      ];

      const queryParams = new QueryParams();
      queryParams.set('separator', '\n\n===\n\n');

      const result = promptProtocol.mergeContents(contents, queryParams);
      
      expect(result).toContain('===');
      expect(result).not.toContain('---');
    });

    test('应该支持隐藏文件名', () => {
      const contents = [
        { path: 'file1.md', content: 'Content 1' }
      ];

      const queryParams = new QueryParams();
      queryParams.set('include_filename', 'false');

      const result = promptProtocol.mergeContents(contents, queryParams);
      
      expect(result).not.toContain('# file1.md');
      expect(result).toContain('Content 1');
    });
  });

  describe('资源存在性检查', () => {
    test('应该检查单个文件是否存在', async () => {
      mockPackageProtocol.exists.mockResolvedValue(true);

      const exists = await promptProtocol.exists('bootstrap');
      
      expect(exists).toBe(true);
      expect(mockPackageProtocol.exists).toHaveBeenCalledWith('bootstrap.md', undefined);
    });

    test('应该检查通配符文件是否存在', async () => {
      const glob = require('glob');
      
      jest.doMock('glob', () => ({
        ...jest.requireActual('glob'),
        __esModule: true,
        default: jest.fn().mockImplementation((pattern, options, callback) => {
          if (typeof options === 'function') {
            callback = options;
            options = {};
          }
          callback(null, ['/mock/file1.md', '/mock/file2.md']);
        })
      }));

      const exists = await promptProtocol.exists('protocols');
      
      expect(exists).toBe(true);
    });

    test('应该处理不存在的资源', async () => {
      const exists = await promptProtocol.exists('nonexistent');
      
      expect(exists).toBe(false);
    });
  });

  describe('完整协议解析', () => {
    test('应该完整加载内容', async () => {
      mockPackageProtocol.loadContent.mockResolvedValue({
        content: '# Bootstrap Content\n\nThis is bootstrap.',
        metadata: {}
      });

      const content = await promptProtocol.loadContent('@package://bootstrap.md');
      
      expect(content).toBe('# Bootstrap Content\n\nThis is bootstrap.');
    });

    test('应该处理缺少依赖的情况', async () => {
      const newProtocol = new PromptProtocol();
      // 不设置 packageProtocol 依赖

      await expect(newProtocol.loadContent('@package://test.md'))
        .rejects.toThrow('PromptProtocol 需要 PackageProtocol 依赖');
    });
  });

  describe('工具方法', () => {
    test('应该列出所有可用资源', () => {
      const resources = promptProtocol.listResources();
      
      expect(resources).toBeInstanceOf(Array);
      expect(resources.length).toBeGreaterThan(0);
      
      const protocolsResource = resources.find(r => r.id === 'protocols');
      expect(protocolsResource).toBeDefined();
      expect(protocolsResource.description).toContain('DPML协议规范文档');
    });

    test('应该获取资源描述', () => {
      expect(promptProtocol.getResourceDescription('protocols')).toContain('DPML协议规范文档');
      expect(promptProtocol.getResourceDescription('core')).toContain('核心思维和执行模式');
      expect(promptProtocol.getResourceDescription('unknown')).toBe('未知资源');
    });
  });

  describe('缓存管理', () => {
    test('应该提供缓存统计', () => {
      const stats = promptProtocol.getCacheStats();
      expect(stats.protocol).toBe('prompt');
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.enabled).toBe('boolean');
    });

    test('应该能清除缓存', () => {
      // 模拟一些缓存数据
      promptProtocol.cache.set('test', 'value');
      expect(promptProtocol.cache.size).toBeGreaterThan(0);
      
      promptProtocol.clearCache();
      expect(promptProtocol.cache.size).toBe(0);
    });
  });
}); 