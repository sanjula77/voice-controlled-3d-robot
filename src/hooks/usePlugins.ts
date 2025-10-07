import { useState, useCallback } from 'react';
import { lexiBrain, BrainResponse } from '../core/brain';
import { PluginResult } from '../core/brain';

export const usePlugins = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentResult, setCurrentResult] = useState<PluginResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processUserInput = useCallback(async (userInput: string): Promise<BrainResponse> => {
    setIsProcessing(true);
    setError(null);
    setCurrentResult(null);

    try {
      const response = await lexiBrain.processUserInput(userInput);
      
      if (response.result.success) {
        setCurrentResult(response.result);
      } else {
        setError(response.result.summary);
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      return {
        pluginUsed: null,
        result: {
          success: false,
          type: 'general',
          summary: errorMessage,
        },
        shouldSpeak: true,
        shouldShowCard: false,
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setCurrentResult(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isProcessing,
    currentResult,
    error,
    processUserInput,
    clearResult,
    clearError,
  };
};
