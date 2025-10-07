import { Suspense } from 'react';
import { EffectComposer, Bloom, DepthOfField, SMAA } from '@react-three/postprocessing';

interface PostProcessingEffectsProps {
    enabled?: boolean;
    variant?: 'default' | 'ar';
}

export function PostProcessingEffects({ enabled = true, variant = 'default' }: PostProcessingEffectsProps) {
    if (!enabled) return null;

    const isAR = variant === 'ar';

    return (
        <Suspense fallback={null}>
            <EffectComposer multisampling={0}>
                <SMAA />
                <Bloom
                    intensity={isAR ? 0.14 : 0.26}
                    luminanceThreshold={isAR ? 0.98 : 1.0}
                    luminanceSmoothing={0.12}
                    mipmapBlur
                />
                {isAR ? <></> : (
                    <DepthOfField focusDistance={0} focalLength={0.03} bokehScale={1.0} height={480} />
                )}
            </EffectComposer>
        </Suspense>
    );
}
