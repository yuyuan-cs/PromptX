const path = require('path')
const fs = require('fs')

class ProtocolResolver {
  constructor() {
    this.packageRoot = null
    this.__dirname = __dirname
  }

  parseReference(reference) {
    // 支持 @、@!、@? 三种加载语义前缀
    const match = reference.match(/^@([!?]?)(\w+):\/\/(.+)$/)
    if (!match) {
      throw new Error(`Invalid reference format: ${reference}`)
    }
    
    const loadingSemantic = match[1] || '' // '', '!', 或 '?'
    const protocol = match[2]
    const resourcePath = match[3]
    
    return {
      loadingSemantic,
      protocol,
      resourcePath,
      fullReference: reference
    }
  }

  async resolve(reference) {
    const { protocol, resourcePath, loadingSemantic } = this.parseReference(reference)
    
    switch (protocol) {
      case 'package':
        return this.resolvePackage(resourcePath)
      case 'project':
        return this.resolveProject(resourcePath)
      case 'file':
        return this.resolveFile(resourcePath)
      default:
        throw new Error(`Unsupported protocol: ${protocol}`)
    }
  }

  async resolvePackage(relativePath) {
    if (!this.packageRoot) {
      this.packageRoot = await this.findPackageRoot()
    }
    return path.resolve(this.packageRoot, relativePath)
  }

  resolveProject(relativePath) {
    return path.resolve(process.cwd(), relativePath)
  }

  resolveFile(filePath) {
    return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath)
  }

  async findPackageRoot() {
    let dir = this.__dirname
    while (dir !== path.parse(dir).root) {
      const packageJson = path.join(dir, 'package.json')
      if (fs.existsSync(packageJson)) {
        const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'))
        if (pkg.name === 'promptx' || pkg.name === 'dpml-prompt') {
          return dir
        }
      }
      dir = path.dirname(dir)
    }
    throw new Error('PromptX package root not found')
  }
}

module.exports = ProtocolResolver