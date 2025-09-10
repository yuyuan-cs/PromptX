---
"@promptx/core": patch
"@promptx/mcp-server": patch
"@promptx/resource": patch
---

修复多个包的关键问题

### @promptx/core
- 修复 RegistryData 中的 null 引用错误，添加防御性编程检查
- 在所有资源操作方法中过滤 null 值，防止运行时崩溃

### @promptx/mcp-server
- 修复 package.json 路径错误，从 `../../package.json` 改为 `../package.json`
- 解决 npx 执行时找不到 package.json 的问题

### @promptx/resource
- 将 registry.json 从源码移到构建产物，避免每次构建产生 git 变更
- registry.json 现在只生成到 dist 目录，不再存在于源码中

### .github/workflows
- 修复 Docker workflow 无法自动触发的问题
- 移除 workflow_run 的 branches 过滤器，因为 tag 推送不属于任何分支