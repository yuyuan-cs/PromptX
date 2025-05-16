# DPML思考模式提示词框架

> **TL;DR:** DPML思考模式提示词框架定义了结构化的思考类提示词模板，支持四种核心思维模式的提示词构建：横向探索(exploration)、纵向推理(reasoning)、流程计划(plan)和批判挑战(challenge)，帮助AI系统进行系统性分析和推理。

### 目的与功能

DPML思考模式提示词框架定义了AI系统进行思考分析的提示词模板和结构，它的主要功能是：
- 提供结构化的思维分析提示词模板
- 规范化思考类提示词的组织方式
- 支持可视化思维导图和决策树的提示词表达
- 帮助AI系统通过标准化提示词进行系统性、全面性的问题分析
- 区分不同类型的思维模式提示词：探索、推理、计划和挑战

## 📝 语法定义

```ebnf
(* EBNF形式化定义 *)
thought_element ::= '<thought' attributes? '>' content '</thought>'
attributes ::= (' ' attribute)+ | ''
attribute ::= name '="' value '"'
name ::= [a-zA-Z][a-zA-Z0-9_-]*
value ::= [^"]*
content ::= (markdown_content | exploration_element | reasoning_element | plan_element | challenge_element)+
markdown_content ::= (* 任何有效的Markdown文本，包括Mermaid图表 *)

exploration_element ::= '<exploration' attributes? '>' markdown_content '</exploration>'
reasoning_element ::= '<reasoning' attributes? '>' markdown_content '</reasoning>'
plan_element ::= '<plan' attributes? '>' markdown_content '</plan>'
challenge_element ::= '<challenge' attributes? '>' markdown_content '</challenge>'
```

## 🧩 语义说明

thought标签表示一个完整的思考过程或思维框架。标签内容可以包含四种不同思维模式的子标签，或直接使用Markdown格式表达思考内容。

子标签具有明确的语义：
- **exploration**: 表示跳跃思考，发散性思维，生成可能性，寻找多种可能性、创新点和关联性
- **reasoning**: 表示连续思考，收敛性思维，验证可能性，深入分析因果关系、逻辑链条
- **plan**: 表示秩序思考，结构性思维，固化可能性，设计行动步骤、决策路径、组织结构、系统架构
- **challenge**: 表示逆向跳跃思考，批判性思维，质疑可能性，寻找假设漏洞、识别潜在风险、测试极限条件

exploration和challenge是一对思维模式的正反两面：exploration向外发散寻找"可能是什么"，而challenge向内批判探究"可能不是什么"。二者都采用跳跃式思考，但方向相反。reasoning负责系统验证，而challenge主要提出问题点。

thought标签特别适合表达概念关系、逻辑推理和系统性思考，为AI提供思考分析的参考框架。

### 推荐的思考顺序

在实际思考过程中，推荐遵循如下顺序以获得系统性和全面性的分析结果：
1. **探索（exploration）**：首先发散思考，提出尽可能多的可能性和创新点；
2. **反思/批判（challenge）**：对探索阶段的内容进行批判性思考，识别潜在风险和假设漏洞；
3. **推理（reasoning）**：对经过反思筛选的内容进行系统性推理和因果分析；
4. **计划（plan）**：最后制定具体的行动方案和决策路径。

在复杂问题中，challenge和reasoning可多次交替，plan阶段也可穿插challenge以确保方案稳健性。

### 子标签的可选性

thought标签内的四种子标签（exploration、challenge、reasoning、plan）均为可选。实际的思考提示词可以只包含其中的一种、几种，或全部，具体内容由实际需求决定。

对于提示词的理解者来说，只需知道这些子标签不是必须全部出现，遇到哪些子标签就理解哪些即可，无需关心未出现的部分。
