import type { WidgetMetadata } from '../../types/widget.ts';
import Traeger from './Traeger.tsx';

export const widgetConfig: WidgetMetadata = {
  id: 'traeger',
  name: 'Traeger Grill',
  description: 'Monitor your Traeger grill temperature, probes, and pellet level',
  icon: '🔥',
  defaultSize: {
    width: 1,
    height: 1
  },
  component: Traeger,
  requiredConfig: [
    {
      key: 'grill_name',
      label: 'Grill Name',
      description: 'The friendly name of your Traeger grill (e.g., "The Grillfather")'
    }
  ],
  requiredEnv: [
    {
      key: 'TRAEGER_USERNAME',
      label: 'Traeger Username',
      description: 'Your Traeger app email address'
    },
    {
      key: 'TRAEGER_PASSWORD',
      label: 'Traeger Password',
      description: 'Your Traeger app password'
    }
  ],
  configMessage: 'Traeger Not Connected',
  configHint: 'Add TRAEGER_USERNAME and TRAEGER_PASSWORD to your .env, and grill_name to your widget config'
};

// Auto-register widget
if (typeof window !== 'undefined') {
  window.__DASHBOARD_WIDGETS__ = window.__DASHBOARD_WIDGETS__ || [];
  window.__DASHBOARD_WIDGETS__.push(widgetConfig);
}

