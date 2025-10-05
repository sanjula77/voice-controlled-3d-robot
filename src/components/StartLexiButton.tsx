import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { properSpeechService } from '../services/properSpeechService';

interface StartLexiButtonProps {
    onInitialized: () => void;
}

export function StartLexiButton({ onInitialized }: StartLexiButtonProps) {
    const { theme } = useTheme();
    const [isInitializing, setIsInitializing] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const handleStartLexi = async () => {
        setIsInitializing(true);

        try {
            console.log('Starting Lexi initialization...');

            // Initialize audio context on user gesture
            await properSpeechService.initializeAudioContext();

            console.log('Lexi initialized successfully!');
            setIsInitialized(true);
            onInitialized();

            // Test speech to confirm it's working
            await properSpeechService.speak("Hello! I'm Lexi, your AI assistant. I'm ready to help you!");

        } catch (error) {
            console.error('Failed to initialize Lexi:', error);
            alert('Failed to initialize audio. Please try again.');
        } finally {
            setIsInitializing(false);
        }
    };

    if (isInitialized) {
        return (
            <div className={`absolute inset-0 flex items-center justify-center z-30 ${theme === 'dark' ? 'bg-slate-900/95' : 'bg-white/95'
                }`}>
                <div className={`text-center p-8 rounded-xl shadow-xl border ${theme === 'dark'
                    ? 'bg-slate-800 border-slate-600 text-slate-200'
                    : 'bg-white border-gray-200 text-gray-800'
                    }`}>
                    <div className="mb-4">
                        <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-2xl">✅</span>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Lexi is Ready!</h2>
                        <p className="text-sm opacity-75">
                            Audio context activated successfully. You can now interact with Lexi!
                        </p>
                    </div>
                    <button
                        onClick={() => setIsInitialized(false)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${theme === 'dark'
                            ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                            }`}
                    >
                        Reinitialize
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`absolute inset-0 flex items-center justify-center z-30 ${theme === 'dark' ? 'bg-slate-900/95' : 'bg-white/95'
            }`}>
            <div className={`text-center p-8 rounded-xl shadow-xl border ${theme === 'dark'
                ? 'bg-slate-800 border-slate-600 text-slate-200'
                : 'bg-white border-gray-200 text-gray-800'
                }`}>
                <div className="mb-6">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-3xl">🤖</span>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Welcome to Talking Lexi</h1>
                    <p className="text-sm opacity-75 mb-4">
                        Your 3D AI Assistant is ready to help you!
                    </p>
                    <p className="text-xs opacity-60">
                        Click the button below to activate audio and start your conversation with Lexi.
                    </p>
                </div>

                <button
                    onClick={handleStartLexi}
                    disabled={isInitializing}
                    className={`px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 ${isInitializing
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : theme === 'dark'
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                            : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl'
                        }`}
                >
                    {isInitializing ? (
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Initializing Lexi...</span>
                        </div>
                    ) : (
                        '🚀 Click to Start Lexi'
                    )}
                </button>

                <p className="text-xs opacity-50 mt-4">
                    This activates your browser's audio context for voice interaction
                </p>
            </div>
        </div>
    );
}
