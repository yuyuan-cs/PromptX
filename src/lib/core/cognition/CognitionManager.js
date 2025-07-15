// CognitionManager - 管理角色与认知的关系
// 每个角色拥有独立的认知实例，存储在 @user://.promptx/cognition/{role}

const { Cognition } = require('./Cognition');
const path = require('path');
const fs = require('fs-extra');
const logger = require('../../utils/logger');
const { 
  BaseThinkingTemplate,
  ReasoningTemplate 
} = require('./thinking/templates');

class CognitionManager {
  constructor(resourceManager) {
    this.resourceManager = resourceManager;
    this.cognitions = new Map(); // role -> Cognition instance
    this.userProtocol = null; // 延迟初始化
  }

  /**
   * 确保资源管理器已初始化
   */
  async ensureInitialized() {
    if (!this.resourceManager.initialized) {
      logger.info('⚙️ [CognitionManager] ResourceManager未初始化，正在初始化...');
      await this.resourceManager.initializeWithNewArchitecture();
      logger.success('⚙️ [CognitionManager] ResourceManager初始化完成');
    }
    
    // 获取 user 协议
    if (!this.userProtocol) {
      this.userProtocol = this.resourceManager.protocols.get('user');
      if (!this.userProtocol) {
        throw new Error('UserProtocol not found in ResourceManager');
      }
    }
  }

  /**
   * 获取或创建角色的认知实例
   * @param {string} role - 角色ID
   * @returns {Promise<Cognition>} 角色的认知实例
   */
  async getCognition(role) {
    // 验证角色名
    if (!role || typeof role !== 'string' || role.trim() === '') {
      throw new Error('角色ID不能为空');
    }
    
    // 确保已初始化
    await this.ensureInitialized();
    
    // 如果已存在，直接返回
    if (this.cognitions.has(role)) {
      logger.debug(`🧠 [CognitionManager] 返回已存在的认知实例: ${role}`);
      return this.cognitions.get(role);
    }

    logger.info(`🧠 [CognitionManager] 创建新的认知实例: ${role}`);
    
    // 创建角色专属的认知目录
    const cognitionPath = `.promptx/cognition/${role}`;
    const cognitionDir = await this.userProtocol.resolvePath(cognitionPath);
    
    // 确保目录存在
    await fs.ensureDir(cognitionDir);
    logger.debug(`📁 [CognitionManager] 认知目录已创建: ${cognitionDir}`);
    
    // 配置认知实例
    const config = {
      longTermPath: path.join(cognitionDir, 'longterm.db'),
      semanticPath: cognitionDir,  // 直接使用认知目录，不再创建子目录
      proceduralPath: path.join(cognitionDir, 'procedural.json')  // 和longterm.db在同一目录
    };
    
    // 创建认知实例
    const cognition = new Cognition(config);
    this.cognitions.set(role, cognition);
    
    logger.success(`✅ [CognitionManager] 认知实例创建完成: ${role}`);
    return cognition;
  }

  /**
   * 记住 - 为指定角色保存记忆（支持批量）
   * @param {string} role - 角色ID
   * @param {Array} engrams - Engram对象数组，每个包含 {content, schema, strength, type}
   */
  async remember(role, engrams) {
    // 确保输入是数组
    if (!Array.isArray(engrams)) {
      throw new Error('engrams 必须是数组格式');
    }
    
    if (engrams.length === 0) {
      throw new Error('engrams 数组不能为空');
    }
    
    const cognition = await this.getCognition(role);
    const results = [];
    
    // 循环调用底层的单个remember方法
    for (let i = 0; i < engrams.length; i++) {
      const { content, schema, strength, type = 'ATOMIC' } = engrams[i];
      
      // 验证必需字段
      if (!content || !schema || typeof strength !== 'number') {
        throw new Error(`Engram ${i + 1}: content, schema, strength 是必需字段`);
      }
      
      try {
        const result = await cognition.remember(content, schema, strength, type);
        results.push(result);
      } catch (error) {
        throw new Error(`Engram ${i + 1}: ${error.message}`);
      }
    }
    
    return results;
  }

  /**
   * 回忆 - 从指定角色检索记忆
   * @param {string} role - 角色ID
   * @param {string} cue - 检索线索
   * @returns {Promise<Array>} 匹配的记忆列表
   */
  async recall(role, cue) {
    const cognition = await this.getCognition(role);
    return cognition.recall(cue);
  }

