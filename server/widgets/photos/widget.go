package photos

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"themancavedashboard/shared"

	"github.com/go-chi/chi/v5"
)

// PhotosWidget handles listing photos from the mounted photos directory
type PhotosWidget struct {
	photosDir string
}

// ID returns the widget identifier
func (w *PhotosWidget) ID() string {
	return "photos"
}

// GetRequiredEnvVars returns required environment variables
func (w *PhotosWidget) GetRequiredEnvVars() []string {
	return []string{} // Uses mounted volume
}

// Initialize loads configuration
func (w *PhotosWidget) Initialize() error {
	// Get photos folder from widget config, default to "photos"
	photosFolder := shared.GetWidgetConfigValue("photos", "photos_folder", "photos")
	w.photosDir = fmt.Sprintf("/app/config/%s", photosFolder)
	return nil
}

// RegisterRoutes registers HTTP endpoints
func (w *PhotosWidget) RegisterRoutes(r chi.Router) {
	r.Get("/photos/list", w.listPhotos)
}

// listPhotos handles GET /api/photos/list
func (w *PhotosWidget) listPhotos(rw http.ResponseWriter, r *http.Request) {
	entries, err := os.ReadDir(w.photosDir)
	if err != nil {
		http.Error(rw, `{"error":"Photos directory not found"}`, http.StatusNotFound)
		return
	}

	// Filter for image files
	var photoFiles []string
	imageExtensions := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".gif":  true,
		".heic": true,
		".webp": true,
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		// Skip hidden files and non-images
		if strings.HasPrefix(entry.Name(), ".") {
			continue
		}

		ext := strings.ToLower(filepath.Ext(entry.Name()))
		if imageExtensions[ext] {
			photoFiles = append(photoFiles, entry.Name())
		}
	}

	rw.Header().Set("Content-Type", "application/json")
	json.NewEncoder(rw).Encode(photoFiles)
}
