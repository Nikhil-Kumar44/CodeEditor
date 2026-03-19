import { useState, FormEvent } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useToast } from '../contexts/ToastContext'
import api from '../utils/api'
import logo from '../assets/logo.png'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { show } = useToast()
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()

    if (password !== confirmPassword) {
      show('Passwords do not match', 'error')
      return
    }

    if (password.length < 6) {
      show('Password must be at least 6 characters', 'error')
      return
    }

    setIsLoading(true)

    try {
      const { data } = await api.put(`/auth/resetpassword/${token}`, { password })
      if (data.success) {
        show('Password reset successfully', 'success')
        navigate('/login', { replace: true })
      } else {
        show('Failed to reset password', 'error')
      }
    } catch (err: any) {
      show(err.response?.data?.message || err.message || 'Failed to reset password', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dots text-gray-300 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(0,243,255,0.1)_0%,transparent_70%)] z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(168,85,247,0.1)_0%,transparent_70%)] z-0 pointer-events-none"></div>

      <div className="relative w-full max-w-md z-10">
        {/* Logo/Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 glass rounded-3xl relative group mb-6 overflow-hidden">
            <div className="absolute inset-0 bg-cyan-400/10 transition-colors"></div>
            <img src={logo} alt="Logo" className="w-12 h-12 object-contain relative z-10 filter drop-shadow(0 0 8px rgba(0,243,255,0.5))" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
            NEW<span className="neon-text-cyan">CREDENTIALS</span>
          </h1>
          <p className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">Override Security Protocols</p>
        </div>

        {/* Card */}
        <div className="glass-card p-10 border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.3)]">
          <form onSubmit={onSubmit} className="space-y-8">
            <div className="space-y-3">
              <label htmlFor="password" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                SECURE_HASH
              </label>
              <div className="relative group">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input pl-12 pr-4 py-4 uppercase font-black tracking-widest text-[10px]"
                  placeholder="••••••••"
                  required
                />
                <i className="fa-solid fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-400 transition-colors"></i>
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="confirmPassword" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                CONFIRM_HASH
              </label>
              <div className="relative group">
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="glass-input pl-12 pr-4 py-4 uppercase font-black tracking-widest text-[10px]"
                  placeholder="••••••••"
                  required
                />
                <i className="fa-solid fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-400 transition-colors"></i>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className="w-full neon-button-cyan py-4 font-black tracking-[0.2em] text-xs uppercase"
            >
              <span className="flex items-center justify-center gap-3">
                {isLoading ? (
                  <i className="fa-solid fa-circle-notch animate-spin text-sm"></i>
                ) : (
                  <>
                    OVERRIDE_PASSWORD
                    <i className="fa-solid fa-check text-xs group-hover:scale-110 transition-transform"></i>
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Footer */}
          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <Link to="/login" className="text-[10px] font-black tracking-widest text-slate-500 hover:text-cyan-400 uppercase transition-all flex items-center justify-center gap-2 group">
              <i className="fa-solid fa-arrow-left-long group-hover:-translate-x-1 transition-transform"></i>
              RETURN_TO_BASE
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
