import React, { useState } from 'react';
import { usePluginContextSafe } from '../contexts/PluginContext';

export const PluginTest: React.FC = () => {
    const [input, setInput] = useState('');
    const [result, setResult] = useState<any>(null);
    const pluginContext = usePluginContextSafe();

    const testPlugin = async () => {
        if (!input.trim() || !pluginContext) return;

        try {
            const response = await pluginContext.processUserInput(input);
            setResult(response);
            console.log('Plugin test result:', response);
        } catch (error) {
            console.error('Plugin test error:', error);
            setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    };

    return (
        <div className="fixed top-4 left-4 z-50 bg-black/80 text-white p-4 rounded-lg max-w-md">
            <h3 className="text-lg font-bold mb-3">Plugin System Test</h3>

            <div className="space-y-3">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Try: 'weather in Tokyo' or 'latest news'"
                    className="w-full p-2 bg-white/10 rounded border border-white/20 text-white placeholder-gray-300"
                />

                <button
                    onClick={testPlugin}
                    disabled={pluginContext?.isProcessing}
                    className="w-full p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 rounded text-white"
                >
                    {pluginContext?.isProcessing ? 'Testing...' : 'Test Plugin'}
                </button>

                {result && (
                    <div className="mt-3 p-3 bg-white/10 rounded border border-white/20">
                        <h4 className="font-semibold mb-2">Result:</h4>
                        <pre className="text-xs overflow-auto max-h-40">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};
