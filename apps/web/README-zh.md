# PromptX Web UI

PromptX 的现代化 Web 界面 - AI 角色与工具管理平台。

## 功能特性

- 🎭 **角色管理**：浏览、搜索和激活 AI 专家角色
- 🔧 **工具浏览器**：发现和管理可用工具
- 📁 **项目集成**：绑定项目以访问项目特定资源
- 🧠 **记忆网络**：使用认知记忆系统存储和调用知识
- 🎨 **现代化 UI**：使用 React 和 Tailwind CSS 构建的简洁响应式界面

## 技术栈

- **前端**：React 18 + TypeScript
- **构建工具**：Vite
- **样式**：Tailwind CSS
- **状态管理**：Zustand
- **数据获取**：TanStack Query (React Query)
- **路由**：React Router v6

## 开发

### 前置要求

- Node.js >= 14.0.0
- pnpm (推荐)

### 设置

1. 安装依赖：
```bash
pnpm install
```

2. 启动开发服务器：
```bash
pnpm dev
```

Web UI 将在 `http://localhost:3000` 上可用。

### API 连接

Web UI 连接到运行在 `http://127.0.0.1:5203` 的 PromptX MCP 服务器。在使用 Web UI 之前，请确保服务器正在运行。

您可以使用以下方式启动服务器：
- PromptX 桌面应用（推荐）
- CLI: `npx @promptx/mcp-server`
- Docker: `docker run -p 5203:5203 deepracticexs/promptx:latest`

## 构建

为生产构建 Web UI：

```bash
pnpm build
```

构建后的文件将在 `dist` 目录中，可由任何静态文件服务器提供。

## 项目结构

```
apps/web/
├── src/
│   ├── components/     # 可复用 UI 组件
│   │   └── Layout.tsx  # 带侧边栏的主布局
│   ├── pages/          # 页面组件
│   │   ├── HomePage.tsx
│   │   ├── RolesPage.tsx
│   │   ├── ToolsPage.tsx
│   │   ├── ProjectsPage.tsx
│   │   └── MemoryPage.tsx
│   ├── lib/            # 核心工具库
│   │   ├── api.ts      # API 客户端
│   │   └── store.ts    # 全局状态
│   ├── hooks/          # 自定义 React hooks
│   │   └── usePromptX.ts
│   ├── types/          # TypeScript 类型定义
│   │   └── index.ts
│   ├── App.tsx         # 根组件
│   ├── main.tsx        # 入口点
│   └── index.css       # 全局样式
