import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '~/lib/api'

export function useDiscover(focus: 'all' | 'roles' | 'tools' = 'all') {
  return useQuery({
    queryKey: ['discover', focus],
    queryFn: () => api.discover(focus),
  })
}

export function useActivateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (roleId: string) => api.activateRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discover'] })
    },
  })
}

export function useRecall(keywords: string[]) {
  return useQuery({
    queryKey: ['recall', keywords],
    queryFn: () => api.recall(keywords),
    enabled: keywords.length > 0,
  })
}

export function useRemember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ content, keywords }: { content: string; keywords: string[] }) =>
      api.remember(content, keywords),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recall'] })
    },
  })
}

export function useBindProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (projectPath: string) => api.bindProject(projectPath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discover'] })
    },
  })
}