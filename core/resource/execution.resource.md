

<resource protocol="execution">
  <location>
    执行模式资源位置使用以下格式:
    
    ```ebnf
    location ::= execution://{execution_id}
    execution_id ::= [a-zA-Z][a-zA-Z0-9_-]*
    ```
  </location>
  
  <registry>
    <!-- 执行模式ID到文件路径的映射表 -->
    | 执行ID | 文件路径 |
    |--------|---------|
    | deal-at-reference | @file://PromptX/core/execution/deal-at-reference.execution.md |
    | prompt-developer | @file://PromptX/domain/prompt/execution/prompt-developer.execution.md |
    | memory-trigger | @file://PromptX/core/execution/memory-trigger.execution.md |
    | deal-memory | @file://PromptX/core/execution/deal-memory.execution.md |
  </registry>
</resource> 