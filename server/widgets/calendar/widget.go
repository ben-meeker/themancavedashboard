package calendar

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"themancavedashboard/shared"

	"github.com/go-chi/chi/v5"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	gcalendar "google.golang.org/api/calendar/v3"
	"google.golang.org/api/option"
)

// CalendarWidget handles Google Calendar integration
type CalendarWidget struct{}

// CalendarEvent represents a calendar event
type CalendarEvent struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Start    string `json:"start"`
	End      string `json:"end"`
	AllDay   bool   `json:"allDay"`
	Location string `json:"location"`
	ColorID  string `json:"colorId"`
}

// GoogleCredentials represents the OAuth credentials file from Google Console
type GoogleCredentials struct {
	Web struct {
		ClientID     string   `json:"client_id"`
		ClientSecret string   `json:"client_secret"`
		RedirectURIs []string `json:"redirect_uris"`
	} `json:"web"`
}

// GoogleClientConfig is what we send to the frontend (without secret)
type GoogleClientConfig struct {
	ClientID string `json:"client_id"`
}

// GoogleTokenStatus represents the token validation status
type GoogleTokenStatus struct {
	Valid bool `json:"valid"`
}

// GoogleToken represents the token.json structure
type GoogleToken struct {
	RefreshToken string `json:"refresh_token"`
	ClientID     string `json:"client_id"`
}

// ID returns the widget identifier
func (w *CalendarWidget) ID() string {
	return "calendar"
}

// GetRequiredEnvVars returns required environment variables
func (w *CalendarWidget) GetRequiredEnvVars() []string {
	return []string{} // Uses mounted token.json file
}

// Initialize loads configuration
func (w *CalendarWidget) Initialize() error {
	return nil
}

// RegisterRoutes registers HTTP endpoints
func (w *CalendarWidget) RegisterRoutes(r chi.Router) {
	r.Get("/calendar/events", w.getEvents)
	// Google OAuth configuration endpoints (used by this widget)
	r.Get("/google/client-id", w.getGoogleClientID)
	r.Get("/google/token-status", w.getGoogleTokenStatus)
}

// getEvents handles GET /api/calendar/events
func (w *CalendarWidget) getEvents(rw http.ResponseWriter, r *http.Request) {
	// Get token filename from widget config, default to token.json
	tokenFilename := shared.GetWidgetConfigValue("calendar", "google_token_filename", "token.json")
	tokenPath := fmt.Sprintf("/app/config/%s", tokenFilename)
	tokenData, err := os.ReadFile(tokenPath)
	if err != nil {
		http.Error(rw, `{"error":"Google Calendar not configured"}`, http.StatusServiceUnavailable)
		return
	}

	var tokenInfo struct {
		Token        string `json:"token"`
		RefreshToken string `json:"refresh_token"`
		ClientID     string `json:"client_id"`
		ClientSecret string `json:"client_secret"`
		Expiry       string `json:"expiry"`
	}

	if err := json.Unmarshal(tokenData, &tokenInfo); err != nil {
		http.Error(rw, `{"error":"Invalid token.json"}`, http.StatusInternalServerError)
		return
	}

	// Configure OAuth2
	config := &oauth2.Config{
		ClientID:     tokenInfo.ClientID,
		ClientSecret: tokenInfo.ClientSecret,
		Endpoint:     google.Endpoint,
		Scopes:       []string{"https://www.googleapis.com/auth/calendar.readonly"},
	}

	expiry, _ := time.Parse(time.RFC3339, tokenInfo.Expiry)
	token := &oauth2.Token{
		AccessToken:  tokenInfo.Token,
		RefreshToken: tokenInfo.RefreshToken,
		Expiry:       expiry,
		TokenType:    "Bearer",
	}

	ctx := context.Background()
	client := config.Client(ctx, token)

	srv, err := gcalendar.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		http.Error(rw, `{"error":"Failed to create calendar client"}`, http.StatusInternalServerError)
		return
	}

	// Get events for the current month
	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	endOfMonth := startOfMonth.AddDate(0, 1, 0).Add(-time.Second)

	events, err := srv.Events.List("primary").
		TimeMin(startOfMonth.Format(time.RFC3339)).
		TimeMax(endOfMonth.Format(time.RFC3339)).
		SingleEvents(true).
		OrderBy("startTime").
		Do()

	if err != nil {
		http.Error(rw, fmt.Sprintf(`{"error":"Failed to fetch calendar events: %v"}`, err), http.StatusInternalServerError)
		return
	}

	var calendarEvents []CalendarEvent
	for _, item := range events.Items {
		start := item.Start.DateTime
		end := item.End.DateTime
		allDay := false

		if start == "" {
			start = item.Start.Date
			end = item.End.Date
			allDay = true
		}

		calendarEvents = append(calendarEvents, CalendarEvent{
			ID:       item.Id,
			Title:    item.Summary,
			Start:    start,
			End:      end,
			AllDay:   allDay,
			Location: item.Location,
			ColorID:  item.ColorId,
		})
	}

	rw.Header().Set("Content-Type", "application/json")
	json.NewEncoder(rw).Encode(calendarEvents)
}

