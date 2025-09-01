---
"@promptx/resource": minor
"@promptx/logger": patch
---

## @promptx/resource

### 新功能
- 添加 `promptx-log-viewer` 工具，用于查询和分析 PromptX 系统日志
  - 支持时间范围查询（相对时间如 "30m", "2h" 或绝对时间）
  - 支持日志级别过滤（trace, debug, info, warn, error, fatal）
  - 支持关键词、包名、文件名、进程ID等多维度过滤
  - 返回结果同时包含 UTC 时间和本地时间显示
  - 专为 AI 诊断系统问题设计，返回结构化 JSON 数据

### 改进
- 修复 Luban 角色的工具创建路径文档，明确用户级工具存储在 `resource/tool/` 目录

## @promptx/logger

### 修复
- 优化 Electron 环境下的日志处理，避免 worker thread 问题
- 改进日志格式，确保与 promptx-log-viewer 工具的兼容性

## 其他改进

### 构建系统
- 更新 Turbo 配置，添加 `resources/**` 和 `scripts/**` 到构建输入监控
- 确保资源文件修改能正确触发重新构建，避免缓存问题

### Git Hooks
- 修复 Windows Git Bash 环境下 lefthook commit-msg 钩子的兼容性问题
- 简化 commitlint 命令，避免多行脚本解析错误