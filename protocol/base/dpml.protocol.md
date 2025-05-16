# DPML 模式协议

> **TL;DR:** DPML(Deepractice Prompt Markup Language)是一种结合了XML结构和Markdown内容的混合标记语言，专为提示词工程设计，提供清晰的语义结构同时保持自然语言的灵活性。

## 🔍 协议概述

**协议名称:** Deepractice Prompt Markup Language (DPML)
**版本:** 0.0.1
**状态:** 草稿
**作者:** PromptX Team
**创建日期:** 2023-06-20
**最后更新:** 2023-06-20

### 目的与范围

DPML旨在为提示词工程提供一种标准化的表达方式，解决以下关键问题：
- 提供清晰的语义结构，区分不同类型的提示内容（思考框架、执行流程等）
- 保持自然语言提示词的灵活性和表现力
- 支持提示词的组织、复用和模块化
- 便于机器解析和处理，同时保持人类可读性

DPML适用于所有需要结构化表达提示词的场景，包括但不限于AI助手开发、复杂任务指令设计、自动化工作流程等。

### 相关协议

- **XML**: DPML的基本标签结构借鉴了XML
- **Markdown**: DPML的内容部分采用Markdown格式

## 📝 语法规则

### 形式化定义

```ebnf
document    ::= element | (element document)
element     ::= '<' tag attributes '>' content '</' tag '>' | '<' tag attributes '/>'
tag         ::= [namespace ':'] name
namespace   ::= name
name        ::= [A-Za-z][A-Za-z0-9_-]*
attributes  ::= (attribute attributes) | ε
attribute   ::= name '="' value '"'
value       ::= [^"]*
content     ::= markdown_text | (element content) | ε
markdown_text ::= (* 任何有效的Markdown文本 *)
```

### 词法元素

| 元素 | 形式 | 描述 |
|------|------|------|
| 标签 | `<tag>...</tag>` | 定义语义单元，如`<thinking>`,`<executing>` |
| 自闭合标签 | `<tag />` | 无内容的标签，如`<import />` |
| 属性 | `property="value"` | 标签配置信息，如`type="analysis"` |
| 内容 | Markdown格式文本 | 标签内的实际提示词文本 |
| 注释 | `<!-- comment -->` | 协议注释，不作为提示词内容 |

### 组合规则

1. 标签可以嵌套，形成层次结构
2. 一个标签可以有多个属性，属性名在同一标签中不能重复
3. 标签必须正确闭合，要么是配对标签`<tag></tag>`，要么是自闭合标签`<tag/>`
4. 内容部分可以是纯Markdown文本，也可以包含其他标签
5. 根元素推荐使用`<prompt>`，但不强制要求

## 🧩 语义定义

### 核心概念

| 概念 | 定义 | 示例 |
|------|------|------|
| 提示单元 | 由标签定义的语义完整的提示组件 | `<thinking>分析问题...</thinking>` |
| 属性修饰 | 通过属性细化提示单元的行为特性 | `<executing priority="high">` |
| 内容表达 | 使用Markdown表达的实际提示文本 | `# 步骤\n1. 首先...` |
| 组合提示 | 多个提示单元组合形成完整提示 | `<thinking>...</thinking><executing>...</executing>` |

### 命名空间绑定

命名空间是DPML的核心语义机制，用于表达标签间的语义继承和协议复用：

1. **协议实现绑定**：通过命名空间前缀表示一个标签通过特定协议实现
   ```xml
   <store:execution>
     <!-- 表示store标签通过execution协议实现 -->
   </store:execution>
   ```
   
   在DPML中，`A:B`表示"A通过B实现"，读作"A implemented with B"。冒号左侧表示"做什么"(功能)，右侧表示"怎么做"(实现方式)。

2. **多协议组合**：一个标签可以通过不同命名空间的子标签组合多个协议
   ```xml
   <memory>
     <store:execution>存储操作...</store:execution>
     <recall:resource>检索操作...</recall:resource>
   </memory>
   ```

