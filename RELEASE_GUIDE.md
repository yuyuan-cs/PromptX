# GitLab Flow Release 流程指南

## 🚀 完整发布流程

### 步骤 0: 添加变更记录（开发时）
```bash
# 添加变更记录
pnpm changeset

# 选择：
# 1. 哪些包有变更
# 2. 版本类型（major/minor/patch）
# 3. 输入变更描述
```

### 步骤 1: 开始新版本
1. 进入 GitHub Actions 页面
2. 选择 "Start Release" workflow
3. 点击 "Run workflow"
4. 可选：输入自定义版本号（留空则根据 changesets 自动计算）
5. 点击运行

这会自动：
- 创建 `release/1.10.0` 分支
- 更新所有包版本号
- 创建 PR 到 main

### 步骤 2: 准备发布
1. 在 PR 中添加 release notes
2. 运行测试确保通过
3. Review 代码变更
4. 合并 PR 到 main

### 步骤 3: 创建 Tag 触发发布
```bash
git checkout main
git pull origin main
git tag v1.10.0
git push origin v1.10.0
```

这会自动触发：
- 发布所有包到 npm
- 构建 Desktop 应用（Mac/Win/Linux）
- 创建 GitHub Release
- 上传所有构建产物

## 🔥 Hotfix 流程

### 当需要紧急修复时：
1. 进入 "Hotfix" workflow
2. 输入 hotfix 版本（如 `1.9.1`）
3. 输入基础 tag（如 `v1.9.0`）
4. 运行 workflow

### 修复后：
1. 在 hotfix 分支上修复问题
2. 合并 PR 到 main
3. 创建新 tag：
```bash
git tag v1.9.1
git push origin v1.9.1
```

## 📋 版本号规范

遵循 Semantic Versioning：
- **Major** (x.0.0): 不兼容的 API 变更
- **Minor** (1.x.0): 新功能，向后兼容
- **Patch** (1.9.x): Bug 修复，向后兼容

## ⚠️ 注意事项

1. **不要直接在 main 分支操作**
2. **所有发布必须通过 release 分支**
3. **Tag 必须以 `v` 开头**（如 `v1.10.0`）
4. **发布前确保设置了 NPM_TOKEN secret**

## 🔐 需要的 Secrets

在 GitHub 仓库设置中添加：
- `NPM_TOKEN`: npm 发布 token
- `GITHUB_TOKEN`: 自动提供，无需设置

## 🎯 快速命令

### 查看当前版本
```bash
cat package.json | grep version
```

### 查看最新 tag
```bash
git describe --tags --abbrev=0
```

### 查看所有 release 分支
```bash
git branch -r | grep release/
```

## 📊 发布检查清单

发布前确认：
- [ ] 所有测试通过
- [ ] CHANGELOG 已更新
- [ ] 版本号正确
- [ ] 文档已更新
- [ ] Breaking changes 已标注

## 💡 常见问题

### Q: 发布失败怎么办？
A: 检查 Actions 日志，修复问题后重新 tag

### Q: 如何撤销发布？
A: 
1. 删除 tag: `git push --delete origin v1.10.0`
2. npm unpublish（24小时内）
3. 删除 GitHub Release

### Q: 如何发布预发布版本？
A: 使用带预发布标识的版本号，如 `1.10.0-beta.1`