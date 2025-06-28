<div align="center">
  <img src="assets/logo/Creative PromptX Duck Logo 4.svg" alt="PromptX Logo" width="120" height="120"/>
  <h1>PromptX · 领先的AI上下文工程平台</h1>
  <h2>✨ Chat is all you need - 革命性交互设计，让AI Agent秒变行业专家</h2>
  <p><strong>核心功能模块：</strong><a href="https://github.com/Deepractice/dpml">提示词结构化协议</a> | <a href="https://github.com/Deepractice/PATEOAS">AI状态化协议</a> | 记忆系统 | 女娲角色工坊 | 鲁班工具工坊</p>
  <p>基于MCP协议，一行命令为Claude、Cursor等AI应用注入专业能力</p>

  <!-- Badges -->
  <p>
    <a href=" "><img src="https://img.shields.io/github/stars/Deepractice/PromptX?style=social" alt="Stars"/></a>
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

### 🚀 **实力证明 - 真实案例数据**

> **"使用 PromptX，一位开发者仅三天内完成了超过一万一千行的高质量 Java 代码"**  
> —— Legacy Lands 制作组核心开发者

> **"MCP开发时间从40小时缩短到30分钟"**  
> —— 社区开发者 coso


### 💬 **Chat is All you Need - 看看对话如何改变一切**

#### **1. 对话发现专业角色**
*只需一句话"我要发现可用的角色"，AI就会展示所有可用的专业领域*
<img src="assets/role-discovery.png" alt="Chat方式发现角色" width="80%">

#### **2. 对话选择专业角色**
*看到感兴趣的专家后，直接说"激活XX专家"即可瞬间转换AI身份*
<img src="assets/role-select.png" alt="Chat方式选择激活角色" width="80%">

#### **3. 对话管理智能记忆** 
*说一句"记住这个重要信息"，AI就会自动保存，下次对话时主动运用这些知识*
<img src="assets/remember.png" alt="Chat方式管理记忆" width="80%">

#### **💡 重要：把AI当人，不是软件**

看完上面的演示，你可能还在想："具体应该说什么指令？"

**❌ 请停止这样想：**
> "什么指令能激活角色？" | "正确的命令是什么？" | "我说错了会不会失效？"

**✅ 正确的使用心态：**
> "就像和真人专家聊天一样自然" | "想到什么就说什么，AI会理解你的意图" | "听不懂？换个说法再说一遍就行"

**🎯 实际例子对比：**
```
❌ 软件思维：请执行 promptx_action java-developer
✅ 人际思维：我需要一个Java开发专家
✅ 人际思维：帮我找个懂Java的专家  
✅ 人际思维：我要和Java大牛聊聊
✅ 人际思维：切换到Java开发模式
```

**💬 Chat is All you Need 的真正含义：**
- 🗣️ **自然表达** - 想怎么说就怎么说，就像和朋友聊天
- 🔄 **灵活调整** - AI没听懂？换个说法继续说  
- 🤖 **信任AI** - 相信AI能理解你的真实意图，不必拘泥于"标准用法"
- 💬 **持续对话** - 把每次交互当成和专家的连续对话，而不是一次性命令

---

## 🚀 **一键启动，30秒完成配置**

### ⚙️ **快速配置**

