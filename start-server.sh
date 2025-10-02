#!/bin/bash
set -e

echo "🚀 启动 PromptX MCP 服务器"
echo "=========================="
echo ""

PROJECT_ROOT="/tmp/cc-agent/57782531/project"
cd "$PROJECT_ROOT"

# 设置 NODE_PATH 让 Node.js 能找到 workspace 包
export NODE_PATH="$PROJECT_ROOT/packages/logger/dist:$PROJECT_ROOT/packages/core/dist:$PROJECT_ROOT/packages/mcp-server/dist:$PROJECT_ROOT/node_modules"

echo "📍 项目路径: $PROJECT_ROOT"
echo "🔗 NODE_PATH: $NODE_PATH"
echo ""

# 检查构建文件
echo "📦 检查构建文件..."
if [ ! -f "packages/mcp-server/dist/mcp-server.js" ]; then
    echo "❌ MCP 服务器未构建"
    echo "请先运行: cd packages/mcp-server && npm run build"
    exit 1
fi

if [ ! -f "apps/web/dist/index.html" ]; then
    echo "❌ Web UI 未构建"
    echo "请先运行: cd apps/web && npx vite build"
    exit 1
fi

echo "✅ 所有文件已就绪"
echo ""

echo "🚀 启动服务器..."
echo "   地址: http://127.0.0.1:5203/ui"
echo ""
echo "按 Ctrl+C 停止服务器"
echo "=========================="
echo ""

# 启动服务器
node --trace-warnings packages/mcp-server/dist/mcp-server.js http --port 5203
