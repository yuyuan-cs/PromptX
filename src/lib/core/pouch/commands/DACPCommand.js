const BasePouchCommand = require('../BasePouchCommand');
const http = require('http');
const fs = require('fs');
const path = require('path');

/**
 * DACP服务调用命令
 * 负责调用DACP服务，实现从AI建议到AI行动的转换
 * 
 * 🔧 当前实现：Mock模式（本地函数调用）
 * 🌐 HTTP模式代码保留作为参考实现
 */
class DACPCommand extends BasePouchCommand {
  constructor() {
    super();
    
    // 统一的DACP服务端点
    // 所有service_id都路由到同一个服务
    this.defaultEndpoint = 'http://localhost:3002/dacp';
    
    // 🔧 永久使用Mock模式（本地函数调用）
    // 不再支持HTTP模式，简化架构复杂度
    this.useMockMode = true;
  }

  /**
   * 验证参数格式
   * @param {Object} args - 参数对象
   */
  validateArgs(args) {
    if (!args.service_id) {
      throw new Error('缺少必需参数: service_id');
    }
    
    if (!args.action) {
      throw new Error('缺少必需参数: action');
    }
    
    if (!args.parameters) {
      throw new Error('缺少必需参数: parameters');
    }
    
    if (!args.parameters.user_request) {
      throw new Error('缺少必需参数: parameters.user_request');
    }
  }

  /**
   * 获取服务端点（HTTP模式 - 仅作参考实现保留）
   * @deprecated 当前使用Mock模式，此方法仅保留作为参考
   * @param {string} serviceId - 服务ID
   * @returns {string} 服务端点URL
   */
  getServiceEndpoint(serviceId) {
    // 现在所有服务都指向同一个端点
    // serviceId 只是用来在DACP服务内部路由到不同的action
    return this.defaultEndpoint;
  }

  /**
   * 执行DACP服务调用（内部方法）
   * @param {Object} args - 调用参数
   * @returns {Promise<Object>} DACP响应
   */
  async callDACPService(args) {
    try {
      // 验证参数
      this.validateArgs(args);
      
      const { service_id, action, parameters } = args;
      
      // 🔧 直接使用本地Mock调用
      return await this.callLocalService(args);
      
    } catch (error) {
      // 统一错误处理
      if (error.message.startsWith('缺少必需参数') || 
          error.message.startsWith('未找到DACP服务') ||
          error.message.startsWith('DACP响应解析失败')) {
        throw error;
      }
      
      throw new Error(`DACP服务调用失败: ${error.message}`);
    }
  }

  /**
   * 本地服务调用（Mock模式）
   * @param {Object} args - 调用参数
   * @returns {Promise<Object>} DACP标准响应
   */
  async callLocalService(args) {
    const startTime = Date.now();
    const { service_id, action, parameters } = args;
    const request_id = `req_${Date.now()}`;
    
    try {
      // 1. 读取DACP配置
      const configPath = path.join(__dirname, '../../../dacp/dacp-promptx-service/dacp.config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // 2. 验证service_id
      if (service_id !== config.service.id) {
        throw new Error(`Service ${service_id} not found. This is ${config.service.id}`);
      }
      
      // 3. 动态加载actions
      const actionsDir = path.join(__dirname, '../../../dacp/dacp-promptx-service/actions');
      const actions = {};
      
      if (fs.existsSync(actionsDir)) {
        fs.readdirSync(actionsDir).forEach(file => {
          if (file.endsWith('.js')) {
            const actionName = file.replace('.js', '');
            actions[actionName] = require(path.join(actionsDir, file));
          }
        });
      }
      
      // 4. 查找action处理器
      let handler = null;
      
      // 先按模块名查找
      for (const [moduleName, module] of Object.entries(actions)) {
        if (module[action] && typeof module[action] === 'function') {
          handler = module[action];
          break;
        }
      }
      
      // 找不到则按精确匹配查找
      if (!handler && actions[action]) {
        handler = actions[action];
      }
      
      if (!handler) {
        throw new Error(`Action ${action} is not supported`);
      }
      
      // 5. 执行action
      const result = await handler(parameters);
      
      // 6. 返回DACP标准格式响应
      return {
        request_id: request_id,
        success: true,
        data: {
          execution_result: result,
          evaluation: {
            constraint_compliance: true,
            rule_adherence: true,
            guideline_alignment: true
          },
          applied_guidelines: [
            'DACP protocol standard',
            'Local mock execution'
          ],
          performance_metrics: {
            execution_time: `${Date.now() - startTime}ms`,
            resource_usage: 'minimal'
          }
        }
      };
      
    } catch (error) {
      return {
        request_id: request_id,
        success: false,
        error: {
          code: error.message.includes('not found') ? 'INVALID_SERVICE' : 
                 error.message.includes('not supported') ? 'UNKNOWN_ACTION' : 'EXECUTION_ERROR',
          message: error.message
        }
      };
    }
  }

  /**
   * 发送HTTP请求（HTTP模式 - 仅作参考实现保留）
   * @deprecated 当前使用Mock模式，此方法仅保留作为参考
   * @param {string} url - 请求URL
   * @param {Object} data - 请求数据
   * @returns {Promise<Object>} 响应数据
   */
  makeHttpRequest(url, data) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(JSON.stringify(data))
        }
      };

      const req = http.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const result = JSON.parse(responseData);
            resolve(result);
          } catch (error) {
            reject(new Error(`DACP响应解析失败: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(JSON.stringify(data));
      req.end();
    });
  }

  // BasePouchCommand的抽象方法实现（虽然不会被用到）
  getPurpose() {
    return '调用DACP专业服务，让PromptX角色拥有执行能力';
  }

  async getContent(args) {
    try {
      // 处理参数：如果是数组，取第一个元素；否则直接使用
      const dacpArgs = Array.isArray(args) ? args[0] : args;
      
      // 执行DACP调用
      const result = await this.callDACPService(dacpArgs);
      
      // 格式化响应
      if (result.success) {
        const executionResult = result.data.execution_result;
        const metrics = result.data.performance_metrics;
        return `🚀 DACP服务调用成功 (🔧 本地Mock模式)

📋 执行结果:
${JSON.stringify(executionResult, null, 2)}

⏱️ 性能指标:
- 执行时间: ${metrics.execution_time}
- 资源使用: ${metrics.resource_usage}

🎯 请求ID: ${result.request_id}`;
      } else {
        return `❌ DACP服务调用失败

错误信息: ${result.error?.message || '未知错误'}
错误代码: ${result.error?.code || 'UNKNOWN'}

🎯 请求ID: ${result.request_id}`;
      }
    } catch (error) {
      return `❌ DACP服务调用异常

错误详情: ${error.message}
运行模式: 🔧 本地Mock模式

💡 请检查:
1. DACP action模块是否存在
2. 服务ID是否正确
3. 操作名称是否有效
4. 参数格式是否正确`;
    }
  }

  getPATEOAS(args) {
    return {
      currentState: 'dacp_ready',
      nextActions: []
    };
  }
}

module.exports = DACPCommand;