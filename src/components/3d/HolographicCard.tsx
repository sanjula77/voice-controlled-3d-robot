import React, { useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Box, Plane } from '@react-three/drei';
import { Mesh, Vector3 } from 'three';
import * as THREE from 'three';

interface HolographicCardProps {
    position: [number, number, number];
    title: string;
    description: string;
    icon: string;
    color: string;
    onClick: () => void;
    isActive?: boolean;
}

export const HolographicCard: React.FC<HolographicCardProps> = ({
    position,
    title,
    description,
    icon,
    color,
    onClick,
    isActive = false
}) => {
    const meshRef = useRef<Mesh>(null);
    const glowRef = useRef<Mesh>(null);
    const { camera, mouse, viewport } = useThree();
    const [hovered, setHovered] = useState(false);
    const [clicked, setClicked] = useState(false);

    // Parallax motion based on mouse position
    const parallaxOffset = useMemo(() => {
        const x = (mouse.x * viewport.width) / 2;
        const y = (mouse.y * viewport.height) / 2;
        return new Vector3(x * 0.1, y * 0.1, 0);
    }, [mouse, viewport]);

    // Gentle floating animation
    useFrame((state) => {
        if (meshRef.current && glowRef.current) {
            const time = state.clock.getElapsedTime();

            // Floating motion
            meshRef.current.position.y = position[1] + Math.sin(time + position[0]) * 0.1;
            meshRef.current.rotation.y = Math.sin(time * 0.5) * 0.05;

            // Parallax effect
            meshRef.current.position.add(parallaxOffset);

            // Glow pulsing
            const glowIntensity = isActive ? 1.5 : (hovered ? 1.2 : 0.8);
            glowRef.current.material.opacity = glowIntensity + Math.sin(time * 2) * 0.1;

            // Hover scale
            const targetScale = hovered ? 1.1 : 1;
            meshRef.current.scale.lerp(new Vector3(targetScale, targetScale, targetScale), 0.1);
        }
    });

    const cardMaterial = useMemo(() => {
        return new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(color),
            transparent: true,
            opacity: 0.15,
            roughness: 0.1,
            metalness: 0.8,
            clearcoat: 1,
            clearcoatRoughness: 0.1,
            transmission: 0.9,
            thickness: 0.5,
        });
    }, [color]);

    const glowMaterial = useMemo(() => {
        return new THREE.MeshBasicMaterial({
            color: new THREE.Color(color),
            transparent: true,
            opacity: 0.3,
        });
    }, [color]);

    return (
        <group position={position}>
            {/* Glow effect */}
            <Plane
                ref={glowRef}
                args={[2.2, 1.4]}
                material={glowMaterial}
                position={[0, 0, -0.01]}
            />

            {/* Main card */}
            <Box
                ref={meshRef}
                args={[2, 1.2, 0.1]}
                material={cardMaterial}
                onClick={onClick}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                onPointerDown={() => setClicked(true)}
                onPointerUp={() => setClicked(false)}
            >
                {/* Card content */}
                <Text
                    position={[0, 0.3, 0.06]}
                    fontSize={0.15}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/inter-bold.woff"
                >
                    {title}
                </Text>

                <Text
                    position={[0, 0, 0.06]}
                    fontSize={0.08}
                    color="#cccccc"
                    anchorX="center"
                    anchorY="middle"
                    maxWidth={1.8}
                    font="/fonts/inter-regular.woff"
                >
                    {description}
                </Text>

                <Text
                    position={[0, -0.3, 0.06]}
                    fontSize={0.2}
                    color={color}
                    anchorX="center"
                    anchorY="middle"
                >
                    {icon}
                </Text>
            </Box>

            {/* Edge lighting */}
            <Box
                args={[2.1, 0.05, 0.02]}
                position={[0, 0.6, 0.05]}
                material={new THREE.MeshBasicMaterial({
                    color: new THREE.Color(color),
                    transparent: true,
                    opacity: 0.8,
                })}
            />
            <Box
                args={[2.1, 0.05, 0.02]}
                position={[0, -0.6, 0.05]}
                material={new THREE.MeshBasicMaterial({
                    color: new THREE.Color(color),
                    transparent: true,
                    opacity: 0.8,
                })}
            />
            <Box
                args={[0.05, 1.3, 0.02]}
                position={[1.05, 0, 0.05]}
                material={new THREE.MeshBasicMaterial({
                    color: new THREE.Color(color),
                    transparent: true,
                    opacity: 0.8,
                })}
            />
            <Box
                args={[0.05, 1.3, 0.02]}
                position={[-1.05, 0, 0.05]}
                material={new THREE.MeshBasicMaterial({
                    color: new THREE.Color(color),
                    transparent: true,
                    opacity: 0.8,
                })}
            />
        </group>
    );
};
