import type { DiscoverResponse, Role, Memory } from '~/types'

const API_BASE = '/api'

class PromptXAPI {
  async callMCP<T = any>(method: string, params?: Record<string, any>): Promise<T> {
    const response = await fetch(`${API_BASE}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params: params || {},
      }),
    })

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message || 'API error')
    }

    return data.result
  }

  async discover(focus: 'all' | 'roles' | 'tools' = 'all'): Promise<DiscoverResponse> {
    const result = await this.callMCP('tools/call', {
      name: 'discover',
      arguments: { focus },
    })

    return this.parseDiscoverResult(result)
  }

  async activateRole(roleId: string): Promise<any> {
    return this.callMCP('tools/call', {
      name: 'action',
      arguments: { role: roleId },
    })
  }

  async recall(keywords: string[]): Promise<Memory[]> {
    const result = await this.callMCP('tools/call', {
      name: 'recall',
      arguments: { keywords },
    })

    return this.parseMemoryResult(result)
  }

  async remember(content: string, keywords: string[]): Promise<any> {
    return this.callMCP('tools/call', {
      name: 'remember',
      arguments: { content, keywords },
    })
  }

  async bindProject(projectPath: string): Promise<any> {
    return this.callMCP('tools/call', {
      name: 'project',
      arguments: { path: projectPath },
    })
  }

  async listTools(): Promise<any> {
    return this.callMCP('tools/list')
  }

  private parseDiscoverResult(result: any): DiscoverResponse {
    const content = result?.content?.[0]?.text || result?.text || JSON.stringify(result)

    const roles: Role[] = []
    const tools: any[] = []

    const statistics = {
      totalRoles: 0,
      totalTools: 0,
      systemRoles: 0,
      projectRoles: 0,
      userRoles: 0,
      systemTools: 0,
      projectTools: 0,
      userTools: 0,
    }

    const roleMatches = content.matchAll(/📦|🏗️|👤.*?-\s+(\w+):\s+(.+?)(?=\n|$)/g)
    for (const match of roleMatches) {
      const [full, id, description] = match
      const source = full.includes('📦') ? 'system' : full.includes('🏗️') ? 'project' : 'user'

      roles.push({
        id,
        name: id,
        description,
        source,
      })
    }

    statistics.totalRoles = roles.length
    statistics.systemRoles = roles.filter(r => r.source === 'system').length
    statistics.projectRoles = roles.filter(r => r.source === 'project').length
    statistics.userRoles = roles.filter(r => r.source === 'user').length

    return {
      roles,
      tools,
      statistics,
    }
  }

  private parseMemoryResult(_result: any): Memory[] {
    const memories: Memory[] = []

    return memories
  }
}

export const api = new PromptXAPI()