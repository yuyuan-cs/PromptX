<terminologies>
  <terminology>
    <zh>DPML</zh>
    <en>Deepractice Prompt Markup Language</en>
    <definition>
      一种专为提示词工程设计的标记语言，结合XML结构和Markdown内容，为各类提示词提供标准化的表达框架，确保结构清晰和语义准确。
    </definition>
    <examples>
      <example>DPML协议支持AI助手、自动化工作流等场景的提示词结构化表达。</example>
    </examples>
  </terminology>
  <terminology>
    <zh>提示词</zh>
    <en>Prompt</en>
    <definition>
      用于引导AI系统行为或输出的自然语言片段，DPML中以结构化方式组织和表达。
    </definition>
    <examples>
      <example>"请分析以下数据..." 是一个典型的提示词。</example>
    </examples>
  </terminology>
  <terminology>
    <zh>标签</zh>
    <en>Tag</en>
    <definition>
      用于界定提示词结构和语义边界的标记，采用XML风格，如&lt;thinking&gt;、&lt;executing&gt;等。
    </definition>
    <examples>
      <example>&lt;thinking&gt;分析问题...&lt;/thinking&gt;</example>
    </examples>
  </terminology>
  <terminology>
    <zh>属性</zh>
    <en>Attribute</en>
    <definition>
      附加在标签上的键值对，用于细化提示单元的行为或元数据，如type="analysis"。</definition>
    <examples>
      <example>&lt;executing priority="high"&gt;...</example>
    </examples>
  </terminology>
  <terminology>
    <zh>内容</zh>
    <en>Content</en>
    <definition>
      标签内部的实际提示词文本，通常采用Markdown格式表达。</definition>
    <examples>
      <example># 步骤\n1. 首先...</example>
    </examples>
  </terminology>
  <terminology>
    <zh>提示单元</zh>
    <en>Prompt Unit</en>
    <definition>
      由标签定义的语义完整的提示组件，是DPML结构的基本构成块。</definition>
    <examples>
      <example>&lt;thinking&gt;分析问题...&lt;/thinking&gt;</example>
    </examples>
  </terminology>
  <terminology>
    <zh>属性修饰</zh>
    <en>Attribute Modifier</en>
    <definition>
      通过属性对提示单元进行行为或表现上的细化，如优先级、类型等。</definition>
    <examples>
      <example>&lt;executing priority="high"&gt;...</example>
    </examples>
  </terminology>
  <terminology>
    <zh>组合提示</zh>
    <en>Composite Prompt</en>
    <definition>
      由多个提示单元组合形成的完整提示结构，体现DPML的模块化和复用性。</definition>
    <examples>
      <example>&lt;thinking&gt;...&lt;/thinking&gt;&lt;executing&gt;...&lt;/executing&gt;</example>
    </examples>
  </terminology>
  <terminology>
    <zh>协议实现绑定</zh>
    <en>Protocol Implementation Binding</en>
    <definition>
      通过冒号语法（A:B）表达标签间的实现关系，A为功能，B为实现方式。</definition>
    <examples>
      <example>&lt;store:execution&gt;...&lt;/store:execution&gt;</example>
    </examples>
  </terminology>
  <terminology>
    <zh>命名空间</zh>
    <en>Namespace</en>
    <definition>
      用于区分不同协议或功能域的标签前缀，如store:execution中的store。</definition>
    <examples>
      <example>&lt;store:execution&gt;...&lt;/store:execution&gt;</example>
    </examples>
  </terminology>
  <terminology>
    <zh>根元素</zh>
    <en>Root Element</en>
    <definition>
      DPML文档的顶层标签，推荐使用&lt;prompt&gt;，但不强制。</definition>
    <examples>
      <example>&lt;prompt&gt;...&lt;/prompt&gt;</example>
    </examples>
  </terminology>
  <terminology>
    <zh>自闭合标签</zh>
    <en>Self-closing Tag</en>
    <definition>
      无内容的标签，采用/&gt;结尾，如&lt;import /&gt;。</definition>
    <examples>
      <example>&lt;import /&gt;</example>
    </examples>
  </terminology>
  <terminology>
    <zh>嵌套标签</zh>
    <en>Nested Tag</en>
    <definition>
      标签内部包含其他标签，形成层次结构。</definition>
    <examples>
      <example>&lt;thinking&gt;&lt;plan&gt;...&lt;/plan&gt;&lt;/thinking&gt;</example>
    </examples>
  </terminology>
  <terminology>
    <zh>属性约束</zh>
    <en>Attribute Constraint</en>
    <definition>
      对属性的使用范围、类型和值的规范，确保一致性和合规性。</definition>
    <examples>
      <example>属性值必须用双引号包裹，如type="analysis"。</example>
    </examples>
  </terminology>
  <terminology>
    <zh>语义透明性</zh>
    <en>Semantic Transparency</en>
    <definition>
      标签和属性名称具有自解释性，使结构意图和功能直观可理解。</definition>
    <examples>
      <example>&lt;executing&gt;表示执行单元，&lt;plan&gt;表示计划内容。</example>
    </examples>
  </terminology>
  <terminology>
    <zh>释义即实现</zh>
    <en>Definition-as-Implementation</en>
    <definition>
      对提示词的语义释义本身即构成实现，无需额外转换层。</definition>
    <examples>
      <example>AI理解"# 步骤\n1. 首先..."后直接执行，无需再转译。</example>
    </examples>
  </terminology>
  <terminology>
    <zh>组合复用</zh>
    <en>Composable Reuse</en>
    <definition>
      通过协议组合和结构嵌套，实现提示词的模块化和复用。</definition>
    <examples>
      <example>&lt;memory&gt;&lt;store:execution&gt;...&lt;/store:execution&gt;&lt;/memory&gt;</example>
    </examples>
  </terminology>
  <terminology>
    <zh>一致性理解</zh>
    <en>Consistent Understanding</en>
    <definition>
      同一DPML结构在不同AI系统中应产生一致的理解和行为。</definition>
    <examples>
      <example>不同平台解析同一DPML提示词，行为一致。</example>
    </examples>
  </terminology>
</terminologies>
