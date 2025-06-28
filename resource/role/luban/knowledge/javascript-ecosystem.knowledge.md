# JavaScript生态系统精通

<knowledge>

## 🚀 现代JavaScript精通

### ES6+核心特性
```javascript
// 解构赋值与默认参数
function createTool({ name, version = '1.0.0', dependencies = [] }) {
  return { name, version, dependencies };
}

// 箭头函数与Promise
const processAsync = async (data) => {
  const results = await Promise.all(
    data.map(item => processItem(item))
  );
  return results.filter(Boolean);
};

// 模板字符串与标签函数
function sqlQuery(strings, ...values) {
  return strings.reduce((query, string, i) => {
    const value = values[i] ? sanitize(values[i]) : '';
    return query + string + value;
  }, '');
}

// 类与继承
class ToolBase {
  constructor(name) {
    this.name = name;
    this.startTime = Date.now();
  }
  
  async execute(params) {
    throw new Error('子类必须实现execute方法');
  }
  
  getExecutionTime() {
    return Date.now() - this.startTime;
  }
}

// Symbol与迭代器
const PRIVATE_KEY = Symbol('private');
class Tool {
  constructor() {
    this[PRIVATE_KEY] = { cache: new Map() };
  }
  
  *[Symbol.iterator]() {
    yield* this.getResults();
  }
}
```

### 异步编程精通
```javascript
// Promise链式处理
function processChain(data) {
  return Promise.resolve(data)
    .then(validate)
    .then(transform)
    .then(save)
    .catch(handleError)
    .finally(cleanup);
}

// async/await错误处理
async function safeExecute(fn, ...args) {
  try {
    const result = await fn(...args);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 并发控制
class ConcurrencyManager {
  constructor(limit = 3) {
    this.limit = limit;
    this.running = 0;
    this.queue = [];
  }
  
  async execute(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }
  
  async process() {
    if (this.running >= this.limit || this.queue.length === 0) {
      return;
    }
    
    this.running++;
    const { fn, resolve, reject } = this.queue.shift();
    
    try {
      const result = await fn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.process();
    }
  }
}

// 超时控制
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('操作超时')), ms)
  );
  return Promise.race([promise, timeout]);
}
```

## 📦 npm生态系统精通

### package.json深度配置
```json
{
  "name": "my-awesome-tool",
  "version": "1.0.0",
  "description": "一个很棒的工具",
  "main": "index.js",
  "engines": {
    "node": ">=14.0.0",
    "npm": ">=6.0.0"
  },
  "scripts": {
    "start": "node index.js",
    "test": "jest",
    "lint": "eslint .",
    "format": "prettier --write .",
    "preinstall": "node scripts/check-env.js"
  },
  "dependencies": {
    "lodash": "^4.17.21",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "eslint": "^8.0.0",
    "prettier": "^2.8.0"
  },
  "peerDependencies": {
    "react": ">=16.8.0"
  },
  "optionalDependencies": {
    "fsevents": "^2.3.0"
  },
  "keywords": ["tool", "automation", "utility"],
  "author": "鲁班 <luban@promptx.ai>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/promptx/awesome-tool.git"
  },
  "bugs": {
    "url": "https://github.com/promptx/awesome-tool/issues"
  },
  "homepage": "https://github.com/promptx/awesome-tool#readme"
}
```

### 版本管理策略
```javascript
// 语义化版本控制
const semver = require('semver');

function updateVersion(currentVersion, changeType) {
  switch (changeType) {
    case 'patch':   // 1.0.0 -> 1.0.1 (bug fixes)
      return semver.inc(currentVersion, 'patch');
    case 'minor':   // 1.0.0 -> 1.1.0 (new features)
      return semver.inc(currentVersion, 'minor');
    case 'major':   // 1.0.0 -> 2.0.0 (breaking changes)
      return semver.inc(currentVersion, 'major');
    default:
      throw new Error('无效的版本类型');
  }
}

// 版本兼容性检查
function checkCompatibility(required, current) {
  return semver.satisfies(current, required);
}
```

### 依赖管理最佳实践
```javascript
// 依赖安全检查
const auditDependencies = async () => {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  try {
    const { stdout } = await execAsync('npm audit --json');
    const auditResult = JSON.parse(stdout);
    
    if (auditResult.vulnerabilities) {
      console.warn('发现安全漏洞:', auditResult.vulnerabilities);
    }
    
    return auditResult;
  } catch (error) {
    console.error('安全审计失败:', error.message);
  }
};

// 依赖大小分析
const analyzeBundleSize = (packageName) => {
  const bundlePhobia = require('bundle-phobia');
  return bundlePhobia.getPackageStats(packageName);
};

// 依赖树分析
const analyzeDependencyTree = () => {
  const fs = require('fs');
  const packageLock = JSON.parse(fs.readFileSync('package-lock.json'));
  
  function walkDependencies(deps, level = 0) {
    for (const [name, info] of Object.entries(deps)) {
      console.log('  '.repeat(level) + `${name}@${info.version}`);
      if (info.dependencies) {
        walkDependencies(info.dependencies, level + 1);
      }
    }
  }
  
  walkDependencies(packageLock.dependencies);
};
```

## 🔧 模块系统精通

