# Meal Calendar Widget

Displays upcoming meals from a Google Calendar, showing relative day labels (Today, Tomorrow, weekday names, or dates).

## Features
- Fetches meal events from Google Calendar
- Shows meals sorted chronologically (closest first)
- Displays relative day labels for easy planning
- Clean, minimal design with color-coded dots

## Configuration

### Required Environment Variables
None - all configuration is done via widget config.

### Widget Config (`config.json`)
```json
{
  "id": "meals",
  "location": {
    "x": 5,
    "y": 0,
    "width": 1,
    "height": 2
  },
  "config": {
    "calendar_url": "https://icalendar.anylist.com/your-calendar-id.ics"
  }
}
```

### Config Parameters

#### `calendar_url` (required)
- **Type**: `string`
- **Description**: iCal feed URL for your meal calendar
- **Example**: `"https://icalendar.anylist.com/5b534e065eea457594a5e469c23f5fbb.ics"`
- **Sources**: AnyList, Google Calendar iCal export, Apple Calendar shared link, etc.
- **Note**: Can also be set via `MEAL_ICAL_URL` environment variable as fallback

## Size
- **Default**: 1x2 grid cells
- Compact vertical list format

## Day Labels
- **Today**: Events occurring today
- **Tomorrow**: Events occurring tomorrow
- **Weekday Name**: Events within the next 7 days (e.g., "Friday")
- **Month + Day**: Events beyond 7 days (e.g., "Oct 24")

## API Endpoints Used
- `GET /api/meals` - Fetch meal events from configured iCal feed

