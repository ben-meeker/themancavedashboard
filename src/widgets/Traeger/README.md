# Traeger Grill Widget

Monitor your Traeger grill in real-time with temperature tracking, probe monitoring, and pellet level display.

## Features

- **Real-time Temperature**: Current grill temperature (orange) and set temperature (grey)
- **Probe Monitoring**: Track up to 2 meat probes with current and target temps
- **Temperature Graph**: Compact line graph showing temperature history over the last hour
- **Pellet Level**: Visual indicator showing remaining pellet percentage
- **Auto-refresh**: Updates every 30 seconds

## Configuration

### Environment Variables

Add to your `.env` file:

```env
TRAEGER_USERNAME=your_traeger_email@example.com
TRAEGER_PASSWORD=your_traeger_password
```

Use the same credentials you use for the Traeger mobile app.

### Widget Config

Add to your `config.json`:

```json
{
  "id": "traeger-1",
  "widgetId": "traeger",
  "position": { "x": 0, "y": 0, "width": 1, "height": 1 },
  "config": {
    "grill_name": "The Grillfather"
  }
}
```

**Config Options:**
- `grill_name` (required): The friendly name of your grill as it appears in the Traeger app

## Widget Size

- **Recommended**: 1x1 (compact display)
- **Minimum**: 1x1
- **Maximum**: Can be larger, but designed for 1x1

## How It Works

1. **Backend**: Connects to Traeger's AWS Cognito API and MQTT service
2. **Real-time Updates**: Subscribes to grill status updates via MQTT
3. **Redis Storage**: Stores temperature history every 30 seconds for graphing
4. **Frontend**: Displays current status and renders temperature graph on HTML canvas

## Temperature Graph

The graph shows:
- **Orange line**: Actual grill temperature
- **Grey dashed line**: Set temperature
- **Cyan line**: Probe temperature (if connected)
- **Time range**: Last 1 hour of data

## API Endpoints

- `GET /api/traeger?grill_name=YourGrill` - Get current grill status
- `GET /api/traeger/history?grill_name=YourGrill&duration=3600` - Get temperature history

## Troubleshooting

**Widget shows "Not Configured":**
- Add `grill_name` to your widget config in `config.json`

**Widget shows "Error":**
- Check that `TRAEGER_USERNAME` and `TRAEGER_PASSWORD` are set in `.env`
- Verify credentials work in the Traeger mobile app
- Check backend logs: `docker compose logs backend`

**No temperature history:**
- Redis must be running and configured
- Wait 1-2 minutes for initial data collection
- Check Redis connection: `docker exec mancave-redis redis-cli ping`

**Grill not found:**
- Ensure `grill_name` matches exactly as shown in Traeger app
- Check backend logs for available grills

## Redis Keys

This widget uses Redis with the prefix `traeger:`:
- `traeger:history:{grill_name}` - Temperature history (sorted set, 24h retention)

## Dependencies

### Backend
- `github.com/eclipse/paho.mqtt.golang` - MQTT client
- `github.com/google/uuid` - UUID generation
- `github.com/redis/go-redis/v9` - Redis client

### Frontend
- HTML Canvas API for temperature graph rendering
- Standard React hooks for state management

