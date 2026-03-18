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
    <div className="min-h-screen bg-dots text-gray-300 flex flex-col font-sans relative overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[radial-gradient(circle,rgba(0,243,255,0.08)_0%,transparent_70%)] z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-[radial-gradient(circle,rgba(168,85,247,0.08)_0%,transparent_70%)] z-0 pointer-events-none"></div>

      {/* Navbar */}
      <nav className="h-24 px-6 md:px-12 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center relative group overflow-hidden">
            <div className="absolute inset-0 bg-cyan-400/10 transition-colors"></div>
            <img src={logo} alt="Logo" className="w-7 h-7 object-contain relative z-10 filter drop-shadow(0 0 5px rgba(0,243,255,0.5))" />
          </div>
          <h1 className="text-xl font-black tracking-tighter uppercase text-white">
            COLLAB<span className="neon-text-cyan">CODE</span>
          </h1>
        </div>

        <div className="hidden md:flex items-center gap-10">
          <a href="#features" className="text-[10px] font-black tracking-[0.2em] text-slate-500 hover:text-cyan-400 uppercase transition-colors">Features</a>
          <a href="#about" className="text-[10px] font-black tracking-[0.2em] text-slate-500 hover:text-cyan-400 uppercase transition-colors">Protocol</a>
          <button 
            onClick={handleAction}
            className="px-8 py-3 glass border-white/10 hover:border-cyan-400/30 text-[10px] font-black tracking-[0.2em] uppercase transition-all rounded-xl"
          >
            {user ? 'DASHBOARD_LINK' : 'TERMINAL_ACCESS'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10 pt-20 pb-32">
        <div className="inline-flex items-center gap-3 px-4 py-2 glass border-white/5 rounded-full mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(0,243,255,0.8)]"></span>
          <span className="text-[9px] font-black tracking-[0.3em] text-cyan-400 uppercase">System_Online // Sector_Alpha_Active</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase leading-[0.9] mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          Collaborative<br />
          <span className="neon-text-cyan">Code_Evolution</span>
        </h1>

        <p className="max-w-2xl text-slate-400 text-sm md:text-base font-medium leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          Initialize multi-agent development sessions with real-time biometric sync. 
          The ultimate protocol for decentralized engineering teams.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
          <button 
            onClick={handleAction}
            className="neon-button-cyan h-16 px-12 text-sm"
          >
            {user ? 'RETURN_TO_DASHBOARD' : 'INITIALIZE_NEW_SESSION'}
            <i className="fa-solid fa-bolt-lightning"></i>
          </button>
          {!user && (
            <button 
              onClick={() => navigate('/register')}
              className="h-16 px-12 glass border-white/10 hover:border-magenta-400/30 text-[10px] font-black tracking-[0.2em] uppercase transition-all rounded-2xl group"
            >
              CREATE_BIOMETRIC_ID
              <i className="fa-solid fa-id-card ml-3 group-hover:scale-110 transition-transform"></i>
            </button>
          )}
        </div>

        {/* Hero Visual */}
        <div className="mt-32 w-full max-w-5xl relative group px-4">
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-400/20 to-purple-500/20 rounded-[3rem] blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <div className="glass-card border-white/5 overflow-hidden animate-float">
            <div className="h-12 border-b border-white/5 flex items-center px-6 gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50"></div>
              <div className="ml-4 px-3 py-1 glass border-white/5 rounded text-[8px] font-black tracking-widest text-slate-500 uppercase">core_module.sh</div>
            </div>
            <div className="p-8 text-left font-mono text-xs space-y-4">
              <div className="flex gap-4">
                <span className="text-slate-700 w-4">01</span>
                <span className="text-cyan-400 font-bold">protocol</span>
                <span className="text-white">InitializeSystem(</span>
                <span className="text-amber-400">"ALPHA_SECTOR"</span>
                <span className="text-white">)</span>
              </div>
              <div className="flex gap-4">
                <span className="text-slate-700 w-4">02</span>
                <span className="text-slate-500 ml-4">// Syncing biometric data...</span>
              </div>
              <div className="flex gap-4">
                <span className="text-slate-700 w-4">03</span>
                <span className="text-purple-400 font-bold">await</span>
                <span className="text-white">SecureHandshake.connect();</span>
              </div>
              <div className="flex gap-4">
                <span className="text-slate-700 w-4">04</span>
                <span className="text-green-400 font-bold">status</span>
                <span className="text-white">CONNECTION_ESTABLISHED</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 relative z-10 border-t border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl font-black tracking-tighter text-white uppercase mb-4">Core_Protocols</h2>
            <p className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">Advanced Integrated Capabilities</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: 'fa-solid fa-bolt', title: 'Realtime_Sync', color: 'cyan', desc: 'Instant binary synchronization across all connected agents with zero latency.' },
              { icon: 'fa-solid fa-shield-halved', title: 'Encrypted_Link', color: 'purple', desc: 'Military-grade end-to-end encryption for all mission-critical data streams.' },
              { icon: 'fa-solid fa-microchip', title: 'Neural_Engine', color: 'green', desc: 'Advanced AI processing for deep scan analysis and real-time optimization.' }
            ].map((feature, i) => (
              <div key={i} className="glass-card p-10 border-white/5 group hover:border-cyan-400/30 transition-all">
                <div className={`w-16 h-16 glass rounded-2xl flex items-center justify-center mb-8 border-${feature.color}-400/20 text-2xl text-${feature.color}-400 group-hover:scale-110 transition-transform`}>
                  <i className={feature.icon}></i>
                </div>
                <h3 className="text-xl font-black tracking-tight text-white uppercase mb-4 group-hover:text-cyan-400 transition-colors">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 px-6 relative z-10 bg-dots border-t border-white/5">
        <div className="max-w-4xl mx-auto glass-card p-12 md:p-20 border-white/5 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/5 blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-black tracking-tighter text-white uppercase mb-8">System_Manifesto</h2>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed mb-12">
              CollabCode is a Next-Generation development vector designed for modern engineering squads. 
              By utilizing decentralized communication protocols and real-time visual synchronization, 
              we eliminate the friction between thought and code.
            </p>
            <button 
              onClick={handleAction}
              className="px-10 py-4 glass border-white/10 hover:border-cyan-400/30 text-[10px] font-black tracking-[0.3em] uppercase transition-all rounded-full"
            >
              Access_Archive
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5 text-center relative z-10">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="w-8 h-8 glass rounded-lg flex items-center justify-center">
            <img src={logo} alt="Logo" className="w-4 h-4 opacity-50" />
          </div>
          <span className="text-[10px] font-black tracking-[0.3em] text-slate-600 uppercase">CollabCode © 2026 // Sector_Alpha</span>
        </div>
        <div className="flex gap-8 justify-center">
          {['github', 'twitter', 'discord'].map(social => (
            <a key={social} href="#" className="text-slate-600 hover:text-cyan-400 transition-colors">
              <i className={`fa-brands fa-${social} text-lg`}></i>
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
