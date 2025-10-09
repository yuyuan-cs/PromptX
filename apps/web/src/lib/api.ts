import type { DiscoverResponse, Role, Memory } from '~/types'

const API_BASE = window.location.pathname.startsWith('/ui') ? '' : '/api'
const SESSION_ID_HEADER = 'mcp-session-id'

class PromptXAPI {
  private sessionId: string | null = null
  private initPromise: Promise<void> | null = null

  async ensureSession(): Promise<void> {
    if (this.sessionId) return

    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = this.initSession()
    return this.initPromise
  }

  private async initSession(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {
              roots: {
                listChanged: true
              },
              sampling: {}
            },
            clientInfo: {
              name: 'promptx-web-ui',
              version: '1.0.0'
            }
          },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Initialize failed:', errorText)
        throw new Error(`Failed to initialize session: ${response.statusText}`)
      }

      const sessionId = response.headers.get(SESSION_ID_HEADER)
      
      // Parse SSE response
      const text = await response.text()
      const lines = text.split('\n')
      let data = null
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.substring(6)
          data = JSON.parse(jsonStr)
          break
        }
      }

      console.log('Initialize response:', data)
      console.log('Session ID from header:', sessionId)

      if (!sessionId) {
        throw new Error('No session ID in response headers')
      }

      this.sessionId = sessionId
      console.log('Session initialized successfully:', this.sessionId)
    } catch (error) {
      console.error('Session initialization error:', error)
      this.initPromise = null
      throw error
    }
  }

  async callMCP<T = any>(method: string, params?: Record<string, any>): Promise<T> {
    await this.ensureSession()

    if (!this.sessionId) {
      throw new Error('No active session')
    }

    const response = await fetch(`${API_BASE}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        [SESSION_ID_HEADER]: this.sessionId,
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

    // Parse SSE response
    const text = await response.text()
    const lines = text.split('\n')
    let data = null
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.substring(6)
        data = JSON.parse(jsonStr)
        break
      }
    }

    if (!data) {
      throw new Error('No data in response')
    }

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

  disconnect(): void {
    this.sessionId = null
    this.initPromise = null
  }
}

export const api = new PromptXAPI()