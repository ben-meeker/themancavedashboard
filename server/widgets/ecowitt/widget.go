package ecowitt

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"

	"github.com/go-chi/chi/v5"
)

// EcowittWidget handles Ecowitt weather station data
type EcowittWidget struct {
	apiKey string
	appKey string
	mac    string
}

// EcowittResponse is the data sent to the frontend
type EcowittResponse struct {
	Sensors []SoilMoistureSensor `json:"sensors"`
	Indoor  *IndoorSensor        `json:"indoor"`
}

// SoilMoistureSensor represents a soil moisture sensor
type SoilMoistureSensor struct {
	Channel        string  `json:"channel"`
	Name           string  `json:"name"`
	Location       string  `json:"location"`
	Moisture       int     `json:"moisture"`
	MoistureStatus string  `json:"moisture_status"`
	MinMoisture    float64 `json:"min_moisture"`
	MaxMoisture    float64 `json:"max_moisture"`
}

// IndoorSensor represents indoor environmental data
type IndoorSensor struct {
	Temperature float64 `json:"temperature"`
	Humidity    float64 `json:"humidity"`
	Pressure    float64 `json:"pressure"`
}

// EcowittAPIResponse is the response from Ecowitt API
type EcowittAPIResponse struct {
	Data map[string]interface{} `json:"data"`
}

// SoilSensorConfig holds configuration for a soil sensor
type SoilSensorConfig struct {
	Channel     string
	Name        string
	Location    string
	MinMoisture float64
	MaxMoisture float64
}

// ID returns the widget identifier
func (w *EcowittWidget) ID() string {
	return "ecowitt"
}

// GetRequiredEnvVars returns required environment variables
func (w *EcowittWidget) GetRequiredEnvVars() []string {
	return []string{
		"ECOWITT_API_KEY",
		"ECOWITT_APPLICATION_KEY",
		"ECOWITT_GATEWAY_MAC",
	}
}

// Initialize loads configuration
func (w *EcowittWidget) Initialize() error {
	w.apiKey = os.Getenv("ECOWITT_API_KEY")
	w.appKey = os.Getenv("ECOWITT_APPLICATION_KEY")
	w.mac = os.Getenv("ECOWITT_GATEWAY_MAC")
	return nil
}

// RegisterRoutes registers HTTP endpoints
func (w *EcowittWidget) RegisterRoutes(r chi.Router) {
	r.Get("/ecowitt", w.getData)
}

