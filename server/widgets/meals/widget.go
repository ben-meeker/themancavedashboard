package meals

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"sort"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

// MealsWidget handles meal calendar via iCal feed
type MealsWidget struct {
	icalURL string
}

// MealEvent represents a meal event
type MealEvent struct {
	ID     string `json:"id"`
	Title  string `json:"title"`
	Start  string `json:"start"`
	End    string `json:"end"`
	AllDay bool   `json:"allDay"`
}

// Config structs to load calendar_url from config.json
type mealWidgetConfigEntry struct {
	ID       string                 `json:"id"`
	Location map[string]interface{} `json:"location"`
	Config   map[string]interface{} `json:"config"`
}

type mealDashboardConfig struct {
	Global  map[string]interface{}  `json:"global"`
	Widgets []mealWidgetConfigEntry `json:"widgets"`
}

// ID returns the widget identifier
func (w *MealsWidget) ID() string {
	return "meals"
}

// GetRequiredEnvVars returns required environment variables
func (w *MealsWidget) GetRequiredEnvVars() []string {
	return []string{}
}

// Initialize loads configuration
func (w *MealsWidget) Initialize() error {
	// icalURL is now loaded from config.json per request
	return nil
}

// RegisterRoutes registers HTTP endpoints
func (w *MealsWidget) RegisterRoutes(r chi.Router) {
	r.Get("/meals", w.getData)
}

// getData handles GET /api/meals
func (w *MealsWidget) getData(rw http.ResponseWriter, r *http.Request) {
	// Get calendar_url from widget config
	var icalURL string

	// Try to load from config.json (always use container path, not host path)
	configPath := "/app/external-config.json"

	configData, err := os.ReadFile(configPath)
	if err == nil {
		var cfg mealDashboardConfig
		if err := json.Unmarshal(configData, &cfg); err == nil {
			for _, widget := range cfg.Widgets {
				if widget.ID == "meals" {
					if urlVal, ok := widget.Config["calendar_url"].(string); ok {
						icalURL = urlVal
					}
					break
				}
			}
		}
	}

	// Fall back to env var if not in config
	if icalURL == "" {
		icalURL = os.Getenv("MEAL_ICAL_URL")
	}

	if icalURL == "" {
		http.Error(rw, `{"error":"Meal calendar not configured"}`, http.StatusServiceUnavailable)
		return
	}

	fmt.Printf("[Meals] Fetching iCal from: %s\n", icalURL)

	resp, err := http.Get(icalURL)
	if err != nil {
		fmt.Printf("[Meals] Error fetching: %v\n", err)
		http.Error(rw, `{"error":"Failed to fetch meal calendar"}`, http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("[Meals] Error reading response: %v\n", err)
		http.Error(rw, `{"error":"Failed to read meal calendar"}`, http.StatusInternalServerError)
		return
	}

	fmt.Printf("[Meals] Response length: %d bytes\n", len(body))

	events := parseICalendar(string(body))
	fmt.Printf("[Meals] Total events parsed: %d\n", len(events))

	// Filter events to next 7 days using local timezone
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	endDate := today.AddDate(0, 0, 7)
	fmt.Printf("[Meals] Current time: %s\n", now.Format("2006-01-02 15:04:05 MST"))

	var upcomingMeals []MealEvent
	for _, event := range events {
		eventTime, err := time.Parse(time.RFC3339, event.Start)
		if err != nil {
			fmt.Printf("[Meals] Failed to parse event time '%s': %v\n", event.Start, err)
			continue
		}

		if eventTime.After(today.Add(-time.Hour)) && eventTime.Before(endDate) {
			upcomingMeals = append(upcomingMeals, event)
		}
	}

	// Sort meals by date (closest first)
	sort.Slice(upcomingMeals, func(i, j int) bool {
		timeI, _ := time.Parse(time.RFC3339, upcomingMeals[i].Start)
		timeJ, _ := time.Parse(time.RFC3339, upcomingMeals[j].Start)
		return timeI.Before(timeJ)
	})

	fmt.Printf("[Meals] Upcoming meals found: %d\n", len(upcomingMeals))

	if upcomingMeals == nil {
		upcomingMeals = []MealEvent{}
	}

	rw.Header().Set("Content-Type", "application/json")
	json.NewEncoder(rw).Encode(upcomingMeals)
}

func parseICalendar(icalData string) []MealEvent {
	var events []MealEvent
	lines := strings.Split(icalData, "\n")

	var currentEvent *MealEvent
	for _, line := range lines {
		line = strings.TrimSpace(line)

		if strings.HasPrefix(line, "BEGIN:VEVENT") {
			currentEvent = &MealEvent{AllDay: false}
		} else if strings.HasPrefix(line, "END:VEVENT") {
			if currentEvent != nil && currentEvent.Title != "" {
				events = append(events, *currentEvent)
			}
			currentEvent = nil
		} else if currentEvent != nil {
			if strings.HasPrefix(line, "UID:") {
				currentEvent.ID = strings.TrimPrefix(line, "UID:")
			} else if strings.HasPrefix(line, "SUMMARY:") {
				currentEvent.Title = strings.TrimPrefix(line, "SUMMARY:")
			} else if strings.HasPrefix(line, "DTSTART") {
				parts := strings.Split(line, ":")
				if len(parts) == 2 {
					dateStr := parts[1]
					parsedTime := parseICalDate(dateStr, strings.Contains(line, "VALUE=DATE"))
					currentEvent.Start = parsedTime.Format(time.RFC3339)
					currentEvent.AllDay = strings.Contains(line, "VALUE=DATE")
				}
			} else if strings.HasPrefix(line, "DTEND") {
				parts := strings.Split(line, ":")
				if len(parts) == 2 {
					dateStr := parts[1]
					parsedTime := parseICalDate(dateStr, strings.Contains(line, "VALUE=DATE"))
					currentEvent.End = parsedTime.Format(time.RFC3339)
				}
			}
		}
	}

	return events
}

func parseICalDate(dateStr string, isAllDay bool) time.Time {
	dateStr = strings.TrimSpace(dateStr)

	if isAllDay {
		t, err := time.Parse("20060102", dateStr)
		if err == nil {
			return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.Local)
		}
	} else {
		if strings.Contains(dateStr, "Z") {
			t, err := time.Parse("20060102T150405Z", dateStr)
			if err == nil {
				return t
			}
		} else {
			t, err := time.Parse("20060102T150405", dateStr)
			if err == nil {
				return t
			}
		}
	}

	return time.Now()
}
