import { useState, useEffect } from 'react';
import { Mic, MicOff, Brain, Volume2, Pause, Play, Square } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { speechService } from '../services/speechService';
import { aiService, AIResponse } from '../services/aiService';
import { useTheme } from '../contexts/ThemeContext';
import { useVoiceState } from '../contexts/VoiceStateContext';
import { usePluginContextSafe } from '../contexts/PluginContext';

interface VoiceControlsProps {
    onMessage?: (message: { text: string; isUser: boolean; timestamp: Date }) => void;
}

export function VoiceControls({ onMessage }: VoiceControlsProps) {
    const { theme } = useTheme();
    const { setVoiceState, updateAudioLevel, analyzeSentiment } = useVoiceState();
    const pluginContext = usePluginContextSafe();
    const [apiKey, setApiKey] = useState('');
    const [showApiKeyInput, setShowApiKeyInput] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [lastModelUsed, setLastModelUsed] = useState<string>('');
    const [modelAttempts, setModelAttempts] = useState<string[]>([]);
    const [showDebugPanel, setShowDebugPanel] = useState(false);

    const speechRecognition = useSpeechRecognition({
        continuous: false,
        interimResults: true,
        onResult: (transcript, isFinal) => {
            if (isFinal && transcript.trim()) {
                handleUserInput(transcript.trim());
            }
        },
        onStart: () => {
            setVoiceState({ isListening: true });
        },
        onEnd: () => {
            setVoiceState({ isListening: false });
        },
        onError: (error) => {
            console.error('Speech recognition error:', error);
            setVoiceState({ isListening: false });
        }
    });

    const textToSpeech = useTextToSpeech({
        useDeepgram: speechService.isReady(),
        onStart: () => {
            setIsProcessing(false);
            setVoiceState({ isSpeaking: true });
        },
        onEnd: () => {
            setIsProcessing(false);
            setVoiceState({ isSpeaking: false });
        },
        onError: (error) => {
            console.error('Text-to-speech error:', error);
            setIsProcessing(false);
            setVoiceState({ isSpeaking: false });
        },
        onAudioLevelChange: (level) => {
            updateAudioLevel(level);
        }
    });

    useEffect(() => {
        // Check if AI service is ready (OpenRouter API key)
        if (aiService.isReady()) {
            setShowApiKeyInput(false);
        } else {
            setShowApiKeyInput(true);
        }
    }, []);

    const handleUserInput = async (userText: string) => {
        if (!userText.trim()) return;

        console.log('User input received:', userText);
        setIsProcessing(true);

        // Add user message to conversation
        if (onMessage) {
            onMessage({
                text: userText,
                isUser: true,
                timestamp: new Date()
            });
        }

        // Update emotion immediately based on user input (before processing)
        try {
            console.log('🎨 Analyzing sentiment for:', userText);
            const emotion = await analyzeSentiment(userText);
            console.log('🎨 Emotion set to:', emotion);
        } catch (error) {
            console.error('🎨 Sentiment analysis failed:', error);
            // Sentiment analysis failed, continue with neutral emotion
        }

        try {
            // Show thinking indicator immediately
            setIsThinking(true);
            setVoiceState({ isThinking: true });
            console.log('🤔 Starting AI processing...');

            let response = '';
            let usedPlugin = false;

            // Try plugin system first (if available)
            if (pluginContext) {
                try {
                    const pluginResponse = await pluginContext.processUserInput(userText);
                    if (pluginResponse.pluginUsed) {
                        // Plugin handled the request
                        console.log('Plugin response:', pluginResponse);
                        response = pluginResponse.result.summary;
                        usedPlugin = true;
                    }
                } catch (error) {
                    console.log('Plugin system not available or failed, falling back to AI');
                }
            }

            // Fall back to AI if no plugin was used
            if (!usedPlugin) {
                console.log('🧠 Calling AI service...');
                const aiResponse: AIResponse = await aiService.getAIResponse(userText);
                console.log('✅ AI response received:', aiResponse);

                // Update model information
                if (aiResponse.modelUsed) {
                    setLastModelUsed(aiResponse.modelUsed);
                }

                // Update model attempts for debugging
                const attempts = aiService.getModelAttempts();
                setModelAttempts(attempts.map(attempt =>
                    `${attempt.model}: ${attempt.success ? '✅' : '❌'} (${attempt.responseTime}ms)`
                ));

                // Use AI response or fallback
                response = aiResponse.success
                    ? aiResponse.content
                    : aiService.generateFallbackResponse(userText);
            }

            // Add response to conversation
            if (onMessage) {
                onMessage({
                    text: response,
                    isUser: false,
                    timestamp: new Date()
                });
            }

            // Hide thinking indicator
            setIsThinking(false);
            setVoiceState({ isThinking: false });

            // Speak the response
            console.log('Attempting to speak response...');
            await textToSpeech.speak(response);
            console.log('Speech completed');

        } catch (error) {
            console.error('Error processing user input:', error);
            setIsThinking(false);
            setIsProcessing(false);
            setVoiceState({ isThinking: false, isProcessing: false });
        }
    };

    const handleApiKeySubmit = () => {
        if (apiKey.trim()) {
            aiService.setApiKey(apiKey.trim());
            setShowApiKeyInput(false);
            setApiKey('');
        }
    };

    // Status label/style for compact text-only chip (no icons)
    const getStatusLabel = () => {
        if (speechRecognition.isListening) return 'Listening';
        if (isThinking || pluginContext?.isProcessing) return 'Thinking';
        if (isProcessing) return 'Processing';
        if (textToSpeech.isSpeaking) return 'Speaking';
        return 'Ready';
    };

    const getStatusClass = () => {
        const tone = theme === 'dark'
            ? {
                base: 'px-2 py-1 rounded-full text-xs',
                listening: 'bg-rose-500/20 text-rose-200',
                thinking: 'bg-violet-500/25 text-violet-200',
                processing: 'bg-amber-500/20 text-amber-200',
                speaking: 'bg-emerald-500/20 text-emerald-200',
                ready: 'bg-indigo-500/20 text-indigo-200',
            }
            : {
                base: 'px-2 py-1 rounded-full text-xs',
                listening: 'bg-rose-600/10 text-rose-700',
                thinking: 'bg-violet-600/10 text-violet-700',
                processing: 'bg-amber-600/10 text-amber-700',
                speaking: 'bg-emerald-600/10 text-emerald-700',
                ready: 'bg-indigo-600/10 text-indigo-700',
            };

        if (speechRecognition.isListening) return `${tone.base} ${tone.listening}`;
        if (isThinking || pluginContext?.isProcessing) return `${tone.base} ${tone.thinking}`;
        if (isProcessing) return `${tone.base} ${tone.processing}`;
        if (textToSpeech.isSpeaking) return `${tone.base} ${tone.speaking}`;
        return `${tone.base} ${tone.ready}`;
    };

    if (showApiKeyInput) {
        return (
            <div className={`absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20 p-4 rounded-xl ar-floating-card transition-colors duration-300`}>
                <div className="text-center">
                    <h3 className="text-sm font-semibold mb-2">🧠 Setup AI Brain</h3>
                    <p className="text-xs mb-3 opacity-80">
                        Connect Lexi to DeepSeek AI for intelligent conversations (free tier available)
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Enter OpenRouter API key"
                            className={`px-3 py-2 rounded-lg text-sm border transition-colors duration-300 ${theme === 'dark'
                                ? 'bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-400'
                                : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
                                }`}
                        />
                        <button
                            onClick={handleApiKeySubmit}
                            disabled={!apiKey.trim()}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300 ${apiKey.trim()
                                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            Setup
                        </button>
                    </div>
                    <button
                        onClick={() => setShowApiKeyInput(false)}
                        className="text-xs text-blue-400 hover:text-blue-300 mt-2"
                    >
                        Skip (use basic responses)
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
            <div className={`ar-floating-card rounded-2xl px-5 py-4 w-[420px] max-w-[92vw]`}>
                {/* Layout: avatar | content | controls */}
                <div className="grid grid-cols-[auto,1fr,auto] items-center gap-5">
                    {/* Mic button */}
                    <button
                        aria-label={speechRecognition.isListening ? 'Stop listening' : 'Start listening'}
                        onClick={speechRecognition.toggleListening}
                        disabled={isProcessing || isThinking || pluginContext?.isProcessing || textToSpeech.isSpeaking}
                        className={`relative w-12 h-12 rounded-xl flex items-center justify-center glow-effect ${speechRecognition.isListening
                            ? 'bg-rose-500'
                            : (isThinking || pluginContext?.isProcessing)
                                ? 'bg-violet-500'
                                : 'bg-indigo-500'
                            } ${isProcessing || isThinking || pluginContext?.isProcessing || textToSpeech.isSpeaking ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105 transition-transform'}`}
                    >
                        {speechRecognition.isListening ? <MicOff className="w-5 h-5 text-white" /> : (isThinking || pluginContext?.isProcessing) ? <Brain className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
                        {speechRecognition.isListening && <div className="absolute inset-0 rounded-xl border-2 border-rose-300 animate-ping" />}
                        {(isThinking || pluginContext?.isProcessing) && <div className="absolute inset-0 rounded-xl border-2 border-violet-300 animate-pulse" />}
                    </button>

                    {/* Content */}
                    <div className="min-w-[12rem]">
                        <div className="flex items-center gap-3">
                            <span className={getStatusClass()}>{getStatusLabel()}</span>
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-violet-500/25 text-violet-200' : 'bg-violet-600/10 text-violet-700'}`}>
                                <Brain className="w-3 h-3" />
                                <span className="font-medium">{aiService.isReady() ? 'AI Brain' : 'Basic Mode'}</span>
                            </span>
                            {pluginContext && (
                                <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-green-500/25 text-green-200' : 'bg-green-600/10 text-green-700'}`}>
                                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                    <span className="font-medium">Plugins</span>
                                </span>
                            )}
                            {/* Model name removed per design */}
                        </div>
                        {/* Transcript preview removed per design */}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                        {textToSpeech.isSpeaking && (
                            <button
                                aria-label={textToSpeech.isPaused ? 'Resume' : 'Pause'}
                                onClick={textToSpeech.togglePause}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                            >
                                {textToSpeech.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                            </button>
                        )}
                        {textToSpeech.isSpeaking && (
                            <button
                                aria-label="Stop"
                                onClick={textToSpeech.stop}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                            >
                                <Square className="w-4 h-4" />
                            </button>
                        )}
                        {!textToSpeech.isSpeaking && (
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center opacity-70 border border-white/10 ${theme === 'dark' ? 'text-slate-200' : 'text-gray-700'}">
                                <Volume2 className="w-4 h-4" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer actions */}
                <div className="mt-3 flex items-center justify-between">
                    <div className={`text-xs ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'} opacity-80`}>
                        {speechRecognition.isSupported ? 'Click microphone to talk to Lexi' : 'Speech recognition not supported in this browser'}
                    </div>
                    {aiService.isReady() && (
                        <button onClick={() => setShowDebugPanel(!showDebugPanel)} className="text-xs text-blue-300 hover:text-blue-200 font-medium">
                            {showDebugPanel ? 'Hide' : 'Show'} Model Debug
                        </button>
                    )}
                </div>

                {/* Error */}
                {(speechRecognition.error || textToSpeech.error) && (
                    <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg backdrop-blur-sm">
                        <p className="text-xs text-red-400">{speechRecognition.error || textToSpeech.error}</p>
                        <button onClick={() => { speechRecognition.clearError(); textToSpeech.clearError(); }} className="text-xs text-red-300 hover:text-red-200 mt-1">Dismiss</button>
                    </div>
                )}
            </div>

            {/* Debug Panel */}
            {showDebugPanel && aiService.isReady() && (
                <div className={`absolute bottom-24 left-1/2 transform -translate-x-1/2 z-20 p-3 rounded-lg ar-floating-card transition-colors duration-300 max-w-md`}>
                    <div className="text-xs">
                        <div className="font-semibold mb-2">🧠 AI Model Debug</div>
                        {modelAttempts.length > 0 ? (
                            <div className="space-y-1">
                                {modelAttempts.map((attempt, index) => (
                                    <div key={index} className="opacity-80">
                                        {attempt}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="opacity-60">No attempts yet</div>
                        )}
                        <div className="mt-2 pt-2 border-t border-opacity-20">
                            <div className="opacity-60">
                                Last used: {lastModelUsed || 'None'}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
