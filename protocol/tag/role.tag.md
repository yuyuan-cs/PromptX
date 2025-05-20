# DPML角色合成提示词框架

> **TL;DR:** DPML角色合成提示词框架解释了如何通过组合思考模式、执行模式和记忆模式三大基础协议来构建完整的AI角色，支持不同类型角色的构建和定制。

### 目的与功能

DPML角色合成提示词框架说明了如何通过基础协议的组合构建AI角色，它的主要功能是：
- 提供角色构建的标准方法论
- 指导如何将思考、执行和记忆协议组合以表达角色特性
- 支持不同类型角色的灵活定制
- 确保角色定义的一致性和完整性

## 📝 语法定义

```ebnf
(* EBNF形式化定义 *)
role_element ::= '<role' attributes? '>' role_content '</role>'
role_content ::= (personality_element | principle_element | knowledge_element | experience_element)+

(* 角色组织标签 *)
personality_element ::= '<personality' attributes? '>' personality_content '</personality>'
principle_element ::= '<principle' attributes? '>' principle_content '</principle>'
knowledge_element ::= '<knowledge' attributes? '>' knowledge_content '</knowledge>'
experience_element ::= '<experience' attributes? '>' experience_content '</experience>'

(* 内部内容 *)
personality_content ::= markdown_content
principle_content ::= markdown_content
knowledge_content ::= markdown_content
experience_content ::= markdown_content

attributes ::= (' ' attribute)+ | ''
attribute ::= name '="' value '"'
name ::= [a-zA-Z][a-zA-Z0-9_-]*
value ::= [^"]*

(* 各协议内容定义见各自协议文档 *)
```

## 🧩 语义说明

`<role>`标签是DPML中定义AI角色的顶层标签，它封装了角色的人格特征、行为原则和知识记忆，共同构成一个完整的角色定义。角色定义必须使用`<role>`作为根标签，而不应直接使用其他标签的组合。

### 角色的组成部分

- **personality(角色人格)**: 用于设置和编排多种思维模式的优先级
  - 思维模式为 `<thought>` 的语义功能
  - 定义角色拥有的一种或多种思维模式
  - 设置不同思维模式的激活条件，组合方式和优先级
  - 确保角色思维的一致性和可预测性

- **principle(角色原则)**: 用于设置和编排多种行为模式的优先级
  - 行为模式为 `<execution>` 的语义功能
  - 定义角色拥有的一种或多种行为模式
  - 设置不同行为模式的触发条件，执行顺序和优先级
  - 确保角色行为的规范性和可控性
  
- **knowledge(角色知识)**: 角色的预设知识库
  - 定义角色固有的、初始化的知识体系
  - 提供角色的专业背景和基础认知框架
  - 作为角色理解和决策的知识基础

- **experience(角色经验)**: 用于设置和编排多种记忆模式的优先级
  - 记忆模式为 `<memory>` 的语义功能
  - 定义角色如何评估、存储和回忆信息
  - 设置不同记忆模式的检索条件和优先级
  - 确保角色记忆处理的连贯性和适应性