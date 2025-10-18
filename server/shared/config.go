package shared

import (
	"encoding/json"
	"os"
	"sync"
)

var (
	configLock         sync.RWMutex
	externalConfigFile = "/app/config/config.json"
)

// GlobalConfig stores dashboard-wide settings
type GlobalConfig struct {
	Timezone               string `json:"timezone"`
	NightModeStart         string `json:"night_mode_start"`
	NightModeEnd           string `json:"night_mode_end"`
	PhotoRotationSeconds   int    `json:"photo_rotation_seconds"`
	RefreshIntervalMinutes int    `json:"refresh_interval_minutes"`
	GridColumns            int    `json:"grid_columns"`
	GridRows               int    `json:"grid_rows"`
}

// DashboardConfig is the unified config structure
type DashboardConfig struct {
	Global  GlobalConfig             `json:"global"`
	Widgets []map[string]interface{} `json:"widgets"`
}

// GetWidgetConfigValue gets a value from a specific widget's config
func GetWidgetConfigValue(widgetID string, key string, defaultValue string) string {
	configLock.RLock()
	defer configLock.RUnlock()

	// Read config from file
	data, err := os.ReadFile(externalConfigFile)
	if err != nil {
		return defaultValue
	}

	var config DashboardConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return defaultValue
	}

	// Find the widget config
	for _, widget := range config.Widgets {
		if id, ok := widget["id"].(string); ok && id == widgetID {
			if widgetConfig, ok := widget["config"].(map[string]interface{}); ok {
				if value, ok := widgetConfig[key].(string); ok && value != "" {
					return value
				}
			}
		}
	}

	return defaultValue
}
