const path = require('path')
const fs = require('fs').promises
const os = require('os')

/**
 * 测试资源工厂
 * 提供测试用的固定数据和辅助函数
 */
class TestResourceFactory {
  constructor () {
    this.tempDirs = new Set()
  }

  /**
   * 创建临时测试目录
   * @returns {Promise<string>} 临时目录路径
   */
  async createTempDir () {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'promptx-test-'))
    this.tempDirs.add(tempDir)
    return tempDir
  }

  /**
   * 清理所有临时目录
   */
  async cleanup () {
    for (const dir of this.tempDirs) {
      try {
        await fs.rmdir(dir, { recursive: true })
      } catch (error) {
        console.warn(`Failed to cleanup temp dir ${dir}:`, error.message)
      }
    }
    this.tempDirs.clear()
  }

  /**
   * 创建完整的PromptX测试项目结构
   * @param {string} baseDir - 基础目录
   * @returns {Promise<object>} 创建的文件路径映射
   */
  async createPromptXStructure (baseDir) {
    const structure = {
      prompt: path.join(baseDir, 'prompt'),
      core: path.join(baseDir, 'prompt', 'core'),
      domain: path.join(baseDir, 'prompt', 'domain'),
      protocol: path.join(baseDir, 'prompt', 'protocol'),
      memory: path.join(baseDir, '.memory')
    }

    // 创建目录结构
    for (const dir of Object.values(structure)) {
      await fs.mkdir(dir, { recursive: true })
    }

    // 创建测试文件
    const files = {
      bootstrap: path.join(baseDir, 'bootstrap.md'),
      coreThought: path.join(structure.core, 'thought', 'critical-thinking.md'),
      coreExecution: path.join(structure.core, 'execution', 'problem-solving.md'),
      domainTest: path.join(structure.domain, 'test', 'unit-testing.md'),
      protocolDpml: path.join(structure.protocol, 'dpml.md'),
      memoryDeclarative: path.join(structure.memory, 'declarative.md'),
      memoryProcedural: path.join(structure.memory, 'procedural.md')
    }

    // 创建core子目录
    await fs.mkdir(path.join(structure.core, 'thought'), { recursive: true })
    await fs.mkdir(path.join(structure.core, 'execution'), { recursive: true })
    await fs.mkdir(path.join(structure.domain, 'test'), { recursive: true })

    // 写入测试文件内容
    await this.writeTestFiles(files)

    return { structure, files }
  }

  /**
   * 写入测试文件内容
   * @param {object} files - 文件路径映射
   */
  async writeTestFiles (files) {
    const contents = {
      [files.bootstrap]: `# PromptX Bootstrap

这是PromptX的启动文件，用于初始化AI助手。

## 核心功能
- 资源加载
- 协议解析
- 角色初始化

## 使用方法
通过 \`@promptx://bootstrap\` 引用此文件。`,

      [files.coreThought]: `# 批判性思维模式

#思维模式 批判性思维

## 定义
批判性思维是分析、评估和改进思维的过程。

## 原则
1. 质疑假设
2. 寻求证据
3. 考虑多个角度
4. 识别偏见

## 应用
在分析问题时，始终保持批判性思维。`,

      [files.coreExecution]: `# 问题解决执行模式

#执行模式 问题解决

## 流程
1. 问题定义
2. 分析阶段
3. 解决方案设计
4. 实施执行
5. 结果评估

## 工具
- 根因分析
- 决策树
- 头脑风暴
- 原型验证`,

      [files.domainTest]: `# 单元测试领域知识

#领域知识 软件测试

## 单元测试原则
- 独立性
- 可重复性
- 快速执行
- 自我验证

## 最佳实践
- AAA模式（Arrange, Act, Assert）
- 测试驱动开发(TDD)
- 边界值测试
- 异常情况覆盖`,

      [files.protocolDpml]: `# DPML资源协议规范

## 语法格式
\`@[!?]protocol://resource_id[?params]\`

## 加载语义
- \`@\`: 默认加载
- \`@!\`: 热加载
- \`@?\`: 懒加载

## 支持的协议
- promptx: PromptX内置资源
- file: 文件系统资源
- memory: 记忆系统资源
- http/https: 网络资源`,

      [files.memoryDeclarative]: `# 陈述性记忆

记录事实性知识和概念。

## 类型
- 事实记忆
- 概念记忆
- 规则记忆

## 存储格式
JSON结构化数据`,

      [files.memoryProcedural]: `# 程序性记忆

记录如何执行特定任务的步骤。

## 类型
- 技能记忆
- 习惯记忆
- 流程记忆

## 存储格式
步骤化序列`
    }

    for (const [filePath, content] of Object.entries(contents)) {
      await fs.writeFile(filePath, content, 'utf8')
    }
  }

  /**
   * 获取测试用的DPML资源引用
   */
  getTestResourceRefs () {
    return {
      valid: [
        '@promptx://bootstrap',
        '@promptx://protocols',
        '@promptx://core',
        '@file://test.md',
        '@!file://hot-reload.md',
        '@?memory://lazy-load',
        '@file://data.json?format=json',
        '@file://content.md?line=5-10',
        '@memory://declarative',
        '@memory://procedural',
        '@http://example.com/api',
        '@https://api.example.com/data.json'
      ],
      invalid: [
        'promptx://missing-at',
        '@://empty-protocol',
        '@123invalid://numeric-start',
        '@file://',
        '',
        null,
        undefined,
        '@unknown://invalid-protocol'
      ],
      nested: [
        '@promptx://@file://nested.md',
        '@memory://@promptx://bootstrap',
        '@file://@memory://declarative',
        '@promptx://@memory://@file://deep-nested.md'
      ]
    }
  }

  /**
   * 获取测试用的查询参数
   */
  getTestQueryParams () {
    return {
      line: ['1', '5-10', '1-', '-10'],
      format: ['json', 'text', 'xml'],
      cache: ['true', 'false', '1', '0'],
      encoding: ['utf8', 'gbk', 'ascii'],
      timeout: ['5000', '10000'],
      custom: ['value1', 'value2']
    }
  }

  /**
   * 创建模拟的协议注册表
   */
  getMockProtocolRegistry () {
    return {
      'test-protocol': {
        description: '测试协议',
        location: 'test://{resource_id}',
        registry: {
          resource1: '@file://test1.md',
          resource2: '@file://test2.md',
          nested: '@test-protocol://resource1'
        }
      },
      'mock-http': {
        description: '模拟HTTP协议',
        location: 'mock-http://{url}',
        params: {
          timeout: 'number',
          format: 'string'
        }
      }
    }
  }

  /**
   * 创建错误场景测试数据
   */
  getErrorScenarios () {
    return {
      fileNotFound: '@file://nonexistent.md',
      permissionDenied: '@file://restricted.md',
      invalidProtocol: '@unknown://test',
      malformedUrl: '@file://',
      networkTimeout: '@http://timeout.example.com',
      parseError: 'invalid-syntax'
    }
  }
}

module.exports = {
  TestResourceFactory,

  // 便捷工厂函数
  createTestFactory: () => new TestResourceFactory(),

  // 常用测试数据
  SAMPLE_DPML_REFS: [
    '@promptx://protocols',
    '@file://test.md?line=1-10',
    '@!memory://hot-memory',
    '@?file://lazy-file.md'
  ],

  SAMPLE_PROTOCOLS: ['promptx', 'file', 'memory', 'http', 'https'],

  SAMPLE_LOADING_SEMANTICS: ['@', '@!', '@?']
}
