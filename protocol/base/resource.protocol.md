# resource 应用协议

> **TL;DR:** resource标签用于定义资源协议，提供统一的资源引用方式，支持通过`@协议名://路径`形式访问各类资源。

## 🔍 基本信息

**标签名:** `<resource>`
**版本:** 1.0.0
**类别:** 资源
**状态:** 草稿
**创建日期:** 2023-06-30

### 目的与功能

resource标签用于定义特定类型的资源协议，使开发者能够以标准化的方式描述如何引用和处理各种资源。通过这个标签，可以明确资源的引用语法、路径规则和查询参数，确保资源引用在不同环境中的一致性和可靠性。此标签是PromptX中资源引用协议（RP）在应用层面的具体实现方式。

主要功能包括：
- 定义资源协议的标识和引用方式
- 规范资源路径的语法结构和解析规则
- 指定资源支持的查询参数和格式
- 提供资源使用的示例说明

### 默认支持的通用协议

PromptX默认支持以下通用且已有共识的协议，这些协议符合`@协议名://路径`格式，遵循其业界标准语法和规则，无需在resource标签中重新定义：

| 协议名 | 描述 | 示例 |
|-------|------|------|
| file  | 文件系统资源 | `@file://path/to/file.txt` |
| http/https | HTTP/HTTPS网络资源 | `@https://example.com/api/data` |
| ftp/sftp | 文件传输协议 | `@ftp://user:pass@host/path` |
| ssh | 安全Shell协议 | `@ssh://user@host/path` |

这些通用协议的路径格式和查询参数遵循它们的标准规范。对于特定领域或自定义的协议，才需要使用resource标签进行详细定义。

## 📝 语法定义

```ebnf
(* EBNF形式化定义 *)
resource_element ::= '<resource' ' protocol="' protocol_name '"' '>' content '</resource>'
protocol_name ::= [a-zA-Z][a-zA-Z0-9_-]*
content ::= (markdown_content | location_element | params_element)+

location_element ::= '<location>' markdown_content '</location>'
params_element ::= '<params>' markdown_content '</params>'

markdown_content ::= (* 任何有效的Markdown文本，包括代码块、表格等 *)
```

## 🧩 语义说明

resource标签定义了一个资源协议，指定了如何使用`@协议名://路径`的形式引用和访问特定类型的资源。

标签包含的主要子元素及其语义：

- **protocol属性**：定义资源协议的名称，如`file`、`http`、`context`等
- **location子标签**：定义资源路径的格式和规则，指定如何定位资源
- **params子标签**：定义资源支持的查询参数，指定如何处理资源的特定部分或格式

### 资源引用语法

资源引用使用`@`符号作为统一入口，遵循以下核心语法规则：

```ebnf
resource_reference ::= '@' protocol_name ':' resource_location [query_params]
resource_location ::= uri | nested_reference
uri ::= protocol_name '://' path
nested_reference ::= ['@'] protocol_name ':' resource_location
path ::= path_segment {'/' path_segment}
query_params ::= '?' param_name '=' param_value {'&' param_name '=' param_value}
```

#### 基础资源引用

基础资源引用使用单一协议：
```
@protocol://path
```

例如：
- `@file://document.md` - 引用文件系统中的文档
- `@http://example.com/api/data.json` - 引用网络资源
- `@memory://user_preferences` - 引用内存中的数据

#### 嵌套资源引用

嵌套资源引用允许一个协议处理另一个协议的输出：

**完整形式**（内部使用@符号）：
```
@outer:@inner://path
```

**简写形式**（内部省略@符号）：
```
@outer:inner://path
```

例如：
- `@thinking:@file://method.md` - 对文件内容应用thinking协议处理
- `@execution:file://workflow.md` - 对文件内容应用execution协议处理
- `@outer:middle:inner://resource` - 多层嵌套（从内向外处理）

#### 路径通配符

路径支持以下通配符模式：
- `*` - 匹配单层中的任意文件或目录，如`@file://docs/*.md`
- `**` - 匹配多层目录和文件，如`@file://src/**/*.js`
- `*.ext` - 匹配特定扩展名的文件，如`@file://docs/*.txt`
- `*.{ext1,ext2}` - 匹配多种扩展名，如`@file://src/*.{js,ts}`

#### 查询参数

查询参数提供额外的资源处理指令：
```
@protocol://path?param1=value1&param2=value2
```

例如：
- `@file://document.md?line=5-10` - 只获取文件的第5-10行
- `@http://api.example.com/data?format=json&cache=false` - 指定返回格式并禁用缓存

### 解析规则

1. 资源引用解析从左至右进行，先识别协议名称，再解析资源位置和查询参数
2. 嵌套引用从内向外解析，内层资源引用的结果作为外层引用的输入
3. 查询参数应用于资源加载后的处理阶段，不影响资源的基本定位
4. 相对路径解析基于当前上下文的工作目录或基础路径

## 💡 最佳实践

以下是使用resource标签的一些推荐做法：

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