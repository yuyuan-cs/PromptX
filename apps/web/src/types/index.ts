export interface Role {
  id: string
  name: string
  description: string
  source: 'system' | 'project' | 'user'
  category?: string
  tags?: string[]
}

export interface Tool {
  id: string
  name: string
  description: string
  source: 'system' | 'project' | 'user'
  manual?: string
  parameters?: Record<string, any>
}

export interface Project {
  id: string
  name: string
  path: string
  active: boolean
}

export interface Memory {
  id: string
  keyword: string
  content: string
  connections: string[]
  timestamp: number
  roleId?: string
}

export interface DiscoverResponse {
  roles: Role[]
  tools: Tool[]
  statistics: {
    totalRoles: number
    totalTools: number
    systemRoles: number
    projectRoles: number
    userRoles: number
    systemTools: number
    projectTools: number
    userTools: number
  }
}