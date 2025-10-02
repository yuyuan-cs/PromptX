# 🚀 最简单的启动方法

## 在你的 Mac 终端运行

### 方法1：直接启动（推荐）

```bash
# 1. 进入项目目录
cd ~/project

# 2. 启动服务器
node packages/mcp-server/dist/mcp-server.js --transport http --port 5203 --cors
```

### 方法2：使用脚本

```bash
# 1. 进入项目目录
cd ~/project

# 2. 赋予执行权限
chmod +x setup-and-start.sh

# 3. 运行脚本
./setup-and-start.sh
```

## 访问 Web UI

打开浏览器访问：
```
http://localhost:5203/ui
```

## 验证服务

另开一个终端窗口，运行：
```bash
curl http://localhost:5203/health
```

应该返回：
```json
{"status":"ok","service":"mcp-server","transport":"http"}
```

## 停止服务器

在运行服务器的终端按：`Ctrl + C`

---

## 如果遇到问题

### 问题1：提示找不到模块

运行：
```bash
cd ~/project

# 设置 npm link
cd packages/logger && npm link && cd ../..
cd packages/core && npm link @promptx/logger && npm link && cd ../..
cd packages/mcp-server && npm link @promptx/logger @promptx/core && cd ../..

# 然后重新启动服务器
node packages/mcp-server/dist/mcp-server.js --transport http --port 5203 --cors
```

### 问题2：端口被占用

```bash
# 使用其他端口
node packages/mcp-server/dist/mcp-server.js --transport http --port 5204 --cors
# 然后访问 http://localhost:5204/ui
```

### 问题3：构建文件不存在

```bash
cd ~/project

# 重新构建
cd packages/logger && npm run build && cd ../..
cd packages/core && npm run build && cd ../..
cd packages/mcp-server && npm run build && cd ../..
cd apps/web && npx vite build && cd ../..

# 然后启动服务器
node packages/mcp-server/dist/mcp-server.js --transport http --port 5203 --cors
```

---

## 🎉 成功标志

看到这些日志说明启动成功了：

```
[INFO] PromptX MCP Server v1.23.0
[INFO] HTTP server listening on http://localhost:5203/mcp
[INFO] Web UI static files served at /ui
[INFO] HTTP Server Ready at http://localhost:5203
```

然后在浏览器打开 `http://localhost:5203/ui` 就能看到界面了！
