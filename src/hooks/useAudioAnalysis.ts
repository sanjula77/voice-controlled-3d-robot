import { useRef, useCallback } from 'react';

interface AudioAnalysisOptions {
  onAudioLevelChange?: (level: number) => void;
  smoothingFactor?: number;
}

export function useAudioAnalysis(options: AudioAnalysisOptions = {}) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastLevelRef = useRef<number>(0);
  const smoothingFactor = options.smoothingFactor || 0.8;

  const startAnalysis = useCallback(async (audioElement: HTMLAudioElement) => {
    try {
      // Create audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Resume context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Create analyser node
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Create data array
      const bufferLength = analyser.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      // Connect audio element to analyser
      const source = audioContextRef.current.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(audioContextRef.current.destination);

      // Start analysis loop
      const analyze = () => {
        if (analyserRef.current && dataArrayRef.current) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);
          
          // Calculate average volume
          let sum = 0;
          for (let i = 0; i < dataArrayRef.current.length; i++) {
            sum += dataArrayRef.current[i];
          }
          const average = sum / dataArrayRef.current.length;
          const normalizedLevel = average / 255; // Normalize to 0-1

          // Apply smoothing
          const smoothedLevel = lastLevelRef.current * smoothingFactor + normalizedLevel * (1 - smoothingFactor);
          lastLevelRef.current = smoothedLevel;

          // Call callback
          if (options.onAudioLevelChange) {
            options.onAudioLevelChange(smoothedLevel);
          }

          animationFrameRef.current = requestAnimationFrame(analyze);
        }
      };

      analyze();
    } catch (error) {
      console.error('Error starting audio analysis:', error);
    }
  }, [options.onAudioLevelChange, smoothingFactor]);

  const stopAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    lastLevelRef.current = 0;
  }, []);

  const cleanup = useCallback(() => {
    stopAnalysis();
  }, [stopAnalysis]);

  return {
    startAnalysis,
    stopAnalysis,
    cleanup
  };
}
