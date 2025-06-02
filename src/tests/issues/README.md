# Issues E2E 测试套件

这个目录包含了专门针对已知问题的端到端测试，用于重现、验证和防止回归。

## 测试文件说明

### 1. `platform-folders.e2e.test.js`
**目标问题**: Windows环境下platform-folders包的兼容性问题

**测试内容**:
- 模拟Windows环境和NPX执行环境
- 重现platform-folders包导入失败的问题
- 验证fallback机制的有效性
- 测试替代方案（env-paths）的可行性
- 验证跨平台路径解析的一致性

**运行方式**:
```bash
# 运行platform-folders相关测试
npm run test:e2e -- --testNamePattern="Platform-Folders"
```

### 2. `protocol-path-warning.e2e.test.js`
**目标问题**: 协议文件路径解析中的警告问题

**测试内容**:
- 重现协议路径转换错误（@package:// → @packages://promptx/）
- 模拟PackageProtocol路径解析问题
- 验证文件访问验证逻辑
- 测试CLI命令中的协议警告
- 验证核心功能不受路径警告影响

**运行方式**:
```bash
# 运行协议路径警告相关测试
npm run test:e2e -- --testNamePattern="协议路径警告"
```

## 测试策略

### 问题重现
1. **精确模拟问题环境**: 通过mock和环境变量模拟实际问题场景
2. **捕获错误信息**: 详细记录错误消息和警告，与实际问题描述对比
3. **验证影响范围**: 确认问题对系统功能的实际影响程度

### 解决方案验证
1. **替代方案测试**: 验证建议的解决方案是否有效
2. **回归防护**: 确保修复不会引入新问题
3. **兼容性测试**: 验证解决方案在不同环境下的表现

### 错误处理
1. **Graceful degradation**: 验证系统在问题出现时的优雅降级
2. **Fallback机制**: 测试备用方案的有效性
3. **用户体验**: 确保即使有问题，用户仍能正常使用核心功能

## 运行所有问题测试

```bash
# 运行所有issues相关的e2e测试
npm run test:e2e -- src/tests/issues/

# 运行单个问题测试
npm run test:e2e -- src/tests/issues/platform-folders.e2e.test.js
npm run test:e2e -- src/tests/issues/protocol-path-warning.e2e.test.js

# 以详细模式运行，查看所有输出
npm run test:e2e -- --verbose src/tests/issues/
```

## 测试结果解读

### 成功情况
- ✅ 表示成功重现了问题
- ✅ 表示验证了解决方案有效性
- ℹ️ 表示信息性输出，无问题发现

### 失败情况
测试失败可能意味着：
1. 问题已经被修复（好事！）
2. 测试环境设置有误
3. 问题重现条件不准确

### 警告情况
- ⚠️ 表示检测到了预期的警告信息
- 这些警告不一定是错误，可能是已知的非关键问题

## 添加新的问题测试

当发现新问题时，请：

1. **创建新的测试文件**: `new-issue-name.e2e.test.js`
2. **遵循现有模式**: 
   - 问题重现
   - 解决方案验证
   - 回归防护
3. **更新本文档**: 添加新测试的说明

## 注意事项

1. **测试隔离**: 每个测试都应该独立运行，不依赖其他测试的状态
2. **环境清理**: 使用beforeAll/afterAll进行环境设置和清理
3. **Mock恢复**: 确保所有mock在测试结束后都被正确恢复
4. **超时设置**: E2E测试可能需要较长时间，设置合适的超时时间 