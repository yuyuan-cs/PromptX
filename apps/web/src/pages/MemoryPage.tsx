import { useState } from 'react'
import { useRecall, useRemember } from '~/hooks/usePromptX'
import { Brain, Search, Plus } from 'lucide-react'

export default function MemoryPage() {
  const [searchKeywords, setSearchKeywords] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newKeywords, setNewKeywords] = useState('')

  const keywords = searchKeywords.split(',').map(k => k.trim()).filter(Boolean)
  const { data: memories, isLoading } = useRecall(keywords)
  const remember = useRemember()

  const handleRemember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newContent.trim() || !newKeywords.trim()) return

    const keywordList = newKeywords.split(',').map(k => k.trim()).filter(Boolean)

    try {
      await remember.mutateAsync({ content: newContent, keywords: keywordList })
      setNewContent('')
      setNewKeywords('')
    } catch (error) {
      console.error('Failed to remember:', error)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Memory Network</h1>
          <p className="text-slate-600">
            Store and recall knowledge using the cognitive memory system
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Search className="w-5 h-5" />
                Recall Memories
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Search Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={searchKeywords}
                    onChange={(e) => setSearchKeywords(e.target.value)}
                    placeholder="keyword1, keyword2, keyword3"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {isLoading && (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent" />
                  </div>
                )}

                {!isLoading && keywords.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-slate-700">
                      Results ({memories?.length || 0})
                    </div>
                    {memories?.map((memory: any) => (
                      <div key={memory.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex flex-wrap gap-1 mb-2">
                          {memory.keywords?.map((kw: string) => (
                            <span key={kw} className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
                              {kw}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-slate-700">{memory.content}</p>
                      </div>
                    ))}
                    {memories?.length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-4">
                        No memories found for these keywords
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Brain className="w-5 h-5" />
                How Memory Works
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Memories are stored with keywords for easy retrieval</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Use multiple keywords to find related memories</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Memories build a knowledge network over time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>AI uses memories to provide contextual responses</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Remember New
            </h2>
            <form onSubmit={handleRemember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Content
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Enter the information you want to remember..."
                  rows={6}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={newKeywords}
                  onChange={(e) => setNewKeywords(e.target.value)}
                  placeholder="keyword1, keyword2, keyword3"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Add keywords that will help you recall this memory later
                </p>
              </div>

              <button
                type="submit"
                disabled={remember.isPending || !newContent.trim() || !newKeywords.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Brain className="w-4 h-4" />
                {remember.isPending ? 'Remembering...' : 'Remember'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}