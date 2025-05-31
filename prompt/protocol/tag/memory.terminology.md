<terminologies>
  <terminology>
    <zh>记忆提示单元</zh>
    <en>Memory Prompt Unit</en>
    <definition>
      由<memory>标签及其子标签（如evaluate:thought、store:execution、recall:thought）构成的、表达记忆管理与操作的结构化提示词单元。常简称为"记忆单元"，两者等同。
    </definition>
    <examples>
      <example>"所有运行时信息管理都应以 #记忆提示单元 组织。"</example>
      <example>"每个 #记忆单元 都可以独立复用。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>记忆单元</zh>
    <en>Memory Unit</en>
    <definition>
      "记忆提示单元"的简称，含义完全等同。参见"记忆提示单元"。
    </definition>
    <examples>
      <example>"请将你的记忆操作拆分为多个 #记忆单元。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>评估</zh>
    <en>Evaluate</en>
    <definition>
      在本协议中，#评估 专指 <evaluate:thought> 标签及其结构单元，表示用于判断信息是否值得记忆的提示词片段。
    </definition>
    <examples>
      <example>"所有信息入库前需经过 #评估 单元（即 <evaluate:thought> 标签）。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>存储</zh>
    <en>Store</en>
    <definition>
      在本协议中，#存储 专指 <store:execution> 标签及其结构单元，表示用于将信息写入记忆系统的提示词片段。
    </definition>
    <examples>
      <example>"数据写入请归入 #存储 单元（即 <store:execution> 标签）。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>回忆</zh>
    <en>Recall</en>
    <definition>
      在本协议中，#回忆 专指 <recall:thought> 标签及其结构单元，表示用于从记忆系统检索信息的提示词片段。
    </definition>
    <examples>
      <example>"检索操作请写入 #回忆 单元（即 <recall:thought> 标签）。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>记忆操作</zh>
    <en>Memory Operation</en>
    <definition>
      在本协议中，#记忆操作 指 #评估-#存储-#回忆 的完整循环过程。
    </definition>
    <examples>
      <example>"#记忆操作 需遵循评估-存储-回忆的顺序。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>动态记忆</zh>
    <en>Dynamic Memory</en>
    <definition>
      在本协议中，#动态记忆 指运行时可变的记忆内容，与#先验知识库 区分。
    </definition>
    <examples>
      <example>"#动态记忆 反映AI当前会话的上下文。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>先验知识库</zh>
    <en>Prior Knowledge Base</en>
    <definition>
      在本协议中，#先验知识库 指角色固有的、初始化的知识体系，不属于#动态记忆 范畴。
    </definition>
    <examples>
      <example>"#先验知识库 由<role>标签管理。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>记忆循环</zh>
    <en>Memory Cycle</en>
    <definition>
      在本协议中，#记忆循环 指 #评估-#存储-#回忆 的循环模式。
    </definition>
    <examples>
      <example>"#记忆循环 有助于持续优化AI记忆。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>记忆模式</zh>
    <en>Memory Mode</en>
    <definition>
      在本协议中，#记忆模式 指不同的#评估、#存储、#回忆 实现方式。
    </definition>
    <examples>
      <example>"可根据场景切换不同 #记忆模式。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>工作记忆</zh>
    <en>Working Memory</en>
    <definition>
      在本协议中，#工作记忆 指AI在当前任务或会话中临时存储和处理的信息，具有短时性和高活跃度。
    </definition>
    <examples>
      <example>"#工作记忆 主要用于当前推理和决策。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>短期记忆</zh>
    <en>Short-term Memory</en>
    <definition>
      在本协议中，#短期记忆 指AI在较短时间内保留的信息，支持跨轮对话和短时上下文。
    </definition>
    <examples>
      <example>"#短期记忆 可用于多轮对话的上下文保持。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>长期记忆</zh>
    <en>Long-term Memory</en>
    <definition>
      在本协议中，#长期记忆 指AI可持久保存、跨会话复用的重要信息。
    </definition>
    <examples>
      <example>"用户偏好应存入 #长期记忆。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>陈述性记忆</zh>
    <en>Declarative Memory</en>
    <definition>
      在本协议中，#陈述性记忆 指可被明确表达和检索的事实性知识，如事件、概念等。
    </definition>
    <examples>
      <example>"知识库内容属于 #陈述性记忆。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>程序性记忆</zh>
    <en>Procedural Memory</en>
    <definition>
      在本协议中，#程序性记忆 指AI掌握的操作流程、技能和执行规则。
    </definition>
    <examples>
      <example>"常用操作流程应归入 #程序性记忆。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>情境性记忆</zh>
    <en>Contextual Memory</en>
    <definition>
      在本协议中，#情境性记忆 指与特定场景、环境或上下文相关的记忆内容。
    </definition>
    <examples>
      <example>"对话场景信息属于 #情境性记忆。"</example>
    </examples>
  </terminology>
</terminologies> 