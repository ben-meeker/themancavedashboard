import type { WidgetConfig } from '../hooks/useWidgetConfig';

/**
 * Standardized widget configuration definitions
 * Each widget defines its required parameters and messaging
 */

export const WIDGET_CONFIGS: Record<string, WidgetConfig> = {
  tesla: {
    name: 'Tesla',
    requiredParams: ['TESSIE_API_KEY', 'TESSIE_VIN'],
    icon: '🚗',
    message: 'Tesla Not Connected',
    hint: 'Add TESSIE_API_KEY and TESSIE_VIN to your configuration'
  },
  
  weather: {
    name: 'Weather',
    requiredParams: ['OPENWEATHER_API_KEY', 'WEATHER_LAT', 'WEATHER_LON'],
    icon: '🌤️',
    message: 'Weather Not Connected',
    hint: 'Add OPENWEATHER_API_KEY, WEATHER_LAT, and WEATHER_LON to your configuration'
  },
  
  plants: {
    name: 'Plant Sensors',
    requiredParams: ['ECOWITT_API_KEY', 'ECOWITT_APPLICATION_KEY', 'ECOWITT_GATEWAY_MAC'],
    icon: '🌱',
    message: 'Plant Sensors Not Connected',
    hint: 'Add ECOWITT_API_KEY, ECOWITT_APPLICATION_KEY, and ECOWITT_GATEWAY_MAC to your configuration'
  },
  
  meals: {
    name: 'Meal Calendar',
    requiredParams: ['MEAL_ICAL_URL'],
    icon: '🍽️',
    message: 'Meal Calendar Not Connected',
    hint: 'Add MEAL_ICAL_URL to your configuration'
  },
  
  calendar: {
    name: 'Google Calendar',
    requiredParams: ['GOOGLE_CREDENTIALS_PATH', 'GOOGLE_TOKEN_PATH'],
    icon: '📅',
    message: 'Google Calendar Not Connected',
    hint: 'Add GOOGLE_CREDENTIALS_PATH and GOOGLE_TOKEN_PATH to your configuration'
  },
  
  photos: {
    name: 'Photo Carousel',
    requiredParams: ['PHOTOS_PATH'],
    icon: '📸',
    message: 'Photos Not Available',
    hint: 'Add PHOTOS_PATH to your configuration and ensure photos are available'
  }
};

/**
 * Get widget configuration by key
 */
export const getWidgetConfig = (widgetKey: string): WidgetConfig | undefined => {
  return WIDGET_CONFIGS[widgetKey];
};

/**
 * Get all widget configurations
 */
export const getAllWidgetConfigs = (): Record<string, WidgetConfig> => {
  return WIDGET_CONFIGS;
};
