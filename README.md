<div align="center">
  <img src="assets/logo/Creative PromptX Duck Logo 4.svg" alt="PromptX Logo" width="120" height="120"/>
  <h1>PromptX · AI应用原生专业能力增强系统</h1>
  <p>通过MCP协议为AI应用提供专业角色、记忆管理和知识体系，一行命令，让任何 AI 客户端秒变专业选手。</p>

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

---

### ✨ **一眼看懂 PromptX**

PromptX 能做什么？简单来说，它让你的 AI 助手拥有了"大脑"和"记忆"。

- **🎭 专业角色扮演**: 提供覆盖不同领域的专家角色，让 AI 的回答更专业、更深入。
- **🧠 长期记忆与知识库**: AI能够记住关键信息和你的偏好，在持续的对话和工作中提供连贯、个性化的支持。
- **🔌 轻松集成**: 只需一行命令，即可为数十种主流 AI 应用（如 Claude、Cursor）无缝启用这些强大功能。

<br/>

### 📸 **配置成功后的使用效果**

#### **1. 发现并激活专业角色**
*使用 `promptx_hello` 发现可用角色，再用 `promptx_action` 激活，AI即刻变身领域专家。*
<img src="assets/role-discovery.png" alt="角色发现与激活" width="80%">

#### **2. 拥有智能记忆**
*使用 `promptx_remember` 保存关键信息，AI将在后续的交流中主动运用这些知识。*
<img src="assets/remember.png" alt="记忆功能" width="80%">

---

## 🚀 **一键启动，30秒完成配置**

### **第 1 步：找到AI应用的MCP配置文件**

首先，找到您AI应用的配置文件。不知道在哪？没关系，我们为您准备了速查表：

<details>
<summary>👉 **点击这里，查看主流AI应用的配置文件位置**</summary>

| AI应用 | 状态 | 配置文件位置 |
|---|---|---|
| **Claude Desktop** | ✅ 官方支持 | Windows: `%APPDATA%\Claude\claude_desktop_config.json`<br/>macOS: `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Cursor** | ✅ 支持 | 通过MCP设置面板配置 |
| **Zed** | ✅ 支持 | 配置文件：`~/.config/zed/settings.json` |
| **Continue** | ✅ 支持 | VS Code插件配置 |
| *...以及更多应用* | | *请参考下方的完整列表* |

</details>

<br/>

### **第 2 步：添加 PromptX 配置**

打开配置文件，将下面的 `promptx` 配置代码复制进去。这是最简单的 **零配置模式**，PromptX 会自动为您处理一切。

```json
{
  "mcpServers": {
    "promptx": {
      // 指定使用 npx 运行 promptx 服务
      "command": "npx",
      // '-y' 自动确认, '-f' 强制刷新缓存, 'dpml-prompt@snapshot' 使用最新版, 'mcp-server' 启动服务
      "args": ["-y", "-f", "dpml-prompt@snapshot", "mcp-server"]
    }
  }
}
```

**🎯 就这么简单！** 保存文件并重启您的AI应用，PromptX 就已成功激活。

<details>
<summary>🔧 需要自定义工作目录？点击查看高级配置</summary>

如果您想指定一个特定的文件夹作为 PromptX 的工作区，可以添加 `env` 环境变量。

```json
{
  "mcpServers": {
    "promptx": {
      "command": "npx",
      "args": ["-y", "-f", "dpml-prompt@snapshot", "mcp-server"],
      "env": {
        // PROMPTX_WORKSPACE: 自定义工作空间路径 (可选，系统会自动识别)
        // Windows: "D:\\path\\to\\your\\project" (注意使用双反斜杠)
        // macOS/Linux: "/Users/username/path/your/project"
        "PROMPTX_WORKSPACE": "/your/custom/workspace/path"
      }
    }
  }
}
```

</details>

<br/>

---

### ⚙️ **工作原理**

PromptX 作为您和AI应用之间的"专业能力中间件"，通过标准的 [MCP协议](https://github.com/metacontroller/mcp) 进行通信。

```mermaid
graph TD
    subgraph Your AI App (Claude, Cursor, etc.)
        A[👨‍💻 User Interaction]
    end

    subgraph PromptX MCP Server
        C{PromptX Engine}
        D[🎭 Role Library]
        E[🧠 Memory & Knowledge]
    end

    A -- "Calls 'promptx_...' tools" --> B(MCP Protocol)
    B --> C
    C -- "Accesses" --> D
    C -- "Accesses" --> E

    subgraph Enhanced Response
        F[✨ Professional Output]
    end
    C --> F
