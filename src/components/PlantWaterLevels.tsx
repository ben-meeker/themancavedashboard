import React, { useState, useEffect } from 'react';
import './PlantWaterLevels.css';
import { 
  fetchEcowittData, 
  getMoistureStatus, 
  getBatteryStatus,
  type SoilMoistureSensor 
} from '../services/ecowittApi';

const PlantWaterLevels: React.FC = () => {
  const [sensors, setSensors] = useState<SoilMoistureSensor[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      const response = await fetch('/api/setup/ecowitt/status');
      const data = await response.json();
      setIsConnected(data.configured);
      
      if (data.configured) {
        loadSensorData();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking Ecowitt configuration:', error);
      setLoading(false);
    }
  };

  const loadSensorData = async () => {
    const data = await fetchEcowittData();
    setSensors(data.sensors);
    setLoading(false);
  };

  const getMoistureColor = (moisture: number) => {
    const status = getMoistureStatus(moisture);
    if (status === 'good') return '#10b981'; // Green
    if (status === 'medium') return '#3b82f6'; // Blue
    if (status === 'low') return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const getMoistureLabel = (moisture: number) => {
    const status = getMoistureStatus(moisture);
    if (status === 'good') return 'Good';
    if (status === 'medium') return 'Medium';
    if (status === 'low') return 'Low';
    return 'Critical';
  };

  if (loading) {
    return (
      <div className="plant-water-levels">
        <div className="loading-message">Loading sensor data...</div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="plant-water-levels">
        <div className="plants-wrapper blurred">
          <div className="plants-list">
            {sensors.map((sensor) => (
              <div key={sensor.channel} className="plant-item">
                <div className="plant-info">
                  <div className="plant-name">{sensor.name}</div>
                  <div className="plant-location">{sensor.location || 'Unknown'}</div>
                </div>
                <div className="plant-level">
                  <div className="level-bar">
                    <div
                      className="level-fill"
                      style={{
                        width: `${sensor.moisture}%`,
                        background: getMoistureColor(sensor.moisture),
                      }}
                    />
                  </div>
                  <span
                    className="level-status"
                    style={{ color: getMoistureColor(sensor.moisture) }}
                  >
                    {getMoistureLabel(sensor.moisture)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="coming-soon-overlay">
          <div className="overlay-icon">🌱</div>
          <div className="overlay-message">Ecowitt Not Connected</div>
          <div className="overlay-hint">Add API credentials to .env</div>
        </div>
      </div>
    );
  }

  return (
    <div className="plant-water-levels">
      <div className="plants-list">
        {sensors.map((sensor) => (
          <div key={sensor.channel} className="plant-item">
            <div className="plant-info">
              <div className="plant-header">
                <div className="plant-name">{sensor.name}</div>
                {getBatteryStatus(sensor.battery) === 'low' && (
                  <span className="battery-warning" title="Low battery">🔋</span>
                )}
              </div>
              {sensor.location && <div className="plant-location">{sensor.location}</div>}
              <div className="plant-ideal">Ideal: 30-40%</div>
            </div>
            <div className="plant-level">
              <div className="level-bar">
                <div
                  className="level-fill"
                  style={{
                    width: `${sensor.moisture}%`,
                    background: getMoistureColor(sensor.moisture),
                  }}
                />
              </div>
              <div className="level-info">
                <span className="level-percentage">{sensor.moisture}%</span>
                <span
                  className="level-status"
                  style={{ color: getMoistureColor(sensor.moisture) }}
                >
                  {getMoistureLabel(sensor.moisture)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlantWaterLevels;

