import type { WidgetMetadata } from '../../types/widget.ts';
import TemplateWidget from './TemplateWidget.tsx';

export const widgetConfig: WidgetMetadata = {
  id: 'template',
  name: 'Template Widget',
  description: 'A template for creating new widgets',
  icon: '📝',
  defaultSize: {
    width: 2,
    height: 2
  },
  component: TemplateWidget,
  requiredConfig: [
    {
      key: 'example_setting',
      label: 'Example Setting',
      description: 'An example configuration value'
    }
  ],
  requiredEnv: []
};

// Auto-register widget
if (typeof window !== 'undefined') {
  window.__DASHBOARD_WIDGETS__ = window.__DASHBOARD_WIDGETS__ || [];
  window.__DASHBOARD_WIDGETS__.push(widgetConfig);
}

