const fs = require('fs')

class ResourceRegistry {
  constructor() {
    this.index = new Map()
  }

  loadFromFile(registryPath = 'src/resource.registry.json') {
    const data = JSON.parse(fs.readFileSync(registryPath, 'utf8'))
    
    if (!data.protocols) {
      return
    }
    
    for (const [protocol, info] of Object.entries(data.protocols)) {
      if (info.registry) {
        for (const [id, resourceInfo] of Object.entries(info.registry)) {
          const reference = typeof resourceInfo === 'string' 
            ? resourceInfo 
            : resourceInfo.file
          
          if (reference) {
            this.index.set(`${protocol}:${id}`, reference)
          }
        }
      }
    }
  }

  register(id, reference) {
    this.index.set(id, reference)
  }

  resolve(resourceId) {
    // 1. Direct lookup - exact match has highest priority
    if (this.index.has(resourceId)) {
      return this.index.get(resourceId)
    }

    // 2. Backward compatibility: try adding protocol prefixes
    // Order matters: role > thought > execution > memory
    const protocols = ['role', 'thought', 'execution', 'memory']
    
    for (const protocol of protocols) {
      const fullId = `${protocol}:${resourceId}`
      if (this.index.has(fullId)) {
        return this.index.get(fullId)
      }
    }

    throw new Error(`Resource '${resourceId}' not found`)
  }
}

module.exports = ResourceRegistry