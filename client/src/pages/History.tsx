import { useEffect, useState } from 'react'
import api from '../utils/api'

export default function History() {
  const [history, setHistory] = useState([])

  useEffect(() => {
    const fetchHistory = async () => {
      const res = await api.get('/execute/history')
      setHistory(res.data.history)
    }
    fetchHistory()
  }, [])

  return (
    <div className="min-h-screen bg-dots text-gray-300 p-8 font-sans relative">
      <div className="max-w-4xl mx-auto relative z-10">
        <header className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
              EXECUTION<span className="neon-text-cyan">HISTORY</span>
            </h1>
            <p className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">Mission Log Archive // Authorized Access Only</p>
          </div>
          <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center border-cyan-400/20 shadow-[0_0_20px_rgba(0,243,255,0.1)]">
            <i className="fa-solid fa-clock-rotate-left text-2xl text-cyan-400"></i>
          </div>
        </header>

        <div className="space-y-6">
          {history.length === 0 ? (
            <div className="glass-card p-20 text-center border-white/5">
              <i className="fa-solid fa-database text-6xl text-slate-800 mb-6"></i>
              <p className="text-sm font-black tracking-widest text-slate-600 uppercase">NO_RECORDS_FOUND</p>
            </div>
          ) : (
            history.map((h: any, idx: number) => (
              <div key={idx} className="glass-card p-8 border-white/5 group hover:border-cyan-400/30 transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black bg-cyan-400 text-black uppercase tracking-widest">
                      {h.language}
                    </span>
                    <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                      {new Date(h.executedAt).toLocaleString().toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[10px] font-black tracking-widest text-slate-600 uppercase">
                    STATUS: <span className="text-green-400">SUCCESS_LOGGED</span>
                  </div>
                </div>

                <div className="grid gap-6">
                  <div className="bg-black/40 rounded-xl p-6 border border-white/5">
                    <div className="text-[9px] font-black text-slate-500 mb-3 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                      SOURCE_ENCODING
                    </div>
                    <pre className="text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap max-h-48 custom-scrollbar">
                      {h.code}
                    </pre>
                  </div>

                  <div className="bg-black/40 rounded-xl p-6 border border-white/5">
                    <div className="text-[9px] font-black text-slate-500 mb-3 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                      EXECUTION_OUTPUT
                    </div>
                    <pre className="text-xs text-green-400/80 font-mono overflow-x-auto whitespace-pre-wrap max-h-48 custom-scrollbar">
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
