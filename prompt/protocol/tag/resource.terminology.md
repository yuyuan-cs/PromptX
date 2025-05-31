<terminologies>
  <terminology>
    <zh>资源提示单元</zh>
    <en>Resource Prompt Unit</en>
    <definition>
      由<resource>标签及其子标签（如location、params、registry）构成的、表达资源访问与引用的结构化提示词单元。常简称为"资源单元"，两者等同。
    </definition>
    <examples>
      <example>"所有外部数据访问都应以 #资源提示单元 组织。"</example>
      <example>"每个 #资源单元 都可以独立复用。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>资源单元</zh>
    <en>Resource Unit</en>
    <definition>
      "资源提示单元"的简称，含义完全等同。参见"资源提示单元"。
    </definition>
    <examples>
      <example>"请将你的引用方案拆分为多个 #资源单元。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>位置</zh>
    <en>Location</en>
    <definition>
      在本协议中，#位置 专指 <location> 标签及其结构单元，表示用于定义资源路径规则的提示词片段。
    </definition>
    <examples>
      <example>"请将路径规则写入 #位置 单元（即 <location> 标签）。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>参数</zh>
    <en>Params</en>
    <definition>
      在本协议中，#参数 专指 <params> 标签及其结构单元，表示用于定义资源支持的查询参数的提示词片段。
    </definition>
    <examples>
      <example>"所有可选参数请归入 #参数 单元（即 <params> 标签）。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>注册表</zh>
    <en>Registry</en>
    <definition>
      在本协议中，#注册表 专指 <registry> 标签及其结构单元，表示用于定义资源ID与实际路径映射关系的提示词片段。
    </definition>
    <examples>
      <example>"资源ID映射请写入 #注册表 单元（即 <registry> 标签）。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>资源协议</zh>
    <en>Resource Protocol</en>
    <definition>
      在本协议中，#资源协议 指 file、http、memory 等协议名部分，用于标识资源类型和访问方式。
    </definition>
    <examples>
      <example>"#资源协议 支持 file、http、memory 等多种类型。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>资源引用</zh>
    <en>Resource Reference</en>
    <definition>
      在本协议中，#资源引用 指 @file://path、@memory://id 等资源的引用表达式。
    </definition>
    <examples>
      <example>"请用 #资源引用 方式标注外部依赖。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>加载语义</zh>
    <en>Loading Semantics</en>
    <definition>
      在本协议中，#加载语义 指 @、@!、@? 前缀，决定资源的加载策略。
    </definition>
    <examples>
      <example>"#加载语义 决定资源是立即加载还是懒加载。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>加载</zh>
    <en>Load</en>
    <definition>
      在本协议中，#加载 指资源的实际获取、读取或载入过程。
    </definition>
    <examples>
      <example>"#加载 过程由 AI 主动发起。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>懒加载</zh>
    <en>Lazy Load</en>
    <definition>
      在本协议中，#懒加载 指资源仅在实际需要时才加载，通常与 @? 前缀相关。
    </definition>
    <examples>
      <example>"大文件建议采用 #懒加载 策略。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>热加载</zh>
    <en>Eager Load</en>
    <definition>
      在本协议中，#热加载（即立即加载）指资源在被引用时立即加载，通常与 @! 前缀相关。
    </definition>
    <examples>
      <example>"关键依赖应采用 #热加载 策略。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>定位</zh>
    <en>Locate</en>
    <definition>
      在本协议中，#定位 指通过协议和路径规则确定资源实际位置的过程。
    </definition>
    <examples>
      <example>"#定位 过程依赖 #位置 单元的定义。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>解析</zh>
    <en>Parse</en>
    <definition>
      在本协议中，#解析 指对资源引用表达式、路径、参数等进行语法和语义分析的过程。
    </definition>
    <examples>
      <example>"#解析 资源引用时需处理嵌套结构。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>嵌套引用</zh>
    <en>Nested Reference</en>
    <definition>
      在本协议中，#嵌套引用 指资源引用中包含另一个资源引用的结构，如 @outer:@inner://path。
    </definition>
    <examples>
      <example>"复杂场景可用 #嵌套引用 实现多层资源处理。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>路径通配符</zh>
    <en>Path Wildcard</en>
    <definition>
      在本协议中，#路径通配符 指 *、**、*.ext 等通配符用法，用于灵活匹配资源路径。
    </definition>
    <examples>
      <example>"#路径通配符 支持批量引用资源。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>查询参数</zh>
    <en>Query Parameter</en>
    <definition>
      在本协议中，#查询参数 指 ?param=value 结构，用于为资源引用提供额外指令。
    </definition>
    <examples>
      <example>"#查询参数 可用于指定加载范围。"</example>
    </examples>
  </terminology>
  <terminology>
    <zh>资源模式</zh>
    <en>Resource Mode</en>
    <definition>
      在本协议中，#资源模式 指不同类型的资源访问与引用方式，如 #位置、#参数、#注册表 等，分别由 <location>、<params>、<registry> 标签实现。
    </definition>
    <examples>
      <example>"支持多种 #资源模式 灵活访问外部数据。"</example>
    </examples>
  </terminology>
</terminologies> 