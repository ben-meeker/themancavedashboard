# Weather Widget

Displays current outdoor weather conditions using the OpenWeatherMap API.

## Features
- Current temperature
- "Feels like" temperature
- Weather condition description
- High/low temperature forecast
- Weather icon
- Auto-refresh every 10 minutes

## Configuration

### Required Environment Variables

Add to your `.env` file:
```env
OPENWEATHER_API_KEY=your-openweathermap-api-key
```

### Widget Config (`config.json`)

Add to your `config.json` widgets array:
```json
{
  "id": "weather",
  "location": {
    "x": 0,
    "y": 0,
    "width": 1,
    "height": 1
  },
  "config": {
    "latitude": "40.7128",
    "longitude": "-74.0060",
    "location_name": "New York, NY"
  }
}
```

### Config Parameters

#### `latitude` (required)
- **Type**: `string` or `number`
- **Description**: Latitude for weather location
- **Example**: `"40.7128"` or `40.7128` (New York City)
- **Note**: Can also be set via `WEATHER_LAT` environment variable as fallback

#### `longitude` (required)
- **Type**: `string` or `number`
- **Description**: Longitude for weather location
- **Example**: `"-74.0060"` or `-74.0060` (New York City)
- **Note**: Can also be set via `WEATHER_LON` environment variable as fallback

#### `location_name` (optional)
- **Type**: `string`
- **Description**: Display name for the location (not currently shown in UI, but useful for config organization)
- **Example**: `"New York, NY"`, `"Denver, CO"`

## Size
- **Default**: 1x1 grid cell
- Compact weather display

## How to Get OpenWeatherMap API Key
1. Sign up at [openweathermap.org](https://openweathermap.org)
2. Go to API Keys section in your account
3. Generate a free API key
4. Get your coordinates from [latlong.net](https://www.latlong.net)

## API Endpoints Used
- `GET /api/weather` - Fetch current weather data

## Data Displayed
- **Temperature**: Current temperature in °F
- **Feels Like**: Perceived temperature accounting for humidity and wind
- **Conditions**: Weather description (e.g., "Clear sky", "Light rain")
- **High/Low**: Daily forecast high and low temperatures

