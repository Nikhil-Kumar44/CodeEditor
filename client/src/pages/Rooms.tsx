import { useEffect, useMemo, useState } from 'react'
import logo from '../assets/logo.png'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../utils/api'
import { useToast } from '../contexts/ToastContext'

export default function Rooms() {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { show } = useToast()

  const [rooms, setRooms] = useState<{ roomId: string; name: string; description?: string; isPublic?: boolean; ownerId?: any }[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [_error, setError] = useState<string | null>(null)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomDesc, setNewRoomDesc] = useState('')
  const [newRoomPublic, setNewRoomPublic] = useState(false)
  const [newRoomRequireApproval, setNewRoomRequireApproval] = useState(true)
  
  const [isJoinOpen, setIsJoinOpen] = useState(false)
  const [joinRoomId, setJoinRoomId] = useState('')

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])

  async function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const loadRooms = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await api.get('/rooms')
      const fetched = (res.data?.data?.rooms || []).map((r: any) => ({
        roomId: r.roomId,
        name: r.name,
        description: r.description,
        isPublic: r.isPublic,
        ownerId: r.ownerId,
      }))
      setRooms(fetched)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to fetch rooms'
      setError(message)
      show(message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRooms();
  }, [])

  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault()
    if (!newRoomName.trim()) return
    try {
      setIsLoading(true)
      const res = await api.post('/rooms', {
        name: newRoomName.trim(),
        isPublic: newRoomPublic,
        requireApproval: newRoomRequireApproval,
      })
      const r = res.data?.data?.room
      if (r) {
        setRooms((prev) => [
          { roomId: r.roomId, name: r.name, description: r.description, isPublic: r.isPublic, ownerId: r.ownerId },
          ...prev,
        ])
        show('Room created successfully!', 'success')
        setNewRoomName('')
        setNewRoomDesc('')
        setIsCreateOpen(false)
        navigate(`/rooms/${r.roomId}`)
      }
    } catch (err: any) {
      show(err?.response?.data?.message || 'Failed to create room', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleJoinRoom(roomId: string) {
    try {
      setIsLoading(true)
      const normalizedId = roomId.trim()
      const flexibleFormat = /^[a-zA-Z0-9_-]{3,36}$/

      if (!flexibleFormat.test(normalizedId)) {
        show('Invalid Room ID format', 'error')
        setIsLoading(false)
        return
      }

      await api.post(`/rooms/${normalizedId}/join`)
      show('Joined room successfully!', 'success')
      navigate(`/rooms/${normalizedId}`)
    } catch (err: any) {
      if (err?.response?.data?.requireApproval) {
        show('Request sent to room owner. Waiting for approval...', 'info')
        setIsLoading(false)
        setIsJoinOpen(false)
        return
      }
      show(err?.response?.data?.message || 'Failed to join room', 'error')
      setIsLoading(false)
    }
  }

  async function handleJoinRoomSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!joinRoomId.trim()) return
    await handleJoinRoom(joinRoomId)
    setJoinRoomId('')
    setIsJoinOpen(false)
  }

  function handleRoomIdInput(value: string) {
    let formatted = value.replace(/[^A-Za-z0-9-_]/g, '')
    if (formatted.length === 3 && /^[A-Za-z]{3}$/.test(formatted)) {
      formatted = formatted.toUpperCase() + '-'
    } else if (formatted.length > 3 && formatted[3] !== '-' && /^[A-Za-z]{3}$/.test(formatted.slice(0, 3))) {
      formatted = formatted.slice(0, 3).toUpperCase() + '-' + formatted.slice(3)
    }
    setJoinRoomId(formatted.slice(0, 36))
  }

  const handleDeleteRoom = async (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      try {
        await api.delete(`/rooms/${roomId}`)
        show('Room deleted successfully', 'success')
        loadRooms()
      } catch (err: any) {
        show(err?.response?.data?.message || 'Failed to delete room', 'error')
      }
    }
  }

  return (
    <div className="min-h-screen bg-dots text-gray-300 p-4 md:p-12 font-sans relative overflow-x-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[radial-gradient(circle,rgba(0,243,255,0.08)_0%,transparent_70%)] z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-[radial-gradient(circle,rgba(168,85,247,0.08)_0%,transparent_70%)] z-0 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Navigation & Header */}
        <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-20 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center relative group overflow-hidden shadow-[0_0_30px_rgba(0,243,255,0.1)]">
              <div className="absolute inset-0 bg-cyan-400/10 group-hover:bg-cyan-400/20 transition-colors"></div>
              <img src={logo} alt="Logo" className="w-10 h-10 object-contain relative z-10 filter drop-shadow(0 0 8px rgba(0,243,255,0.5))" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-white uppercase mb-1">
                MISSION<span className="neon-text-cyan">CONTROL</span>
              </h1>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]"></span>
                <p className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">
                  {greeting} Agent_{user?.username.toUpperCase()} // Uplink_Stable
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 rounded-xl glass border-white/5 text-white text-[10px] font-black tracking-widest uppercase hover:bg-white/5 transition-all flex items-center gap-3 group"
            >
              <i className="fa-solid fa-house text-slate-500 group-hover:text-cyan-400 transition-colors"></i> Base_Uplink
            </button>
            <button
              onClick={() => navigate('/history')}
              className="px-8 py-3 rounded-xl glass border-white/5 text-cyan-400 text-[10px] font-black tracking-widest uppercase hover:bg-white/5 transition-all flex items-center gap-3 group"
            >
              <i className="fa-solid fa-clock-rotate-left text-slate-500 group-hover:text-cyan-400 transition-colors"></i> Archive_Logs
            </button>
            <button
              onClick={handleLogout}
              className="px-8 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black tracking-widest uppercase hover:bg-rose-500 hover:text-white transition-all shadow-[0_0_20px_rgba(244,63,94,0.1)]"
            >
              Deauthorize
            </button>
          </div>
        </header>

        {/* Dashboard Actions */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <button
              onClick={() => setIsJoinOpen(true)}
              className="flex-1 md:flex-none glass px-10 py-4 rounded-2xl text-white text-[11px] font-black tracking-[0.2em] uppercase hover:border-cyan-400/30 transition-all flex items-center justify-center gap-3 group"
            >
              <i className="fa-solid fa-satellite-dish text-cyan-400 group-hover:animate-pulse"></i> Join_Existing_Signal
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex-1 md:flex-none neon-button-cyan px-10 py-4 text-[11px] font-black tracking-[0.2em] uppercase"
            >
              Initialize_New_Session
              <i className="fa-solid fa-plus-large ml-2"></i>
            </button>
          </div>
          
          <div className="hidden lg:flex items-center gap-3">
            <div className="h-[1px] w-20 bg-gradient-to-r from-transparent to-slate-800"></div>
            <span className="text-[9px] font-black tracking-[0.4em] text-slate-600 uppercase">Deployed_Archives_Index</span>
            <div className="h-[1px] w-20 bg-gradient-to-l from-transparent to-slate-800"></div>
          </div>
        </div>

        {/* Room Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {isLoading ? (
            <div className="col-span-full py-32 flex flex-col items-center justify-center gap-6">
              <div className="h-16 w-16 glass rounded-2xl flex items-center justify-center relative">
                <div className="absolute inset-0 border-2 border-cyan-400/20 border-t-cyan-400 rounded-2xl animate-spin"></div>
                <i className="fa-solid fa-microchip text-2xl text-cyan-400 animate-pulse"></i>
              </div>
              <span className="text-[10px] font-black tracking-[0.5em] text-cyan-400 uppercase">Synchronizing_Neural_Data...</span>
            </div>
          ) : rooms.length === 0 ? (
            <div className="col-span-full py-40 text-center animate-in fade-in zoom-in duration-700">
              <div className="inline-flex flex-col items-center glass-card p-16 max-w-lg border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"></div>
                <div className="w-24 h-24 glass rounded-3xl flex items-center justify-center mb-8 border-slate-800 group-hover:border-cyan-400/20 transition-all">
                  <i className="fa-solid fa-folder-open text-4xl text-slate-800 group-hover:text-slate-700 transition-colors"></i>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase mb-4">No_Active_Signals</h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-0 font-medium">
                  The mission log is empty. Initialize your first session to begin decentralized collaboration protocols.
                </p>
              </div>
            </div>
          ) : (
            rooms.map((room, idx) => (
              <div
                key={room.roomId}
                style={{ animationDelay: `${idx * 100}ms` }}
                className="glass-card p-8 border-white/5 flex flex-col group relative overflow-hidden hover:border-cyan-400/20 transition-all animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
              >
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/0 group-hover:via-cyan-400/40 to-transparent transition-all duration-700"></div>
                
                <div className="flex justify-between items-start mb-6">
                  <div className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase ${room.isPublic ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 shadow-[0_0_10px_rgba(0,243,255,0.1)]' : 'bg-slate-800/50 text-slate-500 border border-slate-700/50'}`}>
                    {room.isPublic ? 'Public_Link' : 'Secure_Channel'}
                  </div>
                  {user && (user._id === room.ownerId || (user as any).id === room.ownerId || user._id === room.ownerId?._id) && (
                    <button 
                      onClick={(e) => handleDeleteRoom(e, room.roomId)}
                      className="w-10 h-10 rounded-xl glass border-white/5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all flex items-center justify-center group/del"
                    >
                      <i className="fa-solid fa-trash-can-xmark text-sm transition-transform group-hover/del:scale-110"></i>
                    </button>
                  )}
                </div>

                <h3 className="text-2xl font-black text-white tracking-tight leading-tight mb-4 group-hover:text-cyan-400 transition-all">
                  {room.name.toUpperCase()}
                </h3>
                
                <p className="text-slate-500 text-xs font-medium leading-relaxed mb-8 line-clamp-3 min-h-[3rem]">
                  {room.description || 'Standard mission parameters active. Encrypted communication channel established for team collaboration.'}
                </p>

                <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none">Access_Token</span>
                    <span className="text-[10px] font-black font-mono text-slate-400 uppercase tracking-tighter">{room.roomId}</span>
                  </div>
                  <button
                    onClick={() => handleJoinRoom(room.roomId)}
                    className="flex items-center gap-3 text-cyan-400 text-[10px] font-black tracking-[0.2em] uppercase hover:text-white transition-all group/btn"
                  >
                    Enter_Session
                    <div className="w-8 h-8 rounded-lg glass border-cyan-400/10 flex items-center justify-center group-hover/btn:bg-cyan-400 group-hover/btn:text-black transition-all">
                      <i className="fa-solid fa-arrow-right-long text-[10px] group-hover/btn:translate-x-0.5 transition-transform"></i>
                    </div>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Join Room Modal */}
      {isJoinOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsJoinOpen(false)} />
          <div className="relative w-full max-w-md glass-card p-10 border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 glass rounded-2xl flex items-center justify-center border-cyan-400/20 shadow-[0_0_20px_rgba(0,243,255,0.1)]">
                <i className="fa-solid fa-satellite-dish text-2xl text-cyan-400"></i>
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Signal_<span className="neon-text-cyan">Uplink</span></h2>
                <p className="text-[9px] font-black tracking-[0.3em] text-slate-500 uppercase">Input encrypted room hash</p>
              </div>
            </div>

            <form onSubmit={handleJoinRoomSubmit} className="space-y-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">CHANNEL_ID</label>
                <div className="relative group">
                  <input
                    value={joinRoomId}
                    onChange={(e) => handleRoomIdInput(e.target.value)}
                    required
                    maxLength={36}
                    className="glass-input w-full pl-12 pr-4 py-5 font-black font-mono tracking-[0.3em] text-sm text-center uppercase"
                    placeholder="XXX-XXX"
                    autoFocus
                  />
                  <i className="fa-solid fa-hashtag absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-400 transition-colors"></i>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsJoinOpen(false)}
                  className="flex-1 py-4 glass border-white/5 text-[10px] font-black tracking-widest uppercase hover:bg-white/5 transition-all rounded-xl"
                >
                  Abort
                </button>
                <button
                  type="submit"
                  disabled={joinRoomId.length < 3}
                  className="flex-[2] neon-button-cyan py-4 text-[10px] font-black tracking-widest uppercase"
                >
                  Connect_Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Room Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsCreateOpen(false)} />
          <div className="relative w-full max-w-xl glass-card p-10 border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 glass rounded-2xl flex items-center justify-center border-purple-400/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                <i className="fa-solid fa-plus-large text-2xl text-purple-400"></i>
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Initialize_<span className="text-purple-400">Section</span></h2>
                <p className="text-[9px] font-black tracking-[0.3em] text-slate-500 uppercase">Deploy new collaboration vector</p>
              </div>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">VECTOR_TITLE</label>
                  <div className="relative group">
                    <input
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      required
                      minLength={3}
                      className="glass-input w-full pl-12 pr-4 py-4 uppercase font-black text-[10px] tracking-widest"
                      placeholder="HUB_PROJECT_ALPHA"
                    />
                    <i className="fa-solid fa-signature absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-purple-400 transition-colors"></i>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">SECURITY_PROTOCOL</label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setNewRoomPublic(true)}
                      className={`flex-1 py-4 rounded-xl border text-[9px] font-black tracking-widest uppercase transition-all ${newRoomPublic ? 'bg-cyan-400/10 border-cyan-400/30 text-cyan-400' : 'bg-transparent border-white/5 text-slate-600 hover:border-slate-700'}`}
                    >
                      Public
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewRoomPublic(false)
                        setNewRoomRequireApproval(false)
                      }}
                      className={`flex-1 py-4 rounded-xl border text-[9px] font-black tracking-widest uppercase transition-all ${!newRoomPublic ? 'bg-purple-400/10 border-purple-400/30 text-purple-400' : 'bg-transparent border-white/5 text-slate-600 hover:border-slate-700'}`}
                    >
                      Private
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">MISSION_LOG_DESCRIPTION</label>
                <textarea
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  rows={3}
                  className="glass-input w-full p-4 font-medium text-xs leading-relaxed custom-scrollbar uppercase"
                  placeholder="Enter detailed protocol parameters..."
                />
              </div>

              {newRoomPublic && (
                <div className="bg-cyan-400/5 border border-cyan-400/10 rounded-2xl p-6 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 glass rounded-xl flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                      <i className="fa-solid fa-user-shield text-sm"></i>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">Entry_Approval_Mode</p>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Authorized_Override_Required</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRoomRequireApproval}
                      onChange={(e) => setNewRoomRequireApproval(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-400 peer-checked:after:bg-black"></div>
                  </label>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-4 glass border-white/5 text-[10px] font-black tracking-widest uppercase hover:bg-white/5 transition-all rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] h-16 bg-purple-500 text-white rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all uppercase font-black tracking-[0.2em] text-[10px] border border-purple-400/20"
                >
                  Deploy_Session_Archive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
