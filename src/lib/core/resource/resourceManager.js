const ResourceProtocolParser = require('./resourceProtocolParser');
const ResourceRegistry = require('./resourceRegistry');
const { ResourceResult } = require('./types');
const logger = require('../../utils/logger');

/**
 * 资源管理器
 * 基于DPML资源协议的统一资源管理入口
 */
class ResourceManager {
  constructor(options = {}) {
    this.parser = new ResourceProtocolParser();
    this.registry = new ResourceRegistry();
    this.workingDirectory = options.workingDirectory || process.cwd();
    
    // 暂时直接实现简单的加载功能，后续可扩展为独立组件
    this.cache = new Map();
    this.enableCache = options.enableCache !== false;
  }

  /**
   * 解析并获取资源
   * @param {string} resourceRef - DPML资源引用
   * @param {object} options - 选项
   * @returns {Promise<ResourceResult>} 资源结果
   */
  async resolve(resourceRef, options = {}) {
    try {
      logger.debug(`Resolving resource: ${resourceRef}`);
      
      // 1. 解析资源引用
      const parsed = this.parser.parse(resourceRef);
      logger.debug(`Parsed reference:`, parsed);

      // 2. 通过注册表解析路径
      const resolvedPath = this.registry.resolve(parsed.protocol, parsed.path);
      logger.debug(`Resolved path: ${resolvedPath}`);

      // 3. 处理可能的嵌套引用
      if (resolvedPath.startsWith('@')) {
        logger.debug(`Detected nested reference: ${resolvedPath}`);
        return await this.resolve(resolvedPath, options);
      }

      // 4. 加载资源内容
      let content = await this.loadResource(resolvedPath, parsed, options);
      
      // 5. 检查内容是否是另一个资源引用（用于嵌套引用）
      if (content.trim().startsWith('@')) {
        logger.debug(`Content is a nested reference: ${content.trim()}`);
        return await this.resolve(content.trim(), options);
      }
      
      // 6. 创建结果
      const result = ResourceResult.success(content, {
        originalRef: resourceRef,
        resolvedPath: resolvedPath,
        protocol: parsed.protocol,
        loadingSemantics: parsed.loadingSemantics,
        queryParams: parsed.queryParams.getAll()
      });

      result.sources = [resolvedPath];
      result.format = options.format || 'text';

      logger.debug(`Resource resolved successfully`);
      return result;

    } catch (error) {
      logger.error(`Failed to resolve resource ${resourceRef}:`, error.message);
      return ResourceResult.error(error, { originalRef: resourceRef });
    }
  }

  /**
   * 批量解析多个资源
   * @param {string[]} resourceRefs - 资源引用列表
   * @param {object} options - 选项
   * @returns {Promise<ResourceResult[]>} 资源结果列表
   */
  async resolveMultiple(resourceRefs, options = {}) {
    const results = [];
    
    for (const ref of resourceRefs) {
      const result = await this.resolve(ref, options);
      results.push(result);
    }
    
    return results;
  }

  /**
   * 加载单个资源
   * @param {string} resourcePath - 资源路径
   * @param {ParsedReference} parsed - 解析后的引用
   * @param {object} options - 选项
   * @returns {Promise<string>} 资源内容
   */
  async loadResource(resourcePath, parsed, options = {}) {
    // 检查缓存
    const cacheKey = `${resourcePath}:${JSON.stringify(parsed.queryParams.getAll())}`;
    if (this.enableCache && this.cache.has(cacheKey)) {
      logger.debug(`Cache hit for: ${cacheKey}`);
      return this.cache.get(cacheKey);
    }

    let content = '';

    // 根据协议类型加载资源
    if (parsed.protocol === 'file' || resourcePath.startsWith('/') || resourcePath.includes('./')) {
      content = await this.loadFileResource(resourcePath, parsed.queryParams);
    } else if (parsed.protocol === 'http' || parsed.protocol === 'https') {
      content = await this.loadHttpResource(resourcePath, parsed.queryParams);
    } else if (parsed.protocol === 'prompt') {
      // prompt协议通过注册表已经解析为文件路径
      content = await this.loadFileResource(resourcePath, parsed.queryParams);
    } else {
      throw new Error(`Unsupported protocol: ${parsed.protocol}`);
    }

    // 应用查询参数过滤
    content = this.applyQueryParams(content, parsed.queryParams);

    // 缓存结果
    if (this.enableCache) {
      this.cache.set(cacheKey, content);
    }

    return content;
  }

