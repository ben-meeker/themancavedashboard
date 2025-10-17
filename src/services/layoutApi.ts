/**
 * Dashboard Layout API
 * Service for loading and saving dashboard layouts
 */

import type { DashboardLayout } from '../types/dashboard';

const API_BASE = '/api';

/**
 * Load the current dashboard layout
 */
export async function loadLayout(): Promise<DashboardLayout> {
  try {
    const response = await fetch(`${API_BASE}/layout`);
    if (!response.ok) {
      throw new Error('Failed to load layout');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading layout:', error);
    // Return default layout if loading fails
    return {
      version: '1.0',
      gridColumns: 6,
      gridRows: 4,
      widgets: [],
      lastModified: new Date().toISOString()
    };
  }
}

/**
 * Save the dashboard layout
 */
export async function saveLayout(layout: DashboardLayout): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/layout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...layout,
        lastModified: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save layout');
    }

    console.log('Layout saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving layout:', error);
    return false;
  }
}

