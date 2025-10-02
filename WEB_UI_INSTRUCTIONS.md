# 🎯 PromptX Web UI - 现在就能用！

## ⚡ 一条命令启动

```bash
./quick-start.sh
```

然后打开浏览器：**`http://127.0.0.1:5203/ui`**

---

## 📋 这个脚本做了什么？

1. 构建 `@promptx/logger` 包
2. 构建 `@promptx/core` 包
3. 构建 `@promptx/mcp-server` 包
4. 检查 Web UI（已构建✅）
5. 启动 MCP 服务器在端口 5203

**所有依赖都会自动处理！**

---

## ✅ 已完成的改进

### 1. **CORS 支持** ✅
Web UI 现在可以直接连接到 MCP 服务器，无需代理。

### 2. **静态文件托管** ✅
MCP 服务器在 `/ui` 路径自动托管 Web UI。

### 3. **会话管理** ✅
自动初始化和管理 MCP 会话。

### 4. **构建修复** ✅
- 修复了图标导入问题
- 修复了 JSON 导入语法
- Web UI 已成功构建

---

## 🎨 功能概览

### 🏠 Home
系统概览和快速开始

### 👥 Roles
浏览和激活 AI 角色（Nuwa、Luban、Sean等）

### 🛠️ Tools
查看所有可用工具和文档

### 📁 Projects
绑定项目，访问项目特定资源

### 🧠 Memory
存储和检索知识片段

---

## 🚀 立即开始

**3步启动：**

```bash
# 1. 进入项目目录
cd ~/project

# 2. 运行启动脚本
./quick-start.sh

# 3. 打开浏览器
# http://127.0.0.1:5203/ui
```

**就这么简单！**

---

## 💡 关键点

- ❌ **不要运行** `npm install pnpm` - 不需要！
- ❌ **不要运行** `npx @promptx/mcp-server` - 包还未发布
- ✅ **直接运行** `./quick-start.sh` - 一键搞定！

---

## 📞 需要帮助？

查看详细文档：
- `QUICKSTART.md` - 快速启动指南
- `START_WEB_UI.md` - 完整启动指南（包含故障排查）

---

**准备好了吗？开始吧！** 🚀

```bash
./quick-start.sh
```
