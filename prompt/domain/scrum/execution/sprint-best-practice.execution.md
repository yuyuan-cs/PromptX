<execution domain="agile-management">
  <process>
    # Sprint执行流程
    
    ```mermaid
    flowchart TD
      A[Product Backlog] --> B[Sprint Planning]
      B --> C[Sprint Backlog + Goal]
      C --> D[Sprint执行]
      
      D --> E[Daily Standup]
      D --> F[开发活动]
      D --> G[监控调整]
      
      E --> H[Sprint Review]
      F --> H
      G --> H
      
      H --> I[Sprint Retrospective]
      I --> J[持续改进]
      H --> K[Product Increment]
      
      K --> L[下一个Sprint]
      J --> L
    ```
    
    ## Sprint核心活动
    
    ```mermaid
    mindmap
      root((Sprint执行))
        Sprint Planning
          Part1: 做什么
          Part2: 怎么做
          容量规划
          Goal制定
        Daily Standup
          三个问题
          阻塞识别
          进度同步
          时间控制
        Sprint Review
          产品演示
          反馈收集
          Backlog调整
          价值确认
        Sprint Retrospective
          经验总结
          问题识别
          改进行动
          持续优化
    ```
  </process>
  
  <guideline>
    ### Sprint Planning执行
    
    #### Part 1: 做什么 (4小时/2周Sprint)
    
    ```markdown
    主导: Product Owner
    
    1. Sprint Goal阐述 (30分钟)
       - 一句话描述核心价值
       - 明确成功标准
       - 确认业务优先级
    
    2. Product Backlog梳理 (2小时)
       - 选择Sprint候选Story
       - 澄清需求和验收标准
       - 识别Story间依赖关系
    
    3. 容量规划 (1小时)
       - 评估团队可用工时
       - 基于历史速度估算
       - 考虑风险和缓冲时间
    
    4. 初步承诺 (30分钟)
       - 团队确认Story选择
       - 验证Goal可达成性
    ```
    
    #### Part 2: 怎么做 (4小时/2周Sprint)
    
    ```markdown
    主导: Development Team
    
    1. Story拆解为Task (2小时)
       - 按技能领域分工
       - 识别技术依赖
       - 估算Task工时
    
    2. 技术方案设计 (1.5小时)
       - API接口设计
       - 架构决策
       - 风险识别和应对
    
    3. 最终承诺 (30分钟)
       - 基于详细分析调整
       - 确认Sprint Backlog
       - 建立团队共识
    ```
    
    ### Daily Standup执行 (15分钟)
    
    ```markdown
    标准三问题格式:
    
    每个团队成员 (90秒/人):
    1. 昨天完成了什么？(对Goal的贡献)
    2. 今天计划做什么？(如何推进Goal)
    3. 遇到什么阻碍？(影响Goal达成的障碍)
    
    Scrum Master关注:
    - Goal达成风险评估
    - 阻塞问题跟进计划
    - 团队协作需求
    
    效率提升技巧:
    - 面向看板讨论
    - 推迟技术细节到会后
    - 设置15分钟计时器
    - 聚焦Sprint Goal相关性
    ```
    
    ### Sprint Review执行 (2小时/2周Sprint)
    
    #### 演示结构模板
    
    ```markdown
    1. 开场回顾 (15分钟)
       - Sprint Goal和承诺回顾
       - 完成情况概览
       - 演示重点介绍
    
    2. 产品演示 (60分钟)
       - 按用户场景演示功能
       - 展示业务价值实现
       - 邀请利益相关者操作
    
    3. 反馈收集 (30分钟)
       - 开放式问题讨论
       - 记录改进建议
       - 确认价值交付
    
    4. Backlog调整 (15分钟)
       - 基于反馈调整优先级
       - 添加新发现需求
       - 估算影响范围
    ```
    
    #### 演示最佳实践
    
    | 原则 | 实践方法 | 注意事项 |
    |------|---------|---------|
    | 用户视角 | 真实用户场景演示 | 避免技术细节展示 |
    | 价值导向 | 强调解决的实际问题 | 量化改进效果 |
    | 互动参与 | 邀请利益相关者操作 | 收集即时反馈 |
    | 完整体验 | 展示端到端工作流程 | 使用真实数据 |
    
    ### Sprint Retrospective执行 (90分钟/2周Sprint)
    
    #### Start/Stop/Continue模式
    
    ```markdown
    1. 设定基调 (10分钟)
       - 强调安全环境
       - 重申改进目标
    
    2. 信息收集 (30分钟)
       Start(开始做): 新的有效实践
       Stop(停止做): 无效的活动或流程
       Continue(继续做): 已证明有效的实践
    
    3. 生成洞察 (20分钟)
       - 识别问题根本原因
       - 分析改进优先级
    
    4. 行动计划 (20分钟)
       - 选择1-3个改进项
       - 分配责任人和时间点
       - 制定成功衡量标准
    
    5. 总结收尾 (10分钟)
       - 确认行动项共识
       - 安排跟进机制
    ```
    
    ### Sprint监控与调整
    
    #### 关键监控指标
    
    ```mermaid
    graph TD
      A[燃尽图趋势] --> B{进度预警}
      C[Story完成率] --> B
      D[质量指标] --> B
      E[团队协作] --> B
      
      B -->|绿色| F[正常执行]
      B -->|黄色| G[密切关注]
      B -->|红色| H[立即调整]
      
      H --> I[容量调整]
      H --> J[范围调整]
      H --> K[质量保障]
    ```
    
    #### 调整策略矩阵
    
    | 问题类型 | 立即行动 | 预防措施 |
    |----------|----------|----------|
    | 容量过载 | 重新评估Story优先级 | 更保守的容量估算 |
    | 质量问题 | 暂停新功能开发 | 强化TDD和代码审查 |
    | 依赖阻塞 | 启用Mock方案 | 前置依赖识别 |
    | 需求变更 | 评估对Goal影响 | 建立变更决策矩阵 |
  </guideline>
  
  <rule>
    1. **Sprint时间盒强制要求**
       - Sprint长度固定不可延长
       - 所有活动严格控制时间
       - Planning不超过8小时(2周Sprint)
       - Daily Standup不超过15分钟
    
    2. **Sprint Goal强制要求**
       - 每个Sprint必须有明确Goal
       - Goal使用SMART原则制定
       - 所有Story必须支撑Goal
       - Goal达成情况必须可衡量
    
    3. **团队承诺强制要求**
       - 基于历史数据做容量规划
       - 团队自主选择Sprint Backlog
       - 承诺后的Scope变更需全员同意
       - 未完成Story自动返回Backlog
    
    4. **持续改进强制要求**
       - 每个Sprint必须执行Retrospective
       - 识别的问题必须制定行动计划
       - 改进行动必须有责任人和时间点
       - 下个Sprint开始时检查改进执行
  </rule>
  
  <constraint>
    1. **时间约束**
       - Sprint固定时间盒(1-4周)
       - 团队可用工时有限
       - 会议时间占比控制
       - 发布窗口时间限制
    
    2. **团队约束**
       - 团队技能组合限制
       - 人员可用性变化
       - 学习曲线时间成本
       - 协作沟通开销
    
    3. **技术约束**
       - 现有技术架构限制
       - 第三方服务依赖
       - 环境和工具限制
       - 技术债务影响
    
    4. **业务约束**
       - 需求变更频率
       - 利益相关者可用性
       - 合规和安全要求
       - 市场时间窗口
  </constraint>
  
  <criteria>
    | 评价维度 | 优秀标准 | 合格标准 | 不合格标准 |
    |---------|---------|---------|-----------|
    | Goal达成度 | 100%达成且超出预期 | 基本达成主要目标 | Goal达成度<80% |
    | 承诺兑现率 | Story完成率>90% | Story完成率>70% | Story完成率<70% |
    | 质量标准 | 零质量问题交付 | 少量非关键问题 | 质量问题影响使用 |
    | 团队协作 | 高效协作无阻塞 | 基本协作顺畅 | 频繁阻塞和等待 |
    | 持续改进 | 每Sprint有效改进 | 基本改进执行 | 改进措施不落地 |
    | 利益相关者满意度 | 高度满意超预期 | 基本满意 | 不满意需要调整 |
    | 团队速度稳定性 | 速度稳定可预测 | 速度基本稳定 | 速度波动太大 |
    | 技术债务管理 | 债务控制良好 | 债务基本可控 | 债务积累影响效率 |
  </criteria>
</execution> 