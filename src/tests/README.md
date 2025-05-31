# PromptX 测试指南

本文档介绍 PromptX 项目的测试规范、命名规则和执行方式。

## 测试文件命名规范

### 命名格式
所有测试文件必须使用 **驼峰命名法（camelCase）** 并明确标识测试类型：

```
{模块名}.{测试类型}.test.js
```

### 测试类型
- **unit**: 单元测试 - 测试单个函数或类的功能
- **integration**: 集成测试 - 测试多个组件之间的协作
- **e2e**: 端到端测试 - 测试完整的用户工作流

### 示例
```
resourceProtocolParser.unit.test.js
resourceRegistry.unit.test.js
resourceManager.integration.test.js
promptxCli.e2e.test.js
```

## 测试目录结构

```
src/tests/
├── setup.js                           # 全局测试配置
├── fixtures/                          # 测试固定数据
│   └── testResources.js              # 测试资源工厂
├── __mocks__/                         # 模拟对象
├── core/
│   └── resource/
│       ├── resourceProtocolParser.unit.test.js
│       ├── resourceRegistry.unit.test.js
│       └── resourceManager.integration.test.js
└── commands/
    └── promptxCli.e2e.test.js
```

## 执行测试

### 运行所有测试
```bash
npm test
```

### 分类运行测试
```bash
# 单元测试
npm run test:unit

# 集成测试  
npm run test:integration

# 端到端测试
npm run test:e2e
```

### 开发模式
```bash
# 监听模式运行所有测试
npm run test:watch

# 监听模式运行单元测试
npm run test:watchUnit

# 监听模式运行集成测试
npm run test:watchIntegration
```

### 覆盖率测试
```bash
# 生成覆盖率报告
npm run test:coverage

# 分类生成覆盖率报告
npm run test:coverageUnit
npm run test:coverageIntegration
npm run test:coverageE2e
```

### CI/CD 测试
```bash
# 持续集成环境测试
npm run test:ci
```

### 调试测试
```bash
# 调试模式运行测试
npm run test:debug
```

## 测试编写规范

### 单元测试 (*.unit.test.js)
- 测试单个函数、类或模块
- 使用模拟(mock)隔离外部依赖
- 快速执行，无外部资源依赖
- 覆盖边界条件和错误场景

```javascript
describe('ResourceProtocolParser - Unit Tests', () => {
  let parser;

  beforeEach(() => {
    parser = new ResourceProtocolParser();
  });

  describe('基础语法解析', () => {
    test('应该解析基本的资源引用', () => {
      const result = parser.parse('@promptx://protocols');
      expect(result.protocol).toBe('promptx');
      expect(result.path).toBe('protocols');
    });
  });
});
```

### 集成测试 (*.integration.test.js)
- 测试多个组件之间的协作
- 可使用真实的文件系统和临时资源
- 测试完整的数据流和业务逻辑
- 关注组件间接口和数据传递

```javascript
describe('ResourceManager - Integration Tests', () => {
  let manager;
  let tempDir;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'promptx-test-'));
  });

  afterAll(async () => {
    await fs.rmdir(tempDir, { recursive: true });
  });

  test('应该解析并加载本地文件', async () => {
    const result = await manager.resolve('@file://test.md');
    expect(result.success).toBe(true);
  });
});
```

### 端到端测试 (*.e2e.test.js)
- 测试完整的用户工作流
- 通过CLI接口测试实际使用场景
- 模拟真实的用户交互
- 验证系统的整体行为

```javascript
describe('PromptX CLI - E2E Tests', () => {
  function runCommand(args) {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [CLI_PATH, ...args]);
      // ... 实现命令执行逻辑
    });
  }

  test('应该支持完整的AI认知循环', async () => {
    const helloResult = await runCommand(['hello']);
    expect(helloResult.code).toBe(0);
    
    const learnResult = await runCommand(['learn', '@file://bootstrap.md']);
    expect(learnResult.code).toBe(0);
  });
});
```

## 测试工具和辅助函数

### 全局测试工具
在 `setup.js` 中定义的全局工具：

```javascript
// 等待函数
await testUtils.sleep(1000);

// 延迟Promise
const result = await testUtils.delayed('value', 100);

// 延迟拒绝
await expect(testUtils.delayedReject(new Error('test'), 100)).rejects.toThrow();
```

### 自定义断言
```javascript
// 验证DPML资源引用
expect('@promptx://protocols').toBeValidDpmlReference();

// 验证对象属性
expect(result).toHaveRequiredProperties(['protocol', 'path']);
```

### 测试资源工厂
使用 `TestResourceFactory` 创建测试数据：

```javascript
const { createTestFactory } = require('../fixtures/testResources');

const factory = createTestFactory();
const tempDir = await factory.createTempDir();
const { structure, files } = await factory.createPromptXStructure(tempDir);
```

## 覆盖率要求

项目设置了以下覆盖率阈值：
- 分支覆盖率: 80%
- 函数覆盖率: 80%
- 行覆盖率: 80%
- 语句覆盖率: 80%

## 最佳实践

1. **命名清晰**: 测试名称应清楚描述测试的功能
2. **独立性**: 每个测试应该独立运行，不依赖其他测试
3. **快速执行**: 单元测试应该快速执行
4. **完整清理**: 集成测试和E2E测试应清理临时资源
5. **错误场景**: 不仅测试正常情况，也要测试错误和边界情况
6. **文档化**: 复杂的测试逻辑应有适当的注释说明

## 持续集成

在 CI/CD 环境中，测试按以下顺序执行：
1. 代码格式检查 (`npm run lint`)
2. 单元测试 (`npm run test:unit`)
3. 集成测试 (`npm run test:integration`)
4. 端到端测试 (`npm run test:e2e`)
5. 覆盖率检查

只有所有测试通过且覆盖率达标，才能合并代码或发布版本。