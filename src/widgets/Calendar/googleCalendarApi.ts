// Google Calendar API - calls backend

export type ProcessedEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
};

/**
 * Check if calendar is connected by checking token status from backend
 */
export async function isCalendarConnected(): Promise<boolean> {
  try {
    const response = await fetch('/api/google/token-status');
    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    return data.valid === true;
  } catch {
    return false;
  }
}

/**
 * Fetch Google Calendar events from backend
 */
export async function fetchGoogleCalendarEvents(): Promise<ProcessedEvent[]> {
  try {
    const response = await fetch('/api/calendar/events');

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.statusText}`);
    }

    const events = await response.json();

    // Transform backend response to ProcessedEvent format
    return events.map((event: any) => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay || false,
    }));
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }
}

/**
 * Fetch meal calendar events from backend (iCal)
 */
export async function fetchMealCalendarEvents(): Promise<ProcessedEvent[]> {
  try {
    const response = await fetch('/api/meals');

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.statusText}`);
    }

    const events = await response.json();

    // Transform backend response to ProcessedEvent format
    return events.map((event: any) => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay || false,
    }));
  } catch (error) {
    console.error('Error fetching meal calendar events:', error);
    return [];
  }
}
