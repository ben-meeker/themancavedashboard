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

// Keep getAccessToken for AuthPrompt component (OAuth flow only)
interface TokenData {
  token?: string;
  refresh_token: string;
  client_id: string;
  client_secret: string;
  expiry?: string;
}

export async function getAccessToken(): Promise<string | null> {
  try {
    const response = await fetch('/token.json');
    if (!response.ok) {
      return null;
    }
    
    const tokenData: TokenData = await response.json();
    
    // Check if current token is still valid
    if (tokenData.token && tokenData.expiry) {
      const expiryTime = new Date(tokenData.expiry).getTime();
      if (Date.now() < expiryTime - 5 * 60 * 1000) { // 5 min buffer
        return tokenData.token;
      }
    }

    // If token expired or missing, refresh it
    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: tokenData.client_id,
        client_secret: tokenData.client_secret,
        refresh_token: tokenData.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!refreshResponse.ok) {
      console.error('Failed to refresh token');
      return null;
    }

    const refreshData = await refreshResponse.json();
    return refreshData.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}
