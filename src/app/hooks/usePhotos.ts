import { useState, useCallback, useEffect } from 'react';
import { Photo, PhotoSession, SocialShareConfig } from '../../types/photo';
import { downloadImage, shareToSocialMedia } from '../../lib/image-processing';
import { set, get, del } from 'idb-keyval';

interface UsePhotosOptions {
  sessionId?: string;
  userId?: string;
  enableLocalStorage?: boolean;
  enableCloudStorage?: boolean;
}

interface UsePhotosReturn {
  photos: Photo[];
  currentSession: PhotoSession | null;
  addPhoto: (photo: Photo) => void;
  updatePhoto: (photoId: string, updates: Partial<Photo>) => void;
  deletePhoto: (photoId: string) => void;
  clearSession: () => void;
  downloadPhoto: (photo: Photo) => void;
  sharePhoto: (photo: Photo, platform: string) => void;
  createPhotoStrip: (photoIds: string[]) => Promise<string | null>;
  exportSession: () => void;
  importSession: (sessionData: string) => void;
}

export const usePhotos = (options: UsePhotosOptions = {}): UsePhotosReturn => {
  const { sessionId, userId, enableLocalStorage = true, enableCloudStorage = false } = options;
  
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentSession, setCurrentSession] = useState<PhotoSession | null>(null);

  // Helper to get the storage key
  const getStorageKey = () => {
    if (userId && sessionId) return `photobooth-user-${userId}-session-${sessionId}`;
    if (sessionId) return `photobooth-session-${sessionId}`;
    return 'photobooth-session-default';
  };
 
  // Debug: log the storage key on mount
  useEffect(() => {
    console.log('[usePhotos] Storage key:', getStorageKey());
  }, [sessionId, userId]);

  // Load photos from IndexedDB on mount
  useEffect(() => {
    if (sessionId || userId) {
      get(getStorageKey()).then((savedPhotos) => {
        if (savedPhotos) {
          try {
            setPhotos(savedPhotos);
          } catch (error) {
            console.error('Failed to load saved photos from IndexedDB:', error);
          }
        }
      });
    }
  }, [sessionId, userId]);

  // Save photos to IndexedDB when photos change
  useEffect(() => {
    if ((sessionId || userId) && photos.length > 0) {
      set(getStorageKey(), photos).catch((error) => {
        console.error('Failed to save photos to IndexedDB:', error);
      });
    }
  }, [photos, sessionId, userId]);

  // Add photo to session
  const addPhoto = useCallback((photo: Photo) => {
    console.log('[usePhotos] addPhoto called with:', photo);
    setPhotos(prev => {
      const updated = [...prev, photo];
      console.log('[usePhotos] New photos array:', updated);
      return updated;
    });
    
    // Update current session
    setCurrentSession(prev => {
      if (prev) {
        return {
          ...prev,
          photos: [...prev.photos, photo],
        };
      }
      return {
        id: sessionId || `session-${Date.now()}`,
        photos: [photo],
        createdAt: new Date(),
        settings: {
          countdownDuration: 3,
          photoSize: photo.size,
          audioEnabled: false,
        },
      };
    });
  }, [sessionId, userId]);

  // Update photo
  const updatePhoto = useCallback((photoId: string, updates: Partial<Photo>) => {
    setPhotos(prev => 
      prev.map(photo => 
        photo.id === photoId ? { ...photo, ...updates } : photo
      )
    );
    
    // Update current session
    setCurrentSession(prev => {
      if (prev) {
        return {
          ...prev,
          photos: prev.photos.map(photo => 
            photo.id === photoId ? { ...photo, ...updates } : photo
          ),
        };
      }
      return prev;
    });
  }, []);

  // Delete photo
  const deletePhoto = useCallback((photoId: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
    
    // Update current session
    setCurrentSession(prev => {
      if (prev) {
        return {
          ...prev,
          photos: prev.photos.filter(photo => photo.id !== photoId),
        };
      }
      return prev;
    });
  }, []);

  // Clear session
  const clearSession = useCallback(() => {
    setPhotos([]);
    setCurrentSession(null);
    
    if (sessionId || userId) {
      del(getStorageKey()).catch((error) => {
        console.error('Failed to clear photos from IndexedDB:', error);
      });
    }
  }, [sessionId, userId]);

  // Download photo
  const downloadPhoto = useCallback((photo: Photo) => {
    const imageSrc = photo.processedSrc || photo.originalSrc;
    const filename = photo.filename || `photobooth-${Date.now()}.jpg`;
    
    downloadImage(imageSrc, filename);
    
    // Mark as downloaded
    updatePhoto(photo.id, { isDownloaded: true });
  }, [updatePhoto]);

  // Share photo
  const sharePhoto = useCallback((photo: Photo, platform: string) => {
    const imageSrc = photo.processedSrc || photo.originalSrc;
    const text = 'Check out my photo from the Photo Booth! 📸';
    
    shareToSocialMedia(platform, imageSrc, text);
    
    // Mark as shared
    updatePhoto(photo.id, { isShared: true });
  }, [updatePhoto]);

  // Create photo strip
  const createPhotoStrip = useCallback(async (photoIds: string[]): Promise<string | null> => {
    const selectedPhotos = photos.filter(photo => photoIds.includes(photo.id));
    
    if (selectedPhotos.length === 0) {
      return null;
    }
    
    // For now, return the first photo as a placeholder
    // In a real implementation, you'd use the ImageProcessor to create a strip
    return selectedPhotos[0].processedSrc || selectedPhotos[0].originalSrc;
  }, [photos]);

  // Export session
  const exportSession = useCallback(() => {
    if (currentSession) {
      const sessionData = JSON.stringify(currentSession);
      const blob = new Blob([sessionData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `photobooth-session-${currentSession.id}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    }
  }, [currentSession]);

  // Import session
  const importSession = useCallback((sessionData: string) => {
    try {
      const session: PhotoSession = JSON.parse(sessionData);
      setPhotos(session.photos);
      setCurrentSession(session);
    } catch (error) {
      console.error('Failed to import session:', error);
    }
  }, []);

  return {
    photos,
    currentSession,
    addPhoto,
    updatePhoto,
    deletePhoto,
    clearSession,
    downloadPhoto,
    sharePhoto,
    createPhotoStrip,
    exportSession,
    importSession,
  };
};
