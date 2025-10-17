import React, { useState, useEffect } from 'react';
import './Calendar.css';
import { fetchGoogleCalendarEvents, isCalendarConnected, type ProcessedEvent } from './googleCalendarApi';
import ConfigurableWidget from '../../components/ConfigurableWidget';
import { getWidgetConfig } from '../../config/widgetConfigs';
import { loadLayout } from '../../services/layoutApi';

interface Reminder {
  name: string;
  date: string;
  color?: string;
}

const CalendarWidget: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<ProcessedEvent[]>([]);
  const [trashDay, setTrashDay] = useState<string | undefined>();
  const [reminders, setReminders] = useState<Reminder[]>([]);

  // Check if calendar is configured
  const checkCalendarConfig = async (): Promise<boolean> => {
    return await isCalendarConnected();
  };

  // Get widget configuration
  const widgetMetadata = getWidgetConfig('calendar')!;

  // Load widget config from layout API
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const layout = await loadLayout();
        const calendarWidget = layout.widgets.find(w => w.widgetId === 'calendar');
        if (calendarWidget?.config) {
          setTrashDay(calendarWidget.config.trash_day as string);
          const configReminders = calendarWidget.config.reminders as Reminder[];
          setReminders(configReminders || []);
        }
      } catch (error) {
        console.error('Error loading calendar config:', error);
      }
    };
    loadConfig();
  }, []);

  // Update current date every minute to keep "today" highlighting accurate
  useEffect(() => {
    const dateInterval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60 * 1000); // Update every minute

    return () => clearInterval(dateInterval);
  }, []);

  // Fetch calendar events
  useEffect(() => {
    const loadEvents = async () => {
      const calendarEvents = await fetchGoogleCalendarEvents();
      setEvents(calendarEvents);
    };

    loadEvents();
  }, []);

  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  
  // Get first day of month and total days
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Create array of days
  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  
  // Group events by day - handle multi-day events
  const eventsByDay: { [key: number]: ProcessedEvent[] } = {};
  const eventPositions: { [key: string]: { day: number; position: 'start' | 'middle' | 'end' | 'single' } } = {};
  
  events.forEach(event => {
    const eventStartDate = new Date(event.start);
    const eventEndDate = new Date(event.end);
    
    // Normalize to start of day for comparison
    eventStartDate.setHours(0, 0, 0, 0);
    eventEndDate.setHours(0, 0, 0, 0);
    
    const isMultiDay = eventEndDate.getTime() > eventStartDate.getTime();
    
    // Loop through each day the event spans
    const currentDay = new Date(eventStartDate);
    while (currentDay <= eventEndDate) {
      // Only show events for the current month
      if (currentDay.getMonth() === currentDate.getMonth() && 
          currentDay.getFullYear() === currentDate.getFullYear()) {
        const day = currentDay.getDate();
        if (!eventsByDay[day]) {
          eventsByDay[day] = [];
        }
        eventsByDay[day].push(event);
        
        // Track position in multi-day event
        if (isMultiDay) {
          let position: 'start' | 'middle' | 'end' | 'single';
          if (currentDay.getTime() === eventStartDate.getTime()) {
            position = 'start';
          } else if (currentDay.getTime() === eventEndDate.getTime()) {
            position = 'end';
          } else {
            position = 'middle';
          }
          eventPositions[`${event.id}-${day}`] = { day, position };
        } else {
          eventPositions[`${event.id}-${day}`] = { day, position: 'single' };
        }
      }
      // Move to next day
      currentDay.setDate(currentDay.getDate() + 1);
    }
  });

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    
    // Check if the event is an all-day event (time is midnight UTC)
    if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0) {
      return ''; // All-day event, no time displayed
    }
    
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getEventPosition = (eventId: string, day: number) => {
    return eventPositions[`${eventId}-${day}`]?.position || 'single';
  };

  const isPastDay = (day: number) => {
    const today = new Date();
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    today.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const isGarbageDay = (day: number) => {
    if (!trashDay) return false; // Don't show trash icon if not configured
    
    // Map day names to numbers
    const dayMap: { [key: string]: number } = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    const targetDay = dayMap[trashDay];
    if (targetDay === undefined) return false;
    
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return checkDate.getDay() === targetDay;
  };

  // Calculate days until a reminder date
  const getDaysUntilDate = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Parse date (format: YYYY-MM-DD)
    const [, month, day] = dateString.split('-').map(Number);
    let nextDate = new Date(today.getFullYear(), month - 1, day); // month is 0-indexed
    
    // If date has passed this year, calculate for next year
    if (nextDate < today) {
      nextDate = new Date(today.getFullYear() + 1, month - 1, day);
    }
    
    const timeDiff = nextDate.getTime() - today.getTime();
    const daysUntil = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    return daysUntil;
  };

  return (
    <ConfigurableWidget
      config={widgetMetadata}
      checkConfig={checkCalendarConfig}
      className="calendar"
    >
      <div className="calendar-wrapper">
          <div className="calendar-header">
            <h3>{currentMonth} {currentYear}</h3>
            {reminders.length > 0 && (
              <div className="reminders-section">
                {reminders.map((reminder, index) => {
                  const daysUntil = getDaysUntilDate(reminder.date);
                  const color = reminder.color || '#667eea';
                  // Convert hex to RGB for background with opacity
                  const hexToRgb = (hex: string) => {
                    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                    return result ? {
                      r: parseInt(result[1], 16),
                      g: parseInt(result[2], 16),
                      b: parseInt(result[3], 16)
                    } : { r: 102, g: 126, b: 234 };
                  };
                  const rgb = hexToRgb(color);
                  const backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`;
                  
                  return (
                    <div 
                      key={index} 
                      className="reminder-countdown"
                      style={{ 
                        borderColor: color,
                        backgroundColor: backgroundColor
                      }}
                    >
                      <span className="reminder-label">{reminder.name}:</span>
                      <span className="reminder-text">
                        {daysUntil === 0 ? (
                          <span className="days-number" style={{ color }}>Today!</span>
                        ) : (
                          <>
                            <span className="days-number" style={{ color }}>{daysUntil}</span> {daysUntil === 1 ? 'day' : 'days'}
                          </>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="calendar-weekdays">
            {weekDays.map(day => (
              <div key={day} className="weekday">{day}</div>
            ))}
          </div>
          
          <div className="calendar-days">
          {days.map((day, index) => {
            const position = day && eventsByDay[day] && eventsByDay[day].length > 0 
              ? getEventPosition(eventsByDay[day][0].id, day) 
              : null;
            
            return (
              <div
                key={index}
                className={`calendar-day ${day === null ? 'empty' : ''} ${
                  day === currentDate.getDate() ? 'today' : ''
                } ${day && isPastDay(day) ? 'past-day' : ''} ${
                  day && eventsByDay[day] ? 'has-event' : ''
                } ${position ? `event-${position}` : ''}`}
              >
                {day !== null && (
                  <>
                    <span className="day-number">{day}</span>
                    {isGarbageDay(day) && (
                      <div className="garbage-indicator">
                        <span className="garbage-emoji">🗑️</span>
                        <span className="garbage-label">Garbage Day</span>
                      </div>
                    )}
                    {eventsByDay[day] && eventsByDay[day].length > 0 && (
                      <div className="event-text">
                        {eventsByDay[day].map((event) => (
                          <div key={event.id} className="event-item">
                            <div className="event-name">{event.title}</div>
                            {(position === 'start' || position === 'single') && (
                              <div className="event-time">{formatEventTime(event.start)}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
          </div>
        </div>
    </ConfigurableWidget>
  );
};

export default CalendarWidget;

