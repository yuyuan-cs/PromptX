# DPML记忆模式提示词框架

> **TL;DR:** DPML记忆模式提示词框架定义了AI系统的记忆管理提示词模板，支持三种记忆类型(陈述性、程序性、情景记忆)的提示词构建，并提供完整的记忆生命周期(评估、存储、调用)管理提示词。

### 目的与功能

DPML记忆模式提示词框架为AI系统提供完整的记忆能力提示词模板，主要功能包括：
- 定义不同类型记忆的提示词结构和语义
- 提供记忆评估、存储和检索的标准化提示词机制
- 实现跨会话的信息持久化提示词模板
- 支持复杂的记忆关联和检索模式的提示词构建

## 🔍 基本信息

**框架名称:** `<memory>` (DPML记忆模式提示词框架)
**版本:** 1.0.0
**类别:** 记忆类提示词
**状态:** 草稿

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
recall_element ::= '<recall:resource>' resource_reference '</recall:resource>'

thought_content ::= (* 符合thought协议的内容 *)
execution_element ::= (* 符合execution协议的元素 *)
resource_reference ::= (* 符合resource协议的引用 *)

text ::= (* 任何文本内容 *)
```

## 🧩 语义说明

memory标签表示AI系统的记忆管理单元，定义了记忆的结构和操作方式。它使用三层机制管理记忆的完整生命周期：

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

3. **`<recall:resource>`**：从记忆系统检索信息
   - 通过resource协议实现检索操作
   - 使用@memory://路径引用存储的记忆
   - 支持过滤、分页和条件检索

