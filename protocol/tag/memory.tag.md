# DPML记忆模式提示词框架

> **TL;DR:** DPML记忆模式提示词框架定义了AI系统的记忆管理提示词模板，支持运行时记忆管理，包含评估(evaluate)、存储(store)和回忆(recall)三个核心组件，实现完整的动态记忆能力。

### 目的与功能

DPML记忆模式提示词框架为AI系统提供完整的记忆能力提示词模板，主要功能包括：
- 提供运行时记忆的评估、存储和检索的标准化提示词机制
- 实现跨会话的信息持久化提示词模板
- 支持复杂的记忆关联和检索模式的提示词构建

## 🔍 基本信息

**框架名称:** `<memory>` (DPML记忆模式提示词框架)


## 📝 语法定义

```ebnf
(* EBNF形式化定义 *)
memory_element ::= '<memory' attributes? '>' memory_content '</memory>'
attributes ::= (' ' attribute)+ | ''
attribute ::= name '="' value '"'
name ::= [a-zA-Z][a-zA-Z0-9_-]*
value ::= [^"]*

memory_content ::= (text | evaluate_element | store_element | recall_element)+

evaluate_element ::= '<evaluate:thought>' thought_content '</evaluate:thought>'
store_element ::= '<store:execution' attributes? '>' (text | execution_element)* '</store:execution>'
recall_element ::= '<recall:thought>' thought_content '</recall:thought>'

thought_content ::= (* 符合thought协议的内容 *)
execution_element ::= (* 符合execution协议的元素 *)

text ::= (* 任何文本内容 *)
```

## 🧩 语义说明

memory标签表示AI系统的记忆管理单元，定义了动态记忆的结构和操作方式。它由运行时记忆管理的三个核心部分组成：

### 记忆操作

memory标签包含三个核心子标签，分别对应记忆的三个操作阶段：

1. **`<evaluate:thought>`**：评估信息是否值得记忆
   - 通过thought协议实现评估过程
   - 判断信息的价值、相关性和可信度
   - 决定是否将信息存入记忆系统

2. **`<store:execution>`**：将信息存入记忆系统
   - 通过execution协议实现存储操作
   - 定义存储过程、规则和约束
   - 管理记忆的添加、更新和组织

3. **`<recall:thought>`**：从记忆系统检索并应用信息
   - 通过thought协议实现回忆过程
   - 判断何时需要检索特定记忆
   - 规划如何检索和应用记忆内容
   - 可以使用多种实现方式，包括但不限于资源引用
   - **注意**：recall标签中的资源引用默认是按需加载的

### 组件关系

三个核心组件之间具有明确的逻辑关系：
- evaluate-store-recall构成动态记忆的完整循环
- evaluate决定什么值得记忆
- store定义如何保存记忆
- recall描述何时以及如何使用记忆

记忆系统的运行遵循"评估-存储-回忆"的循环模式，不断丰富和发展角色的记忆能力。

> **注意**：先验知识库(knowledge)已经迁移至`<role>`标签下管理，`<memory>`标签专注于动态记忆的运行时管理。

