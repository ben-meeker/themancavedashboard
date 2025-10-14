package main

import (
	"encoding/json"
	"fmt"
	"os"
	"sync"
)

// PlantSensorConfig stores configuration for individual plant sensors
type PlantSensorConfig struct {
	Name        string  `json:"name"`
	Location    string  `json:"location"`
	MinMoisture float64 `json:"min_moisture"`
	MaxMoisture float64 `json:"max_moisture"`
}

// DisplayConfig stores display and timing settings
type DisplayConfig struct {
	NightModeStart         string `json:"night_mode_start"`
	NightModeEnd           string `json:"night_mode_end"`
	PhotoRotationSeconds   int    `json:"photo_rotation_seconds"`
	RefreshIntervalMinutes int    `json:"refresh_interval_minutes"`
}

// Config stores all API credentials and settings
type Config struct {
	Personal struct {
		AnniversaryDate string `json:"anniversary_date"` // Format: YYYY-MM-DD
		TrashDay        string `json:"trash_day"`        // Day of week
		Timezone        string `json:"timezone"`         // Timezone (e.g., America/Chicago)
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

	PlantSensors map[string]PlantSensorConfig `json:"plant_sensors"`
	Display      DisplayConfig                `json:"display"`
}

var (
	config             Config
	configLock         sync.RWMutex
	configFile         = "/app/config/config.json"
	externalConfigFile = "/app/external-config.json"
)

// GetPlantSensorConfig returns the configuration for a specific plant sensor
func GetPlantSensorConfig(sensorKey string) PlantSensorConfig {
	configLock.RLock()
	defer configLock.RUnlock()

	if sensor, exists := config.PlantSensors[sensorKey]; exists {
		return sensor
	}

	// Return default config if not found
	return PlantSensorConfig{
		Name:        "Unknown Plant",
		Location:    "Unknown Location",
		MinMoisture: 30,
		MaxMoisture: 70,
	}
}

// Load configuration from file or environment variables
func loadConfig() {
	configLock.Lock()
	defer configLock.Unlock()

	// Ensure config directory exists
	os.MkdirAll("/app/config", 0755)

	// Try to load from internal config file first (for API keys)
	if data, err := os.ReadFile(configFile); err == nil {
		fmt.Printf("[Config] Loading internal config from %s\n", configFile)
		if err := json.Unmarshal(data, &config); err == nil {
			fmt.Printf("[Config] Internal config loaded successfully\n")
		} else {
			fmt.Printf("[Config] Failed to parse internal config: %v\n", err)
		}
	} else {
		fmt.Printf("[Config] Internal config file not found: %v\n", err)
	}

	// Try to load from external config file (for personal settings and plant sensors)
	if data, err := os.ReadFile(externalConfigFile); err == nil {
		fmt.Printf("[Config] Loading external config from %s\n", externalConfigFile)
		var externalConfig Config
		if err := json.Unmarshal(data, &externalConfig); err == nil {
			fmt.Printf("[Config] External config loaded successfully\n")
			// Merge external config into main config (overwrite personal and plant settings)
			config.Personal = externalConfig.Personal
			config.PlantSensors = externalConfig.PlantSensors
			config.Display = externalConfig.Display
		} else {
			fmt.Printf("[Config] Failed to parse external config: %v\n", err)
		}
	} else {
		fmt.Printf("[Config] External config file not found: %v\n", err)
	}

	// Fallback to environment variables (for backward compatibility)
	config.Personal.AnniversaryDate = os.Getenv("ANNIVERSARY_DATE")
	config.Personal.TrashDay = os.Getenv("TRASH_DAY")
	config.Personal.Timezone = os.Getenv("TZ")

	// Initialize plant sensors if not loaded from file
	if config.PlantSensors == nil {
		config.PlantSensors = make(map[string]PlantSensorConfig)
	}

	// Initialize display config with defaults
	if config.Display.NightModeStart == "" {
		config.Display.NightModeStart = "22:00"
	}
	if config.Display.NightModeEnd == "" {
		config.Display.NightModeEnd = "07:00"
	}
	if config.Display.PhotoRotationSeconds == 0 {
		config.Display.PhotoRotationSeconds = 45
	}
	if config.Display.RefreshIntervalMinutes == 0 {
		config.Display.RefreshIntervalMinutes = 5
	}

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
