import React, { useState, useEffect } from 'react';
import './MealCalendar.css';
import { fetchMealCalendarEvents } from '../Calendar/googleCalendarApi';
import ConfigurableWidget from '../../components/ConfigurableWidget';
import { getWidgetMetadata, widgetMetadataToLegacyConfig } from '../../config/widgetRegistryHelper';

interface Meal {
  day: string;
  name: string;
}

const MealCalendar: React.FC = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarUrl, setCalendarUrl] = useState<string | undefined>();

  // Get widget configuration
  const metadata = getWidgetMetadata('meals');
  const config = metadata ? widgetMetadataToLegacyConfig(metadata) : null;

  // Load calendar URL from layout
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { loadLayout } = await import('../../services/layoutApi');
        const layout = await loadLayout();
        const mealsWidget = layout.widgets.find(w => w.widgetId === 'meals');
        if (mealsWidget?.config?.calendar_url) {
          setCalendarUrl(mealsWidget.config.calendar_url);
        }
      } catch (error) {
        console.error('Error loading meal calendar config:', error);
      }
    };
    loadConfig();
  }, []);

  // Check if meal calendar is configured
  const checkMealsConfig = async (): Promise<boolean> => {
    if (!calendarUrl) {
      return false;
    }
    try {
      const events = await fetchMealCalendarEvents();
      return events !== null;
    } catch (error) {
      console.error('Error checking meals configuration:', error);
      return false;
    }
  };

  // Load meals
  const loadMeals = async () => {
    if (!calendarUrl) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      console.log('[MealCalendar] Fetching meal events...');
      const events = await fetchMealCalendarEvents();
      console.log('[MealCalendar] Received events:', events);
      
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
        
        return {
          day: dayLabel,
          name: event.title,
        };
      });
      
      console.log('[MealCalendar] Processed meals:', processedMeals);
      setMeals(processedMeals);
    } catch (error) {
      console.error('Error loading meals:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load meals when component mounts and calendar URL is available
  useEffect(() => {
    if (calendarUrl) {
      loadMeals();
    }
  }, [calendarUrl]);

  if (!config) {
    return <div>Widget configuration not found</div>;
  }

  return (    <ConfigurableWidget
      config={config}
      checkConfig={checkMealsConfig}
      className="meals"
    >
      <div className="card-header">
        <span className="card-icon">🍽️</span>
        <h2 className="card-title">Meal Calendar</h2>
      </div>
      <div className="card-content">
        <div className="meals-wrapper">
        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <span>Loading meals...</span>
          </div>
        ) : meals.length > 0 ? (
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
        ) : (
          <div className="loading">
            <span>No meals scheduled</span>
          </div>
        )}
        </div>
      </div>
    </ConfigurableWidget>
  );
};

export default MealCalendar;
