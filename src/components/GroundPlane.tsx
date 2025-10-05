export function GroundPlane() {
    return (
        <>
            {/* Ground plane with shadow */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -1.5, 0]}
                receiveShadow
            >
                <planeGeometry args={[20, 20]} />
                <meshStandardMaterial
                    color="#1e293b"
                    transparent
                    opacity={0.6}
                    roughness={0.9}
                    metalness={0.1}
                />
            </mesh>

            {/* Subtle grid pattern */}
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
        </>
    );
}
