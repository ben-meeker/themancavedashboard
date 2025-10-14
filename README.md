# 🏠 The Man Cave Dashboard

A beautiful, customizable smart home dashboard that displays all your important information in one place. Perfect for wall-mounted displays, tablets, or any screen in your home.

## ✨ What This Dashboard Shows

- **📅 Calendar Events** - Your Google Calendar appointments and reminders
- **🍽️ Meal Planning** - Upcoming meals from your meal planning app
- **🌱 Plant Care** - Soil moisture levels for your houseplants
- **🚗 Tesla Status** - Your car's battery level and charging status
- **🌤️ Weather** - Current conditions and forecast
- **📸 Photo Slideshow** - Rotating display of your favorite photos
- **🗑️ Trash Day** - When to take out the garbage
- **💕 Anniversary Countdown** - Days until your special date

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Docker
If you don't have Docker installed:
- **Windows/Mac**: Download from [docker.com](https://www.docker.com/products/docker-desktop)
- **Linux**: Run `curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh`

### Step 2: Create Your Configuration Files
Create a folder for your dashboard:
```bash
mkdir my-dashboard
cd my-dashboard
```

Create your `config.json`:
```json
{
  "personal": {
    "anniversary_date": "2020-08-17",
    "trash_day": "Wednesday",
    "timezone": "America/Chicago"
  },
  "plant_sensors": {
    "soil_ch1": {
      "name": "My Fiddle Leaf Fig",
      "location": "Living Room",
      "min_moisture": 30,
      "max_moisture": 70
    }
  },
  "display": {
    "night_mode_start": "22:00",
    "night_mode_end": "07:00",
    "photo_rotation_seconds": 45,
    "refresh_interval_minutes": 5
  }
}
```

Create your `.env` file:
```env
# Timezone
TZ=America/Chicago

# API Credentials (add your keys here)
TESSIE_API_KEY=your_tessie_api_key
TESSIE_VIN=your_tesla_vin
OPENWEATHER_API_KEY=your_openweather_api_key
WEATHER_LAT=41.8781
WEATHER_LON=-87.6298
MEAL_ICAL_URL=https://your-meal-app.com/calendar.ics
ECOWITT_API_KEY=your_ecowitt_api_key
ECOWITT_APPLICATION_KEY=your_ecowitt_app_key
ECOWITT_GATEWAY_MAC=your_gateway_mac

# Google OAuth files
GOOGLE_CREDENTIALS_PATH=./credentials.json
GOOGLE_TOKEN_PATH=./token.json

# Main config file
CONFIG_PATH=./config.json

# Photos directory
PHOTOS_PATH=./photos
```

Create a `docker-compose.yml` file:
```yaml
version: '3.8'

services:
  dashboard:
    image: bemeeker/themancavedashboard:latest
    container_name: mancave-dashboard
    ports:
      - "3000:80"
    environment:
      - TZ=${TZ:-America/Chicago}
      - PORT=8080
      - ANNIVERSARY_DATE=${ANNIVERSARY_DATE:-}
      - TRASH_DAY=${TRASH_DAY:-}
      - TESSIE_API_KEY=${TESSIE_API_KEY:-}
      - TESSIE_VIN=${TESSIE_VIN:-}
      - OPENWEATHER_API_KEY=${OPENWEATHER_API_KEY:-}
      - WEATHER_LAT=${WEATHER_LAT:-}
      - WEATHER_LON=${WEATHER_LON:-}
      - MEAL_ICAL_URL=${MEAL_ICAL_URL:-}
      - ECOWITT_API_KEY=${ECOWITT_API_KEY:-}
      - ECOWITT_APPLICATION_KEY=${ECOWITT_APPLICATION_KEY:-}
      - ECOWITT_GATEWAY_MAC=${ECOWITT_GATEWAY_MAC:-}
      - GOOGLE_CREDENTIALS_PATH=${GOOGLE_CREDENTIALS_PATH:-}
      - GOOGLE_TOKEN_PATH=${GOOGLE_TOKEN_PATH:-}
      - CONFIG_PATH=${CONFIG_PATH:-./config.json}
    volumes:
      - ${GOOGLE_CREDENTIALS_PATH:-./credentials.json}:/app/credentials.json:ro
      - ${GOOGLE_TOKEN_PATH:-./token.json}:/app/token.json:ro
      - ${CONFIG_PATH:-./config.json}:/app/external-config.json:ro
      - dashboard-config:/app/config
      - ${PHOTOS_PATH:-./photos}:/usr/share/nginx/html/photos:ro
    restart: unless-stopped

volumes:
  dashboard-config:
    driver: local
```

### Step 3: Run the Dashboard
```bash
docker-compose up -d
```

Open your browser and go to `http://localhost:3000`

That's it! Your dashboard should be running. 🎉

## 🔧 Detailed Setup Guide

### Google Calendar Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Calendar API
4. Create credentials (OAuth 2.0 Client ID)
5. Download the credentials file as `credentials.json`
6. Place it in your project folder
7. The first time you run the dashboard, it will ask you to authorize access
8. After authorization, a `token.json` file will be created

### Tesla Setup (Optional)
1. Sign up at [Tessie](https://tessie.com/)
2. Connect your Tesla account
3. Get your API key and VIN from the Tessie dashboard
4. Add them to your `.env` file

### Weather Setup (Optional)
1. Sign up at [OpenWeatherMap](https://openweathermap.org/api)
2. Get your free API key
3. Find your city's latitude and longitude
4. Add them to your `.env` file

### Plant Sensors Setup (Optional)
1. Buy Ecowitt soil moisture sensors
2. Set up your Ecowitt gateway
3. Get your API credentials from the Ecowitt app
4. Add them to your `.env` file
5. Configure your plants in `config.json`

### Meal Planning Setup (Optional)
1. Use any meal planning app that exports iCal format
2. Get the iCal URL from your app
3. Add it to your `.env` file

### Photos Setup (Optional)
1. Create a `photos` folder in your project
2. Add your favorite photos (JPG, PNG, GIF, WebP supported)
3. The dashboard will automatically display them

## 📁 File Structure

```
themancavedashboard/
├── config.json              # Your personal settings
├── .env                     # Your API keys
├── credentials.json         # Google OAuth credentials
├── token.json              # Google OAuth token (auto-generated)
├── photos/                 # Your photos folder
├── docker-compose.yml      # Docker configuration
└── README.md              # This file
```

## ⚙️ Configuration Options

### Personal Settings (`config.json`)
```json
{
  "personal": {
    "anniversary_date": "2020-08-17",  // Your anniversary date
    "trash_day": "Wednesday",          // Day of the week for trash
    "timezone": "America/Chicago"      // Your timezone
  }
}
```

### Plant Sensors (`config.json`)
```json
{
  "plant_sensors": {
    "soil_ch1": {
      "name": "My Plant",           // What you call this plant
      "location": "Living Room",    // Where it's located
      "min_moisture": 30,          // When to water (low moisture)
      "max_moisture": 70           // When it's too wet
    }
  }
}
```

### Display Settings (`config.json`)
```json
{
  "display": {
    "night_mode_start": "22:00",        // When night mode starts
    "night_mode_end": "07:00",          // When night mode ends
    "photo_rotation_seconds": 45,       // How fast photos change
    "refresh_interval_minutes": 5       // How often data updates
  }
}
```

## 🐳 Docker Commands

```bash
# Start the dashboard
docker-compose up -d

# Stop the dashboard
docker-compose down

# View logs
docker-compose logs -f

# Restart the dashboard
docker-compose restart

# Update the dashboard
docker-compose pull
docker-compose up -d
```

## 🔍 Troubleshooting

### Dashboard Won't Start
- Check if Docker is running
- Make sure port 3000 isn't being used by another app
- Check the logs: `docker-compose logs`

### Calendar Not Working
- Make sure `credentials.json` and `token.json` are in the project folder
- Check if Google Calendar API is enabled
- Try deleting `token.json` and re-authorizing

### Plant Sensors Not Working
- Check your Ecowitt API credentials
- Make sure your gateway is online
- Verify the sensor channel numbers in your config

### Photos Not Showing
- Make sure photos are in the `photos` folder
- Check that photos are in supported formats (JPG, PNG, GIF, WebP)
- Verify the `PHOTOS_PATH` in your `.env` file

### Weather Not Working
- Check your OpenWeatherMap API key
- Verify your latitude and longitude coordinates
- Make sure you have API calls remaining in your plan

## 🎨 Customization

### Adding More Plant Sensors
Add more sensors to your `config.json`:
```json
{
  "plant_sensors": {
    "soil_ch1": { "name": "Plant 1", "location": "Living Room", "min_moisture": 30, "max_moisture": 70 },
    "soil_ch2": { "name": "Plant 2", "location": "Kitchen", "min_moisture": 25, "max_moisture": 65 },
    "soil_ch3": { "name": "Plant 3", "location": "Bedroom", "min_moisture": 35, "max_moisture": 75 }
  }
}
```

### Changing Display Settings
Modify the display settings in `config.json`:
```json
{
  "display": {
    "night_mode_start": "23:00",        // Later night mode
    "night_mode_end": "06:00",          // Earlier morning
    "photo_rotation_seconds": 30,       // Faster photo rotation
    "refresh_interval_minutes": 2       // More frequent updates
  }
}
```

## 🚀 Deployment

### For Home Use
The dashboard is perfect for:
- Wall-mounted tablets
- Kitchen displays
- Office monitors
- Any always-on screen

### For Remote Access
To access your dashboard from outside your home:
1. Set up port forwarding on your router (port 3000)
2. Use a dynamic DNS service
3. Consider using a VPN for security

## 🤝 Contributing

Found a bug or want to add a feature? We'd love your help!
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Credits

- **Frontend**: React + TypeScript + Vite
- **Backend**: Go
- **Containerization**: Docker
- **APIs**: Google Calendar, Tesla, OpenWeatherMap, Ecowitt
- **Icons**: Various open source icon sets

---

**Need help?** Open an issue on GitHub or check the troubleshooting section above.

**Enjoy your new dashboard!** 🎉