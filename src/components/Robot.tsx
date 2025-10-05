import { useGLTF } from '@react-three/drei';
import { useRef, Suspense, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh } from 'three';

interface RobotProps {
  isListening?: boolean;
  isSpeaking?: boolean;
  isProcessing?: boolean;
  currentAudioLevel?: number; // 0-1 for mouth sync
}

function RobotModel({ isListening, isSpeaking, isProcessing, currentAudioLevel = 0 }: RobotProps) {
  const { scene } = useGLTF('/robot.glb');
  const groupRef = useRef<Group>(null);
  const mouthMorphRef = useRef<number>(0);
  const [animationState, setAnimationState] = useState<'idle' | 'listening' | 'speaking' | 'processing'>('idle');

  // Setup mouth morph target
  useEffect(() => {
    if (scene) {
      console.log('=== ROBOT MODEL STRUCTURE ===');
      // Log the entire model structure first
      scene.traverse((child) => {
        console.log('Object:', child.name, 'Type:', child.type, 'Has morph targets:', !!(child instanceof Mesh && child.morphTargetDictionary));
      });

      console.log('=== SEARCHING FOR MOUTH MORPH TARGET ===');
      // Find the specific mouth mesh (only Mouth_Blue_Light_0)
      scene.traverse((child) => {
        if (child instanceof Mesh && child.name === 'Mouth_Blue_Light_0' && child.morphTargetDictionary) {
          // Look for the 'mouth' shape key (from your screenshot)
          const mouthMorphIndex = child.morphTargetDictionary['mouth'];

          if (mouthMorphIndex !== undefined) {
            console.log('✅ Found mouth morph target at index:', mouthMorphIndex, 'on mesh:', child.name);
            (child as any).mouthMorphIndex = mouthMorphIndex;
          } else {
            console.log('Available morph targets on', child.name, ':', Object.keys(child.morphTargetDictionary));
          }
        }
      });
    }
  }, [scene]);

  // Update animation state based on props
  useEffect(() => {
    if (isListening) {
      setAnimationState('listening');
    } else if (isSpeaking) {
      setAnimationState('speaking');
    } else if (isProcessing) {
      setAnimationState('processing');
    } else {
      setAnimationState('idle');
    }
  }, [isListening, isSpeaking, isProcessing]);

  // Enhanced animations based on state with mouth sync
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.getElapsedTime();

      // Handle mouth morph target animation (only on Mouth_Blue_Light_0 mesh)
      scene.traverse((child) => {
        if (child instanceof Mesh && child.name === 'Mouth_Blue_Light_0' && (child as any).mouthMorphIndex !== undefined) {
          const mouthMorphIndex = (child as any).mouthMorphIndex;

          if (isSpeaking && currentAudioLevel > 0) {
            // Use real audio level for mouth sync when speaking
            mouthMorphRef.current = currentAudioLevel;
          } else if (isSpeaking) {
            // Fallback: simulate mouth movement with sine wave
            mouthMorphRef.current = Math.abs(Math.sin(time * 8)) * 0.5 + 0.3;
          } else {
            // Close mouth when not speaking
            mouthMorphRef.current = Math.max(0, mouthMorphRef.current - 0.1);
          }

          // Apply morph target value (0 = closed, 1 = open)
          if (child.morphTargetInfluences) {
            child.morphTargetInfluences[mouthMorphIndex] = mouthMorphRef.current;
          }
        }
      });

      switch (animationState) {
        case 'idle':
          // Subtle breathing animation - no rotation
          groupRef.current.position.y = -1 + Math.sin(time * 0.5) * 0.02;
          groupRef.current.rotation.y = 0; // No rotation
          groupRef.current.scale.setScalar(1.5);
          break;

        case 'listening':
          // More active listening animation - no rotation
          groupRef.current.position.y = -1 + Math.sin(time * 2) * 0.05;
          groupRef.current.rotation.y = 0; // No rotation
          groupRef.current.scale.setScalar(1.5 + Math.sin(time * 3) * 0.05);
          break;

        case 'speaking':
          // No body animation when speaking - only mouth moves
          groupRef.current.position.y = -1; // Static position
          groupRef.current.rotation.y = 0; // No rotation
          groupRef.current.scale.setScalar(1.5); // Static scale
          break;

        case 'processing':
          // Thinking/processing animation - no rotation
          groupRef.current.position.y = -1 + Math.sin(time * 1.2) * 0.04;
          groupRef.current.rotation.y = 0; // No rotation
          groupRef.current.scale.setScalar(1.5 + Math.sin(time * 2) * 0.03);
          break;
      }
    }
  });

  return (
    <group ref={groupRef} castShadow>
      <primitive
        object={scene}
        scale={[1.5, 1.5, 1.5]}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
      />

      {/* Visual indicators for different states */}
      {animationState === 'listening' && (
        <mesh position={[0, 2, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="#ff4444" transparent opacity={0.8} />
        </mesh>
      )}

      {animationState === 'speaking' && (
        <mesh position={[0, 2, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="#44ff44" transparent opacity={0.8} />
        </mesh>
      )}

      {animationState === 'processing' && (
        <mesh position={[0, 2, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="#ffaa44" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}

function LoadingFallback() {
  const meshRef = useRef<any>();

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      meshRef.current.rotation.y = time * 0.5;
      meshRef.current.position.y = Math.sin(time * 2) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#666666"
        metalness={0.3}
        roughness={0.7}
      />
    </mesh>
  );
}

export function Robot({ isListening, isSpeaking, isProcessing, currentAudioLevel }: RobotProps) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RobotModel
        isListening={isListening}
        isSpeaking={isSpeaking}
        isProcessing={isProcessing}
        currentAudioLevel={currentAudioLevel}
      />
    </Suspense>
  );
}

// Preload the model for better performance
useGLTF.preload('/robot.glb');
