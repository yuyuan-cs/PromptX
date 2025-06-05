module.exports = {
  // 测试环境
  testEnvironment: 'node',
  
  // 测试目录
  testMatch: [
    '<rootDir>/src/tests/**/*.test.js'
  ],
  
  // 覆盖率配置
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/lib/**/*.js',
    'src/bin/**/*.js',
    '!src/tests/**',
    '!**/node_modules/**',
    '!**/fixtures/**'
  ],
  
  // 覆盖率阈值 - 设置为最低要求
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10
    }
  },
  
  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  
  // 项目配置 - 分离不同类型的测试
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/tests/**/*.unit.test.js'],
      testEnvironment: 'node'
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/src/tests/**/*.integration.test.js'],
      testEnvironment: 'node'
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/src/tests/**/*.e2e.test.js'],
      testEnvironment: 'node'
    }
  ],
  
  // 模块路径映射
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/src/tests/$1'
  },
  
  // 全局变量
  globals: {
    TEST_TIMEOUT: 30000
  },
  
  // 详细输出
  verbose: true,
  
  // 并发测试 - 减少并发以避免资源竞争
  maxWorkers: 1,
  
  // 增加超时时间 - 移到项目配置中
  
  // 失败重试 - Jest 29不支持，移除此配置
  // jest: {
  //   retries: 2
  // },
  
  // CI环境优化
  detectOpenHandles: true,
  forceExit: true
}; 