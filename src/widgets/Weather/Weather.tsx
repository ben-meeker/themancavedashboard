import React, { useState, useEffect } from 'react';
import './Weather.css';
import { fetchWeather, type WeatherData } from './weatherApi';
import ConfigurableWidget from '../../components/ConfigurableWidget';
import { getWidgetConfig } from '../../config/widgetConfigs';

const Weather: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  // Get widget configuration
  const config = getWidgetConfig('weather')!;

  // Check if weather is configured by attempting to fetch data
  const checkWeatherConfig = async (): Promise<boolean> => {
    try {
      const data = await fetchWeather();
      return data !== null;
    } catch (error) {
      console.error('Error checking weather configuration:', error);
      return false;
    }
  };

  // Load weather data
  const loadWeather = async () => {
    setLoading(true);
    try {
      const data = await fetchWeather();
      setWeather(data);
    } catch (error) {
      console.error('Error loading weather data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load weather when component mounts
  useEffect(() => {
    loadWeather();
  }, []);

  const getWeatherEmoji = (condition: string) => {
    const conditions: { [key: string]: string } = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Haze': '🌫️',
      'Smoke': '🌫️',
      'Dust': '🌫️',
      'Sand': '🌫️',
      'Ash': '🌫️',
      'Squall': '💨',
      'Tornado': '🌪️'
    };
    return conditions[condition] || '🌤️';
  };

  return (
    <ConfigurableWidget
      config={config}
      checkConfig={checkWeatherConfig}
      className="weather"
    >
      <div className="card-header">
        <span className="card-icon">🌤️</span>
        <h2 className="card-title">Weather</h2>
      </div>
      <div className="card-content">
        <div className="weather-wrapper">
        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <span>Loading weather...</span>
          </div>
        ) : weather ? (
          <>
            <div className="weather-main">
              <div className="weather-icon">
                {getWeatherEmoji(weather.condition)}
              </div>
              <div className="weather-temp">
                <span className="temp-value">{Math.round(weather.temp)}</span>
                <span className="temp-unit">°F</span>
              </div>
              <div className="weather-details">
                <div className="weather-condition">{weather.condition}</div>
                <div className="weather-feels">Feels like {Math.round(weather.feelsLike)}°F</div>
              </div>
            </div>

            <div className="weather-stats">
              <div className="weather-stat">
                <span className="stat-label">Humidity</span>
                <span className="stat-value">{weather.humidity}%</span>
              </div>
              <div className="weather-stat">
                <span className="stat-label">Wind</span>
                <span className="stat-value">{weather.windSpeed} mph</span>
              </div>
              <div className="weather-stat">
                <span className="stat-label">High/Low</span>
                <span className="stat-value">{weather.high}°/{weather.low}°</span>
              </div>
            </div>
          </>
        ) : (
          <div className="loading">
            <span>No weather data available</span>
          </div>
        )}
        </div>
      </div>
    </ConfigurableWidget>
  );
};

export default Weather;
