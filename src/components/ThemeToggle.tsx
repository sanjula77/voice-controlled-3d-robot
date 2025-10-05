import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="relative w-12 h-6 bg-gray-600 dark:bg-gray-300 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
            <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-gray-800 rounded-full shadow-md transform transition-transform duration-200 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
                    }`}
            >
                <div className="flex items-center justify-center h-full">
                    {theme === 'dark' ? (
                        <span className="text-yellow-500 text-xs">🌙</span>
                    ) : (
                        <span className="text-yellow-500 text-xs">☀️</span>
                    )}
                </div>
            </div>
        </button>
    );
}
