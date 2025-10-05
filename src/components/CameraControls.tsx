import { OrbitControls } from '@react-three/drei';
import { useRef } from 'react';

interface CameraControlsProps {
    onReset?: () => void;
}

export function CameraControls({ onReset: _onReset }: CameraControlsProps) {
    const controlsRef = useRef<any>();

    return (
        <OrbitControls
            ref={controlsRef}
            enableZoom={true}
            enablePan={false}
            enableRotate={true}
            minDistance={2}
            maxDistance={8}
            maxPolarAngle={Math.PI / 1.8}
            minPolarAngle={Math.PI / 6}
            autoRotate={false}
            autoRotateSpeed={0.5}
            enableDamping={true}
            dampingFactor={0.05}
            screenSpacePanning={false}
        />
    );
}
