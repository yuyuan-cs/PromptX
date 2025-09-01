# PromptX MCP Server Docker - NPX Strategy for Maximum Reliability
# Theorem: npx ensures deterministic version resolution and minimal attack surface

FROM node:20-alpine

# 安全性不变式：非root用户执行
RUN addgroup -g 1001 -S nodejs
RUN adduser -S promptx -u 1001

# 工作目录
WORKDIR /home/promptx

# Node 18自带的npm已足够npx使用

# 切换到非特权用户
USER promptx

# 健康检查：验证HTTP MCP服务器可用性
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5203 || exit 1

# 暴露MCP服务器端口（如果使用HTTP模式）
EXPOSE 5203

# 设置默认环境变量（可通过docker run覆盖）
ENV TRANSPORT=http
ENV HOST=0.0.0.0  
ENV PORT=5203

# 动态启动脚本，根据环境变量构建参数
CMD npx -y @promptx/mcp-server --transport ${TRANSPORT} --host ${HOST} --port ${PORT}