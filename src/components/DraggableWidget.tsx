import React, { useRef, useState, useEffect } from 'react';
import './DraggableWidget.css';
import type { GridPosition, WidgetInstance } from '../types/dashboard';

interface DraggableWidgetProps {
  widget: WidgetInstance;
  isEditMode: boolean;
  gridColumns: number;
  gridRows: number;
  onPositionChange: (widgetId: string, position: GridPosition) => void;
  onRemove: (widgetId: string) => void;
  children: React.ReactNode;
}

const DraggableWidget: React.FC<DraggableWidgetProps> = ({
  widget,
  isEditMode,
  gridColumns,
  gridRows,
  onPositionChange,
  onRemove,
  children
}) => {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    
    // Don't start drag if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select, textarea, a')) {
      return;
    }

    e.preventDefault();
    setIsDragging(true);

    const rect = widgetRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!widgetRef.current) return;

      const dashboardGrid = widgetRef.current.parentElement;
      if (!dashboardGrid) return;

      const gridRect = dashboardGrid.getBoundingClientRect();
      const gridStyle = window.getComputedStyle(dashboardGrid);
      
      // Get actual computed grid track sizes
      const columnTracks = gridStyle.gridTemplateColumns.split(' ');
      const rowTracks = gridStyle.gridTemplateRows.split(' ');
      const gap = parseFloat(gridStyle.gap || '0px');

      // Widget top-left corner position relative to grid
      const widgetX = e.clientX - gridRect.left - dragOffset.x;
      const widgetY = e.clientY - gridRect.top - dragOffset.y;
      
      // Find which column the widget should snap to
      let x = 0;
      let cumulativeX = 0;
      for (let i = 0; i < gridColumns; i++) {
        const trackSize = parseFloat(columnTracks[i] || '0');
        if (widgetX < cumulativeX + trackSize / 2) {
          x = i;
          break;
        }
        cumulativeX += trackSize + gap;
        x = i + 1;
      }

      // Find which row the widget should snap to
      let y = 0;
      let cumulativeY = 0;
      for (let i = 0; i < gridRows; i++) {
        const trackSize = parseFloat(rowTracks[i] || '0');
        if (widgetY < cumulativeY + trackSize / 2) {
          y = i;
          break;
        }
        cumulativeY += trackSize + gap;
        y = i + 1;
      }

      // Constrain to grid boundaries
      x = Math.max(0, Math.min(x, gridColumns - widget.position.width));
      y = Math.max(0, Math.min(y, gridRows - widget.position.height));

      // Update visual position
      widgetRef.current.style.gridColumn = `${x + 1} / span ${widget.position.width}`;
      widgetRef.current.style.gridRow = `${y + 1} / span ${widget.position.height}`;
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!widgetRef.current) return;

      const dashboardGrid = widgetRef.current.parentElement;
      if (!dashboardGrid) return;

      const gridRect = dashboardGrid.getBoundingClientRect();
      const gridStyle = window.getComputedStyle(dashboardGrid);
      
      // Get actual computed grid track sizes
      const columnTracks = gridStyle.gridTemplateColumns.split(' ');
      const rowTracks = gridStyle.gridTemplateRows.split(' ');
      const gap = parseFloat(gridStyle.gap || '0px');

      // Widget top-left corner position relative to grid
      const widgetX = e.clientX - gridRect.left - dragOffset.x;
      const widgetY = e.clientY - gridRect.top - dragOffset.y;
      
      // Find which column the widget should snap to
      let x = 0;
      let cumulativeX = 0;
      for (let i = 0; i < gridColumns; i++) {
        const trackSize = parseFloat(columnTracks[i] || '0');
        if (widgetX < cumulativeX + trackSize / 2) {
          x = i;
          break;
        }
        cumulativeX += trackSize + gap;
        x = i + 1;
      }

      // Find which row the widget should snap to
      let y = 0;
      let cumulativeY = 0;
      for (let i = 0; i < gridRows; i++) {
        const trackSize = parseFloat(rowTracks[i] || '0');
        if (widgetY < cumulativeY + trackSize / 2) {
          y = i;
          break;
        }
        cumulativeY += trackSize + gap;
        y = i + 1;
      }

      // Constrain to grid boundaries
      x = Math.max(0, Math.min(x, gridColumns - widget.position.width));
      y = Math.max(0, Math.min(y, gridRows - widget.position.height));

      // Update position
      onPositionChange(widget.id, {
        x,
        y,
        width: widget.position.width,
        height: widget.position.height
      });

      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, gridColumns, gridRows, widget, onPositionChange]);

  const gridStyle = {
    gridColumn: `${widget.position.x + 1} / span ${widget.position.width}`,
    gridRow: `${widget.position.y + 1} / span ${widget.position.height}`
  };

  return (
    <div
      ref={widgetRef}
      className={`draggable-widget ${isEditMode ? 'edit-mode' : ''} ${isDragging ? 'dragging' : ''}`}
      style={gridStyle}
      onMouseDown={handleMouseDown}
    >
      {isEditMode && (
        <div className="widget-edit-controls">
          <div className="drag-handle">⋮⋮</div>
          <button
            className="remove-widget"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(widget.id);
            }}
            title="Remove widget"
          >
            ✕
          </button>
        </div>
      )}
      <div className={`widget-content ${isEditMode ? 'edit-mode-content' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default DraggableWidget;

