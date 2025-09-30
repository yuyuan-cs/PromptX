import { useState } from 'react'
import { useDiscover, useActivateRole } from '~/hooks/usePromptX'
import { useAppStore } from '~/lib/store'
import { Search, Sparkles, Package, FolderOpen, User as UserIcon } from 'lucide-react'
import clsx from 'clsx'
import type { Role } from '~/types'

export default function RolesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSource, setSelectedSource] = useState<'all' | 'system' | 'project' | 'user'>('all')

  const { data, isLoading } = useDiscover('roles')
  const activateRole = useActivateRole()
  const { activeRole, setActiveRole } = useAppStore()

  const filteredRoles = data?.roles.filter((role) => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSource = selectedSource === 'all' || role.source === selectedSource
    return matchesSearch && matchesSource
  })

  const handleActivateRole = async (role: Role) => {
    try {
      await activateRole.mutateAsync(role.id)
      setActiveRole(role)
    } catch (error) {
      console.error('Failed to activate role:', error)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Expert Roles</h1>
          <p className="text-slate-600">
            Activate professional roles to transform your AI into industry experts
          </p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            {[
              { value: 'all', label: 'All', icon: Sparkles },
              { value: 'system', label: 'System', icon: Package },
              { value: 'project', label: 'Project', icon: FolderOpen },
              { value: 'user', label: 'User', icon: UserIcon },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setSelectedSource(value as any)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                  selectedSource === value
                    ? 'bg-primary-500 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRoles?.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                isActive={activeRole?.id === role.id}
                onActivate={() => handleActivateRole(role)}
                isActivating={activateRole.isPending}
              />
            ))}
          </div>
        )}

        {!isLoading && filteredRoles?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No roles found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}

function RoleCard({ role, isActive, onActivate, isActivating }: any) {
  const sourceIcons: Record<string, any> = {
    system: Package,
    project: FolderOpen,
    user: UserIcon,
  }

  const sourceColors: Record<string, string> = {
    system: 'text-blue-600 bg-blue-50',
    project: 'text-green-600 bg-green-50',
    user: 'text-purple-600 bg-purple-50',
  }

  const SourceIcon = sourceIcons[role.source] || Package

  return (
    <div
      className={clsx(
        'bg-white rounded-xl border p-6 transition-all',
        isActive
          ? 'border-primary-500 ring-2 ring-primary-100'
          : 'border-slate-200 hover:border-slate-300'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={clsx('p-2 rounded-lg', sourceColors[role.source] || sourceColors.system)}>
            <SourceIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{role.name}</h3>
            <span className="text-xs text-slate-500 capitalize">{role.source}</span>
          </div>
        </div>
        {isActive && (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Active
          </span>
        )}
      </div>

      <p className="text-sm text-slate-600 mb-4 line-clamp-2">{role.description}</p>

      <button
        onClick={onActivate}
        disabled={isActive || isActivating}
        className={clsx(
          'w-full py-2 px-4 rounded-lg font-medium transition-colors',
          isActive
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-primary-500 text-white hover:bg-primary-600'
        )}
      >
        {isActive ? 'Activated' : isActivating ? 'Activating...' : 'Activate Role'}
      </button>
    </div>
  )
}