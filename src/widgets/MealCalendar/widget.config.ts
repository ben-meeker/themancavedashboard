import type { WidgetMetadata } from '../../types/widget.ts';
import MealCalendar from './MealCalendar.tsx';

export const widgetConfig: WidgetMetadata = {
  id: 'meals',
  name: 'Meal Calendar',
  description: 'Upcoming meal planning',
  icon: '🍽️',
  defaultSize: {
    width: 1,
    height: 1
  },
  component: MealCalendar,
  requiredConfig: [
    {
      key: 'calendar_url',
      label: 'Calendar URL',
      description: 'The URL of your calendar'
    }
  ],
  requiredEnv: [],
  configMessage: 'Meal Calendar Not Connected',
  configHint: 'Add calendar_url to your widget configuration'
};

// Auto-register widget
if (typeof window !== 'undefined') {
  window.__DASHBOARD_WIDGETS__ = window.__DASHBOARD_WIDGETS__ || [];
  window.__DASHBOARD_WIDGETS__.push(widgetConfig);
}

