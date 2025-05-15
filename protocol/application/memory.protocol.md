# memory 应用协议

> **TL;DR:** memory标签用于定义AI系统的记忆持久化能力，支持跨会话知识存储和检索，采用简单直观的方式表达记忆内容。

## 🔍 基本信息

**标签名:** `<memory>`

### 目的与功能

memory标签定义了AI系统记忆的内容与标识，主要功能包括：
- 提供简洁的记忆内容定义方式
- 通过唯一标识符区分不同记忆
- 实现跨会话的信息传递能力
- 支持记忆内容的简明描述

## 📝 语法定义

```ebnf
(* EBNF形式化定义 *)
memory_element ::= '<memory' attributes? '>' content '</memory>'
attributes ::= (' ' attribute)+ | ''
attribute ::= name '="' value '"'
name ::= [a-zA-Z][a-zA-Z0-9_-]*
value ::= [^"]*
content ::= text
text ::= (* 任何文本内容，用于描述记忆 *)
```

## 🧩 语义说明

memory标签用于在提示词中定义需要持久化的记忆内容。通过id属性提供唯一标识，标签内容直接描述该记忆的含义。它使系统能够保存和利用过去的交互经验和知识，从而增强系统在长期交互中的连续性和一致性。

## 💡 最佳实践

### 核心属性

memory标签主要使用以下属性：

- **id**: 记忆的唯一标识符，如`id="context"`, `id="history"`, `id="preferences"`

### 可选属性

在特定场景下，也可以使用以下可选属性：

- **type**: 记忆类型，如`type="session"`, `type="long-term"`, `type="episodic"`
- **priority**: 记忆优先级，如`priority="high"`, `priority="normal"`, `priority="low"`

### 内容组织

memory标签内容应简洁明了，直接描述该记忆的含义和用途，无需复杂的结构和格式。

## 📋 使用示例

```html
<!-- 上下文感知记忆 -->
<memory id="context">上下文感知记忆</memory>

<!-- 对话历史记忆 -->
<memory id="history">用户对话历史记录</memory>

<!-- 用户偏好记忆 -->
<memory id="preferences">用户个性化偏好设置</memory>

<!-- 项目信息记忆 -->
<memory id="project">项目相关信息和配置</memory>

<!-- 决策历史记忆 -->
<memory id="decisions">重要决策历史记录</memory>
```

> **注意**: 实际的记忆存储和检索逻辑应由系统底层实现，memory标签专注于定义记忆的标识和基本含义。 