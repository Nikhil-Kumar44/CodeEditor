import { useEffect, useRef, useState } from 'react'
import logo from '../assets/logo.png'
import backLogo from '../assets/back-logo.png'
import { Link, useParams } from 'react-router-dom'
import api from '../utils/api'
import { useToast } from '../contexts/ToastContext'
import Editor, { OnMount } from '@monaco-editor/react'
import { useCollaboration } from '../hooks/useCollaboration'
import { useAuthStore } from '../stores/authStore'
import { CursorOverlayManager } from '../utils/monacoCursors'
import { format, parseISO } from 'date-fns'

export default function RoomEditor() {
  const { roomId } = useParams()
  const { show } = useToast()
  const [roomName, setRoomName] = useState('Room')
  const [outputLog, setOutputLog] = useState<any[]>([])
  const [stdin, setStdin] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [activeTab, setActiveTab] = useState<'output' | 'input' | 'debug'>('output')
  const [activeFile, setActiveFile] = useState('main')
  const [files, setFiles] = useState([
    { id: 'main', name: 'Main.java', language: 'java' },
    { id: 'input', name: 'input.txt', language: 'plaintext' },
  ])
  const [editorHeight, setEditorHeight] = useState(65)
  const resizerRef = useRef<HTMLDivElement>(null)
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [savedFiles, setSavedFiles] = useState<any[]>([])
  const [showSavedFiles, setShowSavedFiles] = useState(false)
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [activeSidebarTab, setActiveSidebarTab] = useState<'chat' | 'participants' | 'history'>('chat')
  const [showCreateFileModal, setShowCreateFileModal] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [newFileLanguage, setNewFileLanguage] = useState('javascript')
  const [showCopiedTooltip, setShowCopiedTooltip] = useState(false)
  const [suggestion, setSuggestion] = useState<{ name: string; type: 'function' | 'variable'; pos: { x: number; y: number } } | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  // Room Ownership Features
  const [joinRequests, setJoinRequests] = useState<any[]>([])
  const [roomOwnerId, setRoomOwnerId] = useState<string | null>(null)

  const {
    code,
    sendCode,
    cursors,
    sendCursor,
    language,
    changeLanguage,
    users = {},
    chat = [],
    sendChat,
    typingUsers = {},
    sendTyping,
    isConnected,
  } = useCollaboration(roomId)

  const [chatInput, setChatInput] = useState('')
  const [localUsers, setLocalUsers] = useState<Array<{ id: string; name: string; color: string; status: string }>>([])
  const editorRef = useRef<any>(null)
  const cursorMgrRef = useRef<CursorOverlayManager | null>(null)
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const chatContainerRef = useRef<HTMLDivElement | null>(null)
  const languageDropdownRef = useRef<HTMLDivElement>(null)
  const currentUser = useAuthStore((s) => s.user)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef<boolean>(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // --- Join Room ---
  useEffect(() => {
    if (!roomId) return
      ; (async () => {
        try {
          console.log('🔵 Attempting to join room:', roomId)
          const res = await api.post(`/rooms/${roomId}/join`)
          const { success, data } = res.data
          if (success) {
            console.log('✅ Successfully joined room:', data?.room)
            setRoomName(data?.room?.name || 'Room')
            setRoomOwnerId(data?.room?.ownerId?._id || data?.room?.ownerId || null)
          }
        } catch (error: any) {
          console.error('❌ Failed to join room:', error.response?.data || error.message)
          show(error.response?.data?.message || 'Failed to join room', 'error')
        }
      })()
  }, [roomId, show])

  // --- Editor setup ---
  const onEditorMount: OnMount = (editor) => {
    editorRef.current = editor
    cursorMgrRef.current = new CursorOverlayManager(editor)
    editor.onDidChangeCursorPosition((e: any) => {
      sendCursor(e.position)
      detectUndefinedSymbol(e.position)
    })
  }

  const detectUndefinedSymbol = (position: { lineNumber: number; column: number }) => {
    if (!editorRef.current || !code) return

    const model = editorRef.current.getModel()
    const wordInfo = model.getWordAtPosition(position)
    if (!wordInfo) {
      setSuggestion(null)
      return
    }

    const symbolName = wordInfo.word
    console.log('Checking symbol:', symbolName)
    const lineContent = model.getLineContent(position.lineNumber)
    const afterWord = lineContent.substring(wordInfo.endColumn - 1)

    // Validate identifier: must start with letter/underscore and contain only valid chars
    if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(symbolName)) {
      console.log('Invalid identifier:', symbolName)
      setSuggestion(null)
      return
    }

    // Only ignore truly global/built-in objects - NOT language keywords
    const builtIns = ['console', 'alert', 'prompt', 'confirm', 'setTimeout', 'setInterval', 'fetch', 'Math', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Promise', 'window', 'document', 'System', 'out', 'println']
    if (builtIns.includes(symbolName)) {
      console.log('Built-in detected:', symbolName)
      setSuggestion(null)
      return
    }

    // Check if it's a function call (followed by '(')
    const isFunctionCall = /^\s*\(/.test(afterWord)
    console.log('Is function call:', isFunctionCall)

    // Simplified check: just look for the symbol name being declared anywhere
    const isDefined =
      code.includes(`function ${symbolName}`) ||
      code.includes(`const ${symbolName}`) ||
      code.includes(`let ${symbolName}`) ||
      code.includes(`var ${symbolName}`) ||
      code.includes(`class ${symbolName}`) ||
      new RegExp(`\\b(int|double|float|long|boolean|char|String)\\s+${symbolName}\\b`).test(code) ||
      new RegExp(`\\(\\s*[^)]*\\b${symbolName}\\s*[,)]`).test(code) // parameter

    console.log('Is defined:', isDefined)

    if (!isDefined) {
      let pos = editorRef.current.getScrolledVisiblePosition(position)
      // Fallback if getScrolledVisiblePosition returns null
      if (!pos) {
        console.log('getScrolledVisiblePosition returned null, using fallback')
        pos = { left: 100, top: 100 }
      }
      console.log('Showing suggestion for:', symbolName, 'at position:', pos)
      setSuggestion({
        name: symbolName,
        type: isFunctionCall ? 'function' : 'variable',
        pos: { x: pos.left, y: pos.top }
      })
    } else {
      setSuggestion(null)
    }
  }

  const handleDeepScan = async () => {
    try {
      setIsAnalyzing(true)
      show('Analyzing code with Gemini...', 'info')
      const res = await api.post('/ai/analyze', { code, language })
      const { success, missing } = res.data

      if (success && missing && missing.length > 0) {
        show(`Gemini found ${missing.length} missing definitions.`, 'success')
        const first = missing[0]
        setSuggestion({
          name: first.name,
          type: first.type as 'function' | 'variable',
          pos: { x: 100, y: 100 }
        })
      } else {
        show('Gemini found no missing definitions!', 'success')
      }
    } catch (error: any) {
      console.error('Deep Scan Error:', error)
      show('Failed to analyze code with Gemini', 'error')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleApplyFix = () => {
    if (!suggestion || !editorRef.current) return
    const model = editorRef.current.getModel()
    let injection = ''
    let insertLine = 1

    if (suggestion.type === 'function') {
      injection = `\nfunction ${suggestion.name}() {\n  return;\n}\n`
      insertLine = 1
    } else {
      // Smart injection for variables
      if (language === 'java') {
        injection = `        int ${suggestion.name} = 0;\n`
        // Find current method start
        const pos = editorRef.current.getPosition()
        let found = false
        for (let i = pos.lineNumber; i > 0; i--) {
          const line = model.getLineContent(i)
          if (line.includes('{')) {
            insertLine = i + 1
            found = true
            break
          }
        }
        if (!found) insertLine = 1
      } else {
        injection = `let ${suggestion.name};\n`
        insertLine = 1
      }
    }

    const currentCode = model.getValue()
    const lines = currentCode.split('\n')
    lines.splice(insertLine - 1, 0, injection)

    sendCode(lines.join('\n'))
    setSuggestion(null)
  }

  useEffect(() => {
    const mgr = cursorMgrRef.current
    if (!mgr || !editorRef.current) return
    Object.values(cursors || {}).forEach((c) =>
      mgr.upsert({
        userId: c.userId,
        username: c.username,
        color: (c as any).color,
        position: c.position
      })
    )
  }, [cursors])

  useEffect(() => {
    const mapped = Object.entries(users || {}).map(([id, u]) => ({
      id,
      name: u.username,
      color: getUserColor(id),
      status: typingUsers[id]?.isTyping ? 'typing' : 'online'
    }))
    setLocalUsers(mapped)
  }, [users, typingUsers])

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chat])

  // --- Run Code ---
  const handleRunCode = async () => {
    try {
      setIsRunning(true)
      show('Running your code...', 'info')

      const res = await api.post('/execute', { language, code, stdin, roomId })
      const data = res.data

      if (data.success) {
        const result = data.data.output || 'No output.'
        const timestamp = new Date().toLocaleTimeString()

        setOutputLog([
          {
            username: currentUser?.username || 'You',
            language,
            output: result,
            timestamp,
          },
        ])

        show('Code executed successfully ✅', 'success')
      } else {
        show(`Execution failed: ${data.message}`, 'error')
      }
    } catch (err: any) {
      console.error('Execution Error:', err)
      show(err?.response?.data?.message || 'Server error during code execution.', 'error')
    } finally {
      setIsRunning(false)
    }
  }

  // --- Receive shared output ---
  useEffect(() => {
    const socket = (window as any).socket
    if (!socket) return
    const handleCodeOutput = (data: { username: string; language: string; output: string; timestamp: string }) => {
      setOutputLog((prev) => [
        ...prev,
        {
          username: data.username,
          language: data.language,
          output: data.output,
          timestamp: data.timestamp
        },
      ])
    }

    socket.on('code:output', handleCodeOutput)
    return () => socket.off('code:output', handleCodeOutput)
  }, [])

  // --- Handle Join Requests (Owner only) ---
  useEffect(() => {
    const socket = (window as any).socket
    if (!socket || !currentUser || !roomOwnerId) return

    // Only listen if we are the owner
    const uid = currentUser?._id || (currentUser as any)?.id;
    if (uid !== roomOwnerId) return

    const handleJoinRequest = (data: any) => {
      if (data.roomId === roomId) {
        show(`${data.username} requested to join`, 'info')
        setJoinRequests(prev => [...prev, data])
      }
    }

    socket.on('room:join-request', handleJoinRequest)
    return () => socket.off('room:join-request', handleJoinRequest)
  }, [roomId, currentUser, roomOwnerId, show])

  const handleProcessJoinRequest = (req: any, approved: boolean) => {
    const socket = (window as any).socket
    if (!socket) return

    socket.emit('room:process-join', {
      roomId: req.roomId,
      userId: req.userId,
      requestSocketId: req.requestSocketId,
      approved
    })

    setJoinRequests(prev => prev.filter(r => r.requestSocketId !== req.requestSocketId))
    if (approved) {
      show(`Allowed ${req.username} to join`, 'success')
    } else {
      show(`Denied ${req.username}`, 'info')
    }
  }

  // --- Resize layout (editor <-> terminal) ---
  useEffect(() => {
    const resizer = resizerRef.current
    if (!resizer) return
    let startY = 0
    let startHeight = 0
    const onMouseDown = (e: MouseEvent) => {
      startY = e.clientY
      startHeight = editorHeight
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    }
    const onMouseMove = (e: MouseEvent) => {
      const diff = ((e.clientY - startY) / window.innerHeight) * 100
      const newHeight = Math.max(20, Math.min(80, startHeight - diff))
      setEditorHeight(newHeight)
    }
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    resizer.addEventListener('mousedown', onMouseDown)
    return () => resizer.removeEventListener('mousedown', onMouseDown)
  }, [editorHeight])

  useEffect(() => {
    if (!showSavedFiles) return
    const fetchSavedFiles = async () => {
      try {
        setIsLoadingFiles(true)
        const res = await api.get('/execute/history')
        if (res.data.success) setSavedFiles(res.data.data)
      } catch (err) {
        console.error('Failed to fetch saved files:', err)
        show('Failed to load saved files', 'error')
      } finally {
        setIsLoadingFiles(false)
      }
    }
    fetchSavedFiles()
  }, [showSavedFiles])

  // Helper function to get file extension based on language
  const getFileExtension = (lang: string): string => {
    const extensionMap: { [key: string]: string } = {
      javascript: '.js',
      python: '.py',
      java: '.java',
      cpp: '.cpp',
      c: '.c',
      html: '.html',
      css: '.css',
      typescript: '.ts',
      plaintext: '.txt'
    }
    return extensionMap[lang] || '.txt'
  }

  const handleAddFile = () => {
    setShowCreateFileModal(true)
    setNewFileName('')
    setNewFileLanguage('javascript')
  }

  const handleCreateFile = () => {
    if (!newFileName.trim()) return

    const extension = getFileExtension(newFileLanguage)
    const fileName = newFileName.trim().endsWith(extension)
      ? newFileName.trim()
      : newFileName.trim() + extension

    const newFile = {
      id: `file-${Date.now()}`,
      name: fileName,
      language: newFileLanguage
    }
    setFiles((prev) => [...prev, newFile])
    setActiveFile(newFile.id)
    setShowCreateFileModal(false)
    setNewFileName('')
  }

  const handleRemoveFile = (id: string) => {
    const newFiles = files.filter((f) => f.id !== id)
    setFiles(newFiles)
    if (activeFile === id) {
      if (newFiles.length > 0) setActiveFile(newFiles[0].id)
      else setActiveFile('')
    }
  }

  function getUserColor(id: string) {
    const colors = ['#22c55e', '#3b82f6', '#a855f7', '#ef4444', '#eab308', '#06b6d4', '#8b5cf6', '#10b981']
    let hash = 0
    for (let i = 0; i < id.length; i++) hash = (hash << 5) - hash + id.charCodeAt(i)
    return colors[Math.abs(hash) % colors.length]
  }

  const handleSendChat = () => {
    if (chatInput.trim() && currentUser?.username) {
      sendChat(chatInput, currentUser.username)
      setChatInput('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendChat()
    }
  }

  const handleLanguageChange = (newLanguage: string) => {
    changeLanguage(newLanguage)
    setShowLanguageDropdown(false)
  }

  const handleCopyRoomId = async () => {
    if (!roomId) return
    try {
      await navigator.clipboard.writeText(roomId)
      setShowCopiedTooltip(true)
      setTimeout(() => setShowCopiedTooltip(false), 2000)
    } catch (err) {
      console.error('Failed to copy Room ID:', err)
      show('Failed to copy Room ID', 'error')
    }
  }

  const languages = [
    { key: 'javascript', label: 'JavaScript', icon: 'fa-brands fa-js' },
    { key: 'python', label: 'Python', icon: 'fa-brands fa-python' },
    { key: 'java', label: 'Java', icon: 'fa-brands fa-java' },
    { key: 'cpp', label: 'C++', icon: 'fa-solid fa-c' },
    { key: 'c', label: 'C', icon: 'fa-solid fa-c' },
    { key: 'html', label: 'HTML', icon: 'fa-brands fa-html5' },
    { key: 'css', label: 'CSS', icon: 'fa-brands fa-css3' },
    { key: 'typescript', label: 'TypeScript', icon: 'fa-solid fa-code' },
  ]

  const getCurrentLanguage = () => {
    return languages.find((lang) => lang.key === language) || languages[0]
  }

  const currentLanguage = getCurrentLanguage()

  // Add error boundary to prevent crashes
  if (!roomId) {
    return (
      <div className="h-screen w-full bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Room Not Found</h1>
          <Link to="/rooms" className="text-indigo-400 hover:underline">
            Back to Rooms
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full bg-dots text-gray-300 flex flex-col overflow-hidden font-sans relative">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(0,243,255,0.05)_0%,transparent_70%)] z-0 pointer-events-none"></div>
      
      {/* Header */}
      <header className="h-16 glass border-b border-white/10 flex items-center justify-between px-2 sm:px-6 shrink-0 z-30 overflow-visible relative">
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Link
            to="/rooms"
            className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg glass flex items-center justify-center group-hover:bg-white/10 transition-all overflow-hidden p-1.5">
              <img src={backLogo} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" alt="Back" />
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 glass rounded-xl flex items-center justify-center relative group overflow-hidden">
              <div className="absolute inset-0 bg-cyan-400/10 transition-colors"></div>
              <img src={logo} alt="Logo" className="w-6 h-6 object-contain relative z-10 filter drop-shadow(0 0 5px rgba(0,243,255,0.5))" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-white font-black tracking-tighter text-sm uppercase">COLLAB<span className="neon-text-cyan">CODE</span></h1>
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="truncate max-w-[120px]">{roomName.toUpperCase()}</span>
                <span className="text-gray-600">•</span>
                <span className="text-green-400 font-bold">{isConnected ? 'LIVE' : 'SYNCING...'}</span>
              </div>
            </div>
          </div>

          {/* Room ID Display */}
          <div className="flex items-center gap-2 glass border border-white/5 rounded-full px-4 py-1.5 overflow-hidden">
            <span className="text-slate-500 font-black text-[10px] tracking-widest hidden lg:inline">SESSION ID</span>
            <span className="text-cyan-400 font-mono text-xs font-black tracking-widest">
              {roomId}
            </span>
            <div className="relative">
              <button
                onClick={handleCopyRoomId}
                className="p-1 rounded text-slate-500 hover:text-white transition-colors"
                title="Copy Room ID"
              >
                <i className="fa-solid fa-copy text-[10px]"></i>
              </button>
              {showCopiedTooltip && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-cyan-500 text-black text-[10px] font-black px-2 py-0.5 rounded whitespace-nowrap shadow-[0_0_10px_var(--neon-cyan)] animate-in fade-in slide-in-from-top-1">
                  COPIED
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0 pl-2">
          {/* Room Info */}
          <div className="hidden xl:flex glass px-4 py-1.5 rounded-full items-center gap-2">
            <i className="fa-solid fa-users text-green-400 text-[10px]"></i>
            <span className="text-[10px] font-black tracking-widest text-slate-400">{localUsers.length} ONLINE</span>
          </div>

          {/* Share Button */}
          <button className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-all">
            <i className="fa-solid fa-share"></i>
            <span className="text-sm font-medium">Share</span>
          </button>

          {/* Language Selector */}
          <div className="relative" ref={languageDropdownRef}>
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="flex items-center gap-2 px-3 py-2 glass border border-white/5 rounded-lg text-xs font-black tracking-widest text-white hover:border-cyan-400/50 transition-all min-w-[70px] sm:min-w-[130px] justify-between uppercase"
            >
              <div className="flex items-center gap-2">
                <i className={`${currentLanguage.icon} text-cyan-400`}></i>
                <span className="hidden sm:inline">{currentLanguage.label}</span>
              </div>
              <i className={`fa-solid fa-chevron-down text-[10px] transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`}></i>
            </button>

            {showLanguageDropdown && (
              <div className="absolute top-full right-0 mt-2 w-56 glass border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <div className="py-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.key}
                      onClick={() => handleLanguageChange(lang.key)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black tracking-widest transition-colors uppercase ${language === lang.key
                        ? 'bg-cyan-400/10 text-cyan-400'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                      <i className={`${lang.icon} w-5 text-center text-xs`}></i>
                      <span className="flex-1 text-left">{lang.label}</span>
                      {language === lang.key && <i className="fa-solid fa-check text-xs"></i>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Gemini Scan Button */}
          <button
            onClick={handleDeepScan}
            disabled={isAnalyzing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-300 ${isAnalyzing
              ? 'bg-slate-700/50 border-slate-600 text-slate-400 cursor-not-allowed'
              : 'glass border-indigo-500/30 text-indigo-300 hover:bg-indigo-500 hover:text-white hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]'
              }`}
            title="Analyze Entire File with Gemini"
          >
            {isAnalyzing ? (
              <i className="fa-solid fa-spinner fa-spin text-xs"></i>
            ) : (
              <i className="fa-solid fa-wand-magic-sparkles text-xs"></i>
            )}
            <span className="hidden sm:inline text-[10px] font-black tracking-widest uppercase">SCAN</span>
          </button>

          {/* Run Button */}
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black tracking-widest rounded-lg shadow-[0_0_20px_rgba(0,243,255,0.3)] transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase"
          >
            {isRunning ? (
              <>
                <i className="fa-solid fa-circle-notch animate-spin text-xs"></i>
                <span className="hidden sm:inline">RUNNING</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-play text-xs"></i>
                <span className="hidden sm:inline">EXECUTE</span>
                <span className="sm:hidden">RUN</span>
              </>
            )}
          </button>

          {/* Mobile Sidebar Toggle Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl glass border-white/5 text-cyan-400 hover:bg-white/10 transition-all shadow-[0_0_15px_rgba(0,243,255,0.1)] active:scale-90"
          >
            <i className={`fa-solid ${isSidebarOpen ? 'fa-xmark' : 'fa-bars'} text-sm`}></i>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Left Panel - Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* File Tabs */}
          <div className="flex items-center glass border-b border-white/5 px-2 pt-2 gap-1 overflow-x-auto">
            {files.map((f) => (
              <div
                key={f.id}
                onClick={() => setActiveFile(f.id)}
                className={`group flex items-center gap-2 px-4 py-2.5 text-[10px] font-black tracking-widest uppercase rounded-t-xl cursor-pointer transition-all min-w-[140px] border-t border-x ${activeFile === f.id
                  ? 'bg-white/5 text-cyan-400 border-white/10'
                  : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5'
                  }`}
              >
                <i className={`fa-regular fa-file-code text-xs ${activeFile === f.id ? 'text-cyan-400' : 'text-slate-600'}`}></i>
                <span className="truncate flex-1">{f.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveFile(f.id)
                  }}
                  className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-rose-400 transition-colors"
                  title="Close file"
                >
                  <i className="fa-solid fa-xmark text-xs"></i>
                </button>
              </div>
            ))}
            <button
              onClick={handleAddFile}
              className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-cyan-400 hover:bg-white/5 rounded-lg transition-all ml-1"
              title="New File"
            >
              <i className="fa-solid fa-plus text-xs"></i>
            </button>
          </div>

          {/* Editor Area */}
          <div style={{ height: `${editorHeight}%` }} className="relative w-full">
            <Editor
              height="100%"
              theme="vs-dark"
              language={language}
              value={code || ''}
              onMount={onEditorMount}
              onChange={(val) => {
                sendCode(val || '')

                // Emit typing indicator ONLY if we aren't already typing
                if (!isTypingRef.current) {
                  isTypingRef.current = true
                  sendTyping(true)
                }

                // Clear existing timeout
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current)
                }

                // Stop typing after 2 seconds of inactivity
                typingTimeoutRef.current = setTimeout(() => {
                  isTypingRef.current = false
                  sendTyping(false)
                }, 2000)
              }}
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: false },
                smoothScrolling: true,
                padding: { top: 20 },
                lineHeight: 1.6,
                scrollBeyondLastLine: false,
              }}
            />

            {/* Quick Fix Suggestion */}
            {suggestion && (
              <div
                style={{
                  position: 'absolute',
                  left: suggestion.pos.x,
                  top: suggestion.pos.y - 45,
                  zIndex: 100
                }}
                className="animate-in fade-in zoom-in duration-300"
              >
                <button
                  onClick={handleApplyFix}
                  className="bg-indigo-600/90 hover:bg-indigo-500 text-white text-[10px] font-black tracking-widest uppercase px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.5)] flex items-center gap-3 border border-indigo-400/50 backdrop-blur-md group whitespace-nowrap"
                >
                  <i className="fa-solid fa-wand-magic-sparkles text-sm group-hover:rotate-12 transition-transform"></i>
                  {suggestion.type === 'function' ? `INITIALIZE: ${suggestion.name}()` : `DECLARE: ${suggestion.name}`}
                </button>
              </div>
            )}

            {/* Typing Indicator */}
            {Object.values(typingUsers).filter(u => (u as any).isTyping).length > 0 && (
              <div className="absolute bottom-4 left-6 z-[9999] pointer-events-none text-[10px] font-black tracking-widest uppercase text-slate-400 flex items-center gap-3 glass px-4 py-2 rounded-full border border-white/5 shadow-2xl animate-in slide-in-from-left-4 duration-500">
                <div className="flex gap-1.5">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span>
                  {(() => {
                    const typing = Object.values(typingUsers).filter(u => u.isTyping)
                    if (typing.length === 1) return `${typing[0].username} COMMUNICATING...`
                    if (typing.length === 2) return `${typing[0].username} & ${typing[1].username} COMMUNICATING...`
                    return `${typing.length} AGENTS COMMUNICATING...`
                  })()}
                </span>
              </div>
            )}
          </div>

          {/* Resizer */}
          <div
            ref={resizerRef}
            className="h-1 bg-white/5 hover:bg-cyan-400/30 cursor-ns-resize transition-colors flex items-center justify-center group relative z-20"
          >
            <div className="w-20 h-0.5 rounded-full bg-slate-700 group-hover:bg-cyan-400 transition-colors"></div>
          </div>

          {/* Terminal Area */}
          <div style={{ height: `${100 - editorHeight}%` }} className="flex flex-col glass border-t border-white/5 relative bg-black/20">
            {/* Terminal Tabs */}
            <div className="flex items-center gap-2 border-b border-white/5 px-4 overflow-x-auto">
              <button
                onClick={() => setActiveTab('output')}
                className={`flex items-center gap-2 px-4 py-3 text-[10px] font-black tracking-[0.2em] uppercase transition-all border-b-2 ${activeTab === 'output'
                  ? 'border-cyan-400 text-cyan-400 bg-cyan-400/5'
                  : 'border-transparent text-slate-500 hover:text-white'
                  }`}
              >
                <i className="fa-solid fa-terminal text-xs"></i>
                OUTPUT
                {outputLog.length > 0 && (
                  <span className="px-1.5 py-0.5 text-[8px] bg-cyan-400 text-black rounded-full font-black">
                    {outputLog.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('input')}
                className={`flex items-center gap-2 px-4 py-3 text-[10px] font-black tracking-[0.2em] uppercase transition-all border-b-2 ${activeTab === 'input'
                  ? 'border-cyan-400 text-cyan-400 bg-cyan-400/5'
                  : 'border-transparent text-slate-500 hover:text-white'
                  }`}
              >
                <i className="fa-solid fa-keyboard text-xs"></i>
                SYSTEM.IN
              </button>
              <button
                onClick={() => setActiveTab('debug')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'debug'
                  ? 'border-[#38bdf8] text-[#38bdf8]'
                  : 'border-transparent text-gray-500 hover:text-white'
                  }`}
              >
                <i className="fa-solid fa-bug mr-2"></i>
                Debug
              </button>
                     {/* Terminal Content */}
            <div className="flex-1 overflow-hidden p-4 font-mono text-[11px] font-medium tracking-tight">
              {activeTab === 'output' ? (
                <div className="h-full overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {outputLog.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600">
                      <i className="fa-solid fa-terminal text-4xl mb-4 opacity-10"></i>
                      <p className="font-black tracking-[0.2em]">WAITING FOR EXECUTION...</p>
                    </div>
                  ) : (
                    outputLog.map((o, idx) => (
                      <div key={idx} className="glass-card p-4 border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400 opacity-50"></div>
                        <div className="flex items-center gap-3 text-[10px] font-black tracking-widest text-slate-500 mb-3 pb-3 border-b border-white/5 uppercase">
                          <span className="text-cyan-400">{o.username}</span>
                          <span className="opacity-20">•</span>
                          <span className="text-slate-400">{o.language}</span>
                          <span className="ml-auto opacity-50">{o.timestamp}</span>
                        </div>
                        <pre className="whitespace-pre-wrap text-slate-300 font-mono leading-relaxed bg-black/30 p-3 rounded-lg border border-white/5">
                          {o.output}
                        </pre>
                      </div>
                    ))
                  )}
                </div>
              ) : activeTab === 'input' ? (
                <div className="h-full relative">
                  <textarea
                    value={stdin}
                    onChange={(e) => setStdin(e.target.value)}
                    placeholder="INITIALIZE SYSTEM.IN // ENTER DATA HERE..."
                    className="w-full h-full bg-black/40 border border-white/10 rounded-xl p-6 text-cyan-400 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-all resize-none placeholder-slate-700 font-mono text-xs font-black tracking-widest"
                  />
                  <div className="absolute bottom-4 right-4 text-[8px] font-black tracking-widest text-slate-600 uppercase">
                    INPUT_BUFFER_ACTIVE
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-700">
                  <div className="text-center">
                    <i className="fa-solid fa-bug text-4xl mb-4 opacity-10"></i>
                    <p className="font-black tracking-[0.2em] mb-2 uppercase">DEBUG_MODULE_OFFLINE</p>
                    <p className="text-[10px] tracking-widest uppercase opacity-50">Attach debugger to Begin Session</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Sidebar */}
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-md"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        <div className={`fixed inset-y-0 right-0 z-50 w-85 glass border-l border-white/5 flex flex-col transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0 shadow-[0_0_50px_rgba(0,0,0,0.5)]' : 'translate-x-full'}`}>
          {/* Sidebar Tabs */}
          <div className="flex border-b border-white/5 p-1">
            <button
              onClick={() => setActiveSidebarTab('chat')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-4 transition-all relative ${activeSidebarTab === 'chat'
                ? 'text-cyan-400'
                : 'text-slate-500 hover:text-white'
                }`}
            >
              <i className="fa-solid fa-comments text-xs"></i>
              <span className="text-[9px] font-black tracking-widest uppercase">COMM_LINK</span>
              {chat.length > 0 && (
                <span className="absolute top-2 right-4 px-1 py-0.5 text-[8px] bg-cyan-400 text-black rounded-full font-black animate-pulse">
                  {chat.length}
                </span>
              )}
              {activeSidebarTab === 'chat' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 shadow-[0_0_10px_var(--neon-cyan)]"></div>}
            </button>
            <button
              onClick={() => setActiveSidebarTab('participants')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-4 transition-all relative ${activeSidebarTab === 'participants'
                ? 'text-cyan-400'
                : 'text-slate-500 hover:text-white'
                }`}
            >
              <i className="fa-solid fa-users text-xs"></i>
              <span className="text-[9px] font-black tracking-widest uppercase">NET_AGENTS</span>
              <div className="absolute top-2 right-4 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.8)]"></div>
              {activeSidebarTab === 'participants' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 shadow-[0_0_10px_var(--neon-cyan)]"></div>}
            </button>
            <button
              onClick={() => setActiveSidebarTab('history')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-4 transition-all relative ${activeSidebarTab === 'history'
                ? 'text-cyan-400'
                : 'text-slate-500 hover:text-white'
                }`}
            >
              <i className="fa-solid fa-clock-rotate-left text-xs"></i>
              <span className="text-[9px] font-black tracking-widest uppercase">LOG_ARCHIVE</span>
              {activeSidebarTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 shadow-[0_0_10px_var(--neon-cyan)]"></div>}
            </button>
          </div>       </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-hidden relative">
            {/* Chat Tab */}
            {activeSidebarTab === 'chat' && (
              <div className="h-full flex flex-col animate-in fade-in duration-500">
                <div
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar"
                >
                  {(chat || []).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 text-[10px] font-black tracking-widest text-center px-4 uppercase">
                      <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-6 border-white/5">
                        <i className="fa-regular fa-comment-dots text-2xl opacity-20"></i>
                      </div>
                      <p>COMM_LINK_EMPTY</p>
                      <p className="opacity-40 mt-2">Initialize transmission to begin</p>
                    </div>
                  ) : (
                    (chat || []).map((m: any, idx: number) => {
                      const isMe = m.username === currentUser?.username
                      return (
                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                          <div className={`max-w-[85%] ${isMe ? 'ml-auto' : ''}`}>
                            {!isMe && (
                              <div className="flex items-center gap-2 mb-2 ml-1">
                                <div
                                  className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black text-white shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                                  style={{ backgroundColor: getUserColor(m.username) }}
                                >
                                  {m.username.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{m.username}</span>
                              </div>
                            )}
                            <div
                              className={`px-4 py-3 rounded-2xl text-xs font-medium leading-relaxed ${isMe
                                ? 'bg-cyan-400/90 text-black font-bold rounded-tr-none shadow-[0_0_20px_rgba(0,243,255,0.2)]'
                                : 'glass border-white/5 text-slate-200 rounded-tl-none'
                                }`}
                            >
                              {m.message}
                            </div>
                            <span className="text-[8px] font-black text-slate-600 mt-1.5 block px-1 tracking-widest">
                              {(() => {
                                try {
                                  return format(parseISO(m.at), 'HH:mm')
                                } catch {
                                  return m.at || 'SYNCED'
                                }
                              })().toUpperCase()}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-4 glass-card border-x-0 border-b-0 border-t-white/5 rounded-none mt-auto">
                  <div className="relative group">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="ENTER TRANSMISSION..."
                      className="w-full glass-input pl-6 pr-14 py-4 uppercase font-black tracking-widest text-[10px]"
                    />
                    <button
                      onClick={handleSendChat}
                      disabled={!chatInput.trim()}
                      className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-cyan-400 text-black rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-20 disabled:grayscale shadow-[0_0_15px_rgba(0,243,255,0.3)]"
                    >
                      <i className="fa-solid fa-paper-plane text-xs"></i>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Participants Tab */}
            {activeSidebarTab === 'participants' && (
              <div className="h-full overflow-y-auto p-4 space-y-4 custom-scrollbar animate-in fade-in duration-500">
                <div className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2 px-2">AUTHORIZED_AGENTS ({localUsers.length})</div>
                {localUsers.map((user) => (
                  <div key={user.id} className="glass-card flex items-center gap-4 p-4 border-white/5 group relative overflow-hidden transition-all hover:border-cyan-400/30">
                    <div className="relative z-10">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black text-white shadow-2xl relative overflow-hidden"
                        style={{ backgroundColor: user.color }}
                      >
                        <div className="absolute inset-0 bg-black/20"></div>
                        <span className="relative z-10">{user.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-[#0f172a] ${user.status === 'typing' ? 'bg-yellow-400 animate-pulse' : 'bg-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                        }`}></div>
                    </div>
                    <div className="flex-1 relative z-10">
                      <div className="font-black text-white text-xs tracking-tight group-hover:text-cyan-400 transition-colors uppercase">{user.name}</div>
                      <div className="text-[9px] font-black tracking-widest flex items-center gap-2 mt-1">
                        {user.status === 'typing' ? (
                          <span className="text-yellow-400 animate-pulse">UPLINK_ACTIVE</span>
                        ) : (
                          <span className="text-slate-500">STABLE_CONNECTION</span>
                        )}
                      </div>
                    </div>
                    {user.name === currentUser?.username && (
                      <span className="px-2 py-0.5 text-[8px] font-black bg-cyan-400 text-black rounded uppercase tracking-widest relative z-10">SELF</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* History Tab */}
            {activeSidebarTab === 'history' && (
              <div className="h-full overflow-y-auto p-4 space-y-4 custom-scrollbar animate-in fade-in duration-500">
                <div className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2 px-2">LOG_DATABASE</div>
                {savedFiles.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 text-[10px] font-black tracking-widest uppercase">
                    <i className="fa-solid fa-history text-4xl mb-6 opacity-10"></i>
                    <p>DATABASE_EMPTY</p>
                    <p className="opacity-40 mt-2">Zero records found</p>
                  </div>
                ) : (
                  savedFiles.map((file, idx) => (
                    <div key={idx} className="glass-card p-5 border-white/5 hover:border-cyan-400/30 transition-all cursor-pointer group hover:bg-white/5">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-white tracking-widest uppercase group-hover:text-cyan-400 transition-colors">OP_{savedFiles.length - idx}</span>
                        <span className="text-[9px] font-black text-slate-500 tracking-widest">
                          {new Date(file.createdAt).toLocaleDateString().toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-2 py-0.5 text-[9px] font-black bg-white/5 text-slate-300 rounded uppercase tracking-widest">
                          {file.language}
                        </span>
                        <span className="text-[9px] font-black text-slate-500 truncate uppercase">BY {file.username || 'ANON'}</span>
                      </div>
                      <pre className="text-[9px] text-slate-600 font-mono truncate bg-black/40 p-3 rounded-lg border border-white/5 group-hover:text-slate-400 transition-colors">
                        {file.code ? file.code.substring(0, 100) + '...' : 'NULL_DATA'}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saved Files Modal */}
      {showSavedFiles && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowSavedFiles(false)} />
          <div className="relative glass-card border-white/10 w-full max-w-5xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 glass flex items-center justify-center rounded-2xl border-cyan-400/20 shadow-[0_0_20px_rgba(0,243,255,0.1)]">
                  <i className="fa-solid fa-database text-2xl text-cyan-400"></i>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tighter uppercase">MISSION_LOGS <span className="neon-text-cyan">DATABASE</span></h2>
                  <p className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase mt-1">Authorized Access Only // Operational History</p>
                </div>
              </div>
              <button
                onClick={() => setShowSavedFiles(false)}
                className="w-12 h-12 rounded-xl glass hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all flex items-center justify-center border-white/5"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              {isLoadingFiles ? (
                <div className="py-24 text-center">
                  <div className="w-16 h-16 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mx-auto mb-6"></div>
                  <p className="text-cyan-400 font-black tracking-widest uppercase text-xs animate-pulse">Connecting to Core Database...</p>
                </div>
              ) : savedFiles.length === 0 ? (
                <div className="py-24 text-center">
                  <div className="text-6xl mb-8 opacity-20">📂</div>
                  <h3 className="text-white text-xl font-black tracking-widest uppercase mb-4">ARCHIVE_IS_EMPTY</h3>
                  <p className="text-slate-500 text-xs font-medium tracking-widest">No mission data has been logged in this sector.</p>
                </div>
              ) : (
                <div className="grid gap-8">
                  {savedFiles.map((file, idx) => (
                    <div key={idx} className="glass-card p-6 border-white/5 group hover:border-cyan-400/30 transition-all">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
                        <div className="flex items-center gap-6">
                          <span className="px-4 py-1.5 rounded-full text-[10px] font-black bg-cyan-400 text-black uppercase tracking-widest">
                            {file.language}
                          </span>
                          <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                            <i className="fa-solid fa-clock mr-2 text-cyan-400"></i>
                            {new Date(file.createdAt).toLocaleString().toUpperCase()}
                          </div>
                          <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                            <i className="fa-solid fa-user mr-2 text-magenta-400"></i>
                            OPERATOR: <span className="text-white">{file.username || 'UNKNOWN'}</span>
                          </div>
                        </div>
                        <button className="lg:opacity-0 group-hover:opacity-100 px-6 py-2 rounded-lg glass border-white/10 text-slate-400 hover:text-white transition-all text-[10px] font-black tracking-widest uppercase">
                          MANAGE_LOG
                        </button>
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        <div className="bg-black/40 rounded-2xl p-6 border border-white/5">
                          <div className="text-[9px] font-black text-slate-500 mb-4 uppercase tracking-[0.3em] flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                            SOURCE_ENCODING
                          </div>
                          <pre className="text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap max-h-48 custom-scrollbar custom-scrollbar-thin">
                            {file.code || 'NO_CODE_LOGGED'}
                          </pre>
                        </div>
                        <div className="bg-black/40 rounded-2xl p-6 border border-white/5">
                          <div className="text-[9px] font-black text-slate-500 mb-4 uppercase tracking-[0.3em] flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                            OUTPUT_RESULT
                          </div>
                          <pre className="text-xs text-green-400/80 font-mono overflow-x-auto whitespace-pre-wrap max-h-48 custom-scrollbar custom-scrollbar-thin">
                            {file.output || 'NO_OUTPUT_LOGGED'}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Join Requests Modal (Owner Only) */}
      {joinRequests.length > 0 && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in zoom-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          <div className="relative glass-card border-cyan-400/30 w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(0,243,255,0.2)]">
            <div className="p-6 border-b border-white/5 bg-white/5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl glass border-cyan-400/20 flex items-center justify-center animate-pulse">
                <i className="fa-solid fa-satellite-dish text-cyan-400"></i>
              </div>
              <h2 className="text-sm font-black text-white tracking-widest uppercase">INCOMING_SIGNAL ({joinRequests.length})</h2>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
              {joinRequests.map((req, idx) => (
                <div key={idx} className="glass-card p-6 border-white/5 animate-in slide-in-from-top-4">
                  <p className="text-slate-300 mb-6 text-[11px] leading-relaxed font-medium uppercase tracking-wider">
                    <span className="font-black text-cyan-400">{req.username}</span> is requesting biometric access to this sector.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleProcessJoinRequest(req, false)}
                      className="flex-1 py-3 bg-white/5 hover:bg-rose-500 hover:text-white text-slate-400 text-[10px] font-black tracking-widest rounded-xl transition-all uppercase"
                    >
                      DENY
                    </button>
                    <button
                      onClick={() => handleProcessJoinRequest(req, true)}
                      className="flex-1 py-3 neon-button-cyan text-[10px] font-black tracking-widest rounded-xl uppercase"
                    >
                      GRANT
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create File Modal */}
      {showCreateFileModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in zoom-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowCreateFileModal(false)} />
          <div className="relative glass-card border-white/10 w-full max-w-md overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)]">
            <div className="p-8 border-b border-white/5 bg-white/5">
              <h2 className="text-xl font-black text-white flex items-center gap-4 tracking-tighter uppercase">
                <div className="w-12 h-12 glass border-cyan-400/20 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(0,243,255,0.1)]">
                  <i className="fa-solid fa-file-circle-plus text-cyan-400 text-xl"></i>
                </div>
                INITIALIZE_NEW <span className="neon-text-cyan">MODULE</span>
              </h2>
            </div>

            <div className="p-8 space-y-8">
              {/* Language Selection */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-[0.2em]">
                  CORE_ENVIRONMENT
                </label>
                <div className="relative group">
                  <select
                    value={newFileLanguage}
                    onChange={(e) => setNewFileLanguage(e.target.value)}
                    className="w-full glass-input px-6 py-4 appearance-none text-cyan-400 font-black tracking-widest text-[10px] uppercase"
                  >
                    {languages.map((lang) => (
                      <option key={lang.key} value={lang.key} className="bg-[#0f172a] text-white">
                        {lang.label.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 group-hover:text-cyan-400 transition-colors">
                    <i className="fa-solid fa-chevron-down text-xs"></i>
                  </div>
                </div>
              </div>

              {/* Filename Input */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-[0.2em]">
                  MODULE_IDENTIFIER
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleCreateFile()
                    }}
                    placeholder={`e.g., MAIN${getFileExtension(newFileLanguage).toUpperCase()}`}
                    className="w-full glass-input px-6 py-4 text-white font-black tracking-widest text-[10px] uppercase placeholder-slate-700"
                    autoFocus
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-white/5 text-[8px] font-black text-slate-500 rounded border border-white/5">
                    {getFileExtension(newFileLanguage).toUpperCase()}
                  </div>
                </div>
                <p className="mt-4 text-[9px] font-black text-slate-600 tracking-widest uppercase text-center opacity-60">
                  SYSTEM will Automatically Append extension if payload is Null
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowCreateFileModal(false)}
                  className="flex-1 px-6 py-4 glass border-white/5 hover:bg-white/10 text-slate-400 font-black tracking-widest text-[10px] rounded-2xl transition-all uppercase"
                >
                  ABORT
                </button>
                <button
                  onClick={handleCreateFile}
                  disabled={!newFileName.trim()}
                  className="flex-1 px-6 py-4 neon-button-cyan font-black tracking-widest text-[10px] rounded-2xl transition-all disabled:opacity-20 disabled:grayscale uppercase"
                >
                  INITIALIZE_MODULE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
