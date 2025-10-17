package personal

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

// PersonalWidget handles personal configuration (anniversaries, trash day, etc.)
type PersonalWidget struct{}

// PersonalConfigResponse represents user's personal settings
type PersonalConfigResponse struct {
	AnniversaryDate string `json:"anniversary_date"` // Format: YYYY-MM-DD
	TrashDay        string `json:"trash_day"`        // Day of week (e.g., "Wednesday")
}

// ID returns the widget identifier
func (w *PersonalWidget) ID() string {
	return "personal"
}

// GetRequiredEnvVars returns required environment variables
func (w *PersonalWidget) GetRequiredEnvVars() []string {
	return []string{} // Uses config.json
}

// Initialize loads configuration
func (w *PersonalWidget) Initialize() error {
	return nil
}

// RegisterRoutes registers HTTP endpoints
func (w *PersonalWidget) RegisterRoutes(r chi.Router) {
	r.Get("/personal/config", w.getConfig)
}

// getConfig handles GET /api/personal/config
func (w *PersonalWidget) getConfig(rw http.ResponseWriter, r *http.Request) {
	response := PersonalConfigResponse{
		AnniversaryDate: "2020-08-17", // Default
		TrashDay:        "Wednesday",  // Default
	}

	// TODO: Get config from calendar widget in config.json
	// For now, using defaults

	rw.Header().Set("Content-Type", "application/json")
	json.NewEncoder(rw).Encode(response)
}
