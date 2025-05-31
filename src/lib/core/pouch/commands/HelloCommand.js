const BasePouchCommand = require('../BasePouchCommand');
const fs = require('fs-extra');
const path = require('path');

/**
 * 角色发现锦囊命令
 * 负责展示可用的AI角色和领域专家
 */
class HelloCommand extends BasePouchCommand {
  constructor() {
    super();
    // 角色注册表 - 硬编码版本，未来可扩展为动态发现
    this.ROLES_REGISTRY = [
      {
        id: 'video-copywriter',
        name: '🎬 视频文案专家',
        description: '专业视频内容创作与营销文案，具备创意性、故事性和营销性思维',
        category: '内容创作',
        domain: 'video-copywriting',
        file: '@package://prompt/domain/copywriter/video-copywriter.role.md'
      },
      {
        id: 'product-owner',
        name: '🎯 产品负责人',
        description: '敏捷开发核心决策者，具备全栈产品管理能力和技术理解',
        category: '项目管理',
        domain: 'scrum-product-ownership',
        file: '@package://prompt/domain/scrum/role/product-owner.role.md'
      },
      {
        id: 'prompt-developer',
        name: '🔧 提示词开发者',
        description: '探索性、系统性和批判性思维的提示词设计专家',
        category: '技术开发',
        domain: 'prompt-engineering',
        file: '@package://prompt/domain/prompt/prompt-developer.role.md'
      },
      {
        id: 'test-assistant',
        name: '🧪 测试助手',
        description: '基础测试角色，具备思考和记忆处理能力',
        category: '质量保证',
        domain: 'testing',
        file: '@package://prompt/domain/test/test.role.md'
      },
      {
        id: 'assistant',
        name: '🙋 智能助手',
        description: '通用助理角色，提供基础的助理服务和记忆支持',
        category: '通用服务',
        domain: 'general-assistance',
        file: '@package://prompt/domain/assistant/assistant.role.md'
      }
    ];
  }

  getPurpose() {
    return '发现并展示所有可用的AI角色和领域专家，帮助选择合适的专业身份开始工作';
  }

  async getContent(args) {
    const rolesByCategory = this.groupRolesByCategory();
    const totalRoles = this.ROLES_REGISTRY.length;
    
    let content = `👋 欢迎来到 PromptX 锦囊系统！

🎭 **可用的AI角色与领域专家** (共 ${totalRoles} 个角色)

`;

    // 按分类展示角色
    for (const [category, roles] of Object.entries(rolesByCategory)) {
      content += `## ${this.getCategoryIcon(category)} ${category}\n\n`;
      
      roles.forEach(role => {
        content += `### ${role.name}\n`;
        content += `- **角色ID**: \`${role.id}\`\n`;
        content += `- **专业领域**: ${role.domain}\n`;
        content += `- **能力描述**: ${role.description}\n\n`;
      });
    }

    content += `
🎯 **下一步操作指南**

选择一个角色，使用以下命令激活专业能力：

\`\`\`bash
# 1. 激活角色 (推荐)
promptx action <角色ID>

# 2. 或直接学习角色知识
promptx learn <角色ID>
\`\`\`

💡 **使用示例**
\`\`\`bash
promptx action video-copywriter    # 激活视频文案专家
promptx action product-owner       # 激活产品负责人
promptx action prompt-developer    # 激活提示词开发者
\`\`\`

🔄 **锦囊串联流程**
👋 **hello**(发现角色) → ⚡ **action**(激活角色) → 📚 **learn**(学习知识) → 🔍 **recall**(应用经验)
`;

    return content;
  }

  getPATEOAS(args) {
    const availableRoles = this.ROLES_REGISTRY.map(role => ({
      roleId: role.id,
      name: role.name,
      category: role.category,
      actionCommand: `promptx action ${role.id}`
    }));
    
    return {
      currentState: 'role_discovery',
      availableTransitions: ['action', 'learn', 'init', 'recall'],
      nextActions: [
        {
          name: '激活视频文案专家',
          description: '成为专业的视频内容创作者',
          command: 'promptx action video-copywriter',
          priority: 'high'
        },
        {
          name: '激活产品负责人',
          description: '成为敏捷开发的决策者',
          command: 'promptx action product-owner',
          priority: 'high'
        },
        {
          name: '激活提示词开发者',
          description: '成为提示词设计专家',
          command: 'promptx action prompt-developer',
          priority: 'medium'
        },
        {
          name: '激活智能助手',
          description: '成为通用助理',
          command: 'promptx action assistant',
          priority: 'low'
        },
        {
          name: '学习特定领域',
          description: '深入学习某个专业领域',
          command: 'promptx learn <domain>',
          parameters: {
            domain: '可选值：copywriter, scrum, prompt, test, assistant'
          }
        }
      ],
      metadata: {
        totalRoles: this.ROLES_REGISTRY.length,
        categories: [...new Set(this.ROLES_REGISTRY.map(r => r.category))],
        availableRoles: availableRoles,
        systemVersion: '锦囊串联状态机 v1.0',
        designPhilosophy: 'AI use CLI get prompt for AI'
      }
    };
  }

  /**
   * 按分类分组角色
   */
  groupRolesByCategory() {
    const grouped = {};
    
    this.ROLES_REGISTRY.forEach(role => {
      if (!grouped[role.category]) {
        grouped[role.category] = [];
      }
      grouped[role.category].push(role);
    });
    
    return grouped;
  }

  /**
   * 获取分类图标
   */
  getCategoryIcon(category) {
    const icons = {
      '内容创作': '✍️',
      '项目管理': '📊',
      '技术开发': '💻',
      '质量保证': '🔍',
      '通用服务': '🤖'
    };
    
    return icons[category] || '🎯';
  }

  /**
   * 获取角色信息（提供给其他命令使用）
   */
  getRoleInfo(roleId) {
    return this.ROLES_REGISTRY.find(role => role.id === roleId);
  }

  /**
   * 获取所有角色列表
   */
  getAllRoles() {
    return this.ROLES_REGISTRY;
  }

  /**
   * 未来扩展：动态角色发现
   * TODO: 实现真正的文件扫描和解析
   */
  async discoverAvailableDomains() {
    // 预留接口，未来实现动态角色发现
    // 1. 扫描 prompt/domain/ 目录
    // 2. 解析 .role.md 文件
    // 3. 提取元数据和描述
    // 4. 构建动态注册表
    
    return this.ROLES_REGISTRY.map(role => role.domain);
  }
}

module.exports = HelloCommand; 