---
"@promptx/mcp-server": patch
---

添加时间显示到 PromptX 输出状态栏

- 在 MCPOutputAdapter 中添加当前时间显示功能
- 使用 ISO 格式 (YYYY-MM-DD HH:MM:SS) 显示时间
- 时间信息显示在状态栏第一行，使用 📅 emoji 标识
- 解决 Issue #403：让 AI 能够知道当前时间，便于处理时间相关任务