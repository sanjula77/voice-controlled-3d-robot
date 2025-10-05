import { useState, useRef, useCallback, useEffect } from 'react';

export interface SpeechRecognitionState {
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
  error: string | null;
}

export interface SpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export function useSpeechRecognition(options: SpeechRecognitionOptions = {}) {
  const [state, setState] = useState<SpeechRecognitionState>({
    isListening: false,
    transcript: '',
    isSupported: false,
    error: null
  });

  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<number | null>(null);

  // Check if speech recognition is supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setState(prev => ({ ...prev, isSupported: !!SpeechRecognition }));
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      setupRecognition();
    }
  }, []);

  const setupRecognition = useCallback(() => {
    if (!recognitionRef.current) return;

    const recognition = recognitionRef.current;
    
    // Configure recognition settings
    recognition.continuous = options.continuous ?? false;
    recognition.interimResults = options.interimResults ?? true;
    recognition.lang = options.language ?? 'en-US';
    recognition.maxAlternatives = 1;

    // Handle recognition results
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      
      setState(prev => ({
        ...prev,
        transcript: currentTranscript,
        error: null
      }));

      // Call the onResult callback
      if (options.onResult) {
        options.onResult(currentTranscript, !!finalTranscript);
      }
    };

    // Handle recognition start
    recognition.onstart = () => {
      setState(prev => ({
        ...prev,
        isListening: true,
        error: null
      }));
      
      if (options.onStart) {
        options.onStart();
      }
    };

    // Handle recognition end
    recognition.onend = () => {
      setState(prev => ({
        ...prev,
        isListening: false
      }));
      
      if (options.onEnd) {
        options.onEnd();
      }
    };

    // Handle recognition errors
    recognition.onerror = (event: any) => {
      let errorMessage = 'Speech recognition error';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not found or not accessible.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error occurred during speech recognition.';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition was aborted.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }

      setState(prev => ({
        ...prev,
        isListening: false,
        error: errorMessage
      }));

      if (options.onError) {
        options.onError(errorMessage);
      }
    };

    // Handle no match
    recognition.onnomatch = () => {
      setState(prev => ({
        ...prev,
        isListening: false,
        error: 'No speech was recognized. Please try again.'
      }));
    };
  }, [options]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || state.isListening) return;

    try {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set a timeout to stop listening after 10 seconds of inactivity
      timeoutRef.current = setTimeout(() => {
        stopListening();
      }, 10000);

      recognitionRef.current.start();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to start speech recognition'
      }));
    }
  }, [state.isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !state.isListening) return;

    try {
      recognitionRef.current.stop();
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to stop speech recognition'
      }));
    }
  }, [state.isListening]);

  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  const clearTranscript = useCallback(() => {
    setState(prev => ({
      ...prev,
      transcript: '',
      error: null
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (recognitionRef.current && state.isListening) {
        recognitionRef.current.stop();
      }
    };
  }, [state.isListening]);

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
    clearTranscript,
    clearError
  };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
