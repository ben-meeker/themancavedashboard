import React, { useState, useEffect } from 'react';
import './UpcomingMeals.css';
import { fetchMealCalendarEvents } from '../services/googleCalendarApi';

interface Meal {
  day: string;
  name: string;
  time: string;
}

const UpcomingMeals: React.FC = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if calendar is configured
  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      const response = await fetch('/api/setup/meals/status');
      const data = await response.json();
      setIsConnected(data.configured);
      
      if (data.configured) {
        loadMeals();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking meals configuration:', error);
      setLoading(false);
    }
  };

  const loadMeals = async () => {
    setLoading(true);
    console.log('[UpcomingMeals] Fetching meal events...');
    const events = await fetchMealCalendarEvents();
    console.log('[UpcomingMeals] Received events:', events);
    
    // Convert events to meals with relative day labels
    const processedMeals = events.map(event => {
      // Parse the UTC date and extract just the date part (YYYY-MM-DD)
      const mealDateStr = event.start.split('T')[0]; // "2025-10-14"
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0]; // "2025-10-14"
      
      // Calculate difference in days using date strings
      const mealDate = new Date(mealDateStr + 'T00:00:00');
      const todayDate = new Date(todayStr + 'T00:00:00');
      const diffDays = Math.floor((mealDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
      
      
      let dayLabel: string;
      if (diffDays === 0) {
        dayLabel = 'Today';
      } else if (diffDays === 1) {
        dayLabel = 'Tomorrow';
      } else if (diffDays < 7) {
        dayLabel = mealDate.toLocaleDateString('en-US', { weekday: 'long' });
      } else {
        dayLabel = mealDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      
      const timeLabel = mealDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      return {
        day: dayLabel,
        name: event.title,
        time: timeLabel,
      };
    });
    
    console.log('[UpcomingMeals] Processed meals:', processedMeals);
    setMeals(processedMeals);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="upcoming-meals">
        <div className="meals-list">
          <div className="meal-item">
            <div className="meal-info">
              <div className="meal-name">Loading...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="upcoming-meals">
      <div className={`meals-wrapper ${!isConnected ? 'disconnected' : ''}`}>
        <div className="meals-list">
          {meals.map((meal, index) => (
            <div key={index} className="meal-item">
              <div className="meal-day-indicator">
                <div className="day-dot"></div>
                <span className="meal-day">{meal.day}</span>
              </div>
              <div className="meal-info">
                <div className="meal-name">{meal.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {!isConnected && (
        <div className="connection-overlay">
          <div className="overlay-icon">🍽️</div>
          <div className="overlay-message">Meal Calendar Not Connected</div>
          <div className="overlay-hint">Add VITE_MEAL_ICAL_URL to .env</div>
        </div>
      )}
    </div>
  );
};

export default UpcomingMeals;

