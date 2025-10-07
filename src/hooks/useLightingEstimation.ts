import { MutableRefObject, useEffect, useMemo, useRef, useState } from 'react';

interface LightingEstimate {
    ambientIntensity: number; // 0..1
    keyIntensity: number; // 0..2
    fillIntensity: number; // 0..1
    rimIntensity: number; // 0..1
    ambientColor: string; // hex
    keyColor: string; // hex
}

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

function lerpColorHex(from: string, to: string, t: number) {
    const fa = parseInt(from.replace('#', ''), 16);
    const ta = parseInt(to.replace('#', ''), 16);
    const fr = (fa >> 16) & 0xff, fg = (fa >> 8) & 0xff, fb = fa & 0xff;
    const tr = (ta >> 16) & 0xff, tg = (ta >> 8) & 0xff, tb = ta & 0xff;
    const r = Math.round(lerp(fr, tr, t));
    const g = Math.round(lerp(fg, tg, t));
    const b = Math.round(lerp(fb, tb, t));
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

// Compute simple brightness and color temperature proxy from a small downscaled frame
function analyzeFrame(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const img = ctx.getImageData(0, 0, w, h).data;
    let rSum = 0, gSum = 0, bSum = 0;
    const len = w * h;
    for (let i = 0; i < img.length; i += 4) {
        rSum += img[i];
        gSum += img[i + 1];
        bSum += img[i + 2];
    }
    const r = rSum / len, g = gSum / len, b = bSum / len;
    const brightness = clamp((r + g + b) / (255 * 3), 0, 1);
    // Warmth proxy: red-blue balance -> [-1..1]
    const warmth = clamp((r - b) / 255, -1, 1);
    return { brightness, warmth };
}

export function useLightingEstimation(videoRef: MutableRefObject<HTMLVideoElement | null>, options?: {
    sampleSize?: number; // px of the downscale square
    analysisFps?: number; // analysis rate
    responsiveness?: number; // 0..1 smoothing factor per analysis step
    baseTheme?: 'light' | 'dark';
}) {
    const sampleSize = options?.sampleSize ?? 32;
    const analysisFps = options?.analysisFps ?? 12; // 10-15 FPS target
    const responsiveness = clamp(options?.responsiveness ?? 0.2, 0.05, 0.6);
    const baseTheme = options?.baseTheme ?? 'dark';

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const lastTimeRef = useRef<number>(0);

    const [estimate, setEstimate] = useState<LightingEstimate>(() => ({
        ambientIntensity: baseTheme === 'dark' ? 0.35 : 0.25,
        keyIntensity: baseTheme === 'dark' ? 0.9 : 1.1,
        fillIntensity: baseTheme === 'dark' ? 0.3 : 0.35,
        rimIntensity: baseTheme === 'dark' ? 0.35 : 0.45,
        ambientColor: '#ffffff',
        keyColor: '#ffffff',
    }));

    useEffect(() => {
        if (!canvasRef.current) {
            canvasRef.current = document.createElement('canvas');
            canvasRef.current.width = sampleSize;
            canvasRef.current.height = sampleSize;
            ctxRef.current = canvasRef.current.getContext('2d', { willReadFrequently: true });
        }
    }, [sampleSize]);

    useEffect(() => {
        let raf = 0;
        const frameInterval = 1000 / analysisFps;

        const loop = (time: number) => {
            raf = requestAnimationFrame(loop);
            const last = lastTimeRef.current;
            if (time - last < frameInterval) return;
            lastTimeRef.current = time;

            const video = videoRef.current;
            const ctx = ctxRef.current;
            const canvas = canvasRef.current;
            if (!video || !ctx || !canvas || video.readyState < 2) return;

            try {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const { brightness, warmth } = analyzeFrame(ctx, canvas.width, canvas.height);

                // Map brightness to intensities
                const targetAmbient = clamp((baseTheme === 'dark' ? 0.25 : 0.2) + brightness * 0.5, 0.15, 0.9);
                const targetKey = clamp(0.6 + brightness * 1.0, 0.4, 1.6);
                const targetFill = clamp(0.2 + brightness * 0.5, 0.1, 0.8);
                const targetRim = clamp(0.25 + brightness * 0.5, 0.15, 0.9);

                // Map warmth to color temperature blend between cool and warm whites
                const cool = '#CFE7FF'; // cool daylight
                const warm = '#FFE3C4'; // warm incandescent
                const blend = (warmth + 1) / 2; // 0..1
                const targetKeyColor = lerpColorHex(cool, warm, blend);
                const targetAmbientColor = lerpColorHex('#FFFFFF', lerpColorHex(cool, warm, blend * 0.6), 0.3);

                setEstimate(prev => ({
                    ambientIntensity: lerp(prev.ambientIntensity, targetAmbient, responsiveness),
                    keyIntensity: lerp(prev.keyIntensity, targetKey, responsiveness),
                    fillIntensity: lerp(prev.fillIntensity, targetFill, responsiveness),
                    rimIntensity: lerp(prev.rimIntensity, targetRim, responsiveness),
                    ambientColor: lerpColorHex(prev.ambientColor, targetAmbientColor, responsiveness),
                    keyColor: lerpColorHex(prev.keyColor, targetKeyColor, responsiveness),
                }));
            } catch {
                // ignore draw errors
            }
        };

        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [videoRef, analysisFps, responsiveness, baseTheme]);

    // Memoize outputs to avoid re-renders causing GC
    return useMemo(() => estimate, [estimate]);
}

export type { LightingEstimate };


