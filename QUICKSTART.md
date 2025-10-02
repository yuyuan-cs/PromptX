# 🚀 一键启动 PromptX Web UI

## 超级简单的启动方法

### 方法1：使用启动脚本（推荐）⭐

```bash
# 在项目根目录运行
./quick-start.sh
```

这个脚本会：
1. ✅ 自动构建所有依赖包
2. ✅ 检查 Web UI 是否已构建
3. ✅ 启动 MCP 服务器
4. ✅ 打开 http://127.0.0.1:5203/ui

**就这么简单！**

---

### 方法2：手动启动

如果你想分步执行：

```bash
# 步骤1：构建依赖
cd packages/logger && npm install --legacy-peer-deps && npm run build && cd ../..
cd packages/core && npm install --legacy-peer-deps && npm run build && cd ../..
cd packages/mcp-server && npm install --legacy-peer-deps && npm run build && cd ../..

# 步骤2：启动服务器
node packages/mcp-server/dist/mcp-server.js http --port 5203
```

---

## 📍 访问地址

启动成功后，打开浏览器访问：

```
http://127.0.0.1:5203/ui
```

## ✅ 验证服务

检查服务器是否正常运行：

```bash
curl http://127.0.0.1:5203/health
```

应该返回：
```json
{"status":"ok","service":"mcp-server","transport":"http"}
```

## 🎯 功能预览

### Home 页面
- 系统概览
- 快速开始指南

### Roles 页面
- 浏览所有可用角色（Nuwa、Luban、Sean等）
- 一键激活角色

### Tools 页面
- 查看所有工具
- 工具文档

### Projects 页面
- 绑定项目目录
- 访问项目特定资源

### Memory 页面
- 存储和检索知识

## 🐛 遇到问题？

### 问题1：`npm install pnpm` 报错

**不要安装 pnpm！** 直接使用 npm 运行脚本即可。

### 问题2：端口被占用

```bash
# 查找占用进程
lsof -i :5203

# 或使用其他端口
node packages/mcp-server/dist/mcp-server.js http --port 5204
```

### 问题3：模块找不到

确保按顺序构建了所有包：
```bash
./quick-start.sh
```

### 问题4：Web UI 显示空白

1. 检查构建是否成功：
```bash
ls apps/web/dist/index.html
```

2. 查看浏览器控制台（F12）是否有错误

3. 刷新页面（Ctrl+Shift+R 强制刷新）

## 📝 开发模式

如果你需要修改代码并实时预览：

```bash
# 终端1：监听 mcp-server 变化
cd packages/mcp-server
npm run dev

# 终端2：监听 Web UI 变化
cd apps/web
npm run dev

# 终端3：运行服务器
node packages/mcp-server/dist/mcp-server.js http --port 5203
```

## 🎉 成功标志

当你看到这些输出，说明成功了：

```
HTTP server listening on http://127.0.0.1:5203/mcp
Web UI static files served at /ui
Worker pool initialized
```

然后访问 `http://127.0.0.1:5203/ui` 就能看到界面了！

---

**享受使用 PromptX！** 🚀

如果有问题，查看完整文档：`START_WEB_UI.md`
