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
  const [, setError] = useState<string | null>(null)

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
    <div className="min-h-screen bg-zinc-950 text-zinc-300 p-4 md:p-8 font-sans relative">
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Navigation & Header */}
        <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-16 border-b border-zinc-800 pb-6 mt-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm cursor-pointer" onClick={() => navigate('/')}>
              <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white m-0">
                Dashboard
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm font-medium text-zinc-500">
                  {greeting}, {user?.username}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => navigate('/history')}
              className="px-4 py-2 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
              <i className="fa-solid fa-clock-rotate-left"></i> History
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-md bg-transparent border border-zinc-800 text-zinc-400 text-sm font-medium hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Dashboard Actions */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
          <h2 className="text-xl font-semibold text-white tracking-tight">Your Rooms</h2>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setIsJoinOpen(true)}
              className="flex-1 md:flex-none glass-card px-5 py-2.5 rounded-md text-white text-sm font-medium hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 border-zinc-700"
            >
              <i className="fa-solid fa-link"></i> Join Room
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex-1 md:flex-none bg-white text-black px-5 py-2.5 rounded-md text-sm font-semibold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
            >
              Create Room <i className="fa-solid fa-plus text-xs"></i>
            </button>
          </div>
        </div>

        {/* Room Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {isLoading ? (
            <div className="col-span-full py-24 flex flex-col items-center justify-center gap-4">
              <i className="fa-solid fa-circle-notch text-2xl text-zinc-500 animate-spin"></i>
              <span className="text-sm font-medium text-zinc-500">Loading rooms...</span>
            </div>
          ) : rooms.length === 0 ? (
            <div className="col-span-full py-24 text-center">
              <div className="inline-flex flex-col items-center p-12 max-w-lg rounded-xl border border-zinc-800/50 bg-zinc-900/20 shadow-sm">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-zinc-900 border border-zinc-800">
                  <i className="fa-solid fa-folder-open text-2xl text-zinc-500"></i>
                </div>
                <h2 className="text-xl font-semibold text-white tracking-tight mb-2">No active rooms</h2>
                <p className="text-zinc-500 text-sm leading-relaxed mb-0 font-medium">
                  Create a new room to start collaborating, or join an existing one using an invite code.
                </p>
              </div>
            </div>
          ) : (
            rooms.map((room) => (
              <div
                key={room.roomId}
                className="glass-card p-6 flex flex-col group relative overflow-hidden transition-all hover:bg-zinc-900/50 border-zinc-800"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider ${room.isPublic ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
                    {room.isPublic ? 'Public' : 'Private'}
                  </div>
                  {user && (user._id === room.ownerId || (user as any).id === room.ownerId || user._id === room.ownerId?._id) && (
                    <button 
                      onClick={(e) => handleDeleteRoom(e, room.roomId)}
                      className="w-8 h-8 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center"
                    >
                      <i className="fa-solid fa-trash-can text-sm"></i>
                    </button>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-white tracking-tight leading-tight mb-2 line-clamp-1">
                  {room.name}
                </h3>
                
                <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-6 line-clamp-2 min-h-[2.5rem]">
                  {room.description || 'No description provided.'}
                </p>

                <div className="mt-auto pt-5 border-t border-zinc-800/50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest pl-0.5">Room ID</span>
                    <span className="text-xs font-medium font-mono text-zinc-400">{room.roomId}</span>
                  </div>
                  <button
                    onClick={() => handleJoinRoom(room.roomId)}
                    className="flex items-center gap-2 text-white bg-zinc-800 hover:bg-zinc-700 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors"
                  >
                    Join
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Join Room Modal */}
      {isJoinOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsJoinOpen(false)} />
          <div className="relative w-full max-w-md glass-card p-8 shadow-2xl bg-zinc-950 border-zinc-800">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white tracking-tight mb-1">Join Room</h2>
              <p className="text-sm font-medium text-zinc-500">Enter a room ID to join an existing session.</p>
            </div>

            <form onSubmit={handleJoinRoomSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-300">Room ID</label>
                <div className="relative group">
                  <input
                    value={joinRoomId}
                    onChange={(e) => handleRoomIdInput(e.target.value)}
                    required
                    maxLength={36}
                    className="glass-input w-full pl-3 pr-3 py-2.5 font-mono text-sm uppercase placeholder-zinc-600"
                    placeholder="XXX-XXX"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsJoinOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-900 border border-zinc-800 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joinRoomId.length < 3 || isLoading}
                  className="flex-1 bg-white text-black py-2.5 text-sm font-semibold rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Joining...' : 'Join Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Room Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
          <div className="relative w-full max-w-lg glass-card p-8 shadow-2xl bg-zinc-950 border-zinc-800">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white tracking-tight mb-1">Create Room</h2>
              <p className="text-sm font-medium text-zinc-500">Start a new collaborative session.</p>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-300">Room Name</label>
                <div className="relative group">
                  <input
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    required
                    minLength={3}
                    className="glass-input w-full px-3 py-2.5 text-sm"
                    placeholder="My Project"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-300">Visibility</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setNewRoomPublic(true)}
                    className={`flex-1 py-2 rounded-md border text-sm font-medium transition-all ${newRoomPublic ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-300'}`}
                  >
                    Public
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewRoomPublic(false)
                      setNewRoomRequireApproval(false)
                    }}
                    className={`flex-1 py-2 rounded-md border text-sm font-medium transition-all ${!newRoomPublic ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-300'}`}
                  >
                    Private
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-300">Description (Optional)</label>
                <textarea
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  rows={3}
                  className="glass-input w-full p-3 text-sm resize-none custom-scrollbar"
                  placeholder="What is this room about?"
                />
              </div>

              {newRoomPublic && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-md p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Require Approval</p>
                    <p className="text-xs font-medium text-zinc-500">Users must be admitted to join</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRoomRequireApproval}
                      onChange={(e) => setNewRoomRequireApproval(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white peer-checked:after:bg-black peer-checked:after:border-black"></div>
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-900 border border-zinc-800 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-sm font-semibold rounded-md transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
