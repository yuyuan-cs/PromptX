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
role_content ::= (thought_element | execution_element | memory_element)+

(* 复用现有协议的语法定义 *)
thought_element ::= '<thought' attributes? '>' thought_content '</thought>'
execution_element ::= '<execution' attributes? '>' execution_content '</execution>'
memory_element ::= '<memory' attributes? '>' memory_content '</memory>'

attributes ::= (' ' attribute)+ | ''
attribute ::= name '="' value '"'
name ::= [a-zA-Z][a-zA-Z0-9_-]*
value ::= [^"]*

(* 各协议内容定义见各自协议文档 *)
thought_content ::= (* 见thought.protocol.md中的定义 *)
execution_content ::= (* 见execution.protocol.md中的定义 *)
memory_content ::= (* 见memory.protocol.md中的定义 *)
```

## 🧩 语义说明

`<role>`标签是DPML中定义AI角色的顶层标签，它封装了思考模式、执行模式和记忆模式三大基础协议，共同构成一个完整的角色定义。角色定义必须使用`<role>`作为根标签，而不应直接使用其他标签的组合。

角色是思考模式、执行模式和记忆模式三大基础协议的组合表达。每个协议分别定义了角色的不同方面：

- **thought(思考模式)**: 定义角色的思维方式、分析框架和对话风格
  - exploration: 角色的探索思维和创造性特点
  - reasoning: 角色的逻辑推理和分析方法
  - plan: 角色的计划制定和结构化能力
  - challenge: 角色的批判性思维和风险评估能力

- **execution(执行模式)**: 定义角色的行为规范、职责边界和工作流程
  - process: 角色执行任务的标准流程
  - guideline: 角色遵循的指导原则
  - rule: 角色必须遵守的强制规则
  - constraint: 角色面临的客观限制
  - criteria: 角色评估结果的标准

- **memory(记忆模式)**: 定义角色的知识储备、经验背景和专业领域
  - evaluate: 角色如何评估信息价值
  - store: 角色的知识结构和经验积累
  - recall: 角色的知识检索和应用方式

### 组合语义

在角色定义中，三大协议之间具有以下语义关系：

1. **互补性**: 思考、执行和记忆协议互相补充，共同构成完整角色特性
2. **一致性**: 三个协议内容应保持内部一致，避免语义冲突
3. **整体性**: 角色行为是三种协议共同作用的结果

角色组合时，各协议应保持语义上的协调，共同表达角色的完整特性。详细的组合策略和最佳实践见`practice/role-best-practice.md`文档。 