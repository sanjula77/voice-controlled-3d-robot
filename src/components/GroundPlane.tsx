interface GroundPlaneProps {
    isARMode?: boolean;
}

export function GroundPlane({ isARMode = false }: GroundPlaneProps) {
    // Ground plane removed - no gray rectangular area
    return null;
}
