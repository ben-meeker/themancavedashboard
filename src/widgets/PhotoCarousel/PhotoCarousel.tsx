import React, { useState, useEffect, useRef } from 'react';
import './PhotoCarousel.css';
import ConfigurableWidget from '../../components/ConfigurableWidget';
import { getWidgetMetadata, widgetMetadataToLegacyConfig } from '../../config/widgetRegistryHelper';
import { loadLayout } from '../../services/layoutApi';

interface Photo {
  url: string;
  filename: string;
}

const PhotoCarousel: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rotationSeconds, setRotationSeconds] = useState(45);
  const [erroredPhotos, setErroredPhotos] = useState<Set<string>>(new Set());
  const configLoadedRef = useRef(false);
  const lastErrorTimeRef = useRef<number>(0);

  // Get widget configuration
  const metadata = getWidgetMetadata('photos');
  const config = metadata ? widgetMetadataToLegacyConfig(metadata) : null;

  // Check if photos are available
  const checkPhotosConfig = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/photos/list');
      if (!response.ok) {
        return false;
      }
      const filenames: string[] = await response.json();
      return Array.isArray(filenames) && filenames.length > 0;
    } catch (error) {
      console.error('Error checking photos configuration:', error);
      return false;
    }
  };

  // Shuffle array using Fisher-Yates algorithm
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Load photos from backend API
  const loadPhotos = async () => {
    setLoading(true);
    try {
      // Fetch the photo list from the backend API
      const response = await fetch('/api/photos/list');
      if (!response.ok) {
        throw new Error('Failed to load photos');
      }
      
      const filenames: string[] = await response.json();
      const photoList: Photo[] = filenames.map((filename) => ({
        url: `/photos/${filename}`,
        filename,
      }));

      // Shuffle the photos randomly
      const shuffledPhotos = shuffleArray(photoList);

      console.log('[PhotoCarousel] Loaded and shuffled photos:', shuffledPhotos);
      setPhotos(shuffledPhotos);
    } catch (error) {
      console.error('[PhotoCarousel] Error loading photos:', error);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  // Load widget config
  useEffect(() => {
    if (configLoadedRef.current) return;
    
    const loadConfig = async () => {
      try {
        const layout = await loadLayout();
        const photosWidget = layout.widgets.find(w => w.widgetId === 'photos');
        if (photosWidget?.config) {
          const seconds = photosWidget.config.photo_rotation_seconds as number;
          if (seconds) {
            console.log('[PhotoCarousel] Config loaded, rotation seconds:', seconds);
            setRotationSeconds(seconds);
            configLoadedRef.current = true;
          }
        }
      } catch (error) {
        console.error('Error loading photos config:', error);
      }
    };
    loadConfig();
  }, []);

  // Load photos when component mounts
  useEffect(() => {
    loadPhotos();
  }, []);

  // Auto-advance photos
  useEffect(() => {
    console.log(`[PhotoCarousel] Auto-advance effect triggered. Photos: ${photos.length}, Rotation: ${rotationSeconds}s`);
    
    if (photos.length <= 1) {
      console.log('[PhotoCarousel] Not enough photos, skipping rotation setup');
      return;
    }

    console.log(`[PhotoCarousel] Starting rotation timer: ${rotationSeconds} seconds`);
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[PhotoCarousel] Rotating to next photo (elapsed: ${elapsed}s)`);
      setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length);
    }, rotationSeconds * 1000);

    return () => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[PhotoCarousel] Clearing rotation timer (was active for ${elapsed}s)`);
      clearInterval(interval);
    };
  }, [photos.length, rotationSeconds]);

  if (loading) {
    if (!config) {
      return <div>Widget configuration not found</div>;
    }

    return (      <ConfigurableWidget
        config={config}
        checkConfig={checkPhotosConfig}
        className="photo-carousel"
      >
        <div className="card-header">
          <span className="card-icon">📸</span>
          <h2 className="card-title">Photos</h2>
        </div>
        <div className="card-content">
          <div className="photo-loading">
            <div className="loading-spinner"></div>
            <span>Loading photos...</span>
          </div>
        </div>
      </ConfigurableWidget>
    );
  }

  if (photos.length === 0) {
    if (!config) {
      return <div>Widget configuration not found</div>;
    }

    return (      <ConfigurableWidget
        config={config}
        checkConfig={checkPhotosConfig}
        className="photo-carousel"
      >
        <div className="card-header">
          <span className="card-icon">📸</span>
          <h2 className="card-title">Photos</h2>
        </div>
        <div className="card-content">
          <div className="photo-empty-prompt">
            <div className="prompt-icon">📁</div>
            <h3>No Photos Found</h3>
            <p>Add photos to your photos folder to see them here</p>
            <p className="hint">Supported formats: JPG, PNG, GIF, WebP</p>
          </div>
        </div>
      </ConfigurableWidget>
    );
  }

  if (!config) {
    return <div>Widget configuration not found</div>;
  }

  const handleImageError = () => {
    const currentPhoto = photos[currentIndex];
    console.error('[PhotoCarousel] Error loading image:', currentPhoto.url);
    console.error('[PhotoCarousel] Expected path: /app/config/photos/' + currentPhoto.filename);
    
    // Track this photo as errored
    setErroredPhotos(prev => {
      const newSet = new Set(prev);
      newSet.add(currentPhoto.filename);
      
      // Log if all photos have failed
      if (newSet.size === photos.length) {
        console.error('[PhotoCarousel] ALL PHOTOS FAILED TO LOAD!');
        console.error('[PhotoCarousel] Check that photos exist in your CONFIG_DIR/photos/ folder');
        console.error('[PhotoCarousel] Photo list:', photos.map(p => p.filename));
      }
      
      return newSet;
    });
    
    // Rate limit: only advance if it's been at least 2 seconds since last error
    const now = Date.now();
    const timeSinceLastError = now - lastErrorTimeRef.current;
    
    if (timeSinceLastError < 2000) {
      console.warn('[PhotoCarousel] Too many errors too quickly (< 2s), pausing auto-advance');
      return;
    }
    
    lastErrorTimeRef.current = now;
    
    // Try to load next image
    console.log('[PhotoCarousel] Advancing to next photo due to load error');
    setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length);
  };

  return (    <ConfigurableWidget
      config={config}
      checkConfig={checkPhotosConfig}
      className="photo-carousel"
    >
      <div className="card-content">
        <div className="photo-wrapper">
        <img
          src={photos[currentIndex].url}
          alt={photos[currentIndex].filename}
          className="photo-image"
          onError={handleImageError}
        />
        
        <div className="photo-controls">
          <div className="photo-indicator">
            {currentIndex + 1} / {photos.length}
            {erroredPhotos.size > 0 && (
              <span style={{ color: '#ff6b6b', marginLeft: '8px' }}>
                ({erroredPhotos.size} failed)
              </span>
            )}
          </div>
        </div>
        </div>
      </div>
    </ConfigurableWidget>
  );
};

export default PhotoCarousel;
