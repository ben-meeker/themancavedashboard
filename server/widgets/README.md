# Backend Widget System

The backend widget system allows you to create modular, self-contained API endpoints for your widgets.

## 🎯 Key Features

- **Auto-registration**: Widgets register themselves via `init()` functions
- **Self-contained**: Each widget lives in its own folder
- **Type-safe**: Uses Go interfaces for consistency
- **Easy to add**: Just create a folder, implement the interface, and import

## 📁 Structure

```
server/widgets/
├── widget.go          # Widget interface and registry
├── register.go        # Central import point
├── _template/         # Template for new widgets
│   ├── README.md
│   └── widget.go
├── tesla/             # Example widget
│   ├── widget.go      # Implementation
│   └── init.go        # Auto-registration
└── README.md          # This file
```

## 🚀 Quick Start: Adding a Widget

### Step 1: Copy the Template

```bash
cd server/widgets
cp -r _template mywidget
```

### Step 2: Implement the Widget

Edit `mywidget/widget.go`:

```go
package mywidget

import (
	"encoding/json"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
)

type MyWidget struct {
	apiKey string
}

func (w *MyWidget) ID() string {
	return "mywidget"
}

func (w *MyWidget) GetRequiredEnvVars() []string {
	return []string{"MY_API_KEY"}
}

func (w *MyWidget) Initialize() error {
	w.apiKey = os.Getenv("MY_API_KEY")
	return nil
}

func (w *MyWidget) RegisterRoutes(r chi.Router) {
	r.Get("/mywidget", w.getData)
}

func (w *MyWidget) getData(rw http.ResponseWriter, r *http.Request) {
	data := map[string]string{"status": "ok"}
	rw.Header().Set("Content-Type", "application/json")
	json.NewEncoder(rw).Encode(data)
}
```

### Step 3: Register the Widget

Add to `server/widgets/register.go`:

```go
import (
	"themancavedashboard/widgets/mywidget"
)

func init() {
	Register(&mywidget.MyWidget{})
	// ... other widgets
}
```

### Step 4: Rebuild

```bash
docker-compose build && docker-compose up -d
```

Done! Your widget's endpoints are now available at `/api/mywidget`.

## 🔧 Widget Interface

Every widget must implement:

```go
type Widget interface {
	// ID returns unique identifier (e.g., "tesla", "weather")
	ID() string

	// RegisterRoutes adds HTTP endpoints to the router
	RegisterRoutes(r chi.Router)

	// GetRequiredEnvVars lists needed environment variables
	GetRequiredEnvVars() []string

	// Initialize is called once at startup
	Initialize() error
}
```

## 📋 Best Practices

### 1. Keep It Self-Contained

All widget code should be in its folder:
- API handlers
- Data structures
- Business logic
- External API calls

### 2. Use Environment Variables for Secrets

```go
func (w *MyWidget) Initialize() error {
	w.apiKey = os.Getenv("MY_API_KEY")
	if w.apiKey == "" {
		return fmt.Errorf("MY_API_KEY not set")
	}
	return nil
}
```

### 3. Use config.json for Settings

Access widget configuration from the shared config:

```go
// TODO: Add config access helper
widgetConfig := config.GetWidgetConfig("mywidget")
setting := widgetConfig["my_setting"]
```

### 4. Handle Errors Gracefully

```go
func (w *MyWidget) getData(rw http.ResponseWriter, r *http.Request) {
	if w.apiKey == "" {
		http.Error(rw, `{"error":"Not configured"}`, http.StatusServiceUnavailable)
		return
	}
	
	// ... your logic
}
```

### 5. Return Consistent JSON

```go
// Success
rw.Header().Set("Content-Type", "application/json")
json.NewEncoder(rw).Encode(data)

// Error
http.Error(rw, `{"error":"Description"}`, http.StatusInternalServerError)
```

## 🎯 Endpoint Naming

Widget endpoints should follow this pattern:

```
GET  /api/{widget-id}           # Get main data
GET  /api/{widget-id}/status    # Get status
POST /api/{widget-id}/action    # Perform action
GET  /api/{widget-id}/config    # Get configuration
```

Examples:
- `/api/tesla` - Get Tesla data
- `/api/weather` - Get weather data
- `/api/calendar/events` - Get calendar events

## 🔄 Migration from Legacy

Old monolithic handlers like `tesla.go`, `weather.go` should be migrated to:

```
widgets/
├── tesla/
│   ├── widget.go    # getTeslaStatus() → tesla.Widget.getData()
│   └── init.go
├── weather/
│   ├── widget.go    # getWeather() → weather.Widget.getData()
│   └── init.go
```

Benefits:
- Better organization
- Easier to test
- Clearer dependencies
- Self-documenting

## 📚 Examples

See existing widgets for patterns:

- **`tesla/`** - Simple external API integration
- **`_template/`** - Starter template with comments

## 🐛 Troubleshooting

**Widget not found?**
- Check that `init.go` exists and calls `widgets.Register()`
- Verify import in `register.go`
- Check for compilation errors

**Environment variables not loading?**
- Add to `.env` file
- Restart container: `docker-compose restart`
- Check `GetRequiredEnvVars()` returns correct names

**Routes conflicting?**
- Ensure widget IDs are unique
- Check route paths don't overlap
- Use specific patterns (e.g., `/mywidget` not `/`)

---

Happy widget building! 🎉

