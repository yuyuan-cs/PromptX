import * as path from 'path'
import * as fs from 'fs'
import type { Resource, ResourceRegistry, ResourcePackage } from './types'

// 包根目录 - 构建后 registry.json 会被复制到这里
const packageRoot = path.join(__dirname, '..')

// 注册表路径
const registryPath = path.join(packageRoot, 'registry.json')

// 加载注册表
let registry: ResourceRegistry

try {
  if (fs.existsSync(registryPath)) {
    const content = fs.readFileSync(registryPath, 'utf-8')
    registry = JSON.parse(content) as ResourceRegistry
    
    // 验证版本
    if (registry.version !== '2.0.0') {
      throw new Error(`Unsupported registry version: ${registry.version}`)
    }
  } else {
    throw new Error('Registry file not found')
  }
} catch (error: any) {
  console.warn('[@promptx/resource] Failed to load registry:', error.message)
  // 提供空注册表作为后备
  registry = {
    version: '2.0.0',
    source: 'package',
    metadata: {
      version: '2.0.0',
      description: 'package 级资源注册表',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resourceCount: 0
    },
    resources: []
  }
}

/**
 * 获取资源的绝对路径
 */
export function getResourcePath(relativePath: string): string {
  // 处理相对路径
  if (!relativePath.startsWith('resources/')) {
    relativePath = `resources/${relativePath}`
  }
  return path.join(packageRoot, relativePath)
}

/**
 * 根据 ID 查找资源
 */
export function findResourceById(id: string): Resource | undefined {
  if (!registry || !Array.isArray(registry.resources)) return undefined
  return registry.resources.find(r => r.id === id)
}

/**
 * 根据协议类型获取资源列表
 */
export function getResourcesByProtocol(protocol: string): Resource[] {
  if (!registry || !Array.isArray(registry.resources)) return []
  return registry.resources.filter(r => r.protocol === protocol)
}

/**
 * 获取所有资源列表
 */
export function getAllResources(): Resource[] {
  if (!registry || !Array.isArray(registry.resources)) return []
  return registry.resources
}

// 导出包信息
const resourcePackage: ResourcePackage = {
  registry,
  getResourcePath,
  findResourceById,
  getResourcesByProtocol,
  getAllResources
}

// CommonJS 导出（兼容性）
module.exports = resourcePackage

// ES Module 导出
export { registry }
export default resourcePackage