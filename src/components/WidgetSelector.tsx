import React, { useState } from 'react';
import './WidgetSelector.css';
import { getAvailableWidgets, type WidgetMetadata } from '../config/widgetRegistry';

interface WidgetSelectorProps {
  onSelectWidget: (widgetId: string) => void;
}

const WidgetSelector: React.FC<WidgetSelectorProps> = ({ onSelectWidget }) => {
  const [isOpen, setIsOpen] = useState(false);
  const widgets = getAvailableWidgets();

  // Group widgets by category
  const widgetsByCategory = widgets.reduce((acc, widget) => {
    if (!acc[widget.category]) {
      acc[widget.category] = [];
    }
    acc[widget.category].push(widget);
    return acc;
  }, {} as Record<string, WidgetMetadata[]>);

  const handleSelectWidget = (widgetId: string) => {
    onSelectWidget(widgetId);
    setIsOpen(false);
  };

  return (
    <div className="widget-selector">
      <button 
        className="selector-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="selector-icon">➕</span>
        <span className="selector-text">Add Widget</span>
      </button>

      {isOpen && (
        <div className="selector-dropdown">
          <div className="dropdown-header">
            <h3>Select Widget</h3>
            <button className="close-button" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="dropdown-content">
            {Object.entries(widgetsByCategory).map(([category, categoryWidgets]) => (
              <div key={category} className="widget-category">
                <div className="category-header">{category}</div>
                <div className="widget-list">
                  {categoryWidgets.map(widget => (
                    <button
                      key={widget.id}
                      className="widget-option"
                      onClick={() => handleSelectWidget(widget.id)}
                    >
                      <span className="widget-option-icon">{widget.icon}</span>
                      <div className="widget-option-info">
                        <div className="widget-option-name">{widget.name}</div>
                        <div className="widget-option-description">{widget.description}</div>
                        <div className="widget-option-size">
                          {widget.defaultSize.width}×{widget.defaultSize.height} grid units
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WidgetSelector;

