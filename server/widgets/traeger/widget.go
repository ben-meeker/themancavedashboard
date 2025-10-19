package traeger

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/redis/go-redis/v9"
)

// TraegerWidget implements the Widget interface
type TraegerWidget struct {
	client         *TraegerClient
	redis          *redis.Client
	mu             sync.RWMutex
	latestStatus   map[string]interface{}
	selectedGrill  string
	grillThingName string
}

// ID returns the unique identifier for this widget
func (w *TraegerWidget) ID() string {
	return "traeger"
}

// GetRequiredEnvVars returns environment variables this widget needs
func (w *TraegerWidget) GetRequiredEnvVars() []string {
	return []string{
		"TRAEGER_USERNAME",
		"TRAEGER_PASSWORD",
	}
}

// Initialize sets up the widget on startup
func (w *TraegerWidget) Initialize() error {
	username := os.Getenv("TRAEGER_USERNAME")
	password := os.Getenv("TRAEGER_PASSWORD")

	// If credentials aren't set, widget will show "not configured" in UI
	// This is not a fatal error
	if username == "" || password == "" {
		log.Printf("[Traeger] Credentials not set, widget will be unavailable")
		return nil
	}

	// Initialize Traeger client
	w.client = NewTraegerClient(username, password)
	w.latestStatus = make(map[string]interface{})

	// Initialize Redis
	redisURL := os.Getenv("REDIS_URL")
	if redisURL != "" {
		opt, err := redis.ParseURL(redisURL)
		if err != nil {
			return fmt.Errorf("failed to parse Redis URL: %w", err)
		}
		w.redis = redis.NewClient(opt)
	}

	// Start the Traeger client
	ctx := context.Background()
	if err := w.client.Start(ctx); err != nil {
		return fmt.Errorf("failed to start Traeger client: %w", err)
	}

	grills := w.client.GetGrills()
	log.Printf("[Traeger] Initialized successfully, found %d grills", len(grills))
	for _, grill := range grills {
		grillMap := grill.(map[string]interface{})
		log.Printf("[Traeger] Available grill: %s (thing: %s)", grillMap["friendlyName"], grillMap["thingName"])
	}

	// Start background goroutine to store temperature history
	go w.recordTemperatureHistory()

	return nil
}

// RegisterRoutes registers all HTTP endpoints for this widget
func (w *TraegerWidget) RegisterRoutes(r chi.Router) {
	r.Get("/traeger", w.getGrillStatus)
	r.Get("/traeger/history", w.getTemperatureHistory)
}

// getGrillStatus handles GET /api/traeger
func (w *TraegerWidget) getGrillStatus(rw http.ResponseWriter, r *http.Request) {
	if w.client == nil {
		http.Error(rw, `{"error":"Traeger widget not configured"}`, http.StatusServiceUnavailable)
		return
	}

	grillName := r.URL.Query().Get("grill_name")
	if grillName == "" {
		http.Error(rw, `{"error":"grill_name parameter required"}`, http.StatusBadRequest)
		return
	}

	// Find the grill by friendly name
	grills := w.client.GetGrills()
	var thingName string
	var availableGrills []string
	for _, grill := range grills {
		grillMap := grill.(map[string]interface{})
		friendlyName := grillMap["friendlyName"].(string)
		availableGrills = append(availableGrills, friendlyName)
		if friendlyName == grillName {
			thingName = grillMap["thingName"].(string)
			break
		}
	}

	if thingName == "" {
		availableJSON, _ := json.Marshal(availableGrills)
		errorMsg := fmt.Sprintf(`{"error":"Grill '%s' not found","requested":"%s","available":%s}`, grillName, grillName, string(availableJSON))
		log.Printf("[Traeger] Grill '%s' not found. Available grills: %v", grillName, availableGrills)
		http.Error(rw, errorMsg, http.StatusNotFound)
		return
	}

	// Get current status
	status := w.client.GetStateForDevice(thingName)
	if status == nil {
		// Try to update state if not available
		ctx := context.Background()
		if err := w.client.UpdateState(ctx, thingName); err != nil {
			log.Printf("[Traeger] Failed to update state: %v", err)
			http.Error(rw, `{"error":"failed to get grill status"}`, http.StatusInternalServerError)
			return
		}
		status = w.client.GetStateForDevice(thingName)
	}

	if status == nil {
		http.Error(rw, `{"error":"no status available"}`, http.StatusNotFound)
		return
	}

	statusMap := status.(map[string]interface{})

	// Extract relevant data
	response := map[string]interface{}{
		"grill_temp":    statusMap["grill"],
		"set_temp":      statusMap["set"],
		"pellet_level":  statusMap["pellet_level"],
		"connected":     statusMap["connected"],
		"system_status": statusMap["system_status"],
		"probes":        []interface{}{},
	}

	// Extract probe data
	if acc, ok := statusMap["acc"].([]interface{}); ok {
		probes := []map[string]interface{}{}
		for _, accessory := range acc {
			accMap := accessory.(map[string]interface{})
			if accMap["type"] == "probe" {
				probeData := accMap["probe"].(map[string]interface{})
				probes = append(probes, map[string]interface{}{
					"name":      accMap["uuid"],
					"connected": accMap["con"],
					"get_temp":  probeData["get_temp"],
					"set_temp":  probeData["set_temp"],
				})
			}
		}
		response["probes"] = probes
	}

	rw.Header().Set("Content-Type", "application/json")
	json.NewEncoder(rw).Encode(response)
}

