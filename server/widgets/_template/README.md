# Backend Widget Template

This template shows how to create a backend widget with its own API endpoints.

## Quick Start

1. **Copy this folder** and rename it to your widget name (e.g., `mywidget`)
2. **Edit `widget.go`** with your widget logic
3. **Update the `init()` function** to register your widget
4. **Import your widget** in `server/widgets/register.go`

## File Structure

```
mywidget/
├── README.md          # This file (optional)
├── widget.go          # Widget implementation
└── types.go          # Custom types (optional)
```

## Widget Implementation (`widget.go`)

```go
package mywidget

import (
	"encoding/json"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
)

// MyWidget implements the Widget interface
type MyWidget struct {
	apiKey string
}

// ID returns the unique identifier
func (w *MyWidget) ID() string {
	return "mywidget"
}

// GetRequiredEnvVars returns required environment variables
func (w *MyWidget) GetRequiredEnvVars() []string {
	return []string{"MY_API_KEY"}
}

// Initialize sets up the widget
func (w *MyWidget) Initialize() error {
	w.apiKey = os.Getenv("MY_API_KEY")
	return nil
}

// RegisterRoutes registers HTTP endpoints
func (w *MyWidget) RegisterRoutes(r chi.Router) {
	r.Get("/mywidget", w.getData)
	r.Post("/mywidget/action", w.performAction)
}

// getData handles GET /api/mywidget
func (w *MyWidget) getData(rw http.ResponseWriter, r *http.Request) {
	data := map[string]string{
		"status": "ok",
		"value":  "Hello from my widget!",
	}
	
	rw.Header().Set("Content-Type", "application/json")
	json.NewEncoder(rw).Encode(data)
}

// performAction handles POST /api/mywidget/action
func (w *MyWidget) performAction(rw http.ResponseWriter, r *http.Request) {
	// Your action logic here
	rw.WriteHeader(http.StatusOK)
}
```

## Registration

To register your widget, add it to `server/widgets/register.go`:

```go
import (
	"themancavedashboard/widgets/mywidget"
)

func init() {
	Register(&mywidget.MyWidget{})
	// ... other widgets
}
```

## Configuration Access

To access widget configuration from `config.json`:

```go
import "path/to/config" // Your config package

func (w *MyWidget) Initialize() error {
	// Get widget config from config.json
	widgetConfig := config.GetWidgetConfig("mywidget")
	
	// Access specific config values
	if setting, ok := widgetConfig["my_setting"].(string); ok {
		w.mySetting = setting
	}
	
	return nil
}
```

## Best Practices

- **Keep it self-contained**: All widget logic in its own folder
- **Handle errors gracefully**: Return proper HTTP status codes
- **Use environment variables for secrets**: API keys, passwords, etc.
- **Use config.json for settings**: User-configurable values
- **Log important events**: Help with debugging
- **Validate inputs**: Always validate request data

## Testing Your Widget

1. Import in `server/widgets/register.go`:
   ```go
   import _ "path/to/widgets/mywidget"
   ```

2. Rebuild and restart:
   ```bash
   docker-compose build && docker-compose up -d
   ```

3. Test endpoint:
   ```bash
   curl http://localhost:3000/api/mywidget
   ```

## Examples

Check existing widgets:
- `tesla/` - Simple API integration with external service
- `weather/` - Multiple endpoints, data aggregation
- `calendar/` - Complex data processing
- `ecowitt/` - Array-based configuration

Happy coding! 🎉

