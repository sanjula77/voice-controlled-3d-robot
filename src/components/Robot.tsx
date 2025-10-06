import { useGLTF } from '@react-three/drei';
import { useRef, Suspense, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, Color } from 'three';

interface RobotProps {
  isListening?: boolean;
  isSpeaking?: boolean;
  isProcessing?: boolean;
  currentAudioLevel?: number; // 0-1 for mouth sync
  isARMode?: boolean;
  emotion?: 'positive' | 'neutral' | 'concerned';
}

function RobotModel({ isListening, isSpeaking, isProcessing, currentAudioLevel = 0, isARMode = false, emotion = 'neutral' }: RobotProps) {
  const { scene } = useGLTF('/robot.glb');
  const groupRef = useRef<Group>(null);
  const mouthMorphRef = useRef<number>(0);
  const [animationState, setAnimationState] = useState<'idle' | 'listening' | 'speaking' | 'processing'>('idle');
  const emissiveColorRef = useRef<Color>(new Color('#ffffff'));
  const emissiveIntensityRef = useRef<number>(0.1);

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

  // Enhanced animations based on state with mouth sync and emotion-based emissive
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.getElapsedTime();

      // Smooth emotion-based emissive color transitions
      const emotionColors = {
        positive: '#00e5ff', // warm cyan
        neutral: '#ffffff',  // soft white
        concerned: '#ffb74d' // amber tone
      };
      const targetColor = new Color(emotionColors[emotion]);
      const targetIntensity = emotion === 'positive' ? 0.3 : emotion === 'concerned' ? 0.2 : 0.1;

      // Lerp emissive color and intensity
      emissiveColorRef.current.lerp(targetColor, 0.05);
      emissiveIntensityRef.current += (targetIntensity - emissiveIntensityRef.current) * 0.05;

      // Apply emissive to robot materials
      scene.traverse((child) => {
        if (child instanceof Mesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              if (mat.emissive) {
                mat.emissive.copy(emissiveColorRef.current);
                mat.emissiveIntensity = emissiveIntensityRef.current;
              }
            });
          } else if (child.material.emissive) {
            child.material.emissive.copy(emissiveColorRef.current);
            child.material.emissiveIntensity = emissiveIntensityRef.current;
          }
        }
      });

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

      // Determine robot position based on mode
      const robotX = isARMode ? -2 : 0; // Left side in AR mode, center in 3D mode

      switch (animationState) {
        case 'idle':
          // Simple breathing animation - up and down movement
          groupRef.current.position.x = robotX;
          groupRef.current.position.y = -1 + Math.sin(time * 0.8) * 0.03;
          groupRef.current.position.z = 0;
          groupRef.current.rotation.y = 0; // No rotation
          groupRef.current.scale.setScalar(1.5);
          break;

        case 'listening':
          // Breathing animation while listening
          groupRef.current.position.x = robotX;
          groupRef.current.position.y = -1 + Math.sin(time * 0.8) * 0.03;
          groupRef.current.position.z = 0;
          groupRef.current.rotation.y = 0; // No rotation
          groupRef.current.scale.setScalar(1.5);
          break;

        case 'speaking':
          // No breathing animation when speaking - only mouth moves
          groupRef.current.position.x = robotX;
          groupRef.current.position.y = -1; // Static position
          groupRef.current.position.z = 0;
          groupRef.current.rotation.y = 0; // No rotation
          groupRef.current.scale.setScalar(1.5); // Static scale
          break;

        case 'processing':
          // Breathing animation while processing
          groupRef.current.position.x = robotX;
          groupRef.current.position.y = -1 + Math.sin(time * 0.8) * 0.03;
          groupRef.current.position.z = 0;
          groupRef.current.rotation.y = 0; // No rotation
          groupRef.current.scale.setScalar(1.5);
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

      {/* State indicator spheres removed per design */}
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

export function Robot({ isListening, isSpeaking, isProcessing, currentAudioLevel, isARMode = false, emotion = 'neutral' }: RobotProps) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RobotModel
        isListening={isListening}
        isSpeaking={isSpeaking}
        isProcessing={isProcessing}
        currentAudioLevel={currentAudioLevel}
        isARMode={isARMode}
        emotion={emotion}
      />
    </Suspense>
  );
}

// Preload the model for better performance
useGLTF.preload('/robot.glb');
