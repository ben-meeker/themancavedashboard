import type { WidgetMetadata } from '../../types/widget.ts';
import PlantSensors from './PlantSensors.tsx';

export const widgetConfig: WidgetMetadata = {
  id: 'plants',
  name: 'Plant Sensors',
  description: 'Soil moisture levels for plants',
  icon: '🌱',
  defaultSize: {
    width: 1,
    height: 2
  },
  component: PlantSensors,
  requiredConfig: [],
  requiredEnv: [
    {
      key: 'ECOWITT_API_KEY',
      label: 'Ecowitt API Key',
      description: 'Your Ecowitt API key'
    },
    {
      key: 'ECOWITT_APPLICATION_KEY',
      label: 'Ecowitt Application Key',
      description: 'Your Ecowitt application key'
    },
    {
      key: 'ECOWITT_GATEWAY_MAC',
      label: 'Gateway MAC Address',
      description: 'Your Ecowitt gateway MAC address'
    }
  ]
};

// Auto-register widget
if (typeof window !== 'undefined') {
  window.__DASHBOARD_WIDGETS__ = window.__DASHBOARD_WIDGETS__ || [];
  window.__DASHBOARD_WIDGETS__.push(widgetConfig);
}

