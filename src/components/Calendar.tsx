import React, { useState, useEffect } from 'react';
import './Calendar.css';
import { fetchGoogleCalendarEvents, isCalendarConnected, type ProcessedEvent } from '../services/googleCalendarApi';

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<ProcessedEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [anniversaryDate, setAnniversaryDate] = useState('2020-08-17');
  const [trashDay, setTrashDay] = useState('Wednesday');

  // Fetch personal configuration
  useEffect(() => {
    const loadPersonalConfig = async () => {
      try {
        const response = await fetch('/api/personal/config');
        if (response.ok) {
          const config = await response.json();
          if (config.anniversary_date) setAnniversaryDate(config.anniversary_date);
          if (config.trash_day) setTrashDay(config.trash_day);
        }
      } catch (error) {
        console.error('Error loading personal config:', error);
      }
    };
    loadPersonalConfig();
  }, []);

  // Check if calendar is connected
  useEffect(() => {
    isCalendarConnected().then(setIsConnected);
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
    // Map day names to numbers
    const dayMap: { [key: string]: number } = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    const targetDay = dayMap[trashDay] ?? 3; // Default to Wednesday if not found
    
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return checkDate.getDay() === targetDay;
  };

  // Calculate days until anniversary
  const getDaysUntilAnniversary = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Parse anniversary date (format: YYYY-MM-DD)
    const [, month, day] = anniversaryDate.split('-').map(Number);
    let nextAnniversary = new Date(today.getFullYear(), month - 1, day); // month is 0-indexed
    
    // If anniversary has passed this year, calculate for next year
    if (nextAnniversary < today) {
      nextAnniversary = new Date(today.getFullYear() + 1, month - 1, day);
    }
    
    const timeDiff = nextAnniversary.getTime() - today.getTime();
    const daysUntil = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    return daysUntil;
  };

  const daysUntilAnniversary = getDaysUntilAnniversary();

  return (
    <div className="calendar">
      <div className={`calendar-wrapper ${!isConnected ? 'disconnected' : ''}`}>
        <div className="calendar-header">
          <h3>{currentMonth} {currentYear}</h3>
          <div className="anniversary-countdown">
            <span className="anniversary-icon">💕</span>
            <span className="anniversary-label">Anniversary Countdown:</span>
            <span className="anniversary-text">
              {daysUntilAnniversary === 0 ? (
                "Happy Anniversary!"
              ) : (
                <>
                  <span className="days-number">{daysUntilAnniversary}</span> {daysUntilAnniversary === 1 ? 'day' : 'days'}
                </>
              )}
            </span>
          </div>
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
      
      {!isConnected && (
        <div className="connection-overlay">
          <div className="overlay-icon">📅</div>
          <div className="overlay-message">Google Calendar Not Connected</div>
          <div className="overlay-hint">Complete OAuth setup to connect your calendar</div>
        </div>
      )}
    </div>
  );
};

export default Calendar;

