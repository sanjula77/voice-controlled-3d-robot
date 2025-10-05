interface GroundPlaneProps {
    isARMode?: boolean;
}

export function GroundPlane({ isARMode = false }: GroundPlaneProps) {
    return (
        <>
            {/* Ground plane with shadow - more transparent in AR mode */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -1.5, 0]}
                receiveShadow
            >
                <planeGeometry args={[20, 20]} />
                <meshStandardMaterial
                    color={isARMode ? "#2a2a2a" : "#1e293b"}
                    transparent
                    opacity={isARMode ? 0.2 : 0.6}
                    roughness={0.9}
                    metalness={0.1}
                />
            </mesh>

            {/* Subtle grid pattern - more subtle in AR mode */}
            {!isARMode && (
                <mesh
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, -1.49, 0]}
                >
                    <planeGeometry args={[20, 20]} />
                    <meshBasicMaterial
                        color="#475569"
                        transparent
                        opacity={0.2}
                        wireframe
                    />
                </mesh>
            )}
        </>
    );
}
