import { useState, useRef, useCallback, useEffect } from 'react';
import { speechService, SpeechConfig } from '../services/speechService';
import { useAudioAnalysis } from './useAudioAnalysis';

export interface TextToSpeechState {
  isSpeaking: boolean;
  isPaused: boolean;
  currentText: string;
  error: string | null;
  useDeepgram: boolean;
}

export interface TextToSpeechOptions {
  useDeepgram?: boolean;
  config?: SpeechConfig;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  onAudioLevelChange?: (level: number) => void;
}

export function useTextToSpeech(options: TextToSpeechOptions = {}) {
  const [state, setState] = useState<TextToSpeechState>({
    isSpeaking: false,
    isPaused: false,
    currentText: '',
    error: null,
    useDeepgram: options.useDeepgram ?? true
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Audio analysis for mouth sync
  const audioAnalysis = useAudioAnalysis({
    onAudioLevelChange: options.onAudioLevelChange
  });

  const speak = useCallback(async (text: string, customOptions?: TextToSpeechOptions) => {
    const finalOptions = { ...options, ...customOptions };
    const useDeepgram = finalOptions.useDeepgram ?? state.useDeepgram;

    // Clear any previous error
    setState(prev => ({ ...prev, error: null }));

    try {
      setState(prev => ({
        ...prev,
        isSpeaking: true,
        isPaused: false,
        currentText: text,
        useDeepgram
      }));

      if (finalOptions.onStart) {
        finalOptions.onStart();
      }

      if (useDeepgram && speechService.isReady()) {
        // Use Deepgram TTS
        const audio = await speechService.speakWithDeepgram(text, finalOptions.config);
        audioRef.current = audio;

        audio.onended = () => {
          setState(prev => ({
            ...prev,
            isSpeaking: false,
            isPaused: false,
            currentText: ''
          }));

          // Stop audio analysis
          audioAnalysis.stopAnalysis();

          if (finalOptions.onEnd) {
            finalOptions.onEnd();
          }
        };

        audio.onerror = (error) => {
          const errorMessage = `Audio playback error: ${error}`;
          setState(prev => ({
            ...prev,
            isSpeaking: false,
            isPaused: false,
            error: errorMessage
          }));

          if (finalOptions.onError) {
            finalOptions.onError(errorMessage);
          }
        };

        await audio.play();
        
        // Start audio analysis for mouth sync
        audioAnalysis.startAnalysis(audio);
      } else {
        // Use Web Speech API
        await speechService.speakWithWebAPI(text);
        
        setState(prev => ({
          ...prev,
          isSpeaking: false,
          isPaused: false,
          currentText: ''
        }));

        if (finalOptions.onEnd) {
          finalOptions.onEnd();
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Text-to-speech error';
      
      // Handle interruption gracefully
      if (errorMessage.includes('interrupted')) {
        console.log('Speech was interrupted, treating as success');
        setState(prev => ({
          ...prev,
          isSpeaking: false,
          isPaused: false,
          currentText: '',
          error: null
        }));

        if (finalOptions.onEnd) {
          finalOptions.onEnd();
        }
        return;
      }
      
      setState(prev => ({
        ...prev,
        isSpeaking: false,
        isPaused: false,
        error: errorMessage
      }));

      if (finalOptions.onError) {
        finalOptions.onError(errorMessage);
      }

      // If Deepgram fails, try Web Speech API as fallback
      if (useDeepgram) {
        console.warn('Deepgram TTS failed, falling back to Web Speech API');
        try {
          await speechService.speakWithWebAPI(text);
          setState(prev => ({
            ...prev,
            isSpeaking: false,
            isPaused: false,
            currentText: '',
            error: null
          }));

          if (finalOptions.onEnd) {
            finalOptions.onEnd();
          }
        } catch (fallbackError) {
          const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : 'Fallback TTS error';
          
          // Handle fallback interruption gracefully too
          if (fallbackErrorMessage.includes('interrupted')) {
            console.log('Fallback speech was interrupted, treating as success');
            setState(prev => ({
              ...prev,
              isSpeaking: false,
              isPaused: false,
              currentText: '',
              error: null
            }));

            if (finalOptions.onEnd) {
              finalOptions.onEnd();
            }
            return;
          }
          
          setState(prev => ({
            ...prev,
            error: fallbackErrorMessage
          }));

          if (finalOptions.onError) {
            finalOptions.onError(fallbackErrorMessage);
          }
        }
      }
    }
  }, [options, state.useDeepgram]);

  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setState(prev => ({ ...prev, isPaused: true }));
    } else if (speechSynthesisRef.current && speechSynthesis.speaking) {
      speechSynthesis.pause();
      setState(prev => ({ ...prev, isPaused: true }));
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play();
      setState(prev => ({ ...prev, isPaused: false }));
    } else if (speechSynthesis.paused) {
      speechSynthesis.resume();
      setState(prev => ({ ...prev, isPaused: false }));
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    if (speechSynthesis.speaking || speechSynthesis.paused) {
      speechSynthesis.cancel();
    }

    // Stop audio analysis
    audioAnalysis.stopAnalysis();

    setState(prev => ({
      ...prev,
      isSpeaking: false,
      isPaused: false,
      currentText: ''
    }));
  }, [audioAnalysis]);

  const togglePause = useCallback(() => {
    if (state.isPaused) {
      resume();
    } else {
      pause();
    }
  }, [state.isPaused, pause, resume]);

  const setUseDeepgram = useCallback((useDeepgram: boolean) => {
    setState(prev => ({ ...prev, useDeepgram }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const isDeepgramReady = speechService.isReady();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioAnalysis.cleanup();
    };
  }, [audioAnalysis]);

  return {
    ...state,
    speak,
    pause,
    resume,
    stop,
    togglePause,
    setUseDeepgram,
    clearError,
    isDeepgramReady
  };
}
