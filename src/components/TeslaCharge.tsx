import React, { useState, useEffect } from 'react';
import './TeslaCharge.css';
import { fetchTeslaStatus } from '../services/tessieApi';
import SetupPrompt from './SetupPrompt';
import SetupModal from './SetupModal';

const TeslaCharge: React.FC = () => {
  const [chargeLevel, setChargeLevel] = useState(78);
  const [isCharging, setIsCharging] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      const response = await fetch('/api/setup/tesla/status');
      const data = await response.json();
      setIsConfigured(data.configured);
      
      if (data.configured) {
        loadTeslaStatus();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking Tesla configuration:', error);
      setLoading(false);
    }
  };

  const loadTeslaStatus = async () => {
    setLoading(true);
    const status = await fetchTeslaStatus();
    setChargeLevel(status.chargeLevel);
    setIsCharging(status.isCharging);
    setLoading(false);
  };

  const handleSetup = async (data: { [key: string]: string }) => {
    const response = await fetch('/api/setup/tesla', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: data.api_key,
        vin: data.vin,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save configuration');
    }

    setIsConfigured(true);
    loadTeslaStatus();
  };

  if (loading) {
    return (
      <div className="tesla-charge">
        <div className="charge-display">
          <div className="charge-percentage loading">...</div>
        </div>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <>
        <SetupPrompt
          icon="🚗"
          title="Tesla Not Configured"
          message="Configure your Tessie API credentials to see vehicle status"
          onSetup={() => setShowSetup(true)}
        />
        {showSetup && (
          <SetupModal
            title="Tesla / Tessie"
            icon="🚗"
            fields={[
              {
                name: 'api_key',
                label: 'Tessie API Key',
                type: 'text',
                placeholder: 'ts_xxxxxxxxxxxxxxxx',
                required: true,
              },
              {
                name: 'vin',
                label: 'Vehicle VIN',
                type: 'text',
                placeholder: '5YJ3E1EA...',
                required: true,
              },
            ]}
            onSubmit={handleSetup}
            onClose={() => setShowSetup(false)}
          />
        )}
      </>
    );
  }

  const getChargeColor = () => {
    if (isCharging) return 'charging';
    if (chargeLevel >= 70) return 'high';
    if (chargeLevel >= 40) return 'medium';
    return 'low';
  };

  return (
    <div className="tesla-charge">
      <div className="charge-display">
        <div className="percentage-row">
          <div className={`charge-percentage ${getChargeColor()}`}>
            {chargeLevel}%
          </div>
          {isCharging && <span className="charging-icon">⚡</span>}
        </div>
        <div className="charge-bar">
          <div 
            className={`charge-fill ${getChargeColor()}`}
            style={{ width: `${chargeLevel}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default TeslaCharge;

