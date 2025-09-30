import { create } from 'zustand'
import type { Role, Project } from '~/types'

interface AppState {
  activeRole: Role | null
  setActiveRole: (role: Role | null) => void

  activeProject: Project | null
  setActiveProject: (project: Project | null) => void

  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  activeRole: null,
  setActiveRole: (role) => set({ activeRole: role }),

  activeProject: null,
  setActiveProject: (project) => set({ activeProject: project }),

  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}))