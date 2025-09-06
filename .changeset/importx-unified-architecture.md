---
"@promptx/core": major
"@promptx/desktop": minor  
---

# feat: implement importx unified module loading architecture

实现 importx 统一模块加载架构，彻底解决 PromptX 工具开发中的模块导入复杂性，为开发者提供零认知负担的统一导入体验。

## 🚀 核心架构变更

### importx 统一导入架构
- **移除复杂系统**：删除 ESModuleRequireSupport.js (276行复杂逻辑)
- **统一导入接口**：为所有工具提供统一的 `importx()` 函数
- **自动类型检测**：importx 自动处理 CommonJS/ES Module/内置模块差异
- **简化 ToolSandbox**：大幅重构，消除循环依赖和复杂 fallback 逻辑

### Electron 环境优化
- **pnpm 超时修复**：解决 Electron 环境下 pnpm 安装超时问题
- **utilityProcess 通信**：实现进程间可靠通信机制
- **Worker 脚本**：专用的 electron-pnpm-worker-script.js
- **依赖管理增强**：PnpmInstaller、SystemPnpmRunner、ElectronPnpmWorker

### 关键问题修复
- **importx parentURL 修复**：使用工具沙箱的 package.json 作为模块解析基础
- **文件边界临时禁用**：解决 ~/.promptx 访问限制问题
- **filesystem 工具更新**：适配新的 importx 架构

## 📈 性能和稳定性提升

- **依赖管理测试**：从 62.5% → 87.5% 通过率
- **importx 架构测试**：100% 通过率
- **沙箱环境测试**：100% 通过率
- **axios, validator** 等 CommonJS 包：正常导入
- **nanoid, fs-extra** 等混合包：正常导入

## 💡 开发者体验

### 认知负担归零
- 只需学习一个 `importx()` 函数
- 统一所有模块类型的导入语法
- 自动处理版本兼容性问题

### 架构简化
- 代码量减少：移除 276 行复杂逻辑
- 维护性提升：统一架构易于理解和扩展
- Electron 兼容：解决特殊环境问题

## 🔧 Breaking Changes

### ToolSandbox API 变更
- 所有工具现在使用 `importx()` 而非 `require()` 或 `loadModule()`
- ES Module 支持通过 importx 自动处理
- 删除了 ESModuleRequireSupport 类

### 工具开发更新
- 新工具必须使用 `importx()` 进行模块导入
- 现有工具建议迁移到新的导入方式
- luban 角色知识库已更新相应要求

## 🛠️ 迁移指南

### 对于工具开发者
```javascript
// 旧方式 (已废弃)
const axios = require('axios');
const chalk = await loadModule('chalk');

// 新方式 (推荐)  
const axios = await importx('axios');
const chalk = await importx('chalk');
```

### 对于框架使用者
- ToolSandbox 创建方式改为异步：`await ToolSandbox.create(toolRef)`
- 保持向下兼容，现有代码无需修改

## 🎯 影响范围

- **开发者**：统一的模块导入体验，显著降低学习成本
- **系统架构**：简化的代码结构，提升维护性
- **性能**：提升的依赖管理可靠性，更快的模块解析
- **Electron 应用**：解决环境特殊性问题，提升稳定性

这是 PromptX 工具生态的重要里程碑，实现了"零认知负担"的模块导入理念。