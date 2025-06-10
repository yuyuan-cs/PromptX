<execution>
  <constraint>
    ## 客观技术限制
    - **DPML语法约束**：必须遵循EBNF定义的role语法结构
    - **XML格式要求**：标签必须正确闭合，属性值必须用双引号包围
    - **三组件架构固化**：personality、principle、knowledge三组件的语义边界固定
    - **文件编码**：必须使用UTF-8编码
    - **引用协议约束**：@!引用必须指向实际存在的资源
    - **PromptX系统集成**：必须与promptx命令行工具和ResourceManager兼容
  </constraint>

  <rule>
    ## 强制性编写规则
    - **纯XML结构**：role文件必须从`<role>`标签开始，不得包含任何XML结构外的内容
    - **根标签强制**：文件必须使用`<role>`作为根标签包装全部内容
    - **三组件完整**：必须包含personality、principle、knowledge三个子标签
    - **组件顺序固定**：子标签必须按personality → principle → knowledge顺序排列
    - **文件纯净性**：除了`<role>`标签结构外，不得包含任何其他内容
    - **引用规范性**：使用@!引用时必须遵循resource协议语法
    - **镜像结构约束**：用户资源必须遵循`.promptx/resource/domain/`结构，镜像系统`prompt/domain/`
  </rule>

  <guideline>
    ## 编写指导原则
    - **编排优先**：role文件主要职责是编排组合，推荐使用@!引用机制而非直接内容
    - **简洁性原则**：保持role文件的简洁和清晰，避免冗长的直接内容
    - **模块化思维**：将具体内容抽离到独立的thought、execution、knowledge文件中
    - **引用一致性**：在同一role文件中保持引用风格的一致性
    - **可维护性**：通过引用机制实现内容的独立维护和复用
    - **灵活性保留**：允许在引用和直接内容之间选择，但推荐引用
    - **镜像一致性**：用户资源结构与系统资源保持一致，降低认知负载
  </guideline>

  <process>
    ## 编写执行流程
    
    ### Phase 1: 角色概念设计
    1. **明确角色定位**：确定AI角色的核心身份和专业领域
    2. **分析能力需求**：识别角色需要的思维特征、行为原则和专业知识
    3. **规划组件结构**：决定三个组件的具体内容来源和组织方式
    4. **选择编排策略**：决定使用引用机制还是直接内容

    ### Phase 2: 资源组织规划

    #### 用户资源目录结构（镜像系统结构）：
    ```
    .promptx/resource/domain/{roleId}/
    ├── {roleId}.role.md              # 主角色文件
    ├── thought/                      # 思维模式目录
    │   └── {name}.thought.md         # 专业思维模式
    └── execution/                    # 执行流程目录
        └── {name}.execution.md       # 专业执行流程
    ```

    #### 内容来源规划：
    1. **思维模式来源**（personality组件）：
       - 核心引用：`@!thought://remember`（记忆能力）
       - 核心引用：`@!thought://recall`（回忆能力）
       - 专业引用：`@!thought://[role-specific]`（角色特定思维）
       - 或直接定义角色的思维特征和认知偏好

    2. **行为原则来源**（principle组件）：
       - 专业引用：`@!execution://[role-specific]`（角色特定执行原则）
       - 或直接定义角色的行为准则和工作流程

    3. **专业知识来源**（knowledge组件）：
       - 领域引用：`@!knowledge://[domain-specific]`（领域专业知识）
       - 或直接定义角色的知识体系和技能框架

    ### Phase 3: DPML结构实现
    
    **关键要求：文件必须从`<role>`标签直接开始**
    
    **推荐编排风格（引用优先）：**
    ```xml
    <role>
      <personality>
        @!thought://remember
        @!thought://recall
        @!thought://[role-specific-thought]
      </personality>

      <principle>
        @!execution://[role-specific-execution]
      </principle>

      <knowledge>
        @!knowledge://[domain-specific-knowledge]
      </knowledge>
    </role>
    ```
    
    **示例：助手角色（参考assistant.role.md）**
    ```xml
    <role>
      <personality>
        @!thought://remember
        @!thought://recall
        @!thought://assistant
      </personality>

      <principle>
        @!execution://assistant
      </principle>

      <knowledge>
        @!knowledge://general-assistant
      </knowledge>
    </role>
    ```
    
    **用户资源示例（自定义销售分析师）：**
    ```xml
    <role>
      <personality>
        @!thought://remember
        @!thought://recall
        @!thought://sales-analyst
      </personality>

      <principle>
        @!execution://sales-data-analysis
      </principle>

      <knowledge>
        @!knowledge://business-intelligence
      </knowledge>
    </role>
    ```
    
    **混合风格（引用+直接内容）：**
    ```xml
    <role>
      <personality>
        @!thought://remember
        @!thought://recall
        
        ## 角色特定思维特征
        - **用户导向思维**：始终以用户需求为中心
        - **解决方案思维**：专注于提供实用的解决方案
      </personality>

      <principle>
        @!execution://assistant
        
        ## 补充行为原则
        - 保持耐心和友善的交互风格
        - 承认不确定性，不臆测答案
      </principle>

      <knowledge>
        @!knowledge://general-assistant
      </knowledge>
    </role>
    ```
    
    **纯直接内容风格（不推荐但允许）：**
    ```xml
    <role>
      <personality>
        # 角色思维模式
        ## 核心思维特征
        - **特征1**：描述
        - **特征2**：描述
      </personality>

      <principle>
        # 角色行为原则
        ## 核心原则
        - **原则1**：描述
        - **原则2**：描述
      </principle>

      <knowledge>
        # 角色专业知识
        ## 知识领域
        - **领域1**：描述
        - **领域2**：描述
      </knowledge>
    </role>
    ```

    ### Phase 4: 质量检查和集成验证
    1. **结构验证**：确保DPML role语法正确性
    2. **引用检查**：验证所有@!引用的资源实际存在
    3. **三组件完整性**：确认personality、principle、knowledge都有实质内容
    4. **系统集成测试**：验证与promptx命令和ResourceManager的兼容性
    5. **纯净性检查**：确认文件从`<role>`标签开始，无多余内容
    6. **镜像结构验证**：确认用户资源目录结构符合镜像规范
  </process>

  <criteria>
    ## 质量评价标准
    
    ### 格式合规性
    - ✅ 文件从`<role>`标签直接开始，无额外内容
    - ✅ 使用正确的DPML role标签结构
    - ✅ 三个子标签按personality → principle → knowledge顺序排列
    - ✅ XML语法正确，标签正确闭合
    - ✅ Markdown格式规范（如有直接内容）

    ### 编排质量
    - ✅ 体现role文件的编排组合职责
    - ✅ 合理使用@!引用机制实现模块化
    - ✅ 保持文件的简洁性和可读性
    - ✅ 引用风格在文件内保持一致
    - ✅ 避免不必要的冗长直接内容

    ### 三组件完整性
    - ✅ personality组件包含思维特征定义或引用
    - ✅ principle组件包含行为原则定义或引用
    - ✅ knowledge组件包含专业知识定义或引用
    - ✅ 三组件逻辑一致，共同构建完整角色
    - ✅ 组件内容与角色定位匹配

    ### 引用有效性
    - ✅ 所有@!引用遵循resource协议语法
    - ✅ 引用的资源路径正确且存在
    - ✅ 引用内容与组件语义匹配
    - ✅ 引用关系清晰，无循环依赖

    ### 系统集成性
    - ✅ 与PromptX锦囊串联系统兼容
    - ✅ 支持promptx action命令激活
    - ✅ 角色定义可被AI系统正确解析
    - ✅ 实现角色的即时专家化能力
    - ✅ ResourceManager可正确发现和加载

    ### 文件纯净性
    - ✅ 文件结构完全符合DPML role规范
    - ✅ 无任何XML结构外的多余内容
    - ✅ 体现role文件的标准编排格式
    - ✅ 维持role文件的简洁优雅特性

    ### 架构合规性
    - ✅ 用户资源目录结构镜像系统结构
    - ✅ 文件组织符合`.promptx/resource/domain/`规范
    - ✅ 与系统资源结构保持一致性
    - ✅ 降低用户认知负载和学习成本
  </criteria>
</execution>