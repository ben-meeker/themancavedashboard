import React, { useState, useEffect } from 'react';
import './PlantSensors.css';
import { 
  fetchEcowittData, 
  getMoistureStatus,
  type SoilMoistureSensor,
  type IndoorSensor
} from './ecowittApi';
import ConfigurableWidget from '../../components/ConfigurableWidget';
import { getWidgetMetadata, widgetMetadataToLegacyConfig } from '../../config/widgetRegistryHelper';

const PlantSensors: React.FC = () => {
  const [sensors, setSensors] = useState<SoilMoistureSensor[]>([]);
  const [indoor, setIndoor] = useState<IndoorSensor | null>(null);
  const [loading, setLoading] = useState(true);

  // Get widget configuration
  const metadata = getWidgetMetadata('plants');
  const config = metadata ? widgetMetadataToLegacyConfig(metadata) : null;

  // Check if plant sensors are configured by attempting to fetch data
  const checkPlantsConfig = async (): Promise<boolean> => {
    try {
      const data = await fetchEcowittData();
      return data !== null && data.sensors && data.sensors.length > 0;
    } catch (error) {
      console.error('Error checking plant sensors configuration:', error);
      return false;
    }
  };

  // Load sensor data
  const loadSensorData = async () => {
    setLoading(true);
    try {
      const data = await fetchEcowittData();
      setSensors(data.sensors);
      if (data.indoor) {
        setIndoor(data.indoor);
      }
    } catch (error) {
      console.error('Error loading sensor data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load sensor data when component mounts
  useEffect(() => {
    loadSensorData();
  }, []);

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

  const getMoistureStatusClass = (moisture: number) => {
    if (moisture >= 40 && moisture <= 80) return 'good';
    if (moisture >= 20 && moisture < 40) return 'medium';
    if (moisture >= 10 && moisture < 20) return 'low';
    return 'critical';
  };

  if (!config) {
    return <div>Widget configuration not found</div>;
  }

  return (    <ConfigurableWidget
      config={config}
      checkConfig={checkPlantsConfig}
      className="plants"
    >
      <div className="card-header">
        <span className="card-icon">🌱</span>
        <h2 className="card-title">Plant Care</h2>
      </div>
      <div className="card-content">
        <div className="plants-wrapper">
        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <span>Loading plant sensors...</span>
          </div>
        ) : sensors.length > 0 ? (
          <>
            {indoor && (
              <div className="indoor-section">
                <div className="indoor-label">INDOOR</div>
                <div className="indoor-stats">
                  <div className="indoor-stat">
                    <div className="indoor-stat-label">TEMP</div>
                    <div className="indoor-value">{indoor.temperature}°F</div>
                  </div>
                  <div className="indoor-stat">
                    <div className="indoor-stat-label">HUMIDITY</div>
                    <div className="indoor-value">{indoor.humidity}%</div>
                  </div>
                  <div className="indoor-stat">
                    <div className="indoor-stat-label">PRESSURE</div>
                    <div className="indoor-value">{indoor.pressure} hPa</div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="plants-list">
              {sensors.map((sensor, index) => (
                <div key={index} className="plant-sensor">
                  <div className="sensor-header">
                    <div className="sensor-name">{sensor.name}</div>
                    <div className="sensor-location">{sensor.location}</div>
                  </div>
                  
                  <div className="sensor-data">
                    <div className="moisture-info">
                      <span className="moisture-text">{sensor.moisture}%</span>
                      <span className="ideal-range-text">Ideal: {sensor.min_moisture}%-{sensor.max_moisture}%</span>
                    </div>
                    
                    <div className="moisture-bar-container">
                      <div 
                        className={`moisture-bar ${getMoistureStatusClass(sensor.moisture)}`}
                        style={{ width: `${sensor.moisture}%` }}
                      ></div>
                      <div 
                        className="ideal-range"
                        style={{ 
                          left: `${sensor.min_moisture}%`,
                          width: `${sensor.max_moisture - sensor.min_moisture}%`
                        }}
                      ></div>
                    </div>
                    
                    <div className="sensor-status">
                      <div className="status-indicator">
                        <div 
                          className="status-dot"
                          style={{ backgroundColor: getMoistureColor(sensor.moisture) }}
                        ></div>
                        <span>{getMoistureLabel(sensor.moisture)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="loading">
            <span>No plant sensors found</span>
          </div>
        )}
        </div>
      </div>
    </ConfigurableWidget>
  );
};

export default PlantSensors;
