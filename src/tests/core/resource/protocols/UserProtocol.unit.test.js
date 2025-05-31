const UserProtocol = require('../../../../lib/core/resource/protocols/UserProtocol')
const { QueryParams } = require('../../../../lib/core/resource/types')
const path = require('path')
const os = require('os')

describe('UserProtocol', () => {
  let userProtocol

  beforeEach(() => {
    userProtocol = new UserProtocol()
  })

  afterEach(() => {
    userProtocol.clearCache()
  })

  describe('基础功能', () => {
    test('应该正确初始化协议', () => {
      expect(userProtocol.name).toBe('user')
      expect(userProtocol.userDirs).toBeDefined()
      expect(Object.keys(userProtocol.userDirs)).toContain('home')
      expect(Object.keys(userProtocol.userDirs)).toContain('documents')
      expect(Object.keys(userProtocol.userDirs)).toContain('desktop')
    })

    test('应该提供协议信息', () => {
      const info = userProtocol.getProtocolInfo()
      expect(info.name).toBe('user')
      expect(info.description).toBeDefined()
      expect(info.location).toBe('user://{directory}/{path}')
      expect(info.examples).toBeInstanceOf(Array)
      expect(info.supportedDirectories).toContain('home')
    })

    test('应该提供支持的参数列表', () => {
      const params = userProtocol.getSupportedParams()
      expect(params.line).toBeDefined()
      expect(params.format).toBeDefined()
      expect(params.exists).toBeDefined()
      expect(params.type).toBeDefined()
    })
  })

  describe('路径验证', () => {
    test('应该验证有效的用户目录路径', () => {
      expect(userProtocol.validatePath('home')).toBe(true)
      expect(userProtocol.validatePath('documents/notes.txt')).toBe(true)
      expect(userProtocol.validatePath('desktop/readme.md')).toBe(true)
      expect(userProtocol.validatePath('downloads/')).toBe(true)
    })

    test('应该拒绝无效的用户目录路径', () => {
      expect(userProtocol.validatePath('invalid')).toBe(false)
      expect(userProtocol.validatePath('unknown/path')).toBe(false)
      expect(userProtocol.validatePath('')).toBe(false)
      expect(userProtocol.validatePath(null)).toBe(false)
    })
  })

  describe('路径解析', () => {
    test('应该解析home目录', async () => {
      const resolved = await userProtocol.resolvePath('home')
      expect(resolved).toBe(os.homedir())
    })

    test('应该解析documents目录', async () => {
      const resolved = await userProtocol.resolvePath('documents')
      expect(resolved).toContain('Documents')
      expect(path.isAbsolute(resolved)).toBe(true)
    })

    test('应该解析带子路径的文件', async () => {
      const resolved = await userProtocol.resolvePath('documents/notes.txt')
      expect(resolved).toContain('Documents')
      expect(resolved).toContain('notes.txt')
      expect(path.isAbsolute(resolved)).toBe(true)
    })

    test('应该拒绝不支持的目录类型', async () => {
      await expect(userProtocol.resolvePath('invalid/path'))
        .rejects.toThrow('不支持的用户目录类型')
    })

    test('应该防止路径穿越攻击', async () => {
      await expect(userProtocol.resolvePath('documents/../../../etc/passwd'))
        .rejects.toThrow('安全错误：路径超出用户目录范围')
    })
  })

  describe('用户目录获取', () => {
    test('应该获取所有支持的用户目录', async () => {
      const directories = await userProtocol.listUserDirectories()

      expect(directories.home).toBeDefined()
      expect(directories.documents).toBeDefined()
      expect(directories.desktop).toBeDefined()
      expect(directories.downloads).toBeDefined()

      // 检查路径是否为绝对路径
      expect(path.isAbsolute(directories.home)).toBe(true)
    })

    test('应该缓存目录路径', async () => {
      // 第一次调用
      const dir1 = await userProtocol.getUserDirectory('home')
      expect(userProtocol.dirCache.has('home')).toBe(true)

      // 第二次调用应该从缓存获取
      const dir2 = await userProtocol.getUserDirectory('home')
      expect(dir1).toBe(dir2)
    })
  })

  describe('内容加载', () => {
    test('应该加载目录内容', async () => {
      // 使用home目录进行测试（应该总是存在）
      const homePath = await userProtocol.resolvePath('home')
      const content = await userProtocol.loadContent(homePath)

      expect(typeof content).toBe('string')
      expect(content.length).toBeGreaterThan(0)
    })

    test('应该支持不同的目录格式化选项', async () => {
      const homePath = await userProtocol.resolvePath('home')
      const queryParams = new QueryParams()

      // 测试json格式
      queryParams.set('format', 'json')
      const jsonContent = await userProtocol.loadContent(homePath, queryParams)
      expect(() => JSON.parse(jsonContent)).not.toThrow()

      // 测试paths格式
      queryParams.set('format', 'paths')
      const pathsContent = await userProtocol.loadContent(homePath, queryParams)
      expect(typeof pathsContent).toBe('string')
    })

    test('应该处理不存在的文件', async () => {
      const nonExistentPath = await userProtocol.resolvePath('documents/non-existent-file.txt')

      // 默认情况下应该抛出错误
      await expect(userProtocol.loadContent(nonExistentPath))
        .rejects.toThrow('文件或目录不存在')

      // 设置exists=false应该返回空字符串
      const queryParams = new QueryParams()
      queryParams.set('exists', 'false')
      const content = await userProtocol.loadContent(nonExistentPath, queryParams)
      expect(content).toBe('')
    })
  })

  describe('查询参数处理', () => {
    test('应该应用行过滤', () => {
      const content = 'line1\nline2\nline3\nline4\nline5'

      // 测试单行
      expect(userProtocol.applyLineFilter(content, '2')).toBe('line2')

      // 测试范围
      expect(userProtocol.applyLineFilter(content, '2-4')).toBe('line2\nline3\nline4')

      // 测试边界
      expect(userProtocol.applyLineFilter(content, '1-2')).toBe('line1\nline2')
    })

    test('应该应用格式化', () => {
      const jsonContent = '{"name": "test", "value": 123}'

      // 测试JSON格式化
      const formatted = userProtocol.applyFormat(jsonContent, 'json')
      expect(formatted).toContain('{\n  "name"')

      // 测试trim格式化
      const textContent = '  hello world  '
      expect(userProtocol.applyFormat(textContent, 'trim')).toBe('hello world')
    })
  })

  describe('缓存管理', () => {
    test('应该启用缓存', () => {
      expect(userProtocol.enableCache).toBe(true)
    })

    test('应该提供缓存统计', () => {
      const stats = userProtocol.getCacheStats()
      expect(stats.protocol).toBe('user')
      expect(stats.enabled).toBe(true)
      expect(typeof stats.size).toBe('number')
    })

    test('应该清除缓存', async () => {
      // 先缓存一些数据
      await userProtocol.getUserDirectory('home')
      expect(userProtocol.dirCache.size).toBeGreaterThan(0)

      // 清除缓存
      userProtocol.clearCache()
      expect(userProtocol.dirCache.size).toBe(0)
      expect(userProtocol.cache.size).toBe(0)
    })
  })

  describe('集成测试', () => {
    test('应该完整解析用户协议资源', async () => {
      const queryParams = new QueryParams()
      queryParams.set('format', 'json')

      const content = await userProtocol.resolve('home', queryParams)

      expect(typeof content).toBe('string')
      expect(content.length).toBeGreaterThan(0)

      // 如果格式是json，应该能解析
      if (queryParams.get('format') === 'json') {
        expect(() => JSON.parse(content)).not.toThrow()
      }
    })

    test('应该处理嵌套路径', async () => {
      // 假设Documents目录存在
      try {
        const content = await userProtocol.resolve('documents')
        expect(typeof content).toBe('string')
      } catch (error) {
        // 如果Documents目录不存在，这是正常的
        expect(error.message).toContain('不存在')
      }
    })
  })
})
