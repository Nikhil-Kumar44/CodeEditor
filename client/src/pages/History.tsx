import { useEffect, useState } from 'react'
import api from '../utils/api'
import { Link } from 'react-router-dom'

export default function History() {
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/execute/history')
        setHistory(res.data.history)
      } catch (err) {
        console.error("Failed to fetch history", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchHistory()
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 p-4 md:p-8 font-sans relative">
      <div className="max-w-4xl mx-auto relative z-10">
        <header className="mb-10 flex items-center justify-between border-b border-zinc-800 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link to="/rooms" className="text-zinc-500 hover:text-white transition-colors">
                <i className="fa-solid fa-arrow-left"></i>
              </Link>
              <h1 className="text-2xl font-semibold tracking-tight text-white m-0">
                Execution History
              </h1>
            </div>
            <p className="text-sm font-medium text-zinc-500">View your past code executions and outputs.</p>
          </div>
        </header>

        <div className="space-y-6">
          {isLoading ? (
            <div className="py-20 flex justify-center">
               <i className="fa-solid fa-circle-notch animate-spin text-zinc-500 text-2xl"></i>
            </div>
          ) : history.length === 0 ? (
            <div className="glass-card p-16 text-center border-zinc-800">
              <i className="fa-solid fa-code-commit text-4xl text-zinc-700 mb-6"></i>
              <p className="text-sm font-medium text-zinc-500">No execution history found.</p>
            </div>
          ) : (
            history.map((h: any, idx: number) => (
              <div key={idx} className="glass-card p-6 border-zinc-800 hover:bg-zinc-900/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 text-xs font-semibold capitalize border border-blue-500/20">
                      {h.language}
                    </span>
                    <span className="text-xs font-medium text-zinc-500">
                      {new Date(h.executedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-zinc-500 flex items-center gap-2">
                    Status: <span className="text-green-400 flex items-center gap-1"><i className="fa-solid fa-check-circle text-[10px]"></i> Success</span>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="bg-zinc-950 rounded-lg p-5 border border-zinc-800/50">
                    <div className="text-xs font-semibold text-zinc-400 mb-3 flex items-center gap-2">
                      Code Snippet
                    </div>
                    <pre className="text-sm text-zinc-300 font-mono overflow-x-auto whitespace-pre-wrap max-h-48 custom-scrollbar">
                      {h.code}
                    </pre>
                  </div>

                  <div className="bg-zinc-950 rounded-lg p-5 border border-zinc-800/50">
                    <div className="text-xs font-semibold text-zinc-400 mb-3 flex items-center gap-2">
                      Output Result
                    </div>
                    <pre className="text-sm text-green-400/90 font-mono overflow-x-auto whitespace-pre-wrap max-h-48 custom-scrollbar">
                      {h.output}
                    </pre>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