// getTemperatureHistory handles GET /api/traeger/history
func (w *TraegerWidget) getTemperatureHistory(rw http.ResponseWriter, r *http.Request) {
	if w.redis == nil {
		http.Error(rw, `{"error":"redis not configured"}`, http.StatusServiceUnavailable)
		return
	}

	grillName := r.URL.Query().Get("grill_name")
	if grillName == "" {
		http.Error(rw, `{"error":"grill_name parameter required"}`, http.StatusBadRequest)
		return
	}

	// Get duration parameter (default 1 hour)
	durationParam := r.URL.Query().Get("duration")
	duration := 3600 // 1 hour in seconds
	if durationParam != "" {
		if d, err := strconv.Atoi(durationParam); err == nil {
			duration = d
		}
	}

	ctx := context.Background()
	key := fmt.Sprintf("traeger:history:%s", grillName)

	// Get temperature history from Redis (sorted set)
	now := time.Now().Unix()
	start := now - int64(duration)

	results, err := w.redis.ZRangeByScoreWithScores(ctx, key, &redis.ZRangeBy{
		Min: fmt.Sprintf("%d", start),
		Max: fmt.Sprintf("%d", now),
	}).Result()

	if err != nil {
		log.Printf("[Traeger] Failed to get history from Redis: %v", err)
		http.Error(rw, `{"error":"failed to get history"}`, http.StatusInternalServerError)
		return
	}

	// Parse results
	history := []map[string]interface{}{}
	for _, result := range results {
		var data map[string]interface{}
		if err := json.Unmarshal([]byte(result.Member.(string)), &data); err == nil {
			data["timestamp"] = int64(result.Score)
			history = append(history, data)
		}
	}

	rw.Header().Set("Content-Type", "application/json")
	json.NewEncoder(rw).Encode(map[string]interface{}{
		"history": history,
	})
}

// recordTemperatureHistory runs in the background to store temperature data in Redis
func (w *TraegerWidget) recordTemperatureHistory() {
	if w.redis == nil {
		return
	}

	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	ctx := context.Background()

	for range ticker.C {
		grills := w.client.GetGrills()
		for _, grill := range grills {
			grillMap := grill.(map[string]interface{})
			thingName := grillMap["thingName"].(string)
			grillName := grillMap["friendlyName"].(string)

			status := w.client.GetStateForDevice(thingName)
			if status == nil {
				continue
			}

			statusMap := status.(map[string]interface{})

			// Store temperature data point
			dataPoint := map[string]interface{}{
				"grill_temp":   statusMap["grill"],
				"set_temp":     statusMap["set"],
				"pellet_level": statusMap["pellet_level"],
			}

			// Add probe temps if available
			if acc, ok := statusMap["acc"].([]interface{}); ok {
				probes := []map[string]interface{}{}
				for _, accessory := range acc {
					accMap := accessory.(map[string]interface{})
					if accMap["type"] == "probe" && accMap["con"] == float64(1) {
						probeData := accMap["probe"].(map[string]interface{})
						probes = append(probes, map[string]interface{}{
							"get_temp": probeData["get_temp"],
							"set_temp": probeData["set_temp"],
						})
					}
				}
				if len(probes) > 0 {
					dataPoint["probes"] = probes
				}
			}

			dataJSON, _ := json.Marshal(dataPoint)
			key := fmt.Sprintf("traeger:history:%s", grillName)
			timestamp := time.Now().Unix()

			// Add to sorted set with timestamp as score
			w.redis.ZAdd(ctx, key, redis.Z{
				Score:  float64(timestamp),
				Member: string(dataJSON),
			})

			// Keep only last 24 hours of data
			cutoff := timestamp - (24 * 3600)
			w.redis.ZRemRangeByScore(ctx, key, "0", fmt.Sprintf("%d", cutoff))
		}
	}
}
