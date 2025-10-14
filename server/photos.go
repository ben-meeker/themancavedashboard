package main

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// getPhotosList returns a list of photo filenames from the photos directory
func getPhotosList(w http.ResponseWriter, r *http.Request) {
	photosDir := "/usr/share/nginx/html/photos"

	// Read directory
	entries, err := os.ReadDir(photosDir)
	if err != nil {
		http.Error(w, `{"error":"Photos directory not found"}`, http.StatusNotFound)
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

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(photoFiles)
}
