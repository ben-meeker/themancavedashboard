# Calendar Widget

Displays a monthly calendar with Google Calendar events, trash day reminders, and custom date countdown reminders.

## Features
- Monthly calendar grid with current date highlighting
- Google Calendar event integration
- Trash day indicator (🗑️) on configured weekday
- Multiple custom date reminders with countdown
- Past days are dimmed with strikethrough effect

## Configuration

### Required Environment Variables
```env
# Google Calendar API credentials (mounted as files)
GOOGLE_CREDENTIALS_PATH=/app/config/credentials.json
GOOGLE_TOKEN_PATH=/app/config/token.json
```

### Widget Config (`config.json`)
```json
{
  "id": "calendar-100",
  "widgetId": "calendar",
  "location": {
    "x": 1,
    "y": 0,
    "width": 4,
    "height": 4
  },
  "config": {
    "trash_day": "Thursday",
    "reminders": [
      {
        "name": "💕 Anniversary",
        "date": "2024-08-17",
        "color": "#ff69b4"
      },
      {
        "name": "🎂 Birthday",
        "date": "1990-05-15",
        "color": "#764ba2"
      }
    ]
  }
}
```

### Config Parameters

#### `trash_day` (optional)
- **Type**: `string`
- **Description**: Day of the week when trash pickup occurs
- **Valid Values**: `"Monday"`, `"Tuesday"`, `"Wednesday"`, `"Thursday"`, `"Friday"`, `"Saturday"`, `"Sunday"`
- **Effect**: Shows 🗑️ emoji on that day of the week in the calendar

#### `reminders` (optional)
- **Type**: `array` of reminder objects
- **Description**: List of recurring date reminders with countdown
- **Reminder Object**:
  - `name` (string): Display name (can include emoji)
  - `date` (string): Date in `YYYY-MM-DD` format
  - `color` (string): Hex color code or CSS color name for border and number

## Size
- **Default**: 4x4 grid cells
- Recommended for proper month view with events

## API Endpoints Used
- `GET /api/google/token-status` - Check if Google Calendar is connected
- `GET /api/calendar` - Fetch calendar events for current month

