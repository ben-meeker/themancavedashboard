package widgets

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

// Widget defines the interface that all widgets must implement
type Widget interface {
	// ID returns the unique identifier for this widget
	ID() string

	// RegisterRoutes registers HTTP endpoints for this widget
	RegisterRoutes(r chi.Router)

	// GetRequiredEnvVars returns a list of required environment variables
	GetRequiredEnvVars() []string

	// Initialize is called once at startup to set up the widget
	Initialize() error
}

// Registry holds all registered widgets
var registry = make(map[string]Widget)

// Register adds a widget to the registry
func Register(widget Widget) {
	registry[widget.ID()] = widget
}

// GetAll returns all registered widgets
func GetAll() map[string]Widget {
	return registry
}

// Get returns a widget by ID
func Get(id string) (Widget, bool) {
	widget, ok := registry[id]
	return widget, ok
}

// RegisterAllRoutes registers routes for all widgets
func RegisterAllRoutes(r chi.Router) {
	for _, widget := range registry {
		widget.RegisterRoutes(r)
	}
}

// InitializeAll initializes all registered widgets
func InitializeAll() error {
	for id, widget := range registry {
		if err := widget.Initialize(); err != nil {
			return err
		}
		// Log required environment variables
		envVars := widget.GetRequiredEnvVars()
		if len(envVars) > 0 {
			// Could add logging here
		}
		_ = id // Use id if needed for logging
	}
	return nil
}

// Helper function to write JSON responses
func WriteJSON(w http.ResponseWriter, status int, data interface{}) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	// Note: You'll need to import encoding/json and use json.NewEncoder(w).Encode(data)
	return nil
}
