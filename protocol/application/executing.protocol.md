# executing 应用协议

> **TL;DR:** executing标签用于定义结构化的执行流程，帮助AI系统按步骤完成任务，支持线性、条件和循环等流程控制。

## 🔍 基本信息

**标签名:** `<executing>`
**版本:** 1.0.0
**类别:** 执行
**状态:** 草稿
**创建日期:** 2023-06-21

### 目的与功能

executing标签定义了AI系统执行任务的流程和步骤，它的主要功能是：
- 提供线性、有序的执行步骤
- 支持条件分支和循环结构
- 明确每个步骤的输入、处理和输出
- 帮助AI系统进行精确、可靠的任务执行
- 提供执行状态追踪和错误处理机制

## 📝 语法定义

```ebnf
(* EBNF形式化定义 *)
executing_element ::= '<executing' attributes? '>' content '</executing>'
attributes ::= (' ' attribute)+ | ''
attribute ::= name '="' value '"'
name ::= [a-zA-Z][a-zA-Z0-9_-]*
value ::= [^"]*
content ::= markdown_content
markdown_content ::= (* 任何有效的Markdown文本，可包含特定语法元素 *)
```

## 🧩 语义说明

executing标签表示一个完整的执行流程或任务处理过程。标签内容采用Markdown格式，通常包含有序步骤、条件判断、循环结构以及状态跟踪等元素，用于表达严谨的执行逻辑。executing标签特别适合表达算法实现、工作流程和任务执行计划，为AI提供明确的操作指导。

## 💡 最佳实践

以下是使用executing标签的一些建议做法，这些并非强制要求，仅作为参考：

### 推荐属性

可以考虑使用以下属性来增强executing标签的语义：

- **mode**: 指定执行模式，如`mode="sequential"`, `mode="conditional"`, `mode="iterative"`, `mode="parallel"`
- **context**: 指定执行上下文，如`context="local"`, `context="remote"`, `context="system"`, `context="user"`
- **priority**: 指定执行优先级，如`priority="high"`, `priority="normal"`, `priority="low"`
- **timeout**: 指定执行超时时间，如`timeout="30s"`, `timeout="5m"`

### 内容组织

推荐在executing标签内使用以下结构组织内容：

1. 以一级标题(`#`)定义执行任务的名称和目标
2. 使用二级标题(`##`)标识主要执行阶段
3. 使用有序列表表示执行步骤的精确顺序
4. 使用代码块表示具体的命令或代码片段
5. 使用表格记录输入参数和输出结果
6. 使用引用块表示状态检查点和异常处理逻辑

### 可视化表达

不同类型的执行流程适合使用不同的Mermaid图表类型：

- **流程图(flowchart)**: 适合表示执行步骤和条件分支
  ```mermaid
  flowchart TD
    A[开始] --> B{条件判断}
    B -->|条件成立| C[执行步骤1]
    B -->|条件不成立| D[执行步骤2]
    C --> E[下一步]
    D --> E
    E --> F[结束]
  ```

- **时序图(sequenceDiagram)**: 适合表示组件间的交互过程
  ```mermaid
  sequenceDiagram
    参与者A->>参与者B: 请求数据
    参与者B->>参与者C: 转发请求
    参与者C-->>参与者B: 返回数据
    参与者B-->>参与者A: 处理后返回
  ```

- **状态图(stateDiagram)**: 适合表示状态转换和执行阶段
  ```mermaid
  stateDiagram-v2
    [*] --> 准备
    准备 --> 执行中: 开始执行
    执行中 --> 完成: 成功
    执行中 --> 失败: 出错
    失败 --> 重试: 可恢复
    重试 --> 执行中
    失败 --> [*]: 不可恢复
    完成 --> [*]
  ```

## 📋 使用示例

<executing mode="sequential" context="system">

  # 文件批量处理流程
  
  ## 初始化阶段
  1. 检查工作目录权限
  2. 验证输入文件格式
  3. 准备输出目录
  
  ## 处理阶段
  ```bash
  for file in $(ls *.txt); do
    echo "处理文件: $file"
    process_file "$file" >> log.txt
  done
  ```
  
  ## 验证阶段
  | 检查项 | 预期结果 | 异常处理 |
  |-------|---------|---------|
  | 输出文件数量 | 等于输入文件数量 | 记录差异并重试 |
  | 处理日志 | 无错误记录 | 分析错误类型并修复 |
  
  ## 完成阶段
  > 状态检查点：所有文件已处理并验证通过
  > 执行清理临时文件并生成处理报告
</executing> 