# PromptX 工作流需求文档

> 本文档记录了 PromptX 项目的 GitHub Actions 工作流需求，基于实际开发需要进行设计。

## 1. 分支策略

### 1.1 固定分支与发布标签映射
- `develop` → `dev` (开发版本)
- `test` → `alpha` (内部测试版本)
- `staging` → `beta` (公开测试版本)
- `main` → `latest` (稳定版本)

**注**：采用方案A，main 分支直接对应 latest 标签，无需独立的 release 分支（奥卡姆剃刀原则）。

### 1.2 开发分支规则
- **分支类型**：`feature/*`, `fix/*`, `doc/*`
- **命名格式**：`{type}/#{issue-number}-{description}`
  - 示例：`feature/#123-add-mcp-support`
  - 示例：`fix/#456-memory-leak`
  - 示例：`doc/#789-update-readme`

### 1.3 Issue-Driven Development
- **核心原则**：所有分支必须先有对应的 Issue
- **理念**：成熟产品需要"先讨论清楚再动手"
- **当前阶段**：单人开发期采用极简流程
  - 简单 Issue 描述（一句话说清楚要做什么）
  - 规范的分支命名
  - 基本的 CI 测试

## 2. NPM 发布管理

### 2.1 发布渠道
支持5个发布标签：
- `snapshot` - 快照版本
- `dev` - 开发版本
- `alpha` - 内部测试版本
- `beta` - 公开测试版本
- `latest` - 稳定版本

### 2.2 版本管理策略
- **版本提升时机**：只在 develop 准备发布时提升版本号
- **Changeset 添加时机**：PR 审核阶段（非开发阶段）
- **版本号流转**：develop 提升后，test/staging/main 平移（版本号不变）

### 2.3 发布流程
- 使用 Changeset 进行版本管理
- PR 审核时决定 changeset 类型（具体方案待定）
- 支持 dry-run 模式测试发布
- 多重安全检查防止意外发布

## 3. PR 标签驱动系统

### 3.1 核心理念
- **标签即动作**：每个标签代表一个待执行的动作指令
- **动作 + 参数**：标签格式为 `action/parameter`
- **可组合执行**：多个标签可以叠加使用

### 3.2 动作标签分类

#### changeset/* - 版本管理动作
- `changeset/patch` - 创建 patch 版本（bug 修复）
- `changeset/minor` - 创建 minor 版本（新功能）
- `changeset/major` - 创建 major 版本（破坏性变更）
- `changeset/none` - 不需要版本变更

#### publish/* - 发布控制动作
- `publish/dev` - 合并后自动发布到 dev 标签
- `publish/alpha` - 合并后自动发布到 alpha 标签
- `publish/beta` - 合并后自动发布到 beta 标签
- `publish/hold` - 暂不发布，等待手动触发

#### test/* - 测试策略动作
- `test/skip-e2e` - 跳过 E2E 测试
- `test/extended` - 运行扩展测试集
- `test/performance` - 运行性能测试

#### merge/* - 合并策略动作
- `merge/squash` - 使用 squash 合并
- `merge/rebase` - 使用 rebase 合并
- `merge/auto` - 测试通过后自动合并

### 3.3 PR 生命周期

#### 阶段一：构造 PR（开发者）
1. 创建符合规范的 Issue
2. 基于 Issue 创建分支（`type/#{issue-number}-description`）
3. 开发完成后创建 PR
4. 填写 PR 模板信息

#### 阶段二：执行 PR（审核者）
1. 审核代码变更
2. 添加动作标签（决定版本、测试、合并策略）
3. 工作流自动执行对应动作
4. 完成合并和后续操作

## 4. 工作流需求清单

### 4.1 基础设施
- [x] GitHub Actions 本地测试环境（act 工具）
- [x] 防止意外发布的安全机制
- [ ] 分支命名规则自动校验
- [ ] PR 标签驱动系统实现

### 4.2 待实现工作流

#### 优先级：高
- [ ] PR 标签处理工作流
  - 标签动作解析和执行
  - Changeset 自动生成
  - 合并策略控制
  
- [ ] NPM 发布工作流
  - 多渠道发布（dev/alpha/beta/latest）
  - 版本号自动管理
  - 发布前后验证
  
- [ ] CI/CD 基础工作流
  - 多操作系统支持（Ubuntu、Windows、macOS）
  - 多 Node.js 版本测试（14、16、18、20）
  - 测试套件执行（unit、integration、e2e）

#### 优先级：中
- [ ] 代码质量保障工作流
  - ESLint 代码检查
  - 测试覆盖率报告
  - 依赖安全扫描
  
- [ ] 自动化辅助工作流
  - 分支名称规则检查
  - Issue 关联验证
  - PR 模板合规检查

## 5. 约束与原则

### 5.1 技术约束
- 必须支持 act 本地测试
- 工作流必须有防误操作机制
- 遵循奥卡姆剃刀原则，保持简洁

### 5.2 流程约束
- 分支必须通过 PR 合并
- 不允许直接推送到保护分支
- Issue 编号必须存在且有效
- PR 标签决定所有自动化行为

## 6. 实施计划

### 第一阶段：基础架构
1. PR 标签驱动系统
2. 分支规则检查工作流
3. 基础 CI 测试工作流

### 第二阶段：发布体系
1. Changeset 自动化管理
2. NPM 多渠道发布工作流
3. 版本号管理自动化

### 第三阶段：质量保障
1. 代码质量检查集成
2. 安全扫描和依赖管理
3. 测试覆盖率报告

### 第四阶段：优化完善
1. 性能优化和监控
2. 贡献者友好特性
3. 工作流可视化面板

---

*最后更新：2025-01-06*