/**
 * Helper functions to access the widget registry
 * Replaces the old widgetConfigs.ts centralized configuration
 */

import type { WidgetMetadata } from '../types/widget';

/**
 * Get widget metadata from the global registry by widget ID
 */
export const getWidgetMetadata = (widgetId: string): WidgetMetadata | undefined => {
  if (typeof window === 'undefined' || !window.__DASHBOARD_WIDGETS__) {
    return undefined;
  }
  
  return window.__DASHBOARD_WIDGETS__.find(widget => widget.id === widgetId);
};

/**
 * Get all registered widgets
 */
export const getAllWidgets = (): WidgetMetadata[] => {
  if (typeof window === 'undefined' || !window.__DASHBOARD_WIDGETS__) {
    return [];
  }
  
  return window.__DASHBOARD_WIDGETS__;
};

/**
 * Convert widget metadata to the format expected by ConfigurableWidget
 */
export interface LegacyWidgetConfig {
  name: string;
  requiredParams: string[];
  icon: string;
  message: string;
  hint: string;
}

export const widgetMetadataToLegacyConfig = (metadata: WidgetMetadata): LegacyWidgetConfig => {
  // Combine requiredConfig and requiredEnv into a single array of param names
  const requiredParams = [
    ...metadata.requiredConfig.map(c => c.key),
    ...(metadata.requiredEnv || []).map(e => e.key)
  ];
  
  return {
    name: metadata.name,
    requiredParams,
    icon: metadata.icon,
    message: metadata.configMessage || `${metadata.name} Not Connected`,
    hint: metadata.configHint || 'Please configure this widget'
  };
};

