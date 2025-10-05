import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';

export function PerformanceMonitor() {
    const [fps, setFps] = useState(60);
    const frameCount = useRef(0);
    const lastTime = useRef(performance.now());

    useFrame(() => {
        frameCount.current++;
        const currentTime = performance.now();

        if (currentTime - lastTime.current >= 1000) {
            setFps(Math.round((frameCount.current * 1000) / (currentTime - lastTime.current)));
            frameCount.current = 0;
            lastTime.current = currentTime;
        }
    });

    return (
        <div className="absolute top-20 right-20 z-20 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-mono">
            {fps} FPS
        </div>
    );
}
