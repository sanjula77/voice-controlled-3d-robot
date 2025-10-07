import { MutableRefObject, useEffect, useMemo, useRef, useState } from 'react';

interface FaceEstimate {
    distance01: number; // 0..1 normalized proximity (0 far, 1 near)
    scale: number; // suggested scale multiplier
    yOffset: number; // suggested vertical offset in world units
}

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

// Lightweight face proxy using face bounding box via Canvas2D sampling
// This avoids heavy ML; can be swapped for MediaPipe FaceMesh later.
export function useFaceTracking(videoRef: MutableRefObject<HTMLVideoElement | null>, options?: {
    analysisFps?: number;
    responsiveness?: number; // 0..1 smoothing per step
    minScale?: number;
    maxScale?: number;
    maxYOffset?: number;
}) {
    const analysisFps = options?.analysisFps ?? 12; // 10–15 FPS
    const responsiveness = clamp(options?.responsiveness ?? 0.25, 0.1, 0.6);
    const minScale = options?.minScale ?? 1.35;
    const maxScale = options?.maxScale ?? 1.75;
    const maxYOffset = options?.maxYOffset ?? 0.25;

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const lastTimeRef = useRef<number>(0);

    const [estimate, setEstimate] = useState<FaceEstimate>({ distance01: 0.3, scale: 1.5, yOffset: 0 });

    useEffect(() => {
        if (!canvasRef.current) {
            canvasRef.current = document.createElement('canvas');
            // Small sample; edge detection quality is secondary
            canvasRef.current.width = 160;
            canvasRef.current.height = 90;
            ctxRef.current = canvasRef.current.getContext('2d', { willReadFrequently: true });
        }
    }, []);

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
                const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

                // Very rough proxy: find the vertical center brightness dip (face vs background),
                // and use skin tone cluster size via chroma heuristic. This is intentionally simple
                // to keep CPU low; swapping to MediaPipe would provide better stability.
                let sumY = 0;
                let count = 0;
                for (let y = 0; y < canvas.height; y++) {
                    let rowScore = 0;
                    for (let x = 0; x < canvas.width; x++) {
                        const i = (y * canvas.width + x) * 4;
                        const r = data[i], g = data[i + 1], b = data[i + 2];
                        const brightness = (r + g + b) / 3;
                        const skinLike = r > 80 && g > 50 && b > 30 && r > g && g > b; // naive
                        if (skinLike) rowScore += 255 - Math.abs(140 - brightness);
                    }
                    if (rowScore > canvas.width * 20) { // tuned threshold
                        sumY += y; count++;
                    }
                }

                let normDist = 0.3;
                if (count > 0) {
                    const avgY = sumY / count; // 0..h
                    // Use vertical position and count as distance proxy
                    const presence = clamp(count / canvas.height, 0, 1); // size proxy
                    normDist = clamp(1 - presence, 0, 1); // larger presence => closer => smaller distance
                }

                const targetScale = clamp(lerp(maxScale, minScale, normDist), minScale, maxScale);
                const targetYOffset = -clamp((1 - normDist) * maxYOffset, 0, maxYOffset);

                setEstimate(prev => ({
                    distance01: lerp(prev.distance01, normDist, responsiveness),
                    scale: lerp(prev.scale, targetScale, responsiveness),
                    yOffset: lerp(prev.yOffset, targetYOffset, responsiveness),
                }));
            } catch {
                // ignore
            }
        };

        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [videoRef, analysisFps, responsiveness, minScale, maxScale, maxYOffset]);

    return useMemo(() => estimate, [estimate]);
}

export type { FaceEstimate };


