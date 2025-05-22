# DPML#角色提示单元 框架

> **TL;DR:** DPML#角色提示单元 框架解释了如何通过组合#思维模式、#行为模式 和#记忆模式 三大基础协议来构建完整的#AI角色，支持不同类型#角色模式 的构建和定制。

### 目的与功能

DPML#角色提示单元 框架说明了如何通过基础协议的组合构建#AI角色，它的主要功能是：
- 提供#角色合成 的标准方法论
- 指导如何将#思维模式、#行为模式 和#记忆模式 组合以表达#角色特性
- 支持不同类型#角色模式 的灵活定制
- 确保#角色定义 的一致性和完整性

## 📝 语法定义

```ebnf
(* EBNF形式化定义 *)
role_element ::= '<role' attributes? '>' role_content '</role>'
role_content ::= (personality_element | principle_element | knowledge_element | experience_element | action_element)+

(* #角色组织标签 *)
personality_element ::= '<personality' attributes? '>' personality_content '</personality>'
principle_element ::= '<principle' attributes? '>' principle_content '</principle>'
knowledge_element ::= '<knowledge' attributes? '>' knowledge_content '</knowledge>'
experience_element ::= '<experience' attributes? '>' experience_content '</experience>'
action_element ::= '<action' attributes? '>' action_content '</action>'

(* 内部内容 *)
personality_content ::= markdown_content
principle_content ::= markdown_content
knowledge_content ::= markdown_content
experience_content ::= markdown_content
action_content ::= markdown_content

attributes ::= (' ' attribute)+ | ''
attribute ::= name '="' value '"'
name ::= [a-zA-Z][a-zA-Z0-9_-]*
value ::= [^"]*

(* 各协议内容定义见各自协议文档 *)
```

## 🧩 语义说明

`<role>`标签是DPML中定义#AI角色 的顶层#角色提示单元，它封装了#人格、#原则 和#知识记忆，共同构成一个完整的#角色定义。#角色定义 必须使用`<role>`作为根标签，而不应直接使用其他标签的组合。

### #角色提示单元 的组成部分

- **#人格(Personality)**: 用于设置和编排多种#思维模式 的优先级
  - #思维模式 为 `<thought>` 的语义功能
  - 定义#角色 拥有的一种或多种#思维模式
  - 设置不同#思维模式 的激活条件，组合方式和优先级
  - 确保#角色思维 的一致性和可预测性

- **#原则(Principle)**: 用于设置和编排多种#行为模式 的优先级
  - #行为模式 为 `<execution>` 的语义功能
  - 定义#角色 拥有的一种或多种#行为模式
  - 设置不同#行为模式 的触发条件，执行顺序和优先级
  - 确保#角色行为 的规范性和可控性
  
- **#知识(Knowledge)**: #角色 的#先验知识库
  - 定义#角色 固有的、初始化的#知识体系
  - 提供#角色 的专业背景和基础认知框架
  - 作为#角色理解 和决策的#知识基础

- **#经验(Experience)**: 用于设置和编排多种#记忆模式 的优先级
  - #记忆模式 为 `<memory>` 的语义功能
  - 定义#角色 如何#评估、#存储 和#回忆 信息
  - 设置不同#记忆模式 的检索条件和优先级
  - 确保#角色记忆处理 的连贯性和适应性

- **#激活(Action)**: 提供#角色初始化 和执行的入口
  - 定义#角色 从"定义"到"执行"的转换机制
  - 明确#角色初始化 序列和优先级
  - 规定#资源加载、#记忆系统 启动等关键步骤
  - 确保#角色 能够正确地进入执行状态
  - 建立#角色定义 与实际执行间的桥梁