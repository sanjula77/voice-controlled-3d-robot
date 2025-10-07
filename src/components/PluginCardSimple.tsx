import React from 'react';
import { X, ExternalLink, Play, Cloud, Newspaper, Search, Youtube } from 'lucide-react';
import { PluginResult } from '../core/brain';

interface PluginCardSimpleProps {
    result: PluginResult;
    onClose: () => void;
}

export const PluginCardSimple: React.FC<PluginCardSimpleProps> = ({ result, onClose }) => {
    if (!result.success || !result.data) {
        return null;
    }

    const getIcon = () => {
        switch (result.type) {
            case 'weather':
                return <Cloud className="w-5 h-5 text-blue-400" />;
            case 'news':
                return <Newspaper className="w-5 h-5 text-red-400" />;
            case 'search':
                return <Search className="w-5 h-5 text-green-400" />;
            case 'youtube':
                return <Youtube className="w-5 h-5 text-red-500" />;
            default:
                return <ExternalLink className="w-5 h-5 text-gray-400" />;
        }
    };

    const getCardTitle = () => {
        switch (result.type) {
            case 'weather':
                return 'Weather Information';
            case 'news':
                return 'Latest News';
            case 'search':
                return 'Search Results';
            case 'youtube':
                return 'YouTube Videos';
            default:
                return 'Information';
        }
    };

    const renderSimpleContent = () => {
        const data = result.data;

        switch (result.type) {
            case 'weather':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <img
                                src={`https://openweathermap.org/img/wn/${data.icon}@2x.png`}
                                alt="Weather icon"
                                className="w-16 h-16"
                            />
                            <div>
                                <h3 className="text-lg font-semibold text-white">{data.location}</h3>
                                <p className="text-3xl font-bold text-blue-400">{data.temperature}°C</p>
                                <p className="text-white capitalize text-sm">{data.description}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/10 rounded-lg p-3">
                                <p className="text-gray-300 text-xs">Humidity</p>
                                <p className="text-white font-semibold">{data.humidity}%</p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-3">
                                <p className="text-gray-300 text-xs">Wind Speed</p>
                                <p className="text-white font-semibold">{data.windSpeed} m/s</p>
                            </div>
                        </div>
                    </div>
                );

            case 'news':
                const articles = data.articles?.slice(0, 5) || [];
                return (
                    <div className="space-y-3">
                        {articles.map((article: any, index: number) => (
                            <div key={index} className="bg-white/10 rounded-lg p-3 hover:bg-white/15 transition-colors">
                                <div className="flex gap-3">
                                    {article.urlToImage && (
                                        <img
                                            src={article.urlToImage}
                                            alt="Article thumbnail"
                                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-white font-medium text-sm line-clamp-2 mb-1">{article.title || 'No title'}</h4>
                                        <p className="text-gray-300 text-xs line-clamp-2 mb-2">{article.description || 'No description available'}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-400 text-xs">{article.source || 'Unknown source'}</span>
                                            <a
                                                href={article.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-blue-400 text-xs hover:text-blue-300 transition-colors"
                                            >
                                                Read <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                );

            case 'search':
                const results = data.results?.slice(0, 5) || [];
                return (
                    <div className="space-y-3">
                        {results.map((searchResult: any, index: number) => (
                            <div key={index} className="bg-white/10 rounded-lg p-3 hover:bg-white/15 transition-colors">
                                <h4 className="text-white font-medium text-sm line-clamp-2 mb-2">{searchResult.title || 'No title'}</h4>
                                <p className="text-gray-300 text-xs line-clamp-3 mb-3">{searchResult.snippet || 'No description available'}</p>
                                <a
                                    href={searchResult.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-blue-400 text-xs hover:text-blue-300 transition-colors"
                                >
                                    Visit <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        ))}
                    </div>
                );

            case 'youtube':
                const videos = data.videos?.slice(0, 4) || [];
                return (
                    <div className="space-y-3">
                        {videos.map((video: any, index: number) => (
                            <div key={index} className="bg-white/10 rounded-lg p-3 hover:bg-white/15 transition-colors">
                                <div className="flex gap-3">
                                    <div className="relative flex-shrink-0">
                                        <img
                                            src={video.thumbnail}
                                            alt="Video thumbnail"
                                            className="w-20 h-14 object-cover rounded-lg"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Play className="w-6 h-6 text-white bg-black/50 rounded-full p-1" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-white font-medium text-sm line-clamp-2 mb-1">{video.title || 'No title'}</h4>
                                        <p className="text-gray-300 text-xs mb-2">{video.channelTitle || 'Unknown channel'}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                                            <span>{video.duration || 'Unknown duration'}</span>
                                            <span>{video.viewCount || 'Unknown views'}</span>
                                        </div>
                                        <a
                                            href={`https://www.youtube.com/watch?v=${video.videoId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-blue-400 text-xs hover:text-blue-300 transition-colors"
                                        >
                                            Watch <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                );

            default:
                return <div className="text-white">No data to display</div>;
        }
    };

    return (
        <div className="fixed top-20 right-4 w-96 max-w-[calc(100vw-2rem)] z-30 max-h-[calc(100vh-6rem)]">
            <div className="glass-panel-dark rounded-2xl p-6 shadow-2xl border border-white/10 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        {getIcon()}
                        <h2 className="text-lg font-semibold text-white">{getCardTitle()}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    {renderSimpleContent()}
                </div>
            </div>
        </div>
    );
};
