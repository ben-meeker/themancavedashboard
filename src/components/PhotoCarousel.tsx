import React, { useState, useEffect } from 'react';
import './PhotoCarousel.css';

interface Photo {
  url: string;
  filename: string;
}

const PhotoCarousel: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

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
  useEffect(() => {
    const loadPhotos = async () => {
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

    loadPhotos();
  }, []);

  // Rotate photos every 45 seconds
  useEffect(() => {
    if (photos.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length);
    }, 45 * 1000); // 45 seconds

    return () => clearInterval(interval);
  }, [photos.length]);

  if (loading) {
    return (
      <div className="photo-carousel">
        <div className="photo-loading">Loading photos...</div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="photo-carousel">
        <div className="photo-empty-prompt">
          <div className="prompt-icon">📁</div>
          <h3>No Photos Found</h3>
          <p>Add photos to your photos folder to see them here</p>
          <p className="hint">Supported formats: JPG, PNG, GIF, WebP</p>
        </div>
      </div>
    );
  }

  const currentPhoto = photos[currentIndex];

  return (
    <div className="photo-carousel">
      <div className="photo-wrapper">
        <img
          src={currentPhoto.url}
          alt={currentPhoto.filename}
          className="photo-image"
          key={currentIndex}
        />
        <div className="photo-indicator">
          {currentIndex + 1} / {photos.length}
        </div>
      </div>
    </div>
  );
};

export default PhotoCarousel;

