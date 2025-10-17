# 🏠 The Man Cave Dashboard

[![Docker Hub](https://img.shields.io/badge/docker-bemeeker%2Fthemancavedashboard-blue?logo=docker)](https://hub.docker.com/r/bemeeker/themancavedashboard)

A cool, customizable smart home dashboard built with React and Go. Displays all your important information in one place with a modular widget system. Perfect for wall-mounted displays, tablets, or any screen in your home.

## ✨ Features

- **📅 Google Calendar** - View your calendar events and appointments
- **🍽️ Meal Planning** - Upcoming meals from your iCal feed
- **🌱 Plant Care** - Monitor soil moisture levels via Ecowitt sensors
- **🚗 Tesla Status** - Battery level and charging status via Tessie API
- **🌤️ Weather** - Current conditions via OpenWeatherMap
- **📸 Photo Carousel** - Rotating display of your photos
- **🗑️ Trash Reminders** - Configurable trash day notifications
- **💕 Anniversary Countdown** - Track special dates

## 🎯 Modular Widget System

This dashboard uses a **fully modular widget architecture**:
- ✅ **Frontend**: Each widget is self-contained in `src/widgets/`
- ✅ **Backend**: Each widget is self-contained in `server/widgets/`
- ✅ **Easy to extend**: Copy the template, implement, and register - done!
- ✅ **Drag-and-drop layout**: Customize your dashboard in edit mode

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- API keys for services you want to use (optional)

### Step 1: Create Configuration

Create a folder for your dashboard:
```bash
mkdir my-dashboard
cd my-dashboard
```

Create your `config.json`:
```json
{
  "global": {
    "timezone": "America/Denver",
    "night_mode_start": "22:00",
    "night_mode_end": "07:00",
    "refresh_interval_minutes": 5,
    "grid_columns": 6,
    "grid_rows": 4
  },
  "widgets": [
    {
      "id": "calendar",
      "location": {"x": 0, "y": 0},
      "config": {
        "trash_day": "Wednesday",
        "reminders": [
          {
            "name": "Anniversary Date",
            "date": "2024-08-17"
          }
        ]
      }
    },
    {
      "id": "ecowitt",
      "location": {"x": 0, "y": 2},
      "config": {
        "soil_sensors": [
          {
            "channel": "soil_ch1",
            "name": "Fiddle-Leaf Fig",
            "location": "Living Room",
            "min_moisture": 30,
            "max_moisture": 40
          }
        ]
      }
    }
  ]
}
```

Create your `.env` file with API credentials:
```env
# Timezone
TZ=America/Denver

# API Credentials (only add the ones you need)
TESSIE_API_KEY=your_tessie_api_key
TESSIE_VIN=your_tesla_vin
OPENWEATHER_API_KEY=your_openweather_api_key
WEATHER_LAT=39.7392
WEATHER_LON=-104.9903
MEAL_ICAL_URL=https://your-meal-app.com/calendar.ics
ECOWITT_API_KEY=your_ecowitt_api_key
ECOWITT_APPLICATION_KEY=your_ecowitt_app_key
ECOWITT_GATEWAY_MAC=your_gateway_mac
```

Create your `docker-compose.yml`:
```yaml
services:
  dashboard:
    image: bemeeker/themancavedashboard:latest
    container_name: mancave-dashboard
    ports:
      - "3000:80"
    env_file:
      - .env
    environment:
      - PORT=8080
    volumes:
      # Google OAuth files (if using Google Calendar)
      - ${GOOGLE_CREDENTIALS_PATH:-./credentials.json}:/app/credentials.json:ro
      - ${GOOGLE_TOKEN_PATH:-./token.json}:/app/token.json:ro
      # Main config file (read-write so layout can be saved)
      - ${CONFIG_PATH:-./config.json}:/app/external-config.json
      # Photos directory
      - ${PHOTOS_PATH:-./photos}:/usr/share/nginx/html/photos:ro
    restart: unless-stopped
```

### Step 2: Add Photos (Optional)

Create a `photos` folder and add your images:
```bash
mkdir photos
cp ~/Pictures/*.jpg photos/
```

### Step 3: Start the Dashboard

```bash
docker-compose up -d
```

Visit `http://localhost:3000` 🎉

## 🎨 Customizing Your Dashboard

### Edit Mode

1. Click the **pencil icon** in the top-right to enter edit mode
2. Click **"Add Widget"** to add new widgets
3. **Drag widgets** to reposition them
4. Click **"Done"** to save your layout

### Adding Widgets

All available widgets are automatically discovered. Simply:
1. Enter edit mode
2. Click "Add Widget"
3. Select from the dropdown
4. Position the widget
5. Save

## 📚 Documentation

### For Users
- **Configuration Guide**: See example `config.json` above
- **Environment Variables**: Use `.env` for API keys
- **Google Calendar Setup**: See `developer-docs/` for OAuth setup

### For Developers
- **Adding Widgets (Frontend)**: `src/widgets/_template/README.md`
- **Adding Widgets (Backend)**: `server/widgets/_template/README.md`
- **Widget Development**: `WIDGET_DEVELOPMENT.md`
- **Style Guide**: `developer-docs/STYLE_GUIDE.md`

## 🏗️ Architecture

```
themancavedashboard/
├── src/                    # React frontend
│   ├── widgets/            # Modular widgets (self-contained)
│   │   ├── Calendar/
│   │   ├── Tesla/
│   │   ├── Weather/
│   │   └── ...
│   ├── components/         # Shared UI components
│   └── styles/             # Design system
│
├── server/                 # Go backend
│   ├── main.go             # Server entry point
│   ├── config.go           # Configuration management
│   ├── layout.go           # Dashboard layout system
│   └── widgets/            # Modular widgets (self-contained)
│       ├── calendar/
│       ├── tesla/
│       ├── weather/
│       └── ...
│
└── docker-compose.yml      # Easy deployment
```

## 🔧 Configuration Reference

### Global Settings (`config.json` > `global`)
- `timezone` - Your timezone (e.g., "America/Denver")
- `night_mode_start` - When to dim the display (24h format)
- `night_mode_end` - When to brighten the display
- `photo_rotation_seconds` - How long to show each photo
- `refresh_interval_minutes` - How often to refresh data
- `grid_columns` - Dashboard grid width (default: 6)
- `grid_rows` - Dashboard grid height (default: 4)

### Widget Configuration

Each widget in the `widgets` array has:
- `id` - Widget type (e.g., "calendar", "tesla")
- `location` - Position and size on grid
  - `x` - Horizontal position (0-based)
  - `y` - Vertical position (0-based)
  - `width` - Widget width in grid cells (optional, auto-filled when saving layout)
  - `height` - Widget height in grid cells (optional, auto-filled when saving layout)
- `config` - Widget-specific settings

**Note:** Widget sizes are automatically determined by each widget's frontend configuration and saved to `config.json` when you save the layout in edit mode. You don't need to manually set `width` and `height`.

See the example `config.json` above for widget-specific options.

## 🐛 Troubleshooting

**Dashboard not loading?**
- Check `docker logs mancave-dashboard`
- Verify your `config.json` is valid JSON
- Ensure your `.env` file has the correct API keys

**Widget shows "Not Configured"?**
- Add required config to `config.json` under that widget
- Add required API keys to `.env`
- Restart: `docker-compose restart`

**Photos not showing?**
- Ensure photos are in the `photos/` folder
- Check volume mount in `docker-compose.yml`
- Verify photo formats (jpg, png, heic supported)

**Google Calendar not working?**
- Follow Google OAuth setup in `developer-docs/`
- Ensure `credentials.json` and `token.json` are mounted
- Check logs for OAuth errors

**Config changes not taking effect?**
- Hard refresh your browser (Cmd+Shift+R on Mac, Ctrl+Shift+F5 on Windows)
- If still not working: `docker-compose restart`
- **Note**: Some text editors (VS Code, Vim, etc.) use "atomic writes" which can break Docker bind mounts. If you edit `config.json` and changes don't appear, restart the container to re-establish the mount.

### Adding a New Widget

See `WIDGET_DEVELOPMENT.md` for a complete guide.

## 📝 License

MIT License - feel free to use and modify!

## 🙏 Credits

Built with:
- React + TypeScript
- Go + Chi router
- Vite
- Docker

---

**Made with ❤️ for the smart home enthusiasts**
