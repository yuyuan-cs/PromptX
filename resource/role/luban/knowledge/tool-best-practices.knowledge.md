# 工具设计最佳实践

<knowledge>

## 🎯 工具设计哲学

### 极简主义原则
- **单一职责**：每个工具只解决一个核心问题
- **接口优雅**：参数设计直观易懂，返回值结构清晰
- **依赖最小**：只引入必要的依赖，避免过度膨胀
- **错误友好**：提供清晰的错误信息和处理建议

### 用户体验至上
- **即装即用**：工具无需复杂配置即可使用
- **文档自描述**：通过Schema和Metadata实现自我说明
- **性能优先**：执行效率和响应速度优化
- **跨平台兼容**：确保在不同环境下稳定运行

## 🏗️ 架构设计原则

### ToolInterface标准化实现
```javascript
// 完美的工具接口示例
module.exports = {
  // 🔧 依赖管理：明确、最小、版本锁定
  getDependencies() {
    return [
      'lodash@^4.17.21',    // 工具函数库
      'validator@^13.11.0'  // 数据验证
    ];
  },
  
  // 📊 元信息：完整、准确、描述性
  getMetadata() {
    return {
      name: 'text-processor',
      description: '智能文本处理工具，支持清理、格式化、验证等功能',
      version: '1.2.0',
      category: 'text-processing',
      author: '鲁班',
      tags: ['text', 'processing', 'utility']
    };
  },
  
  // 📝 Schema定义：结构化、类型安全、示例丰富
  getSchema() {
    return {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: '需要处理的文本内容',
          example: 'Hello World!'
        },
        operations: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['clean', 'format', 'validate']
          },
          description: '要执行的操作列表',
          default: ['clean']
        },
        options: {
          type: 'object',
          properties: {
            encoding: { type: 'string', default: 'utf-8' },
            strict: { type: 'boolean', default: false }
          }
        }
      },
      required: ['text']
    };
  },
  
  // ✅ 参数验证：严格、友好、早期失败
  validate(params) {
    const errors = [];
    
    if (!params.text || typeof params.text !== 'string') {
      errors.push('text参数必须是非空字符串');
    }
    
    if (params.text && params.text.length > 50000) {
      errors.push('text长度不能超过50000字符');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },
  
  // 🚀 核心执行：健壮、高效、可观测
  async execute(params) {
    const startTime = Date.now();
    
    try {
      // 核心处理逻辑
      const result = await this.processText(params);
      
      return {
        success: true,
        data: result,
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code || 'UNKNOWN_ERROR'
        },
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
};
```

## 🛡️ 安全与性能最佳实践

### 输入安全防护
```javascript
// 输入验证模式
class InputValidator {
  static validateText(text, maxLength = 10000) {
    if (typeof text !== 'string') {
      throw new Error('输入必须是字符串类型');
    }
    
    if (text.length > maxLength) {
      throw new Error(`文本长度超过限制: ${maxLength}`);
    }
    
    // XSS防护
    if (/<script|javascript:|on\w+=/i.test(text)) {
      throw new Error('检测到潜在的恶意脚本');
    }
    
    return true;
  }
  
  static sanitizeFilename(filename) {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '');
  }
}
```

### 性能优化模式
```javascript
// 缓存机制
const cache = new Map();
const CACHE_TTL = 300000; // 5分钟

function withCache(fn, cacheKey) {
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const result = fn();
  cache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });
  
  return result;
}

// 资源控制
function withResourceLimit(fn, timeout = 30000) {
  return Promise.race([
    fn(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('执行超时')), timeout)
    )
  ]);
}
```

## 📦 依赖管理策略

### 精选依赖原则
```javascript
// 工具库选择矩阵
const DEPENDENCY_MATRIX = {
  // 基础工具函数
  utilities: {
    recommended: 'lodash@^4.17.21',
    alternatives: ['ramda@^0.29.0', 'underscore@^1.13.0'],
    criteria: '成熟度、包大小、功能覆盖'
  },
  
  // HTTP请求
  http: {
    recommended: 'axios@^1.6.0',
    alternatives: ['node-fetch@^3.3.0', 'got@^13.0.0'],
    criteria: '易用性、功能丰富度、兼容性'
  },
  
  // 数据验证
  validation: {
    recommended: 'validator@^13.11.0',
    alternatives: ['joi@^17.11.0', 'yup@^1.3.0'],
    criteria: '验证规则丰富度、性能、学习成本'
  },
  
  // 文件操作
  filesystem: {
    recommended: 'fs-extra@^11.1.0',
    alternatives: ['graceful-fs@^4.2.11'],
    criteria: '功能完整性、错误处理、跨平台'
  }
};

// 依赖版本策略
getDependencies() {
  return [
    'lodash@^4.17.21',      // 主版本锁定，次版本兼容
    'axios@~1.6.0',        // 补丁版本兼容
    'validator@13.11.0'     // 精确版本锁定（关键依赖）
  ];
}
```

## 🧪 测试驱动开发

### 工具测试模式
```javascript
// 标准测试模板
describe('TextProcessor Tool', () => {
  let tool;
  
  beforeEach(() => {
    tool = require('./text-processor.tool.js');
  });
  
  describe('接口合规性测试', () => {
    test('必须实现所有接口方法', () => {
      expect(typeof tool.getDependencies).toBe('function');
      expect(typeof tool.getMetadata).toBe('function');
      expect(typeof tool.getSchema).toBe('function');
      expect(typeof tool.validate).toBe('function');
      expect(typeof tool.execute).toBe('function');
    });
    
    test('getDependencies返回格式正确', () => {
      const deps = tool.getDependencies();
      expect(Array.isArray(deps)).toBe(true);
      deps.forEach(dep => {
        expect(typeof dep).toBe('string');
        expect(dep).toMatch(/^[a-zA-Z0-9-]+@[\^~]?\d+\.\d+\.\d+$/);
      });
    });
  });
  
  describe('功能测试', () => {
    test('正常输入处理', async () => {
      const result = await tool.execute({
        text: 'Hello World',
        operations: ['clean']
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
    
    test('异常输入处理', async () => {
      const result = await tool.execute({
        text: null
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
```

## 📊 质量保证体系

### 代码质量检查
```javascript
// ESLint配置示例
module.exports = {
  env: { node: true, es2021: true },
  extends: ['eslint:recommended'],
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'complexity': ['warn', 10],
    'max-lines-per-function': ['warn', 50]
  }
};
```

### 性能基准测试
```javascript
// 性能测试模板
function benchmarkTool(tool, testData) {
  const iterations = 1000;
  const start = process.hrtime.bigint();
  
  for (let i = 0; i < iterations; i++) {
    tool.execute(testData);
  }
  
  const end = process.hrtime.bigint();
  const avgTime = Number(end - start) / iterations / 1000000; // ms
  
  return {
    iterations,
    averageTime: avgTime,
    totalTime: Number(end - start) / 1000000
  };
}
```

## 🌟 卓越工具特征

### 用户体验指标
- **启动时间** < 100ms
- **执行效率** < 1s（常规任务）
- **内存占用** < 50MB
- **错误恢复** 100%优雅处理

### 代码质量指标
- **圈复杂度** < 10
- **测试覆盖率** > 90%
- **依赖漏洞** 0个
- **文档完整度** 100%

### 生态贡献指标
- **复用性** 高（可被其他工具引用）
- **扩展性** 强（支持插件机制）
- **社区认可** 正面反馈 > 95%
- **维护活跃度** 定期更新

</knowledge>