### CommonJS深度应用
```javascript
// 模块导出模式
// 1. 单一导出
module.exports = class Tool {
  execute() { /* ... */ }
};

// 2. 多重导出
module.exports = {
  Tool,
  ToolManager,
  createTool: (config) => new Tool(config)
};

// 3. 动态导出
const tools = {};
const toolFiles = fs.readdirSync('./tools');
toolFiles.forEach(file => {
  const name = path.basename(file, '.js');
  tools[name] = require(`./tools/${file}`);
});
module.exports = tools;

// 4. 条件导出
if (process.env.NODE_ENV === 'development') {
  module.exports.debug = require('./debug');
}
```

### require缓存机制
```javascript
// 缓存清理
function clearRequireCache(modulePath) {
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
}

// 热重载实现
class HotReloader {
  constructor() {
    this.watchers = new Map();
  }
  
  watch(modulePath, callback) {
    const watcher = fs.watch(modulePath, () => {
      clearRequireCache(modulePath);
      const newModule = require(modulePath);
      callback(newModule);
    });
    
    this.watchers.set(modulePath, watcher);
  }
  
  unwatch(modulePath) {
    const watcher = this.watchers.get(modulePath);
    if (watcher) {
      watcher.close();
      this.watchers.delete(modulePath);
    }
  }
}

// 模块路径解析
function resolveModule(moduleName, fromPath) {
  const Module = require('module');
  const originalResolveFilename = Module._resolveFilename;
  
  return originalResolveFilename.call(Module, moduleName, {
    id: fromPath,
    filename: fromPath,
    paths: Module._nodeModulePaths(path.dirname(fromPath))
  });
}
```

## 🛠️ 开发工具精通

### ESLint配置优化
```javascript
// .eslintrc.js
module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:security/recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['security'],
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-non-literal-fs-filename': 'warn'
  },
  overrides: [
    {
      files: ['*.test.js', '*.spec.js'],
      rules: {
        'no-console': 'off'
      }
    }
  ]
};
```

### Prettier格式化配置
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### Jest测试框架
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};

// 测试示例
describe('Tool', () => {
  let tool;
  
  beforeEach(() => {
    tool = new Tool();
  });
  
  afterEach(async () => {
    await tool.cleanup();
  });
  
  test('should execute successfully', async () => {
    const result = await tool.execute({ input: 'test' });
    expect(result).toHaveProperty('success', true);
  });
  
  test('should handle errors gracefully', async () => {
    await expect(tool.execute({})).rejects.toThrow('Missing input');
  });
  
  test('should validate parameters', () => {
    const validation = tool.validate({ input: 'valid' });
    expect(validation.valid).toBe(true);
  });
});
```

## 🔒 安全编程实践

### 输入验证与清理
```javascript
const validator = require('validator');

class InputValidator {
  static sanitizeString(input, maxLength = 1000) {
    if (typeof input !== 'string') {
      throw new Error('输入必须是字符串');
    }
    
    // 长度限制
    if (input.length > maxLength) {
      throw new Error(`输入长度超过限制: ${maxLength}`);
    }
    
    // XSS防护
    return validator.escape(input);
  }
  
  static validateEmail(email) {
    if (!validator.isEmail(email)) {
      throw new Error('无效的邮箱地址');
    }
    return validator.normalizeEmail(email);
  }
  
  static validateURL(url) {
    if (!validator.isURL(url)) {
      throw new Error('无效的URL');
    }
    return url;
  }
  
  static sanitizeFilename(filename) {
    // 移除危险字符
    return filename.replace(/[^a-zA-Z0-9._-]/g, '');
  }
}
```

### 错误处理与日志
```javascript
class ToolLogger {
  constructor(toolName) {
    this.toolName = toolName;
    this.startTime = Date.now();
  }
  
  info(message, data = {}) {
    console.log(JSON.stringify({
      level: 'info',
      tool: this.toolName,
      message,
      data,
      timestamp: new Date().toISOString()
    }));
  }
  
  error(message, error = {}) {
    console.error(JSON.stringify({
      level: 'error',
      tool: this.toolName,
      message,
      error: {
        message: error.message,
        stack: error.stack
      },
      timestamp: new Date().toISOString()
    }));
  }
  
  performance(operation, duration) {
    this.info(`Performance: ${operation}`, { duration });
  }
}
```

### 资源管理与限制
```javascript
class ResourceManager {
  constructor(options = {}) {
    this.maxMemory = options.maxMemory || 100 * 1024 * 1024; // 100MB
    this.maxExecutionTime = options.maxExecutionTime || 30000; // 30s
    this.activeOperations = new Set();
  }
  
  async executeWithLimits(operation, context) {
    const operationId = Math.random().toString(36);
    this.activeOperations.add(operationId);
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('操作超时'));
      }, this.maxExecutionTime);
    });
    
    try {
      // 内存监控
      const initialMemory = process.memoryUsage().heapUsed;
      
      const result = await Promise.race([
        operation(),
        timeoutPromise
      ]);
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryUsed = finalMemory - initialMemory;
      
      if (memoryUsed > this.maxMemory) {
        console.warn(`内存使用超限: ${memoryUsed / 1024 / 1024}MB`);
      }
      
      return result;
    } finally {
      this.activeOperations.delete(operationId);
    }
  }
  
  getActiveOperations() {
    return this.activeOperations.size;
  }
}
```

</knowledge>