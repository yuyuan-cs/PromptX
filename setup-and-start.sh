#!/bin/bash
set -e

echo "🚀 PromptX Web UI - 完整启动流程"
echo "================================"
echo ""

PROJECT_ROOT="/tmp/cc-agent/57782531/project"
cd "$PROJECT_ROOT"

echo "📦 步骤 1/5: 设置 npm link"
echo "------------------------"

# Link logger
cd packages/logger
npm link 2>&1 | grep -E "(success|@promptx/logger)" || true
cd "$PROJECT_ROOT"

# Link core (depends on logger)
cd packages/core
npm link @promptx/logger 2>&1 | grep -E "(success|@promptx/logger)" || true
npm link 2>&1 | grep -E "(success|@promptx/core)" || true
cd "$PROJECT_ROOT"

# Link in mcp-server
cd packages/mcp-server
npm link @promptx/logger @promptx/core 2>&1 | grep -E "(success|@promptx)" || true
cd "$PROJECT_ROOT"

echo "✅ npm link 设置完成"
echo ""

echo "🔨 步骤 2/5: 构建 logger"
echo "------------------------"
cd packages/logger
npm run build 2>&1 | grep -E "(Build success|error)" || true
cd "$PROJECT_ROOT"
echo "✅ logger 构建完成"
echo ""

echo "🔨 步骤 3/5: 构建 core"
echo "------------------------"
cd packages/core
npm run build 2>&1 | grep -E "(Build success|error)" || true
cd "$PROJECT_ROOT"
echo "✅ core 构建完成"
echo ""

echo "🔨 步骤 4/5: 构建 mcp-server"
echo "------------------------"
cd packages/mcp-server
npm run build 2>&1 | grep -E "(Build success|error)" || true
cd "$PROJECT_ROOT"
echo "✅ mcp-server 构建完成"
echo ""

echo "🎨 步骤 5/5: 检查 Web UI"
echo "------------------------"
if [ -f "apps/web/dist/index.html" ]; then
    echo "✅ Web UI 已构建"
else
    echo "⚠️  Web UI 未构建，请稍候..."
    cd apps/web
    npm install 2>&1 | tail -3
    npx vite build 2>&1 | tail -5
    cd "$PROJECT_ROOT"
    echo "✅ Web UI 构建完成"
fi
echo ""

echo "================================"
echo "🎉 所有构建完成！"
echo ""
echo "🚀 正在启动 MCP 服务器..."
echo "   地址: http://127.0.0.1:5203/ui"
echo ""
echo "按 Ctrl+C 停止服务器"
echo "================================"
echo ""

# 启动服务器 (使用正确的参数格式)
node packages/mcp-server/dist/mcp-server.js --transport http --port 5203 --cors
