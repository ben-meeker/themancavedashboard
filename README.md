# 🏠 The Man Cave Dashboard

A sleek, modern dark mode dashboard for home automation and family life. Displays Tesla status, calendar events, plant care, weather, meal planning, and a photo carousel in one beautiful interface.

Perfect for mounting on a wall display or old tablet!

## ✨ Features

- **🚗 Tesla Status**: Real-time charge level and vehicle status via Tessie API
- **📅 Calendar**: Google Calendar integration with monthly view
- **🌱 Plant Care**: Ecowitt soil moisture sensors with battery monitoring
- **🌤️ Weather**: Current weather with OpenWeather API
- **🍽️ Meal Calendar**: Weekly meal planning from iCal feed
- **📸 Photo Carousel**: Beautiful rotating photo display from local directory
- **🌙 Night Mode**: Automatically dims at night (10 PM - 7 AM)

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Copy the environment template**:
```bash
cp .env.example .env
```

2. **Edit your configuration**:
```bash
nano .env
```

Add your:
- Anniversary date and trash day
- Photos directory path
- API keys (Tesla/Tessie, Weather, Ecowitt)
- Google OAuth credentials
- Meal calendar URL

3. **Start the dashboard**:
```bash
docker-compose up -d
```

4. **Open in browser**:
```
http://localhost:3000
```

That's it! The dashboard will auto-refresh every 5 minutes.

### Using Pre-built Image from Docker Hub

```bash
# Pull the image
docker pull bemeeker/themancavedashboard:latest

# Run with docker-compose
docker-compose up -d
```

## 📋 Configuration

### Required Environment Variables

See `.env.example` for all available configuration options:

```env
# Personal
ANNIVERSARY_DATE=2020-01-15
TRASH_DAY=Thursday
PHOTOS_PATH=/path/to/your/photos

# APIs
TESSIE_API_KEY=your_key
OPENWEATHER_API_KEY=your_key
ECOWITT_API_KEY=your_key
# ... and more
```

### Photos Setup

The dashboard automatically detects and displays photos from your photos directory:

1. Create a photos directory with your images
2. Set `PHOTOS_PATH` in `.env` to point to it:
   ```env
   PHOTOS_PATH=/Users/you/Pictures/FamilyPhotos
   ```
3. Supported formats: JPG, JPEG, PNG, GIF, HEIC, WebP

Photos are mounted as a read-only volume and automatically detected by the backend. No `photos.json` manifest needed!

### Google Calendar Setup

**Option 1: Using Credentials Files (Recommended)**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable Google Calendar API
3. Create OAuth 2.0 credentials and download as `credentials.json`
4. Set paths in `.env`:
   ```env
   GOOGLE_CREDENTIALS_PATH=/path/to/credentials.json
   GOOGLE_TOKEN_PATH=/path/to/token.json
   ```
5. Start the dashboard and complete the OAuth flow
6. The `token.json` will be generated and saved automatically

**Option 2: Using Environment Variables (Legacy)**

1. Get OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/)
2. Add to `.env`:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_client_id
   VITE_GOOGLE_CLIENT_SECRET=your_secret
   ```
3. Complete OAuth flow as above

**Note:** The credentials file approach is more secure as the client secret stays on the server.

## 🏗️ Architecture

**Single Container Design** - Runs both backend (Go) and frontend (React/nginx) in one container using supervisord:

```
┌─────────────────────────────────┐
│   The Man Cave Dashboard        │
│                                 │
│  ┌─────────────┐               │
│  │ Nginx (80)  │ ◄── Frontend  │
│  │             │               │
│  │ Proxy → :8080               │
│  └──────┬──────┘               │
│         │                      │
│  ┌──────▼──────┐               │
│  │  Go Backend │ ◄── APIs      │
│  │   (8080)    │               │
│  └─────────────┘               │
│                                 │
│  Managed by supervisord         │
└─────────────────────────────────┘
```

## 🛠️ Development

### Local Development

```bash
# Install dependencies
npm install

# Run dev server (frontend only)
npm run dev

# Run backend (in separate terminal)
cd server
go run .
```

### Build from Source

```bash
# Build the all-in-one Docker image
docker build -t themancavedashboard .

# Or use docker-compose
docker-compose build
```

## 📦 Publishing to Docker Hub

```bash
# Login to Docker Hub
docker login

