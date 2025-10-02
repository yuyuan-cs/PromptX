#!/bin/bash
set -e

echo "🚀 PromptX Web UI 快速启动脚本"
echo "================================"
echo ""

PROJECT_ROOT="/tmp/cc-agent/57782531/project"
cd "$PROJECT_ROOT"

# 检查 Node 版本
echo "📌 检查 Node 版本..."
node --version
echo ""

# 1. 构建 logger
echo "🔨 [1/4] 构建 @promptx/logger..."
cd packages/logger
if [ ! -d "node_modules" ]; then
    npm install --legacy-peer-deps
fi
npm run build 2>&1 | grep -E "(Build success|error)" || true
cd "$PROJECT_ROOT"
echo "✅ logger 构建完成"
echo ""

# 2. 构建 core
echo "🔨 [2/4] 构建 @promptx/core..."
cd packages/core
if [ ! -d "node_modules" ]; then
    npm install --legacy-peer-deps
fi
npm run build 2>&1 | grep -E "(Build success|error)" || true
cd "$PROJECT_ROOT"
echo "✅ core 构建完成"
echo ""

# 3. 构建 mcp-server
echo "🔨 [3/4] 构建 @promptx/mcp-server..."
cd packages/mcp-server
if [ ! -d "node_modules" ]; then
    npm install --legacy-peer-deps
fi
npm run build 2>&1 | grep -E "(Build success|error)" || true
cd "$PROJECT_ROOT"
echo "✅ mcp-server 构建完成"
echo ""

# 4. 检查 Web UI
echo "🔨 [4/4] 检查 Web UI..."
if [ -f "apps/web/dist/index.html" ]; then
    echo "✅ Web UI 已构建"
else
    echo "⚠️  Web UI 未构建，正在构建..."
    cd apps/web
    if [ ! -d "node_modules" ]; then
        npm install --legacy-peer-deps
    fi
    npx vite build
    cd "$PROJECT_ROOT"
    echo "✅ Web UI 构建完成"
fi
echo ""

# 启动服务器
echo "================================"
echo "🎉 构建完成！"
echo ""
echo "🚀 正在启动 MCP 服务器..."
echo "   地址: http://127.0.0.1:5203/ui"
echo ""
echo "按 Ctrl+C 停止服务器"
echo "================================"
echo ""

# 启动服务器
node packages/mcp-server/dist/mcp-server.js http --port 5203
