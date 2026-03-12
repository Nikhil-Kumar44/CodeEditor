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
    <div className="min-h-screen bg-[#0f172a] bg-[url('/grid.svg')] bg-center flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full mix-blend-screen opacity-50 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617] to-transparent from-10%"></div>
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#38bdf8] rounded-full blur-[120px] opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-500 rounded-full blur-[150px] opacity-10"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#38bdf8] rounded-2xl p-[2px] shadow-2xl shadow-[#38bdf8]/20 mb-6">
            <div className="w-full h-full bg-[#0f172a] rounded-[14px] flex items-center justify-center">
              <img src={logo} alt="Logo" className="w-[80%] h-[80%] object-cover" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-2">
            Create New Password
          </h1>
          <p className="text-gray-400">Your new password must be different from previously used passwords.</p>
        </div>

        {/* Card */}
        <div className="bg-[#020617]/50 backdrop-blur-xl border border-[#1e293b] p-8 rounded-3xl shadow-2xl relative z-10">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2 relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 ml-1">
                New Password
              </label>
              <div className="relative group">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-4 py-3.5 text-white pl-11 focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]/50 transition-all placeholder-gray-500 group-hover:border-gray-700"
                  placeholder="••••••••"
                  required
                />
                <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#38bdf8] transition-colors"></i>
              </div>
            </div>

            <div className="space-y-2 relative">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 ml-1">
                Confirm Password
              </label>
              <div className="relative group">
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-4 py-3.5 text-white pl-11 focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]/50 transition-all placeholder-gray-500 group-hover:border-gray-700"
                  placeholder="••••••••"
                  required
                />
                <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#38bdf8] transition-colors"></i>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className="w-full bg-[#38bdf8] hover:bg-sky-400 text-black font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-[#38bdf8]/20 hover:shadow-xl hover:shadow-[#38bdf8]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <span className="relative flex items-center justify-center gap-2">
                {isLoading ? (
                  <i className="fa-solid fa-circle-notch animate-spin"></i>
                ) : (
                  <>
                    Reset Password
                    <i className="fa-solid fa-check group-hover:scale-110 transition-transform"></i>
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-sm">
            <Link to="/login" className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-2">
              <i className="fa-solid fa-arrow-left"></i>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