# Build and push
./build-and-push.sh v1.0.0

# Or manually
docker build -t bemeeker/themancavedashboard:latest .
docker push bemeeker/themancavedashboard:latest
```

## 🎨 Customization

### Plant Sensor Names

Edit `server/ecowitt.go`:
```go
sensorNames := map[string]string{
    "soil_ch1": "Your Plant Name",
    "soil_ch2": "Another Plant",
}
```

### UI Colors & Styling

- Main styles: `src/App.css`
- Component styles: `src/components/*.css`
- Features glassmorphism with backdrop blur

### Grid Layout

Optimized for 1920x1080 displays (TVs):
- 3x2 grid layout
- No scrolling needed
- TV-safe padding

## 📱 Display Recommendations

- **Ideal**: 1920x1080 display (24" monitor or TV)
- **Browser**: Any modern browser (Chrome, Firefox, Safari)
- **Mode**: Fullscreen (F11)
- **Rotation**: Portrait or Landscape works

## 🔧 Troubleshooting

### Check Container Logs
```bash
docker logs mancave-dashboard

# Follow logs
docker logs -f mancave-dashboard

# Check backend logs specifically
docker exec mancave-dashboard cat /var/log/supervisor/backend.out.log
```

### Verify Configuration
```bash
# Check if config is loaded
docker exec mancave-dashboard cat /app/config/config.json

# Test personal config
curl http://localhost:3000/api/personal/config
```

### Test Backend APIs
```bash
curl http://localhost:3000/api/tesla/status
curl http://localhost:3000/api/weather
curl http://localhost:3000/api/ecowitt
curl http://localhost:3000/api/calendar/events
curl http://localhost:3000/api/meals
curl http://localhost:3000/api/photos/list
```

### Common Issues

**Photos not showing?**
- Check `PHOTOS_PATH` in `.env` points to correct directory
- Ensure photos directory has read permissions
- Verify photos are in supported formats (JPG, PNG, HEIC, etc.)
- Check API: `curl http://localhost:3000/api/photos/list`

**Calendar not connecting?**
- Complete OAuth flow in browser first
- Check `token.json` exists and is readable
- Verify `GOOGLE_CREDENTIALS_PATH` and `GOOGLE_TOKEN_PATH` are correct
- Test: `curl http://localhost:3000/api/google/token-status`

**Meals not showing?**
- Verify `MEAL_ICAL_URL` is set in `.env`
- Check your meal calendar has events in the next 7 days
- Test URL: `curl -L "YOUR_ICAL_URL"`

**Plant sensors not showing?**
- Verify Ecowitt API credentials in `.env`
- Check sensor readings in Ecowitt console
- Test: `curl http://localhost:3000/api/ecowitt`

### Reset Everything
```bash
docker-compose down
docker volume rm themancavedashboard_dashboard-config
docker-compose up -d
```

## 🔒 Security Notes

- `.env` file is **never** included in Docker images
- `token.json` is mounted as read-only volume
- API keys stored in named Docker volume
- Photos mounted as read-only

## 🚀 Deployment Tips

### Running 24/7
- Use `restart: unless-stopped` in docker-compose (already configured)
- Dashboard auto-refreshes data every 5 minutes
- Night mode dims display automatically (10 PM - 7 AM)

### Raspberry Pi / ARM Support
The Docker image supports multi-architecture builds. It should work on:
- Raspberry Pi 4 (ARM64)
- Intel/AMD (x86_64)
- Mac M1/M2 (ARM64)

### Wall-Mounted Display
For best results on a wall-mounted tablet/display:
1. Use kiosk mode or full-screen browser
2. Disable screen sleep in OS settings
3. Set browser to auto-open dashboard on boot
4. Consider a low-power display for 24/7 operation

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs or request features via Issues
- Submit Pull Requests
- Fork and customize for your needs

## 📄 License

MIT License - feel free to use and modify for your own dashboard!

## 🙏 Credits

Built with:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Go + Chi Router
- **Web Server**: Nginx + Supervisord
- **APIs**: 
  - Tessie API (Tesla integration)
  - OpenWeather API (weather data)
  - Ecowitt API (soil moisture sensors)
  - Google Calendar API (events)
  - AnyList iCal (meal planning)

---

**Made with ❤️ for the man cave** 🍺🎮📺
