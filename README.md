# 🏠 The Man Cave Dashboard

[![Docker Hub](https://img.shields.io/badge/docker-bemeeker%2Fthemancavedashboard-blue?logo=docker)](https://hub.docker.com/r/bemeeker/themancavedashboard)

A cool, customizable smart home dashboard built with React and Go. Displays all your important information in one place with a modular widget system. Perfect for wall-mounted displays, tablets, or any screen in your home.

## ✨ Features

- **📅 Google Calendar** - View your calendar events and appointments
- **🍽️ Meal Planning** - Upcoming meals from your iCal feed
- **🌱 Plant Care** - Monitor soil moisture levels via Ecowitt sensors
- **🚗 Tesla Status** - Battery level and charging status via Tessie API
- **🌤️ Weather** - Current conditions via OpenWeatherMap
- **🔥 Traeger Grill** - Monitor grill temperature, probes, and pellet level
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

### Step 1: Create Configuration Directory

Create a config directory for your dashboard files:
```bash
mkdir -p ~/mancave-config/photos
cd ~/mancave-config
```

**Why a config directory?** Mounting a directory (instead of individual files) prevents Docker bind mount issues when editors use "atomic writes" to save files. All your config files, credentials, and photos live here.

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
      "location": {"x": 0, "y": 0, "width": 4, "height": 4},
      "config": {
        "trash_day": "Wednesday",
        "reminders": [
          {
            "name": "💕 Anniversary",
            "date": "2024-08-17",
            "color": "#ff69b4"
          }
        ],
        "google_credentials_filename": "credentials.json",
        "google_token_filename": "token.json"
      }
    },
    {
      "id": "photos",
      "location": {"x": 5, "y": 0, "width": 1, "height": 2},
      "config": {
        "photo_rotation_seconds": 45,
        "photos_folder": "photos"
      }
    },
    {
      "id": "plants",
      "location": {"x": 0, "y": 2, "width": 2, "height": 2},
      "config": {
        "sensors": [
          {
            "channel": "soil_ch1",
            "name": "Fiddle-Leaf Fig",
            "ideal_min": 30,
            "ideal_max": 40
          }
        ]
      }
    }
  ]
}
```

Create your `.env` file with API credentials:
```env
# Config directory path (contains config.json, credentials.json, token.json, photos/)
CONFIG_DIR=~/mancave-config

# API Credentials (only add the ones you need)
TESSIE_API_KEY=your_tessie_api_key
TESSIE_VIN=your_tesla_vin
OPENWEATHER_API_KEY=your_openweather_api_key
ECOWITT_API_KEY=your_ecowitt_api_key
ECOWITT_APPLICATION_KEY=your_ecowitt_app_key
ECOWITT_GATEWAY_MAC=your_gateway_mac
TRAEGER_USERNAME=your_traeger_email@example.com
TRAEGER_PASSWORD=your_traeger_password
```

**Note:** Widget-specific settings (like weather location, sensor names, etc.) go in `config.json`, not `.env`. Environment variables are only for API keys and credentials.

Create your `compose.yml`:
```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: mancave-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
      start_period: 5s
    networks:
      - dashboard-network

  backend:
    image: bemeeker/themancavedashboard-backend:latest
    container_name: mancave-backend
    env_file:
      - .env
    environment:
      - PORT=8080
      - REDIS_URL=redis://redis:6379
    volumes:
      # This includes config.json, and all other files/folders required by widgets
      - ${CONFIG_DIR:-./config}:/app/config:delegated
    restart: unless-stopped
    depends_on:
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s
    networks:
      - dashboard-network

  frontend:
    image: bemeeker/themancavedashboard-frontend:latest
    container_name: mancave-frontend
    ports:
      - "3000:80"
    volumes:
      # Mount config directory to access photos
      - ${CONFIG_DIR:-./config}:/app/config:ro
    restart: unless-stopped
    depends_on:
      backend:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1/"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s
    networks:
      - dashboard-network

networks:
  dashboard-network:
    driver: bridge

volumes:
  redis-data:
    driver: local
