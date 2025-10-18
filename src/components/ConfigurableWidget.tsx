import React, { useState, useEffect } from 'react';
import ConfigOverlay from './ConfigOverlay';
import './ConfigurableWidget.css';

export interface WidgetConfig {
  name: string;
  requiredParams: string[];
  icon: string;
  message: string;
  hint: string;
}

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
  const [isConfigured, setIsConfigured] = useState(false);
  const [missingParams, setMissingParams] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkConfiguration = async () => {
      try {
        setIsLoading(true);
        const configured = await checkConfig();
        setIsConfigured(configured);
        
        if (!configured) {
          setMissingParams(config.requiredParams);
        } else {
          setMissingParams([]);
        }
      } catch (error) {
        console.error(`[${config.name}] Configuration check failed:`, error);
        setIsConfigured(false);
        setMissingParams(config.requiredParams);
      } finally {
        setIsLoading(false);
      }
    };

    checkConfiguration();
  }, [config, checkConfig]);

  return (
    <div className={`configurable-widget ${className}`}>
      <div className={`widget-content ${!isConfigured ? 'disconnected' : ''}`}>
        {children}
      </div>
      
      {!isConfigured && !isLoading && (
        <ConfigOverlay
          config={config}
          missingParams={missingParams}
        />
      )}
    </div>
  );
};

export default ConfigurableWidget;
