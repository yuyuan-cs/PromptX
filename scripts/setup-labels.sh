#!/bin/bash

# Label Management Script for PromptX
# This script creates a complete label system for PR-driven workflow

echo "🏷️ Setting up PromptX label system..."
echo ""

# Color definitions
COLOR_ACTION="FBCA04"      # Yellow - Action labels
COLOR_TYPE="0052CC"         # Blue - Type labels
COLOR_STATUS="6B46C1"       # Purple - Status labels
COLOR_PRIORITY="DC2626"     # Red - Priority labels
COLOR_TEST="10B981"         # Green - Test labels
COLOR_RELEASE="EC4899"      # Pink - Release labels
COLOR_MERGE="8B5CF6"        # Violet - Merge labels
COLOR_INFO="D4C5F9"         # Light purple - Info labels
COLOR_ERROR="E99695"        # Light red - Error/bug labels

# Function to create or update label
create_label() {
    local name=$1
    local description=$2
    local color=$3
    
    # Check if label exists
    if gh label list --limit 200 | grep -q "^$name"; then
        echo "  ↻ Updating: $name"
        gh label edit "$name" --description "$description" --color "$color" 2>/dev/null || true
    else
        echo "  + Creating: $name"
        gh label create "$name" --description "$description" --color "$color" 2>/dev/null || true
    fi
}

# Function to delete label
delete_label() {
    local name=$1
    echo "  - Deleting: $name"
    gh label delete "$name" --yes 2>/dev/null || true
}

echo "📂 1. Creating Action Labels (changeset/*, publish/*, test/*, merge/*)"
echo "----------------------------------------"

# Changeset labels
create_label "changeset/patch" "Create patch version changeset" "$COLOR_ACTION"
create_label "changeset/minor" "Create minor version changeset" "$COLOR_ACTION"
create_label "changeset/major" "Create major version changeset" "$COLOR_ACTION"
create_label "changeset/none" "No changeset needed" "$COLOR_INFO"

# Publish labels
create_label "publish/dev" "Auto-publish to dev tag after merge" "$COLOR_RELEASE"
create_label "publish/alpha" "Auto-publish to alpha tag after merge" "$COLOR_RELEASE"
create_label "publish/beta" "Auto-publish to beta tag after merge" "$COLOR_RELEASE"
create_label "publish/latest" "Auto-publish to latest tag after merge" "$COLOR_RELEASE"
create_label "publish/hold" "Do not auto-publish after merge" "$COLOR_INFO"

# Test labels
create_label "test/skip-unit" "Skip unit tests" "$COLOR_TEST"
create_label "test/skip-integration" "Skip integration tests" "$COLOR_TEST"
create_label "test/skip-e2e" "Skip E2E tests" "$COLOR_TEST"
create_label "test/extended" "Run extended test suite" "$COLOR_TEST"
create_label "test/performance" "Run performance tests" "$COLOR_TEST"

# Merge labels
create_label "merge/squash" "Use squash merge" "$COLOR_MERGE"
create_label "merge/rebase" "Use rebase merge" "$COLOR_MERGE"
create_label "merge/auto" "Auto-merge when ready" "$COLOR_MERGE"

echo ""
echo "📂 2. Creating Type Labels (type:*)"
echo "----------------------------------------"

create_label "type: feature" "New feature" "$COLOR_TYPE"
create_label "type: fix" "Bug fix" "$COLOR_ERROR"
create_label "type: docs" "Documentation only" "$COLOR_TYPE"
create_label "type: refactor" "Code refactoring" "$COLOR_TYPE"
create_label "type: test" "Test improvements" "$COLOR_TYPE"
create_label "type: chore" "Build/tool changes" "$COLOR_TYPE"
create_label "type: style" "Code style changes" "$COLOR_TYPE"
create_label "type: perf" "Performance improvements" "$COLOR_TYPE"

echo ""
echo "📂 3. Creating Status Labels"
echo "----------------------------------------"

create_label "status: blocked" "Blocked by dependency" "$COLOR_STATUS"
create_label "status: ready" "Ready for review" "$COLOR_STATUS"
create_label "status: in-review" "Currently being reviewed" "$COLOR_STATUS"
create_label "status: approved" "Approved and ready to merge" "$COLOR_STATUS"
create_label "status: wip" "Work in progress" "$COLOR_STATUS"

echo ""
echo "📂 4. Creating Priority Labels"
echo "----------------------------------------"

create_label "priority: critical" "Critical priority - immediate attention" "$COLOR_PRIORITY"
create_label "priority: high" "High priority" "$COLOR_PRIORITY"
create_label "priority: medium" "Medium priority" "$COLOR_ACTION"
create_label "priority: low" "Low priority" "$COLOR_INFO"

echo ""
echo "📂 5. Creating Additional Useful Labels"
echo "----------------------------------------"

create_label "breaking" "Breaking changes" "$COLOR_PRIORITY"
create_label "bug" "Something isn't working" "$COLOR_ERROR"
create_label "enhancement" "New feature or improvement" "$COLOR_TYPE"
create_label "good first issue" "Good for newcomers" "$COLOR_TEST"
create_label "help wanted" "Extra attention needed" "$COLOR_ACTION"
create_label "invalid" "This doesn't seem right" "$COLOR_INFO"
create_label "duplicate" "This issue or PR already exists" "$COLOR_INFO"
create_label "wontfix" "This will not be worked on" "$COLOR_INFO"

echo ""
echo "📂 6. Creating Release & Version Labels"
echo "----------------------------------------"

create_label "release" "Release related" "$COLOR_RELEASE"
create_label "release: alpha" "Alpha release" "$COLOR_RELEASE"
create_label "release: beta" "Beta release" "$COLOR_RELEASE"
create_label "release: stable" "Stable release" "$COLOR_RELEASE"

echo ""
echo "🗑️ 7. Cleaning Up Old/Deprecated Labels"
echo "----------------------------------------"

# List of labels to remove (old or inconsistent labels)
OLD_LABELS=(
    "documentation"
    "idea"
    "implemented"
    "p1-high"
    "p2-medium"
    "skip-release"
    "story"
    "epic"
    "feature"
    "thought"
    "architecture"
    "role-management"
    "mcp-integration"
    "ai-capability"
    "source/🔍-实践"
    "status/🔄-已转化"
    "strength/🔥-激烈"
    "track/🎯-contradiction"
)

for label in "${OLD_LABELS[@]}"; do
    delete_label "$label"
done

echo ""
echo "✅ Label system setup complete!"
echo ""
echo "📊 Summary:"
echo "  • Action labels: changeset/*, publish/*, test/*, merge/*"
echo "  • Type labels: type: feature, fix, docs, refactor, etc."
echo "  • Status labels: status: blocked, ready, in-review, etc."
echo "  • Priority labels: priority: critical, high, medium, low"
echo "  • Other utility labels for issues and PRs"
echo ""
echo "💡 Usage:"
echo "  • Developers: Add type: labels when creating PRs"
echo "  • Reviewers: Add action labels to trigger workflows"
echo "  • Auto: Branch validator adds labels based on branch names"