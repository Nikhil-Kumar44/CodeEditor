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
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 font-sans relative overflow-hidden bg-dots">
      <div className="relative w-full max-w-sm z-10 text-center">
        {/* Logo/Header */}
        <div className="mb-8 flex flex-col items-center">
          <Link to="/" className="inline-flex flex-col items-center group">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm border border-zinc-200/10">
              <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">
              Reset Password
            </h1>
          </Link>
          <p className="text-sm font-medium text-zinc-500">Create a new secure password</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 border-zinc-800 text-left bg-zinc-900/80">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                New Password
              </label>
              <div className="relative group">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full px-3 py-2.5 text-sm font-medium text-white placeholder-zinc-500"
                  placeholder="••••••••"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-300">
                Confirm Password
              </label>
              <div className="relative group">
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="glass-input w-full px-3 py-2.5 text-sm font-medium text-white placeholder-zinc-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className="w-full bg-white text-black h-10 rounded-md font-medium text-sm transition-colors hover:bg-zinc-200 mt-2 flex items-center justify-center disabled:opacity-50"
            >
              {isLoading ? (
                <i className="fa-solid fa-circle-notch animate-spin text-sm"></i>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-zinc-800/50 text-center">
            <Link to="/login" className="text-xs text-zinc-500 hover:text-white transition-all flex items-center justify-center gap-2 group font-medium">
              <i className="fa-solid fa-arrow-left-long"></i>
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
