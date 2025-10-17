import type { ComponentType } from 'react';

export interface WidgetSize {
  width: number;
  height: number;
}

export interface ConfigRequirement {
  key: string;
  label: string;
  description: string;
}

export interface WidgetMetadata {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultSize: WidgetSize;
  component: ComponentType;
  requiredConfig: ConfigRequirement[];
  requiredEnv?: ConfigRequirement[];
}

// Global widget registry
declare global {
  interface Window {
    __DASHBOARD_WIDGETS__?: WidgetMetadata[];
  }
}

