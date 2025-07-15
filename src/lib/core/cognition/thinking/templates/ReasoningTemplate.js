// ReasoningTemplate - 推理思维模板
// 实现基于逻辑推理的思考过程
//
// === 推理思维特征 ===
//
// 1. 逻辑链构建：前提 → 推理 → 结论
// 2. 因果关系分析：原因 → 过程 → 结果
// 3. 证据支撑：每个推理步骤都需要证据
// 4. 验证机制：结论需要逻辑验证
//
// === 推理步骤 ===
//
// 1. 问题分析：识别推理目标和已知条件
// 2. 前提收集：从记忆中检索相关事实和规则
// 3. 逻辑链构建：构建从前提到结论的推理路径
// 4. 推理执行：按逻辑链进行推理
// 5. 结论验证：验证推理的有效性
// 6. 置信度评估：基于逻辑强度评估置信度

const { BaseThinkingTemplate } = require('./BaseThinkingTemplate');

class ReasoningTemplate extends BaseThinkingTemplate {
  /**
   * 获取模板名称
   * @returns {string} 模板名称
   */
  getName() {
    return '推理思维模板';
  }

  /**
   * 生成创建 goalEngram 的 prompt
   * 
   * 推理思维的目标是建立清晰的逻辑链条
   * 
   * @param {*} input - 原始输入
   * @returns {string} 生成 goalEngram 的 prompt
   */
  getGoalEngramGenerationPrompt(input) {
    return `输入: ${typeof input === 'string' ? input : JSON.stringify(input)}

将其转化为以下格式之一：
- 因果推理: "推理[原因]导致[结果]的逻辑链条"
- 归纳推理: "从[现象]归纳出[规律]"
- 演绎推理: "基于[规则]推导[具体情况]"`;
  }

  /**
   * 基于 goalEngram 的 cues 检索记忆
   * 
   * 推理思维需要检索：事实、规则、先例
   * 
   * @param {Engram} goalEngram - 目标 Engram
   * @param {Memory} memory - 记忆服务
   * @returns {Promise<Array<Engram>>} 检索到的相关记忆
   */
  async recallEngramsByGoalEngramCues(goalEngram, memory) {
    // 从 goalEngram 的 schema 中提取关键概念作为检索线索
    const schema = goalEngram.getSchema();
    const cues = this.extractCuesFromSchema(schema);
    
    // 推理特定的检索策略
    const retrievalStrategies = [
      // 1. 检索相关事实
      { type: 'fact', keywords: this.extractFactKeywords(cues) },
      // 2. 检索推理规则
      { type: 'rule', keywords: this.extractRuleKeywords(cues) },
      // 3. 检索类似案例
      { type: 'case', keywords: this.extractCaseKeywords(cues) }
    ];
    
    const allRecalledEngrams = [];
    
    for (const strategy of retrievalStrategies) {
      for (const keyword of strategy.keywords) {
        const engrams = await memory.recall(keyword);
        allRecalledEngrams.push(...engrams);
      }
    }
    
    // 去重并按相关性排序
    return this.deduplicateAndSort(allRecalledEngrams, goalEngram);
  }

  /**
   * 生成洞察 Engrams 的 prompt
   * 
   * 推理思维的洞察是逻辑关系的发现
   * 
   * @param {Engram} goalEngram - 目标 Engram
   * @param {Array<Engram>} recalledEngrams - 检索到的记忆
   * @param {Thought} previousThought - 前序思想（可选）
   * @returns {string} 生成洞察的 prompt
   */
  getInsightEngramsGenerationPrompt(goalEngram, recalledEngrams, previousThought) {
    const previousContext = previousThought 
      ? `\n### 前序推理：\n${previousThought.conclusionEngram?.content || '无'}` 
      : '';

    return `### 🎯 当前推理目标
${goalEngram ? `> ${goalEngram.getContent()}` : '> 尚未明确'}

### 📚 可用证据库
${recalledEngrams && recalledEngrams.length > 0
  ? recalledEngrams.map((e, i) => `${i+1}. ${e.getContent()}`).join('\n')
  : '> 暂无检索记忆，将基于通用知识推理'}
${previousContext}

### 💡 洞察生成框架

#### 1️⃣ 识别逻辑关系
- **因果关系**: A导致B
- **条件关系**: 如果A则B  
- **包含关系**: A是B的一部分
- **对比关系**: A与B的差异

#### 2️⃣ 构建推理链条
\`\`\`
前提1 + 前提2 -> 中间结论
中间结论 + 前提3 -> 最终结论
\`\`\`

#### 3️⃣ 发现隐含规律
- 从具体案例中归纳一般规律
- 从一般规则中演绎具体情况

### ✅ 输出要求
生成 **3-5个** 关键推理洞察，每个洞察包含：
- 逻辑关系类型
- 支撑证据
- 推理过程说明
`;
  }

