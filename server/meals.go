package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type MealEvent struct {
	ID     string `json:"id"`
	Title  string `json:"title"`
	Start  string `json:"start"`
	End    string `json:"end"`
	AllDay bool   `json:"allDay"`
}

func getMealCalendar(w http.ResponseWriter, r *http.Request) {
	cfg := getConfig()
	icalURL := cfg.Meals.ICalURL

	if icalURL == "" {
		http.Error(w, `{"error":"Meal calendar not configured"}`, http.StatusServiceUnavailable)
		return
	}

	// Log the URL being fetched (for debugging)
	fmt.Printf("[Meals] Fetching iCal from: %s\n", icalURL)

	// Fetch the iCal data directly (no CORS proxy needed on server-side)
	resp, err := http.Get(icalURL)
	if err != nil {
		fmt.Printf("[Meals] Error fetching: %v\n", err)
		http.Error(w, `{"error":"Failed to fetch meal calendar"}`, http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("[Meals] Error reading response: %v\n", err)
		http.Error(w, `{"error":"Failed to read meal calendar"}`, http.StatusInternalServerError)
		return
	}

	fmt.Printf("[Meals] Response length: %d bytes\n", len(body))

	// Parse iCal data
	events := parseICalendar(string(body))

	// Debug logging
	fmt.Printf("[Meals] Total events parsed: %d\n", len(events))

	// Filter events to next 7 days
	now := time.Now()
	endDate := now.AddDate(0, 0, 7)

	var upcomingMeals []MealEvent
	for _, event := range events {
		eventTime, err := time.Parse(time.RFC3339, event.Start)
		if err != nil {
			fmt.Printf("[Meals] Failed to parse event time '%s': %v\n", event.Start, err)
			continue
		}

		if eventTime.After(now) && eventTime.Before(endDate) {
			upcomingMeals = append(upcomingMeals, event)
			fmt.Printf("[Meals] Adding event: %s at %s\n", event.Title, event.Start)
		}
	}

	fmt.Printf("[Meals] Upcoming meals found: %d\n", len(upcomingMeals))

	// Return empty array instead of null
	if upcomingMeals == nil {
		upcomingMeals = []MealEvent{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(upcomingMeals)
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
		// Format: YYYYMMDD
		t, err := time.Parse("20060102", dateStr)
		if err == nil {
			return t
		}
	} else {
		// Format: YYYYMMDDTHHMMSSZ or YYYYMMDDTHHMMSS
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
