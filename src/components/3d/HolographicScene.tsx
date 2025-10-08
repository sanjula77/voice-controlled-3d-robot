import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { HolographicCard } from './HolographicCard';
import { ParticleField } from './ParticleField';
import { usePluginContextSafe } from '../../contexts/PluginContext';
import { useConversation } from '../../contexts/ConversationContext';

const HolographicCards: React.FC = () => {
    const pluginContext = usePluginContextSafe();
    const { addMessage } = useConversation();
    const groupRef = useRef<THREE.Group>(null);
    const { viewport } = useThree();

    const cards = [
        {
            position: [-2, 1, 0] as [number, number, number],
            title: "Search Web",
            description: "Find information across the internet",
            icon: "🔍",
            color: "#00fff2",
            action: () => {
                addMessage("Search for something on the web");
                // Trigger search plugin
            }
        },
        {
            position: [0, 1, 0] as [number, number, number],
            title: "Weather",
            description: "Get current weather conditions",
            icon: "🌦️",
            color: "#00fff2",
            action: () => {
                addMessage("What's the weather like?");
                // Trigger weather plugin
            }
        },
        {
            position: [2, 1, 0] as [number, number, number],
            title: "News",
            description: "Latest news and updates",
            icon: "📰",
            color: "#b794f6",
            action: () => {
                addMessage("Show me the latest news");
                // Trigger news plugin
            }
        },
        {
            position: [-1, -1, 0] as [number, number, number],
            title: "YouTube",
            description: "Search and watch videos",
            icon: "📺",
            color: "#b794f6",
            action: () => {
                addMessage("Search for videos on YouTube");
                // Trigger YouTube plugin
            }
        },
        {
            position: [1, -1, 0] as [number, number, number],
            title: "Ask Lexi",
            description: "Chat with your AI companion",
            icon: "🧠",
            color: "#00fff2",
            action: () => {
                addMessage("Hello Lexi, how can you help me today?");
                // Trigger brain API
            }
        }
    ];

    useFrame((state) => {
        if (groupRef.current) {
            const time = state.clock.getElapsedTime();
            groupRef.current.rotation.y = Math.sin(time * 0.1) * 0.1;
        }
    });

    return (
        <group ref={groupRef}>
            {cards.map((card, index) => (
                <HolographicCard
                    key={index}
                    position={card.position}
                    title={card.title}
                    description={card.description}
                    icon={card.icon}
                    color={card.color}
                    onClick={card.action}
                    isActive={false}
                />
            ))}
        </group>
    );
};

const SceneContent: React.FC = () => {
    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.2} />
            <directionalLight
                position={[10, 10, 5]}
                intensity={0.5}
                color="#00fff2"
            />
            <pointLight
                position={[-10, -10, -5]}
                intensity={0.3}
                color="#b794f6"
            />

            {/* Environment */}
            <Environment preset="night" />

            {/* Particle field */}
            <ParticleField />

            {/* Holographic cards */}
            <HolographicCards />

            {/* Post-processing effects */}
            <EffectComposer>
                <Bloom
                    intensity={0.5}
                    luminanceThreshold={0.1}
                    luminanceSmoothing={0.9}
                />
                <ChromaticAberration
                    offset={[0.001, 0.001]}
                />
            </EffectComposer>
        </>
    );
};

export const HolographicScene: React.FC = () => {
    return (
        <div className="w-full h-full">
            <Canvas
                camera={{
                    position: [0, 0, 8],
                    fov: 50,
                }}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: "high-performance",
                }}
                dpr={[1, 2]}
            >
                <Suspense fallback={null}>
                    <PerspectiveCamera makeDefault position={[0, 0, 8]} />
                    <OrbitControls
                        enablePan={false}
                        enableZoom={false}
                        enableRotate={true}
                        autoRotate={true}
                        autoRotateSpeed={0.5}
                        maxPolarAngle={Math.PI / 2}
                        minPolarAngle={Math.PI / 2}
                    />
                    <SceneContent />
                </Suspense>
            </Canvas>
        </div>
    );
};
