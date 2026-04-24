import { FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import logo from '../assets/logo.png'

export default function Login() {
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth()
  const { show } = useToast()
  const navigate = useNavigate()
  const location = useLocation() as any
  const from = location.state?.from?.pathname || '/rooms'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      await login(email, password)
      show('Logged in successfully', 'success')
      navigate(from, { replace: true })
    } catch (err: any) {
      show(err.message || 'Login failed', 'error')
    }
  }

  if (isAuthenticated) {
    navigate(from, { replace: true })
  }

  return (
    <div className="min-h-screen bg-dots flex items-center justify-center p-4 font-sans relative overflow-hidden bg-zinc-950">
      <div className="w-full max-w-sm relative z-10 text-center">
        {/* Logo/Identity Section */}
        <div className="mb-8 flex flex-col items-center">
          <Link to="/" className="inline-flex flex-col items-center group">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm border border-zinc-200/10">
              <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">
              Welcome back
            </h1>
          </Link>
          <p className="text-sm font-medium text-zinc-500">Sign in to your account to continue</p>
        </div>

        {/* Login Form Card */}
        <div className="glass-card p-8 border-zinc-800 text-left bg-zinc-900/80">
          {error && (
            <div className="mb-6 text-sm font-medium text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex justify-between items-center">
              <span>{error}</span>
              <button onClick={clearError} className="text-red-400 hover:text-red-300 transition-colors">✕</button>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">Email Address</label>
              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="glass-input w-full pl-3 pr-3 py-2.5 text-sm font-medium text-white placeholder-zinc-500"
                  placeholder="name@example.com"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-zinc-300">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="glass-input w-full pl-3 pr-3 py-2.5 text-sm font-medium text-white placeholder-zinc-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black h-10 rounded-md font-medium text-sm transition-colors hover:bg-zinc-200 mt-2 flex items-center justify-center disabled:opacity-50"
            >
              {isLoading ? (
                <i className="fa-solid fa-circle-notch animate-spin text-sm"></i>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-zinc-500 text-sm font-medium mt-8 text-center border-t border-zinc-800/50 pt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-white hover:text-blue-400 transition-colors font-semibold">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
