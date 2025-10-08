import React, { useState, useEffect } from 'react';
import { usePluginContextSafe } from '../../contexts/PluginContext';
import { useConversation } from '../../contexts/ConversationContext';

// Fallback motion components if framer-motion fails to load
const MotionDiv = ({ children, className, variants, initial, animate, whileHover, whileTap, ...props }: any) => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    return (
        <div
            className={`${className} transition-all duration-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            {...props}
        >
            {children}
        </div>
    );
};

interface HolographicOverlayProps {
    isMobile: boolean;
}

export const HolographicOverlay: React.FC<HolographicOverlayProps> = ({ isMobile }) => {
    const [isVisible, setIsVisible] = useState(false);
    const pluginContext = usePluginContextSafe();
    const { addMessage } = useConversation();

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const cards = [
        {
            id: 'search',
            title: "Search Web",
            description: "Find information across the internet",
            icon: "🔍",
            color: "from-cyan-400 to-cyan-600",
            glowColor: "shadow-cyan-500/50",
            action: () => {
                addMessage("Search for something on the web");
            }
        },
        {
            id: 'weather',
            title: "Weather",
            description: "Get current weather conditions",
            icon: "🌦️",
            color: "from-cyan-400 to-cyan-600",
            glowColor: "shadow-cyan-500/50",
            action: () => {
                addMessage("What's the weather like?");
            }
        },
        {
            id: 'news',
            title: "News",
            description: "Latest news and updates",
            icon: "📰",
            color: "from-violet-400 to-violet-600",
            glowColor: "shadow-violet-500/50",
            action: () => {
                addMessage("Show me the latest news");
            }
        },
        {
            id: 'youtube',
            title: "YouTube",
            description: "Search and watch videos",
            icon: "📺",
            color: "from-violet-400 to-violet-600",
            glowColor: "shadow-violet-500/50",
            action: () => {
                addMessage("Search for videos on YouTube");
            }
        },
        {
            id: 'lexi',
            title: "Ask Lexi",
            description: "Chat with your AI companion",
            icon: "🧠",
            color: "from-cyan-400 to-cyan-600",
            glowColor: "shadow-cyan-500/50",
            action: () => {
                addMessage("Hello Lexi, how can you help me today?");
            }
        }
    ];

    // Initialize visibility with delay
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 200);
        return () => clearTimeout(timer);
    }, []);

    if (isMobile) {
        return (
            <div className="fixed inset-0 z-20 pointer-events-none">
                <div className={`flex flex-col items-center justify-center h-full gap-6 p-8 transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                    {cards.map((card, index) => (
                        <MotionDiv
                            key={card.id}
                            className="pointer-events-auto hover:scale-105 active:scale-95"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div
                                className={`
                  relative w-80 h-24 rounded-2xl p-4 cursor-pointer
                  bg-gradient-to-r ${card.color}
                  ${card.glowColor} shadow-2xl
                  backdrop-blur-xl border border-white/20
                  hover:shadow-3xl transition-all duration-300
                `}
                                onClick={card.action}
                            >
                                <div className="flex items-center gap-4 h-full">
                                    <div className="text-3xl">{card.icon}</div>
                                    <div className="flex-1">
                                        <h3 className="text-white font-bold text-lg">{card.title}</h3>
                                        <p className="text-white/80 text-sm">{card.description}</p>
                                    </div>
                                </div>

                                {/* Glow effect */}
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                            </div>
                        </MotionDiv>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-20 pointer-events-none">
            <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <div className="grid grid-cols-3 gap-8 w-96">
                    {cards.map((card, index) => (
                        <MotionDiv
                            key={card.id}
                            className="pointer-events-auto hover:scale-110 hover:rotate-y-5 active:scale-95"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div
                                className={`
                  relative w-32 h-32 rounded-2xl p-4 cursor-pointer
                  bg-gradient-to-br ${card.color}
                  ${card.glowColor} shadow-2xl
                  backdrop-blur-xl border border-white/20
                  hover:shadow-3xl transition-all duration-300
                  flex flex-col items-center justify-center
                `}
                                onClick={card.action}
                            >
                                <div className="text-4xl mb-2">{card.icon}</div>
                                <h3 className="text-white font-bold text-sm text-center">{card.title}</h3>

                                {/* Glow effect */}
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                            </div>
                        </MotionDiv>
                    ))}
                </div>
            </div>
        </div>
    );
};
