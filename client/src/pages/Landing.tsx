import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleAction = () => {
    if (user) {
      navigate('/rooms');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-dots text-zinc-300 flex flex-col font-sans relative overflow-x-hidden">
      {/* Navbar */}
      <nav className="h-20 px-6 md:px-12 flex items-center justify-between relative z-10 border-b border-white/5 bg-black/50 backdrop-blur-md">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center">
            <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <h1 className="text-lg font-semibold text-white tracking-tight">
            CollabCode
          </h1>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Features</a>
          <a href="#about" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">About</a>
          <button 
            onClick={handleAction}
            className="px-4 py-2 bg-white text-black text-sm font-medium rounded-md hover:bg-zinc-200 transition-colors"
          >
            {user ? 'Dashboard' : 'Sign In'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10 pt-24 pb-32">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full mb-8">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="text-xs font-medium text-zinc-300">CollabCode 2.0 is now live</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white leading-tight mb-6 max-w-4xl">
          Build together, <br />
          <span className="text-blue-400">in real-time.</span>
        </h1>

        <p className="max-w-2xl text-zinc-400 text-lg md:text-xl leading-relaxed mb-10">
          The collaborative code editor designed for modern development teams. Write code, share ideas, and ship faster with seamless real-time synchronization.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={handleAction}
            className="h-12 px-8 bg-white text-black font-semibold rounded-md hover:bg-zinc-200 transition-colors text-base"
          >
            {user ? 'Go to Dashboard' : 'Start Coding for Free'}
          </button>
          {!user && (
            <button 
              onClick={() => navigate('/register')}
              className="h-12 px-8 glass border-zinc-800 text-white font-semibold rounded-md hover:bg-zinc-900 transition-colors text-base"
            >
              Create Account
            </button>
          )}
        </div>

        {/* Hero Visual */}
        <div className="mt-24 w-full max-w-5xl relative group px-4">
          <div className="glass-card overflow-hidden shadow-2xl border-zinc-800">
            <div className="h-10 border-b border-zinc-800 flex items-center px-4 gap-2 bg-zinc-900/50">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="ml-4 text-xs font-medium text-zinc-500 flex-1 text-center pr-12">index.tsx — CollabCode</div>
            </div>
            <div className="p-8 text-left font-mono text-sm space-y-2 bg-zinc-950 text-zinc-300">
              <div className="flex gap-4">
                <span className="text-zinc-600 w-6 text-right select-none">1</span>
                <span><span className="text-pink-400">import</span> &#123; <span className="text-blue-300">useState</span>, <span className="text-blue-300">useEffect</span> &#125; <span className="text-pink-400">from</span> <span className="text-green-300">'react'</span>;</span>
              </div>
              <div className="flex gap-4">
                <span className="text-zinc-600 w-6 text-right select-none">2</span>
                <span><span className="text-pink-400">import</span> &#123; <span className="text-blue-300">RoomProvider</span> &#125; <span className="text-pink-400">from</span> <span className="text-green-300">'@collab/core'</span>;</span>
              </div>
              <div className="flex gap-4">
                <span className="text-zinc-600 w-6 text-right select-none">3</span>
                <span></span>
              </div>
              <div className="flex gap-4 relative">
                <span className="text-zinc-600 w-6 text-right select-none">4</span>
                <span><span className="text-pink-400">export default function</span> <span className="text-blue-400">App</span>() &#123;</span>
                <span className="absolute left-64 w-0.5 h-5 bg-blue-500 animate-pulse"></span>
                <span className="absolute left-64 -top-6 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow">Guest</span>
              </div>
              <div className="flex gap-4">
                <span className="text-zinc-600 w-6 text-right select-none">5</span>
                <span>  <span className="text-pink-400">return</span> (</span>
              </div>
              <div className="flex gap-4">
                <span className="text-zinc-600 w-6 text-right select-none">6</span>
                <span>    <span className="text-zinc-500">&lt;</span><span className="text-blue-400">RoomProvider</span> <span className="text-blue-200">id</span>=<span className="text-green-300">"team-alpha"</span><span className="text-zinc-500">&gt;</span></span>
              </div>
              <div className="flex gap-4">
                <span className="text-zinc-600 w-6 text-right select-none">7</span>
                <span>      <span className="text-zinc-500">&lt;</span><span className="text-blue-400">Editor</span> <span className="text-zinc-500">/&gt;</span></span>
              </div>
              <div className="flex gap-4">
                <span className="text-zinc-600 w-6 text-right select-none">8</span>
                <span>    <span className="text-zinc-500">&lt;/</span><span className="text-blue-400">RoomProvider</span><span className="text-zinc-500">&gt;</span></span>
              </div>
              <div className="flex gap-4">
                <span className="text-zinc-600 w-6 text-right select-none">9</span>
                <span>  );</span>
              </div>
              <div className="flex gap-4">
                <span className="text-zinc-600 w-6 text-right select-none">10</span>
                <span>&#125;</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 relative z-10 border-t border-zinc-800/50 bg-zinc-950/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-4">Everything you need to ship faster</h2>
            <p className="text-zinc-400 text-lg">Powerful features wrapped in an elegant interface.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: 'fa-solid fa-bolt', title: 'Real-time Collaboration', desc: 'Code together with your team without any noticeable delay.' },
              { icon: 'fa-solid fa-lock', title: 'Secure Rooms', desc: 'Keep your codebase safe with private, invite-only rooms.' },
              { icon: 'fa-solid fa-code', title: 'Syntax Highlighting', desc: 'Rich support for all major programming languages and frameworks.' }
            ].map((feature, i) => (
              <div key={i} className="glass-card p-8 border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 text-zinc-300">
                  <i className={feature.icon}></i>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-900 text-center relative z-10">
        <div className="flex items-center justify-center gap-2 mb-6 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
          <img src={logo} alt="Logo" className="w-4 h-4 opacity-50 block" />
          <span className="text-sm font-medium text-zinc-500">CollabCode</span>
        </div>
        <p className="text-sm text-zinc-600">© 2026 CollabCode. All rights reserved.</p>
      </footer>
    </div>
  );
}
