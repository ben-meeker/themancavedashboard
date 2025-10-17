# Plant Sensors Widget

Displays soil moisture levels from Ecowitt plant sensors and indoor environmental data.

## Features
- Real-time soil moisture percentage for each sensor
- Visual moisture bars with ideal range indicators
- Color-coded moisture levels
- Indoor temperature, humidity, and pressure
- Auto-refresh every 5 minutes

## Configuration

### Required Environment Variables
```env
ECOWITT_APPLICATION_KEY=your-ecowitt-app-key
ECOWITT_API_KEY=your-ecowitt-api-key
ECOWITT_MAC=your-gateway-mac-address
```

### Widget Config (`config.json`)
```json
{
  "id": "plants-500",
  "widgetId": "plants",
  "location": {
    "x": 0,
    "y": 0,
    "width": 1,
    "height": 2
  },
  "config": {
    "sensors": [
      {
        "channel": "soil_ch1",
        "name": "Fiddle Leaf Fig",
        "ideal_min": 40,
        "ideal_max": 60
      },
      {
        "channel": "soil_ch2",
        "name": "Snake Plant",
        "ideal_min": 30,
        "ideal_max": 50
      }
    ]
  }
}
```

### Config Parameters

#### `sensors` (required)
- **Type**: `array` of sensor objects
- **Description**: List of plant sensors to monitor
- **Sensor Object**:
  - `channel` (string): Ecowitt sensor channel number (1-8)
  - `name` (string): Plant name to display
  - `ideal_min` (number): Minimum ideal moisture percentage
  - `ideal_max` (number): Maximum ideal moisture percentage

## Size
- **Default**: 1x2 grid cells
- Vertical list of plants with indoor data at bottom

## How to Get Ecowitt API Credentials
1. Purchase Ecowitt GW1000/GW2000 gateway and soil moisture sensors
2. Register at [ecowitt.net](https://www.ecowitt.net)
3. Find your MAC address in the Ecowitt app
4. Generate API keys from the API section

## API Endpoints Used
- `GET /api/ecowitt` - Fetch soil moisture data and indoor environmental readings

## Moisture Bar Colors
- **Blue**: Below ideal range (too dry)
- **Green**: Within ideal range (perfect!)
- **Orange**: Above ideal range (too wet)

## Indoor Data Displayed
- **Temperature**: Indoor temperature in °F
- **Humidity**: Indoor relative humidity percentage
- **Pressure**: Barometric pressure in inHg

