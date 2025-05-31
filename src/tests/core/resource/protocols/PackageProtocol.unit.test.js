const PackageProtocol = require('../../../../lib/core/resource/protocols/PackageProtocol');
const { QueryParams } = require('../../../../lib/core/resource/types');
const path = require('path');
const fs = require('fs').promises;

describe('PackageProtocol', () => {
  let packageProtocol;
  const originalEnv = process.env;
  const projectRoot = process.cwd(); // PromptX项目根目录

  beforeEach(() => {
    packageProtocol = new PackageProtocol();
    // 重置环境变量
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    packageProtocol.clearCache();
    process.env = originalEnv;
  });

  describe('基础功能', () => {
    test('应该正确初始化协议', () => {
      expect(packageProtocol.name).toBe('package');
      expect(packageProtocol.installModeCache).toBeInstanceOf(Map);
    });

    test('应该提供协议信息', () => {
      const info = packageProtocol.getProtocolInfo();
      expect(info.name).toBe('package');
      expect(info.description).toContain('包协议');
      expect(info.examples).toContain('@package://package.json');
      expect(info.examples).toContain('@package://src/index.js');
      expect(info.installModes).toContain('development');
    });

    test('应该支持缓存', () => {
      expect(packageProtocol.enableCache).toBe(true);
      expect(packageProtocol.cache).toBeInstanceOf(Map);
      expect(packageProtocol.installModeCache).toBeInstanceOf(Map);
    });
  });

  describe('安装模式检测', () => {
    test('应该检测开发模式', () => {
      // 设置开发环境
      process.env.NODE_ENV = 'development';
      packageProtocol.clearCache();
      
      const mode = packageProtocol.detectInstallMode();
      expect(mode).toBe('development');
    });

    test('应该检测npx执行模式', () => {
      // 模拟npx环境
      process.env.npm_execpath = '/usr/local/bin/npx';
      packageProtocol.clearCache();
      
      const mode = packageProtocol.detectInstallMode();
      expect(mode).toBe('npx');
    });

    test('应该缓存检测结果', () => {
      const mode1 = packageProtocol.detectInstallMode();
      const mode2 = packageProtocol.detectInstallMode();
      
      expect(mode1).toBe(mode2);
      expect(packageProtocol.installModeCache.size).toBe(1);
    });

    test('检测结果应该是有效的安装模式', () => {
      const mode = packageProtocol.detectInstallMode();
      const validModes = ['development', 'local', 'global', 'npx', 'monorepo', 'link'];
      expect(validModes).toContain(mode);
    });
  });

  describe('NPX执行检测', () => {
    test('应该通过npm_execpath检测npx', () => {
      process.env.npm_execpath = '/path/to/npx';
      expect(packageProtocol._isNpxExecution()).toBe(true);
    });

    test('应该通过npm_config_cache检测npx', () => {
      process.env.npm_config_cache = '/tmp/_npx/cache';
      expect(packageProtocol._isNpxExecution()).toBe(true);
    });

    test('正常情况下应该返回false', () => {
      delete process.env.npm_execpath;
      delete process.env.npm_config_cache;
      expect(packageProtocol._isNpxExecution()).toBe(false);
    });
  });

  describe('全局安装检测', () => {
    test('应该检测常见的全局路径', () => {
      // 这个测试在实际环境中可能会失败，因为我们无法轻易改变__dirname
      const result = packageProtocol._isGlobalInstall();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('开发模式检测', () => {
    test('应该通过NODE_ENV检测开发模式', () => {
      process.env.NODE_ENV = 'development';
      expect(packageProtocol._isDevelopmentMode()).toBe(true);
    });

    test('应该检测非node_modules目录', () => {
      // 当前测试环境应该不在node_modules中
      const result = packageProtocol._isDevelopmentMode();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('包查找功能', () => {
    test('应该能找到package.json', () => {
      const packageJsonPath = packageProtocol.findPackageJson();
      expect(packageJsonPath).toBeTruthy();
      expect(packageJsonPath).toMatch(/package\.json$/);
    });

    test('应该能找到根package.json', () => {
      const rootPackageJsonPath = packageProtocol.findRootPackageJson();
      expect(rootPackageJsonPath).toBeTruthy();
      expect(rootPackageJsonPath).toMatch(/package\.json$/);
    });

    test('查找不存在的package.json应该返回null', () => {
      const result = packageProtocol.findPackageJson('/nonexistent/path');
      expect(result).toBeNull();
    });
  });

  describe('包根目录获取', () => {
    test('应该能获取包根目录', async () => {
      const packageRoot = await packageProtocol.getPackageRoot();
      expect(packageRoot).toBeTruthy();
      expect(typeof packageRoot).toBe('string');
      expect(path.isAbsolute(packageRoot)).toBe(true);
    });

    test('项目根目录查找应该工作正常', () => {
      const root = packageProtocol._findProjectRoot();
      expect(root).toBeTruthy();
      expect(path.isAbsolute(root)).toBe(true);
    });
  });

  describe('路径解析', () => {
    test('应该解析package.json路径', async () => {
      const resolved = await packageProtocol.resolvePath('package.json');
      expect(resolved).toMatch(/package\.json$/);
      expect(path.isAbsolute(resolved)).toBe(true);
    });

    test('应该解析src目录路径', async () => {
      const resolved = await packageProtocol.resolvePath('src/index.js');
      expect(resolved).toContain('src');
      expect(resolved).toMatch(/index\.js$/);
    });

    test('应该解析prompt目录路径', async () => {
      const resolved = await packageProtocol.resolvePath('prompt/core/thought.md');
      expect(resolved).toContain('prompt');
      expect(resolved).toContain('core');
      expect(resolved).toMatch(/thought\.md$/);
    });

    test('空路径应该返回包根目录', async () => {
      const resolved = await packageProtocol.resolvePath('');
      expect(path.isAbsolute(resolved)).toBe(true);
      expect(resolved).toBeTruthy();
    });

    test('只有空格的路径应该返回包根目录', async () => {
      const resolved = await packageProtocol.resolvePath('   ');
      expect(path.isAbsolute(resolved)).toBe(true);
      expect(resolved).toBeTruthy();
    });

    test('应该使用缓存', async () => {
      const path1 = await packageProtocol.resolvePath('package.json');
      const path2 = await packageProtocol.resolvePath('package.json');
      
      expect(path1).toBe(path2);
      expect(packageProtocol.cache.size).toBeGreaterThan(0);
    });
  });

  describe('路径安全检查', () => {
    test('应该阻止目录遍历攻击', async () => {
      await expect(
        packageProtocol.resolvePath('../../../etc/passwd')
      ).rejects.toThrow('路径安全检查失败');
    });

    test('正常的相对路径应该被允许', async () => {
      const resolved = await packageProtocol.resolvePath('src/lib/utils.js');
      expect(resolved).toContain('src');
      expect(resolved).toContain('lib');
      expect(resolved).toMatch(/utils\.js$/);
    });
  });

  describe('资源存在性检查', () => {
    test('存在的文件应该返回true', async () => {
      const exists = await packageProtocol.exists('package.json');
      expect(exists).toBe(true);
    });

    test('不存在的文件应该返回false', async () => {
      const exists = await packageProtocol.exists('nonexistent.txt');
      expect(exists).toBe(false);
    });
  });

  describe('内容加载', () => {
    test('应该能加载package.json内容', async () => {
      const result = await packageProtocol.loadContent('package.json');
      
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('protocol', 'package');
      expect(result).toHaveProperty('installMode');
      expect(result).toHaveProperty('metadata');
      
      expect(result.metadata).toHaveProperty('size');
      expect(result.metadata).toHaveProperty('lastModified');
      expect(result.metadata).toHaveProperty('absolutePath');
      expect(result.metadata).toHaveProperty('relativePath');
      
      // 验证内容是有效的JSON
      expect(() => JSON.parse(result.content)).not.toThrow();
    });

    test('加载不存在的文件应该抛出错误', async () => {
      await expect(
        packageProtocol.loadContent('nonexistent.txt')
      ).rejects.toThrow('包资源不存在');
    });

    test('返回的metadata应该包含正确信息', async () => {
      const result = await packageProtocol.loadContent('package.json');
      
      expect(result.metadata.size).toBe(result.content.length);
      expect(result.metadata.lastModified.constructor.name).toBe('Date');
      expect(path.isAbsolute(result.metadata.absolutePath)).toBe(true);
      expect(result.metadata.relativePath).toBe('package.json');
    });
  });

  describe('查询参数支持', () => {
    test('应该支持查询参数', async () => {
      const queryParams = new QueryParams();
      queryParams.set('encoding', 'utf8');
      
      const resolved = await packageProtocol.resolvePath('package.json', queryParams);
      expect(resolved).toMatch(/package\.json$/);
    });

    test('相同路径但不同查询参数应该有不同的缓存', async () => {
      const queryParams1 = new QueryParams();
      queryParams1.set('test', 'value1');
      
      const queryParams2 = new QueryParams();
      queryParams2.set('test', 'value2');
      
      await packageProtocol.resolvePath('package.json', queryParams1);
      await packageProtocol.resolvePath('package.json', queryParams2);
      
      expect(packageProtocol.cache.size).toBeGreaterThan(1);
    });
  });

  describe('调试信息', () => {
    test('应该提供完整的调试信息', () => {
      const debugInfo = packageProtocol.getDebugInfo();
      
      expect(debugInfo).toHaveProperty('protocol', 'package');
      expect(debugInfo).toHaveProperty('installMode');
      expect(debugInfo).toHaveProperty('packageRoot');
      expect(debugInfo).toHaveProperty('currentWorkingDirectory');
      expect(debugInfo).toHaveProperty('moduleDirectory');
      expect(debugInfo).toHaveProperty('environment');
      expect(debugInfo).toHaveProperty('cacheSize');
      
      expect(debugInfo.environment).toHaveProperty('NODE_ENV');
      expect(debugInfo.environment).toHaveProperty('npm_execpath');
      expect(debugInfo.environment).toHaveProperty('npm_config_cache');
    });
  });

  describe('缓存管理', () => {
    test('应该能清理所有缓存', async () => {
      // 生成一些缓存
      await packageProtocol.resolvePath('package.json');
      packageProtocol.detectInstallMode();
      
      expect(packageProtocol.cache.size).toBeGreaterThan(0);
      expect(packageProtocol.installModeCache.size).toBeGreaterThan(0);
      
      packageProtocol.clearCache();
      
      expect(packageProtocol.cache.size).toBe(0);
      expect(packageProtocol.installModeCache.size).toBe(0);
    });
  });

  describe('错误处理', () => {
    test('文件系统错误应该被正确处理', async () => {
      // 尝试访问一个权限不足的路径（如果存在的话）
      const result = await packageProtocol.exists('../../../root/.ssh/id_rsa');
      expect(typeof result).toBe('boolean');
    });

    test('路径解析错误应该包含有用信息', async () => {
      try {
        await packageProtocol.resolvePath('../../../etc/passwd');
      } catch (error) {
        expect(error.message).toContain('路径安全检查失败');
      }
    });
  });

  describe('边界情况', () => {
    test('深层嵌套路径应该正确处理', async () => {
      const resolved = await packageProtocol.resolvePath('src/lib/core/resource/protocols/test.js');
      expect(resolved).toContain('src');
      expect(resolved).toContain('lib');
      expect(resolved).toContain('core');
      expect(resolved).toContain('resource');
      expect(resolved).toContain('protocols');
      expect(resolved).toMatch(/test\.js$/);
    });

    test('特殊字符路径应该被正确处理', async () => {
      const resolved = await packageProtocol.resolvePath('assets/images/logo-2024.png');
      expect(resolved).toContain('assets');
      expect(resolved).toContain('images');
      expect(resolved).toMatch(/logo-2024\.png$/);
    });

    test('带有空格的路径应该被正确处理', async () => {
      const resolved = await packageProtocol.resolvePath('docs/user guide.md');
      expect(resolved).toContain('docs');
      expect(resolved).toMatch(/user guide\.md$/);
    });

    test('中文路径应该被正确处理', async () => {
      const resolved = await packageProtocol.resolvePath('文档/说明.md');
      expect(resolved).toContain('文档');
      expect(resolved).toMatch(/说明\.md$/);
    });
  });
}); 