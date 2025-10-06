import { Suspense, lazy } from 'react';
import { useThree } from '@react-three/fiber';

// Lazy import to reduce initial bundle
const EffectComposer = lazy(() => import('@react-three/postprocessing').then(m => ({ default: m.EffectComposer })));
const Bloom = lazy(() => import('@react-three/postprocessing').then(m => ({ default: m.Bloom })));
const DepthOfField = lazy(() => import('@react-three/postprocessing').then(m => ({ default: m.DepthOfField })));
const SMAA = lazy(() => import('@react-three/postprocessing').then(m => ({ default: m.SMAA })));

interface PostProcessingEffectsProps {
    enabled?: boolean;
    variant?: 'default' | 'ar';
}

export function PostProcessingEffects({ enabled = true, variant = 'default' }: PostProcessingEffectsProps) {
    const { camera } = useThree();
    if (!enabled) return null;

    const isAR = variant === 'ar';

    return (
        <Suspense fallback={null}>
            <EffectComposer multisampling={0}>
                {/* Edge clarity with cheap anti-aliasing */}
                <SMAA />
                {/* Bloom tuned for clarity */}
                <Bloom
                    intensity={isAR ? 0.14 : 0.26}
                    luminanceThreshold={isAR ? 0.98 : 1.0}
                    luminanceSmoothing={0.12}
                    mipmapBlur
                />
                {/* DOF only in 3D mode, very subtle */}
                {!isAR && (
                    <DepthOfField focusDistance={0} focalLength={0.03} bokehScale={1.0} height={480} />
                )}
            </EffectComposer>
        </Suspense>
    );
}
