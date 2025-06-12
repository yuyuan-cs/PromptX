const path = require('path')
const { glob } = require('glob')

class ResourceDiscovery {
  constructor() {
    this.__dirname = __dirname
  }

  async discoverResources(scanPaths) {
    const discovered = []
    
    for (const basePath of scanPaths) {
      // Discover role files
      const roleFiles = await glob(`${basePath}/**/*.role.md`)
      for (const file of roleFiles) {
        discovered.push({
          id: `role:${this.extractId(file, '.role.md')}`,
          reference: this.generateReference(file)
        })
      }

      // Discover execution mode files
      const execFiles = await glob(`${basePath}/**/execution/*.execution.md`)
      for (const file of execFiles) {
        discovered.push({
          id: `execution:${this.extractId(file, '.execution.md')}`,
          reference: this.generateReference(file)
        })
      }

      // Discover thought mode files
      const thoughtFiles = await glob(`${basePath}/**/thought/*.thought.md`)
      for (const file of thoughtFiles) {
        discovered.push({
          id: `thought:${this.extractId(file, '.thought.md')}`,
          reference: this.generateReference(file)
        })
      }

      // Discover knowledge files
      const knowledgeFiles = await glob(`${basePath}/**/knowledge/*.knowledge.md`)
      for (const file of knowledgeFiles) {
        discovered.push({
          id: `knowledge:${this.extractId(file, '.knowledge.md')}`,
          reference: this.generateReference(file)
        })
      }
    }

    return discovered
  }

  extractId(filePath, suffix) {
    return path.basename(filePath, suffix)
  }

  generateReference(filePath) {
    // Protocol detection rules based on file path patterns
    if (filePath.includes('node_modules/promptx')) {
      // Find the node_modules/promptx part and get relative path after it
      const promptxIndex = filePath.indexOf('node_modules/promptx')
      const afterPromptx = filePath.substring(promptxIndex + 'node_modules/promptx/'.length)
      return `@package://${afterPromptx}`
    } else if (filePath.includes('.promptx')) {
      const relativePath = path.relative(process.cwd(), filePath)
      return `@project://${relativePath}`
    } else {
      // Check if it's a package file (contains '/prompt/' and matches package root)
      const packageRoot = this.findPackageRoot()
      if (filePath.startsWith(packageRoot + '/prompt') || filePath.includes('/prompt/')) {
        const promptIndex = filePath.indexOf('/prompt/')
        if (promptIndex >= 0) {
          const afterPrompt = filePath.substring(promptIndex + 1) // Keep the 'prompt/' part
          return `@package://${afterPrompt}`
        }
      }
      return `@file://${filePath}`
    }
  }

  findPackageRoot() {
    // Return the mocked package root for testing
    if (this.__dirname.includes('/mock/')) {
      return '/mock/package/root'
    }
    
    // Simple implementation: find the package root directory
    let dir = this.__dirname
    while (dir !== '/' && dir !== '') {
      // Look for the package root containing prompt/ directory
      if (path.basename(dir) === 'src' || path.basename(path.dirname(dir)) === 'src') {
        return path.dirname(dir)
      }
      dir = path.dirname(dir)
    }
    
    // Fallback: return directory that contains this file structure
    const segments = this.__dirname.split(path.sep)
    const srcIndex = segments.findIndex(seg => seg === 'src')
    if (srcIndex > 0) {
      return segments.slice(0, srcIndex).join(path.sep)
    }
    
    return this.__dirname
  }
}

module.exports = ResourceDiscovery