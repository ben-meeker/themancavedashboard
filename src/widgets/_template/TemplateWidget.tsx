import React, { useState, useEffect } from 'react';
import './TemplateWidget.css';

interface TemplateData {
  message: string;
  timestamp: string;
}

const TemplateWidget: React.FC = () => {
  const [data, setData] = useState<TemplateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate fetching data
    const fetchData = async () => {
      try {
        setLoading(true);
        // In a real widget, you'd fetch from an API:
        // const response = await fetch('/api/template');
        // const result = await response.json();
        
        // For template, just use mock data
        const result: TemplateData = {
          message: `Template Widget Example`,
          timestamp: new Date().toLocaleTimeString()
        };
        
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh data every minute
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="template-widget widget-card">
        <div className="widget-loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="template-widget widget-card">
        <div className="widget-error">Error: {error}</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="template-widget widget-card">
      <div className="widget-header">
        <span className="widget-icon">📝</span>
        <h3>Template Widget</h3>
      </div>
      <div className="widget-content">
        <p className="widget-message">{data.message}</p>
        <p className="widget-timestamp">Updated: {data.timestamp}</p>
      </div>
    </div>
  );
};

export default TemplateWidget;

