<resource protocol="thought">
  <location>
    思维模式资源位置使用以下格式:
    
    ```ebnf
    location ::= thought://{thought_id}
    thought_id ::= [a-zA-Z][a-zA-Z0-9_-]*
    ```
  </location>
  
  <registry>
    <!-- 思维模式ID到文件路径的映射表 -->
    | 思维ID | 文件路径 |
    |--------|---------|
    | prompt-developer | @file://PromptX/domain/prompt/thought/prompt-developer.thought.md |
    | product-owner | @file://PromptX/domain/scrum/thought/product-owner.thought.md |
  </registry>
</resource> 