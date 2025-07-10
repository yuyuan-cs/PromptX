# Workflow同步机制测试计划

## 🎯 测试目标
确保workflow修改能正确同步到所有活跃分支（test, staging, main）

## 📋 测试步骤

### 1. 自动同步测试
```bash
# 在develop分支
1. 修改任意workflow文件（如添加注释）
2. git add .github/workflows/xxx.yml
3. git commit -m "test: 测试workflow自动同步"
4. git push origin develop

# 预期结果
- 自动触发sync-workflows.yml
- 同步到test, staging, main三个分支
- 每个分支都有相同的workflow文件
```

### 2. 手动同步测试
```bash
# 通过GitHub Actions页面
1. 进入Actions → Sync Workflows
2. 点击"Run workflow"
3. 保持默认值或自定义target_branches
4. 运行

# 预期结果
- 成功同步到指定分支
- Summary显示同步详情
```

### 3. PR同步测试
```bash
# 通过GitHub Actions页面
1. 进入Actions → Workflow Sync via PR
2. 选择目标分支（如staging）
3. 选择sync_mode为"all"
4. 运行

# 预期结果
- 创建同步PR
- PR包含所有workflow差异
```

## ⚠️ 注意事项
1. 同步前确保目标分支存在
2. 注意分支保护规则可能阻止直接push
3. main分支后续会改名为release

## ✅ 验证清单
- [ ] develop → test 同步成功
- [ ] develop → staging 同步成功
- [ ] develop → main 同步成功
- [ ] 手动触发可以自定义分支
- [ ] PR方式可以创建同步PR
- [ ] 同步后各分支workflow一致