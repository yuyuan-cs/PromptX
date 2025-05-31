const { spawn } = require('child_process')
const fs = require('fs').promises
const path = require('path')
const os = require('os')

describe('PromptX CLI - E2E Tests', () => {
  const CLI_PATH = path.resolve(__dirname, '../../bin/promptx.js')
  let tempDir

  beforeAll(async () => {
    // 创建临时测试目录
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'promptx-e2e-'))

    // 创建测试项目结构
    const promptDir = path.join(tempDir, 'prompt')
    await fs.mkdir(promptDir, { recursive: true })

    const coreDir = path.join(promptDir, 'core')
    await fs.mkdir(coreDir, { recursive: true })

    // 创建测试文件
    await fs.writeFile(
      path.join(coreDir, 'test-core.md'),
      '# Core Prompt\n\n这是核心提示词。'
    )

    await fs.writeFile(
      path.join(tempDir, 'bootstrap.md'),
      '# Bootstrap\n\n这是启动文件。'
    )
  })

  afterAll(async () => {
    // 清理临时目录
    await fs.rm(tempDir, { recursive: true })
  })

  /**
   * 运行CLI命令的辅助函数
   */
  function runCommand (args, options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [CLI_PATH, ...args], {
        cwd: options.cwd || tempDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, ...options.env }
      })

      let stdout = ''
      let stderr = ''

      child.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      child.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      child.on('close', (code) => {
        resolve({
          code,
          stdout,
          stderr
        })
      })

      child.on('error', reject)

      // 如果需要输入，发送输入数据
      if (options.input) {
        child.stdin.write(options.input)
        child.stdin.end()
      }
    })
  }

  describe('基础命令测试', () => {
    test('应该显示帮助信息', async () => {
      const result = await runCommand(['--help'])

      expect(result.code).toBe(0)
      expect(result.stdout).toContain('PromptX CLI')
      expect(result.stdout).toContain('Usage:')
      expect(result.stdout).toContain('hello')
      expect(result.stdout).toContain('learn')
      expect(result.stdout).toContain('recall')
      expect(result.stdout).toContain('remember')
    })

    test('应该显示版本信息', async () => {
      const result = await runCommand(['--version'])

      expect(result.code).toBe(0)
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/)
    })
  })

  describe('hello 命令 - 系统入口', () => {
    test('应该显示欢迎信息', async () => {
      const result = await runCommand(['hello'])

      expect(result.code).toBe(0)
      expect(result.stdout).toContain('👋')
      expect(result.stdout).toContain('PromptX')
      expect(result.stdout).toContain('AI助手')
    })

    test('应该支持个性化问候', async () => {
      const result = await runCommand(['hello', '--name', '张三'])

      expect(result.code).toBe(0)
      expect(result.stdout).toContain('张三')
    })

    test('应该显示系统状态', async () => {
      const result = await runCommand(['hello', '--status'])

      expect(result.code).toBe(0)
      expect(result.stdout).toMatch(/工作目录:/)
      expect(result.stdout).toMatch(/资源协议:/)
    })
  })

  describe('learn 命令 - 资源学习', () => {
    test('应该加载prompt协议资源', async () => {
      const result = await runCommand(['learn', '@prompt://bootstrap'])

      expect(result.code).toBe(0)
      expect(result.stdout).toContain('学习资源')
      expect(result.stdout).toContain('@prompt://bootstrap')
    })

    test('应该加载文件资源', async () => {
      const result = await runCommand(['learn', '@file://bootstrap.md'])

      expect(result.code).toBe(0)
      expect(result.stdout).toContain('这是启动文件')
    })

    test('应该支持带参数的资源加载', async () => {
      const result = await runCommand(['learn', '@file://bootstrap.md?line=1'])

      expect(result.code).toBe(0)
      expect(result.stdout).toContain('# Bootstrap')
      expect(result.stdout).not.toContain('这是启动文件')
    })

    test('应该处理无效资源引用', async () => {
      const result = await runCommand(['learn', 'invalid-reference'])

      expect(result.code).toBe(1)
      expect(result.stderr).toContain('资源引用格式错误')
    })

    test('应该处理不存在的文件', async () => {
      const result = await runCommand(['learn', '@file://nonexistent.md'])

      expect(result.code).toBe(1)
      expect(result.stderr).toContain('Failed to read file')
    })
  })

  describe('recall 命令 - 记忆检索', () => {
    test('应该显示基本的记忆检索功能', async () => {
      const result = await runCommand(['recall', 'test'])

      expect(result.code).toBe(0)
      expect(result.stdout).toContain('🔍 正在检索记忆')
    })

    test('应该支持记忆类型指定', async () => {
      const result = await runCommand(['recall', 'test', '--type', 'semantic'])

      expect(result.code).toBe(0)
      expect(result.stdout).toContain('semantic')
    })

    test('应该支持模糊搜索', async () => {
      const result = await runCommand(['recall', 'test', '--fuzzy'])

      expect(result.code).toBe(0)
      expect(result.stdout).toContain('模糊搜索')
    })
  })

  describe('remember 命令 - 记忆存储', () => {
    test('应该存储新的记忆', async () => {
      const result = await runCommand(['remember', 'test-memory', 'This is a test memory'])

      expect(result.code).toBe(0)
      expect(result.stdout).toContain('🧠 正在存储记忆')
      expect(result.stdout).toContain('test-memory')
    })

    test('应该支持记忆类型指定', async () => {
      const result = await runCommand([
        'remember',
        'procedure-test',
        'How to test',
        '--type',
        'procedural'
      ])

      expect(result.code).toBe(0)
      expect(result.stdout).toContain('procedural')
    })

    test('应该支持标签添加', async () => {
      const result = await runCommand([
        'remember',
        'tagged-memory',
        'Tagged content',
        '--tags',
        'test,example'
      ])

      expect(result.code).toBe(0)
      expect(result.stdout).toContain('tags')
    })
  })

  describe('错误处理和边界情况', () => {
    test('应该处理无效命令', async () => {
      const result = await runCommand(['invalid-command'])

      expect(result.code).toBe(1)
      expect(result.stderr).toContain('Unknown command')
    })

    test('应该处理缺少参数的情况', async () => {
      const result = await runCommand(['learn'])

      expect(result.code).toBe(1)
      expect(result.stderr).toContain('Missing required argument')
    })

    test('应该处理权限错误', async () => {
      // 创建一个没有权限的文件
      const restrictedFile = path.join(tempDir, 'restricted.md')
      await fs.writeFile(restrictedFile, 'restricted content')
      await fs.chmod(restrictedFile, 0o000)

      const result = await runCommand(['learn', '@file://restricted.md'])

      expect(result.code).toBe(1)
      expect(result.stderr).toContain('EACCES')

      // 恢复权限以便清理
      await fs.chmod(restrictedFile, 0o644)
    })
  })

  describe('工作流集成测试', () => {
    test('应该支持完整的AI认知循环', async () => {
      // 1. Hello - 建立连接
      const helloResult = await runCommand(['hello', '--name', 'E2E测试'])
      expect(helloResult.code).toBe(0)

      // 2. Learn - 学习资源
      const learnResult = await runCommand(['learn', '@file://bootstrap.md'])
      expect(learnResult.code).toBe(0)

      // 3. Remember - 存储记忆
      const rememberResult = await runCommand([
        'remember',
        'e2e-test',
        'E2E测试记忆',
        '--type',
        'episodic'
      ])
      expect(rememberResult.code).toBe(0)

      // 4. Recall - 检索记忆
      const recallResult = await runCommand(['recall', 'e2e-test'])
      expect(recallResult.code).toBe(0)
    })

    test('应该支持资源链式学习', async () => {
      // 创建链式引用文件
      const chainFile = path.join(tempDir, 'chain.md')
      await fs.writeFile(chainFile, '@file://bootstrap.md')

      const result = await runCommand(['learn', '@file://chain.md'])

      expect(result.code).toBe(0)
      expect(result.stdout).toContain('这是启动文件')
    })
  })

  describe('输出格式和交互', () => {
    test('应该支持JSON输出格式', async () => {
      const result = await runCommand(['learn', '@file://bootstrap.md', '--format', 'json'])

      expect(result.code).toBe(0)
      expect(() => JSON.parse(result.stdout)).not.toThrow()
    })

    test('应该支持静默模式', async () => {
      const result = await runCommand(['hello', '--quiet'])

      expect(result.code).toBe(0)
      expect(result.stdout.trim()).toBe('')
    })

    test('应该支持详细输出模式', async () => {
      const result = await runCommand(['learn', '@file://bootstrap.md', '--verbose'])

      expect(result.code).toBe(0)
      expect(result.stdout).toContain('DEBUG')
    })
  })
})
