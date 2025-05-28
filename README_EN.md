# PromptX

> **TL;DR:** PromptX is a systematic, enterprise-grade prompt engineering framework that provides structured and modular approaches for building and managing AI prompts.

[Chinese](README.md) | **English** | [Issues](https://github.com/Deepractice/PromptX/issues)

## 🚀 Why PromptX?

### The Challenge
- **Scattered Prompt Management**: Prompts spread across different projects without standardization
- **Lack of Engineering Practices**: No systematic approach to prompt development and optimization  
- **Limited Reusability**: Difficulty in sharing and reusing prompt components across teams
- **No Memory & Learning**: AI assistants can't learn from previous interactions

### The Solution
PromptX introduces **DPML (Deepractice Prompt Markup Language)** - a structured framework for prompt engineering with:

- 🧠 **Cognitive Patterns**: Multi-dimensional thinking capabilities (exploration, reasoning, planning, challenge)
- ⚡ **Execution Framework**: Standardized workflows and quality assurance
- 💾 **Memory System**: Intelligent context retention and learning capabilities  
- 🎭 **Role-based Architecture**: Pre-built professional roles with specialized expertise
- 🔧 **Modular Design**: Reusable components for rapid development

## 📦 Quick Start

### Prerequisites

- Node.js (>= 14.0.0)

### Installation

PromptX is a prompt framework that can be integrated into your project in the following way:

#### Clone and Copy to Your Project

```bash
# Clone PromptX repository
git clone https://github.com/Deepractice/PromptX.git

# Copy PromptX directory to your project
cp -r PromptX /path/to/your/project/
```

### Basic Usage

Follow these steps to get started with PromptX:

#### Step 1: Open bootstrap.md File
```bash
# View the role bootstrap file
cat PromptX/bootstrap.md
```

#### Step 2: Configure Role Reference
Modify the role reference in bootstrap.md, for example:
```markdown
@file://PromptX/domain/scrum/role/product-owner.role.md
```

#### Step 3: Set as System Prompt
Copy the modified bootstrap.md content to your AI system's system prompt.

You can use it with tools like Cursor Rules or directly paste the bootstrap content into your AI chat interface.

<img src="assets/demo2.jpg" alt="System Prompt Configuration Demo" width="500">

*Note: Screenshots show Chinese interface*

#### Step 4: Send Action Command
Send the following command to your AI:
```
Action
```

The AI will automatically load roles, cognitive patterns, execution frameworks, and memory systems according to the PromptX protocol.

### Demo

<img src="assets/demo.gif" alt="PromptX Usage Demo" width="600">

*Note: Demo shows Chinese interface*

## 🧠 AI Enhancement Capabilities

PromptX enhances your AI assistant across multiple dimensions:

### Cognitive Patterns (Thought)

Provides structured thinking capabilities for AI:

- **Multi-perspective Analysis** - Comprehensive problem analysis from exploration, reasoning, planning, and challenge dimensions
- **Logical Rigor** - Establishes clear causal relationships and reasoning chains
- **Decision Support** - Develops actionable plans and execution paths  
- **Risk Identification** - Proactively identifies potential issues and improvement opportunities

### Execution Framework (Execution)

Empowers AI with standardized behavioral capabilities:

- **Standardized Execution** - Completes tasks following clear processes and procedures
- **Quality Assurance** - Adheres to industry best practices and quality standards
- **Boundary Awareness** - Clear understanding of capabilities and limitations
- **Continuous Improvement** - Optimizes execution based on feedback

### Memory System (Memory)

Enables AI learning and memory capabilities:

- **Intelligent Memory** - Automatically identifies and saves important information
- **Context Awareness** - Provides personalized services based on historical interactions
- **Knowledge Accumulation** - Continuously learns and improves knowledge base
- **Experience Transfer** - Applies successful experiences to new scenarios

The prompt system includes a built-in memory mode with memory evaluation (AI autonomously assesses what content is worth remembering), memory storage (stored by default in .memory files in the project root directory), and recall (AI automatically recalls existing memory content at startup).

During usage, users can ask AI to remember certain information, such as "Remember this experience, we'll use it next time." AI will also autonomously evaluate what content is worth remembering.

<img src="assets/demo3.jpg" alt="AI Memory Example" width="600">

*Note: Screenshot shows Chinese interface*

## 🎭 Built-in Roles

PromptX framework includes multiple professional roles ready to use:

| Category | Role Name | File Path | Key Capabilities |
|----------|-----------|-----------|------------------|
| Basic | Assistant | `@file://PromptX/domain/assistant/assistant.role.md` | Basic thinking and memory capabilities, suitable for general conversation and information processing |
| Scrum Agile | Product Owner | `@file://PromptX/domain/scrum/role/product-owner.role.md` | Product planning, requirement management, priority decision-making, user-oriented thinking, data-driven decisions |
| DPML Development | Prompt Developer | `@file://PromptX/domain/prompt/prompt-developer.role.md` | Exploratory, systematic and critical thinking, DPML development standards, prompt engineering best practices |
| Content Creation | Video Copywriter | `@file://PromptX/domain/copywriter/video-copywriter.role.md` | Creative, narrative and marketing thinking, video content creation, copywriting standards, communication optimization |

## 🛠️ Custom Roles

You can easily create custom roles using PromptX:

1. Reference the prompt developer role in bootstrap.md:
   ```
   @file://PromptX/domain/prompt/prompt-developer.role.md
   ```
2. Describe your new role requirements to the prompt developer AI
3. AI will automatically generate a complete role definition file
4. Save the generated role file and reference it in bootstrap.md

This approach makes prompt development AI-assisted!

## 🌐 Resources

- [Deepractice Official Website](https://www.deepracticex.com/) - Deepractice
- [DPML Project](https://github.com/Deepractice/dpml) - Deepractice Prompt Markup Language

### Community & Support

- 🐛 [Report Issues](https://github.com/Deepractice/PromptX/issues)
- 💬 [Join Discussions](https://github.com/Deepractice/PromptX/discussions)
- ⭐ [Star this Project](https://github.com/Deepractice/PromptX)

## 📄 License

MIT

---

**Need industry-specific roles but don't know how to develop them?** 

Feel free to [open an issue](https://github.com/Deepractice/PromptX/issues) with your requirements! 
