import React, { useState, useEffect } from 'react';
import './Tesla.css';
import { fetchTeslaStatus } from './tessieApi';
import ConfigurableWidget from '../../components/ConfigurableWidget';
import { getWidgetMetadata, widgetMetadataToLegacyConfig } from '../../config/widgetRegistryHelper';
import { loadLayout } from '../../services/layoutApi';

const Tesla: React.FC = () => {
  const [chargeLevel, setChargeLevel] = useState(78);
  const [isCharging, setIsCharging] = useState(true);
  const [loading, setLoading] = useState(true);
  const [teslaName, setTeslaName] = useState<string | undefined>();

  // Get widget configuration from registry
  const metadata = getWidgetMetadata('tesla');
  const config = metadata ? widgetMetadataToLegacyConfig(metadata) : null;

  // Check if Tesla is configured by attempting to fetch data
  const checkTeslaConfig = async (): Promise<boolean> => {
    try {
      const status = await fetchTeslaStatus();
      return status !== null;
    } catch (error) {
      console.error('Error checking Tesla configuration:', error);
      return false;
    }
  };

  // Load Tesla status
  const loadTeslaStatus = async () => {
    setLoading(true);
    try {
      const status = await fetchTeslaStatus();
      setChargeLevel(status.chargeLevel);
      setIsCharging(status.isCharging);
    } catch (error) {
      console.error('Error loading Tesla status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load widget config from layout API
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const layout = await loadLayout();
        const teslaWidget = layout.widgets.find(w => w.widgetId === 'tesla');
        if (teslaWidget?.config) {
          setTeslaName(teslaWidget.config.tesla_name as string);
        }
      } catch (error) {
        console.error('Error loading Tesla config:', error);
      }
    };
    loadConfig();
  }, []);

  // Load Tesla status when component mounts
  useEffect(() => {
    loadTeslaStatus();
  }, []);

  if (!config) {
    return <div>Widget configuration not found</div>;
  }

  return (
    <ConfigurableWidget
      config={config}
      checkConfig={checkTeslaConfig}
      className="tesla"
    >
      <div>
        <div className="card-header">
          <span className="card-icon">🚗</span>
          <h2 className="card-title">Tesla</h2>
        </div>
        <div className="card-content">
          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <span>Loading...</span>
            </div>
          ) : (
            <div className="tesla-charge">
              {teslaName && (
                <div className="tesla-name">{teslaName}</div>
              )}
              <div className="charge-display">
                <div className="percentage-row">
                  <span className={`charge-percentage ${isCharging ? 'charging' : chargeLevel >= 50 ? 'high' : chargeLevel >= 20 ? 'medium' : 'low'}`}>
                    {chargeLevel}%
                  </span>
                  {isCharging && <span className="charging-icon">⚡</span>}
                </div>
                <div className="charge-bar">
                  <div 
                    className={`charge-fill ${isCharging ? 'charging' : chargeLevel >= 50 ? 'high' : chargeLevel >= 20 ? 'medium' : 'low'}`}
                    style={{ width: `${chargeLevel}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ConfigurableWidget>
  );
};

export default Tesla;
