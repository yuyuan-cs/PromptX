<resource protocol="memory">
  <location>
    记忆模式资源位置使用以下格式:
    
    ```ebnf
    location ::= memory://{memory_id}
    memory_id ::= [a-zA-Z][a-zA-Z0-9_-]*
    ```
  </location>
  
  <registry>
    <!-- 记忆模式ID到文件路径的映射表 -->
    | 记忆ID | 文件路径 |
    |--------|---------|
    | declarative | @file://PromptX/core/memory/declarative-memory.memory.md |
  </registry>
</resource> 