# 工作流管理指南

## 🔄 工作流同步策略

### 自动同步（推荐用于紧急修复）

当你在 `develop` 分支修改工作流文件时，`sync-workflows.yml` 会自动将变更同步到 `main` 和 `test` 分支。

**触发条件**：
- 在 `develop` 分支推送
- 修改了 `.github/workflows/` 下的文件

**同步目标**：
- `main` 分支（生产环境）
- `test` 分支（测试环境）

### PR 同步（推荐用于重要变更）

使用 `workflow-sync-pr.yml` 创建同步 PR，适合需要审核的重要工作流变更。

**使用方法**：
1. 在 Actions 页面手动触发 `Workflow Sync via PR`
2. 选择目标分支和同步模式
3. 系统会创建 PR 供审核

### 手动同步特定分支

```bash
# 同步所有工作流到 staging
gh workflow run sync-workflows.yml -f target_branches=staging

# 同步到多个分支
gh workflow run sync-workflows.yml -f target_branches=main,test,staging
```

## 📋 工作流分类

### 核心工作流（需要同步到所有分支）
- `version-management.yml` - 版本管理
- `auto-version-on-merge.yml` - 自动版本升级
- `release-preview.yml` - 发版预览
- `cleanup-version-branches.yml` - 分支清理
- `auto-label-pr.yml` - PR 自动标签

### 环境特定工作流（可能需要分支差异）
- `npm-*-release.yml` - NPM 发布工作流
- 部署相关工作流

### 辅助工作流（通常只在 develop 运行）
- `sync-workflows.yml` - 工作流同步
- `workflow-sync-pr.yml` - PR 方式同步

## ⚠️ 注意事项

1. **Secrets 兼容性**：确保目标分支环境有必需的 secrets
2. **分支保护规则**：某些分支可能需要通过 PR 才能修改
3. **工作流触发条件**：注意不同分支可能需要不同的触发条件
4. **回滚计划**：重要变更前记录当前版本，便于回滚

## 🚀 最佳实践

1. **开发流程**：
   - 在 `develop` 分支开发和测试工作流
   - 小修复可以自动同步
   - 重大变更使用 PR 同步

2. **版本控制**：
   - 工作流文件也要遵循语义化版本
   - 在提交信息中说明变更内容

3. **测试验证**：
   - 同步后在目标分支创建测试 PR 验证
   - 确保工作流在所有环境正常运行

4. **文档更新**：
   - 修改工作流时同步更新本文档
   - 记录特殊配置和依赖关系