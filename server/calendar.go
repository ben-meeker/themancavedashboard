package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	calendar "google.golang.org/api/calendar/v3"
	"google.golang.org/api/option"
)

type CalendarEvent struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Start    string `json:"start"`
	End      string `json:"end"`
	AllDay   bool   `json:"allDay"`
	Location string `json:"location"`
	ColorID  string `json:"colorId"`
}

func getCalendarEvents(w http.ResponseWriter, r *http.Request) {
	// Read token.json from mounted volume
	tokenData, err := os.ReadFile("/app/token.json")
	if err != nil {
		http.Error(w, `{"error":"Google Calendar not configured"}`, http.StatusServiceUnavailable)
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
		http.Error(w, `{"error":"Invalid token.json"}`, http.StatusInternalServerError)
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

	srv, err := calendar.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		http.Error(w, `{"error":"Failed to create calendar client"}`, http.StatusInternalServerError)
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
		http.Error(w, fmt.Sprintf(`{"error":"Failed to fetch calendar events: %v"}`, err), http.StatusInternalServerError)
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

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(calendarEvents)
}
