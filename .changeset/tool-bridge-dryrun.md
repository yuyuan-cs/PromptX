---
"@promptx/core": minor
"@promptx/mcp-server": minor
"@promptx/resource": patch
---

feat: 工具测试能力增强 - ToolBridge 模式与 dry-run 支持

## 核心功能

### 🌉 ToolBridge - 外部依赖隔离层
- 新增 `ToolBridge` 类，实现工具与外部依赖的解耦
- 支持 real/mock 双模式实现，便于测试和开发
- 通过 `api.bridge.execute()` 统一调用外部服务
- 自动批量测试所有 Bridge 的 mock 实现

### 🧪 Dry-run 测试模式
- 新增 `dryrun` 执行模式，无需真实凭证即可测试工具
- 在 ToolCommand 和 MCP 层面完整支持 dry-run
- 提供详细的 Bridge 测试报告（成功/失败统计）
- 大幅降低工具开发和调试成本

### 🤖 Luban 角色能力增强
- **技术调研思维**：编码前必须验证技术方案
- **测试驱动开发**：dry-run 优先的开发流程
- **完整测试工作流**：从 dry-run 到真实集成测试
- **智能诊断修复**：自动分析错误并寻找解决方案

## 技术改进

### API 设计优化
- 简化 Bridge API：`api.bridge.execute()` 而非 `api.executeBridge()`
- 保持与 logger、environment 等服务一致的 API 风格
- Bridge 实例按需加载（lazy loading）

### 向后兼容性
- 完全兼容没有 Bridge 的现有工具
- Bridge 功能是可选的，不影响传统工具执行
- 默认执行模式保持不变

## 开发者体验提升

### 工具开发流程改进
1. 先设计 mock 实现，再写真实逻辑
2. 通过 dry-run 快速验证工具逻辑
3. 无需等待用户提供凭证即可测试
4. 错误诊断和修复循环自动化

### 测试成本降低
- Dry-run 测试：几秒钟，零成本
- 早期发现问题，避免生产环境故障
- Mock 数据真实可靠，覆盖各种场景

## 文件变更摘要

### 新增文件
- `packages/core/src/toolx/api/ToolBridge.js` - Bridge 核心实现
- `packages/core/examples/tool-with-bridge.example.js` - 使用示例
- `packages/resource/.../luban/execution/bridge-design.execution.md` - Bridge 设计规范
- `packages/resource/.../luban/thought/dryrun-first.thought.md` - 测试思维
- `packages/resource/.../luban/thought/research-first.thought.md` - 调研思维

### 主要修改
- `ToolCommand.js` - 添加 dryrun 模式支持和输出格式
- `ToolSandbox.js` - 实现 dryRun() 方法
- `ToolAPI.js` - 添加 bridge getter 和工具实例管理
- `toolx.ts` - MCP 层添加 dryrun 模式

## 影响范围

- 工具开发者：获得更强大的测试和隔离能力
- AI Agent：Luban 能够更可靠地创建和测试工具
- 最终用户：工具质量提升，首次成功率更高

## 迁移指南

现有工具无需修改。新工具可选择性使用 Bridge 模式：

```javascript
// 定义 Bridge
getBridges() {
  return {
    'service:operation': {
      real: async (args, api) => { /* 真实实现 */ },
      mock: async (args, api) => { /* Mock 实现 */ }
    }
  };
}

// 使用 Bridge
async execute(params) {
  const result = await this.api.bridge.execute('service:operation', args);
}
```

## 相关 Issue
- Fixes #376 - Luban 缺少测试环境的问题