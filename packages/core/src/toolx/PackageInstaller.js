/**
 * PackageInstaller - 基于 pacote API 的现代包管理器
 * 
 * 使用npm官方pacote API，支持所有现代npm包特性
 * 替代@pnpm/core，解决依赖地狱和现代包兼容性问题
 */

const path = require('path');
const fs = require('fs').promises;
const logger = require('@promptx/logger');
const pacote = require('pacote');

class PackageInstaller {
  /**
   * 统一的pacote安装入口 - 保持向后兼容的API
   * @param {Object} options - 安装选项
   * @param {string} options.workingDir - 工作目录
   * @param {Object|Array} options.dependencies - 依赖列表
   * @param {number} options.timeout - 超时时间（毫秒）
   * @returns {Promise<Object>} 安装结果
   */
  static async install({ workingDir, dependencies, timeout = 30000 }) {
    const startTime = Date.now();
    
    // 构建依赖列表字符串用于日志
    const depsList = this.buildDependenciesList(dependencies);
    
    logger.info(`[PackageInstaller] Starting installation via pacote API: [${depsList}]`);
    logger.debug(`[PackageInstaller] Working directory: ${workingDir}`);
    
    try {
      // 确保工作目录存在
      await fs.mkdir(workingDir, { recursive: true });
      
      // 读取或创建package.json
      const packageJsonPath = path.join(workingDir, 'package.json');
      let manifest;
      
      try {
        const content = await fs.readFile(packageJsonPath, 'utf8');
        manifest = JSON.parse(content);
        logger.debug(`[PackageInstaller] Found existing package.json`);
      } catch (error) {
        // package.json不存在，创建默认的
        manifest = {
          name: `toolbox-${path.basename(workingDir)}`,
          version: '1.0.0',
          description: `Tool dependencies for ${path.basename(workingDir)}`,
          private: true,
          dependencies: {}
        };
        logger.debug(`[PackageInstaller] Creating new package.json`);
      }
      
      // 规范化依赖格式
      const normalizedDeps = this.normalizeDependencies(dependencies);
      
      // 创建node_modules目录
      const nodeModulesPath = path.join(workingDir, 'node_modules');
      await fs.mkdir(nodeModulesPath, { recursive: true });
      
      logger.debug(`[PackageInstaller] Installing ${Object.keys(normalizedDeps).length} dependencies`);
      
      // 使用pacote逐个安装依赖
      const installResults = {};
      const installPromises = [];
      
      for (const [name, version] of Object.entries(normalizedDeps)) {
        const installPromise = this.installPackage(nodeModulesPath, name, version, timeout)
          .then(result => {
            installResults[name] = result;
            logger.debug(`[PackageInstaller] ✓ ${name}@${result.version} installed`);
          })
          .catch(error => {
            logger.error(`[PackageInstaller] ✗ Failed to install ${name}: ${error.message}`);
            throw new Error(`Failed to install ${name}: ${error.message}`);
          });
          
        installPromises.push(installPromise);
      }
      
      // 并行安装所有依赖
      await Promise.all(installPromises);
      
      // 更新package.json中的dependencies
      manifest.dependencies = { ...manifest.dependencies, ...normalizedDeps };
      await fs.writeFile(packageJsonPath, JSON.stringify(manifest, null, 2));
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      logger.info(`[PackageInstaller] Installation completed successfully in ${elapsed}s`);
      
      return {
        success: true,
        elapsed: elapsed,
        manifest: manifest,
        environment: 'pacote-api',
        installedPackages: Object.keys(installResults),
        results: installResults
      };
      
    } catch (error) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      logger.error(`[PackageInstaller] Installation failed after ${elapsed}s: ${error.message}`);
      
      throw new Error(`pacote installation failed: ${error.message}`);
    }
  }
  
  /**
   * 安装单个包
   * @param {string} nodeModulesPath - node_modules目录路径
   * @param {string} name - 包名
   * @param {string} version - 版本
   * @param {number} timeout - 超时时间
   * @returns {Promise<Object>} 安装结果
   */
  static async installPackage(nodeModulesPath, name, version, timeout = 30000) {
    const spec = `${name}@${version}`;
    
    // 处理作用域包的目录结构
    let targetPath;
    if (name.startsWith('@')) {
      const [scope, pkgName] = name.split('/');
      const scopePath = path.join(nodeModulesPath, scope);
      await fs.mkdir(scopePath, { recursive: true });
      targetPath = path.join(scopePath, pkgName);
    } else {
      targetPath = path.join(nodeModulesPath, name);
    }
    
    // 设置超时
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Installation timeout for ${name}`)), timeout);
    });
    
    // 使用pacote获取包信息并提取
    const installPromise = (async () => {
      // 获取包的manifest信息
      const manifest = await pacote.manifest(spec);
      
      // 提取包到目标目录
      await pacote.extract(spec, targetPath);
      
      return {
        name: manifest.name,
        version: manifest.version,
        path: targetPath,
        type: manifest.type || 'commonjs',
        main: manifest.main,
        exports: manifest.exports
      };
    })();
    
    return Promise.race([installPromise, timeoutPromise]);
  }
  
  /**
   * 构建依赖列表字符串用于日志
   * @param {Object|Array} dependencies - 依赖
   * @returns {string} 格式化的依赖列表
   */
  static buildDependenciesList(dependencies) {
    if (!dependencies) return '';
    
    if (typeof dependencies === 'object' && !Array.isArray(dependencies)) {
      // 对象格式：{"package": "version"}
      return Object.keys(dependencies)
        .map(name => `${name}@${dependencies[name]}`)
        .join(', ');
    } else if (Array.isArray(dependencies)) {
      // 数组格式：["package@version"]
      return dependencies.join(', ');
    }
    
    return String(dependencies);
  }
  
  /**
   * 规范化依赖格式为对象
   * @param {Object|Array} dependencies - 原始依赖
   * @returns {Object} 规范化的依赖对象
   */
  static normalizeDependencies(dependencies) {
    if (!dependencies) return {};
    
    if (typeof dependencies === 'object' && !Array.isArray(dependencies)) {
      // 已经是对象格式
      return dependencies;
    }
    
    if (Array.isArray(dependencies)) {
      // 数组格式转对象
      const normalized = {};
      for (const dep of dependencies) {
        if (dep.includes('@')) {
          const lastAtIndex = dep.lastIndexOf('@');
          if (lastAtIndex > 0) {
            const name = dep.substring(0, lastAtIndex);
            const version = dep.substring(lastAtIndex + 1);
            normalized[name] = version;
          } else {
            normalized[dep] = 'latest';
          }
        } else {
          normalized[dep] = 'latest';
        }
      }
      return normalized;
    }
    
    return {};
  }
  
  /**
   * 创建package.json文件 - 保持向后兼容的API
   * @param {string} workingDir - 工作目录
   * @param {string} toolId - 工具ID
   * @param {Object|Array} dependencies - 依赖列表
   */
  static async createPackageJson(workingDir, toolId, dependencies) {
    const packageJsonPath = path.join(workingDir, 'package.json');
    
    const packageJson = {
      name: `toolbox-${toolId}`,
      version: '1.0.0',
      description: `Sandbox for tool: ${toolId}`,
      private: true,
      dependencies: this.normalizeDependencies(dependencies)
    };
    
    logger.debug(`[PackageInstaller] Creating package.json: ${packageJsonPath}`);
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
  
  /**
   * 检查包是否已安装
   * @param {string} workingDir - 工作目录
   * @param {string} packageName - 包名
   * @returns {Promise<boolean>} 是否已安装
   */
  static async isPackageInstalled(workingDir, packageName) {
    try {
      const packagePath = packageName.startsWith('@') 
        ? path.join(workingDir, 'node_modules', ...packageName.split('/'))
        : path.join(workingDir, 'node_modules', packageName);
        
      const packageJsonPath = path.join(packagePath, 'package.json');
      await fs.access(packageJsonPath);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * 获取已安装包的信息
   * @param {string} workingDir - 工作目录
   * @param {string} packageName - 包名
   * @returns {Promise<Object|null>} 包信息
   */
  static async getPackageInfo(workingDir, packageName) {
    try {
      const packagePath = packageName.startsWith('@')
        ? path.join(workingDir, 'node_modules', ...packageName.split('/'))
        : path.join(workingDir, 'node_modules', packageName);
        
      const packageJsonPath = path.join(packagePath, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
}

module.exports = PackageInstaller;