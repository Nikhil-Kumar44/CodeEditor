import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import logo from '../assets/logo.png'

export default function Register() {
  const { register, isLoading, error, clearError } = useAuth()
  const { show } = useToast()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (username.trim().length < 3) {
      show('Username must be at least 3 characters', 'error')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      show('Please enter a valid email address with a domain (e.g., user@example.com)', 'error')
      return
    }

    try {
      await register(username.trim(), email, password)
      show('Registered successfully', 'success')
      navigate('/rooms', { replace: true })
    } catch (err: any) {
      show(err.message || 'Registration failed', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-dots flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[radial-gradient(circle,rgba(168,85,247,0.12)_0%,transparent_70%)] z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-[radial-gradient(circle,rgba(0,243,255,0.12)_0%,transparent_70%)] z-0 pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 text-center">
        {/* Logo/Identity Section */}
        <div className="mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 glass rounded-[2rem] relative group mb-8 overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.1)]">
            <div className="absolute inset-0 bg-purple-400/10 group-hover:bg-purple-400/20 transition-colors"></div>
            <img src={logo} alt="Logo" className="w-14 h-14 object-contain relative z-10 filter drop-shadow(0 0 10px rgba(168,85,247,0.6))" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white uppercase leading-none mb-3">
            REGISTRY<span className="text-purple-400 neon-text-purple">CORE</span>
          </h1>
          <p className="text-[10px] font-black tracking-[0.4em] text-slate-500 uppercase">Initialize new biometric identity profile</p>
        </div>

        {/* Register Form Card */}
        <div className="glass-card p-10 border-white/5 shadow-[0_0_80px_rgba(0,0,0,0.4)] text-left">
          {error && (
            <div className="mb-8 text-[10px] font-black tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex justify-between items-center backdrop-blur-md animate-in slide-in-from-top-2">
              <span>SYSTEM_ERROR: {error.toUpperCase()}</span>
              <button onClick={clearError} className="text-rose-400/50 hover:text-rose-400 p-1 transition-colors">✕</button>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">AGENT_HANDLE</label>
              <div className="relative group">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  className="glass-input pl-12 pr-4 py-4 uppercase font-black tracking-widest text-[10px]"
                  placeholder="COMMANDER_CODER"
                />
                <i className="fa-solid fa-user-gear absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-purple-400 transition-colors"></i>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">UPLINK_COMM</label>
              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="glass-input pl-12 pr-4 py-4 uppercase font-black tracking-widest text-[10px]"
                  placeholder="AGENT@SECTOR.COM"
                />
                <i className="fa-regular fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-purple-400 transition-colors"></i>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">ENCRYPTION_KEY</label>
              <div className="relative group">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="glass-input pl-12 pr-4 py-4 tracking-[0.4em] text-[10px]"
                  placeholder="••••••••"
                />
                <i className="fa-solid fa-shield-halved absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-purple-400 transition-colors"></i>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-16 bg-purple-500 text-white rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all uppercase font-black tracking-[0.3em] text-xs relative overflow-hidden group mt-4 border border-purple-400/20"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                {isLoading ? (
                  <i className="fa-solid fa-circle-notch animate-spin text-sm"></i>
                ) : (
                  <>
                    INITIALIZE_ACCOUNT
                    <i className="fa-solid fa-dna text-xs group-hover:animate-pulse"></i>
                  </>
                )}
              </span>
            </button>
          </form>

          <p className="text-slate-500 text-[10px] font-black tracking-widest mt-12 text-center uppercase">
            EXISTING CITIZEN?{' '}
            <Link to="/login" className="text-purple-400 hover:text-purple-300 underline decoration-purple-400/20 underline-offset-8 transition-all">ACCESS_GATEWAY</Link>
          </p>
        </div>
      </div>
      
      <style>{`
        .neon-text-purple {
          text-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
        }
      `}</style>
    </div>
  )
}
