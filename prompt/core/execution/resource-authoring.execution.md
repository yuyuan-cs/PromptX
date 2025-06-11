<execution>
  <constraint>
    ## 客观技术限制
    - **DPML语法约束**：必须遵循EBNF定义的resource语法结构
    - **XML格式要求**：标签必须正确闭合，属性值必须用双引号包围
    - **protocol属性强制**：resource标签必须包含protocol属性指定协议名
    - **文件编码**：必须使用UTF-8编码
    - **代码实现约束**：必须与ResourceManager、ResourceProtocol基类兼容
    - **注册表集成**：必须与resource.registry.json统一注册表集成
    - **查询参数限制**：查询参数必须符合URL标准格式
  </constraint>

  <rule>
    ## 强制性编写规则
    - **纯XML结构**：resource文件必须从`<resource>`标签开始，不得包含任何XML结构外的内容
    - **根标签强制**：文件必须使用`<resource protocol="协议名">`作为根标签
    - **三组件完整**：必须包含location、params、registry三个子标签
    - **组件顺序固定**：子标签必须按location → params → registry顺序排列
    - **protocol属性必需**：根标签必须包含protocol属性且值唯一
    - **文件纯净性**：除了`<resource>`标签结构外，不得包含任何其他内容
    - **EBNF规范性**：location标签内容必须使用EBNF语法定义路径格式
  </rule>

  <guideline>
    ## 编写指导原则
    - **协议名称清晰**：protocol属性值应简洁明了，符合kebab-case命名规范
    - **路径格式标准化**：使用EBNF语法精确定义资源路径结构
    - **参数文档完整**：详细说明所有支持的查询参数及其类型和用途
    - **注册表合理性**：注册表映射应体现抽象性和实用性的平衡
    - **兼容性考虑**：确保与PromptX资源管理系统的无缝集成
    - **示例丰富性**：提供足够的使用示例帮助理解协议用法
  </guideline>

  <process>
    ## 编写执行流程
    
    ### Phase 1: 协议概念设计
    1. **确定协议用途**：明确这个资源协议要解决什么资源访问问题
    2. **分析资源特征**：识别目标资源的组织方式、访问模式和参数需求
    3. **设计协议名称**：选择简洁清晰的协议标识符
    4. **评估系统集成**：确认与PromptX现有协议的兼容性和差异性

    ### Phase 2: 路径格式设计（location组件）
    1. **路径结构分析**：
       - 确定资源的层次结构和定位方式
       - 分析是否需要支持参数化路径
       - 设计路径的语义表达

    2. **EBNF语法定义**：
       ```ebnf
       location ::= protocol_name '://' path_structure
       path_structure ::= segment {'/' segment}
       segment ::= literal | parameter
       parameter ::= '{' parameter_name '}'
       ```

    3. **路径规范示例**：
       - 简单路径：`protocol://resource_id`
       - 参数化路径：`protocol://{category}/{id}`
       - 复杂路径：`protocol://{domain}/{namespace}/{resource}`

    ### Phase 3: 查询参数设计（params组件）
    1. **参数分类规划**：
       - **格式控制参数**：如format、encoding等
       - **行为控制参数**：如cache、timeout等
       - **过滤参数**：如line、type等
       - **特定功能参数**：协议专有的参数

    2. **参数文档格式**：
       ```markdown
       | 参数名 | 类型 | 描述 | 默认值 | 示例 |
       |-------|------|------|--------|------|
       | format | string | 输出格式 | text | json, xml |
       | cache | boolean | 是否缓存 | true | true, false |
       ```

    3. **参数验证考虑**：
       - 参数类型验证
       - 参数值范围限制
       - 参数组合逻辑

    ### Phase 4: 注册表设计（registry组件）
    1. **注册表策略选择**：
       - **有注册表协议**：需要ID到路径的映射（如thought, execution）
       - **无注册表协议**：直接使用路径（如file, http）

    2. **映射关系设计**（适用于有注册表协议）：
       ```markdown
       | 资源ID | 实际路径 | 描述 |
       |--------|----------|------|
       | resource-id | @package://path/to/file.md | 资源描述 |
       ```

    3. **路径引用规范**：
       - 支持@package://前缀引用包资源
       - 支持@project://前缀引用项目资源
       - 支持@file://前缀引用文件系统资源
       - 支持嵌套协议引用

    ### Phase 5: DPML结构实现
    
    **关键要求：文件必须从`<resource>`标签直接开始**
    
    **有注册表协议示例：**
    ```xml
    <resource protocol="custom-protocol">
      <location>
        ```ebnf
        location ::= custom-protocol://{resource_id}
        resource_id ::= [a-zA-Z][a-zA-Z0-9_-]*
        ```
      </location>
      
      <params>
        | 参数名 | 类型 | 描述 | 默认值 |
        |-------|------|------|--------|
        | format | string | 输出格式（text\|json\|xml） | text |
        | cache | boolean | 是否缓存结果 | true |
        | encoding | string | 文件编码 | utf8 |
      </params>
      
      <registry>
        | 资源ID | 文件路径 |
        |--------|----------|
        | example-resource | @package://path/to/example.md |
        | another-resource | @project://config/another.md |
      </registry>
    </resource>
    ```
    
    **无注册表协议示例：**
    ```xml
    <resource protocol="direct-access">
      <location>
        ```ebnf
        location ::= direct-access://{path}
        path ::= absolute_path | relative_path
        absolute_path ::= '/' path_segment {'/' path_segment}
        relative_path ::= path_segment {'/' path_segment}
        path_segment ::= [^/]+
        ```
      </location>
      
      <params>
        | 参数名 | 类型 | 描述 | 默认值 |
        |-------|------|------|--------|
        | encoding | string | 文件编码 | utf8 |
        | line | string | 行范围（如"1-10"） | - |
      </params>
      
      <registry>
        <!-- 此协议不使用注册表，直接通过路径访问资源 -->
      </registry>
    </resource>
    ```

    ### Phase 6: 系统集成验证
    1. **注册表集成**：确保协议定义与resource.registry.json格式兼容
    2. **代码实现检查**：验证是否需要创建对应的Protocol类文件
    3. **ResourceManager集成**：确认协议能被ResourceManager正确加载
    4. **加载语义支持**：验证@、@!、@?前缀的正确处理
    5. **查询参数解析**：确保参数能被正确解析和应用

    ### Phase 7: 质量检查和测试
    1. **语法验证**：确保DPML resource语法正确性
    2. **EBNF验证**：验证location部分的EBNF语法正确性
    3. **参数完整性**：确认所有参数都有清晰的类型和描述
    4. **注册表一致性**：验证注册表映射的逻辑正确性
    5. **纯净性检查**：确认文件从`<resource>`标签开始，无多余内容
  </process>

  <criteria>
    ## 质量评价标准
    
    ### 格式合规性
    - ✅ 文件从`<resource protocol="协议名">`标签直接开始
    - ✅ 使用正确的DPML resource标签结构
    - ✅ 三个子标签按location → params → registry顺序排列
    - ✅ XML语法正确，标签正确闭合
    - ✅ protocol属性值符合命名规范

    ### 路径格式规范性
    - ✅ location部分使用正确的EBNF语法
    - ✅ 路径格式清晰明确，无歧义
    - ✅ 参数化路径使用`{parameter}`格式
    - ✅ 路径结构与协议用途匹配
    - ✅ 支持协议的典型使用场景

    ### 参数文档完整性
    - ✅ 所有参数都有清晰的类型定义
    - ✅ 参数描述详细且准确
    - ✅ 提供了合理的默认值
    - ✅ 参数示例有助于理解
    - ✅ 参数组合逻辑合理

    ### 注册表设计合理性
    - ✅ 注册表策略与协议特性匹配
    - ✅ 映射关系清晰且实用
    - ✅ 路径引用符合PromptX规范
    - ✅ 抽象性和具体性平衡适当
    - ✅ 支持嵌套协议引用

    ### 系统集成性
    - ✅ 与ResourceManager兼容
    - ✅ 与resource.registry.json格式一致
    - ✅ 支持标准加载语义（@、@!、@?）
    - ✅ 查询参数能被正确解析
    - ✅ 与现有协议生态协调

    ### 实用价值
    - ✅ 解决了实际的资源访问需求
    - ✅ 路径格式简洁易用
    - ✅ 参数设计灵活且必要
    - ✅ 注册表提供了实际价值
    - ✅ 整体设计具有可扩展性

    ### 文件纯净性
    - ✅ 文件结构完全符合DPML resource规范
    - ✅ 无任何XML结构外的多余内容
    - ✅ 体现resource协议定义的标准格式
    - ✅ 三组件内容充实且相互配合
  </criteria>
</execution> 