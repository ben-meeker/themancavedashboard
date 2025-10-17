// Weather API service - calls backend
export interface WeatherData {
  temp: number;
  feelsLike: number;
  condition: string;
  icon?: string;
  humidity: number;
  windSpeed: number;
  high: number;
  low: number;
}

export const fetchWeather = async (): Promise<WeatherData> => {
  try {
    const response = await fetch('/api/weather');

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      temp: data.temp,
      feelsLike: data.feelsLike,
      condition: data.condition,
      humidity: data.humidity,
      windSpeed: data.windSpeed,
      high: data.high,
      low: data.low,
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return getPlaceholderWeather();
  }
};

const getPlaceholderWeather = (): WeatherData => {
  return {
    temp: 72,
    feelsLike: 70,
    condition: 'Clear',
    humidity: 45,
    windSpeed: 8,
    high: 78,
    low: 65,
  };
};

