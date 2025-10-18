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
    },
    {
      key: 'google_credentials_filename',
      label: 'Google Credentials Filename (Optional)',
      description: 'Filename within CONFIG_DIR (default: credentials.json)'
    },
    {
      key: 'google_token_filename',
      label: 'Google Token Filename (Optional)',
      description: 'Filename within CONFIG_DIR (default: token.json)'
    }
  ],
  requiredEnv: [],
  configMessage: 'Google Calendar Not Connected',
  configHint: 'Add credentials.json and token.json to your CONFIG_DIR, and configure trash_day and reminders. Customize filenames in widget config with "google_credentials_filename" and "google_token_filename".'
};

// Auto-register widget
if (typeof window !== 'undefined') {
  window.__DASHBOARD_WIDGETS__ = window.__DASHBOARD_WIDGETS__ || [];
  window.__DASHBOARD_WIDGETS__.push(widgetConfig);
}

