import type { WidgetMetadata } from '../../types/widget.ts';
import PhotoCarousel from './PhotoCarousel.tsx';

export const widgetConfig: WidgetMetadata = {
  id: 'photos',
  name: 'Photo Carousel',
  description: 'Rotating photo display',
  icon: '📸',
  defaultSize: {
    width: 1,
    height: 2
  },
  component: PhotoCarousel,
  requiredConfig: [
    {
      key: 'photo_rotation_seconds',
      label: 'Photo Rotation Interval',
      description: 'How many seconds between photo changes (default: 45)'
    }
  ],
  requiredEnv: []
};

// Auto-register widget
if (typeof window !== 'undefined') {
  window.__DASHBOARD_WIDGETS__ = window.__DASHBOARD_WIDGETS__ || [];
  window.__DASHBOARD_WIDGETS__.push(widgetConfig);
}

