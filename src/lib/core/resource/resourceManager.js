const fs = require('fs')
const ResourceRegistry = require('./resourceRegistry')
const ProtocolResolver = require('./ProtocolResolver')
const ResourceDiscovery = require('./ResourceDiscovery')

class ResourceManager {
  constructor() {
    this.registry = new ResourceRegistry()
    this.resolver = new ProtocolResolver()
    this.discovery = new ResourceDiscovery()
  }

  async initialize() {
    // 1. Load static registry from resource.registry.json
    this.registry.loadFromFile('src/resource.registry.json')

    // 2. Discover dynamic resources from scan paths
    const scanPaths = [
      'prompt/', // Package internal resources
      '.promptx/', // Project resources
      process.env.PROMPTX_USER_DIR // User resources
    ].filter(Boolean) // Remove undefined values

    const discovered = await this.discovery.discoverResources(scanPaths)

    // 3. Register discovered resources (don't overwrite static registry)
    for (const resource of discovered) {
      if (!this.registry.index.has(resource.id)) {
        this.registry.register(resource.id, resource.reference)
      }
    }
  }

  async loadResource(resourceId) {
    try {
      // 1. Resolve resourceId to @reference through registry
      const reference = this.registry.resolve(resourceId)
      
      // 2. Resolve @reference to file path through protocol resolver
      const filePath = await this.resolver.resolve(reference)
      
      // 3. Load file content from file system
      const content = fs.readFileSync(filePath, 'utf8')

      return {
        success: true,
        content,
        path: filePath,
        reference
      }
    } catch (error) {
      return {
        success: false,
        error: error,
        message: error.message
      }
    }
  }

  // Backward compatibility method for existing code
  async resolve(resourceUrl) {
    try {
      await this.initialize()
      
      // Handle old format: role:java-backend-developer or @package://...
      if (resourceUrl.startsWith('@')) {
        // Parse the reference to check if it's a custom protocol
        const parsed = this.resolver.parseReference(resourceUrl)
        
        // Check if it's a basic protocol that ProtocolResolver can handle directly
        const basicProtocols = ['package', 'project', 'file']
        if (basicProtocols.includes(parsed.protocol)) {
          // Direct protocol format - use ProtocolResolver
          const filePath = await this.resolver.resolve(resourceUrl)
          const content = fs.readFileSync(filePath, 'utf8')
          return {
            success: true,
            content,
            path: filePath,
            reference: resourceUrl
          }
        } else {
          // Custom protocol - extract resource ID and use ResourceRegistry
          const resourceId = `${parsed.protocol}:${parsed.resourcePath}`
          return await this.loadResource(resourceId)
        }
      } else {
        // Legacy format: treat as resource ID
        return await this.loadResource(resourceUrl)
      }
    } catch (error) {
      return {
        success: false,
        error: error,
        message: error.message
      }
    }
  }
}

module.exports = ResourceManager