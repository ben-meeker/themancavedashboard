/**
 * Dashboard Layout Types
 * Defines the structure for dashboard layouts and widget positioning
 */

export interface GridPosition {
  x: number;      // Grid column (0-based)
  y: number;      // Grid row (0-based)
  width: number;  // Number of columns
  height: number; // Number of rows
}

export interface WidgetInstance {
  id: string;           // Unique instance ID
  widgetId: string;     // Widget type from registry
  position: GridPosition;
  config?: Record<string, any>; // Widget-specific configuration
}

export interface DashboardLayout {
  version: string;
  gridColumns: number;
  gridRows: number;
  widgets: WidgetInstance[];
  lastModified: string;
  global?: Record<string, any>; // Global configuration from config.json
}

export interface DragState {
  isDragging: boolean;
  widgetId: string | null;
  startPosition: { x: number; y: number } | null;
  currentPosition: { x: number; y: number } | null;
}

