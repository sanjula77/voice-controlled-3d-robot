import { useConversation } from '../contexts/ConversationContext';
import { useTheme } from '../contexts/ThemeContext';

export function ConversationLog() {
    const { messages, isVisible, toggleVisibility, clearMessages } = useConversation();
    const { theme } = useTheme();

    if (!isVisible) {
        return null;
    }

    return (
        <div className={`absolute top-20 right-4 z-20 w-80 max-h-96 overflow-hidden rounded-xl shadow-lg border transition-colors duration-300 ${theme === 'dark'
            ? 'bg-slate-800/90 border-slate-600/50'
            : 'bg-white/90 border-gray-200/50'
            }`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-3 border-b ${theme === 'dark' ? 'border-slate-600/30' : 'border-gray-200/30'
                }`}>
                <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-gray-800'
                    }`}>
                    💬 Conversation
                </h3>
                <div className="flex space-x-2">
                    <button
                        onClick={clearMessages}
                        className={`text-xs px-2 py-1 rounded transition-colors duration-200 ${theme === 'dark'
                            ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        Clear
                    </button>
                    <button
                        onClick={toggleVisibility}
                        className={`text-xs px-2 py-1 rounded transition-colors duration-200 ${theme === 'dark'
                            ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="max-h-80 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 ? (
                    <div className={`text-center py-8 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
                        }`}>
                        <div className="text-2xl mb-2">🤖</div>
                        <p className="text-sm">Start a conversation with Lexi!</p>
                        <p className="text-xs mt-1 opacity-60">Click the microphone to begin</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-xs px-3 py-2 rounded-lg text-sm ${message.isUser
                                    ? theme === 'dark'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-blue-500 text-white'
                                    : theme === 'dark'
                                        ? 'bg-slate-700 text-slate-200'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}
                            >
                                <div className="flex items-start space-x-2">
                                    <span className="text-xs">
                                        {message.isUser ? '👤' : '🤖'}
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-sm leading-relaxed">{message.text}</p>
                                        <p className={`text-xs mt-1 opacity-60 ${message.isUser ? 'text-blue-100' : 'text-slate-400'
                                            }`}>
                                            {message.timestamp.toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className={`p-2 border-t text-xs text-center ${theme === 'dark'
                ? 'border-slate-600/30 text-slate-400'
                : 'border-gray-200/30 text-gray-500'
                }`}>
                {messages.length > 0 && (
                    <p>
                        {messages.length} message{messages.length !== 1 ? 's' : ''} •
                        {messages.filter(m => m.isUser).length} from you •
                        {messages.filter(m => !m.isUser).length} from Lexi
                    </p>
                )}
            </div>
        </div>
    );
}