```

### Step 2: Add Photos and Credentials (Optional)

Add your photos to the config directory:
```bash
cp ~/Pictures/*.jpg ~/mancave-config/photos/
```

If using Google Calendar, add your OAuth credentials:
```bash
cp ~/Downloads/credentials.json ~/mancave-config/
# Follow Google OAuth setup to generate token.json
```

Your config directory should look like:
```
~/mancave-config/
├── config.json
├── credentials.json  (optional, for Google Calendar)
├── token.json       (optional, for Google Calendar)
└── photos/
    ├── photo1.jpg
    ├── photo2.png
    └── ...
```

### Step 3: Start the Dashboard

Download the `compose.yml` and `.env` files, then start:
```bash
docker compose up -d
```

Visit `http://localhost:3000` 🎉

The dashboard consists of three services:
- **Redis**: Shared cache for widgets (port 6379, internal only)
- **Backend**: Go API server (port 8080, internal only)  
- **Frontend**: React app served by nginx (port 3000, exposed)

All three containers share the same Docker network for internal communication.

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

The dashboard uses a microservices architecture with three containers:

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                        │
│                                                          │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐     │
│  │ Frontend │─────▶│ Backend  │─────▶│  Redis   │     │
│  │  (nginx) │      │   (Go)   │      │ (cache)  │     │
│  │  :3000   │      │  :8080   │      │  :6379   │     │
│  └──────────┘      └──────────┘      └──────────┘     │
│       │                  │                              │
└───────┼──────────────────┼──────────────────────────────┘
        │                  │
        └──────────────────┘
               │
        [CONFIG_DIR Mount]
     (config.json, photos/,
      credentials.json, etc.)
```

**File Structure:**
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
├── compose.yml             # Multi-container deployment
├── Dockerfile.frontend     # Frontend container build
├── server/
│   ├── Dockerfile.backend  # Backend container build
│   └── shared/             # Shared utilities (config helpers)
└── developer-docs/         # Development guides
```

## 🔧 Configuration Reference

### Global Settings (`config.json` > `global`)
- `timezone` - Your timezone (e.g., "America/Denver")
- `night_mode_start` - When to dim the display (24h format, e.g., "22:00")
- `night_mode_end` - When to brighten the display (24h format, e.g., "07:00")
- `refresh_interval_minutes` - How often to refresh data (default: 5)
- `grid_columns` - Dashboard grid width (default: 6)
- `grid_rows` - Dashboard grid height (default: 4)

### Widget Configuration

Each widget in the `widgets` array has:
- `id` - Widget type (e.g., "calendar", "tesla", "photos", "plants")
- `location` - Position and size on grid
  - `x` - Horizontal position (0-based)
  - `y` - Vertical position (0-based)
  - `width` - Widget width in grid cells (auto-saved from edit mode)
  - `height` - Widget height in grid cells (auto-saved from edit mode)
- `config` - Widget-specific settings (see individual widget READMEs)

**Widget-Specific Settings:**
- **Calendar**: `trash_day`, `reminders`, `google_credentials_filename`, `google_token_filename`
- **Photos**: `photo_rotation_seconds`, `photos_folder`
- **Plants**: `sensors` array with `channel`, `name`, `ideal_min`, `ideal_max`
- **Weather**: `latitude`, `longitude`, `location_name`
- **Tesla**: Uses `TESSIE_API_KEY` and `TESSIE_VIN` from `.env`
- **Traeger**: `grill_name`, uses `TRAEGER_USERNAME` and `TRAEGER_PASSWORD` from `.env`
- **Meal Calendar**: `calendar_url` (or use `MEAL_ICAL_URL` in `.env`)

See individual widget READMEs in `src/widgets/` for complete configuration options.

## 🐛 Troubleshooting

**Dashboard not loading?**
- Check logs: `docker compose logs backend` or `docker compose logs frontend`
- Verify your `config.json` is valid JSON
- Ensure your `.env` file has the correct API keys
- Check all services are healthy: `docker compose ps`

**Widget shows "Not Configured"?**
- Add required config to `config.json` under that widget
- Add required API keys to `.env`
- Restart: `docker compose restart backend`

**Photos not showing?**
- Ensure photos are in the `CONFIG_DIR/photos/` folder
- Check `CONFIG_DIR` is set correctly in `.env`
- Verify photo formats (jpg, png, heic supported)
- Check widget config has correct `photos_folder` value (default: "photos")

**Google Calendar not working?**
- Follow Google OAuth setup in `developer-docs/`
- Ensure `credentials.json` and `token.json` are in your `CONFIG_DIR`
- Check widget config has correct filenames (default: "credentials.json", "token.json")
- Check logs for OAuth errors: `docker compose logs backend`

**Config changes not taking effect?**
- Hard refresh your browser (Cmd+Shift+R on Mac, Ctrl+Shift+F5 on Windows)
- If still not working: `docker compose restart backend`
- **Note**: By mounting a config directory (instead of individual files), atomic writes from editors no longer break the mount. Your config changes should be picked up automatically!

**Redis connection issues?**
- Check Redis is healthy: `docker compose ps redis`
- View Redis logs: `docker compose logs redis`
- Test connection: `docker exec mancave-redis redis-cli ping` (should return "PONG")

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
