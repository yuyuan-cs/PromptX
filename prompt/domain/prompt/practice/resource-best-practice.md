# DPML资源模式提示词框架最佳实践

> **TL;DR:** 本文档提供DPML资源模式提示词框架的最佳实践指南，包括资源路径设计、查询参数设计、引用建议和具体示例。

## 💡 最佳实践

### 资源路径设计

资源路径设计应遵循以下原则：
- 使用直观、符合惯例的路径格式
- 支持绝对路径和相对路径
- 适当使用通配符增强灵活性
- 路径分隔符应统一使用`/`

### 查询参数设计

查询参数设计应考虑以下因素：
- 参数名称应清晰表达其功能
- 参数值格式应明确定义
- 常见操作应有对应的参数支持（如范围指定、格式转换等）
- 参数组合应有明确的优先级规则

### 资源引用最佳实践

1. 使用最合适的协议名称表示资源类型，提高语义明确性
2. 嵌套引用时，如果清晰度很重要，使用完整形式（带内部@符号）
3. 如果简洁性更重要，则使用简写形式（省略内部@符号）
4. 保持资源路径的相对引用，以提高提示词的可移植性
5. 合理使用通配符，避免过于宽泛的匹配模式
6. 使用查询参数进行资源过滤，而不是在提示词中手动处理
7. 避免过深的嵌套引用，建议不超过3层，保持可读性

### 表达风格推荐

- **location**: 优先使用EBNF格式正式描述语法规则，辅以简洁示例
- **params**: 使用表格形式列出参数，清晰展示名称、类型、描述和示例

## 📋 使用示例

### 自定义协议示例

以下示例展示了如何定义自定义资源协议：

```xml
<resource protocol="memory">
  <location>
    # 路径规则 (EBNF)
    
    ```ebnf
    memory_path ::= [namespace '/'] memory_key
    namespace ::= (letter | digit | '_' | '-')+
    memory_key ::= (letter | digit | '_' | '-' | '.')+
    ```
    
    ## 示例
    - @memory://user_preferences
    - @memory://session/history
    - @memory://system/config
  </location>
  
  <params>
    # 查询参数
    
    | 参数名 | 类型 | 描述 | 示例 |
    |-------|------|------|------|
    | ttl | 数字 | 生存时间(秒) | ?ttl=3600 |
    | default | 字符串 | 默认值 | ?default=empty |
    | type | 字符串 | 值类型 | ?type=json |
  </params>
</resource>
```

```xml
<resource protocol="context">
  <location>
    # 路径规则 (EBNF)
    
    ```ebnf
    context_path ::= [scope '/'] path
    scope ::= (letter | digit | '_' | '-')+
    path ::= path_segment {'/' path_segment}
    path_segment ::= (letter | digit | '_' | '-' | '.')+
    ```
    
    ## 示例
    - @context://global/settings
    - @context://user/preferences
    - @context://session/state
  </location>
  
  <params>
    # 查询参数
    
    | 参数名 | 类型 | 描述 | 示例 |
    |-------|------|------|------|
    | mode | 字符串 | 上下文模式 | ?mode=read 或 ?mode=write |
    | scope | 字符串 | 访问范围 | ?scope=local 或 ?scope=global |
    | format | 字符串 | 返回格式 | ?format=json |
  </params>
</resource>
``` 