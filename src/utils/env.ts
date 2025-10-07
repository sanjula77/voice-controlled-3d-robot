export const ENV_CONFIG = {
  // AI Brain
  OPENROUTER_API_KEY: import.meta.env.VITE_OPENROUTER_API_KEY,
  
  // Plugin APIs
  WEATHER_API_KEY: import.meta.env.VITE_WEATHER_API_KEY,
  NEWS_API_KEY: import.meta.env.VITE_NEWS_API_KEY,
  SERPER_API_KEY: import.meta.env.VITE_SERPER_API_KEY,
  YOUTUBE_API_KEY: import.meta.env.VITE_YOUTUBE_API_KEY,
} as const;

export const isPluginEnabled = (plugin: keyof typeof ENV_CONFIG): boolean => {
  return !!ENV_CONFIG[plugin];
};

export const getEnabledPlugins = (): string[] => {
  return Object.entries(ENV_CONFIG)
    .filter(([_, value]) => !!value)
    .map(([key, _]) => key.replace('_API_KEY', '').toLowerCase());
};

export const getPluginStatus = () => {
  return {
    brain: isPluginEnabled('OPENROUTER_API_KEY'),
    weather: isPluginEnabled('WEATHER_API_KEY'),
    news: isPluginEnabled('NEWS_API_KEY'),
    search: isPluginEnabled('SERPER_API_KEY'),
    youtube: isPluginEnabled('YOUTUBE_API_KEY'),
  };
};