3. **协议继承关系**：命名空间前缀表示标签继承了指定协议的所有结构和规则
   ```xml
   <!-- memory协议中的store子标签通过execution协议实现 -->
   <memory>
     <store:execution>
       <process>...</process>
       <rule>...</rule>
     </store:execution>
   </memory>
   ```

### 解释规则

1. 标签名决定提示单元的主要语义类型（思考、执行等）
2. 属性提供额外的控制和元数据，影响提示单元的解释方式
3. 内容部分按Markdown语法解析，保留其格式特性（标题、列表、强调等）
4. 嵌套标签表示包含关系，内层提示单元属于外层提示单元的组成部分
5. 同级标签按顺序解释，表示提示流程的先后次序


## 📋 使用示例

### 有效示例

**1. 基本思考-执行流程**
```
<prompt>
  <thinking type="analysis">
    # 问题分析
    这是一个**数据处理**问题，需要考虑：
    1. 数据格式转换
    2. 性能优化
  </thinking>
  
  <executing>
    # 执行步骤
    1. 首先读取输入文件
    2. 应用转换算法
    3. 输出结果到目标位置
    
    确保全程**记录日志**以便调试。
  </executing>
</prompt>
```

**2. 带属性的复杂结构**
```
<prompt>
  <context type="background">
    # 项目背景
    客户需要一个数据可视化dashboard。
  </context>
  
  <thinking type="design" priority="high">
    # 设计思路
    采用模块化设计，分离数据层和视图层。
    
    <concept id="arch" domain="frontend">
      ## 架构概念
      使用React + D3.js组合
    </concept>
  </thinking>
  
  <executing steps="3">
    # 实现步骤
    1. 搭建基础框架
    2. 实现数据连接器
    3. 开发可视化组件
  </executing>
</prompt>
```

**3. 资源引用**
```
<prompt>
  <resource type="reference" src="docs/api-spec.md">
    参考API规范文档
    
    API端点定义在源码的25-35行
  </resource>
  
  <thinking>
    基于API规范进行设计...
  </thinking>
</prompt>
```

**4. 跨协议组合示例**
```
<memory>
  <!-- 存储操作通过execution协议实现 -->
  <store:execution>
    <content>用户操作系统：MacOS 13.4</content>
    
    <process>
      # 存储流程
      ```mermaid
      flowchart TD
        A[接收内容] --> B[验证格式]
        B --> C[写入存储]
      ```
    </process>
    
    <rule>
      1. 记忆写入必须原子化
      2. 冲突时保留高置信度版本
    </rule>
  </store:execution>
  
  <!-- 检索操作通过resource协议实现 -->
  <recall:resource>
    @memory://system/os_info?confidence=0.8
  </recall:resource>
</memory>
```

### 无效示例

**1. 标签未闭合**
```
<prompt>
  <thinking>
    思考内容...
  <!-- 缺少</thinking>标签 -->
  
  <executing>
    执行步骤...
  </executing>
</prompt>
```
错误原因：`<thinking>`标签未正确闭合

**2. 属性格式错误**
```
<prompt>
  <thinking type=analysis>
    思考内容...
  </thinking>
</prompt>
```
错误原因：属性值缺少双引号，应为`type="analysis"`

## 💡 最佳实践

1. **标签命名自释义**：选择具有自解释性的标签名称，使其本身就能清晰表达逻辑语义，即使没有计算机处理，人和AI也能轻松理解标签结构的逻辑上下文
2. **语义清晰度**：选择表意明确的标签名，让提示结构一目了然
3. **适度分层**：合理使用嵌套结构，避免过深的层次导致可读性下降
4. **内容聚焦**：每个标签内容应关注单一职责，避免功能混杂
5. **属性合理性**：只使用必要的属性，避免过度配置
6. **一致性**：在整个项目中保持一致的DPML结构风格
7. **命名空间明确性**：使用命名空间时，确保左侧表示"做什么"(功能)，右侧表示"怎么做"(实现)

## 📌 总结

DPML通过结合标签语言的结构化能力和Markdown的内容表现力，为提示词工程提供了一种既规范又灵活的表达方式。其核心优势在于清晰的语义结构、协议复用机制和人类可读性，特别适合构建复杂、模块化的AI交互提示系统。

