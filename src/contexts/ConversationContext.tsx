import { createContext, useContext, useState, ReactNode } from 'react';
import { VoiceMessage } from '../services/speechService';

interface ConversationContextType {
    messages: VoiceMessage[];
    addMessage: (message: Omit<VoiceMessage, 'id' | 'timestamp'>) => void;
    clearMessages: () => void;
    isVisible: boolean;
    toggleVisibility: () => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export function ConversationProvider({ children }: { children: ReactNode }) {
    const [messages, setMessages] = useState<VoiceMessage[]>([]);
    const [isVisible, setIsVisible] = useState(false);

    const addMessage = (message: Omit<VoiceMessage, 'id' | 'timestamp'>) => {
        const newMessage: VoiceMessage = {
            ...message,
            id: Date.now().toString(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newMessage]);
    };

    const clearMessages = () => {
        setMessages([]);
    };

    const toggleVisibility = () => {
        setIsVisible(prev => !prev);
    };

    return (
        <ConversationContext.Provider value={{
            messages,
            addMessage,
            clearMessages,
            isVisible,
            toggleVisibility
        }}>
            {children}
        </ConversationContext.Provider>
    );
}

export function useConversation() {
    const context = useContext(ConversationContext);
    if (context === undefined) {
        throw new Error('useConversation must be used within a ConversationProvider');
    }
    return context;
}
