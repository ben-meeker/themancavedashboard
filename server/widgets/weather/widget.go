package weather

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"themancavedashboard/shared"

	"github.com/go-chi/chi/v5"
)

// WeatherWidget handles weather data via OpenWeatherMap API
type WeatherWidget struct {
	apiKey string
	lat    string
	lon    string
}

// WeatherResponse is the data sent to the frontend
type WeatherResponse struct {
	Temp      int     `json:"temp"`
	FeelsLike int     `json:"feelsLike"`
	High      int     `json:"high"`
	Low       int     `json:"low"`
	Humidity  int     `json:"humidity"`
	WindSpeed float64 `json:"windSpeed"`
	Condition string  `json:"condition"`
}

// OpenWeatherResponse is the response from OpenWeatherMap API
type OpenWeatherResponse struct {
	Main struct {
		Temp      float64 `json:"temp"`
		FeelsLike float64 `json:"feels_like"`
		TempMin   float64 `json:"temp_min"`
		TempMax   float64 `json:"temp_max"`
		Humidity  int     `json:"humidity"`
	} `json:"main"`
	Weather []struct {
		Main        string `json:"main"`
		Description string `json:"description"`
	} `json:"weather"`
	Wind struct {
		Speed float64 `json:"speed"`
	} `json:"wind"`
}

// ID returns the widget identifier
func (w *WeatherWidget) ID() string {
	return "weather"
}

// GetRequiredEnvVars returns required environment variables
func (w *WeatherWidget) GetRequiredEnvVars() []string {
	return []string{
		"OPENWEATHER_API_KEY",
	}
}

// Initialize loads configuration
func (w *WeatherWidget) Initialize() error {
	w.apiKey = os.Getenv("OPENWEATHER_API_KEY")
	return nil
}

// RegisterRoutes registers HTTP endpoints
func (w *WeatherWidget) RegisterRoutes(r chi.Router) {
	r.Get("/weather", w.getData)
}

// getData handles GET /api/weather
func (w *WeatherWidget) getData(rw http.ResponseWriter, r *http.Request) {
	// Get lat/lon from widget config using shared helper
	lat := shared.GetWidgetConfigValue("weather", "latitude", "")
	lon := shared.GetWidgetConfigValue("weather", "longitude", "")

	// Fall back to env vars if not in config
	if lat == "" {
		lat = os.Getenv("WEATHER_LAT")
	}
	if lon == "" {
		lon = os.Getenv("WEATHER_LON")
	}

	if w.apiKey == "" || lat == "" || lon == "" {
		http.Error(rw, `{"error":"Weather API not configured"}`, http.StatusServiceUnavailable)
		return
	}

	url := fmt.Sprintf("https://api.openweathermap.org/data/2.5/weather?lat=%s&lon=%s&appid=%s&units=imperial", lat, lon, w.apiKey)

	resp, err := http.Get(url)
	if err != nil {
		http.Error(rw, `{"error":"Failed to fetch weather data"}`, http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(rw, `{"error":"Failed to read weather response"}`, http.StatusInternalServerError)
		return
	}

	if resp.StatusCode != http.StatusOK {
		http.Error(rw, fmt.Sprintf(`{"error":"Weather API error: %s"}`, string(body)), resp.StatusCode)
		return
	}

	var owData OpenWeatherResponse
	if err := json.Unmarshal(body, &owData); err != nil {
		http.Error(rw, `{"error":"Failed to parse weather data"}`, http.StatusInternalServerError)
		return
	}

	// Transform to frontend format
	condition := "Clear"
	if len(owData.Weather) > 0 {
		condition = owData.Weather[0].Main
	}

	response := WeatherResponse{
		Temp:      int(owData.Main.Temp),
		FeelsLike: int(owData.Main.FeelsLike),
		High:      int(owData.Main.TempMax),
		Low:       int(owData.Main.TempMin),
		Humidity:  owData.Main.Humidity,
		WindSpeed: owData.Wind.Speed,
		Condition: condition,
	}

	rw.Header().Set("Content-Type", "application/json")
	json.NewEncoder(rw).Encode(response)
}
