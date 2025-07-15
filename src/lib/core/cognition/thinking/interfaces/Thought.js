// Thought Interface - 思想/念头接口
// 认知心理学基础：Mental Representation（心理表征）
//
// === 认知心理学概念对齐 ===
//
// 1. 心理表征（Mental Representation）
//    - 思想是信息在认知系统中的表征形式
//    - 包含概念、关系、模式等多层次信息
//    - 既有内容（what）也有结构（how）
//
// 2. 思维产物特征（Thought as Cognitive Product）
//    - 内容性：思考得出的结论或洞察
//    - 过程性：思考的路径和激活序列
//    - 关联性：与其他概念的连接网络
//    - 元认知：对思考过程的认识
//
// 3. 工作记忆痕迹（Working Memory Traces）
//    - 思想保留了工作记忆中的激活痕迹
//    - 记录了从起始线索到最终理解的路径
//    - 包含激活强度和时序信息
//
// === 设计原则 ===
//
// 1. 完整性：包含思考的结果和过程
// 2. 可追溯：能够重现思考路径
// 3. 层次性：反映概念的层次关系
// 4. 时间性：保留思考的时序信息

/**
 * Thought Interface - 思想接口规范
 * 
 * 定义思想对象必须具备的访问方法
 * 基于认知心理学的自动加工和受控加工理论
 */
class Thought {
  // === 目标导向字段 ===
  // 认知心理学：Goal-Directed Behavior - 目标既是起点也是方向

  /**
   * 获取目标记忆
   * 【目标导向】整个思考的起点和导向，体现认知状态机的初始状态
   * 
   * 认知心理学基础：
   * - 目标导向行为（Goal-Directed Behavior）：思考是为了达到某个目标状态
   * - 目标即记忆：目标本身就是一个Engram，可以是声明性或程序性的
   * - 状态机起点：goalEngram是认知状态机的初始状态
   * 
   * goalEngram的类型：
   * 1. 声明性目标："我想了解咖啡对健康的影响"（明确的知识获取）
   * 2. 程序性目标："探索咖啡文化"（开放式的探索过程）
   * 3. 元认知目标："评估我对咖啡的理解"（对认知的认知）
   * 
   * @returns {Engram} 目标记忆
   */
  getGoalEngram() {
    throw new Error('Thought.getGoalEngram() must be implemented');
  }

  // === 系统自动加工字段 ===
  // 认知心理学：Automatic Processing - 无需意识控制的认知过程


  /**
   * 获取前序思想
   * 【自动加工】工作记忆中的上下文，自动保持激活状态
   * 
   * 核心作用：构建思维链（Chain of Thought）
   * - 每个Thought通过previousThought链接，形成完整的思考历史
   * - 类似区块链，每个思想都记录了前一个思想的引用
   * 
   * 思维链示例：
   * ```
   * thought1: "咖啡" → previousThought: null
   *    ↓
   * thought2: "早餐" → previousThought: thought1
   *    ↓
   * thought3: "健康" → previousThought: thought2
   * ```
   * 
   * 主要用途：
   * 1. 思考连贯性：基于已有认知继续深化，而非重新开始
   * 2. 避免循环：知道哪些已经思考过，避免陷入循环
   * 3. 路径回溯：可以追溯整个思考过程如何演进
   * 4. 认知状态：包含已激活的概念、识别的模式、产生的洞察
   * 
   * 认知心理学基础：
   * - 工作记忆（Working Memory）：保持最近的认知状态活跃
   * - 语境效应（Context Effect）：前序思想影响当前理解
   * - 启动效应（Priming）：已激活概念更容易被再次激活
   * 
   * @returns {Thought|null} 前序思想，首次思考时为null
   */
  getPreviousThought() {
    throw new Error('Thought.getPreviousThought() must be implemented');
  }

