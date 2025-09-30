import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '~/lib/api'
import { Search, Package, FolderOpen, User, ExternalLink } from 'lucide-react'
import clsx from 'clsx'

export default function ToolsPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['tools'],
    queryFn: () => api.listTools(),
  })

  const tools = data?.tools || []

  const filteredTools = tools.filter((tool: any) => {
    return tool.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           tool.description?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Available Tools</h1>
          <p className="text-slate-600">
            Functional tools to extend your AI capabilities
          </p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.map((tool: any) => (
              <ToolCard key={tool.name} tool={tool} />
            ))}
          </div>
        )}

        {!isLoading && filteredTools.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No tools found</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ToolCard({ tool }: any) {
  const getToolSource = (name: string) => {
    if (['discover', 'action', 'project', 'recall', 'remember', 'toolx'].includes(name)) {
      return 'system'
    }
    return 'user'
  }

  const source = getToolSource(tool.name)

  const sourceIcons = {
    system: Package,
    project: FolderOpen,
    user: User,
  }

  const sourceColors = {
    system: 'text-blue-600 bg-blue-50',
    project: 'text-green-600 bg-green-50',
    user: 'text-purple-600 bg-purple-50',
  }

  const SourceIcon = sourceIcons[source]

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:border-slate-300 transition-all">
      <div className="flex items-start gap-3 mb-3">
        <div className={clsx('p-2 rounded-lg', sourceColors[source])}>
          <SourceIcon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 mb-1">{tool.name}</h3>
          <span className="text-xs text-slate-500 capitalize">{source}</span>
        </div>
      </div>

      <p className="text-sm text-slate-600 mb-4 line-clamp-3">
        {tool.description || 'No description available'}
      </p>

      {tool.inputSchema && (
        <div className="mb-4">
          <div className="text-xs font-medium text-slate-700 mb-2">Parameters:</div>
          <div className="space-y-1">
            {Object.entries(tool.inputSchema.properties || {}).map(([key, value]: any) => (
              <div key={key} className="text-xs text-slate-600 flex items-center gap-2">
                <code className="bg-slate-100 px-1.5 py-0.5 rounded">{key}</code>
                <span className="text-slate-400">-</span>
                <span className="text-slate-500">{value.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors text-sm">
        <ExternalLink className="w-4 h-4" />
        View Documentation
      </button>
    </div>
  )
}