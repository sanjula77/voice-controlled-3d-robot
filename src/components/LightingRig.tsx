import { useMemo } from 'react';

interface LightingRigProps {
    theme?: 'light' | 'dark';
    variant?: 'default' | 'ar';
    // Optional dynamic overrides (from lighting estimation)
    ambientIntensity?: number;
    keyIntensity?: number;
    fillIntensity?: number;
    rimIntensity?: number;
    ambientColorHex?: string;
    keyColorHex?: string;
}

export function LightingRig({ theme = 'dark', variant = 'default', ambientIntensity, keyIntensity, fillIntensity, rimIntensity, ambientColorHex, keyColorHex }: LightingRigProps) {
    const colors = useMemo(() => {
        return theme === 'dark'
            ? { key: 0xffffff, rim: 0x6ea8ff, fill: 0xaec4ff }
            : { key: 0xffffff, rim: 0x7aa2ff, fill: 0xa3bffa };
    }, [theme]);

    const isAR = variant === 'ar';
    const derivedKeyIntensity = keyIntensity ?? (isAR ? 0.9 : 1.2);
    const derivedFillIntensity = fillIntensity ?? (isAR ? 0.3 : 0.4);
    const derivedRimIntensity = rimIntensity ?? (isAR ? 0.35 : 0.5);
    const derivedAmbientIntensity = ambientIntensity ?? (isAR ? 0.35 : 0.25);

    return (
        <>
            {/* Hemisphere light for AR softness */}
            {isAR && <hemisphereLight args={[0xffffff, 0x222233, 0.25]} />}

            {/* Key light */}
            <directionalLight
                position={[5, 5, 5]}
                intensity={derivedKeyIntensity}
                color={keyColorHex ? parseInt(keyColorHex.replace('#', ''), 16) : colors.key}
                castShadow={true}
                shadow-mapSize-width={isAR ? 512 : 1024}
                shadow-mapSize-height={isAR ? 512 : 1024}
                shadow-bias={-0.0005}
                shadow-camera-near={0.5}
                shadow-camera-far={50}
                shadow-camera-left={-10}
                shadow-camera-right={10}
                shadow-camera-top={10}
                shadow-camera-bottom={-10}
            />

            {/* Fill light */}
            <directionalLight position={[-4, 2, -3]} intensity={derivedFillIntensity} color={colors.fill} />

            {/* Rim light */}
            <directionalLight position={[0, 2.5, -6]} intensity={derivedRimIntensity} color={colors.rim} />

            {/* Ambient */}
            <ambientLight intensity={derivedAmbientIntensity} color={ambientColorHex ? ambientColorHex : undefined} />
        </>
    );
}
