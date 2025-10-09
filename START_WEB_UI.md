# 🚀 启动 PromptX Web UI

## 问题诊断

你遇到的错误是因为 `@promptx/mcp-server` 包还没有发布到 npm registry，无法通过 `npx` 直接运行。

需要在项目本地构建并运行。

## ✅ 正确的启动步骤

### 方法1：使用项目脚本（推荐）

```bash
# 1. 回到项目根目录
cd ~/project  # 或你的项目路径

# 2. 安装所有依赖
npm install

# 3. 构建所有包（使用workspace）
cd packages/logger && pnpm install && pnpm run build
cd ../core && pnpm install && pnpm run build
cd ../mcp-server && pnpm install && pnpm run build
cd ../..

# 4. 确保 Web UI 已构建
cd apps/web && npm install && npx vite build && cd ../..

# 5. 从项目根目录启动服务器
node packages/mcp-server/dist/mcp-server.js http --port 5203
```

### 方法2：使用 npm link（更优雅）

```bash
# 1. Link 内部依赖
cd packages/logger && npm link && cd ../..
cd packages/core && npm link @promptx/logger && npm link && cd ../..
cd packages/mcp-server && npm link @promptx/logger && npm link @promptx/core && cd ../..

# 2. 构建所有包
cd packages/logger && npm run build && cd ../..
cd packages/core && npm run build && cd ../..
cd packages/mcp-server && npm run build && cd ../..

# 3. 构建 Web UI
cd apps/web && npm install && npx vite build && cd ../..

# 4. 启动服务器
node packages/mcp-server/dist/mcp-server.js http --port 5203
```

### 方法3：一键启动脚本

创建文件 `start-webui.sh`:

```bash
#!/bin/bash
set -e

PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$PROJECT_ROOT"

echo "📦 安装依赖..."
npm install

echo "🔨 构建 logger..."
cd packages/logger
npm install
npm run build
cd ../..

echo "🔨 构建 core..."
cd packages/core
npm install
npm run build
cd ../..

echo "🔨 构建 mcp-server..."
cd packages/mcp-server
npm install
npm run build
cd ../..

echo "🎨 构建 Web UI..."
cd apps/web
npm install
npx vite build
cd ../..

echo "✅ 构建完成!"
echo ""
echo "🚀 启动 MCP 服务器..."
node packages/mcp-server/dist/mcp-server.js http --port 5203
```

然后运行：
```bash
chmod +x start-webui.sh
./start-webui.sh
```

## 📋 验证服务

### 1. 检查服务器是否运行

```bash
curl http://127.0.0.1:5203/health
```

应该返回：
```json
{
  "status": "ok",
  "service": "mcp-server",
  "transport": "http"
}
```

### 2. 访问 Web UI

打开浏览器：
```
http://127.0.0.1:5203/ui
```

### 3. 检查日志

服务器会在终端输出日志，应该看到：
```
HTTP server listening on http://127.0.0.1:5203/mcp
Web UI static files served at /ui
```

## 🔧 故障排查

### 问题1：模块找不到错误

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@promptx/logger'
```

**解决**：确保按顺序构建所有依赖包
```bash
cd packages/logger && npm run build
cd ../core && npm run build
cd ../mcp-server && npm run build
```

### 问题2：端口被占用

```
Error: listen EADDRINUSE: address already in use :::5203
```

**解决**：更换端口或杀掉占用进程
```bash
# 查找占用进程
lsof -i :5203

# 杀掉进程
kill -9 <PID>

# 或使用其他端口
node packages/mcp-server/dist/mcp-server.js http --port 5204
```

### 问题3：Web UI 显示空白

**解决**：
1. 确认 Web UI 已构建
```bash
ls apps/web/dist/index.html
```

2. 检查服务器日志，应该看到：
```
Web UI static files served at /ui
```

3. 清除浏览器缓存并刷新

### 问题4：CORS 错误

这已经修复了！如果仍然看到CORS错误：
1. 确保使用最新构建的代码
2. 重启服务器
3. 刷新浏览器

## 📚 项目结构

```
project/
├── packages/
│   ├── logger/         # 日志工具
│   ├── core/           # 核心功能
│   └── mcp-server/     # MCP 服务器
├── apps/
│   └── web/            # Web UI
│       └── dist/       # 构建输出（服务器托管这个目录）
└── package.json
```

## 💡 开发提示

### 监听模式（开发时使用）

```bash
# 终端1 - 监听 mcp-server 变化
cd packages/mcp-server
npm run dev

# 终端2 - 监听 Web UI 变化
cd apps/web
npm run dev  # 使用 vite 开发服务器

# 终端3 - 运行 MCP 服务器
node packages/mcp-server/dist/mcp-server.js http --port 5203
```

### 生产构建

```bash
# 构建所有包
npm run build  # 使用 turbo

# 或手动构建
cd packages/logger && npm run build
cd ../core && npm run build
cd ../mcp-server && npm run build
cd ../../apps/web && npx vite build
```

## 🎉 成功标志

当你看到以下内容时，说明一切正常：

1. **服务器启动日志**：
```
HTTP server listening on http://127.0.0.1:5203/mcp
Web UI static files served at /ui
Worker pool initialized
```

2. **健康检查通过**：
```bash
$ curl http://127.0.0.1:5203/health
{"status":"ok","service":"mcp-server"}
```

3. **浏览器访问成功**：
   - 打开 `http://127.0.0.1:5203/ui`
   - 看到 PromptX Web UI 界面
   - 控制台显示："Session initialized successfully"

现在就可以开始使用 PromptX Web UI 了！🚀
