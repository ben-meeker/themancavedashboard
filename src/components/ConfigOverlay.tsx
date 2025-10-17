import React from 'react';
import './ConfigOverlay.css';

export interface ConfigOverlayProps {
  config: {
    name: string;
    requiredParams: string[];
    icon: string;
    message: string;
    hint: string;
  };
  missingParams?: string[];
}

/**
 * Standardized configuration overlay for widgets
 * Shows when required parameters are missing
 */
const ConfigOverlay: React.FC<ConfigOverlayProps> = ({
  config,
  missingParams = []
}) => {
  const hasMissingParams = missingParams.length > 0;

  return (
    <div className="config-overlay">
      <div className="config-overlay-content">
        <div className="config-message">{config.message}</div>
        <div className="config-hint">{config.hint}</div>
        
        {hasMissingParams && (
          <div className="config-missing-params">
            <div className="missing-params-title">Missing Configuration:</div>
            <div className="missing-params-list">
              {missingParams.map((param, index) => (
                <div key={index} className="missing-param">
                  <span className="missing-param-dot"></span>
                  <code className="missing-param-name">{param}</code>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigOverlay;
