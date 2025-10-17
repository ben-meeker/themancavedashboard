package main

import (
	"encoding/json"
	"fmt"
	"os"
	"sync"
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

// WidgetLocation stores widget position and size on the grid
type WidgetLocation struct {
	X      int `json:"x"`
	Y      int `json:"y"`
	Width  int `json:"width,omitempty"`  // Optional: frontend provides this
	Height int `json:"height,omitempty"` // Optional: frontend provides this
}

// WidgetConfig stores a widget instance with its position and config
type WidgetConfig struct {
	ID       string                 `json:"id"`
	Location WidgetLocation         `json:"location"`
	Config   map[string]interface{} `json:"config"`
}

// DashboardConfig is the new unified config structure
type DashboardConfig struct {
	Global  GlobalConfig   `json:"global"`
	Widgets []WidgetConfig `json:"widgets"`
}

var (
	dashboardConfig    DashboardConfig
	configLock         sync.RWMutex
	externalConfigFile = "/app/external-config.json"
)

// Load configuration from file or environment variables
func loadConfig() {
	configLock.Lock()
	defer configLock.Unlock()

	// Ensure config directory exists
	os.MkdirAll("/app/config", 0755)

	// Try to load from external config file first (user's config.json)
	if data, err := os.ReadFile(externalConfigFile); err == nil {
		fmt.Printf("[Config] Loading config from %s\n", externalConfigFile)
		if err := json.Unmarshal(data, &dashboardConfig); err == nil {
			fmt.Printf("[Config] Config loaded successfully\n")
		} else {
			fmt.Printf("[Config] Failed to parse config: %v\n", err)
		}
	} else {
		fmt.Printf("[Config] Config file not found: %v\n", err)
	}

	// Initialize global config with defaults if not set
	if dashboardConfig.Global.Timezone == "" {
		dashboardConfig.Global.Timezone = os.Getenv("TZ")
		if dashboardConfig.Global.Timezone == "" {
			dashboardConfig.Global.Timezone = "America/Chicago"
		}
	}
	if dashboardConfig.Global.NightModeStart == "" {
		dashboardConfig.Global.NightModeStart = "22:00"
	}
	if dashboardConfig.Global.NightModeEnd == "" {
		dashboardConfig.Global.NightModeEnd = "07:00"
	}
	if dashboardConfig.Global.PhotoRotationSeconds == 0 {
		dashboardConfig.Global.PhotoRotationSeconds = 45
	}
	if dashboardConfig.Global.RefreshIntervalMinutes == 0 {
		dashboardConfig.Global.RefreshIntervalMinutes = 5
	}
	if dashboardConfig.Global.GridColumns == 0 {
		dashboardConfig.Global.GridColumns = 6
	}
	if dashboardConfig.Global.GridRows == 0 {
		dashboardConfig.Global.GridRows = 4
	}

	// Initialize widgets array if nil
	if dashboardConfig.Widgets == nil {
		dashboardConfig.Widgets = []WidgetConfig{}
	}

	fmt.Printf("[Config] Loaded %d widgets\n", len(dashboardConfig.Widgets))
}

// Save configuration to file
// NOTE: Caller must hold configLock
func saveConfig() error {
	data, err := json.MarshalIndent(dashboardConfig, "", "  ")
	if err != nil {
		return err
	}

	// For bind-mounted files, we need to truncate and write directly
	// instead of using WriteFile which tries to create a temp file
	file, err := os.OpenFile(externalConfigFile, os.O_WRONLY|os.O_TRUNC, 0644)
	if err != nil {
		return fmt.Errorf("failed to open config file: %w", err)
	}
	defer file.Close()

	if _, err := file.Write(data); err != nil {
		return fmt.Errorf("failed to write config file: %w", err)
	}

	return nil
}

// Get a copy of the current dashboard config (thread-safe)
// Reloads config from disk on every call to ensure freshness
func getDashboardConfig() DashboardConfig {
	configLock.Lock()
	defer configLock.Unlock()

	// Reload config from file on every request
	if data, err := os.ReadFile(externalConfigFile); err == nil {
		var tempConfig DashboardConfig
		if err := json.Unmarshal(data, &tempConfig); err == nil {
			// Apply defaults
			if tempConfig.Global.Timezone == "" {
				tempConfig.Global.Timezone = os.Getenv("TZ")
				if tempConfig.Global.Timezone == "" {
					tempConfig.Global.Timezone = "America/Chicago"
				}
			}
			if tempConfig.Global.NightModeStart == "" {
				tempConfig.Global.NightModeStart = "22:00"
			}
			if tempConfig.Global.NightModeEnd == "" {
				tempConfig.Global.NightModeEnd = "07:00"
			}
			if tempConfig.Global.PhotoRotationSeconds == 0 {
				tempConfig.Global.PhotoRotationSeconds = 45
			}
			if tempConfig.Global.RefreshIntervalMinutes == 0 {
				tempConfig.Global.RefreshIntervalMinutes = 5
			}
			if tempConfig.Global.GridColumns == 0 {
				tempConfig.Global.GridColumns = 6
			}
			if tempConfig.Global.GridRows == 0 {
				tempConfig.Global.GridRows = 4
			}
			if tempConfig.Widgets == nil {
				tempConfig.Widgets = []WidgetConfig{}
			}
			dashboardConfig = tempConfig
		}
	}

	return dashboardConfig
}

// Get widget config by ID
func getWidgetConfig(widgetID string) (map[string]interface{}, bool) {
	configLock.RLock()
	defer configLock.RUnlock()

	for _, widget := range dashboardConfig.Widgets {
		if widget.ID == widgetID {
			return widget.Config, true
		}
	}
	return nil, false
}
