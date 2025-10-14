package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
)

type EcowittResponse struct {
	Sensors []SoilMoistureSensor `json:"sensors"`
	Indoor  *IndoorSensor        `json:"indoor"`
}

type SoilMoistureSensor struct {
	Channel        string `json:"channel"`
	Name           string `json:"name"`
	Location       string `json:"location"`
	Moisture       int    `json:"moisture"`
	MoistureStatus string `json:"moisture_status"`
}

type IndoorSensor struct {
	Temperature float64 `json:"temperature"`
	Humidity    float64 `json:"humidity"`
	Pressure    float64 `json:"pressure"`
}

type EcowittAPIResponse struct {
	Data map[string]interface{} `json:"data"`
}

func getEcowittData(w http.ResponseWriter, r *http.Request) {
	cfg := getConfig()
	apiKey := cfg.Ecowitt.APIKey
	appKey := cfg.Ecowitt.ApplicationKey
	mac := cfg.Ecowitt.GatewayMAC

	if apiKey == "" || appKey == "" || mac == "" {
		http.Error(w, `{"error":"Ecowitt API not configured"}`, http.StatusServiceUnavailable)
		return
	}

	url := fmt.Sprintf("https://api.ecowitt.net/api/v3/device/real_time?application_key=%s&api_key=%s&mac=%s&call_back=all",
		appKey, apiKey, mac)

	resp, err := http.Get(url)
	if err != nil {
		http.Error(w, `{"error":"Failed to fetch Ecowitt data"}`, http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, `{"error":"Failed to read Ecowitt response"}`, http.StatusInternalServerError)
		return
	}

	if resp.StatusCode != http.StatusOK {
		http.Error(w, fmt.Sprintf(`{"error":"Ecowitt API error: %s"}`, string(body)), resp.StatusCode)
		return
	}

	var apiResp EcowittAPIResponse
	if err := json.Unmarshal(body, &apiResp); err != nil {
		http.Error(w, `{"error":"Failed to parse Ecowitt data"}`, http.StatusInternalServerError)
		return
	}

	response := EcowittResponse{
		Sensors: []SoilMoistureSensor{},
	}

	// Get sensor names from config
	sensorNames := make(map[string]string)
	fmt.Printf("[Ecowitt] Plant sensors in config: %+v\n", config.PlantSensors)
	for key, sensorConfig := range config.PlantSensors {
		sensorNames[key] = sensorConfig.Name
		fmt.Printf("[Ecowitt] Sensor %s -> %s\n", key, sensorConfig.Name)
	}

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
			sensorConfig := GetPlantSensorConfig(channelKey)
			sensor := SoilMoistureSensor{
				Channel:  channelKey,
				Name:     sensorConfig.Name,
				Location: sensorConfig.Location,
				Moisture: int(moistureVal),
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

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func celsiusToFahrenheit(c float64) float64 {
	return (c * 9 / 5) + 32
}

func hpaToInHg(hpa float64) float64 {
	return hpa * 0.02953
}

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
