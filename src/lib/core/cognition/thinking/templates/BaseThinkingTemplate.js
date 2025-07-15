// BaseThinkingTemplate - 思维模板基类
// 定义了思考过程的标准步骤接口
//
// === 核心理解 ===
//
// ThinkingTemplate 本质上是一个提示词渲染器（Prompt Renderer）
// 它将 Thought 的五大要素组合成一个完整的 prompt，指导 AI 生成下一个 Thought
//
// === Thought 的五大要素（全部由 AI 生成）===
//
// 1. goalEngram - 本轮思考的目标
// 2. recalledEngrams - 基于目标检索到的相关记忆
// 3. insightEngrams - 从记忆中产生的洞察
// 4. conclusionEngram - 综合形成的结论
// 5. confidence - 对结论的置信度评估
//
// === 认知循环（递归深化）===
//
// 第1轮：AI 生成 Thought1 → think(Thought1) → 生成 prompt1
// 第2轮：prompt1 → AI → Thought2（新的五大要素）→ think(Thought2) → 生成 prompt2
// 第3轮：prompt2 → AI → Thought3（新的五大要素）→ think(Thought3) → 生成 prompt3
// ...以此类推
//
// 每一轮：
// - 输入：上一轮的 prompt
// - 输出：包含完整五大要素的新 Thought
// - 处理：通过 ThinkingTemplate 生成下一轮的 prompt
//
// === 关键设计 ===
//
// 1. 每个 Thought 都是完整的结构（包含所有五大要素）
// 2. 每个 Thought 都有新的 goalEngram（新的思考目标）
// 3. 上一轮的 conclusionEngram 可能成为下一轮的思考起点
// 4. 整个过程形成思维链（Chain of Thought）
//
// === 标准流程 ===
//
// 1. getGoalEngramGenerationPrompt - 生成目标的指导
// 2. recallEngramsByGoalEngramCues - 执行记忆检索（操作，非 prompt）
// 3. getInsightEngramsGenerationPrompt - 生成洞察的指导
// 4. getConclusionEngramGenerationPrompt - 生成结论的指导
// 5. getConfidenceGenerationPrompt - 生成置信度评估的指导
// 6. getNextThoughtGenerationPrompt - 组合以上所有，生成完整的指导 prompt

/**
 * BaseThinkingTemplate - 思维模板基类
 * 
 * 所有具体的思维模板都应该继承或实现这个接口
 */
class BaseThinkingTemplate {
  /**
   * 获取模板名称
   * @returns {string} 模板名称
   */
  getName() {
    throw new Error('BaseThinkingTemplate.getName() must be implemented');
  }

  /**
   * 生成创建 goalEngram 的 prompt
   * 
   * @param {*} input - 原始输入（可能是字符串、对象等）
   * @returns {string} 生成 goalEngram 的 prompt
   */
  getGoalEngramGenerationPrompt(input) {
    throw new Error('BaseThinkingTemplate.getGoalEngramGenerationPrompt() must be implemented');
  }

  /**
   * 基于 goalEngram 的 cues 检索记忆
   * 
   * 注意：这个方法执行实际的检索操作，不是生成 prompt
   * 
   * @param {Engram} goalEngram - 目标 Engram
   * @param {Memory} memory - 记忆服务
   * @returns {Promise<Array<Engram>>} 检索到的相关记忆
   */
  async recallEngramsByGoalEngramCues(goalEngram, memory) {
    throw new Error('BaseThinkingTemplate.recallEngramsByGoalEngramCues() must be implemented');
  }

  /**
   * 生成洞察 Engrams 的 prompt
   * 
   * @param {Engram} goalEngram - 目标 Engram
   * @param {Array<Engram>} recalledEngrams - 检索到的记忆
   * @param {Thought} previousThought - 前序思想（可选）
   * @returns {string} 生成洞察的 prompt
   */
  getInsightEngramsGenerationPrompt(goalEngram, recalledEngrams, previousThought) {
    throw new Error('BaseThinkingTemplate.getInsightEngramsGenerationPrompt() must be implemented');
  }

  /**
   * 生成结论 Engram 的 prompt
   * 
   * @param {Engram} goalEngram - 目标 Engram
   * @param {Array<Engram>} recalledEngrams - 检索到的记忆
   * @param {Array<Engram>} insightEngrams - 生成的洞察
   * @returns {string} 生成结论的 prompt
   */
  getConclusionEngramGenerationPrompt(goalEngram, recalledEngrams, insightEngrams) {
    throw new Error('BaseThinkingTemplate.getConclusionEngramGenerationPrompt() must be implemented');
  }

