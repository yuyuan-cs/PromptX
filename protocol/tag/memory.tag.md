# DPML#记忆提示单元 框架

> **TL;DR:** DPML#记忆提示单元 框架定义了AI系统的#记忆管理#记忆单元 模板，支持运行时#动态记忆 管理，包含#评估(evaluate)、#存储(store)和#回忆(recall)三个核心#记忆操作，实现完整的#记忆循环 能力。

### 目的与功能

DPML#记忆提示单元 框架为AI系统提供完整的#记忆单元 模板，主要功能包括：
- 提供运行时#动态记忆 的#评估、#存储 和#回忆 的标准化#记忆操作 机制
- 实现跨会话的信息持久化#记忆单元 模板
- 支持复杂的#记忆关联 和#记忆检索 模式的#记忆提示单元 构建

## 🔍 基本信息

**框架名称:** `<memory>` (DPML#记忆提示单元 框架)


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

#记忆提示单元 标签表示AI系统的#记忆管理 单元，定义了#动态记忆 的结构和#记忆操作 方式。它由运行时#记忆管理 的三个核心部分组成：

### #记忆操作

#记忆提示单元 包含三个核心子标签，分别对应#记忆操作 的三个阶段：

1. **`<evaluate:thought>`**：#评估 信息是否值得记忆
   - 通过thought协议实现#评估 过程
   - 判断信息的价值、相关性和可信度
   - 决定是否将信息存入#记忆系统

2. **`<store:execution>`**：将信息#存储 入#记忆系统
   - 通过execution协议实现#存储 操作
   - 定义#存储 过程、规则和约束
   - 管理#记忆单元 的添加、更新和组织

3. **`<recall:thought>`**：从#记忆系统 检索并应用信息
   - 通过thought协议实现#回忆 过程
   - 判断何时需要#回忆 特定记忆
   - 规划如何#回忆 和应用#记忆内容
   - 可以使用多种实现方式，包括但不限于#资源引用
   - **注意**：#回忆 标签中的#资源引用 默认是按需加载的

### #记忆单元 关系

三个核心组件之间具有明确的逻辑关系：
- #评估-#存储-#回忆 构成#动态记忆 的完整#记忆循环
- #评估 决定什么值得记忆
- #存储 定义如何保存记忆
- #回忆 描述何时以及如何使用记忆

#记忆系统 的运行遵循"#评估-#存储-#回忆"的#记忆循环 模式，不断丰富和发展角色的#记忆能力。

> **注意**：#先验知识库(knowledge)已经迁移至`<role>`标签下管理，`<memory>`标签专注于#动态记忆 的运行时管理。

### #记忆模式

#记忆提示单元 支持多种#记忆模式，如#工作记忆、#短期记忆、#长期记忆、#陈述性记忆、#程序性记忆、#情境性记忆 等，可根据场景灵活配置和切换。

