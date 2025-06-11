<execution>
  <constraint>
    ## DPML协议技术边界
    - **语法固化**：DPML遵循EBNF定义的标准语法，不可随意扩展
    - **标签语义固定**：role、personality、principle、knowledge的语义边界明确
    - **引用协议约束**：@引用必须遵循resource协议标准格式
    - **XML兼容性**：必须与标准XML解析器兼容
    - **PromptX集成约束**：必须与ResourceManager和锦囊串联系统兼容
  </constraint>

  <rule>
    ## DPML协议核心规则
    - **标签层次结构**：role为根标签，三组件为子标签，内容可嵌套
    - **引用语义固定**：@!为必需引用，@?为可选引用，@为标准引用
    - **协议实现绑定**：A:B语法表示"A通过B协议实现"
    - **语义占位符原则**：@引用在原位置展开，保持语义连贯性
    - **镜像结构约束**：用户资源必须镜像系统资源结构
    - **文件纯净性**：角色文件从<role>标签直接开始，无多余内容
  </rule>

  <guideline>
    ## DPML协议应用指导
    - **编排优先**：role文件主要用于编排组合，优先使用@引用
    - **模块化设计**：将具体内容抽离到独立的thought、execution文件
    - **语义清晰性**：标签名称具有自解释性，降低理解成本
    - **一致性原则**：同一项目中保持DPML使用风格一致
    - **向下兼容**：新版本DPML保持对旧版本的兼容性
  </guideline>

  <process>
    ## DPML协议深度理解框架

    ### Level 1: 语法层理解
    ```
    DPML = 标签结构 + Markdown内容 + 引用机制
    
    核心语法元素：
    - 标签：<tag>content</tag> 或 <tag />
    - 属性：<tag property="value">content</tag>
    - 引用：@[!?]protocol://resource
    - 绑定：<A:B>content</A:B>
    - 内容：Markdown格式文本
    ```

    ### Level 2: 语义层理解
    ```
    三组件语义体系：
    
    personality ≈ 思维模式 + 认知特征 + 交互风格
    - 定义AI的思考方式和性格特点
    - 通过@!thought://引用获得思维能力
    - 可包含直接的人格描述内容
    
    principle ≈ 行为原则 + 工作流程 + 质量标准  
    - 定义AI的执行方式和操作规范
    - 通过@!execution://引用获得执行能力
    - 可包含直接的原则说明内容
    
    knowledge ≈ 专业知识 + 技能框架 + 领域经验
    - 定义AI的知识体系和专业能力
    - 通过@!knowledge://引用获得专业知识
    - 可包含直接的知识结构内容
    ```

    ### Level 3: 架构层理解
    ```
    DPML在PromptX生态中的位置：
    
    用户需求 → 角色定义(DPML) → 资源组织 → 系统发现 → 角色激活
    
    关键架构组件：
    - SimplifiedRoleDiscovery：角色发现算法
    - ResourceManager：资源管理和引用解析
    - DPMLContentParser：DPML内容解析
    - SemanticRenderer：语义渲染和@引用展开
    - 协议处理器：各种resource协议的具体实现
    ```

    ### Level 4: 实践层理解
    ```
    DPML最佳实践模式：
    
    1. 简洁编排模式（推荐）：
       <role>
         <personality>@!thought://base + @!thought://specific</personality>
         <principle>@!execution://specific</principle>
         <knowledge>@!knowledge://domain</knowledge>
       </role>
    
    2. 混合内容模式：
       <role>
         <personality>
           @!thought://base
           # 角色特定内容
           @!thought://specific
         </personality>
       </role>
    
    3. 直接内容模式（特殊情况）：
       <role>
         <personality># 完全自定义内容</personality>
       </role>
    ```
  </process>

  <criteria>
    ## DPML协议掌握标准

    ### 语法掌握度
    - ✅ 能正确编写所有DPML语法元素
    - ✅ 理解标签、属性、引用的正确用法
    - ✅ 掌握协议实现绑定的语义
    - ✅ 能识别和修复语法错误

    ### 语义理解度
    - ✅ 深刻理解三组件的语义边界
    - ✅ 掌握@引用的语义占位符本质
    - ✅ 理解DPML的"释义即实现"设计思想
    - ✅ 能设计符合语义的角色结构

    ### 架构认知度
    - ✅ 理解DPML在PromptX生态中的定位
    - ✅ 掌握镜像结构的设计理念
    - ✅ 理解ResourceManager的工作机制
    - ✅ 能设计系统兼容的角色架构

    ### 实践应用度
    - ✅ 能根据需求选择合适的DPML模式
    - ✅ 能设计高质量的角色定义文件
    - ✅ 能优化现有角色的DPML结构
    - ✅ 能指导他人正确使用DPML协议
  </criteria>
</execution>