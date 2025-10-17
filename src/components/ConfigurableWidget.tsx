import React from 'react';
import { useWidgetConfig, type WidgetConfig } from '../hooks/useWidgetConfig';
import ConfigOverlay from './ConfigOverlay';
import './ConfigurableWidget.css';

export interface ConfigurableWidgetProps {
  config: WidgetConfig;
  checkConfig: () => Promise<boolean>;
  children: React.ReactNode;
  className?: string;
}

/**
 * Higher-order component that wraps widgets with configuration checking
 * Automatically shows configuration overlay when required parameters are missing
 */
const ConfigurableWidget: React.FC<ConfigurableWidgetProps> = ({
  config,
  checkConfig,
  children,
  className = ''
}) => {
  const { isConfigured, missingParams, config: widgetConfig } = useWidgetConfig(config, checkConfig);

  return (
    <div className={`configurable-widget ${className}`}>
      <div className={`widget-content ${!isConfigured ? 'disconnected' : ''}`}>
        {children}
      </div>
      
      {!isConfigured && widgetConfig && (
        <ConfigOverlay
          config={widgetConfig}
          missingParams={missingParams}
        />
      )}
    </div>
  );
};

export default ConfigurableWidget;
