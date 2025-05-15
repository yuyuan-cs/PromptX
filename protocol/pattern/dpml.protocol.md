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
tag         ::= name
attributes  ::= (attribute attributes) | ε
attribute   ::= name '="' value '"'
name        ::= [A-Za-z][A-Za-z0-9_-]*
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

### 解释规则

1. 标签名决定提示单元的主要语义类型（思考、执行等）
2. 属性提供额外的控制和元数据，影响提示单元的解释方式
3. 内容部分按Markdown语法解析，保留其格式特性（标题、列表、强调等）
4. 嵌套标签表示包含关系，内层提示单元属于外层提示单元的组成部分
5. 同级标签按顺序解释，表示提示流程的先后次序

## ✅ 约束与验证

### 必要约束

1. 标签名必须符合命名规则：以字母开头，可包含字母、数字、下划线和连字符
2. 属性值必须使用双引号包围
3. 标签必须正确闭合，开闭标签名称必须一致
4. 标签嵌套必须正确，不允许交叉嵌套
5. Markdown内容必须是有效的Markdown语法

### 验证规则

DPML文档可通过以下步骤验证：
1. 检查XML结构的有效性（标签配对、属性格式等）
2. 验证标签名是否属于预定义集合或符合扩展规则
3. 检查必需属性是否存在且值有效
4. 验证Markdown内容的格式有效性
5. 检查引用资源的可访问性

### 错误处理

遇到语法错误时的处理优先级：
1. 标签结构错误（未闭合、交叉嵌套）：终止解析，报告错误位置
2. 未知标签或属性：发出警告但继续解析，将其视为自定义扩展
3. Markdown语法错误：尽可能宽容处理，按文本呈现
4. 资源引用错误：报告无法访问的资源，但继续处理其他内容

## 🔄 扩展机制

### 扩展点

DPML提供以下扩展点：
1. 自定义标签：通过命名空间机制创建新的语义标签
2. 自定义属性：为现有标签添加新的控制属性
3. 内容增强：在Markdown中嵌入特殊语法或命令
4. 外部引用：导入和复用外部DPML组件

### 扩展规则

1. 自定义标签应使用命名空间前缀：`<ns:tag>`
2. 自定义属性可直接添加，但建议使用命名空间：`ns:property="value"`
3. 内容增强应使用明确的语法标记，避免与Markdown冲突
4. 扩展必须向下兼容，标准解析器应能忽略无法理解的扩展而不中断处理

### 扩展示例

```xml
<!-- 命名空间定义 -->
<prompt xmlns:ai="https://promptx.ai/ns/ai">
  <!-- 自定义标签 -->
  <ai:model type="gpt4">
    <!-- 标准标签 -->
    <thinking>
      # 分析方法
      使用**系统思维**方法
    </thinking>
    
    <!-- 自定义属性 -->
    <executing ai:temperature="0.7">
      执行步骤...
    </executing>
  </ai:model>
</prompt>
```

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

1. **语义清晰度**：选择表意明确的标签名，让提示结构一目了然
2. **适度分层**：合理使用嵌套结构，避免过深的层次导致可读性下降
3. **内容聚焦**：每个标签内容应关注单一职责，避免功能混杂
4. **属性合理性**：只使用必要的属性，避免过度配置
5. **一致性**：在整个项目中保持一致的DPML结构风格

### 常见问题

**Q: DPML与纯Markdown相比有什么优势？**  
A: DPML提供了语义结构，使提示词的不同部分（思考、执行等）有明确区分，便于解析和处理，同时保留了Markdown的灵活性。

**Q: 如何在DPML中引用外部资源？**  
A: 可以通过标签属性引用外部资源，如`<resource src="path/to/file">`，或使用特定的资源引用语法（参见资源引用协议）。

**Q: DPML的解析器需要特殊实现吗？**  
A: DPML可以通过组合现有的XML解析器和Markdown解析器实现，先解析XML结构，再处理各标签内的Markdown内容。 