// getData handles GET /api/ecowitt
func (w *EcowittWidget) getData(rw http.ResponseWriter, r *http.Request) {
	if w.apiKey == "" || w.appKey == "" || w.mac == "" {
		http.Error(rw, `{"error":"Ecowitt API not configured"}`, http.StatusServiceUnavailable)
		return
	}

	url := fmt.Sprintf("https://api.ecowitt.net/api/v3/device/real_time?application_key=%s&api_key=%s&mac=%s&call_back=all",
		w.appKey, w.apiKey, w.mac)

	resp, err := http.Get(url)
	if err != nil {
		http.Error(rw, `{"error":"Failed to fetch Ecowitt data"}`, http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(rw, `{"error":"Failed to read Ecowitt response"}`, http.StatusInternalServerError)
		return
	}

	if resp.StatusCode != http.StatusOK {
		http.Error(rw, fmt.Sprintf(`{"error":"Ecowitt API error: %s"}`, string(body)), resp.StatusCode)
		return
	}

	var apiResp EcowittAPIResponse
	if err := json.Unmarshal(body, &apiResp); err != nil {
		http.Error(rw, `{"error":"Failed to parse Ecowitt data"}`, http.StatusInternalServerError)
		return
	}

	response := EcowittResponse{
		Sensors: []SoilMoistureSensor{},
	}

	// Get sensor config from ecowitt widget config
	sensorConfigs := w.getSensorConfigs()

	for i := 1; i <= 8; i++ {
		channelKey := fmt.Sprintf("soil_ch%d", i)

		// Try to get moisture value from nested structure
		var moistureVal float64
		var foundMoisture bool

		if channelData, ok := apiResp.Data[channelKey].(map[string]interface{}); ok {
			// Look for soilmoisture nested object
			if soilmoistureData, ok := channelData["soilmoisture"].(map[string]interface{}); ok {
				// Value can be string, float64, or int
				switch val := soilmoistureData["value"].(type) {
				case float64:
					moistureVal = val
					foundMoisture = true
				case int:
					moistureVal = float64(val)
					foundMoisture = true
				case string:
					moistureVal = parseFloat(val)
					if moistureVal > 0 {
						foundMoisture = true
					}
				}
			}
		}

		if foundMoisture {
			// Get sensor config for this channel
			sensorConfig, exists := sensorConfigs[channelKey]
			if !exists {
				// Use defaults if not configured
				sensorConfig = SoilSensorConfig{
					Channel:     channelKey,
					Name:        fmt.Sprintf("Sensor %d", i),
					Location:    "Unknown",
					MinMoisture: 30,
					MaxMoisture: 70,
				}
			}

			sensor := SoilMoistureSensor{
				Channel:     channelKey,
				Name:        sensorConfig.Name,
				Location:    sensorConfig.Location,
				Moisture:    int(moistureVal),
				MinMoisture: sensorConfig.MinMoisture,
				MaxMoisture: sensorConfig.MaxMoisture,
			}

			// Determine moisture status using config ranges
			if moistureVal < sensorConfig.MinMoisture {
				sensor.MoistureStatus = "low"
			} else if moistureVal > sensorConfig.MaxMoisture {
				sensor.MoistureStatus = "high"
			} else {
				sensor.MoistureStatus = "good"
			}

			response.Sensors = append(response.Sensors, sensor)
		}
	}

	// Parse indoor sensor data
	indoor := &IndoorSensor{}
	hasIndoorData := false

	// Indoor data structure: indoor -> temperature -> value
	if indoorData, ok := apiResp.Data["indoor"].(map[string]interface{}); ok {
		if tempData, ok := indoorData["temperature"].(map[string]interface{}); ok {
			switch val := tempData["value"].(type) {
			case float64:
				indoor.Temperature = val
				hasIndoorData = true
			case string:
				indoor.Temperature = parseFloat(val)
				hasIndoorData = true
			}
		}

		if humData, ok := indoorData["humidity"].(map[string]interface{}); ok {
			switch val := humData["value"].(type) {
			case float64:
				indoor.Humidity = val
				hasIndoorData = true
			case string:
				indoor.Humidity = parseFloat(val)
				hasIndoorData = true
			}
		}
	}

	// Pressure data structure: pressure -> relative -> value
	if pressData, ok := apiResp.Data["pressure"].(map[string]interface{}); ok {
		if relativeData, ok := pressData["relative"].(map[string]interface{}); ok {
			switch val := relativeData["value"].(type) {
			case float64:
				indoor.Pressure = val
				hasIndoorData = true
			case string:
				indoor.Pressure = parseFloat(val)
				hasIndoorData = true
			}
		}
	}

	if hasIndoorData {
		response.Indoor = indoor
	}

	rw.Header().Set("Content-Type", "application/json")
	json.NewEncoder(rw).Encode(response)
}

// getSensorConfigs reads sensor configuration from config.json
// TODO: This should access the main config system
// Config structs to load sensor config from config.json
type ecowittWidgetConfigEntry struct {
	ID       string                 `json:"id"`
	Location map[string]interface{} `json:"location"`
	Config   map[string]interface{} `json:"config"`
}

type ecowittDashboardConfig struct {
	Global  map[string]interface{}     `json:"global"`
	Widgets []ecowittWidgetConfigEntry `json:"widgets"`
}

func (w *EcowittWidget) getSensorConfigs() map[string]SoilSensorConfig {
	configs := make(map[string]SoilSensorConfig)

	// Load from config.json
	configPath := "/app/external-config.json"
	configData, err := os.ReadFile(configPath)
	if err != nil {
		return configs
	}

	var cfg ecowittDashboardConfig
	if err := json.Unmarshal(configData, &cfg); err != nil {
		return configs
	}

	// Find plants widget
	for _, widget := range cfg.Widgets {
		if widget.ID == "plants" {
			// Get sensors array from config
			if sensorsInterface, ok := widget.Config["sensors"].([]interface{}); ok {
				for _, sensorInterface := range sensorsInterface {
					if sensorMap, ok := sensorInterface.(map[string]interface{}); ok {
						channel, _ := sensorMap["channel"].(string)
						name, _ := sensorMap["name"].(string)

						var idealMin, idealMax float64
						if minVal, ok := sensorMap["ideal_min"].(float64); ok {
							idealMin = minVal
						}
						if maxVal, ok := sensorMap["ideal_max"].(float64); ok {
							idealMax = maxVal
						}

						if channel != "" {
							configs[channel] = SoilSensorConfig{
								Channel:     channel,
								Name:        name,
								Location:    "", // Not used
								MinMoisture: idealMin,
								MaxMoisture: idealMax,
							}
						}
					}
				}
			}
			break
		}
	}

	return configs
}

// Helper functions
func parseFloat(val interface{}) float64 {
	switch v := val.(type) {
	case float64:
		return v
	case string:
		f, _ := strconv.ParseFloat(v, 64)
		return f
	default:
		return 0
	}
}
