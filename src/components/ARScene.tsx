import { Canvas } from '@react-three/fiber';
import { Suspense, useRef, useEffect, useState, useCallback } from 'react';
import { OrbitControls } from '@react-three/drei';
import { Robot } from './Robot';
import { GroundPlane } from './GroundPlane';
import { LoadingSpinner } from './LoadingSpinner';
import { PostProcessingEffects } from './PostProcessingEffects';
import { LightingRig } from './LightingRig';
import { useConversation } from '../contexts/ConversationContext';
import { useVoiceState } from '../contexts/VoiceStateContext';
import { useTheme } from '../contexts/ThemeContext';

interface ARSceneProps {
    className?: string;
}

export function ARScene({ className = '' }: ARSceneProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [webcamError, setWebcamError] = useState<string | null>(null);
    const [isWebcamActive, setIsWebcamActive] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { theme } = useTheme();
    const { messages } = useConversation();
    const { voiceState } = useVoiceState();

    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Initialize webcam
    const initializeWebcam = useCallback(async () => {
        try {
            setIsLoading(true);
            setWebcamError(null);

            // Request webcam access with mobile optimization

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: isMobile ? 1280 : 1920 },
                    height: { ideal: isMobile ? 720 : 1080 },
                    facingMode: 'user', // Front camera for better AR experience
                    frameRate: { ideal: 30, max: 60 }, // Optimize frame rate for mobile
                },
                audio: false, // We don't need audio from webcam
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                setIsWebcamActive(true);
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Webcam access error:', error);
            setWebcamError(
                error instanceof Error
                    ? error.message
                    : 'Failed to access webcam. Please check permissions and try again.'
            );
            setIsLoading(false);
        }
    }, []);

    // Cleanup webcam stream
    const cleanupWebcam = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setIsWebcamActive(false);
        }
    }, []);

    // Initialize webcam on component mount
    useEffect(() => {
        initializeWebcam();

        // Cleanup on unmount
        return () => {
            cleanupWebcam();
        };
    }, [initializeWebcam, cleanupWebcam]);

    // Handle webcam permission retry
    const handleRetryWebcam = () => {
        cleanupWebcam();
        initializeWebcam();
    };

    // Get the latest message to determine robot state
    const latestMessage = messages[messages.length - 1];
    const isProcessing = messages.length > 0 && !latestMessage?.isUser;

    // Fallback background when webcam is not available
    const getFallbackBackground = () => {
        if (theme === 'dark') {
            return 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)';
        }
        return 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)';
    };

    return (
        <div className={`relative w-full h-full overflow-hidden ${className}`}>
            {/* Webcam Video Background */}
            <video
                ref={videoRef}
                className={`absolute inset-0 w-full h-full object-cover ${isWebcamActive ? 'opacity-100' : 'opacity-0'
                    } transition-opacity duration-500`}
                playsInline
                muted
                autoPlay
                style={{
                    transform: 'scaleX(-1)', // Mirror the video for natural AR experience
                }}
            />

            {/* Fallback Background */}
            {!isWebcamActive && (
                <div
                    className="absolute inset-0 w-full h-full transition-opacity duration-500"
                    style={{
                        background: getFallbackBackground(),
                        opacity: webcamError ? 1 : 0.3,
                    }}
                />
            )}

            {/* Error State */}
            {webcamError && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className={`backdrop-blur-md rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl border ${theme === 'dark'
                        ? 'bg-slate-900/90 text-slate-100 border-slate-700/50'
                        : 'bg-white/90 text-gray-800 border-gray-200/50'
                        }`}>
                        <div className="text-6xl mb-4">📹</div>
                        <h3 className="text-xl font-semibold mb-2">Webcam Access Required</h3>
                        <p className="text-sm mb-6 opacity-80">
                            {webcamError}
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={handleRetryWebcam}
                                className={`w-full px-6 py-3 rounded-lg font-medium transition-all duration-200 ${theme === 'dark'
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                            >
                                🔄 Try Again
                            </button>
                            <button
                                onClick={() => setWebcamError(null)}
                                className={`w-full px-6 py-2 rounded-lg font-medium transition-all duration-200 ${theme === 'dark'
                                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                    }`}
                            >
                                Continue Without Webcam
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isLoading && !webcamError && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className={`backdrop-blur-md rounded-2xl p-8 text-center shadow-2xl border ${theme === 'dark'
                        ? 'bg-slate-900/90 text-slate-100 border-slate-700/50'
                        : 'bg-white/90 text-gray-800 border-gray-200/50'
                        }`}>
                        <LoadingSpinner />
                        <p className="mt-4 text-sm opacity-80">Initializing webcam...</p>
                    </div>
                </div>
            )}

            {/* 3D Canvas with Transparent Background */}
            <Suspense fallback={<LoadingSpinner />}>
                <Canvas
                    ref={canvasRef}
                    camera={{
                        position: [0, 1, 5],
                        fov: 50,
                        near: 0.1,
                        far: 1000
                    }}
                    shadows
                    className="w-full h-full"
                    gl={{
                        alpha: true, // Enable transparency
                        antialias: !isMobile, // Disable antialiasing on mobile for performance
                        powerPreference: 'high-performance',
                        precision: isMobile ? 'lowp' : 'mediump', // Lower precision on mobile
                        logarithmicDepthBuffer: false, // Disable for better performance
                        failIfMajorPerformanceCaveat: false, // Allow fallback on low-end devices
                    }}
                    style={{
                        background: 'transparent', // Transparent background for AR effect
                    }}
                    dpr={[1, 1.75]}
                    onCreated={({ gl }) => {
                        // Slightly higher exposure for webcam backdrop
                        try { (gl as any).toneMappingExposure = 1.02; } catch { }
                    }}
                >
                    {/* Cinematic but softer lighting for AR */}
                    <LightingRig variant="ar" />

                    {/* Subtle bloom in AR to match 3D glow; no DOF */}
                    <PostProcessingEffects enabled variant="ar" />

                    {/* Ground plane with transparency */}
                    <GroundPlane isARMode={true} />

                    {/* Robot model with voice state - positioned for AR mode */}
                    <Robot
                        isListening={voiceState.isListening}
                        isSpeaking={voiceState.isSpeaking}
                        isProcessing={voiceState.isProcessing || voiceState.isThinking}
                        currentAudioLevel={voiceState.currentAudioLevel}
                        isARMode={true}
                        emotion={voiceState.emotion}
                    />

                    {/* Camera controls optimized for AR */}
                    <OrbitControls
                        enableZoom={true}
                        enablePan={false}
                        enableRotate={true}
                        minDistance={2}
                        maxDistance={8}
                        maxPolarAngle={Math.PI / 1.8}
                        minPolarAngle={Math.PI / 6}
                        enableDamping={true}
                        dampingFactor={0.05}
                    />
                </Canvas>
            </Suspense>

            {/* AR Status Indicator removed per design */}

            {/* Performance indicator removed per design */}
        </div>
    );
}
