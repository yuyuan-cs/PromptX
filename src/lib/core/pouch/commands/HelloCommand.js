const BasePouchCommand = require('../BasePouchCommand');
const fs = require('fs-extra');
const path = require('path');
const { buildCommand } = require('../../../../constants');

/**
 * 角色发现锦囊命令
 * 负责展示可用的AI角色和领域专家
 */
class HelloCommand extends BasePouchCommand {
  constructor() {
    super();
    this.roleRegistry = null; // 角色注册表将从资源系统动态加载
  }

  getPurpose() {
    return '为AI提供可用角色信息，以便AI向主人汇报专业服务选项';
  }

  /**
   * 动态加载角色注册表
   */
  async loadRoleRegistry() {
    if (this.roleRegistry) {
      return this.roleRegistry;
    }

    try {
      // 从ResourceManager获取统一注册表
      const ResourceManager = require('../../resource/resourceManager');
      const resourceManager = new ResourceManager();
      await resourceManager.initialize(); // 确保初始化完成
      
      if (resourceManager.registry && resourceManager.registry.protocols && resourceManager.registry.protocols.role && resourceManager.registry.protocols.role.registry) {
        this.roleRegistry = resourceManager.registry.protocols.role.registry;
      } else {
        // 备用：如果资源系统不可用，使用基础角色
        this.roleRegistry = {
          'assistant': {
            "file": "@package://prompt/domain/assistant/assistant.role.md",
            "name": "🙋 智能助手", 
            "description": "通用助理角色，提供基础的助理服务和记忆支持"
          }
        };
      }
    } catch (error) {
      console.warn('角色注册表加载失败，使用基础角色:', error.message);
      this.roleRegistry = {
        'assistant': {
          "file": "@package://prompt/domain/assistant/assistant.role.md",
          "name": "🙋 智能助手", 
          "description": "通用助理角色，提供基础的助理服务和记忆支持"
        }
      };
    }

    return this.roleRegistry;
  }

  /**
   * 获取所有角色列表（转换为数组格式）
   */
  async getAllRoles() {
    const registry = await this.loadRoleRegistry();
    return Object.entries(registry).map(([id, roleInfo]) => ({
      id: id,
      name: roleInfo.name,
      description: roleInfo.description,
      file: roleInfo.file
    }));
  }

  async getContent(args) {
    await this.loadRoleRegistry();
    const allRoles = await this.getAllRoles();
    const totalRoles = allRoles.length;
    
    let content = `🤖 **AI专业角色服务清单** (共 ${totalRoles} 个专业角色可供选择)

> 💡 **重要说明**：以下是可激活的AI专业角色。每个角色都有唯一的ID，使用action命令激活。

## 📋 可用角色列表

`;

    // 清楚显示角色ID和激活命令
    allRoles.forEach((role, index) => {
      content += `### ${index + 1}. ${role.name} 
**角色ID**: \`${role.id}\`  
**专业能力**: ${role.description}  
**激活命令**: \`npx promptx action ${role.id}\`

---

`;
    });

    content += `
## 🎯 **角色激活指南**

### 🔧 激活步骤
1. **选择角色**: 从上述列表中选择需要的专业角色
2. **使用角色ID**: 复制对应的角色ID（如：\`${allRoles[0]?.id || 'assistant'}\`）
3. **执行命令**: 运行 \`npx promptx action <角色ID>\`

### 📝 激活示例
\`\`\`bash
# 激活智能助手角色
npx promptx action ${allRoles[0]?.id || 'assistant'}
\`\`\`

### ⚡ 激活后效果
- ✅ **获得专业能力** - AI将具备该角色的专业技能
- ✅ **学习技能组合** - 自动学习角色需要的思维和行为模式
- ✅ **即时专业化** - 立即可以提供该领域的专业服务

---

⚠️ **AI执行指令**：
📢 **向主人汇报角色选项，明确说明使用方法："请选择角色ID，然后我将执行对应的action命令"**
🎯 **等待主人指定具体的角色ID后，立即执行 \`npx promptx action <角色ID>\`**
💡 **强调：action命令需要具体的角色ID，不是角色名称**
`;

    return content;
  }

  async getPATEOAS(args) {
    const allRoles = await this.getAllRoles();
    const availableRoles = allRoles.map(role => ({
      roleId: role.id,
      name: role.name,
      actionCommand: buildCommand.action(role.id)
    }));
    
    return {
      currentState: 'role_discovery',
      availableTransitions: ['action', 'learn', 'init', 'recall'],
      nextActions: [
        {
          name: '向主人汇报服务选项',
          description: '将上述专业服务清单告知主人，并询问需求',
          command: '等待主人选择后使用: ' + buildCommand.action('<选择的角色ID>'),
          priority: 'critical',
          instruction: '必须先询问主人需求，不要自主选择角色'
        }
      ],
      metadata: {
        totalRoles: allRoles.length,
        availableRoles: availableRoles,
        dataSource: 'resource.registry.json',
        systemVersion: '锦囊串联状态机 v1.0',
        designPhilosophy: 'AI use CLI get prompt for AI'
      }
    };
  }



  /**
   * 获取角色信息（提供给其他命令使用）
   */
  async getRoleInfo(roleId) {
    const registry = await this.loadRoleRegistry();
    const roleData = registry[roleId];
    
    if (!roleData) {
      return null;
    }
    
    return {
      id: roleId,
      name: roleData.name,
      description: roleData.description,
      file: roleData.file
    };
  }

  /**
   * 未来扩展：动态角色发现
   * TODO: 实现真正的文件扫描和解析
   */
  async discoverAvailableDomains() {
    // 现在基于注册表返回角色ID列表
    const allRoles = await this.getAllRoles();
    return allRoles.map(role => role.id);
  }
}

module.exports = HelloCommand; 