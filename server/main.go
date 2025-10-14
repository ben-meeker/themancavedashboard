package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	// Load configuration on startup
	loadConfig()

	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))

	// CORS configuration
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:*", "http://192.168.*", "http://127.0.0.1:*"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	// API routes
	r.Route("/api", func(r chi.Router) {
		// Data endpoints
		r.Get("/tesla/status", getTeslaStatus)
		r.Get("/calendar/events", getCalendarEvents)
		r.Get("/meals", getMealCalendar)
		r.Get("/weather", getWeather)
		r.Get("/ecowitt", getEcowittData)
		r.Get("/personal/config", getPersonalConfig)
		r.Get("/photos/list", getPhotosList)

		// Google OAuth config
		r.Get("/google/client-id", getGoogleClientID)
		r.Get("/google/token-status", getGoogleTokenStatus)

		// Setup endpoints
		r.Get("/setup/personal/status", getPersonalSetupStatus)
		r.Post("/setup/personal", setupPersonal)

		r.Get("/setup/tesla/status", getTeslaSetupStatus)
		r.Post("/setup/tesla", setupTesla)

		r.Get("/setup/weather/status", getWeatherSetupStatus)
		r.Post("/setup/weather", setupWeather)

		r.Get("/setup/meals/status", getMealsSetupStatus)
		r.Post("/setup/meals", setupMeals)

		r.Get("/setup/ecowitt/status", getEcowittSetupStatus)
		r.Post("/setup/ecowitt", setupEcowitt)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal(err)
	}
}
