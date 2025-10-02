import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'mcp-server': 'src/bin/mcp-server.ts',  // 平铺到 dist/mcp-server.js
    'worker': 'src/workers/worker.ts'  // 平铺到 dist/worker.js
  },
  format: ['esm'],
  dts: false, // 暂时禁用，有类型错误需要修复
  sourcemap: true,
  clean: true,
  target: 'es2020',
  outDir: 'dist',
  esbuildOptions(options) {
    // 配置别名解析
    options.alias = {
      '~': './src'
    }
  },
  // 不打包外部依赖
  external: [
    '@promptx/core',
    '@promptx/logger',
    'fastmcp',
    'zod',
    'express',
    '@modelcontextprotocol/sdk',
    'crypto'
  ]
})