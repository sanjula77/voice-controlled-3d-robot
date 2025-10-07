interface GroundPlaneProps {
    isARMode?: boolean;
}

export function GroundPlane({ isARMode = false }: GroundPlaneProps) {
    if (!isARMode) return null;

    // Transparent shadow receiver for AR grounding
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.01, 0]} receiveShadow>
            <planeGeometry args={[10, 10]} />
            {/* Use ShadowMaterial to render only the shadow */}
            <shadowMaterial transparent opacity={0.25} color="#000000" />
        </mesh>
    );
}