// getGoogleClientID handles GET /api/google/client-id
func (w *CalendarWidget) getGoogleClientID(rw http.ResponseWriter, r *http.Request) {
	// Get credentials filename from widget config, default to credentials.json
	credentialsFilename := shared.GetWidgetConfigValue("calendar", "google_credentials_filename", "credentials.json")
	credentialsPath := fmt.Sprintf("/app/config/%s", credentialsFilename)
	if data, err := os.ReadFile(credentialsPath); err == nil {
		var creds GoogleCredentials
		if err := json.Unmarshal(data, &creds); err == nil && creds.Web.ClientID != "" {
			rw.Header().Set("Content-Type", "application/json")
			json.NewEncoder(rw).Encode(GoogleClientConfig{
				ClientID: creds.Web.ClientID,
			})
			return
		}
	}

	// Fallback to environment variable
	clientID := os.Getenv("VITE_GOOGLE_CLIENT_ID")
	if clientID == "" {
		http.Error(rw, `{"error":"Google OAuth not configured"}`, http.StatusServiceUnavailable)
		return
	}

	rw.Header().Set("Content-Type", "application/json")
	json.NewEncoder(rw).Encode(GoogleClientConfig{
		ClientID: clientID,
	})
}

// getGoogleTokenStatus handles GET /api/google/token-status
func (w *CalendarWidget) getGoogleTokenStatus(rw http.ResponseWriter, r *http.Request) {
	// Get token filename from widget config, default to token.json
	tokenFilename := shared.GetWidgetConfigValue("calendar", "google_token_filename", "token.json")
	tokenPath := fmt.Sprintf("/app/config/%s", tokenFilename)
	data, err := os.ReadFile(tokenPath)
	if err != nil {
		// Token doesn't exist
		rw.Header().Set("Content-Type", "application/json")
		json.NewEncoder(rw).Encode(GoogleTokenStatus{Valid: false})
		return
	}

	// Try to parse it
	var token GoogleToken
	if err := json.Unmarshal(data, &token); err != nil {
		// Token is invalid JSON
		rw.Header().Set("Content-Type", "application/json")
		json.NewEncoder(rw).Encode(GoogleTokenStatus{Valid: false})
		return
	}

	// Check if token has required fields
	if token.RefreshToken == "" || token.ClientID == "" {
		rw.Header().Set("Content-Type", "application/json")
		json.NewEncoder(rw).Encode(GoogleTokenStatus{Valid: false})
		return
	}

	// Token exists and looks valid
	rw.Header().Set("Content-Type", "application/json")
	json.NewEncoder(rw).Encode(GoogleTokenStatus{Valid: true})
}
