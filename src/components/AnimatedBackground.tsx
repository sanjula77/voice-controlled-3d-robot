import { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface AnimatedBackgroundProps {
    className?: string;
    isARMode?: boolean;
}

export function AnimatedBackground({ className = '', isARMode = false }: AnimatedBackgroundProps) {
    const { theme } = useTheme();

    // Choose palette based on voice state
    const gradient = useMemo(() => {
        if (isARMode) return 'bg-transparent';
        // Always use a calm idle gradient; no state-driven hues
        return theme === 'dark'
            ? 'from-indigo-900/60 via-slate-900/50 to-slate-800/60'
            : 'from-slate-100 via-indigo-100 to-blue-100';
    }, [theme, isARMode]);

    // Animated gradient using Tailwind keyframes
    return (
        <div
            className={`absolute inset-0 -z-10 ${isARMode ? '' : 'bg-gradient-to-br animate-[bgShift_16s_ease-in-out_infinite]'} ${gradient} ${className}`}
            style={{
                backgroundSize: '200% 200%'
            }}
        />
    );
}
