package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// DashboardLayout is the structure expected by the frontend
type DashboardLayout struct {
	Version      string                 `json:"version"`
	GridColumns  int                    `json:"gridColumns"`
	GridRows     int                    `json:"gridRows"`
	Widgets      []WidgetInstance       `json:"widgets"`
	LastModified string                 `json:"lastModified"`
	Global       map[string]interface{} `json:"global,omitempty"`
}

// WidgetInstance represents a widget in the layout
type WidgetInstance struct {
	ID       string                 `json:"id"`
	WidgetID string                 `json:"widgetId"`
	Position GridPosition           `json:"position"`
	Config   map[string]interface{} `json:"config,omitempty"`
}

// GridPosition represents a widget's position and size
type GridPosition struct {
	X      int `json:"x"`
	Y      int `json:"y"`
	Width  int `json:"width"`
	Height int `json:"height"`
}

func getDashboardLayout(w http.ResponseWriter, r *http.Request) {
	config := getDashboardConfig()

	// Convert config-based layout to frontend DashboardLayout format
	widgetInstances := make([]WidgetInstance, 0, len(config.Widgets))

	for _, widget := range config.Widgets {
		// Use size from config if available, otherwise frontend will use defaultSize
		width := widget.Location.Width
		height := widget.Location.Height

		// If size not in config, use a reasonable default (frontend will override with actual size)
		if width == 0 {
			width = 1
		}
		if height == 0 {
			height = 1
		}

		widgetInstances = append(widgetInstances, WidgetInstance{
			ID:       fmt.Sprintf("%s-%d", widget.ID, widget.Location.X*100+widget.Location.Y),
			WidgetID: widget.ID,
			Position: GridPosition{
				X:      widget.Location.X,
				Y:      widget.Location.Y,
				Width:  width,
				Height: height,
			},
			Config: widget.Config,
		})
	}

	// Convert Global config to map for frontend
	globalMap := make(map[string]interface{})
	globalBytes, _ := json.Marshal(config.Global)
	json.Unmarshal(globalBytes, &globalMap)
	
	layout := DashboardLayout{
		Version:      "2.0",
		GridColumns:  config.Global.GridColumns,
		GridRows:     config.Global.GridRows,
		Widgets:      widgetInstances,
		LastModified: "",
		Global:       globalMap,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(layout)
}

func saveDashboardLayout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, `{"error":"Failed to read request body"}`, http.StatusBadRequest)
		return
	}

	var layout DashboardLayout
	if err := json.Unmarshal(body, &layout); err != nil {
		http.Error(w, `{"error":"Invalid JSON"}`, http.StatusBadRequest)
		return
	}

	// Convert frontend layout back to config format
	configLock.Lock()
	defer configLock.Unlock()

	// Update grid size
	dashboardConfig.Global.GridColumns = layout.GridColumns
	dashboardConfig.Global.GridRows = layout.GridRows

	// Update widgets (preserve existing config, just update positions)
	newWidgets := make([]WidgetConfig, 0, len(layout.Widgets))
	for _, widget := range layout.Widgets {
		// Find existing widget config
		var existingConfig map[string]interface{}
		for _, existing := range dashboardConfig.Widgets {
			if existing.ID == widget.WidgetID {
				existingConfig = existing.Config
				break
			}
		}

		// If no existing config, try to get from the widget instance
		if existingConfig == nil && widget.Config != nil {
			existingConfig = widget.Config
		} else if existingConfig == nil {
			existingConfig = make(map[string]interface{})
		}

		newWidgets = append(newWidgets, WidgetConfig{
			ID: widget.WidgetID,
			Location: WidgetLocation{
				X:      widget.Position.X,
				Y:      widget.Position.Y,
				Width:  widget.Position.Width,
				Height: widget.Position.Height,
			},
			Config: existingConfig,
		})
	}

	dashboardConfig.Widgets = newWidgets

	// Save to file
	if err := saveConfig(); err != nil {
		http.Error(w, `{"error":"Failed to save config"}`, http.StatusInternalServerError)
		return
	}

	fmt.Printf("[Layout] Dashboard layout saved\n")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Layout saved successfully",
	})
}
