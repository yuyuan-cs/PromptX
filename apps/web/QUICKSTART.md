# PromptX Web UI 快速启动指南

## 问题解决

### 错误: "Bad Request: session ID required for SSE"

这是因为 Web UI 需要正确连接到 PromptX MCP 服务器。我已经修复了 API 客户端以正确处理会话初始化。

### 启动步骤

#### 1. 确保 PromptX 服务正在运行

```bash
# 使用桌面应用（推荐）
# 下载并运行 PromptX Desktop，服务会自动启动

# 或使用 npx
npx @promptx/mcp-server

# 服务应运行在 http://127.0.0.1:5203
```

验证服务是否运行：
```bash
curl http://127.0.0.1:5203/health
```

应该返回类似：
```json
{
  "status": "ok",
  "service": "mcp-server",
  "transport": "http"
}
```

#### 2. 启动 Web UI

```bash
cd apps/web
npm install  # 如果还没安装
npm run dev
```

#### 3. 访问应用

打开浏览器访问: http://localhost:3000

## API 连接说明

Web UI 现在使用正确的 MCP 协议连接：

1. **会话初始化**: 首次请求时自动发送 `initialize` 方法建立会话
2. **会话 ID**: 服务器返回会话 ID 存储在客户端
3. **后续请求**: 所有请求在 `mcp-session-id` 头中携带会话 ID

## 测试连接

打开浏览器开发者工具（F12），在 Console 中查看：
- ✅ "Session initialized successfully: [session-id]" - 连接成功
- ❌ 如果看到错误，检查 PromptX 服务是否正在运行

## 功能说明

### Home 页面
- 查看系统统计
- 快速入门指南

### Roles 页面
- 浏览所有可用角色
- 搜索和筛选角色（系统/项目/用户）
- 一键激活角色

### Tools 页面
- 查看所有可用工具
- 浏览工具参数

### Projects 页面
- 绑定项目目录
- 访问项目特定资源

### Memory 页面
- 存储和检索记忆
- 构建知识网络

## 常见问题

### Q: 页面显示"No active session"
**A**: 等待几秒让会话初始化完成，或刷新页面

### Q: 角色列表为空
**A**:
1. 确认 PromptX 服务正在运行
2. 检查 `~/.promptx/` 目录是否存在
3. 查看浏览器 Console 是否有错误

### Q: 如何查看详细日志
**A**:
1. 打开浏览器开发者工具（F12）
2. 切换到 Console 标签
3. 查看 API 请求和响应日志

## 开发说明

修改代码后，Vite 会自动热重载。无需重启开发服务器。

如果需要重新构建：
```bash
npm run build
```

构建输出在 `dist/` 目录。

## 下一步

- 尝试激活 Nuwa 角色创建自定义专家
- 尝试激活 Luban 角色开发工具
- 使用 Memory 功能构建知识库
- 绑定项目访问项目特定资源