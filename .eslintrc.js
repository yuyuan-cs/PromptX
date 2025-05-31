module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 12
  },
  rules: {
    // 允许console.log用于CLI工具
    'no-console': 'off',
    // 允许使用require()
    '@typescript-eslint/no-var-requires': 'off'
  }
} 