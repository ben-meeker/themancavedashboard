import { useEffect, useState } from 'react';
import './App.css';
import DateTime from './components/DateTime';
import EditModeToggle from './components/EditModeToggle';
import WidgetSelector from './components/WidgetSelector';
import GridBackground from './components/GridBackground';
import DraggableWidget from './components/DraggableWidget';

import type { DashboardLayout, WidgetInstance, GridPosition } from './types/dashboard';
import { loadLayout, saveLayout } from './services/layoutApi';
import { getWidgetMetadata } from './config/widgetRegistry';

function App() {
  const [isNightMode, setIsNightMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [layout, setLayout] = useState<DashboardLayout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nightModeStart, setNightModeStart] = useState(22); // Default 10 PM
  const [nightModeEnd, setNightModeEnd] = useState(7); // Default 7 AM
  const [refreshIntervalMinutes, setRefreshIntervalMinutes] = useState(5); // Default 5 minutes

  // Load layout and global config on mount
  useEffect(() => {
    const fetchLayout = async () => {
      const loadedLayout = await loadLayout();
      setLayout(loadedLayout);
      
      // Extract global config settings
      if (loadedLayout.global) {
        const startTime = loadedLayout.global.night_mode_start as string;
        const endTime = loadedLayout.global.night_mode_end as string;
        const refreshMinutes = loadedLayout.global.refresh_interval_minutes as number;
        
        console.log('[App] Global config loaded:', loadedLayout.global);
        
        if (startTime) {
          const [hours] = startTime.split(':');
          const parsedStart = parseInt(hours, 10);
          console.log(`[App] Night mode start: ${startTime} -> ${parsedStart}`);
          setNightModeStart(parsedStart);
        }
        if (endTime) {
          const [hours] = endTime.split(':');
          const parsedEnd = parseInt(hours, 10);
          console.log(`[App] Night mode end: ${endTime} -> ${parsedEnd}`);
          setNightModeEnd(parsedEnd);
        }
        if (refreshMinutes) {
          console.log(`[App] Refresh interval: ${refreshMinutes} minutes`);
          setRefreshIntervalMinutes(refreshMinutes);
        }
      } else {
        console.log('[App] No global config found in layout');
      }
      
      setIsLoading(false);
    };
    fetchLayout();
  }, []);

  // Check if current time is within night mode hours
  const checkNightMode = () => {
    const now = new Date();
    const hour = now.getHours();
    return hour >= nightModeStart || hour < nightModeEnd;
  };

  // Update night mode status
  useEffect(() => {
    setIsNightMode(checkNightMode());
    const nightModeInterval = setInterval(() => {
      setIsNightMode(checkNightMode());
    }, 60 * 1000);
    return () => clearInterval(nightModeInterval);
  }, [nightModeStart, nightModeEnd]);

  // Auto-refresh page to get latest data and config
  useEffect(() => {
    if (isEditMode) return; // Don't auto-refresh in edit mode
    
    const refreshInterval = setInterval(() => {
      window.location.reload();
    }, refreshIntervalMinutes * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [isEditMode, refreshIntervalMinutes]);

  // Save layout when exiting edit mode
  const handleToggleEditMode = async () => {
    if (isEditMode && layout) {
      // Exiting edit mode - save layout
      await saveLayout(layout);
    }
    setIsEditMode(!isEditMode);
  };

  // Add widget to layout
  const handleAddWidget = (widgetId: string) => {
    console.log('Adding widget:', widgetId);
    
    if (!layout) {
      console.error('No layout available');
      return;
    }

    const metadata = getWidgetMetadata(widgetId);
    if (!metadata) {
      console.error('Widget metadata not found:', widgetId);
      return;
    }

    console.log('Widget metadata:', metadata);

    // Find available position
    const position = findAvailablePosition(
      layout,
      metadata.defaultSize.width,
      metadata.defaultSize.height
    );

    console.log('Found position:', position);

    if (!position) {
      alert('No space available for this widget');
      return;
    }

    const newWidget: WidgetInstance = {
      id: `${widgetId}-${Date.now()}`,
      widgetId: widgetId,
      position: {
        x: position.x,
        y: position.y,
        width: metadata.defaultSize.width,
        height: metadata.defaultSize.height
      }
    };

    console.log('Creating new widget instance:', newWidget);

    setLayout({
      ...layout,
      widgets: [...layout.widgets, newWidget]
    });

    console.log('Widget added successfully');
  };

  // Update widget position
  const handlePositionChange = (widgetId: string, position: GridPosition) => {
    if (!layout) return;

    // Check for collisions
    const widget = layout.widgets.find(w => w.id === widgetId);
    if (!widget) return;

    const hasCollision = layout.widgets.some(w => {
      if (w.id === widgetId) return false;
      return checkCollision(position, w.position);
    });

    if (hasCollision) {
      console.log('Collision detected, position not updated');
      return;
    }

    setLayout({
      ...layout,
      widgets: layout.widgets.map(w =>
        w.id === widgetId ? { ...w, position } : w
      )
    });
  };

  // Remove widget
  const handleRemoveWidget = (widgetId: string) => {
    if (!layout) return;

    setLayout({
      ...layout,
      widgets: layout.widgets.filter(w => w.id !== widgetId)
    });
  };

  // Find available position for new widget
  const findAvailablePosition = (
    layout: DashboardLayout,
    width: number,
    height: number
  ): { x: number; y: number } | null => {
    console.log('Finding position for widget size:', width, 'x', height);
    console.log('Grid size:', layout.gridColumns, 'x', layout.gridRows);
    console.log('Current widgets:', layout.widgets);
    
    for (let y = 0; y <= layout.gridRows - height; y++) {
      for (let x = 0; x <= layout.gridColumns - width; x++) {
        const position = { x, y, width, height };
        const hasCollision = (layout.widgets || []).some(w =>
          checkCollision(position, w.position)
        );
        console.log(`Checking position (${x}, ${y}): collision=${hasCollision}`);
        if (!hasCollision) {
          console.log(`Found available position: (${x}, ${y})`);
          return { x, y };
        }
      }
    }
    console.log('No available position found');
    return null;
  };

  // Check if two positions collide
  const checkCollision = (pos1: GridPosition, pos2: GridPosition): boolean => {
    return !(
      pos1.x + pos1.width <= pos2.x ||
      pos2.x + pos2.width <= pos1.x ||
      pos1.y + pos1.height <= pos2.y ||
      pos2.y + pos2.height <= pos1.y
    );
  };

  if (isLoading || !layout) {
    return (
      <div className="dashboard loading">
        <div className="loading-message">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className={`dashboard ${isNightMode ? 'night-mode' : ''} ${isEditMode ? 'edit-mode' : ''}`}>
      <DateTime />
      
      <EditModeToggle isEditMode={isEditMode} onToggle={handleToggleEditMode} />
      
      {isEditMode && (
        <>
          <WidgetSelector onSelectWidget={handleAddWidget} />
          <GridBackground
            columns={layout.gridColumns}
            rows={layout.gridRows}
            visible={true}
          />
        </>
      )}

      <div 
        className="dashboard-grid-editable"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${layout.gridColumns}, 1fr)`,
          gridTemplateRows: `repeat(${layout.gridRows}, 1fr)`,
          gap: 'var(--space-4)',
          padding: 'var(--space-6)',
          minHeight: 'calc(100vh - 200px)'
        }}
      >
        {layout.widgets.map(widget => {
          const metadata = getWidgetMetadata(widget.widgetId);
          if (!metadata) return null;

          const WidgetComponent = metadata.component;

          return (
            <DraggableWidget
              key={widget.id}
              widget={widget}
              isEditMode={isEditMode}
              gridColumns={layout.gridColumns}
              gridRows={layout.gridRows}
              onPositionChange={handlePositionChange}
              onRemove={handleRemoveWidget}
            >
              <WidgetComponent />
            </DraggableWidget>
          );
        })}
      </div>
    </div>
  );
}

export default App;

