package main

import (
	"encoding/json"
	"net/http"
	"time"
)

// PersonalConfig represents user's personal settings
type PersonalConfigResponse struct {
	AnniversaryDate string `json:"anniversary_date"` // Format: YYYY-MM-DD
	TrashDay        string `json:"trash_day"`        // Day of week (e.g., "Wednesday")
}

// getPersonalConfig returns the user's personal configuration
func getPersonalConfig(w http.ResponseWriter, r *http.Request) {
	cfg := getConfig()

	response := PersonalConfigResponse{
		AnniversaryDate: cfg.Personal.AnniversaryDate,
		TrashDay:        cfg.Personal.TrashDay,
	}

	// Set defaults if not configured
	if response.AnniversaryDate == "" {
		response.AnniversaryDate = "2020-08-17" // Default
	}
	if response.TrashDay == "" {
		response.TrashDay = "Wednesday" // Default
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Helper function to parse anniversary date
func parseAnniversaryDate(dateStr string) (time.Time, error) {
	return time.Parse("2006-01-02", dateStr)
}

// Helper function to get day of week from string
func getDayOfWeekNumber(day string) int {
	days := map[string]int{
		"Sunday":    0,
		"Monday":    1,
		"Tuesday":   2,
		"Wednesday": 3,
		"Thursday":  4,
		"Friday":    5,
		"Saturday":  6,
	}
	if num, ok := days[day]; ok {
		return num
	}
	return 3 // Default to Wednesday
}
