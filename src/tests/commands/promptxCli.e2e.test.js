const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs-extra')
const os = require('os')

describe('PromptX CLI - E2E Tests', () => {
  let tempDir

  beforeAll(async () => {
    // 创建临时目录用于测试
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'promptx-e2e-'))
  })

  afterAll(async () => {
    if (tempDir) {
      await fs.remove(tempDir)
    }
  })

  /**
   * 运行PromptX CLI命令
   */
  function runCommand (args, options = {}) {
    const cwd = options.cwd || process.cwd()
    const env = { ...process.env, ...options.env }

    try {
      const result = execSync(`node src/bin/promptx.js ${args.join(' ')}`, {
        cwd,
        env,
        encoding: 'utf8',
        timeout: 10000
      })
      return { success: true, output: result, error: null }
    } catch (error) {
      return { success: false, output: error.stdout || '', error: error.message }
    }
  }

  describe('基础CLI功能', () => {
    test('hello命令应该能正常运行', () => {
      const result = runCommand(['hello'])
      
      expect(result.success).toBe(true)
      expect(result.output).toContain('AI专业角色服务清单')
      expect(result.output).toContain('assistant')
    })

    test('init命令应该能正常运行', () => {
      const result = runCommand(['init'])
      
      expect(result.success).toBe(true)
      expect(result.output).toContain('初始化')
    })

    test('help命令应该显示帮助信息', () => {
      const result = runCommand(['--help'])
      
      expect(result.success).toBe(true)
      expect(result.output).toContain('Usage')
         })
   })
}) 