  /**
   * 加载文件资源
   * @param {string} filePath - 文件路径
   * @param {QueryParams} queryParams - 查询参数
   * @returns {Promise<string>} 文件内容
   */
  async loadFileResource(filePath, queryParams) {
    const fs = require('fs').promises;
    const path = require('path');

    // 处理相对路径
    let fullPath = filePath;
    if (!path.isAbsolute(filePath)) {
      fullPath = path.resolve(this.workingDirectory, filePath);
    }

    // 处理通配符
    if (fullPath.includes('*')) {
      return await this.loadGlobPattern(fullPath, queryParams);
    }

    // 读取单个文件
    try {
      const content = await fs.readFile(fullPath, 'utf8');
      return content;
    } catch (error) {
      throw new Error(`Failed to read file ${fullPath}: ${error.message}`);
    }
  }

  /**
   * 加载通配符模式的文件
   * @param {string} pattern - 通配符模式
   * @param {QueryParams} queryParams - 查询参数
   * @returns {Promise<string>} 合并后的内容
   */
  async loadGlobPattern(pattern, queryParams) {
    const fs = require('fs').promises;
    const path = require('path');
    const { glob } = require('glob');

    try {
      const files = await glob(pattern, { nodir: true });

      if (files.length === 0) {
        return '';
      }

      // 排序文件
      files.sort();

      const contents = [];
      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf8');
          const relativePath = path.relative(this.workingDirectory, file);
          
          // 添加文件分隔符
          const separator = '='.repeat(80);
          const header = `### 文件: ${relativePath}`;
          contents.push(`${separator}\n${header}\n${separator}\n\n${content}`);
        } catch (error) {
          logger.warn(`Failed to read file ${file}: ${error.message}`);
        }
      }

      return contents.join('\n\n');
    } catch (error) {
      throw new Error(`Glob pattern error: ${error.message}`);
    }
  }

  /**
   * 加载HTTP资源
   * @param {string} url - URL地址
   * @param {QueryParams} queryParams - 查询参数
   * @returns {Promise<string>} 响应内容
   */
  async loadHttpResource(url, queryParams) {
    // 简单实现，实际项目中可以使用axios等库
    const https = require('https');
    const http = require('http');
    
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https://') ? https : http;
      
      client.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve(data);
        });
      }).on('error', (err) => {
        reject(new Error(`HTTP request failed: ${err.message}`));
      });
    });
  }

  /**
   * 应用查询参数过滤
   * @param {string} content - 原始内容
   * @param {QueryParams} queryParams - 查询参数
   * @returns {string} 处理后的内容
   */
  applyQueryParams(content, queryParams) {
    let result = content;

    // 处理行范围过滤
    if (queryParams.line) {
      result = this.applyLineFilter(result, queryParams.line);
    }

    return result;
  }

  /**
   * 应用行范围过滤
   * @param {string} content - 内容
   * @param {string} lineRange - 行范围 "5-10"
   * @returns {string} 过滤后的内容
   */
  applyLineFilter(content, lineRange) {
    const lines = content.split('\n');
    
    if (lineRange.includes('-')) {
      const [start, end] = lineRange.split('-').map(n => parseInt(n.trim()));
      if (!isNaN(start) && !isNaN(end)) {
        // 转换为0基索引，并确保范围有效
        const startIdx = Math.max(0, start - 1);
        const endIdx = Math.min(lines.length, end);
        return lines.slice(startIdx, endIdx).join('\n');
      }
    } else {
      const lineNum = parseInt(lineRange);
      if (!isNaN(lineNum) && lineNum > 0 && lineNum <= lines.length) {
        return lines[lineNum - 1];
      }
    }
    
    return content;
  }

  /**
   * 验证资源引用
   * @param {string} resourceRef - 资源引用
   * @returns {boolean} 是否有效
   */
  isValidReference(resourceRef) {
    try {
      const parsed = this.parser.parse(resourceRef);
      return this.registry.validateReference(parsed.protocol, parsed.path);
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取注册表信息
   * @param {string} protocol - 协议名（可选）
   * @returns {object} 注册表信息
   */
  getRegistryInfo(protocol) {
    if (protocol) {
      return this.registry.getProtocolInfo(protocol);
    }
    return this.registry.getRegistryInfo();
  }

  /**
   * 列出可用协议
   * @returns {string[]} 协议列表
   */
  listProtocols() {
    return this.registry.listProtocols();
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
    logger.debug('Resource cache cleared');
  }
}

module.exports = ResourceManager; 