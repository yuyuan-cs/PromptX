import { useState } from 'react'
import { useBindProject } from '~/hooks/usePromptX'
import { useAppStore } from '~/lib/store'
import { FolderOpen, Plus, CircleCheck as CheckCircle } from 'lucide-react'

export default function ProjectsPage() {
  const [projectPath, setProjectPath] = useState('')
  const bindProject = useBindProject()
  const { activeProject, setActiveProject } = useAppStore()

  const handleBindProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectPath.trim()) return

    try {
      await bindProject.mutateAsync(projectPath)
      setActiveProject({
        id: projectPath,
        name: projectPath.split('/').pop() || projectPath,
        path: projectPath,
        active: true,
      })
      setProjectPath('')
    } catch (error) {
      console.error('Failed to bind project:', error)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Projects</h1>
          <p className="text-slate-600">
            Bind projects to access project-specific roles and tools
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Bind New Project</h2>
          <form onSubmit={handleBindProject} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Project Path
              </label>
              <input
                type="text"
                value={projectPath}
                onChange={(e) => setProjectPath(e.target.value)}
                placeholder="/path/to/your/project"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="mt-2 text-xs text-slate-500">
                Enter the absolute path to your project directory
              </p>
            </div>

            <button
              type="submit"
              disabled={bindProject.isPending || !projectPath.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              {bindProject.isPending ? 'Binding...' : 'Bind Project'}
            </button>
          </form>
        </div>

        {activeProject && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Active Project</h2>
            <div className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="p-3 bg-green-100 rounded-lg">
                <FolderOpen className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900">{activeProject.name}</h3>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-sm text-slate-600 mb-2">{activeProject.path}</p>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Active
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">What happens when you bind a project?</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>PromptX scans the project's <code className="bg-blue-100 px-1.5 py-0.5 rounded">.promptx/resource</code> directory</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>Project-specific roles and tools become available for activation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>AI gains context about your project structure and conventions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>You can use project-specific workflows and automations</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}