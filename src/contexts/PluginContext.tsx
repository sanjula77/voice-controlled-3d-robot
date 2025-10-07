import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { lexiBrain, BrainResponse } from '../core/brain';
import { PluginResult } from '../core/brain';

interface PluginContextType {
    isProcessing: boolean;
    currentResult: PluginResult | null;
    error: string | null;
    processUserInput: (userInput: string) => Promise<BrainResponse>;
    clearResult: () => void;
    clearError: () => void;
}

const PluginContext = createContext<PluginContextType | undefined>(undefined);

export const usePluginContext = () => {
    const context = useContext(PluginContext);
    if (!context) {
        throw new Error('usePluginContext must be used within a PluginProvider');
    }
    return context;
};

// Safe hook that returns null if context is not available
export const usePluginContextSafe = () => {
    const context = useContext(PluginContext);
    return context || null;
};

interface PluginProviderProps {
    children: ReactNode;
}

export const PluginProvider: React.FC<PluginProviderProps> = ({ children }) => {
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

    const value: PluginContextType = {
        isProcessing,
        currentResult,
        error,
        processUserInput,
        clearResult,
        clearError,
    };

    return (
        <PluginContext.Provider value={value}>
            {children}
        </PluginContext.Provider>
    );
};