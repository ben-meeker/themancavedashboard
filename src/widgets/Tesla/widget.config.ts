import type { WidgetMetadata } from '../../types/widget.ts';
import Tesla from './Tesla.tsx';

export const widgetConfig: WidgetMetadata = {
  id: 'tesla',
  name: 'Tesla',
  description: 'Tesla vehicle status and charging info',
  icon: '🚗',
  defaultSize: {
    width: 1,
    height: 1
  },
  component: Tesla,
  requiredConfig: [
    {
      key: 'tesla_name',
      label: 'Tesla Name',
      description: 'The name of your Tesla vehicle'
    }
  ],
  requiredEnv: [
    {
      key: 'TESSIE_API_KEY',
      label: 'Tessie API Key',
      description: 'Get your API key from https://tessie.com'
    },
    {
      key: 'TESSIE_VIN',
      label: 'Tesla VIN',
      description: 'Your Tesla vehicle identification number'
    }
  ],
  configMessage: 'Tesla Not Connected',
  configHint: 'Add TESSIE_API_KEY and TESSIE_VIN to your .env configuration'
};

// Auto-register widget
if (typeof window !== 'undefined') {
  window.__DASHBOARD_WIDGETS__ = window.__DASHBOARD_WIDGETS__ || [];
  window.__DASHBOARD_WIDGETS__.push(widgetConfig);
}

