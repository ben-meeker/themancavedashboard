package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"themancavedashboard/widgets"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	// Load configuration on startup
	loadConfig()

	// Initialize all widgets
	if err := widgets.InitializeAll(); err != nil {
		log.Fatalf("Failed to initialize widgets: %v", err)
	}
	log.Printf("Initialized %d widgets", len(widgets.GetAll()))

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
		// Register all widget routes
		widgets.RegisterAllRoutes(r)

		// Shared infrastructure endpoints
		r.Get("/layout", getDashboardLayout)
		r.Post("/layout", saveDashboardLayout)
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