```

当您调用 `promptx_...` 系列工具时，AI应用会将请求通过MCP协议发送给 PromptX。PromptX 引擎会加载相应的专业角色、检索相关记忆，然后返回一个经过专业能力增强的结果给AI应用，最终呈现给您。

---

### 💡 **支持的 AI 应用**

PromptX 兼容所有支持MCP协议的AI应用。

| AI应用 | 状态 | 特性 |
|---|---|---|
| **Claude Desktop** | ✅ 官方支持 | Anthropic官方客户端，MCP原生支持 |
| **Cursor** | ✅ 支持 | 智能代码编辑器，开发者友好 |
| **Claude Code** | ✅ 支持 | Anthropic官方CLI工具，命令行AI编程助手 |
| **Windsurf** | ✅ 支持 | Codeium推出的AI原生IDE |
| **Cline** | ✅ 支持 | 强大的AI编程助手 |
| **Augment** | ✅ 支持 | AI原生代码编辑器 |
| **Trae** | ✅ 支持 | AI驱动的代码生成和重构工具 |
| **通义灵码** | 🟡 计划支持 | 阿里云推出的AI编程助手 |
| **Zed** | ✅ 支持 | 高性能代码编辑器 |
| **Continue** | ✅ 支持 | VS Code AI助手插件 |
| **Replit Agent** | 🟡 实验支持 | 在线编程环境 |
| **Jan** | 🟡 开发中 | 隐私优先的本地AI助手 |
| **Ollama WebUI** | 🟡 社区支持 | 本地大模型界面 |
| **Open WebUI** | 🟡 社区支持 | 开源AI界面 |
| **百度 Comate** | 🟡 计划支持 | 百度推出的AI编程助手 |
| **腾讯 CodeWhisperer** | 🟡 计划支持 | 腾讯云AI编程工具 |

> **图例说明**：
> - ✅ **官方支持**：原生或通过官方插件支持MCP协议。
> - 🟡 **实验/社区/计划支持**：通过社区插件、实验性功能或已列入开发计划。
> - 更多AI应用正在接入...

**🎯 配置完成后，您的AI应用将自动获得6个专业工具：**
- `promptx_init`: 🏗️ **系统初始化** - 自动准备工作环境。
- `promptx_hello`: 👋 **角色发现** - 浏览所有可用的专家角色。
- `promptx_action`: ⚡ **角色激活** - 一键变身指定领域的专家。
- `promptx_learn`: 📚 **知识学习** - 让AI学习特定的知识或技能。
- `promptx_recall`: 🔍 **记忆检索** - 从记忆库中查找历史信息。
- `promptx_remember`: 💾 **经验保存** - 将重要信息存入长期记忆。

📖 **[查看完整MCP集成指南](docs/mcp-integration-guide.md)**

---

## 📋 **实践案例: Legacy Lands Library**

<div align="center">
  <img src="https://raw.githubusercontent.com/LegacyLands/legacy-lands-library/main/logo.png" alt="Legacy Lands Library Logo" width="120" style="border-radius: 10px; margin: 15px 0 25px 0;">
</div>

**项目简介：** [legacy-lands-library](https://github.com/LegacyLands/legacy-lands-library) 是一个面向现代 Minecraft 服务端插件开发的工具库，由"遗迹之地制作组"开发并应用于实际生产。

> #### **💡 核心开发者使用心得**
> "使用 PromptX 的开发体验真的非常不一样。我们团队基于 Claude Code 并结合 PromptX，**一位开发者仅三天内就完成了超过一万一千行的高质量 Java 代码。**
>
> 这套工作流的价值在实际开发中体现得淋漓尽致。PromptX 解决了 AI 使用时的许多痛点，时刻确保代码风格的统一和质量的达标，大大降低了新成员的学习成本。过去那些需要反复沟通、依靠文档传承的最佳实践，现在能够自然而然地融入到每一次代码生成中。"

#### **📚 相关资源**

- **项目地址：** https://github.com/LegacyLands/legacy-lands-library
- **AI集成标准与实践指南：** https://github.com/LegacyLands/legacy-lands-library/blob/main/AI_CODE_STANDARDS_ZHCN.md

---

## ⭐ **Star增长趋势**

[![Star History Chart](https://api.star-history.com/svg?repos=Deepractice/PromptX&type=Date)](https://star-history.com/#Deepractice/PromptX&Date)

---

### **🤝 贡献与交流**

我们欢迎任何形式的贡献和反馈！

- 📋 **[贡献流程](CONTRIBUTING.md)** - 详细的贡献指南和代码规范
- 🌿 **[分支策略](docs/BRANCHING.md)** - 分支管理和发布流程  
- 🚀 **[发布流程](docs/RELEASE.md)** - 版本管理和发布文档

扫码加入技术交流群：

<img src="assets/qrcode.jpg" alt="技术交流群" width="200">

---

## 📄 **许可证**

[MIT License](LICENSE) - 让AI专业能力触手可及


