#!/bin/bash

# PromptX 工作流测试脚本
# 用于安全地测试GitHub Actions工作流

set -e

echo "🧪 PromptX Workflow Testing Tool"
echo "================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查act是否安装
if ! command -v act &> /dev/null; then
    echo -e "${RED}❌ act is not installed${NC}"
    echo "Please install act first: brew install act"
    exit 1
fi

# 函数：运行工作流测试
run_workflow_test() {
    local workflow=$1
    local event=$2
    local description=$3
    
    echo -e "\n${YELLOW}🔄 Testing: ${description}${NC}"
    echo "Workflow: $workflow"
    echo "Event: $event"
    echo "---"
    
    # 先做dry run
    echo "Performing dry run..."
    act -W .github/workflows/${workflow} ${event} --env-file .env.act -n
    
    # 询问是否继续
    read -p "Continue with actual test? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        act -W .github/workflows/${workflow} ${event} --env-file .env.act
        echo -e "${GREEN}✅ Test completed${NC}"
    else
        echo -e "${YELLOW}⏭️  Skipped${NC}"
    fi
}

# 主菜单
while true; do
    echo -e "\n${GREEN}Select a test to run:${NC}"
    echo "1) Test CI workflow (push event)"
    echo "2) Test CI workflow (pull_request event)"
    echo "3) Test Release workflow (dry run)"
    echo "4) Test all workflows"
    echo "5) List all workflows"
    echo "6) Clean Docker containers"
    echo "q) Quit"
    
    read -p "Enter your choice: " choice
    
    case $choice in
        1)
            run_workflow_test "ci.yml" "push" "CI workflow with push event"
            ;;
        2)
            run_workflow_test "ci.yml" "pull_request" "CI workflow with pull_request event"
            ;;
        3)
            echo -e "\n${YELLOW}Testing Release workflow (always in dry-run mode)${NC}"
            act -W .github/workflows/release.yml workflow_dispatch \
                --env-file .env.act \
                -e '{"inputs":{"dry_run":"true","release_type":"alpha"}}'
            ;;
        4)
            echo -e "\n${YELLOW}Running all workflow tests${NC}"
            run_workflow_test "ci.yml" "push" "CI workflow with push event"
            run_workflow_test "ci.yml" "pull_request" "CI workflow with pull_request event"
            ;;
        5)
            echo -e "\n${GREEN}Available workflows:${NC}"
            ls -la .github/workflows/
            ;;
        6)
            echo -e "\n${YELLOW}Cleaning Docker containers${NC}"
            docker ps -a | grep act | awk '{print $1}' | xargs -r docker rm -f
            echo -e "${GREEN}✅ Cleanup completed${NC}"
            ;;
        q|Q)
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            ;;
    esac
done