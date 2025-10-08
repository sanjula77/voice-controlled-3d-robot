import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Play } from 'lucide-react';
import { PluginResult } from '../core/brain';

interface ARPluginCardProps {
    result: PluginResult;
    onClose: () => void;
}

export const ARPluginCard: React.FC<ARPluginCardProps> = ({ result, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    if (!result.success || !result.data) {
        return null;
    }


    const renderWeatherCards = () => {
        const data = result.data;
        return (
            <>
                {/* Main Weather Card */}
                <div
                    className={`ar-floating-card ar-weather-card ${isVisible ? 'ar-enter-animation' : 'opacity-0 scale-95'}`}
                    style={{ animationDelay: '0ms' }}
                >
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <img
                                src={`https://openweathermap.org/img/wn/${data.icon}@2x.png`}
                                alt="Weather icon"
                                className="w-16 h-16 filter drop-shadow-lg"
                            />
                            <div className="absolute -inset-2 bg-cyan-400/30 rounded-full blur-xl"></div>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white ar-text-glow">{data.location}</h3>
                            <p className="text-3xl font-black text-cyan-400 ar-text-glow">{data.temperature}°C</p>
                            <p className="text-white capitalize text-sm opacity-80">{data.description}</p>
                        </div>
                    </div>
                </div>

                {/* Weather Details Card - Modern Design */}
                <div
                    className={`ar-floating-card ar-data-card ${isVisible ? 'ar-enter-animation' : 'opacity-0 scale-95'}`}
                    style={{ animationDelay: '200ms' }}
                >
                    <div className="flex items-center justify-between px-6">
                        {/* Humidity Section */}
                        <div className="flex flex-col items-center space-y-2">
                            <div className="relative">
                                <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-400/25 to-cyan-600/15 border border-cyan-400/30">
                                    <span className="text-cyan-300 text-2xl">💧</span>
                                </div>
                                <div className="absolute -inset-2 bg-cyan-400/15 rounded-full blur-md"></div>
                            </div>
                            <div className="text-center">
                                <p className="text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-1">Humidity</p>
                                <p className="text-white font-bold text-2xl ar-text-glow">{data.humidity}%</p>
                            </div>
                        </div>

                        {/* Vertical Divider */}
                        <div className="w-px h-20 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent"></div>

                        {/* Wind Speed Section */}
                        <div className="flex flex-col items-center space-y-2">
                            <div className="relative">
                                <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-400/25 to-cyan-600/15 border border-cyan-400/30">
                                    <span className="text-cyan-300 text-2xl">💨</span>
                                </div>
                                <div className="absolute -inset-2 bg-cyan-400/15 rounded-full blur-md"></div>
                            </div>
                            <div className="text-center">
                                <p className="text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-1">Wind Speed</p>
                                <div className="flex items-baseline justify-center gap-1">
                                    <p className="text-white font-bold text-2xl ar-text-glow">{data.windSpeed}</p>
                                    <p className="text-cyan-300 text-sm font-medium">m/s</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    const renderNewsCards = () => {
        const articles = result.data.articles.slice(0, 6);
        return (
            <>
                {articles.map((article: any, index: number) => (
                    <div
                        key={index}
                        className={`ar-floating-card ar-news-card ${isVisible ? 'ar-enter-animation' : 'opacity-0 scale-95'}`}
                        style={{ animationDelay: `${index * 150}ms` }}
                    >
                        {article.urlToImage && (
                            <div className="relative overflow-hidden rounded-lg mb-3">
                                <img
                                    src={article.urlToImage}
                                    alt="Article thumbnail"
                                    className="w-full h-32 object-cover hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute top-2 right-2">
                                    <div className="w-2 h-2 bg-red-400 rounded-full ar-pulse"></div>
                                </div>
                            </div>
                        )}
                        <div>
                            <h4 className="text-white font-semibold line-clamp-2 mb-2 text-sm ar-text-glow">
                                {article.title || 'No title'}
                            </h4>
                            <p className="text-gray-300 text-xs line-clamp-2 mb-3 opacity-80">
                                {article.description || 'No description available'}
                            </p>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400 truncate">
                                    {typeof article.source === 'object' ? article.source?.name || 'Unknown' : article.source}
                                </span>
                                <a
                                    href={article.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors ar-text-glow"
                                >
                                    Read <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </>
        );
    };

    const renderSearchCards = () => {
        const results = result.data.results.slice(0, 6);
        return (
            <>
                {results.map((searchResult: any, index: number) => (
                    <div
                        key={index}
                        className={`ar-floating-card ar-search-card ${isVisible ? 'ar-enter-animation' : 'opacity-0 scale-95'}`}
                        style={{ animationDelay: `${index * 150}ms` }}
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-green-400 rounded-full ar-pulse mt-2 flex-shrink-0"></div>
                            <div className="flex-1">
                                <h4 className="text-white font-semibold line-clamp-2 mb-2 text-sm ar-text-glow">
                                    {searchResult.title || 'No title'}
                                </h4>
                                <p className="text-gray-300 text-xs line-clamp-3 mb-3 opacity-80">
                                    {searchResult.snippet || 'No description available'}
                                </p>
                                <a
                                    href={searchResult.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-green-400 text-xs hover:text-green-300 transition-colors ar-text-glow"
                                >
                                    Visit <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </>
        );
    };

    const renderYouTubeCards = () => {
        const videos = result.data.videos.slice(0, 5);
        return (
            <>
                {videos.map((video: any, index: number) => (
                    <div
                        key={index}
                        className={`ar-floating-card ar-youtube-card ${isVisible ? 'ar-enter-animation' : 'opacity-0 scale-95'}`}
                        style={{ animationDelay: `${index * 150}ms` }}
                    >
                        <div className="relative overflow-hidden rounded-lg mb-3">
                            <img
                                src={video.thumbnail}
                                alt="Video thumbnail"
                                className="w-full h-24 object-cover hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-black/70 rounded-full p-2 hover:bg-black/90 transition-colors">
                                    <Play className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <div className="absolute top-2 right-2 bg-black/70 rounded px-2 py-1">
                                <span className="text-white text-xs">{video.duration || 'Unknown'}</span>
                            </div>
                            <div className="absolute top-2 left-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full ar-pulse"></div>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold line-clamp-2 mb-1 text-sm ar-text-glow">
                                {video.title || 'No title'}
                            </h4>
                            <p className="text-gray-300 text-xs mb-2 opacity-80">{video.channelTitle || 'Unknown channel'}</p>
                            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                                <span>{video.viewCount || 'Unknown views'}</span>
                                <a
                                    href={`https://www.youtube.com/watch?v=${video.videoId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors ar-text-glow"
                                >
                                    Watch <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </>
        );
    };

    const renderFloatingCards = () => {
        switch (result.type) {
            case 'weather':
                return renderWeatherCards();
            case 'news':
                return renderNewsCards();
            case 'search':
                return renderSearchCards();
            case 'youtube':
                return renderYouTubeCards();
            default:
                return <div className="text-white">No data to display</div>;
        }
    };


    return (
        <>
            {/* Close button - positioned outside cards container */}
            <button
                onClick={onClose}
                className="fixed top-36 right-2 z-40 pointer-events-auto text-gray-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/10 ar-floating-close"
            >
                <X className="w-4 h-4" />
            </button>

            {/* Cards container */}
            <div className="fixed top-32 right-4 bottom-4 left-4 z-30 pointer-events-none">
                {/* Scrollable floating cards container */}
                <div className="h-full w-full relative overflow-y-auto scrollbar-thin pointer-events-auto">
                    {/* Floating particles effect */}
                    <div className="absolute inset-0 ar-particles opacity-10 pointer-events-none"></div>

                    {/* Flexbox cards layout */}
                    <div className="ar-cards-container">
                        {renderFloatingCards()}
                    </div>
                </div>
            </div>
        </>
    );
};
