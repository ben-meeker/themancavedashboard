import React, { useState, useEffect } from 'react';
import './PhotoCarousel.css';
import ConfigurableWidget from '../../components/ConfigurableWidget';
import { getWidgetConfig } from '../../config/widgetConfigs';
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

  // Get widget configuration
  const config = getWidgetConfig('photos')!;

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
    const loadConfig = async () => {
      try {
        const layout = await loadLayout();
        const photosWidget = layout.widgets.find(w => w.widgetId === 'photos');
        if (photosWidget?.config) {
          const seconds = photosWidget.config.photo_rotation_seconds as number;
          if (seconds) {
            setRotationSeconds(seconds);
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
    if (photos.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length);
    }, rotationSeconds * 1000);

    return () => clearInterval(interval);
  }, [photos.length, rotationSeconds]);

  if (loading) {
    return (
      <ConfigurableWidget
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
    return (
      <ConfigurableWidget
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

  return (
    <ConfigurableWidget
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
          onError={() => {
            console.error('Error loading image:', photos[currentIndex].url);
            // Try to load next image
            setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length);
          }}
        />
        
        <div className="photo-controls">
          <div className="photo-indicator">
            {currentIndex + 1} / {photos.length}
          </div>
        </div>
        </div>
      </div>
    </ConfigurableWidget>
  );
};

export default PhotoCarousel;
