package main

import (
	"encoding/json"
	"net/http"
	"os"
)

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

// getGoogleClientID returns just the client ID for frontend OAuth
func getGoogleClientID(w http.ResponseWriter, r *http.Request) {
	// Try to read from credentials.json file first
	if data, err := os.ReadFile("/app/credentials.json"); err == nil {
		var creds GoogleCredentials
		if err := json.Unmarshal(data, &creds); err == nil && creds.Web.ClientID != "" {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(GoogleClientConfig{
				ClientID: creds.Web.ClientID,
			})
			return
		}
	}

	// Fallback to environment variable
	clientID := os.Getenv("VITE_GOOGLE_CLIENT_ID")
	if clientID == "" {
		http.Error(w, `{"error":"Google OAuth not configured"}`, http.StatusServiceUnavailable)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(GoogleClientConfig{
		ClientID: clientID,
	})
}

// getGoogleTokenStatus checks if token.json exists and is valid
func getGoogleTokenStatus(w http.ResponseWriter, r *http.Request) {
	// Try to read token.json from mounted location
	data, err := os.ReadFile("/app/token.json")
	if err != nil {
		// Token doesn't exist
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(GoogleTokenStatus{Valid: false})
		return
	}

	// Try to parse it
	var token GoogleToken
	if err := json.Unmarshal(data, &token); err != nil {
		// Token is invalid JSON
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(GoogleTokenStatus{Valid: false})
		return
	}

	// Check if token has required fields
	if token.RefreshToken == "" || token.ClientID == "" {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(GoogleTokenStatus{Valid: false})
		return
	}

	// Token exists and looks valid
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(GoogleTokenStatus{Valid: true})
}
