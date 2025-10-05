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
  const [isLexiInitialized, setIsLexiInitialized] = useState(false);
  const [isARMode, setIsARMode] = useState(false);


  const handleLexiInitialized = () => {
    setIsLexiInitialized(true);
  };


  const getCanvasBackground = () => {
    if (theme === 'dark') {
      return 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)';
    }
    return 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)';
  };

  return (
    <div className={`h-screen w-full overflow-hidden relative transition-colors duration-300 ${theme === 'dark'
      ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700'
      : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'
      }`}>
      {/* Animated background glow */}
      <div className={`absolute inset-0 animate-pulse ${theme === 'dark'
        ? 'bg-gradient-to-br from-blue-500/5 via-purple-500/3 to-pink-500/5'
        : 'bg-gradient-to-br from-blue-400/10 via-purple-500/5 to-pink-400/10'
        }`}></div>

      {/* Header */}
      <div className={`absolute top-0 left-0 right-0 z-20 backdrop-blur-md border-b shadow-sm transition-colors duration-300 ${theme === 'dark'
        ? 'bg-slate-900/90 border-slate-700/50'
        : 'bg-white/90 border-gray-200/50'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold bg-clip-text text-transparent ${theme === 'dark'
                ? 'bg-gradient-to-r from-blue-400 to-purple-400'
                : 'bg-gradient-to-r from-blue-600 to-purple-600'
                }`}>
                Talking Lexi
              </h1>
              <p className={`text-xs sm:text-sm mt-1 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-600'
                }`}>
                3D AI Assistant • Interactive Experience
              </p>
            </div>
            <div className="absolute right-4 flex items-center space-x-3">
              {/* AR Mode Toggle */}
              <button
                onClick={() => setIsARMode(!isARMode)}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${isARMode
                  ? 'bg-blue-600 text-white shadow-lg'
                  : theme === 'dark'
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                title={isARMode ? 'Switch to Regular Mode' : 'Switch to AR Mode'}
              >
                {isARMode ? '📹 AR' : '🎮 3D'}
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
          >
            <Scene />
          </Canvas>
        </Suspense>
      )}

      {/* Control Instructions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
        <div className={`backdrop-blur-sm px-4 py-3 rounded-xl text-xs sm:text-sm shadow-lg border transition-colors duration-300 ${theme === 'dark'
          ? 'bg-slate-800/80 text-slate-200 border-slate-600/30'
          : 'bg-black/80 text-white border-white/10'
          }`}>
          <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-6">
            {isARMode ? (
              <>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-400">📹</span>
                  <span>AR Mode Active</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">🖱️</span>
                  <span>Drag to rotate</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-purple-400">🔍</span>
                  <span>Scroll to zoom</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-400">🖱️</span>
                  <span>Drag to rotate</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">🔍</span>
                  <span>Scroll to zoom</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-purple-400">📱</span>
                  <span>Touch friendly</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Reset Camera Button */}
      <button
        className={`absolute top-20 right-16 z-20 backdrop-blur-sm px-3 py-2 rounded-lg text-xs sm:text-sm font-medium shadow-lg border transition-all duration-200 hover:shadow-xl ${theme === 'dark'
          ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-600/50'
          : 'bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 border-gray-200/50'
          }`}
        onClick={() => window.location.reload()}
      >
        🔄 Reset View
      </button>

      {/* Performance indicator */}
      <div className={`absolute top-20 left-4 z-20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium shadow-lg transition-colors duration-300 ${theme === 'dark'
        ? 'bg-green-500/90 text-white'
        : 'bg-green-500/90 text-white'
        }`}>
        ⚡ Optimized
      </div>

      {/* Voice Controls */}
      <VoiceControlsWithConversation />

      {/* Conversation Log */}
      <ConversationLog />

      {/* Start Lexi Button - Show if not initialized */}
      {!isLexiInitialized && (
        <StartLexiButton onInitialized={handleLexiInitialized} />
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ConversationProvider>
        <VoiceStateProvider>
          <AppContent />
        </VoiceStateProvider>
      </ConversationProvider>
    </ThemeProvider>
  );
}

export default App;
