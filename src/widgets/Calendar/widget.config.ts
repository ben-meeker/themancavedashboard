import type { WidgetMetadata } from '../../types/widget.ts';
import Calendar from './Calendar.tsx';

export const widgetConfig: WidgetMetadata = {
  id: 'calendar',
  name: 'Calendar',
  description: 'Google Calendar with events and reminders',
  icon: '📅',
  defaultSize: {
    width: 4,
    height: 4
  },
  component: Calendar,
  requiredConfig: [
    {
      key: 'trash_day',
      label: 'Trash Day',
      description: 'Day of the week for trash pickup (e.g., "Wednesday")'
    },
    {
      key: 'reminders',
      label: 'Reminders',
      description: 'Array of reminder objects with name and date'
    }
  ],
  requiredEnv: []
};

// Auto-register widget
if (typeof window !== 'undefined') {
  window.__DASHBOARD_WIDGETS__ = window.__DASHBOARD_WIDGETS__ || [];
  window.__DASHBOARD_WIDGETS__.push(widgetConfig);
}

