package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type WeatherResponse struct {
	Temp      int     `json:"temp"`
	FeelsLike int     `json:"feelsLike"`
	High      int     `json:"high"`
	Low       int     `json:"low"`
	Humidity  int     `json:"humidity"`
	WindSpeed float64 `json:"windSpeed"`
	Condition string  `json:"condition"`
}

type OpenWeatherResponse struct {
	Main struct {
		Temp      float64 `json:"temp"`
		FeelsLike float64 `json:"feels_like"`
		TempMin   float64 `json:"temp_min"`
		TempMax   float64 `json:"temp_max"`
		Humidity  int     `json:"humidity"`
	} `json:"main"`
	Weather []struct {
		Main        string `json:"main"`
		Description string `json:"description"`
	} `json:"weather"`
	Wind struct {
		Speed float64 `json:"speed"`
	} `json:"wind"`
}

func getWeather(w http.ResponseWriter, r *http.Request) {
	cfg := getConfig()
	apiKey := cfg.Weather.APIKey
	lat := cfg.Weather.Lat
	lon := cfg.Weather.Lon

	if apiKey == "" || lat == "" || lon == "" {
		http.Error(w, `{"error":"Weather API not configured"}`, http.StatusServiceUnavailable)
		return
	}

	url := fmt.Sprintf("https://api.openweathermap.org/data/2.5/weather?lat=%s&lon=%s&appid=%s&units=imperial", lat, lon, apiKey)

	resp, err := http.Get(url)
	if err != nil {
		http.Error(w, `{"error":"Failed to fetch weather data"}`, http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, `{"error":"Failed to read weather response"}`, http.StatusInternalServerError)
		return
	}

	if resp.StatusCode != http.StatusOK {
		http.Error(w, fmt.Sprintf(`{"error":"Weather API error: %s"}`, string(body)), resp.StatusCode)
		return
	}

	var owData OpenWeatherResponse
	if err := json.Unmarshal(body, &owData); err != nil {
		http.Error(w, `{"error":"Failed to parse weather data"}`, http.StatusInternalServerError)
		return
	}

	// Transform to frontend format
	condition := "Clear"
	if len(owData.Weather) > 0 {
		condition = owData.Weather[0].Main
	}

	response := WeatherResponse{
		Temp:      int(owData.Main.Temp),
		FeelsLike: int(owData.Main.FeelsLike),
		High:      int(owData.Main.TempMax),
		Low:       int(owData.Main.TempMin),
		Humidity:  owData.Main.Humidity,
		WindSpeed: owData.Wind.Speed,
		Condition: condition,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
