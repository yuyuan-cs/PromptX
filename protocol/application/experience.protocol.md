# experience 应用协议

> **TL;DR:** experience标签用于定义AI系统中经验知识的结构和语义，采用简单直观的HTML风格属性标记，专注于"什么是经验"，是实现系统自我优化和经验积累的核心表达机制。

## 🔍 基本信息

**标签名:** `<experience>`

### 目的与功能

experience标签在提示工程中提供了经验知识的标准定义方式，主要功能包括：
- 定义经验信息的名称和分类
- 提供简洁明了的经验描述
- 支持基本的元数据标注
- 为系统提供可复用的问题解决知识

## 📝 语法定义

```ebnf
(* EBNF形式化定义 *)
experience_element ::= '<experience' attributes? '>' content '</experience>'
attributes ::= (' ' attribute)+ | ''
attribute ::= name '="' value '"'
name ::= [a-zA-Z][a-zA-Z0-9_-]*
value ::= [^"]*
content ::= text
text ::= (* 任何文本内容，用于简要描述经验 *)
```

## 🧩 语义说明

experience标签用于在提示词中定义经验知识。采用简洁的HTML风格属性标记方式，通过id指定唯一标识符，通过class指定经验的分类维度，标签内容直接描述该经验的含义。它作为系统知识积累的具体实现，为AI系统提供了清晰简洁的经验定义能力。

## 💡 最佳实践

### 核心属性

experience标签主要使用以下属性：

- **id**: 定义经验的唯一标识符，如`id="solution_pattern"`，`id="error_response"`
- **class**: 定义经验的分类/维度，如`class="problem_solving"`，`class="system"`，`class="user"`

### 内容组织

experience标签内容应简洁明了，直接描述该经验的含义和用途，无需复杂的结构和格式。

### 维度分类指南

使用class属性定义experience维度时，建议遵循以下标准分类：

- **problem_solving**: 问题解决相关经验，如常见问题的解决方案和策略
- **system**: 系统相关经验，如系统行为模式、限制和最佳实践
- **user**: 用户相关经验，如用户交互模式和偏好
- **domain**: 领域相关经验，如特定专业领域的知识和最佳实践
- **optimization**: 优化相关经验，如性能提升和效率改进的方法

## 📋 使用示例

```html
<!-- 问题解决经验 -->
<experience id="error_handling_strategy" class="problem_solving">处理错误的最佳策略</experience>

<!-- 系统经验 -->
<experience id="resource_limitation" class="system">系统资源限制与应对策略</experience>

<!-- 用户经验 -->
<experience id="user_interaction_pattern" class="user">用户交互偏好与行为模式</experience>

<!-- 领域经验 -->
<experience id="code_optimization_approach" class="domain">代码优化方法论</experience>

<!-- 优化经验 -->
<experience id="performance_tuning" class="optimization">系统性能调优技巧</experience>
```

