package template

import (
	"encoding/json"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
)

// TemplateWidget implements the Widget interface
type TemplateWidget struct {
	apiKey string
}

// ID returns the unique identifier for this widget
func (w *TemplateWidget) ID() string {
	return "template"
}

// GetRequiredEnvVars returns environment variables this widget needs
func (w *TemplateWidget) GetRequiredEnvVars() []string {
	return []string{
		// "TEMPLATE_API_KEY",
	}
}

// Initialize sets up the widget on startup
func (w *TemplateWidget) Initialize() error {
	// Load environment variables
	w.apiKey = os.Getenv("TEMPLATE_API_KEY")

	// Perform any initialization logic here
	// - Connect to databases
	// - Validate configuration
	// - Set up background tasks

	return nil
}

// RegisterRoutes registers all HTTP endpoints for this widget
func (w *TemplateWidget) RegisterRoutes(r chi.Router) {
	// Register your endpoints here
	// r.Get("/template", w.getData)
	// r.Post("/template/action", w.performAction)
}

// Example endpoint handler
func (w *TemplateWidget) getData(rw http.ResponseWriter, r *http.Request) {
	data := map[string]interface{}{
		"status":  "ok",
		"message": "Hello from template widget!",
	}

	rw.Header().Set("Content-Type", "application/json")
	rw.WriteHeader(http.StatusOK)
	json.NewEncoder(rw).Encode(data)
}

// To register this widget, add it to server/widgets/register.go:
// import "themancavedashboard/widgets/template"
// func init() { Register(&template.TemplateWidget{}) }
