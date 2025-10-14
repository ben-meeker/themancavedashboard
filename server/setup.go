package main

import (
	"encoding/json"
	"net/http"
)

// Setup request structures
type PersonalSetupRequest struct {
	AnniversaryDate string `json:"anniversary_date"`
	TrashDay        string `json:"trash_day"`
}

type TeslaSetupRequest struct {
	APIKey string `json:"api_key"`
	VIN    string `json:"vin"`
}

type WeatherSetupRequest struct {
	APIKey string `json:"api_key"`
	Lat    string `json:"lat"`
	Lon    string `json:"lon"`
}

type MealsSetupRequest struct {
	ICalURL string `json:"ical_url"`
}

type EcowittSetupRequest struct {
	APIKey         string `json:"api_key"`
	ApplicationKey string `json:"application_key"`
	GatewayMAC     string `json:"gateway_mac"`
}

type StatusResponse struct {
	Configured bool   `json:"configured"`
	Message    string `json:"message,omitempty"`
}

// Check if Personal config is set
func getPersonalSetupStatus(w http.ResponseWriter, r *http.Request) {
	cfg := getConfig()
	configured := cfg.Personal.AnniversaryDate != "" && cfg.Personal.TrashDay != ""

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(StatusResponse{
		Configured: configured,
	})
}

// Setup Personal config
func setupPersonal(w http.ResponseWriter, r *http.Request) {
	var req PersonalSetupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request"}`, http.StatusBadRequest)
		return
	}

	if req.AnniversaryDate == "" || req.TrashDay == "" {
		http.Error(w, `{"error":"Anniversary date and trash day are required"}`, http.StatusBadRequest)
		return
	}

	if err := updatePersonalConfig(req.AnniversaryDate, req.TrashDay); err != nil {
		http.Error(w, `{"error":"Failed to save configuration"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Personal config saved successfully"})
}

// Check if Tesla is configured
func getTeslaSetupStatus(w http.ResponseWriter, r *http.Request) {
	cfg := getConfig()
	configured := cfg.Tesla.APIKey != "" && cfg.Tesla.VIN != ""

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(StatusResponse{
		Configured: configured,
	})
}

// Setup Tesla
func setupTesla(w http.ResponseWriter, r *http.Request) {
	var req TeslaSetupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request"}`, http.StatusBadRequest)
		return
	}

	if req.APIKey == "" || req.VIN == "" {
		http.Error(w, `{"error":"API key and VIN are required"}`, http.StatusBadRequest)
		return
	}

	if err := updateTeslaConfig(req.APIKey, req.VIN); err != nil {
		http.Error(w, `{"error":"Failed to save configuration"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Tesla configured successfully"})
}

// Check if Weather is configured
func getWeatherSetupStatus(w http.ResponseWriter, r *http.Request) {
	cfg := getConfig()
	configured := cfg.Weather.APIKey != "" && cfg.Weather.Lat != "" && cfg.Weather.Lon != ""

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(StatusResponse{
		Configured: configured,
	})
}

// Setup Weather
func setupWeather(w http.ResponseWriter, r *http.Request) {
	var req WeatherSetupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request"}`, http.StatusBadRequest)
		return
	}

	if req.APIKey == "" || req.Lat == "" || req.Lon == "" {
		http.Error(w, `{"error":"API key, latitude, and longitude are required"}`, http.StatusBadRequest)
		return
	}

	if err := updateWeatherConfig(req.APIKey, req.Lat, req.Lon); err != nil {
		http.Error(w, `{"error":"Failed to save configuration"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Weather configured successfully"})
}

// Check if Meals is configured
func getMealsSetupStatus(w http.ResponseWriter, r *http.Request) {
	cfg := getConfig()
	configured := cfg.Meals.ICalURL != ""

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(StatusResponse{
		Configured: configured,
	})
}

// Setup Meals
func setupMeals(w http.ResponseWriter, r *http.Request) {
	var req MealsSetupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request"}`, http.StatusBadRequest)
		return
	}

	if req.ICalURL == "" {
		http.Error(w, `{"error":"iCal URL is required"}`, http.StatusBadRequest)
		return
	}

	if err := updateMealsConfig(req.ICalURL); err != nil {
		http.Error(w, `{"error":"Failed to save configuration"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Meals configured successfully"})
}

// Check if Ecowitt is configured
func getEcowittSetupStatus(w http.ResponseWriter, r *http.Request) {
	cfg := getConfig()
	configured := cfg.Ecowitt.APIKey != "" && cfg.Ecowitt.ApplicationKey != "" && cfg.Ecowitt.GatewayMAC != ""

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(StatusResponse{
		Configured: configured,
	})
}

// Setup Ecowitt
func setupEcowitt(w http.ResponseWriter, r *http.Request) {
	var req EcowittSetupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request"}`, http.StatusBadRequest)
		return
	}

	if req.APIKey == "" || req.ApplicationKey == "" || req.GatewayMAC == "" {
		http.Error(w, `{"error":"API key, application key, and gateway MAC are required"}`, http.StatusBadRequest)
		return
	}

	if err := updateEcowittConfig(req.APIKey, req.ApplicationKey, req.GatewayMAC); err != nil {
		http.Error(w, `{"error":"Failed to save configuration"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Ecowitt configured successfully"})
}
