# PromptX Web UI - 最简单的使用方法

## 🎯 一分钟上手

### 第一步：构建 Web UI
```bash
cd apps/web
npm run build    # 或者：npx vite build
```

### 第二步：启动服务
```bash
# 回到项目根目录
cd ../..

# 启动 PromptX MCP 服务器
npx @promptx/mcp-server
```

### 第三步：打开浏览器
```
http://127.0.0.1:5203/ui
```

就这么简单！🎉

## 🔍 验证是否成功

### 1. 检查服务器状态
```bash
curl http://127.0.0.1:5203/health
```

应该返回：
```json
{"status":"ok","service":"mcp-server"}
```

### 2. 在浏览器中
- 打开 `http://127.0.0.1:5203/ui`
- 按 F12 打开控制台
- 应该看到："Session initialized successfully"

## ✅ 关键改进

1. **添加了 CORS 支持** - 解决跨域问题
2. **MCP 服务器托管静态文件** - 无需单独运行开发服务器
3. **统一端口访问** - 一个 5203 端口搞定所有

## 📝 完整流程示例

```bash
# 1. 进入 web 目录
cd apps/web

# 2. 安装依赖（如果还没装）
npm install

# 3. 构建
npx vite build

# 4. 回到根目录
cd ../..

# 5. 启动服务
npx @promptx/mcp-server

# 6. 打开浏览器
# http://127.0.0.1:5203/ui
```

## 🎨 界面功能

- **Home**: 系统概览
- **Roles**: 浏览和激活 AI 角色
- **Tools**: 查看可用工具
- **Projects**: 绑定项目目录
- **Memory**: 管理知识记忆

## 🚨 如果遇到问题

### 页面打不开
```bash
# 检查服务是否运行
curl http://127.0.0.1:5203/health

# 检查端口是否被占用
lsof -i :5203
```

### 看到错误
- 打开浏览器控制台（F12）
- 查看红色错误信息
- 检查 MCP 服务器终端日志

### 角色列表为空
- 确保 `~/.promptx/` 目录存在
- 重启 MCP 服务器
- 刷新浏览器页面

## 💡 提示

- 构建一次就够了，除非你修改了代码
- MCP 服务器启动后会自动托管 Web UI
- 使用 `http://127.0.0.1:5203/ui`（不是 localhost:3000）

## 下一步

尝试激活一个角色：
1. 进入 Roles 页面
2. 点击 "Activate Role"
3. 在 Claude Desktop 中使用该角色的能力！