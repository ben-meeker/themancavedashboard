import { useEffect, useState } from 'react'
import './App.css'
import DateTime from './components/DateTime'
import TeslaCharge from './components/TeslaCharge'
import Calendar from './components/Calendar'
import UpcomingMeals from './components/UpcomingMeals'
import PlantWaterLevels from './components/PlantWaterLevels'
import Weather from './components/Weather'
import PhotoCarousel from './components/PhotoCarousel'
import AuthPrompt from './components/AuthPrompt'

function App() {
  const [isNightMode, setIsNightMode] = useState(false);

  // Check if current time is between 10 PM and 7 AM
  const checkNightMode = () => {
    const now = new Date();
    const hour = now.getHours();
    // Night mode is from 22:00 (10 PM) to 07:00 (7 AM)
    return hour >= 22 || hour < 7;
  };

  // Update night mode status
  useEffect(() => {
    // Set initial state
    setIsNightMode(checkNightMode());

    // Check every minute if we should switch modes
    const nightModeInterval = setInterval(() => {
      setIsNightMode(checkNightMode());
    }, 60 * 1000); // Check every minute

    return () => clearInterval(nightModeInterval);
  }, []);

  // Auto-refresh page every 5 minutes to get latest data
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      window.location.reload();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(refreshInterval);
  }, []);

  return (
    <div className={`dashboard ${isNightMode ? 'night-mode' : ''}`}>
      <AuthPrompt />
      <DateTime />
      <div className="dashboard-grid">
        <div className="card tesla-card">
          <div className="card-header">
            <span className="card-icon">🚗</span>
            <h2 className="card-title">3LEKTRA</h2>
          </div>
          <div className="card-content">
            <TeslaCharge />
          </div>
        </div>

        <div className="card calendar-card">
          <div className="card-header">
            <span className="card-icon">📅</span>
            <h2 className="card-title">Calendar</h2>
          </div>
          <div className="card-content">
            <Calendar />
          </div>
        </div>

        <div className="card weather-card">
          <div className="card-header">
            <span className="card-icon">🌤️</span>
            <h2 className="card-title">Weather</h2>
          </div>
          <div className="card-content">
            <Weather />
          </div>
        </div>

        <div className="card plants-card">
          <div className="card-header">
            <span className="card-icon">🌱</span>
            <h2 className="card-title">Plant Care</h2>
          </div>
          <div className="card-content">
            <PlantWaterLevels />
          </div>
        </div>

        <div className="card meals-card">
          <div className="card-header">
            <span className="card-icon">🍽️</span>
            <h2 className="card-title">Meal Calendar</h2>
          </div>
          <div className="card-content">
            <UpcomingMeals />
          </div>
        </div>

        <div className="card photos-card">
          <div className="card-content">
            <PhotoCarousel />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