  /**
   * 生成置信度评估的 prompt
   * 
   * @param {Engram} goalEngram - 目标 Engram
   * @param {Array<Engram>} recalledEngrams - 检索到的记忆
   * @param {Array<Engram>} insightEngrams - 生成的洞察
   * @param {Engram} conclusionEngram - 形成的结论
   * @returns {string} 评估置信度的 prompt
   */
  getConfidenceGenerationPrompt(goalEngram, recalledEngrams, insightEngrams, conclusionEngram) {
    throw new Error('BaseThinkingTemplate.getConfidenceGenerationPrompt() must be implemented');
  }

  /**
   * 生成思考状态总览（保留用于调试）
   * @private
   */
  getThoughtStatusSummary(components) {
    const { goalEngram, recalledEngrams, insightEngrams, conclusionEngram, confidence } = components;
    
    const checkmark = '✓';
    const pending = '○';
    
    return `
| 要素 | 状态 | 内容 |
|------|------|------|
| **目标定义** | ${goalEngram ? checkmark : pending} | ${goalEngram ? goalEngram.getContent() : '待定义'} |
| **记忆检索** | ${recalledEngrams && recalledEngrams.length > 0 ? checkmark : pending} | ${recalledEngrams ? `已检索 ${recalledEngrams.length} 条相关记忆` : '待检索'} |
| **洞察生成** | ${insightEngrams && insightEngrams.length > 0 ? checkmark : pending} | ${insightEngrams ? `已生成 ${insightEngrams.length} 个洞察` : '待生成'} |
| **结论形成** | ${conclusionEngram ? checkmark : pending} | ${conclusionEngram ? '已形成' : '待形成'} |
| **置信评估** | ${confidence !== null && confidence !== undefined ? checkmark : pending} | ${confidence !== null && confidence !== undefined ? `${confidence}` : '待评估'} |
`;
  }

  /**
   * 生成下一个 Thought 的生成提示词
   * 
   * 渲染包含所有提示词的完整模板，用于指导 AI 生成下一个 Thought
   * 
   * @param {Object} components - 包含当前 Thought 的五大要素
   * @returns {string} 指导生成下一个 Thought 的完整 prompt
   */
  getNextThoughtGenerationPrompt(components) {
    const { goalEngram, recalledEngrams, insightEngrams, conclusionEngram, confidence, previousThought, iteration = 0 } = components;
    
    // 简洁的状态摘要
    const statusParts = [];
    if (goalEngram) statusParts.push(`目标: ${goalEngram.getContent()}`);
    if (recalledEngrams && recalledEngrams.length > 0) statusParts.push(`记忆: ${recalledEngrams.length}条`);
    if (insightEngrams && insightEngrams.length > 0) statusParts.push(`洞察: ${insightEngrams.length}个`);
    if (conclusionEngram) statusParts.push(`结论: ✓`);
    if (confidence !== null && confidence !== undefined) statusParts.push(`置信: ${confidence}`);
    
    const status = statusParts.join(' | ') || '初始状态';
    
    // 根据当前缺失的要素，只显示需要的指导
    let guidance = '';
    
    if (!goalEngram) {
      guidance = `## 🎯 定义思考目标\n\n${this.getGoalEngramGenerationPrompt(components.input || '请定义思考目标')}`;
    } else if (!insightEngrams || insightEngrams.length === 0) {
      guidance = `## 💡 生成推理洞察\n\n${this.getInsightEngramsGenerationPrompt(goalEngram, recalledEngrams, previousThought)}`;
    } else if (!conclusionEngram) {
      guidance = `## 📝 形成逻辑结论\n\n${this.getConclusionEngramGenerationPrompt(goalEngram, recalledEngrams, insightEngrams)}`;
    } else if (confidence === null || confidence === undefined) {
      guidance = `## 📊 评估置信度\n\n${this.getConfidenceGenerationPrompt(goalEngram, recalledEngrams, insightEngrams, conclusionEngram)}`;
    } else {
      guidance = `## ✅ 思考完成\n\n所有要素已完整。当前结论: ${conclusionEngram.getContent()}\n置信度: ${confidence}\n\n可以基于此结论开始新的思考循环。`;
    }
    
    return `# 思考指导 - ${this.getName()} [迭代 ${iteration}]

📊 状态: ${status}

${guidance}

💡 生成要求: 返回包含所需要素的 Thought 对象
`;
  }
}

module.exports = { BaseThinkingTemplate };