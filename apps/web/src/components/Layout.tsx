import { Outlet, NavLink } from 'react-router-dom'
import { Hop as Home, Users, Wrench, FolderOpen, Brain, Menu } from 'lucide-react'
import { useAppStore } from '~/lib/store'
import clsx from 'clsx'

export default function Layout() {
  const { sidebarCollapsed, toggleSidebar, activeRole } = useAppStore()

  const navItems = [
    { to: '/home', icon: Home, label: 'Home' },
    { to: '/roles', icon: Users, label: 'Roles' },
    { to: '/tools', icon: Wrench, label: 'Tools' },
    { to: '/projects', icon: FolderOpen, label: 'Projects' },
    { to: '/memory', icon: Brain, label: 'Memory' },
  ]

  return (
    <div className="flex h-screen bg-slate-50">
      <aside
        className={clsx(
          'bg-white border-r border-slate-200 transition-all duration-300 flex flex-col',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg" />
              <span className="font-bold text-lg text-slate-900">PromptX</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {activeRole && !sidebarCollapsed && (
          <div className="p-4 border-t border-slate-200">
            <div className="text-xs font-medium text-slate-500 mb-1">Active Role</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-slate-900">{activeRole.name}</span>
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}