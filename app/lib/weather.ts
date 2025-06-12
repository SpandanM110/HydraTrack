import { getCurrentCoordinates, getCityName } from './location';
import { OPENWEATHER_API_KEY } from '@env';

export interface WeatherData {
  temperature: number;
  humidity: number;
  description: string;
  city: string;
  feelsLike: number;
  uvIndex?: number;
}

export const fetchWeather = async (): Promise<WeatherData> => {
  try {
    if (!OPENWEATHER_API_KEY) {
      throw new Error('OpenWeather API key is missing');
    }

    const { latitude, longitude } = await getCurrentCoordinates();
    
    // Fetch current weather
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    
    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${weatherResponse.status}`);
    }
    
    const weatherData = await weatherResponse.json();
    
    // Get city name
    const city = await getCityName(latitude, longitude);

    return {
      temperature: Math.round(weatherData.main.temp),
      humidity: weatherData.main.humidity,
      description: weatherData.weather[0].description,
      city,
      feelsLike: Math.round(weatherData.main.feels_like),
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    
    // Return default values if weather fetch fails
    return {
      temperature: 25,
      humidity: 50,
      description: 'unknown conditions',
      city: 'Unknown Location',
      feelsLike: 25,
    };
  }
};