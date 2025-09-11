---
"@promptx/core": patch
"@promptx/mcp-server": patch
---

refactor: 优化 Docker 发布流程

- 将 Docker 发布集成到主发布工作流中
- 修复 workflow_run 触发不稳定的问题
- 确保 Docker 镜像在 npm 包发布成功后自动构建