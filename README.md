<div align="center">
  <img src="assets/logo/Creative PromptX Duck Logo 4.svg" alt="PromptX Logo" width="120" height="120"/>
  <h1>PromptX · AI应用原生专业能力增强系统</h1>
  <p>通过MCP协议为Claude Desktop等AI应用提供专业角色、记忆管理和知识体系</p>
  <p>一行命令，让任何 AI 客户端秒变专业选手</p>

  <!-- Badges -->
  <p>
    <a href="https://github.com/Deepractice/PromptX/stargazers"><img src="https://img.shields.io/github/stars/Deepractice/PromptX?style=social" alt="Stars"/></a>
    <a href="https://www.npmjs.com/package/dpml-prompt"><img src="https://img.shields.io/npm/v/dpml-prompt?color=orange&logo=npm" alt="npm version"/></a>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/Deepractice/PromptX?color=blue" alt="License"/></a>
    <a href="https://github.com/Deepractice/PromptX/actions"><img src="https://img.shields.io/github/actions/workflow/status/Deepractice/PromptX/ci.yml?label=CI&logo=github" alt="CI Status"/></a>
  </p>

  <p>
    <strong><a href="README.md">中文</a></strong> | 
    <a href="README_EN.md">English</a> | 
    <a href="https://github.com/Deepractice/PromptX/issues">Issues</a>
  </p>
</div>

<details>
<summary>📖 快速导航</summary>

- [🚀 一键启动](#-一键启动---ai应用直连)
- [🔌 MCP 标准化接入](#-mcp标准化接入)
- [💡 支持的 AI 应用](#支持mcp的ai应用)
- [📋 实践案例](#-实践案例)
- [⭐ Star 趋势](#-star增长趋势)
- [🤝 贡献指南](#贡献指南)
- [📄 License](#-许可证)

</details>

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
|--------|--------|-----------|------|
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

## 📋 实践案例

### 🎮 Legacy Lands Library

<div align="center">
  <img src="https://raw.githubusercontent.com/LegacyLands/legacy-lands-library/main/logo.png" alt="Legacy Lands Library Logo" width="120" style="border-radius: 10px; margin: 15px 0 25px 0;">
</div>

#### 📖 项目概述

**项目名称：** Legacy Lands Library  
**项目地址：** https://github.com/LegacyLands/legacy-lands-library  
**项目简介：** legacy-lands-library 是一个面向现代 Minecraft 服务端插件开发的开发工具库。它旨在为开发者提供一个跨平台、生产就绪的基础设施。

#### 🏢 组织信息

**组织名称：** 遗迹之地制作组 (Legacy Lands)  
**官方网站：** https://www.legacylands.cn/  
**组织简介：** 遗迹之地 (Legacy Lands) 是一个专注于构建大型 Minecraft 文明模拟体验的创新团队。参与开源社区，为 Minecraft 服务端插件等领域开发提供优雅、高效且可靠的解决方案。

#### 💡 使用心得

使用 PromptX 的开发体验真的非常不一样。我们团队基于 Claude Code，并结合 PromptX，一位开发者仅三天内就完成了超过一万一千行的高质量 Java 代码。

这套工作流的价值在实际开发中体现得淋漓尽致。PromptX 解决了 AI 使用时的许多痛点，时刻确保代码风格的统一和质量的达标，大大降低了新成员的学习成本。过去那些需要反复沟通、依靠文档传承的最佳实践，现在能够自然而然地融入到每一次代码生成中。

#### 📚 相关资源

**AI集成标准与实践指南：** https://github.com/LegacyLands/legacy-lands-library/blob/main/AI_CODE_STANDARDS_ZHCN.md

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


