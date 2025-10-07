import { createContext, useContext, useState, ReactNode } from 'react';
import { analyzeSentimentAPI, type EmotionLabel } from '../services/apiSentiment';

interface VoiceState {
    isListening: boolean;
    isSpeaking: boolean;
    isProcessing: boolean;
    isThinking: boolean;
    currentAudioLevel: number; // 0-1 for mouth sync
    emotion?: 'positive' | 'neutral' | 'concerned';
}

interface VoiceStateContextType {
    voiceState: VoiceState;
    setVoiceState: (state: Partial<VoiceState>) => void;
    updateAudioLevel: (level: number) => void;
    analyzeSentiment: (text: string) => Promise<EmotionLabel>;
}

const VoiceStateContext = createContext<VoiceStateContextType | undefined>(undefined);

interface VoiceStateProviderProps {
    children: ReactNode;
}

export function VoiceStateProvider({ children }: VoiceStateProviderProps) {
    const [voiceState, setVoiceStateInternal] = useState<VoiceState>({
        isListening: false,
        isSpeaking: false,
        isProcessing: false,
        isThinking: false,
        currentAudioLevel: 0,
        emotion: 'neutral',
    });

    async function analyzeSentiment(text: string): Promise<EmotionLabel> {
        try {
            const emotion = await analyzeSentimentAPI(text);
            setVoiceStateInternal(prev => ({ ...prev, emotion }));
            return emotion;
        } catch {
            setVoiceStateInternal(prev => ({ ...prev, emotion: 'neutral' }));
            return 'neutral';
        }
    }

    const setVoiceState = (newState: Partial<VoiceState>) => {
        setVoiceStateInternal(prev => ({ ...prev, ...newState }));
    };

    const updateAudioLevel = (level: number) => {
        setVoiceStateInternal(prev => ({
            ...prev,
            currentAudioLevel: Math.max(0, Math.min(1, level))
        }));
    };

    return (
        <VoiceStateContext.Provider value={{ voiceState, setVoiceState, updateAudioLevel, analyzeSentiment }}>
            {children}
        </VoiceStateContext.Provider>
    );
}

export function useVoiceState() {
    const context = useContext(VoiceStateContext);
    if (context === undefined) {
        throw new Error('useVoiceState must be used within a VoiceStateProvider');
    }
    return context;
}
