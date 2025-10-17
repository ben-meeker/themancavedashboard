/**
 * Widget Registry
 * Auto-discovers widgets from their widget.config.ts files
 */

import React from 'react';
import type { WidgetMetadata as NewWidgetMetadata } from '../types/widget.ts';

export interface WidgetSize {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
}

export interface WidgetMetadata {
  id: string;
  name: string;
  icon: string;
  description: string;
  component: React.ComponentType;
  defaultSize: WidgetSize;
  category: 'home' | 'media' | 'productivity' | 'other';
}

// Import all widgets to trigger auto-registration
import '../widgets';

/**
 * Convert new widget format to legacy format for compatibility
 */
function convertToLegacyFormat(widget: NewWidgetMetadata): WidgetMetadata {
  return {
    id: widget.id,
    name: widget.name,
    icon: widget.icon,
    description: widget.description,
    component: widget.component,
    defaultSize: {
      width: widget.defaultSize.width,
      height: widget.defaultSize.height
    },
    category: 'other'
  };
}

/**
 * Get all registered widgets from global registry
 */
function getAllWidgets(): Record<string, WidgetMetadata> {
  const registry: Record<string, WidgetMetadata> = {};
  
  // Add auto-discovered widgets from global registry
  if (typeof window !== 'undefined' && window.__DASHBOARD_WIDGETS__) {
    window.__DASHBOARD_WIDGETS__.forEach(widget => {
      registry[widget.id] = convertToLegacyFormat(widget);
    });
  }
  
  return registry;
}

/**
 * Widget Registry (auto-discovered only)
 */
export const WIDGET_REGISTRY = getAllWidgets();

/**
 * Get all available widgets
 */
export const getAvailableWidgets = (): WidgetMetadata[] => {
  return Object.values(getAllWidgets());
};

/**
 * Get widget metadata by ID
 */
export const getWidgetMetadata = (widgetId: string): WidgetMetadata | undefined => {
  return getAllWidgets()[widgetId];
};

/**
 * Get widgets by category
 */
export const getWidgetsByCategory = (category: string): WidgetMetadata[] => {
  return Object.values(getAllWidgets()).filter(widget => widget.category === category);
};
