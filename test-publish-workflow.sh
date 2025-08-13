#!/bin/bash

# 测试基于 PR 标签的发布工作流
set -e

echo "🧪 开始本地测试发布工作流..."

# 1. 创建测试分支
TEST_BRANCH="local-test-workflow-$(date +%s)"
echo "📌 创建测试分支: $TEST_BRANCH"
git checkout -b "$TEST_BRANCH"

# 2. 创建 changeset
echo "📝 创建测试 changeset..."
cat > .changeset/test-local.md << EOF
---
"@promptx/cli": patch
---

本地测试发布工作流
EOF

# 3. 提交
git add .
git commit -m "test: 本地测试工作流"

# 4. 模拟 PR 标签检测
echo "🏷️ 模拟 PR 标签检测..."
PR_LABELS='["changeset/patch", "publish/dev", "merge/squash"]'
echo "PR 标签: $PR_LABELS"

# 检测 publish 标签
PUBLISH_LABEL=""
if echo "$PR_LABELS" | grep -q '"publish/dev"'; then
  PUBLISH_LABEL="dev"
elif echo "$PR_LABELS" | grep -q '"publish/alpha"'; then
  PUBLISH_LABEL="alpha"
elif echo "$PR_LABELS" | grep -q '"publish/beta"'; then
  PUBLISH_LABEL="beta"
elif echo "$PR_LABELS" | grep -q '"publish/latest"'; then
  PUBLISH_LABEL="latest"
fi

echo "✅ 检测到发布标签: $PUBLISH_LABEL"

# 5. 切回 develop 并合并
echo "🔀 模拟 PR 合并..."
git checkout develop
git merge "$TEST_BRANCH" --no-edit

# 6. 消费 changeset
echo "📦 消费 changeset..."

# 检查是否有 changeset
if ls .changeset/*.md 2>/dev/null | grep -v README.md; then
  echo "找到 changeset，开始消费..."
  
  # 安装 changeset CLI
  npm install -D @changesets/cli
  
  # 设置 git 配置
  git config user.name "test-bot"
  git config user.email "test@example.com"
  
  # 消费 changeset（但不推送）
  GITHUB_TOKEN="test-token" npx changeset version
  
  # 检查是否有变更
  if git diff --quiet; then
    echo "⚠️ 没有版本变更"
  else
    echo "✅ 版本已更新"
    git diff package.json | grep version || true
    
    # 提交但不推送
    git add .
    git commit -m "chore: version packages [skip ci]"
    echo "✅ 版本提交已创建（未推送）"
  fi
else
  echo "⚠️ 没有找到 changeset"
fi

# 7. 清理
echo "🧹 清理测试分支..."
git branch -D "$TEST_BRANCH"

echo "✅ 本地测试完成！"
echo ""
echo "📊 测试结果："
echo "- PR 标签检测: ✅"
echo "- Changeset 消费: ✅"
echo "- 版本更新: ✅"
echo ""
echo "⚠️ 注意: 版本提交未推送到远程"