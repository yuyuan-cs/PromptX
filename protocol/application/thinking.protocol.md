# thinking 应用协议

> **TL;DR:** thinking标签用于定义结构化的思考框架，帮助AI系统进行系统性分析和推理，支持Markdown和Mermaid图表表达思维过程。

## 🔍 基本信息

**标签名:** `<thinking>`
**版本:** 1.0.0
**类别:** 思考
**状态:** 草稿
**创建日期:** 2023-06-20

### 目的与功能

thinking标签定义了AI系统进行思考分析的框架和流程，它的主要功能是：
- 提供结构化的思维分析模式
- 组织和展示概念关系与逻辑推理
- 支持可视化思维导图和决策树
- 帮助AI系统进行系统性、全面性的问题分析

## 📝 语法定义

```ebnf
(* EBNF形式化定义 *)
thinking_element ::= '<thinking' attributes? '>' content '</thinking>'
attributes ::= (' ' attribute)+ | ''
attribute ::= name '="' value '"'
name ::= [a-zA-Z][a-zA-Z0-9_-]*
value ::= [^"]*
content ::= markdown_content
markdown_content ::= (* 任何有效的Markdown文本，包括Mermaid图表 *)
```

## 🧩 语义说明

thinking标签表示一个完整的思考过程或思维框架。标签内容采用Markdown格式，可以包含文本段落、列表、标题以及Mermaid图表等元素，用于表达结构化的思考方式。thinking标签特别适合表达概念关系、逻辑推理和系统性思考，为AI提供思考分析的参考框架。

## 💡 最佳实践

以下是使用thinking标签的一些建议做法，这些并非强制要求，仅作为参考：

### 推荐属性

可以考虑使用以下属性来增强thinking标签的语义：

- **type**: 指定思考类型，如`type="analysis"`, `type="design"`, `type="evaluation"`, `type="brainstorm"`, `type="problem-solving"`
- **domain**: 指定思考领域，如`domain="software"`, `domain="business"`, `domain="science"`
- **method**: 指定思维方法，如`method="systematic"`, `method="lateral"`, `method="critical"`

### 内容组织

推荐在thinking标签内使用以下结构组织内容：

1. 以一级标题(`#`)定义核心问题或思考主题
2. 使用二级标题(`##`)划分思考的主要部分（如问题分析、方案设计、评估等）
3. 使用列表、表格等方式组织关键点和因素
4. 使用Mermaid图表可视化思维过程（见下方推荐）
5. 在结尾提供结论或决策建议

### Mermaid图表选择

不同类型的思考场景适合使用不同的Mermaid图表类型：

- **思维导图(mindmap)**: 适合概念分解、头脑风暴和关联分析
  ```mermaid
  mindmap
    root((核心问题))
      因素A
        子因素A1
        子因素A2
      因素B
        子因素B1
      因素C
  ```

- **流程图(flowchart)**: 适合步骤分析、决策流程和算法思路
  ```mermaid
  flowchart TD
    A[起点] --> B{判断条件}
    B -->|条件1| C[路径1]
    B -->|条件2| D[路径2]
    C --> E[结果1]
    D --> F[结果2]
  ```

- **类图(classDiagram)**: 适合概念关系和抽象模型设计
  ```mermaid
  classDiagram
    概念A <|-- 子概念B
    概念A <|-- 子概念C
    概念A : 属性1
    概念A : 属性2
  ```

- **甘特图(gantt)**: 适合项目规划和时间线分析
  ```mermaid
  gantt
    title 项目计划
    section 阶段1
    任务1 :a1, 2023-01-01, 30d
    任务2 :after a1, 20d
    section 阶段2
    任务3 :2023-02-15, 28d
  ```

- **状态图(stateDiagram)**: 适合状态转换和系统行为分析
  ```mermaid
  stateDiagram-v2
    [*] --> 状态A
    状态A --> 状态B: 事件1
    状态B --> 状态C: 事件2
    状态C --> [*]
  ```

## 📋 使用示例

<thinking>

  # 问题分析框架
  
  ## 核心问题
  如何优化系统性能并保持代码可维护性
  
  ## 因素分析
  影响因素包括：
  - 算法效率
  - 数据结构选择
  - 并发处理
  - 代码组织
  
  ```mermaid
  mindmap
    root((性能优化))
      算法层面
        时间复杂度
        空间复杂度
      数据结构
        查询效率
        内存占用
      系统架构
        并发模型
        资源管理
  ```
  
  ## 结论
  应优先考虑数据结构优化和并发处理模型调整
</thinking>