  /**
   * 生成结论 Engram 的 prompt
   * 
   * 推理思维的结论需要严密的逻辑支撑
   * 
   * @param {Engram} goalEngram - 目标 Engram
   * @param {Array<Engram>} recalledEngrams - 检索到的记忆
   * @param {Array<Engram>} insightEngrams - 生成的洞察
   * @returns {string} 生成结论的 prompt
   */
  getConclusionEngramGenerationPrompt(goalEngram, recalledEngrams, insightEngrams) {
    return `
## 📝 推理结论形成

### 推理目标：
${goalEngram ? goalEngram.getContent() : '（尚未明确）'}

### 证据基础：
${recalledEngrams && recalledEngrams.length > 0 
  ? recalledEngrams.map(e => `- ${e.getContent()}`).join('\n')
  : '（尚未检索）'}

### 推理洞察：
${insightEngrams && insightEngrams.length > 0
  ? insightEngrams.map(e => `- ${e.getContent()}`).join('\n')
  : '（尚未生成）'}

### 结论形成指导：
1. **逻辑完整性**：
   - 确保从前提到结论的每一步都有逻辑支撑
   - 避免逻辑跳跃或断层

2. **结论表述**：
   - 使用明确的逻辑连接词（因此、所以、由此可见）
   - 清晰说明推理路径
   - 指出关键推理步骤

3. **限定条件**：
   - 明确结论的适用范围
   - 说明必要的前提条件
   - 指出可能的例外情况

请基于以上推理过程，形成一个逻辑严密、证据充分的结论。
`;
  }

  /**
   * 生成置信度评估的 prompt
   * 
   * 推理思维的置信度基于逻辑强度
   * 
   * @param {Engram} goalEngram - 目标 Engram
   * @param {Array<Engram>} recalledEngrams - 检索到的记忆
   * @param {Array<Engram>} insightEngrams - 生成的洞察
   * @param {Engram} conclusionEngram - 形成的结论
   * @returns {string} 评估置信度的 prompt
   */
  getConfidenceGenerationPrompt(goalEngram, recalledEngrams, insightEngrams, conclusionEngram) {
    return `
## 📊 推理置信度评估

### 推理目标：
${goalEngram ? goalEngram.getContent() : '（尚未明确）'}

### 形成的结论：
${conclusionEngram ? conclusionEngram.getContent() : '（尚未形成）'}

### 置信度评估维度：

1. **逻辑有效性**（权重：40%）
   - 推理形式是否有效？
   - 是否存在逻辑谬误？
   - 推理链条是否完整？

2. **证据充分性**（权重：30%）
   - 前提是否真实可靠？
   - 证据是否足够支撑结论？
   - 是否考虑了反例？

3. **推理严密性**（权重：20%）
   - 每个推理步骤是否必然？
   - 是否存在其他可能的解释？
   - 结论是否过度概括？

4. **实践验证性**（权重：10%）
   - 结论是否符合已知事实？
   - 是否有实际案例支持？
   - 预测是否可验证？

请基于以上维度，给出0-1之间的置信度评分，并简要说明评分理由。
特别注意：纯演绎推理（如数学证明）可以达到1.0，但归纳推理通常不超过0.9。
`;
  }

  // === 辅助方法 ===

  /**
   * 从 Schema 中提取检索线索
   */
  extractCuesFromSchema(schema) {
    // 将 schema 按行分割，提取每一层的概念
    const lines = schema.split('\n').map(line => line.trim()).filter(Boolean);
    const cues = [];
    
    lines.forEach(line => {
      // 移除缩进，提取纯概念
      const concept = line.replace(/^\s*/, '').replace(/\(.*\)$/, '').trim();
      if (concept && !concept.includes('→')) {
        cues.push(concept);
      }
    });
    
    return cues;
  }

  /**
   * 提取事实相关的关键词
   */
  extractFactKeywords(cues) {
    // 推理相关的事实关键词
    const factPatterns = ['是什么', '定义', '特征', '属性', '数据', '证据'];
    const keywords = [];
    
    cues.forEach(cue => {
      factPatterns.forEach(pattern => {
        keywords.push(`${cue}${pattern}`);
      });
    });
    
    return keywords;
  }

  /**
   * 提取规则相关的关键词
   */
  extractRuleKeywords(cues) {
    // 推理规则相关的关键词
    const rulePatterns = ['规则', '定律', '原理', '如果', '那么', '导致'];
    const keywords = [];
    
    cues.forEach(cue => {
      rulePatterns.forEach(pattern => {
        keywords.push(`${cue}${pattern}`);
      });
    });
    
    return keywords;
  }

  /**
   * 提取案例相关的关键词
   */
  extractCaseKeywords(cues) {
    // 案例相关的关键词
    const casePatterns = ['案例', '实例', '经验', '实践', '应用'];
    const keywords = [];
    
    cues.forEach(cue => {
      casePatterns.forEach(pattern => {
        keywords.push(`${cue}${pattern}`);
      });
    });
    
    return keywords;
  }

  /**
   * 去重并按相关性排序
   */
  deduplicateAndSort(engrams, goalEngram) {
    // 使用 Map 去重
    const uniqueEngrams = new Map();
    engrams.forEach(engram => {
      const key = engram.getContent();
      if (!uniqueEngrams.has(key)) {
        uniqueEngrams.set(key, engram);
      }
    });
    
    // 转换为数组并按相关性排序
    const sortedEngrams = Array.from(uniqueEngrams.values());
    
    // 简单的相关性评分：基于内容相似度
    const goalContent = goalEngram.getContent().toLowerCase();
    sortedEngrams.sort((a, b) => {
      const scoreA = this.calculateRelevance(a.getContent(), goalContent);
      const scoreB = this.calculateRelevance(b.getContent(), goalContent);
      return scoreB - scoreA;
    });
    
    return sortedEngrams;
  }

  /**
   * 计算相关性得分
   */
  calculateRelevance(content, goalContent) {
    const contentLower = content.toLowerCase();
    const words = goalContent.split(/\s+/);
    let score = 0;
    
    words.forEach(word => {
      if (contentLower.includes(word)) {
        score += 1;
      }
    });
    
    return score;
  }
}

module.exports = { ReasoningTemplate };