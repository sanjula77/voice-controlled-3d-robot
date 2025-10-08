import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import { BufferGeometry, Float32BufferAttribute, Points as ThreePoints } from 'three';

export const ParticleField: React.FC = () => {
    const pointsRef = useRef<ThreePoints>(null);
    const { viewport } = useThree();

    const particleCount = 200;
    const positions = useMemo(() => {
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * viewport.width * 2;
            positions[i * 3 + 1] = (Math.random() - 0.5) * viewport.height * 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
        return positions;
    }, [viewport]);

    useFrame((state) => {
        if (pointsRef.current) {
            const time = state.clock.getElapsedTime();

            // Gentle floating motion
            const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3 + 1] += Math.sin(time + i) * 0.001;
                positions[i * 3 + 2] += Math.cos(time * 0.5 + i) * 0.0005;
            }
            pointsRef.current.geometry.attributes.position.needsUpdate = true;
        }
    });

    return (
        <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
            <PointMaterial
                transparent
                color="#00fff2"
                size={0.02}
                sizeAttenuation={true}
                depthWrite={false}
                opacity={0.3}
            />
        </Points>
    );
};
