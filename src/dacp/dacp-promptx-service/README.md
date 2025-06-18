# DACP PromptX Service

统一的 DACP 服务，提供多个 demo actions 供 PromptX 调用。

## 功能特性

- 📧 **Email Action**: 智能邮件发送功能
- 📅 **Calendar Action**: 会议日程管理
- 📄 **Document Action**: 文档创建和管理
- 🚀 **更多 Actions**: 持续扩展中...

## 启动方式

### 1. 独立启动 DACP 服务

```bash
cd src/dacp/dacp-promptx-service
npm start
```

服务将在 http://localhost:3002 启动。

### 2. 通过 MCP 自动启动（推荐）

```bash
# 在项目根目录
promptx mcp-server --with-dacp
```

这将同时启动 MCP Server 和 DACP 服务。

## API 接口

### DACP 协议接口

POST http://localhost:3002/dacp

请求格式：
```json
{
  "service_id": "dacp-promptx-service",
  "action": "send_email",
  "parameters": {
    "user_request": "给张三发个会议提醒邮件",
    "context": {
      "urgency": "high"
    }
  }
}
```

## 支持的 Actions

1. **send_email** - 发送邮件
   - 自然语言邮件内容解析
   - 智能主题识别
   - 专业邮件格式生成

2. **schedule_meeting** - 安排会议
   - 时间解析
   - 参会人员管理
   - 会议议程生成

3. **create_document** - 创建文档
   - 多种文档模板
   - 智能内容生成
   - Markdown 格式输出

## 开发指南

### 添加新的 Action

1. 在 `actions/` 目录下创建新文件
2. 导出 action 函数
3. 实现 DACP 协议规范

示例：
```javascript
// actions/custom.js
async function custom_action(parameters) {
  const { user_request, context } = parameters;
  // 实现逻辑
  return {
    // 返回结果
  };
}

module.exports = { custom_action };
```

## 测试

```bash
# 运行测试
npm test
```

## 配置

配置文件：`dacp.config.json`

主要配置项：
- `service.id`: 服务标识
- `deployment.port`: 服务端口
- `capabilities.actions`: 支持的 actions 列表