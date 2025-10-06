import { useMemo } from 'react';

interface LightingRigProps {
    theme?: 'light' | 'dark';
    variant?: 'default' | 'ar';
}

export function LightingRig({ theme = 'dark', variant = 'default' }: LightingRigProps) {
    const colors = useMemo(() => {
        return theme === 'dark'
            ? { key: 0xffffff, rim: 0x6ea8ff, fill: 0xaec4ff }
            : { key: 0xffffff, rim: 0x7aa2ff, fill: 0xa3bffa };
    }, [theme]);

    const isAR = variant === 'ar';
    const keyIntensity = isAR ? 0.9 : 1.2;
    const fillIntensity = isAR ? 0.3 : 0.4;
    const rimIntensity = isAR ? 0.35 : 0.5;

    return (
        <>
            {/* Hemisphere light for AR softness */}
            {isAR && <hemisphereLight args={[0xffffff, 0x222233, 0.25]} />}

            {/* Key light */}
            <directionalLight
                position={[5, 5, 5]}
                intensity={keyIntensity}
                color={colors.key}
                castShadow={!isAR}
                shadow-mapSize-width={isAR ? 512 : 1024}
                shadow-mapSize-height={isAR ? 512 : 1024}
            />

            {/* Fill light */}
            <directionalLight position={[-4, 2, -3]} intensity={fillIntensity} color={colors.fill} />

            {/* Rim light */}
            <directionalLight position={[0, 2.5, -6]} intensity={rimIntensity} color={colors.rim} />

            {/* Ambient */}
            <ambientLight intensity={isAR ? 0.35 : 0.25} />
        </>
    );
}
