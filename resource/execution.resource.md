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
    | memory-tool-usage | @file://PromptX/core/execution/memory-tool-usage.execution.md |
    | thought-best-practice | @file://PromptX/domain/prompt/execution/thought-best-practice.execution.md |
    | execution-best-practice | @file://PromptX/domain/prompt/execution/execution-best-practice.execution.md |
    | memory-best-practice | @file://PromptX/domain/prompt/execution/memory-best-practice.execution.md |
    | role-best-practice | @file://PromptX/domain/prompt/execution/role-best-practice.execution.md |
    | resource-best-practice | @file://PromptX/domain/prompt/execution/resource-best-practice.execution.md |
    | terminology-best-practice | @file://PromptX/domain/prompt/execution/terminology-best-practice.execution.md |
    | product-owner | @file://PromptX/domain/scrum/execution/product-owner.execution.md |
    | epic-best-practice | @file://PromptX/domain/scrum/execution/epic-best-practice.execution.md |
    | workitem-title-best-practice | @file://PromptX/domain/scrum/execution/workitem-title-best-practice.execution.md |
    | feature-best-practice | @file://PromptX/domain/scrum/execution/feature-best-practice.execution.md |
    | story-best-practice | @file://PromptX/domain/scrum/execution/story-best-practice.execution.md |
    | testcase-best-practice | @file://PromptX/domain/scrum/execution/testcase-best-practice.execution.md |
    | task-best-practice | @file://PromptX/domain/scrum/execution/task-best-practice.execution.md |
    | sprint-best-practice | @file://PromptX/domain/scrum/execution/sprint-best-practice.execution.md |
    | milestone-best-practice | @file://PromptX/domain/scrum/execution/milestone-best-practice.execution.md |
    | scrum-best-practice | @file://PromptX/domain/scrum/execution/scrum-best-practice.execution.md |
  </registry>
</resource> 