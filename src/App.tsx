import { Canvas } from '@react-three/fiber';
import { Suspense, useState } from 'react';
import { Scene } from './components/Scene';
import { ARScene } from './components/ARScene';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import { ConversationProvider, useConversation } from './contexts/ConversationContext';
import { VoiceStateProvider } from './contexts/VoiceStateContext';
import { VoiceControls } from './components/VoiceControls';
import { ConversationLog } from './components/ConversationLog';
import { StartLexiButton } from './components/StartLexiButton';
import { AnimatedBackground } from './components/AnimatedBackground';
import { PluginProvider, usePluginContextSafe } from './contexts/PluginContext';
import { PluginCardSimple } from './components/PluginCardSimple';
import { Home, MessageSquare, Box as BoxIcon, Info } from 'lucide-react';

function VoiceControlsWithConversation() {
  const { addMessage } = useConversation();

  return (
    <VoiceControls
      onMessage={(message) => addMessage(message)}
    />
  );
}

function AppContent() {
  const { theme } = useTheme();
  const { toggleVisibility } = useConversation();
  const pluginContext = usePluginContextSafe();
  const [isLexiInitialized, setIsLexiInitialized] = useState(false);
  const [isARMode, setIsARMode] = useState(false);
  const [showAbout, setShowAbout] = useState(false);


  const handleLexiInitialized = () => {
    setIsLexiInitialized(true);
  };


  const getCanvasBackground = () => {
    if (isARMode) return 'transparent';
    if (theme === 'dark') {
      return 'transparent';
    }
    return 'transparent';
  };

  return (
    <div className={`h-screen w-full overflow-hidden relative transition-colors duration-300 ${theme === 'dark' ? 'holographic-bg' : 'holographic-bg-light'}`}>
      {/* Animated Background (disabled in AR to keep webcam visible) */}
      {!isARMode && (
        <AnimatedBackground className="pointer-events-none" isARMode={false} />
      )}

      {/* Floating particles effect (3D mode only) */}
      {!isARMode && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-indigo-400/30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className={`${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel'} rounded-2xl px-6 py-4 flex items-center justify-between shadow-2xl`}>
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center glow-effect">
                <span className="text-white text-lg">🤖</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Talking Lexi
              </span>
            </div>

            {/* Center Navigation */}
            <div className={`flex items-center gap-1 rounded-xl px-2 py-2 ${theme === 'dark' ? 'glass-panel' : 'glass-panel'}`}>
              <NavLink icon={Home} label="Home" active onClick={() => { }} />
              <NavLink icon={MessageSquare} label="Chat" onClick={() => toggleVisibility()} />
              <NavLink icon={BoxIcon} label="3D Mode" onClick={() => setIsARMode(false)} />
              {/* Removed duplicate 3D Mode link to avoid redundancy with right chip */}
              <NavLink icon={Info} label="About" onClick={() => setShowAbout(true)} />
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
              {/* 3D/AR Toggle */}
              <button
                onClick={() => setIsARMode(!isARMode)}
                className={`glass-panel rounded-xl px-4 py-2 flex items-center gap-2 transition-all hover:scale-105 ${!isARMode ? 'glow-effect bg-indigo-500/20' : ''}`}
                title={isARMode ? 'Switch to 3D Mode' : 'Switch to AR Mode'}
              >
                <BoxIcon className={`w-4 h-4 ${!isARMode ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span className={`${!isARMode ? 'text-indigo-400' : 'text-slate-400'} text-sm font-medium`}>{!isARMode ? '3D' : 'AR'}</span>
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* 3D Canvas or AR Scene */}
      {isARMode ? (
        <ARScene className="w-full h-full" />
      ) : (
        <Suspense fallback={<LoadingSpinner />}>
          <Canvas
            camera={{
              position: [0, 1, 5],
              fov: 50,
              near: 0.1,
              far: 1000
            }}
            shadows
            className="w-full h-full"
            style={{
              background: getCanvasBackground()
            }}
            dpr={[1, 2]}
            onCreated={({ gl }) => {
              // Slightly lower exposure for crisper highlights in 3D
              try { (gl as any).toneMappingExposure = 0.95; } catch { }
            }}
          >
            <Scene isARMode={isARMode} />
          </Canvas>
        </Suspense>
      )}

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-30 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAbout(false)} />
          <div className="relative z-40 glass-panel-dark rounded-2xl p-6 w-[28rem] max-w-[92vw] shadow-2xl border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-200">About Talking Lexi</h3>
              <button className="text-slate-400 hover:text-slate-200" onClick={() => setShowAbout(false)}>✕</button>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Talking Lexi is a 3D AI assistant experience. Use the 3D/AR toggle to switch
              modes, the mic to talk, and the Chat panel to view conversation history.
            </p>
          </div>
        </div>
      )}







      {/* Voice Controls */}
      <VoiceControlsWithConversation />

      {/* Conversation Log */}
      <ConversationLog />

      {/* Start Lexi Button - Show if not initialized */}
      {!isLexiInitialized && (
        <StartLexiButton onInitialized={handleLexiInitialized} />
      )}


      {/* Plugin Card - Display results from test panel */}
      {pluginContext?.currentResult && (
        <PluginCardSimple
          result={pluginContext.currentResult}
          onClose={pluginContext.clearResult}
        />
      )}
    </div>
  );
}

function NavLink({ icon: Icon, label, active = false, onClick }: { icon: any; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${active
        ? 'bg-indigo-500/20 text-indigo-400'
        : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
        }`}
      onClick={onClick}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ConversationProvider>
        <VoiceStateProvider>
          <PluginProvider>
            <AppContent />
          </PluginProvider>
        </VoiceStateProvider>
      </ConversationProvider>
    </ThemeProvider>
  );
}

export default App;
