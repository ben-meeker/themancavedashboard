# Calendar Widget

Displays a monthly calendar with Google Calendar events, trash day reminders, and custom date countdown reminders.

## Features
- Monthly calendar grid with current date highlighting
- Google Calendar event integration
- Trash day indicator (🗑️) on configured weekday
- Multiple custom date reminders with countdown
- Past days are dimmed with strikethrough effect

## Configuration

### Required Setup

Google Calendar credentials should be placed in your `CONFIG_DIR`:

```
config/
├── config.json
├── credentials.json    ← Google OAuth credentials
├── token.json         ← Google OAuth token
└── photos/
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
    ],
    "google_credentials_filename": "credentials.json",
    "google_token_filename": "token.json"
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

#### `google_credentials_filename` (optional)
- **Type**: `string`
- **Description**: Filename of Google OAuth credentials within `CONFIG_DIR`
- **Default**: `credentials.json`
- **Example**: Set to `my-credentials.json` to use a custom filename

#### `google_token_filename` (optional)
- **Type**: `string`
- **Description**: Filename of Google OAuth token within `CONFIG_DIR`
- **Default**: `token.json`
- **Example**: Set to `my-token.json` to use a custom filename

## Size
- **Default**: 4x4 grid cells
- Recommended for proper month view with events

## API Endpoints Used
- `GET /api/google/token-status` - Check if Google Calendar is connected
- `GET /api/calendar` - Fetch calendar events for current month

