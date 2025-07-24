import { useState, useRef, useCallback, useEffect } from 'react';
import { Photo, PhotoSize, PHOTO_SIZES } from '../types/photo';
import { generateFilename } from '../lib/image-processing';

interface UseCameraOptions {
  photoSize?: PhotoSize;
  countdownDuration?: number;
  audioEnabled?: boolean;
  multiShot?: boolean;
  multiShotCount?: number;
  multiShotInterval?: number;
}

interface UseCameraReturn {
  isCapturing: boolean;
  isCountingDown: boolean;
  capturedPhotos: Photo[];
  currentPhoto: Photo | null;
  startCountdown: () => void;
  capturePhoto: (videoRef?: React.RefObject<HTMLVideoElement | null>) => Promise<Photo | null>;
  startMultiShot: () => Promise<Photo[]>;
  retakePhoto: () => void;
  clearPhotos: () => void;
  setPhotoSize: (size: PhotoSize) => void;
}

export const useCamera = (options: UseCameraOptions = {}): UseCameraReturn => {
  const {
    photoSize = PHOTO_SIZES[1], // medium by default
    countdownDuration = 3,
    audioEnabled = false,
    multiShot = false,
    multiShotCount = 4,
    multiShotInterval = 1000,
  } = options;

  const [isCapturing, setIsCapturing] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<Photo[]>([]);
  const [currentPhoto, setCurrentPhoto] = useState<Photo | null>(null);
  const [currentPhotoSize, setCurrentPhotoSize] = useState<PhotoSize>(photoSize);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Start countdown
  const startCountdown = useCallback(() => {
    if (isCapturing || isCountingDown) return;
    setIsCountingDown(true);
  }, [isCapturing, isCountingDown]);

  // Capture photo
  const capturePhoto = useCallback(async (videoRef?: React.RefObject<HTMLVideoElement | null>): Promise<Photo | null> => {
    if (typeof window === 'undefined') return null;

    try {
      setIsCapturing(true);

      // Get video element from ref or fallback to DOM query
      let video: HTMLVideoElement | null = null;
      if (videoRef?.current) {
        video = videoRef.current;
      } else {
        video = document.querySelector('video');
      }

      if (!video) {
        throw new Error('Video element not found');
      }

      // Create canvas for capture
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // Set canvas size to match video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0);

      // Get image data
      const imageSrc = canvas.toDataURL('image/jpeg', 0.9);

      // Create photo object
      const photo: Photo = {
        id: generateFilename(),
        sessionId: `session-${Date.now()}`,
        filename: generateFilename(),
        originalSrc: imageSrc,
        processedSrc: imageSrc, // For now, use original as processed
        imageUrl: imageSrc, // Use imageUrl instead of url
        filtersApplied: { basic: [], advanced: {} },
        stickers: [],
        size: currentPhotoSize.name,
        createdAt: new Date(),
        isDownloaded: false,
        isShared: false,
        metadata: {
          width: canvas.width,
          height: canvas.height,
          fileSize: Math.round(imageSrc.length * 0.75), // Approximate file size
          format: 'jpeg'
        },
      };

      setCurrentPhoto(photo);
      setCapturedPhotos(prev => [...prev, photo]);
      setIsCapturing(false);
      setIsCountingDown(false);

      return photo;
    } catch (err) {
      console.error('Error capturing photo:', err);
      setIsCapturing(false);
      setIsCountingDown(false);
      return null;
    }
  }, [currentPhotoSize]);

  // Multi-shot capture
  const startMultiShot = useCallback(async (): Promise<Photo[]> => {
    const photos: Photo[] = [];
    
    for (let i = 0; i < multiShotCount; i++) {
      // Start countdown for each shot
      setIsCountingDown(true);
      
      // Wait for countdown
      await new Promise(resolve => setTimeout(resolve, countdownDuration * 1000));
      
      // Capture photo
      const photo = await capturePhoto();
      if (photo) {
        photos.push(photo);
      }
      
      // Wait for interval between shots (except for last shot)
      if (i < multiShotCount - 1) {
        await new Promise(resolve => setTimeout(resolve, multiShotInterval));
      }
    }
    
    return photos;
  }, [multiShotCount, countdownDuration, multiShotInterval, capturePhoto]);

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCurrentPhoto(null);
    setIsCountingDown(false);
    setIsCapturing(false);
  }, []);

  // Clear all photos
  const clearPhotos = useCallback(() => {
    setCapturedPhotos([]);
    setCurrentPhoto(null);
  }, []);

  // Set photo size
  const setPhotoSize = useCallback((size: PhotoSize) => {
    setCurrentPhotoSize(size);
  }, []);

  return {
    isCapturing,
    isCountingDown,
    capturedPhotos,
    currentPhoto,
    startCountdown,
    capturePhoto,
    startMultiShot,
    retakePhoto,
    clearPhotos,
    setPhotoSize,
  };
};