  /**
   * 获取回忆的记忆
   * 【自动加工】从记忆系统中回忆起的相关记忆
   * 
   * 核心优势：避免图遍历，直接获得丰富信息
   * - 传统方式：从Cue开始遍历语义网络，逐步扩散
   * - 优化方式：直接通过recall获取所有相关Engrams
   * 
   * 这些Engrams来自：
   * 1. memory.recall(startCue) 的直接结果
   * 2. 包含了记忆内容、强度、关联Schema等完整信息
   * 3. 已经经过激活扩散算法筛选的相关记忆
   * 
   * 为什么这样设计更好：
   * - 效率提升：不需要实时遍历庞大的语义网络
   * - 信息完整：每个Engram包含content、schema、strength等
   * - 减少复杂度：思考过程专注于分析，而非搜索
   * - 符合认知：人脑也是直接激活相关记忆，而非逐个搜索
   * 
   * 示例：
   * ```
   * startCue: "咖啡"
   * retrievedEngrams: [
   *   {content: "早晨喝咖啡提神", schema: "早餐\n  饮品\n  咖啡", strength: 0.9},
   *   {content: "咖啡因会影响睡眠", schema: "健康\n  睡眠\n  咖啡因", strength: 0.8},
   *   {content: "星巴克是常去的地方", schema: "地点\n  咖啡店\n  星巴克", strength: 0.7}
   * ]
   * ```
   * 
   * @returns {Array<Engram>} 自动检索的记忆集合，包含完整的记忆信息
   */
  getRecalledEngrams() {
    throw new Error('Thought.getRecalledEngrams() must be implemented');
  }

  /**
   * 获取迭代次数
   * 【自动加工】系统自动跟踪的思考深度
   * 
   * @returns {number} 当前迭代次数
   */
  getIteration() {
    throw new Error('Thought.getIteration() must be implemented');
  }

  /**
   * 获取时间戳
   * 【自动加工】系统自动记录的创建时间
   * 
   * @returns {number} 创建时间戳
   */
  getTimestamp() {
    throw new Error('Thought.getTimestamp() must be implemented');
  }

  // === AI受控加工字段 ===
  // 认知心理学：Controlled Processing - 需要意识控制和主动选择的认知过程
  // 注意：Thought只是Engrams的容器，不包含中间分析结果（如selectedEngrams、recognizedSchemas）




  /**
   * 获取结论
   * 【受控加工】思考得出的最终结论
   * 
   * 结论（Conclusion）的认知意义：
   * - 状态机终点：整个思考过程达到的最终认知状态
   * - 新的记忆：可以被存储并在未来被检索
   * - 目标达成：对goalEngram的回应和实现
   * - 循环起点：可以作为下一轮思考的goalEngram
   * 
   * 结论与目标的关系：
   * - 问答关系：goal提问，conclusion回答
   * - 转化关系：goal是原始状态，conclusion是转化后状态
   * - 深化关系：goal是表层理解，conclusion是深层理解
   * 
   * @returns {Engram} 思考的结论
   */
  getConclusionEngram() {
    throw new Error('Thought.getConclusionEngram() must be implemented');
  }

  /**
   * 获取洞察记忆
   * 【受控加工】思考过程中产生的新理解和发现
   * 
   * 洞察（Insights）的组成：
   * 1. 突破性理解：超越已有信息的新认识
   * 2. 模式发现：识别隐藏的关系和规律
   * 3. 概念重组：将已知概念以新方式组合
   * 4. 问题重构：从新角度理解问题本质
   * 
   * @returns {Array<Engram>} 思考产生的洞察和发现
   */
  getInsightEngrams() {
    throw new Error('Thought.getInsightEngrams() must be implemented');
  }

