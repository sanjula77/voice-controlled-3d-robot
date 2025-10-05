import { useState, useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { speechService } from '../services/speechService';
import { aiService, AIResponse } from '../services/aiService';
import { useTheme } from '../contexts/ThemeContext';
import { useVoiceState } from '../contexts/VoiceStateContext';

interface VoiceControlsProps {
    onMessage?: (message: { text: string; isUser: boolean; timestamp: Date }) => void;
}

export function VoiceControls({ onMessage }: VoiceControlsProps) {
    const { theme } = useTheme();
    const { setVoiceState, updateAudioLevel } = useVoiceState();
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

        try {
            // Show thinking indicator
            setIsThinking(true);
            setVoiceState({ isThinking: true });

            // Get AI response with multi-model fallback
            const aiResponse: AIResponse = await aiService.getAIResponse(userText);
            console.log('AI response:', aiResponse);

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
            const response = aiResponse.success
                ? aiResponse.content
                : aiService.generateFallbackResponse(userText);

            // Add AI response to conversation
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

    const getStatusColor = () => {
        if (speechRecognition.isListening) return 'text-red-500';
        if (isThinking) return 'text-purple-500';
        if (isProcessing) return 'text-yellow-500';
        if (textToSpeech.isSpeaking) return 'text-green-500';
        return 'text-gray-500';
    };

    const getStatusText = () => {
        if (speechRecognition.isListening) return 'Listening...';
        if (isThinking) return 'Lexi is thinking...';
        if (isProcessing) return 'Processing...';
        if (textToSpeech.isSpeaking) return 'Speaking...';
        return 'Ready';
    };

    const getStatusIcon = () => {
        if (speechRecognition.isListening) return '🎤';
        if (isThinking) return '🧠';
        if (isProcessing) return '⚡';
        if (textToSpeech.isSpeaking) return '🔊';
        return '💬';
    };

    if (showApiKeyInput) {
        return (
            <div className={`absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20 p-4 rounded-xl shadow-lg border transition-colors duration-300 ${theme === 'dark'
                ? 'bg-slate-800/90 text-slate-200 border-slate-600/50'
                : 'bg-white/90 text-gray-800 border-gray-200/50'
                }`}>
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
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20">
            <div className={`backdrop-blur-sm px-6 py-4 rounded-xl shadow-lg border transition-colors duration-300 ${theme === 'dark'
                ? 'bg-slate-800/80 text-slate-200 border-slate-600/30'
                : 'bg-white/80 text-gray-800 border-gray-200/50'
                }`}>
                <div className="flex items-center space-x-4">
                    {/* Microphone Button */}
                    <button
                        onClick={speechRecognition.toggleListening}
                        disabled={isProcessing || isThinking || textToSpeech.isSpeaking}
                        className={`relative w-12 h-12 rounded-full transition-all duration-200 ${speechRecognition.isListening
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                            : isThinking
                                ? 'bg-purple-500 hover:bg-purple-600'
                                : 'bg-blue-500 hover:bg-blue-600'
                            } ${isProcessing || isThinking || textToSpeech.isSpeaking
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:scale-105'
                            }`}
                    >
                        <span className="text-white text-xl">
                            {speechRecognition.isListening ? '🎤' : isThinking ? '🧠' : '🎙️'}
                        </span>

                        {/* Listening animation */}
                        {speechRecognition.isListening && (
                            <div className="absolute inset-0 rounded-full border-2 border-red-300 animate-ping"></div>
                        )}

                        {/* Thinking animation */}
                        {isThinking && (
                            <div className="absolute inset-0 rounded-full border-2 border-purple-300 animate-pulse"></div>
                        )}
                    </button>

                    {/* Status Display */}
                    <div className="flex flex-col">
                        <div className={`flex items-center space-x-2 text-sm font-medium ${getStatusColor()}`}>
                            <span>{getStatusIcon()}</span>
                            <span>{getStatusText()}</span>
                        </div>

                        {/* Transcript Display */}
                        {speechRecognition.transcript && (
                            <div className="text-xs opacity-80 mt-1 max-w-xs truncate">
                                "{speechRecognition.transcript}"
                            </div>
                        )}

                        {/* AI Brain Indicator */}
                        <div className="flex items-center space-x-1 mt-1">
                            <span className="text-xs opacity-60">
                                {aiService.isReady() ? '🧠 AI Brain' : '🤖 Basic Mode'}
                            </span>
                            {lastModelUsed && (
                                <span className="text-xs opacity-40 ml-1">
                                    ({lastModelUsed})
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex space-x-2">
                        {textToSpeech.isSpeaking && (
                            <button
                                onClick={textToSpeech.togglePause}
                                className={`w-8 h-8 rounded-full transition-colors duration-200 ${theme === 'dark'
                                    ? 'bg-slate-600 hover:bg-slate-500 text-slate-200'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                    }`}
                            >
                                {textToSpeech.isPaused ? '▶️' : '⏸️'}
                            </button>
                        )}

                        {textToSpeech.isSpeaking && (
                            <button
                                onClick={textToSpeech.stop}
                                className={`w-8 h-8 rounded-full transition-colors duration-200 ${theme === 'dark'
                                    ? 'bg-slate-600 hover:bg-slate-500 text-slate-200'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                    }`}
                            >
                                ⏹️
                            </button>
                        )}
                    </div>
                </div>

                {/* Error Display */}
                {(speechRecognition.error || textToSpeech.error) && (
                    <div className="mt-3 p-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                        <p className="text-xs text-red-400">
                            {speechRecognition.error || textToSpeech.error}
                        </p>
                        <button
                            onClick={() => {
                                speechRecognition.clearError();
                                textToSpeech.clearError();
                            }}
                            className="text-xs text-red-300 hover:text-red-200 mt-1"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Instructions */}
                <div className="mt-3 text-xs opacity-60 text-center">
                    {speechRecognition.isSupported
                        ? 'Click microphone to talk to Lexi'
                        : 'Speech recognition not supported in this browser'
                    }
                </div>

                {/* Debug Panel Toggle */}
                {aiService.isReady() && (
                    <div className="mt-2 text-center">
                        <button
                            onClick={() => setShowDebugPanel(!showDebugPanel)}
                            className="text-xs text-blue-400 hover:text-blue-300"
                        >
                            {showDebugPanel ? 'Hide' : 'Show'} Model Debug
                        </button>
                    </div>
                )}

            </div>

            {/* Debug Panel */}
            {showDebugPanel && aiService.isReady() && (
                <div className={`absolute bottom-32 left-1/2 transform -translate-x-1/2 z-20 p-3 rounded-lg shadow-lg border transition-colors duration-300 max-w-md ${theme === 'dark'
                    ? 'bg-slate-800/90 text-slate-200 border-slate-600/50'
                    : 'bg-white/90 text-gray-800 border-gray-200/50'
                    }`}>
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
