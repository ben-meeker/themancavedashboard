import React, { useEffect, useState } from 'react';
import './GridBackground.css';

interface GridBackgroundProps {
  columns: number;
  rows: number;
  visible: boolean;
}

const GridBackground: React.FC<GridBackgroundProps> = ({ columns, rows, visible }) => {
  const [dots, setDots] = useState<Array<{ x: number; y: number }>>([]);

  useEffect(() => {
    if (!visible) return;

    const updateDots = () => {
      const gridElement = document.querySelector('.dashboard-grid-editable') as HTMLElement;
      if (!gridElement) {
        setTimeout(updateDots, 100);
        return;
      }

      const gridStyle = window.getComputedStyle(gridElement);
      
      // Get the computed grid template columns/rows to find actual track sizes
      const columnTracks = gridStyle.gridTemplateColumns.split(' ');
      const rowTracks = gridStyle.gridTemplateRows.split(' ');
      const gap = parseFloat(gridStyle.gap || gridStyle.columnGap || '0px');

      // Calculate cumulative positions for each column (relative to grid, starting at 0)
      const columnPositions: number[] = [0];
      for (let i = 0; i < columns; i++) {
        const trackSize = parseFloat(columnTracks[i] || '0');
        const prevPosition = columnPositions[columnPositions.length - 1];
        columnPositions.push(prevPosition + trackSize + gap);
      }

      // Calculate cumulative positions for each row (relative to grid, starting at 0)
      const rowPositions: number[] = [0];
      for (let i = 0; i < rows; i++) {
        const trackSize = parseFloat(rowTracks[i] || '0');
        const prevPosition = rowPositions[rowPositions.length - 1];
        rowPositions.push(prevPosition + trackSize + gap);
      }

      // Generate dots at intersections (coordinates relative to grid, not page)
      const newDots: Array<{ x: number; y: number }> = [];
      for (let row = 0; row <= rows; row++) {
        for (let col = 0; col <= columns; col++) {
          const x = columnPositions[col];
          const y = rowPositions[row];
          if (x !== undefined && y !== undefined) {
            newDots.push({ x, y });
          }
        }
      }
      
      setDots(newDots);
    };

    updateDots();
    const resizeObserver = new ResizeObserver(updateDots);
    const gridElement = document.querySelector('.dashboard-grid-editable');
    if (gridElement) {
      resizeObserver.observe(gridElement);
    }

    return () => resizeObserver.disconnect();
  }, [columns, rows, visible]);

  if (!visible) return null;

  // Add padding to ensure dots at edges are fully visible
  const dotRadius = 3;
  const padding = dotRadius + 2; // Enough padding for dot radius + stroke

  return (
    <div className="grid-background">
      <svg 
        className="grid-svg" 
        xmlns="http://www.w3.org/2000/svg"
        style={{
          display: 'block',
          overflow: 'visible',
          padding: `${padding}px`
        }}
      >
        {/* Render all calculated grid dots - offset by padding so (0,0) dot is visible */}
        {dots.map((dot, i) => (
          <circle
            key={i}
            cx={dot.x + padding}
            cy={dot.y + padding}
            r={dotRadius}
            fill="rgba(96, 165, 250, 0.6)"
          />
        ))}
      </svg>
    </div>
  );
};

export default GridBackground;

