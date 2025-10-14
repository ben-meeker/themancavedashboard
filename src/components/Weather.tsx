import React, { useState, useEffect } from 'react';
import './Weather.css';
import { fetchWeather, type WeatherData } from '../services/weatherApi';
import { fetchEcowittData, type IndoorSensor } from '../services/ecowittApi';

const Weather: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [indoor, setIndoor] = useState<IndoorSensor | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      const response = await fetch('/api/setup/weather/status');
      const data = await response.json();
      setIsConfigured(data.configured);
      
      if (data.configured) {
        loadWeather();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking weather configuration:', error);
      setLoading(false);
    }
  };

  const loadWeather = async () => {
    setLoading(true);
    const data = await fetchWeather();
    setWeather(data);
    
    // Also fetch indoor sensor data from Ecowitt
    const ecowittData = await fetchEcowittData();
    if (ecowittData.indoor) {
      setIndoor(ecowittData.indoor);
    }
    
    setLoading(false);
  };

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
    };
    return conditions[condition] || '🌤️';
  };

  if (loading) {
    return (
      <div className="weather">
        <div className="weather-loading">Loading...</div>
      </div>
    );
  }

  if (!isConfigured || !weather) {
    return (
      <div className="weather">
        <div className="weather-loading">Not Configured</div>
      </div>
    );
  }

  return (
    <div className="weather">
      <div className="weather-wrapper">
        <div className="weather-main">
          <div className="weather-icon">{getWeatherEmoji(weather.condition)}</div>
          <div className="weather-temp">
            <span className="temp-value">{weather.temp}</span>
            <span className="temp-unit">°F</span>
          </div>
        </div>
        
        <div className="weather-details">
          <div className="weather-condition">{weather.condition}</div>
          <div className="weather-feels">Feels like {weather.feelsLike}°F</div>
        </div>

        <div className="weather-stats">
          <div className="weather-stat">
            <span className="stat-label">High/Low</span>
            <span className="stat-value">{weather.high}° / {weather.low}°</span>
          </div>
          <div className="weather-stat">
            <span className="stat-label">Humidity</span>
            <span className="stat-value">{weather.humidity}%</span>
          </div>
          <div className="weather-stat">
            <span className="stat-label">Wind</span>
            <span className="stat-value">{weather.windSpeed} mph</span>
          </div>
        </div>

        {indoor && (
          <div className="weather-indoor">
            <div className="indoor-label">Indoor</div>
            <div className="indoor-stats">
              <div className="indoor-stat">
                <span className="indoor-stat-label">Temp</span>
                <span className="indoor-value">{Math.round(indoor.temperature)}°F</span>
              </div>
              <div className="indoor-stat">
                <span className="indoor-stat-label">Humidity</span>
                <span className="indoor-value">{Math.round(indoor.humidity)}%</span>
              </div>
              <div className="indoor-stat">
                <span className="indoor-stat-label">Pressure</span>
                <span className="indoor-value">{indoor.pressure.toFixed(2)} inHg</span>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default Weather;

