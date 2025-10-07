import { PluginResult } from '../brain';

interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

export const weatherPlugin = {
  async execute(parameters: { location: string }): Promise<PluginResult> {
    try {
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
      if (!apiKey) {
        return {
          success: false,
          type: 'weather',
          summary: 'Weather service is not configured. Please add VITE_WEATHER_API_KEY to your environment.',
        };
      }

      const location = parameters.location || 'current location';
      const weatherData = await this.fetchWeatherData(location, apiKey);
      
      if (!weatherData) {
        return {
          success: false,
          type: 'weather',
          summary: `I couldn't find weather data for ${location}. Please try a different location.`,
        };
      }

      const summary = this.generateWeatherSummary(weatherData);
      
      return {
        success: true,
        type: 'weather',
        data: weatherData,
        summary,
      };
    } catch (error) {
      console.error('Weather plugin error:', error);
      return {
        success: false,
        type: 'weather',
        summary: 'I couldn\'t fetch the weather right now. Please try again later.',
      };
    }
  },

  async fetchWeatherData(location: string, apiKey: string): Promise<WeatherData | null> {
    try {
      // First, get coordinates for the location
      const geoResponse = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`
      );
      
      if (!geoResponse.ok) {
        throw new Error(`Geocoding failed: ${geoResponse.status}`);
      }

      const geoData = await geoResponse.json();
      if (!geoData || geoData.length === 0) {
        return null;
      }

      const { lat, lon, name, country } = geoData[0];

      // Get weather data
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      );

      if (!weatherResponse.ok) {
        throw new Error(`Weather API failed: ${weatherResponse.status}`);
      }

      const weatherData = await weatherResponse.json();

      return {
        location: `${name}, ${country}`,
        temperature: Math.round(weatherData.main.temp),
        description: weatherData.weather[0].description,
        humidity: weatherData.main.humidity,
        windSpeed: weatherData.wind.speed,
        icon: weatherData.weather[0].icon,
      };
    } catch (error) {
      console.error('Weather fetch error:', error);
      return null;
    }
  },

  generateWeatherSummary(data: WeatherData): string {
    const temp = data.temperature;
    const desc = data.description;
    const location = data.location;
    
    return `It's ${temp}°C and ${desc} in ${location}. Humidity is ${data.humidity}% and wind speed is ${data.windSpeed} m/s.`;
  },
};
