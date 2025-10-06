import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="glass-panel rounded-xl w-10 h-10 flex items-center justify-center hover:scale-105 transition-all"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
            {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-sky-300 moon-glow" />
            ) : (
                <Sun className="w-5 h-5 text-amber-400" />
            )}
        </button>
    );
}
