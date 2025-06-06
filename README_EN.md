# PromptX

> **AI-native professional capability enhancement system** - Provides specialized roles, memory management, and knowledge systems for AI applications through MCP protocol

[中文](README.md) | **English** | [Issues](https://github.com/Deepractice/PromptX/issues)

## 🚀 Quick Start - Direct AI Application Integration

### 🔌 **MCP Standardized Integration**

# Configure MCP connection in AI applications (minimal setup)

#### **⚡ Zero-Configuration Integration (Recommended)**
Add to your AI application's MCP configuration file:

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

**🎯 That's it!** PromptX automatically:
- ✅ **Intelligent workspace detection** - Automatically finds suitable workspace
- ✅ **Auto environment initialization** - No manual folder/config creation needed
- ✅ **Dynamic project adaptation** - Works seamlessly across different projects

#### **🔧 Advanced Configuration (Optional)**
For custom configurations:

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

### New to MCP? [Watch MCP Tutorial on BiliBili](https://www.bilibili.com/video/BV1HFd6YhErb)

##### 🔧 Advanced Options:
- `PROMPTX_WORKSPACE`: Custom workspace path (optional, auto-detected by default)

##### 📂 Custom Workspace Path Formats

- **Windows**: `"D:\\username\\path\\your\\project"` (use double backslashes)
- **macOS/Linux**: `"/Users/username/path/your/project"`

#### **Supported AI Applications**

| Application | Status | Configuration | Notes |
|-------------|--------|---------------|-------|
| **Claude Desktop** | ✅ Official | Windows: `%APPDATA%\Claude\claude_desktop_config.json`<br/>macOS: `~/Library/Application Support/Claude/claude_desktop_config.json` | Anthropic's official client with native MCP support |
| **Cursor** | ✅ Supported | MCP settings panel | Developer-friendly code editor |
| **Windsurf** | ✅ Supported | IDE MCP panel | Codeium's AI-native IDE |
| **Cline** | ✅ Supported | VS Code plugin config | Powerful AI programming assistant |
| **Augment** | ✅ Supported | Desktop app config | AI-native code editor |
| **Trae** | ✅ Supported | IDE plugin config | AI-driven code generation tool |
| **通义灵码** | 🟡 Planned | Alibaba Cloud IDE plugin | Alibaba's AI programming assistant |
| **Zed** | ✅ Supported | Config: `~/.config/zed/settings.json` | High-performance code editor |
| **Continue** | ✅ Supported | VS Code plugin config | VS Code AI assistant plugin |
| **Replit Agent** | 🟡 Experimental | Built into Replit platform | Online programming environment |
| **Jan** | 🟡 In Development | Local AI client | Privacy-first local AI assistant |
| **Ollama WebUI** | 🟡 Community | Third-party MCP adapter | Local model interface |
| **Open WebUI** | 🟡 Community | Plugin system | Open source AI interface |
| **百度 Comate** | 🟡 Planned | Baidu IDE plugin | Baidu's AI programming assistant |
| **腾讯 CodeWhisperer** | 🟡 Planned | Tencent Cloud IDE | Tencent's AI programming tool |

> **Legend**:
> - ✅ **Official Support**: Native MCP protocol support
> - 🟡 **Experimental/Community Support**: Support through plugins or experimental features
> - More AI applications are integrating MCP protocol...

**🎯 After configuration, your AI application gains 6 professional tools:**
- `promptx_init` - 🏗️ System initialization
- `promptx_hello` - 👋 Role discovery  
- `promptx_action` - ⚡ Role activation
- `promptx_learn` - 📚 Knowledge learning
- `promptx_recall` - 🔍 Memory retrieval
- `promptx_remember` - 💾 Experience saving

📖 **[Complete MCP Integration Guide](docs/mcp-integration-guide.md)**

### **📸 Usage Effects After Configuration**

#### **🎭 Role Discovery and Activation**
![Role Discovery](assets/role-discovery.png)
*Step 1: Use `promptx_hello` to discover all available professional roles*

![Role Selection](assets/role-select.png)
*Step 2: Use `promptx_action` to activate professional roles with complete capabilities*

#### **💭 Intelligent Memory Management**
![Memory Feature](assets/remember.png)
*Step 3: Use `promptx_remember` to save important information for intelligent recall*

> **✨ Configuration Note**: After completing MCP configuration, your AI application will have all the above professional features. No additional learning required - just follow the interface prompts to enjoy professional AI services.

### **Contributing Guidelines**
- 📋 **[Contributing Process](CONTRIBUTING.md)** - Detailed contribution guide and code standards
- 🌿 **[Branching Strategy](docs/BRANCHING.md)** - Branch management and release process  
- 🚀 **[Release Process](docs/RELEASE.md)** - Version management and release documentation

Join our technical community:

<img src="assets/qrcode.jpg" alt="Technical Community" width="200">

## 📄 License

MIT License - Making AI professional capabilities accessible

---

**🚀 Get Started Now: Launch PromptX MCP Server and enhance your AI application with professional capabilities!**

```