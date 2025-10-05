import { useProgress } from '@react-three/drei';

export function LoadingSpinner() {
    const { progress } = useProgress();

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 z-20">
            <div className="text-center">
                {/* Spinning robot icon */}
                <div className="mb-6">
                    <div className="w-16 h-16 mx-auto border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                </div>

                {/* Progress bar */}
                <div className="w-64 bg-gray-200 rounded-full h-2 mb-4">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                {/* Loading text */}
                <p className="text-gray-600 text-sm mb-2">Loading Talking Lexi...</p>
                <p className="text-gray-500 text-xs">{Math.round(progress)}% complete</p>
            </div>
        </div>
    );
}