  /**
   * 启动效应 - 预激活角色的语义网络
   * @param {string} role - 角色ID
   * @returns {Promise<string>} Mermaid mindmap 格式的字符串
   */
  async prime(role) {
    const cognition = await this.getCognition(role);
    return cognition.prime();
  }

  /**
   * 获取所有活跃的认知实例
   * @returns {Map} role -> Cognition 映射
   */
  getActiveCognitions() {
    return new Map(this.cognitions);
  }

  /**
   * 清理指定角色的认知实例（释放内存）
   * @param {string} role - 角色ID
   */
  clearCognition(role) {
    if (this.cognitions.has(role)) {
      logger.info(`🧹 [CognitionManager] 清理认知实例: ${role}`);
      this.cognitions.delete(role);
    }
  }

  /**
   * 清理所有认知实例
   */
  clearAll() {
    logger.info(`🧹 [CognitionManager] 清理所有认知实例`);
    this.cognitions.clear();
  }

  /**
   * 获取所有可用的思维模板
   * @returns {Object} 思维模板集合
   */
  getThinkingTemplates() {
    return {
      reasoning: new ReasoningTemplate(),
      // 未来可以添加更多模板
      // divergent: new DivergentTemplate(),
      // convergent: new ConvergentTemplate(),
      // creative: new CreativeTemplate(),
      // critical: new CriticalTemplate(),
      // systemic: new SystemicTemplate(),
      // analogical: new AnalogicalTemplate(),
      // narrative: new NarrativeTemplate(),
      // dialectical: new DialecticalTemplate()
    };
  }

  /**
   * 获取指定的思维模板实例
   * @param {string} templateName - 模板名称
   * @returns {BaseThinkingTemplate} 思维模板实例
   */
  getThinkingTemplate(templateName) {
    const templates = this.getThinkingTemplates();
    const template = templates[templateName];
    
    if (!template) {
      throw new Error(`未知的思维模板: ${templateName}。可用模板: ${Object.keys(templates).join(', ')}`);
    }
    
    return template;
  }

  /**
   * 思考 - 处理 Thought 对象并生成下一个 Thought 的指导
   * 
   * 每次调用都传入一个 Thought 对象，系统返回指导生成下一个 Thought 的 prompt
   * 
   * @param {string} role - 角色ID
   * @param {Object} thought - Thought 对象（至少包含 goalEngram）
   * @param {Object} thought.goalEngram - 本轮思考目标（必需）
   * @param {Array} [thought.insightEngrams] - 产生的洞察
   * @param {Object} [thought.conclusionEngram] - 形成的结论
   * @param {number} [thought.confidence] - 置信度评估
   * @param {string} [templateName='reasoning'] - 思维模板名称
   * @returns {Promise<string>} 返回生成下一个 Thought 的指导 prompt
   * 
   * @example
   * // 第一次思考：只有 goalEngram
   * const prompt1 = await cognitionManager.think('scientist', {
   *   goalEngram: { 
   *     content: "推理天空呈现蓝色的光学原理",
   *     schema: "自然现象\\n  光学现象\\n    大气散射"
   *   }
   * });
   * 
   * // 第二次思考：添加了洞察
   * const prompt2 = await cognitionManager.think('scientist', {
   *   goalEngram: { 
   *     content: "深入分析瑞利散射机制",
   *     schema: "物理学\\n  光学\\n    散射理论"
   *   },
   *   insightEngrams: [
   *     { content: "蓝光波长短，被散射更多" }
   *   ]
   * });
   * 
   * // 第三次思考：形成结论
   * const prompt3 = await cognitionManager.think('scientist', {
   *   goalEngram: { content: "验证瑞利散射解释", schema: "..." },
   *   insightEngrams: [...],
   *   conclusionEngram: { content: "天空蓝色由瑞利散射造成" },
   *   confidence: 0.95
   * });
   */
  async think(role, thought, templateName = 'reasoning') {
    // 验证必需的 goalEngram
    if (!thought || !thought.goalEngram) {
      throw new Error('Thought 必须包含 goalEngram');
    }
    
    const {
      goalEngram,
      insightEngrams = null,
      conclusionEngram = null,
      confidence = null
    } = thought;
    
    // 系统自动管理的状态
    if (!this._thoughtState) {
      this._thoughtState = new Map();
    }
    
    const roleState = this._thoughtState.get(role) || { 
      iteration: 0, 
      previousThought: null 
    };
    
    // 自动递增迭代次数
    const iteration = roleState.iteration + 1;
    
    // 构造完整的 thought 用于内部处理
    const fullThought = {
      goalEngram,
      recalledEngrams: null,  // 将由系统自动检索
      insightEngrams,
      conclusionEngram,
      confidence,
      previousThought: roleState.previousThought,
      iteration,
      timestamp: new Date().toISOString()
    };
    
    // 调用内部方法
    const result = await this._think(
      role,
      null,      // input 不再需要，因为已经有 goalEngram
      goalEngram,
      null,      // recalledEngrams - 系统会自动检索
      insightEngrams,
      conclusionEngram,
      confidence,
      roleState.previousThought,
      iteration,
      templateName
    );
    
    // 更新状态
    this._thoughtState.set(role, {
      iteration,
      previousThought: fullThought
    });
    
    return result;
  }

