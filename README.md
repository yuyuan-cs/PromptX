<div align="center">
  <img src="assets/logo/Creative PromptX Duck Logo 4.svg" alt="PromptX Logo" width="120" height="120"/>
  <p><strong>AI应用原生的专业能力增强系统</strong></p>
  <p>通过MCP协议为Claude Desktop等AI应用提供专业角色、记忆管理和知识体系</p>
  
  <p>
    <strong><a href="README.md">中文</a></strong> | 
    <a href="README_EN.md">English</a> | 
    <a href="https://github.com/Deepractice/PromptX/issues">Issues</a>
  </p>
</div>

<br/>

## 🚀 一键启动 - AI应用直连

### 🔌 **MCP标准化接入**

# 在AI应用中配置MCP连接 (最简配置)


#### **⚡ 零配置接入 (推荐)**
在AI应用的MCP配置文件中添加：

```json
{
  "mcpServers": {
    "promptx": {
      "command": "npx",
      "args": ["-y", "-f", "dpml-prompt@snapshot", "mcp-server"]
    }
  }
}
```

**🎯 就这么简单！** PromptX会自动：
- ✅ **智能识别工作目录** - 自动找到合适的工作空间
- ✅ **自动初始化环境** - 无需手动创建文件夹和配置
- ✅ **动态适应项目** - 在不同项目中都能正常工作

#### **🔧 高级配置 (可选)**
如需自定义配置，可添加以下选项：

```json
{
  "mcpServers": {
    "promptx": {
      "command": "npx",
      "args": ["-y", "-f", "dpml-prompt@snapshot", "mcp-server"],
      "env": {
        "PROMPTX_WORKSPACE": "/your/custom/workspace/path"
      }
    }
  }
}
```

### 不知道MCP怎么使用？  [点击查看 MCP幼儿园教程 BiliBili](https://www.bilibili.com/video/BV1HFd6YhErb)


##### 🔧 高级选项说明：
- `PROMPTX_WORKSPACE`: 自定义工作空间路径 (可选，系统会自动识别)

##### 📂 自定义工作空间路径格式 

- **Windows**: `"D:\\username\\path\\your\\project"` (使用双反斜杠)
- **macOS/Linux**: `"/Users/username/path/your/project"`




#### **支持MCP的AI应用**

| AI应用 | 状态 | 配置文件位置 | 特性 |
|--------|------|-------------|------|
| **Claude Desktop** | ✅ 官方支持 | Windows: `%APPDATA%\Claude\claude_desktop_config.json`<br/>macOS: `~/Library/Application Support/Claude/claude_desktop_config.json` | Anthropic官方客户端，MCP原生支持 |
| **Cursor** | ✅ 支持 | 通过MCP设置面板配置 | 智能代码编辑器，开发者友好 |
| **Claude Code** | ✅ 支持 | `/home/user/.claude.json` 或者 `~/.claude.json` | Anthropic官方CLI工具，MCP原生支持，命令行AI编程助手 |
| **Windsurf** | ✅ 支持 | IDE内MCP配置面板 | Codeium推出的AI原生IDE |
| **Cline** | ✅ 支持 | VS Code插件配置 | 强大的AI编程助手 |
| **Augment** | ✅ 支持 | 桌面应用配置 | AI原生代码编辑器 |
| **Trae** | ✅ 支持 | IDE插件配置 | AI驱动的代码生成和重构工具 |
| **通义灵码** | 🟡 计划支持 | 阿里云IDE插件 | 阿里云推出的AI编程助手 |
| **Zed** | ✅ 支持 | 配置文件：`~/.config/zed/settings.json` | 高性能代码编辑器 |
| **Continue** | ✅ 支持 | VS Code插件配置 | VS Code AI助手插件 |
| **Replit Agent** | 🟡 实验支持 | Replit平台内置 | 在线编程环境 |
| **Jan** | 🟡 开发中 | 本地AI客户端 | 隐私优先的本地AI助手 |
| **Ollama WebUI** | 🟡 社区支持 | 第三方MCP适配器 | 本地大模型界面 |
| **Open WebUI** | 🟡 社区支持 | 插件系统 | 开源AI界面 |
| **百度 Comate** | 🟡 计划支持 | 百度IDE插件 | 百度推出的AI编程助手 |
| **腾讯 CodeWhisperer** | 🟡 计划支持 | 腾讯云IDE | 腾讯云AI编程工具 |

> **说明**：
> - ✅ **官方支持**：原生支持MCP协议
> - 🟡 **实验/社区支持**：通过插件或实验性功能支持
> - 更多AI应用正在接入MCP协议...

**🎯 配置完成后，AI应用将获得6个专业工具：**
- `promptx_init` - 🏗️ 系统初始化
- `promptx_hello` - 👋 角色发现  
- `promptx_action` - ⚡ 角色激活
- `promptx_learn` - 📚 知识学习
- `promptx_recall` - 🔍 记忆检索
- `promptx_remember` - 💾 经验保存

📖 **[完整MCP集成指南](docs/mcp-integration-guide.md)**

### **📸 配置成功后的使用效果**

#### **🎭 角色发现和激活**
![角色发现](assets/role-discovery.png)
*步骤1：使用 `promptx_hello` 发现所有可用的专业角色*

![角色选择](assets/role-select.png)
*步骤2：使用 `promptx_action` 一键激活专业角色，获得完整专业能力*

#### **💭 智能记忆管理**
![记忆功能](assets/remember.png)
*步骤3：使用 `promptx_remember` 保存重要信息，AI将主动记忆并在合适时机调用*

> **✨ 配置提示**：完成MCP配置后，您的AI应用将获得上述所有专业功能。无需额外学习，按照界面提示即可享受专业化AI服务。

## ⭐ Star增长趋势

[![Star History Chart](https://api.star-history.com/svg?repos=Deepractice/PromptX&type=Date)](https://star-history.com/#Deepractice/PromptX&Date)

### **贡献指南**
- 📋 **[贡献流程](CONTRIBUTING.md)** - 详细的贡献指南和代码规范
- 🌿 **[分支策略](docs/BRANCHING.md)** - 分支管理和发布流程  
- 🚀 **[发布流程](docs/RELEASE.md)** - 版本管理和发布文档

扫码加入技术交流群：

<img src="assets/qrcode.jpg" alt="技术交流群" width="200">


## 📄 许可证

MIT License - 让AI专业能力触手可及

---

**🚀 立即体验：启动PromptX MCP Server，让您的AI应用获得专业能力增强！**


