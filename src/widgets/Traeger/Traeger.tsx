import React, { useEffect, useState, useRef } from 'react';
import { loadLayout } from '../../services/layoutApi';
import ConfigurableWidget from '../../components/ConfigurableWidget';
import { getWidgetMetadata, widgetMetadataToLegacyConfig } from '../../config/widgetRegistryHelper';
import './Traeger.css';

interface ProbeData {
  name: string;
  connected: number;
  get_temp: number;
  set_temp: number;
}

interface GrillStatus {
  grill_temp: number;
  set_temp: number;
  pellet_level: number;
  connected: boolean;
  system_status: number;
  probes: ProbeData[];
}

interface HistoryPoint {
  timestamp: number;
  grill_temp: number;
  set_temp: number;
  pellet_level: number;
  probes?: Array<{ get_temp: number; set_temp: number }>;
}

const Traeger: React.FC = () => {
  const [grillName, setGrillName] = useState<string | undefined>();
  const [status, setStatus] = useState<GrillStatus | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Get widget configuration from registry
  const metadata = getWidgetMetadata('traeger');
  const config = metadata ? widgetMetadataToLegacyConfig(metadata) : null;

  // Check if Traeger is configured by attempting to fetch data
  const checkTraegerConfig = async (): Promise<boolean> => {
    if (!grillName) return false;
    try {
      const statusRes = await fetch(`/api/traeger?grill_name=${encodeURIComponent(grillName)}`);
      return statusRes.ok;
    } catch (error) {
      console.error('Error checking Traeger configuration:', error);
      return false;
    }
  };

  // Load widget config from layout API
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const layout = await loadLayout();
        const traegerWidget = layout.widgets.find(w => w.widgetId === 'traeger');
        if (traegerWidget?.config) {
          setGrillName(traegerWidget.config.grill_name as string);
        }
      } catch (error) {
        console.error('Error loading Traeger config:', error);
      }
    };
    loadConfig();
  }, []);

  // Load Traeger status
  const loadTraegerStatus = async () => {
    if (!grillName) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Fetch current status
      const statusRes = await fetch(`/api/traeger?grill_name=${encodeURIComponent(grillName)}`);
      if (statusRes.ok) {
        const data = await statusRes.json();
        setStatus(data);
      } else {
        console.error('Failed to fetch grill status:', await statusRes.text());
        setStatus(null);
      }

      // Fetch temperature history (last hour)
      const historyRes = await fetch(`/api/traeger/history?grill_name=${encodeURIComponent(grillName)}&duration=3600`);
      if (historyRes.ok) {
        const data = await historyRes.json();
        const realHistory = data.history || [];
        
        // TEMPORARY: Generate mock data points for visualization
        if (realHistory.length > 0) {
          const mockHistory: HistoryPoint[] = [];
          const now = Date.now() / 1000;
          const startTime = now - 1800; // 30 minutes ago
          
          // Generate 30 data points over 30 minutes
          for (let i = 0; i < 30; i++) {
            const timestamp = startTime + (i * 60); // Every minute
            const progress = i / 30;
            
            // Simulate grill heating up and stabilizing
            const grillTemp = 100 + (progress * 150) + (Math.random() * 10 - 5);
            const setTemp = 250;
            
            // Simulate probe 1 heating up slower
            const probe1Temp = 50 + (progress * 130) + (Math.random() * 8 - 4);
            
            // Simulate probe 2 staying cool then heating
            const probe2Temp = 35 + (progress > 0.5 ? (progress - 0.5) * 200 : 0) + (Math.random() * 5 - 2.5);
            
            mockHistory.push({
              timestamp,
              grill_temp: Math.max(100, Math.min(260, grillTemp)),
              set_temp: setTemp,
              pellet_level: 100 - (i * 2), // Pellets decreasing
              probes: [
                {
                  get_temp: Math.max(50, Math.min(180, probe1Temp)),
                  set_temp: 170
                },
                {
                  get_temp: Math.max(35, Math.min(150, probe2Temp)),
                  set_temp: 170
                }
              ]
            });
          }
          
          setHistory(mockHistory);
        } else {
          setHistory(realHistory);
        }
      }
    } catch (err) {
      console.error('Error fetching grill data:', err);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  // Load status when grill name is available
  useEffect(() => {
    loadTraegerStatus();
    
    if (!grillName) return;

    const interval = setInterval(loadTraegerStatus, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [grillName]);

  // Draw temperature graph
  useEffect(() => {
    if (!canvasRef.current || history.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Find min/max temps for scaling (include probe temps)
    const allTemps = history.flatMap(h => {
      const temps = [h.grill_temp, h.set_temp];
      if (h.probes) {
        h.probes.forEach(p => {
          temps.push(p.get_temp);
          temps.push(p.set_temp);
        });
      }
      return temps;
    });
    const minTemp = Math.floor(Math.min(...allTemps) / 10) * 10;
    const maxTemp = Math.ceil(Math.max(...allTemps) / 10) * 10;
    const tempRange = maxTemp - minTemp;

    // Helper to convert temp to Y coordinate
    const tempToY = (temp: number) => {
      return height - ((temp - minTemp) / tempRange) * height;
    };

    // Helper to convert timestamp to X coordinate
    const timeToX = (timestamp: number) => {
      if (history.length === 1) {
        // If only one point, center it
        return width / 2;
      }
      const firstTime = history[0].timestamp;
      const lastTime = history[history.length - 1].timestamp;
      const timeRange = lastTime - firstTime;
      return ((timestamp - firstTime) / timeRange) * width;
    };

    // Draw set temp line (subtle dotted line)
    ctx.strokeStyle = 'rgba(136, 136, 136, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    history.forEach((point, i) => {
      const x = timeToX(point.timestamp);
      const y = tempToY(point.set_temp);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw grill temp line (subtle solid line)
    ctx.strokeStyle = 'rgba(255, 107, 53, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    history.forEach((point, i) => {
      const x = timeToX(point.timestamp);
      const y = tempToY(point.grill_temp);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw probe temp lines (primary/prominent lines)
    const probeColors = ['#4ecdc4', '#f38181']; // Teal and coral for probes
    
    // Check how many probes we have across all history points
    const maxProbes = Math.max(...history.map(h => (h.probes?.length || 0)));
    
    for (let probeIdx = 0; probeIdx < maxProbes; probeIdx++) {
      const probeColor = probeColors[probeIdx] || '#ffffff';
      ctx.strokeStyle = probeColor;
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      
      ctx.beginPath();
      let started = false;
      history.forEach((point) => {
        if (point.probes && point.probes[probeIdx]) {
          const x = timeToX(point.timestamp);
          const y = tempToY(point.probes[probeIdx].get_temp);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      if (started) {
        ctx.stroke();
      }
      
      // Draw small dots for probe temps (only visible when few points)
      if (history.length < 5) {
        ctx.fillStyle = probeColor;
        history.forEach((point) => {
          if (point.probes && point.probes[probeIdx]) {
            const x = timeToX(point.timestamp);
            const y = tempToY(point.probes[probeIdx].get_temp);
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }
    }
    
    // Draw small dots for grill temp (only visible when few points)
    if (history.length < 5) {
      ctx.fillStyle = 'rgba(255, 107, 53, 0.8)';
      history.forEach((point) => {
        const x = timeToX(point.timestamp);
        const y = tempToY(point.grill_temp);
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Draw small dots for set temp
      ctx.fillStyle = 'rgba(136, 136, 136, 0.6)';
      history.forEach((point) => {
        const x = timeToX(point.timestamp);
        const y = tempToY(point.set_temp);
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }, [history]);

  if (!config) {
    return <div>Widget configuration not found</div>;
  }

  return (
    <ConfigurableWidget
      config={config}
      checkConfig={checkTraegerConfig}
      className="traeger"
    >
      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <span>Loading...</span>
        </div>
      ) : status ? (
        <>
          <div className="card-header">
            <span className="card-icon">🔥</span>
            <h2 className="card-title">{grillName}</h2>
          </div>
          <div className="card-content">
            <div className="traeger-temps">
              <div className="traeger-temp-main">
                <span className="traeger-temp-current">{Math.round(status.grill_temp)}°</span>
                <span className="traeger-temp-set">/ {Math.round(status.set_temp)}°</span>
              </div>

              {status.probes.filter(p => p.connected === 1).length > 0 && (
                <div className="traeger-probes">
                  {status.probes.filter(p => p.connected === 1).map((probe, idx) => {
                    const probeColors = ['#4ecdc4', '#f38181']; // Match graph colors
                    const probeColor = probeColors[idx] || '#ffffff';
                    return (
                      <div key={idx} className="traeger-probe">
                        <span className="traeger-probe-label">P{idx + 1}</span>
                        <span className="traeger-probe-temp" style={{ color: probeColor }}>
                          {Math.round(probe.get_temp)}°
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="traeger-pellets">
              <div className="traeger-pellet-bar">
                <div
                  className="traeger-pellet-fill"
                  style={{ width: `${status.pellet_level}%` }}
                />
              </div>
              <span className="traeger-pellet-label">{status.pellet_level}% Pellets</span>
            </div>

            <div className="traeger-graph">
              <canvas
                ref={canvasRef}
                width={180}
                height={50}
                className="traeger-canvas"
              />
            </div>
          </div>
        </>
      ) : (
        <div className="traeger-error">No data available</div>
      )}
    </ConfigurableWidget>
  );
};

export default Traeger;

