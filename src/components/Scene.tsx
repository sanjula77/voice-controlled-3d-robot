import { OrbitControls } from '@react-three/drei';
import { Robot } from './Robot';
import { GroundPlane } from './GroundPlane';
import { useConversation } from '../contexts/ConversationContext';
import { useVoiceState } from '../contexts/VoiceStateContext';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

export function Scene() {
  const { messages } = useConversation();
  const { voiceState } = useVoiceState();
  const { gl } = useThree();

  // EXACT FIX: Handle WebGL context lost
  useEffect(() => {
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn("WebGL context lost. Attempting to restore...");
    };

    const handleContextRestored = () => {
      console.log("WebGL context restored.");
    };

    gl.domElement.addEventListener("webglcontextlost", handleContextLost);
    gl.domElement.addEventListener("webglcontextrestored", handleContextRestored);

    return () => {
      gl.domElement.removeEventListener("webglcontextlost", handleContextLost);
      gl.domElement.removeEventListener("webglcontextrestored", handleContextRestored);
    };
  }, [gl]);

  // Get the latest message to determine robot state
  const latestMessage = messages[messages.length - 1];
  const isProcessing = messages.length > 0 && !latestMessage?.isUser;

  return (
    <>
      {/* Enhanced lighting setup */}
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-3, 2, -3]} intensity={0.4} />

      {/* Ground plane */}
      <GroundPlane />

      {/* Robot model with voice state */}
      <Robot
        isListening={voiceState.isListening}
        isSpeaking={voiceState.isSpeaking}
        isProcessing={voiceState.isProcessing || voiceState.isThinking}
        currentAudioLevel={voiceState.currentAudioLevel}
      />

      {/* Enhanced camera controls */}
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        enableRotate={true}
        minDistance={2}
        maxDistance={8}
        maxPolarAngle={Math.PI / 1.8}
        minPolarAngle={Math.PI / 6}
        enableDamping={true}
        dampingFactor={0.05}
      />
    </>
  );
}