**📋 前置要求：** 确保已安装 [Node.js](https://nodejs.org/zh-cn)（建议 v18 及以上版本）

打开配置文件，将下面的 `promptx` 配置代码复制进去。这是最简单的 **零配置模式**，PromptX 会自动为您处理一切。

**推荐配置（beta公测版）：**

```json
{
  "mcpServers": {
    "promptx": {
      "command": "npx",
      "args": [
        "-y",
        "-f",
        "--registry",
        "https://registry.npmjs.org",
        "dpml-prompt@beta",
        "mcp-server"
      ]
    }
  }
}
```

<details>
<summary>📦 <strong>其他版本配置</strong></summary>

**Alpha内测版（最新功能）：**
```json
{
  "mcpServers": {
    "promptx": {
      "command": "npx",
      "args": ["-y", "-f", "--registry", "https://registry.npmjs.org", "dpml-prompt@alpha", "mcp-server"]
    }
  }
}
```

**Latest正式版（最高稳定性）：**
```json
{
  "mcpServers": {
    "promptx": {
      "command": "npx",
      "args": ["-y", "-f", "--registry", "https://registry.npmjs.org", "dpml-prompt@latest", "mcp-server"]
    }
  }
}
```

</details>

### 📋 **发布渠道说明**

根据你的使用需求选择合适的版本：

| 🏷️ **渠道** | 📊 **稳定性** | 🎯 **适用场景** | 📦 **配置** |
|---------|---------|------------|---------|
| **alpha** | 内测版 ⚡ | 尝鲜最新功能，参与测试反馈 | `dpml-prompt@alpha` |
| **beta** | 公测版 🧪 | 功能相对稳定，适合日常使用 | `dpml-prompt@beta` |
| **latest** | 正式版 ✅ | 生产环境，追求最高稳定性 | `dpml-prompt@latest` |

**配置参数说明：**
- `command`: 指定使用 npx 运行 promptx 服务（npx 随 Node.js 自动安装）
- `args`: 启动参数配置列表
  - `-y`: 自动确认
  - `-f`: 强制刷新缓存
  - `--registry`: 指定镜像源
  - `https://registry.npmjs.org`: 使用官方镜像
  - `dpml-prompt@beta`: 使用稳定测试版
  - `mcp-server`: 启动服务

**🎯 就这么简单！** 保存文件并重启您的AI应用，PromptX 就已成功激活。

> **💡 提示：** 配置中特意指定了官方镜像源 `registry.npmjs.org`，这可以避免因使用非官方镜像导致的安装问题。如果您发现安装很慢，建议使用代理工具加速，而不是切换到其他镜像源。

### ✅ **安装成功确认**

配置完成并重启AI应用后，当你看到以下MCP工具出现时，即代表PromptX安装成功：

<img src="assets/install-success.jpg" alt="PromptX MCP工具安装成功示意图" width="80%">

看到这些工具说明PromptX已成功连接！现在就可以开始使用"Chat is All you Need"的体验了。

📖 **[完整安装配置指南](https://github.com/Deepractice/PromptX/wiki/PromptX-MCP-Install)** - 包含各种客户端的详细配置方法和故障排除

### 不知道MCP是什么？ [点击查看 MCP幼儿园教程 BiliBili](https://www.bilibili.com/video/BV1HFd6YhErb)

目前所有支持 MCP 协议的 AI 客户端都可以使用 PromptX。主要包括：**Claude Desktop**、**Cursor**、**Windsurf**、**Cline**、**Zed**、**Continue** 等主流 AI 编程工具，以及更多正在接入中的应用。

---

## ⚠️ **项目状态说明**

PromptX 目前处于 **初始开发阶段**，我们正在积极完善功能和修复问题。在达到正式稳定版本之前，您可能会遇到一些使用上的问题或不稳定情况。

**我们诚恳地请求您的理解和支持！** 🙏

### 📞 **遇到问题？获取帮助！**

如果您在使用过程中遇到任何问题，请通过以下方式联系我们：

- 🐛 **提交 Issue**: [GitHub Issues](https://github.com/Deepractice/PromptX/issues) - 详细描述问题，我们会尽快回复
- 💬 **直接联系**: 添加开发者微信 `deepracticex` 获取即时帮助
- 📧 **邮件联系**: 发送邮件至 `sean@deepracticex.com` 获取技术支持
- 📱 **技术交流群**: 扫描下方二维码加入我们的技术交流群

您的反馈对我们非常宝贵，帮助我们快速改进产品质量！ ✨

---

## 🎨 **女娲创造工坊 - 让每个人都成为AI角色设计师**

<div align="center">
  <img src="assets/logo/nuwa-logo-backgroud.jpg" alt="女娲创造工坊" width="120" style="border-radius: 50%; margin: 15px 0 25px 0;">
</div>

#### **💫 从想法到现实，只需2分钟**

你有没有想过：如果我能为特定工作场景定制一个专业AI助手会怎样？**女娲让这个想法变成现实。**

> *"每个想法都值得拥有专属的AI助手，技术的门槛不应该限制创意的飞翔。"*

#### **🎯 核心价值转换**

- **🚀 零门槛创造**: 无需学习复杂技术，用自然语言描述需求即可
- **⚡ 极速交付**: 从想法到可用角色，全程2分钟
- **🎭 专业品质**: 自动生成符合DPML标准的专业AI角色
- **🔄 即插即用**: 创建完成立即可以激活使用
- **💝 掌控感**: 从使用者到创造者的华丽转身

#### **✨ 使用场景示例**

<div align="center">

| 🎯 **用户需求** | ⚡ **女娲生成** | 🚀 **立即可用** |
|---|---|---|
| 👩‍💼 "我需要一个懂小红书营销的AI助手" | 小红书营销专家角色 | `激活小红书营销专家` |
| 👨‍💻 "我想要一个Python异步编程专家" | Python异步编程导师角色 | `激活Python异步编程导师` |
| 🎨 "给我一个UI/UX设计顾问" | UI/UX设计专家角色 | `激活UI/UX设计专家` |
| 📊 "需要一个数据分析师助手" | 数据分析专家角色 | `激活数据分析专家` |

</div>

#### **🎪 体验女娲创造力 - 4步创造专属AI助手**

<div align="center">
  <div align="center">
  <img src="assets/nuwa-demo/step1-action-nuwa.jpg" alt="第1步：激活女娲角色创造顾问" width="80%" style="margin: 10px 0;">
  <img src="assets/nuwa-demo/step2-require-nuwa.jpg" alt="第2步：向女娲描述你的需求" width="80%" style="margin: 10px 0;">
  <img src="assets/nuwa-demo/step3-modify-requirement.jpg" alt="第3步：女娲理解并完善需求" width="80%" style="margin: 10px 0;">
  <img src="assets/nuwa-demo/step4-action-bew-role.jpg" alt="第4步：激活新创建的专属角色" width="80%" style="margin: 10px 0;">
</div>
</div>

```bash
# 1️⃣ 激活女娲角色创造顾问
"我要女娲帮我创建一个角色"

# 2️⃣ 描述你的需求（自然语言即可）
"我需要一个[领域]的专业助手，主要用于[具体场景]"

# 3️⃣ 等待2分钟，女娲为你生成专业角色
# 女娲会创建角色文件、注册到系统、完成质量检查

# 4️⃣ 立即激活使用你的专属AI助手
"激活刚刚创建的角色"
```

#### **🌟 女娲的设计哲学**

- **🎯 无界创造**: 让任何有想法的人都能创造AI助手，打破技术壁垒
- **⚡ 即时满足**: 满足数字时代对即时性的需求
- **🧠 成长引导**: 不只是工具使用，更是引导用户理解AI能力边界
- **🌱 生态共建**: 每个用户创造的角色都可能成为他人的灵感源泉

---

## ⭐ **Star增长趋势**

[![Star History Chart](https://api.star-history.com/svg?repos=Deepractice/PromptX&type=Date)](https://star-history.com/#Deepractice/PromptX&Date)

---

## 🌟 **Deepractice 深度实践社区**

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

> #### **💡 核心开发者使用心得**
> "使用 PromptX 的开发体验真的非常不一样。我们团队基于 Claude Code 并结合 PromptX，**一位开发者仅三天内就完成了超过一万一千行的高质量 Java 代码。**
>
> 这套工作流的价值在实际开发中体现得淋漓尽致。PromptX 解决了 AI 使用时的许多痛点，时刻确保代码风格的统一和质量的达标，大大降低了新成员的学习成本。过去那些需要反复沟通、依靠文档传承的最佳实践，现在能够自然而然地融入到每一次代码生成中。"
> 
> ---
>
> “女娲”让我使用 AI 角色更加方便、快捷，实际上手发现，我并不需要懂代码，也不需要懂复杂的AI原理。我只需要用大白话告诉“女娲”我想要什么，它就能帮我把背后那些复杂的设计工作给完成了，能引导我完成剩下的所有事情。“女娲”本身不负责写小红书笔记，但它能创造出一个“精通小红书营销”的专家。一旦这个专家被创造出来，我以后所有小红书相关的工作，都可以交给这个新角色去做了，效率和专业度都大大提升。

#### **📚 相关资源**

- **AI集成标准与实践指南：** https://github.com/LegacyLands/legacy-lands-library/blob/main/AI_CODE_STANDARDS_ZHCN.md

---

## 📚 **社区教程与案例**

社区成员 **coso** 基于 PromptX 架构开发了 MCP 工具，并分享了完整的开发经验：

#### 🔧 **使用 PromptX 架构开发 crawl-mcp 工具**
- **文章**：[从想法到产品：我如何用Cursor Agent开发出智能内容处理MCP工具](https://mp.weixin.qq.com/s/x23Ap3t9LBDVNcr_7dcMHQ)
- **成果**：[crawl-mcp-server](https://www.npmjs.com/package/crawl-mcp-server) - NPM包 | [GitHub](https://github.com/wutongci/crawl-mcp)
- **亮点**：以 PromptX 为架构参考，实现零代码开发，几小时完成从想法到发布

#### 🛠️ **MCP 开发模板化实践**
- **文章**：[从零代码到开源：我如何用模板革命MCP开发](https://mp.weixin.qq.com/s/aQ9Io2KFoQt8k779L5kuuA)
- **成果**：[mcp-template](https://github.com/wutongci/mcp-template) - 通用MCP开发模板
- **价值**：将 MCP 开发时间从 40 小时缩短到 30 分钟

> 💡 欢迎社区成员分享基于 PromptX 的实践经验，提交 PR 添加到此处。

---


## 🌟 **Deepractice 深度实践社区**

<div align="center">
  <h3>🎯 打造AI时代的Life Style</h3>
  <p><em>"开源 · 开放 · 包容 · 君子和而不同"</em></p>
</div>

### 💫 **社区愿景**

我们相信，AI不仅仅是技术工具，更是重新定义生活方式的革命力量。Deepractice深度实践社区致力于：

- **🌐 构建AI原生的生活方式** - 让AI自然融入工作、学习、创作、生活的每个环节
- **🎓 传播AI时代的实践智慧** - 分享从技术到商业、从工具到哲学的深度思考
- **🤝 建设包容开放的创新生态** - 汇聚不同背景的实践者，碰撞出AI时代的新可能

### 🎯 **社区价值观**

> **"君子和而不同"** - 我们欢迎不同观点的交流与碰撞，在多元中寻求智慧

- **🔓 开源精神** - 技术开放，知识共享，让AI能力触手可及
- **🌈 开放包容** - 无论你是技术专家还是AI新手，都能在这里找到价值
- **💎 深度实践** - 不止于理论探讨，更重视真实场景的落地实践
- **🚀 持续进化** - 与AI时代同步成长，永远保持学习和创新的热情

### 🎁 **社区资源**

#### 🆓 **开源AI产品**

我们提供**完全免费**的开源产品，覆盖AI时代的核心需求：

<div align="center">

| 🛠️ **AI产品** | 💻 **AI编程** | 💼 **AI商业** | 🌱 **AI生活** |
|-------------|-------------|-------------|-------------|
| PromptX角色工坊 | 代码生成最佳实践 | AI创业案例分析 | AI效率生活指南 |
| MCP工具生态 | AI编程架构模式 | 商业模式创新 | AI创作工作流 |
| DPML提示词标准 | 团队协作框架 | 产品战略规划 | AI学习方法论 |
| PATEOAS状态管理 | 开源项目实践 | 技术商业化路径 | AI时代生活哲学 |

</div>

#### 🚀 **开发者创业舞台**

**欢迎开发者和创业者加入社区展示项目！**

- 🌟 **项目孵化** - 利用Deepractice社区影响力，为你的Idea打下第一步基础
- 💡 **技术交流** - 与社区专家深度讨论技术方案和产品方向
- 🎯 **用户反馈** - 获得真实用户的使用反馈和改进建议
- 🤝 **合作机会** - 寻找志同道合的合作伙伴

#### 💼 **商业伙伴共建**

**欢迎商业组织以内容换价值的方式参与社区：**

- ✅ **产品展示** - 可以展示和推广AI相关产品服务
- 📝 **内容贡献** - 必须为社区提供优质技术内容或实践案例
- 🚫 **拒绝硬广** - 严格禁止无价值的强推广告
- 🤝 **共赢理念** - 通过真正的价值创造实现商业成功

> **社区准则：价值优先，内容为王，拒绝割韭菜**

### 🤝 **加入我们**

<div align="center">
  <img src="assets/qrcode.jpg" alt="Deepractice深度实践社区" width="200">
</div>

---

## 🏆 **社区优质案例分享**

### 📋 **企业级应用案例**

#### **🎮 Legacy Lands Library - Minecraft开发工具库**

<div align="center">
  <img src="https://raw.githubusercontent.com/LegacyLands/legacy-lands-library/main/logo.png" alt="Legacy Lands Library Logo" width="120" style="border-radius: 10px; margin: 15px 0 25px 0;">
</div>

**项目简介：** 面向现代 Minecraft 服务端插件开发的生产级工具库  
**项目地址：** https://github.com/LegacyLands/legacy-lands-library  
**组织官网：** https://www.legacylands.cn/

> **💡 核心开发者使用心得**
> 
> "使用 PromptX 的开发体验真的非常不一样。我们团队基于 Claude Code 并结合 PromptX，**一位开发者仅三天内就完成了超过一万一千行的高质量 Java 代码。**
>
> 这套工作流的价值在实际开发中体现得淋漓尽致。PromptX 解决了 AI 使用时的许多痛点，时刻确保代码风格的统一和质量的达标，大大降低了新成员的学习成本。"
> 
> "女娲让我使用 AI 角色更加方便、快捷，我只需要用大白话告诉女娲我想要什么，它就能帮我创造出专业的AI助手，效率和专业度都大大提升。"

**相关资源：** [AI集成标准与实践指南](https://github.com/LegacyLands/legacy-lands-library/blob/main/AI_CODE_STANDARDS_ZHCN.md)

---

### 🛠️ **社区开发者案例**

#### **🔧 crawl-mcp-server - 智能内容处理工具**

**开发者：** 社区成员 coso  
**项目地址：** [NPM](https://www.npmjs.com/package/crawl-mcp-server) | [GitHub](https://github.com/wutongci/crawl-mcp)

**开发经验分享：** [从想法到产品：我如何用Cursor Agent开发出智能内容处理MCP工具](https://mp.weixin.qq.com/s/x23Ap3t9LBDVNcr_7dcMHQ)

**项目亮点：** 以 PromptX 为架构参考，实现零代码开发，几小时完成从想法到发布

#### **🎯 mcp-template - MCP开发模板**

**开发者：** 社区成员 coso  
**项目地址：** [GitHub](https://github.com/wutongci/mcp-template)

**开发经验分享：** [从零代码到开源：我如何用模板革命MCP开发](https://mp.weixin.qq.com/s/aQ9Io2KFoQt8k779L5kuuA)

**项目价值：** 将 MCP 开发时间从 40 小时缩短到 30 分钟

---

### 🌟 **分享你的案例**

我们诚挚邀请社区成员分享基于 PromptX 的实践经验：

- 📝 **提交方式** - 通过 PR 添加你的案例到此处
- 🎯 **分享内容** - 项目介绍、使用心得、效果数据、经验总结
- 🏆 **展示平台** - 在这里展示你的创新成果，获得社区认可
- 🤝 **互相学习** - 与其他实践者交流经验，共同成长

> **让每个优质案例都成为社区的财富！**

