# Tesla Widget

Displays Tesla vehicle battery level and charging status using the Tessie API.

## Features
- Real-time battery percentage
- Visual battery indicator with color-coded levels
- Charging status indicator (⚡ when plugged in)
- Auto-refresh every 5 minutes

## Configuration

### Required Environment Variables
```env
TESSIE_API_KEY=your-tessie-api-key
TESSIE_VIN=your-vehicle-vin
```

### Widget Config (`config.json`)
```json
{
  "id": "tesla-300",
  "widgetId": "tesla",
  "location": {
    "x": 0,
    "y": 0,
    "width": 1,
    "height": 1
  },
  "config": {
    "tesla_name": "Model 3"
  }
}
```

### Config Parameters

#### `tesla_name` (optional)
- **Type**: `string`
- **Description**: Display name for your Tesla vehicle
- **Example**: `"Model 3"`, `"Model Y"`, `"Cybertruck"`, `"My Tesla"`
- **Effect**: Shows the vehicle name above the charge status

## Size
- **Default**: 1x1 grid cell
- Compact design for quick status check

## How to Get Tessie API Key
1. Sign up at [tessie.com](https://tessie.com)
2. Link your Tesla account
3. Generate an API key from your dashboard
4. Find your VIN in the Tessie app or Tesla app

## API Endpoints Used
- `GET /api/tesla` - Fetch current battery level and charging status

## Battery Level Colors
- **Green**: > 50%
- **Yellow**: 20-50%
- **Red**: < 20%

