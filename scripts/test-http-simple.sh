#!/bin/bash

# PromptX HTTP MCP 简单测试脚本
# 使用纯 curl 命令测试各种场景

BASE_URL="http://localhost:3000"
SESSION_ID=""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_step() {
    echo -e "${BLUE}🔵 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}💡 $1${NC}"
}

# 检查服务是否运行
check_service() {
    print_step "检查 PromptX HTTP 服务状态..."
    
    response=$(curl -s -w "%{http_code}" -o /tmp/health_response.json "$BASE_URL/health" 2>/dev/null)
    http_code="${response: -3}"
    
    if [ "$http_code" -eq 200 ]; then
        print_success "服务运行正常"
        cat /tmp/health_response.json | jq . 2>/dev/null || cat /tmp/health_response.json
        echo
        return 0
    else
        print_error "服务未运行或出现错误 (HTTP $http_code)"
        print_info "请先启动服务: node src/bin/promptx.js mcp-server -t http -p 3000"
        return 1
    fi
}

# 获取工具列表（无状态）
test_tools_list() {
    print_step "获取工具列表..."
    
    curl -s -X POST "$BASE_URL/mcp" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json, text/event-stream" \
        -d '{
            "jsonrpc": "2.0",
            "method": "tools/list",
            "id": 1
        }' | jq . 2>/dev/null || echo "JSON 解析失败"
    echo
}

# 初始化会话
initialize_session() {
    print_step "初始化 MCP 会话..."
    
    response=$(curl -s -D /tmp/headers.txt -X POST "$BASE_URL/mcp" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json, text/event-stream" \
        -d '{
            "jsonrpc": "2.0",
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "clientInfo": {"name": "test-client", "version": "1.0.0"}
            },
            "id": 1
        }')
    
    # 提取会话ID
    SESSION_ID=$(grep -i "mcp-session-id" /tmp/headers.txt | cut -d' ' -f2 | tr -d '\r\n')
    
    if [ -n "$SESSION_ID" ]; then
        print_success "会话初始化成功，Session ID: $SESSION_ID"
    else
        print_info "未获取到会话ID，可能使用无状态模式"
    fi
    
    echo "$response" | jq . 2>/dev/null || echo "$response"
    echo
}

# 调用工具（带会话）
call_tool() {
    local tool_name="$1"
    local tool_args="$2"
    local description="$3"
    
    print_step "$description"
    
    local headers="Content-Type: application/json"
    if [ -n "$SESSION_ID" ]; then
        headers="$headers"$'\n'"mcp-session-id: $SESSION_ID"
    fi
    
    curl -s -X POST "$BASE_URL/mcp" \
        -H "$headers" \
        -d "{
            \"jsonrpc\": \"2.0\",
            \"method\": \"tools/call\",
            \"params\": {
                \"name\": \"$tool_name\",
                \"arguments\": $tool_args
            },
            \"id\": 2
        }" | jq . 2>/dev/null || echo "JSON 解析失败"
    echo
}

# 完整测试流程
run_full_test() {
    echo -e "${YELLOW}🚀 开始 PromptX HTTP MCP 完整测试...${NC}"
    echo
    
    # 1. 检查服务
    if ! check_service; then
        return 1
    fi
    
    # 2. 获取工具列表
    test_tools_list
    
    # 3. 初始化会话
    initialize_session
    
    # 4. 测试各种工具
    call_tool "promptx_init" "{}" "初始化 PromptX"
    call_tool "promptx_welcome" "{}" "角色发现"
    call_tool "promptx_action" '{"role": "product-manager"}' "激活产品经理角色"
    call_tool "promptx_learn" '{"resource": "thought://creativity"}' "学习创意思维"
    call_tool "promptx_remember" '{"content": "HTTP MCP 测试完成", "tags": "test,mcp"}' "存储测试记忆"
    call_tool "promptx_recall" '{"query": "test"}' "检索测试记忆"
    call_tool "promptx_tool" '{"tool_resource": "@tool://calculator", "parameters": {"operation": "add", "a": 2, "b": 3}}' "执行计算器工具"
    
    print_success "完整测试流程完成！"
}

# 单独测试某个工具
test_single_tool() {
    local tool_name="$1"
    local tool_args="$2"
    
    if [ -z "$tool_name" ]; then
        print_error "请指定工具名称"
        echo "用法: $0 tool <tool_name> [tool_args_json]"
        return 1
    fi
    
    if [ -z "$tool_args" ]; then
        tool_args="{}"
    fi
    
    check_service || return 1
    initialize_session
    call_tool "$tool_name" "$tool_args" "测试工具: $tool_name"
}

# 帮助信息
show_help() {
    echo -e "${BLUE}PromptX HTTP MCP 测试脚本${NC}"
    echo
    echo "用法:"
    echo "  $0 [命令] [参数]"
    echo
    echo "命令:"
    echo "  health              - 检查服务健康状态"
    echo "  tools               - 获取工具列表"
    echo "  init                - 初始化会话"
    echo "  full                - 运行完整测试流程"
    echo "  tool <name> [args]  - 测试单个工具"
    echo "  help                - 显示帮助信息"
    echo
    echo "示例:"
    echo "  $0 health"
    echo "  $0 full"
    echo "  $0 tool promptx_welcome"
    echo "  $0 tool promptx_action '{\"role\": \"copywriter\"}'"
    echo "  $0 tool promptx_remember '{\"content\": \"测试记忆\", \"tags\": \"test\"}'"
    echo
    echo "注意:"
    echo "  - 确保 PromptX HTTP 服务已启动"
    echo "  - 启动命令: node src/bin/promptx.js mcp-server -t http -p 3000"
    echo "  - 需要安装 jq 来格式化 JSON 输出: brew install jq (macOS)"
}

# 主逻辑
case "$1" in
    "health")
        check_service
        ;;
    "tools")
        check_service && test_tools_list
        ;;
    "init")
        check_service && initialize_session
        ;;
    "full")
        run_full_test
        ;;
    "tool")
        test_single_tool "$2" "$3"
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    "")
        show_help
        ;;
    *)
        print_error "未知命令: $1"
        show_help
        exit 1
        ;;
esac

# 清理临时文件
rm -f /tmp/health_response.json /tmp/headers.txt 2>/dev/null