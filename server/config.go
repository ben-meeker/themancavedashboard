package main

import (
	"encoding/json"
	"os"
	"sync"
)

// Config stores all API credentials and settings
type Config struct {
	Personal struct {
		AnniversaryDate string `json:"anniversary_date"` // Format: YYYY-MM-DD
		TrashDay        string `json:"trash_day"`        // Day of week
	} `json:"personal"`

	Tesla struct {
		APIKey string `json:"api_key"`
		VIN    string `json:"vin"`
	} `json:"tesla"`

	Weather struct {
		APIKey string `json:"api_key"`
		Lat    string `json:"lat"`
		Lon    string `json:"lon"`
	} `json:"weather"`

	Meals struct {
		ICalURL string `json:"ical_url"`
	} `json:"meals"`

	Ecowitt struct {
		APIKey         string `json:"api_key"`
		ApplicationKey string `json:"application_key"`
		GatewayMAC     string `json:"gateway_mac"`
	} `json:"ecowitt"`
}

var (
	config     Config
	configLock sync.RWMutex
	configFile = "/app/config/config.json"
)

// Load configuration from file or environment variables
func loadConfig() {
	configLock.Lock()
	defer configLock.Unlock()

	// Ensure config directory exists
	os.MkdirAll("/app/config", 0755)

	// Try to load from config file first
	if data, err := os.ReadFile(configFile); err == nil {
		if err := json.Unmarshal(data, &config); err == nil {
			return
		}
	}

	// Fallback to environment variables (for backward compatibility)
	config.Personal.AnniversaryDate = os.Getenv("ANNIVERSARY_DATE")
	config.Personal.TrashDay = os.Getenv("TRASH_DAY")

	config.Tesla.APIKey = os.Getenv("TESSIE_API_KEY")
	config.Tesla.VIN = os.Getenv("TESSIE_VIN")

	config.Weather.APIKey = os.Getenv("OPENWEATHER_API_KEY")
	config.Weather.Lat = os.Getenv("WEATHER_LAT")
	config.Weather.Lon = os.Getenv("WEATHER_LON")

	config.Meals.ICalURL = os.Getenv("MEAL_ICAL_URL")

	config.Ecowitt.APIKey = os.Getenv("ECOWITT_API_KEY")
	config.Ecowitt.ApplicationKey = os.Getenv("ECOWITT_APPLICATION_KEY")
	config.Ecowitt.GatewayMAC = os.Getenv("ECOWITT_GATEWAY_MAC")
}

// Save configuration to file
func saveConfig() error {
	configLock.RLock()
	defer configLock.RUnlock()

	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(configFile, data, 0644)
}

// Get a copy of the current config (thread-safe)
func getConfig() Config {
	configLock.RLock()
	defer configLock.RUnlock()
	return config
}

// Update Tesla config
func updateTeslaConfig(apiKey, vin string) error {
	configLock.Lock()
	config.Tesla.APIKey = apiKey
	config.Tesla.VIN = vin
	configLock.Unlock()
	return saveConfig()
}

// Update Weather config
func updateWeatherConfig(apiKey, lat, lon string) error {
	configLock.Lock()
	config.Weather.APIKey = apiKey
	config.Weather.Lat = lat
	config.Weather.Lon = lon
	configLock.Unlock()
	return saveConfig()
}

// Update Meals config
func updateMealsConfig(icalURL string) error {
	configLock.Lock()
	config.Meals.ICalURL = icalURL
	configLock.Unlock()
	return saveConfig()
}

// Update Ecowitt config
func updateEcowittConfig(apiKey, appKey, mac string) error {
	configLock.Lock()
	config.Ecowitt.APIKey = apiKey
	config.Ecowitt.ApplicationKey = appKey
	config.Ecowitt.GatewayMAC = mac
	configLock.Unlock()
	return saveConfig()
}

// Update Personal config
func updatePersonalConfig(anniversaryDate, trashDay string) error {
	configLock.Lock()
	config.Personal.AnniversaryDate = anniversaryDate
	config.Personal.TrashDay = trashDay
	configLock.Unlock()
	return saveConfig()
}
