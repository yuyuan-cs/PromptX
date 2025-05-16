# context 应用协议

> **TL;DR:** context标签用于定义AI系统中各类上下文信息的结构和语义，采用简单直观的HTML风格属性标记，专注于"什么是上下文"，是实现CAP(情境感知提示模式)的核心表达机制。

## 🔍 基本信息

**标签名:** `<context>`

### 目的与功能

context标签在提示工程中提供了情境信息的标准定义方式，主要功能包括：
- 定义上下文信息的名称和分类
- 提供简洁明了的上下文描述
- 支持基本的元数据标注
- 为其他模式提供情境依赖的决策支持

## 📝 语法定义

```ebnf
(* EBNF形式化定义 *)
context_element ::= '<context' attributes? '>' content '</context>'
attributes ::= (' ' attribute)+ | ''
attribute ::= name '="' value '"'
name ::= [a-zA-Z][a-zA-Z0-9_-]*
value ::= [^"]*
content ::= text
text ::= (* 任何文本内容，用于简要描述上下文 *)
```

## 🧩 语义说明

context标签用于在提示词中定义上下文信息。采用简洁的HTML风格属性标记方式，通过id指定唯一标识符，通过class指定分类，标签内容直接描述该上下文的含义。它作为CAP模式的具体实现，为AI系统提供了清晰简洁的上下文定义能力。实际的上下文感知执行逻辑由execution协议负责实现。

## 💡 最佳实践

### 核心属性

context标签主要使用以下属性：

- **id**: 定义上下文的唯一标识符，如`id="rootDir"`, `id="userName"`
- **class**: 定义上下文的分类/维度，如`class="project"`, `class="user"`, `class="system"`


### 内容组织

context标签内容应简洁明了，直接描述该上下文的含义和用途，无需复杂的结构和格式。

### 维度分类指南

使用class属性定义context维度时，建议遵循以下标准分类：

- **project**: 项目相关上下文，如根目录、语言、框架等
- **user**: 用户相关上下文，如用户名、偏好、技能水平等
- **system**: 系统相关上下文，如操作系统、硬件资源等
- **environment**: 环境相关上下文，如IDE、终端、网络状况等
- **task**: 任务相关上下文，如当前目标、进度、限制条件等

## 📋 使用示例

```html
<!-- 项目根目录 -->
<context id="rootDir" class="project">项目根目录路径</context>

<!-- 项目编程语言 -->
<context id="language" class="project">项目主要编程语言</context>

<!-- 项目框架 -->
<context id="frameworks" class="project">项目使用的框架列表</context>

<!-- 操作系统类型 -->
<context id="osType" class="system">操作系统类型</context>

<!-- 用户名称 -->
<context id="userName" class="user">用户名称</context>

<!-- IDE类型 -->
<context id="ideType" class="environment">集成开发环境类型</context>

<!-- 任务目标 -->
<context id="taskGoal" class="task">当前任务的主要目标</context>
```