  /**
   * 思考 - 基于 Thought 五大要素和思维模板生成下一个 Thought 的指导 prompt
   * 
   * @private 内部方法，外部请使用 startThink 或 continueThink
   * 
   * === 核心理解 ===
   * 
   * 这个方法是认知循环的核心接口，它接收 AI 生成的 Thought 要素，
   * 通过指定的思维模板（如推理、发散、收敛等）生成指导 AI 产生下一个 Thought 的 prompt。
   * 
   * === 认知循环流程 ===
   * 
   * 1. AI 基于问题生成初始 Thought（可能只有 input）
   * 2. think() 方法处理 Thought，生成指导 prompt
   * 3. AI 基于 prompt 生成更完整的 Thought（包含五大要素）
   * 4. 循环继续，Thought 越来越深入和完整
   * 
   * === Thought 五大要素 ===
   * 
   * 1. goalEngram - 本轮思考的目标
   * 2. recalledEngrams - 基于目标检索到的相关记忆
   * 3. insightEngrams - 从记忆中产生的洞察
   * 4. conclusionEngram - 综合形成的结论
   * 5. confidence - 对结论的置信度评估
   * 
   * === 使用示例 ===
   * 
   * // 第一轮：只有初始输入
   * const prompt1 = await cognitionManager.think(
   *   'scientist',
   *   "为什么天空是蓝色的？",  // input
   *   null,                    // goalEngram
   *   null,                    // recalledEngrams
   *   null,                    // insightEngrams
   *   null,                    // conclusionEngram
   *   null,                    // confidence
   *   null,                    // previousThought
   *   0                        // iteration
   * );
   * 
   * // 第二轮：包含部分要素
   * const prompt2 = await cognitionManager.think(
   *   'scientist',
   *   null,  // input 已不需要
   *   { 
   *     content: "推理天空呈现蓝色的光学原理",
   *     schema: "自然现象\n  光学现象\n    大气散射"
   *   },
   *   [
   *     {
   *       content: "瑞利散射：短波长光更容易被散射",
   *       schema: "物理学\n  光学\n    散射理论",
   *       strength: 0.9
   *     }
   *   ],
   *   null,  // insightEngrams
   *   null,  // conclusionEngram
   *   null,  // confidence
   *   null,  // previousThought
   *   1      // iteration
   * );
   * 
   * // 完整轮次：包含所有五大要素
   * const prompt3 = await cognitionManager.think(
   *   'scientist',
   *   null,
   *   { content: "推理天空蓝色原理", schema: "物理学\n  光学" },
   *   [...],  // recalledEngrams
   *   [...],  // insightEngrams
   *   { content: "瑞利散射导致天空呈蓝色" },
   *   0.95,   // confidence
   *   thoughtFromPreviousRound,
   *   2,
   *   'reasoning'
   * );
   * 
   * @param {string} role - 角色ID（如 'scientist', 'writer', 'engineer' 等）
   * @param {string|null} input - 初始输入（通常在第一轮思考时提供，后续轮次传 null）
   * @param {Object|null} goalEngram - 目标 Engram
   *   @param {string} goalEngram.content - 目标内容（如 "推理天空为什么是蓝色"）
   *   @param {string} goalEngram.schema - 知识层级结构（如 "物理学\n  光学\n    散射"）
   * @param {Array<Object>|null} recalledEngrams - 检索到的相关记忆数组
   *   @param {string} recalledEngrams[].content - 记忆内容
   *   @param {string} recalledEngrams[].schema - 记忆的知识结构
   *   @param {number} recalledEngrams[].strength - 记忆强度 (0-1)
   * @param {Array<Object>|null} insightEngrams - 产生的洞察数组
   *   @param {string} insightEngrams[].content - 洞察内容
   * @param {Object|null} conclusionEngram - 形成的结论
   *   @param {string} conclusionEngram.content - 结论内容
   * @param {number|null} confidence - 置信度评估 (0-1)
   *   - 0.9-1.0: 高度确信（如数学证明）
   *   - 0.7-0.9: 较为确信（如科学理论）
   *   - 0.5-0.7: 中等确信（如经验判断）
   *   - 0.3-0.5: 低确信度（如推测）
   * @param {Object|null} previousThought - 前序思想对象（用于思维链连接）
   * @param {number} iteration - 迭代次数（表示这是第几轮思考，默认 0）
   * @param {string} templateName - 思维模板名称（默认 'reasoning'）
   *   - 'reasoning': 推理思维（逻辑推导、因果分析）
   *   - 'divergent': 发散思维（头脑风暴、创意生成）[未来实现]
   *   - 'convergent': 收敛思维（决策制定、方案选择）[未来实现]
   *   - 'creative': 创造性思维（创新设计、跨界融合）[未来实现]
   *   - 'critical': 批判性思维（论证分析、假设检验）[未来实现]
   *   - 'systemic': 系统性思维（整体分析、架构设计）[未来实现]
   * 
   * @returns {Promise<string>} 返回生成的思考指导 prompt，用于指导 AI 生成下一个 Thought
   * 
   * @throws {Error} 当角色ID无效时
   * @throws {Error} 当思维模板不存在时
   */
  async _think(
    role,
    input = null,
    goalEngram = null,
    recalledEngrams = null,
    insightEngrams = null,
    conclusionEngram = null,
    confidence = null,
    previousThought = null,
    iteration = 0,
    templateName = 'reasoning'
  ) {
    
    const cognition = await this.getCognition(role);
    const template = this.getThinkingTemplate(templateName);
    
    logger.info(`🤔 [CognitionManager] ${role} 使用 ${templateName} 模板进行思考`);
    
    // 构造 Thought 对象
    // 注意：这里需要将简单对象转换为带有方法的 Engram 对象
    const thought = {
      input,
      iteration,
      previousThought,
      confidence
    };
    
    // 处理 goalEngram
    if (goalEngram) {
      thought.goalEngram = this._createEngram(goalEngram);
    }
    
    // 处理 recalledEngrams
    if (recalledEngrams && recalledEngrams.length > 0) {
      thought.recalledEngrams = recalledEngrams.map(e => this._createEngram(e));
    }
    
    // 处理 insightEngrams
    if (insightEngrams && insightEngrams.length > 0) {
      thought.insightEngrams = insightEngrams.map(e => this._createEngram(e));
    }
    
    // 处理 conclusionEngram
    if (conclusionEngram) {
      thought.conclusionEngram = this._createEngram(conclusionEngram);
    }
    
    return cognition.think(thought, template);
  }
  
  
  /**
   * 创建 Engram 对象（内部辅助方法）
   * @private
   */
  _createEngram(data) {
    if (!data) return null;
    
    // 如果已经有 getContent 方法，说明已经是 Engram 对象
    if (typeof data.getContent === 'function') {
      return data;
    }
    
    // 创建一个简单的 Engram 对象
    return {
      content: data.content || '',
      schema: data.schema || '',
      strength: data.strength || 0.8,
      type: data.type || 'ATOMIC',
      getContent() { return this.content; },
      getSchema() { return this.schema; },
      getStrength() { return this.strength; },
      getType() { return this.type; }
    };
  }

  /**
   * 获取思维模板信息
   * @returns {Object} 各个模板的描述信息
   */
  getThinkingTemplateInfo() {
    return {
      reasoning: {
        name: '推理思维模板',
        description: '基于逻辑推理的思考过程',
        features: ['逻辑链构建', '因果关系分析', '证据支撑', '验证机制'],
        applications: ['问题分析', '决策制定', '论证构建', '假设验证']
      }
      // 未来添加更多模板的信息
    };
  }

}

module.exports = { CognitionManager };