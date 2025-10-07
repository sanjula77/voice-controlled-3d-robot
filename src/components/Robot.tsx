import { useGLTF } from '@react-three/drei';
import { useRef, Suspense, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, Color } from 'three';

interface RobotProps {
  isListening?: boolean;
  isSpeaking?: boolean;
  isProcessing?: boolean;
  currentAudioLevel?: number; // 0-1 for mouth sync
  isARMode?: boolean;
  emotion?: 'positive' | 'neutral' | 'concerned';
  externalScale?: number; // optional pose-aware scale
  externalYOffset?: number; // optional pose-aware vertical offset
}

function RobotModel({ isListening, isSpeaking, isProcessing, currentAudioLevel = 0, isARMode = false, emotion = 'neutral', externalScale, externalYOffset }: RobotProps) {
  const { scene } = useGLTF('/robot.glb');
  const groupRef = useRef<Group>(null);
  const mouthMorphRef = useRef<number>(0);
  const [animationState, setAnimationState] = useState<'idle' | 'listening' | 'speaking' | 'processing'>('idle');
  // Cache important mesh references to avoid per-frame traversals
  const faceBackgroundMeshRef = useRef<Mesh | null>(null); // Robot_Black_Matt_0
  const eyesMeshRef = useRef<Mesh | null>(null); // Eyes_Blue_Light_0
  const mouthMeshRef = useRef<Mesh | null>(null); // Mouth_Blue_Light_0
  const bodyMeshRefs = useRef<Mesh[]>([]); // Robot_White_Glossy_0 (can be multiple)
  const mouthMorphIndexRef = useRef<number | null>(null);

  // Setup mesh references and mouth morph target (run once per model load)
  useEffect(() => {
    if (scene) {
      bodyMeshRefs.current = [];
      faceBackgroundMeshRef.current = null;
      eyesMeshRef.current = null;
      mouthMeshRef.current = null;
      mouthMorphIndexRef.current = null;

      scene.traverse((child) => {
        if (!(child instanceof Mesh)) return;
        // Ensure shadow casting on all meshes
        if (child.castShadow !== true) child.castShadow = true;
        if (child.receiveShadow !== true) child.receiveShadow = true;
        switch (child.name) {
          case 'Robot_Black_Matt_0':
            faceBackgroundMeshRef.current = child;
            break;
          case 'Eyes_Blue_Light_0':
            eyesMeshRef.current = child;
            break;
          case 'Mouth_Blue_Light_0':
            mouthMeshRef.current = child;
            if (child.morphTargetDictionary) {
              const idx = child.morphTargetDictionary['mouth'];
              if (idx !== undefined) mouthMorphIndexRef.current = idx;
            }
            break;
          case 'Robot_White_Glossy_0':
            bodyMeshRefs.current.push(child);
            break;
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

  // Precompute per-emotion colors (avoid recreating Color objects every frame)
  const faceBackgroundColor = useMemo(() => {
    const map = {
      positive: '#4FD3C4',   // Calm teal – optimistic but mature
      neutral: '#1E2430',   // Deep desaturated navy – balanced, cinematic
      concerned: '#E5735C'    // Warm muted coral – gentle tension, not alarming
    } as const;
    return new Color(map[emotion]);
  }, [emotion]);

  const eyeColor = useMemo(() => {
    const map = {
      positive: '#F7F7F7',   // Soft mint glow – friendly and modern
      neutral: '#7AE2CF',   // Cool light blue – focus & calm
      concerned: '#7AE2CF'    // Pale amber – empathetic concern
    } as const;
    return new Color(map[emotion]);
  }, [emotion]);

  const mouthColor = useMemo(() => {
    const map = {
      positive: '#F7F7F7',   // Gentle lime tint – warm smile
      neutral: '#7AE2CF',   // Soft desaturated blue – neutral calm
      concerned: '#7AE2CF'    // Light peach – expressive but not loud
    } as const;
    return new Color(map[emotion]);
  }, [emotion]);

  const bodyColor = useMemo(() => {
    const map = {
      positive: '#2E3440',   // Deep cyan-blue – confident and cool
      neutral: '#2E3440',   // Cinematic gray-blue – premium neutral
      concerned: '#2E3440'    // Muted brick red – tension but stylish
    } as const;
    return new Color(map[emotion]);
  }, [emotion]);


  // Intensities per emotion (precomputed outside frame loop)
  const intensities = useMemo(() => {
    return {
      face: emotion === 'positive' ? 1.5 : emotion === 'concerned' ? 1.2 : 1.1,
      eyes: 2.0,
      mouth: emotion === 'positive' ? 1.8 : emotion === 'concerned' ? 1.5 : 1.4,
      body: emotion === 'positive' ? 1.0 : emotion === 'concerned' ? 0.8 : 0.3,
    } as const;
  }, [emotion]);

  // Apply emissive only when emotion changes (not every frame)
  useEffect(() => {
    const setMat = (mat: any, color: Color, intensity: number) => {
      if (!mat || !mat.emissive) return;
      // Avoid redundant writes
      const currentHex = mat.emissive.getHex();
      const targetHex = color.getHex();
      if (currentHex !== targetHex) mat.emissive.copy(color);
      if (mat.emissiveIntensity !== intensity) mat.emissiveIntensity = intensity;
      // Tone mapping can dim emissive; disable for UI-like glow
      if (mat.toneMapped !== false) mat.toneMapped = false;
    };

    const apply = (mesh: Mesh | null, color: Color, intensity: number) => {
      if (!mesh) return;
      const material: any = mesh.material;
      if (Array.isArray(material)) {
        material.forEach((mat: any) => setMat(mat, color, intensity));
      } else {
        setMat(material, color, intensity);
      }
    };

    apply(faceBackgroundMeshRef.current, faceBackgroundColor, intensities.face);
    apply(eyesMeshRef.current, eyeColor, intensities.eyes);
    apply(mouthMeshRef.current, mouthColor, intensities.mouth);
    bodyMeshRefs.current.forEach((m) => apply(m, bodyColor, intensities.body));
  }, [faceBackgroundColor, eyeColor, mouthColor, bodyColor, intensities]);

  // Enhanced animations based on state with mouth sync; no heavy scene traversals
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.getElapsedTime();

      // No material updates here; done in useEffect to avoid jank

      // Handle mouth morph target animation (only on Mouth_Blue_Light_0 mesh)
      const mouthMesh = mouthMeshRef.current;
      if (mouthMesh && mouthMesh.morphTargetInfluences && mouthMorphIndexRef.current !== null) {
        if (isSpeaking && currentAudioLevel > 0) {
          mouthMorphRef.current = currentAudioLevel;
        } else if (isSpeaking) {
          mouthMorphRef.current = Math.abs(Math.sin(time * 8)) * 0.5 + 0.3;
        } else {
          mouthMorphRef.current = Math.max(0, mouthMorphRef.current - 0.1);
        }
        mouthMesh.morphTargetInfluences[mouthMorphIndexRef.current] = mouthMorphRef.current;
      }

      // Determine robot position based on mode
      const robotX = isARMode ? -2 : 0; // Left side in AR mode, center in 3D mode

      // Cache ref locally to avoid repeated optional chaining
      const group = groupRef.current;

      // Base target values
      let targetY = -1;
      let targetScale = 1.5;

      if (typeof externalScale === 'number') targetScale = externalScale;
      if (typeof externalYOffset === 'number') targetY += externalYOffset;

      switch (animationState) {
        case 'idle':
          // Simple breathing animation - up and down movement
          group.position.x = robotX;
          group.position.y = targetY + Math.sin(time * 0.8) * 0.03;
          group.position.z = 0;
          group.rotation.y = 0; // No rotation
          group.scale.setScalar(targetScale);
          break;

        case 'listening':
          // Breathing animation while listening
          group.position.x = robotX;
          group.position.y = targetY + Math.sin(time * 0.8) * 0.03;
          group.position.z = 0;
          group.rotation.y = 0; // No rotation
          group.scale.setScalar(targetScale);
          break;

        case 'speaking':
          // No breathing animation when speaking - only mouth moves
          group.position.x = robotX;
          group.position.y = targetY; // Static position
          group.position.z = 0;
          group.rotation.y = 0; // No rotation
          group.scale.setScalar(targetScale); // Static scale
          break;

        case 'processing':
          // Breathing animation while processing
          group.position.x = robotX;
          group.position.y = targetY + Math.sin(time * 0.8) * 0.03;
          group.position.z = 0;
          group.rotation.y = 0; // No rotation
          group.scale.setScalar(targetScale);
          break;
      }
    }
  });

  return (
    <group ref={groupRef} castShadow frustumCulled={false}>
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

export function Robot({ isListening, isSpeaking, isProcessing, currentAudioLevel, isARMode = false, emotion = 'neutral', externalScale, externalYOffset }: RobotProps) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RobotModel
        isListening={isListening}
        isSpeaking={isSpeaking}
        isProcessing={isProcessing}
        currentAudioLevel={currentAudioLevel}
        isARMode={isARMode}
        emotion={emotion}
        externalScale={externalScale}
        externalYOffset={externalYOffset}
      />
    </Suspense>
  );
}

// Preload the model for better performance
useGLTF.preload('/robot.glb');
