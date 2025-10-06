import { OrbitControls } from '@react-three/drei';
import { Robot } from './Robot';
import { GroundPlane } from './GroundPlane';
import { LightingRig } from './LightingRig';
import { PostProcessingEffects } from './PostProcessingEffects';
import { useConversation } from '../contexts/ConversationContext';
import { useVoiceState } from '../contexts/VoiceStateContext';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

interface SceneProps {
  isARMode?: boolean;
}

export function Scene({ isARMode = false }: SceneProps) {
  useConversation();
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

  // Access messages (reserved for future scene reactions)

  return (
    <>
      {/* Cinematic lighting */}
      <LightingRig />

      {/* Ground plane */}
      <GroundPlane />

      {/* Robot model with voice state - positioned based on mode */}
      <Robot
        isListening={voiceState.isListening}
        isSpeaking={voiceState.isSpeaking}
        isProcessing={voiceState.isProcessing || voiceState.isThinking}
        currentAudioLevel={voiceState.currentAudioLevel}
        isARMode={isARMode}
        emotion={voiceState.emotion}
      />

      {/* Post-processing (Bloom + DOF) - disabled in AR */}
      <PostProcessingEffects enabled={!isARMode} />

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
