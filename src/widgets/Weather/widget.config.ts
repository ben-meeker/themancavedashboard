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
  requiredConfig: [
    {
      key: 'latitude',
      label: 'Latitude',
      description: 'Your location latitude (e.g., 39.7392)'
    },
    {
      key: 'longitude',
      label: 'Longitude',
      description: 'Your location longitude (e.g., -104.9903)'
    },
    {
      key: 'location_name',
      label: 'Location Name (Optional)',
      description: 'Display name for your location (e.g., "Denver, CO")'
    }
  ],
  requiredEnv: [
    {
      key: 'OPENWEATHER_API_KEY',
      label: 'OpenWeather API Key',
      description: 'Get your free API key from https://openweathermap.org/api'
    }
  ],
  configMessage: 'Weather Not Configured',
  configHint: 'Add latitude and longitude to widget config, and OPENWEATHER_API_KEY to .env'
};

// Auto-register widget
if (typeof window !== 'undefined') {
  window.__DASHBOARD_WIDGETS__ = window.__DASHBOARD_WIDGETS__ || [];
  window.__DASHBOARD_WIDGETS__.push(widgetConfig);
}

