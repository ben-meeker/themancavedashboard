import type { WidgetMetadata } from '../../types/widget.ts';
import Weather from './Weather.tsx';

export const widgetConfig: WidgetMetadata = {
  id: 'weather',
  name: 'Weather',
  description: 'Current weather and forecast',
  icon: '🌤️',
  defaultSize: {
    width: 1,
    height: 1
  },
  component: Weather,
  requiredConfig: [],
  requiredEnv: [
    {
      key: 'OPENWEATHER_API_KEY',
      label: 'OpenWeather API Key',
      description: 'Get your free API key from https://openweathermap.org/api'
    },
    {
      key: 'WEATHER_LAT',
      label: 'Latitude',
      description: 'Your location latitude'
    },
    {
      key: 'WEATHER_LON',
      label: 'Longitude',
      description: 'Your location longitude'
    }
  ]
};

// Auto-register widget
if (typeof window !== 'undefined') {
  window.__DASHBOARD_WIDGETS__ = window.__DASHBOARD_WIDGETS__ || [];
  window.__DASHBOARD_WIDGETS__.push(widgetConfig);
}

