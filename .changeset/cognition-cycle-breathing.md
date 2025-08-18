---
"@promptx/cli": minor
---

feat: 实现认知循环呼吸引导机制

🧠 新功能：
- 创建 CognitionCycleGuide 类管理认知循环引导
- 在 BasePouchCommand 中统一处理所有引导逻辑
- 角色激活时显示循环开始引导
- Recall 时显示吸气阶段引导
- Remember 时显示呼气完成引导

🔧 技术改进：
- 重构代码遵循 DRY 原则
- 减少代码耦合，提高可维护性
- 统一管理认知循环的三个阶段

让 AI 的记忆管理像呼吸一样自然，每轮对话都是完整的认知循环。