  /**
   * 获取最终思考内容
   * 【受控加工】为了兼容性保留，从finalEngram中提取content
   * 
   * 最终内容（Final Content）的认知意义：
   * - 思维产品：整个思考过程的结晶
   * - 知识整合：将碎片信息组织成连贯理解
   * - 交流载体：可以传递给他人的思想表达
   * - 行动基础：指导决策和行动的结论
   * 
   * 内容综合的认知过程：
   * 1. 信息整合
   *    - 综合所有识别的Schema
   *    - 整合产生的洞察
   *    - 考虑前序思想的影响
   * 
   * 2. 结构组织
   *    - 建立逻辑框架
   *    - 安排信息层次
   *    - 确保内容连贯
   * 
   * 3. 表达优化
   *    - 选择恰当的表达方式
   *    - 平衡深度与可理解性
   *    - 突出关键要点
   * 
   * 不同思维模式的内容特征：
   * - 推理模式：逻辑严密的论证过程
   * - 发散模式：丰富多样的可能性探索
   * - 收敛模式：聚焦核心的精炼总结
   * - 叙事模式：有时序和因果的故事线
   * 
   * 高质量内容的标准：
   * - 完整性：涵盖思考的主要发现
   * - 深度性：提供有价值的理解
   * - 清晰性：结构清楚，易于理解
   * - 实用性：能指导后续思考或行动
   * 
   * 实现考虑：
   * ```javascript
   * // 内容组织模板
   * const contentTemplate = `
   *   基于 [起始线索]，我的思考过程：
   *   
   *   1. 关键发现：
   *      - [从Schema中提取的核心模式]
   *   
   *   2. 主要洞察：
   *      - [产生的深刻理解]
   *   
   *   3. 结论：
   *      - [综合性的认识]
   *   
   *   4. 下一步思考方向：
   *      - [生成的新线索]
   * `;
   * ```
   * 
   * @returns {string} 综合性的思考结论
   */

  // === 元认知信息 ===
  // 认知心理学：Metacognition - 对思考过程本身的认知

  /**
   * 获取使用的模板
   * 【元认知】AI选择的认知策略和模板
   * 
   * 元认知的重要性：
   * - 策略意识：知道自己使用了什么思维方式
   * - 效果评估：可以评判这种方式是否合适
   * - 策略调整：为后续选择更好的策略提供依据
   * - 学习反馈：积累不同策略的使用经验
   * 
   * 模板信息的用途：
   * 1. 调试和分析
   *    - 理解AI为什么产生这样的思考结果
   *    - 评估模板选择是否恰当
   * 
   * 2. 用户反馈
   *    - 告诉用户使用了什么思维方式
   *    - 解释思考结果的特征
   * 
   * 3. 策略优化
   *    - 记录不同模板的效果
   *    - 指导未来的模板选择
   * 
   * @returns {string} 使用的思维模板名称（如 "ReasoningTemplate", "DivergentTemplate" 等）
   */
  getTemplateUsed() {
    throw new Error('Thought.getTemplateUsed() must be implemented');
  }

  /**
   * 获取置信度
   * 【元认知】AI对思考结果质量的元认知判断
   * 
   * 置信度的认知含义：
   * - 质量评估：对思考结果可靠性的判断
   * - 不确定性量化：识别思考中的薄弱环节
   * - 决策支持：帮助决定是否需要继续思考
   * - 风险管理：标识需要谨慎对待的结论
   * 
   * 影响置信度的因素：
   * 1. 信息充分性
   *    - 检索到的记忆是否足够
   *    - Schema覆盖是否全面
   * 
   * 2. 逻辑一致性
   *    - 识别的模式是否相互支持
   *    - 洞察之间是否存在矛盾
   * 
   * 3. 思考深度
   *    - 是否达到问题的核心
   *    - 是否只停留在表面
   * 
   * 4. 模式匹配度
   *    - 使用的思维模式是否适合问题
   *    - 是否需要切换到其他模式
   * 
   * 置信度级别解释：
   * - 0.9-1.0：高度确信，结论可靠
   * - 0.7-0.9：较为确信，可以采用
   * - 0.5-0.7：中等确信，可能需要验证
   * - 0.3-0.5：较低确信，建议继续探索
   * - 0.0-0.3：不确信，需要重新思考
   * 
   * 使用建议：
   * ```javascript
   * if (thought.getConfidence() < 0.5) {
   *   // 置信度低，可能需要：
   *   // 1. 切换思维模式
   *   // 2. 获取更多信息
   *   // 3. 进行更多轮思考
   * }
   * ```
   * 
   * @returns {number} 置信度评分 (0-1)
   */
  getConfidence() {
    throw new Error('Thought.getConfidence() must be implemented');
  }
}

module.exports = { Thought };