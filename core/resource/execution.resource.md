

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
  </registry>
</resource> 