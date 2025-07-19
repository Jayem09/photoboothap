"use client";

import React, { useRef, useState, useEffect } from "react";
import Button from "../ui/Button";
import LoadingSpinner from "../ui/LoadingSpinner";

interface CameraPreviewProps {
  onPhotoCaptured?: (photo: any) => void;
  photoSize?: 'small' | 'medium' | 'large';
  countdownDuration?: number;
  audioEnabled?: boolean;
  multiShot?: boolean;
  multiShotCount?: number;
}

const CameraPreview: React.FC<CameraPreviewProps> = ({
  onPhotoCaptured,
  photoSize = 'medium',
  countdownDuration = 3,
  audioEnabled = false,
  multiShot = false,
  multiShotCount = 1,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<any[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [showGallery, setShowGallery] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('No Filter');
  const [isCapturingSession, setIsCapturingSession] = useState(false);
  const [currentCountdownDuration, setCurrentCountdownDuration] = useState(countdownDuration);

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        setIsInitializing(true);
        setError(null);

        // Check browser support
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera not supported in this browser');
        }

        // Request camera access
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        });

        setStream(mediaStream);
        setIsInitializing(false);
      } catch (err) {
        console.error('Camera error:', err);
        setError(err instanceof Error ? err.message : 'Failed to access camera');
        setIsInitializing(false);
      }
    };

    // Simple delay to ensure component is rendered
    const timer = setTimeout(initCamera, 100);
    return () => clearTimeout(timer);
  }, []);

  // Set video source when stream is available
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        console.error('Video play error:', err);
        setError('Failed to play video');
      });
    }
  }, [stream]);

  // Handle countdown
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCountdown(null);
      // Countdown finished, but don't trigger anything here
    }
  }, [countdown]);

  // Execute photo capture
  const executeCapture = async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas not available');
      return;
    }

    try {
      setIsCapturing(true);
      console.log('Capturing photo...');

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas context not available');

      // Make sure video has loaded metadata
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error('Video not ready');
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Create a copy of the original image data
      const originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Apply filter to the canvas if a filter is selected
      if (selectedFilter !== 'No Filter') {
        console.log('Applying filter:', selectedFilter);
        applyFilterToCanvas(ctx, canvas.width, canvas.height);
        console.log('Filter applied successfully');
      } else {
        console.log('No filter selected');
      }

      const photo = {
        id: Date.now().toString(),
        sessionId: `session-${Date.now()}`,
        filename: `photo-${Date.now()}.jpg`,
        originalSrc: canvas.toDataURL('image/jpeg', 0.9),
        processedSrc: canvas.toDataURL('image/jpeg', 0.9),
        filtersApplied: selectedFilter !== 'No Filter' ? applyFilterToPhoto({}).filtersApplied : { basic: [], advanced: {} },
        stickers: [],
        size: 'medium' as const,
        createdAt: new Date(),
        isDownloaded: false,
        isShared: false,
        metadata: {
          width: canvas.width,
          height: canvas.height,
          fileSize: Math.round(canvas.toDataURL('image/jpeg', 0.9).length * 0.75),
          format: 'jpeg' as const,
        },
      };

      console.log('Photo captured:', photo);
      setCapturedPhotos(prev => [...prev, photo]);
    } catch (err) {
      console.error('Capture error:', err);
      setError('Failed to capture photo');
    } finally {
      setIsCapturing(false);
    }
  };

  // Start continuous photo capture
  const capturePhoto = () => {
    console.log('Starting continuous capture...');
    startContinuousCapture();
  };

  // Start continuous capture based on multiShotCount
  const startContinuousCapture = async () => {
    if (isCapturingSession) return; // Prevent multiple sessions
    
    console.log(`Starting continuous capture of ${multiShotCount} photos...`);
    console.log('multiShotCount prop value:', multiShotCount);
    console.log('multiShot prop value:', multiShot);
    setIsCapturingSession(true);
    
    try {
      for (let i = 0; i < multiShotCount; i++) {
        console.log(`Starting capture ${i + 1} of ${multiShotCount}`);
        
        // Start countdown for each photo
        setCountdown(currentCountdownDuration);
        
        // Wait for countdown to complete
        await new Promise(resolve => setTimeout(resolve, currentCountdownDuration * 1000));
        
        // Capture the photo
        await executeCapture();
        
        // Wait a bit before next capture
        if (i < multiShotCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Show gallery after all photos are captured
      setShowGallery(true);
    } finally {
      setIsCapturingSession(false);
    }
  };

  // Handle retry
  const handleRetry = () => {
    setError(null);
    setIsInitializing(true);
    window.location.reload();
  };

  // Handle photo selection
  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  // Handle edit selected photos
  const handleEditSelected = () => {
    const selectedPhotoIds = Array.from(selectedPhotos);
    const photosToEdit = capturedPhotos.filter(photo => selectedPhotoIds.includes(photo.id));
    
    // Apply selected filter to photos if not "No Filter"
    const filteredPhotos = selectedFilter !== 'No Filter' 
      ? photosToEdit.map(photo => applyFilterToPhoto(photo))
      : photosToEdit;
    
    if (filteredPhotos.length > 0 && onPhotoCaptured) {
      onPhotoCaptured(filteredPhotos);
    }
  };

  // Handle edit all photos
  const handleEditAll = () => {
    if (capturedPhotos.length > 0 && onPhotoCaptured) {
      // Apply selected filter to all photos if not "No Filter"
      const filteredPhotos = selectedFilter !== 'No Filter' 
        ? capturedPhotos.map(photo => applyFilterToPhoto(photo))
        : capturedPhotos;
      
      onPhotoCaptured(filteredPhotos);
    }
  };

  // Handle select all photos
  const handleSelectAll = () => {
    const allPhotoIds = capturedPhotos.map(photo => photo.id);
    setSelectedPhotos(new Set(allPhotoIds));
  };

  // Handle deselect all photos
  const handleDeselectAll = () => {
    setSelectedPhotos(new Set());
  };

  // Handle filter selection
  const handleFilterSelect = (filter: string) => {
    setSelectedFilter(filter);
  };

  // Apply filter to canvas context
  const applyFilterToCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    switch (selectedFilter) {
      case 'B&W':
        // Convert to grayscale
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          data[i] = gray;     // Red
          data[i + 1] = gray; // Green
          data[i + 2] = gray; // Blue
        }
        break;
        
      case 'Sepia':
        // Apply sepia effect
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
          data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
          data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
        }
        break;
        
      case 'Vintage':
        // Apply vintage effect (sepia + slight color adjustment)
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189) + 20);
          data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168) + 10);
          data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
        }
        break;
        
      case 'Noir':
        // High contrast black and white
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          const contrast = Math.min(255, Math.max(0, (gray - 128) * 1.5 + 128));
          data[i] = contrast;
          data[i + 1] = contrast;
          data[i + 2] = contrast;
        }
        break;
        
      case 'Vivid':
        // Increase saturation and contrast
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.2);     // Red
          data[i + 1] = Math.min(255, data[i + 1] * 1.2); // Green
          data[i + 2] = Math.min(255, data[i + 2] * 1.2); // Blue
        }
        break;
        
      case 'Warm':
        // Warm color temperature
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.1);     // Increase red
          data[i + 2] = Math.min(255, data[i + 2] * 0.9); // Decrease blue
        }
        break;
        
      case 'Cool':
        // Cool color temperature
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 0.9);     // Decrease red
          data[i + 2] = Math.min(255, data[i + 2] * 1.1); // Increase blue
        }
        break;
        
      case 'Soft':
        // Soft effect (slight blur simulation)
        // This is a simplified soft effect - in a real implementation you'd use convolution
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.05);
          data[i + 1] = Math.min(255, data[i + 1] * 1.05);
          data[i + 2] = Math.min(255, data[i + 2] * 1.05);
        }
        break;
    }
    
    ctx.putImageData(imageData, 0, 0);
  };

  // Get image style based on applied filters
  const getImageStyle = (filtersApplied: any) => {
    if (!filtersApplied) return {};
    
    let filter = '';
    
    // Apply basic filters
    filtersApplied.basic?.forEach((basicFilter: string) => {
      switch (basicFilter) {
        case 'grayscale':
          filter += 'grayscale(100%) ';
          break;
        case 'sepia':
          filter += 'sepia(100%) ';
          break;
        case 'blur':
          filter += 'blur(2px) ';
          break;
        case 'brightness':
          filter += 'brightness(1.2) ';
          break;
        case 'contrast':
          filter += 'contrast(1.2) ';
          break;
        case 'saturate':
          filter += 'saturate(1.5) ';
          break;
        case 'hue-rotate':
          filter += 'hue-rotate(90deg) ';
          break;
        case 'invert':
          filter += 'invert(100%) ';
          break;
        default:
          break;
      }
    });

    // Apply advanced filters
    Object.entries(filtersApplied.advanced || {}).forEach(([key, value]) => {
      switch (key) {
        case 'brightness':
          filter += `brightness(${value}%) `;
          break;
        case 'contrast':
          filter += `contrast(${value}%) `;
          break;
        case 'saturate':
          filter += `saturate(${value}%) `;
          break;
        case 'blur':
          filter += `blur(${value}px) `;
          break;
        default:
          break;
      }
    });

    return { filter: filter.trim() || 'none' };
  };

  // Apply filter to photo
  const applyFilterToPhoto = (photo: any) => {
    const filteredPhoto = { ...photo };
    
    switch (selectedFilter) {
      case 'B&W':
        filteredPhoto.filtersApplied = { basic: ['grayscale'], advanced: {} };
        break;
      case 'Sepia':
        filteredPhoto.filtersApplied = { basic: ['sepia'], advanced: {} };
        break;
      case 'Vintage':
        filteredPhoto.filtersApplied = { basic: ['sepia'], advanced: { brightness: 110, contrast: 120 } };
        break;
      case 'Soft':
        filteredPhoto.filtersApplied = { basic: [], advanced: { brightness: 105, blur: 1 } };
        break;
      case 'Noir':
        filteredPhoto.filtersApplied = { basic: ['grayscale'], advanced: { contrast: 150, brightness: 90 } };
        break;
      case 'Vivid':
        filteredPhoto.filtersApplied = { basic: [], advanced: { saturate: 150, contrast: 120 } };
        break;
      case 'Warm':
        filteredPhoto.filtersApplied = { basic: [], advanced: { brightness: 105, saturate: 110 } };
        break;
      case 'Cool':
        filteredPhoto.filtersApplied = { basic: [], advanced: { brightness: 95, saturate: 90 } };
        break;
      default:
        filteredPhoto.filtersApplied = { basic: [], advanced: {} };
        break;
    }
    
    return filteredPhoto;
  };

  // Handle continue capturing
  const handleContinueCapturing = () => {
    setShowGallery(false);
    setSelectedPhotos(new Set());
  };

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg border border-red-200">
        <div className="text-red-600 text-lg font-semibold mb-2">📷 Camera Error</div>
        <div className="text-red-500 text-center mb-4">{error}</div>
        <Button 
          label="🔄 Retry Camera" 
          onClick={handleRetry}
        />
        <div className="text-xs text-gray-500 mt-2 text-center">
          Make sure to allow camera permissions in your browser
        </div>
      </div>
    );
  }

  // Loading state
  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <LoadingSpinner />
        <div className="mt-4 text-gray-600">Setting up camera...</div>
        <div className="text-xs text-gray-500 mt-2 text-center">
          Please allow camera access when prompted
        </div>
      </div>
    );
  }

  // Show gallery after capturing multiple photos
  if (showGallery) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Photos to Edit</h2>
          <p className="text-gray-600">Choose up to 3 photos to edit</p>
        </div>

        {/* Photo Gallery */}
        <div className="grid grid-cols-3 gap-4 max-w-4xl">
          {capturedPhotos.map((photo, index) => (
            <div
              key={photo.id}
              className={`relative cursor-pointer rounded-lg overflow-hidden border-4 transition-all ${
                selectedPhotos.has(photo.id)
                  ? 'border-blue-500 shadow-lg scale-105'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => togglePhotoSelection(photo.id)}
            >
              <img
                src={photo.originalSrc}
                alt={`Photo ${index + 1}`}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 right-2">
                {selectedPhotos.has(photo.id) ? (
                  <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    ✓
                  </div>
                ) : (
                  <div className="bg-white bg-opacity-75 text-gray-600 rounded-full w-6 h-6 flex items-center justify-center text-sm">
                    {index + 1}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Gallery Controls */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            label="🔄 Continue Capturing"
            onClick={handleContinueCapturing}
            variant="secondary"
          />
          <Button
            label={selectedPhotos.size === capturedPhotos.length ? "❌ Deselect All" : "✅ Select All"}
            onClick={selectedPhotos.size === capturedPhotos.length ? handleDeselectAll : handleSelectAll}
            variant="secondary"
          />
          <Button
            label={`✏️ Edit Selected (${selectedPhotos.size})`}
            onClick={handleEditSelected}
            disabled={selectedPhotos.size === 0}
          />
          <Button
            label="✏️ Edit All Photos"
            onClick={handleEditAll}
          />
        </div>

        {/* Selection Info */}
        <div className="text-sm text-gray-600">
          {selectedPhotos.size > 0 
            ? `Selected ${selectedPhotos.size} of ${capturedPhotos.length} photo${capturedPhotos.length !== 1 ? 's' : ''}`
            : `Click on photos to select them for editing (${capturedPhotos.length} total)`
          }
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Layout Selection */}
      <div className="text-center mb-6">
        <div className="inline-block bg-pink-100 text-pink-800 px-4 py-2 rounded-full text-sm font-medium">
          Layout: {multiShotCount} photo{multiShotCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Main Photo Booth Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Camera Feed - Left Side */}
        <div className="lg:col-span-2">
          <div className="relative bg-gray-900 rounded-lg overflow-hidden w-full h-96 lg:h-[500px]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
            />
            
            {/* Status indicator */}
            {stream && (
              <div className="absolute top-2 left-2 bg-green-500 bg-opacity-75 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                Camera Ready
              </div>
            )}
            
            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
                <div className="bg-white rounded-lg p-8">
                  <div className="text-green-600 text-8xl font-bold animate-pulse">
                    {countdown}
                  </div>
                </div>
              </div>
            )}
            
            {/* Capture Status */}
            {isCapturing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
                <div className="bg-pink-100 rounded-lg px-4 py-2">
                  <div className="text-pink-800 text-xl font-bold animate-pulse">Capturing...</div>
                </div>
              </div>
            )}
          </div>

          {/* Camera Controls */}
          <div className="mt-4 flex flex-col items-center space-y-4">
            {!isCapturing && !isCapturingSession && stream && countdown === null && (
              <Button 
                label="📸 Start Photo Session" 
                onClick={capturePhoto}
                className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-lg text-lg font-semibold"
              />
            )}

            {/* Countdown Selection */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Select Countdown Time:</span>
              <select 
                className="border border-gray-300 rounded px-2 py-1 text-sm"
                value={currentCountdownDuration}
                onChange={(e) => {
                  const newDuration = parseInt(e.target.value);
                  setCurrentCountdownDuration(newDuration);
                }}
              >
                <option value="3">3s</option>
                <option value="5">5s</option>
                <option value="10">10s</option>
              </select>
            </div>

            {/* Capture Status */}
            {isCapturingSession && (
              <div className="bg-pink-100 text-pink-800 px-4 py-2 rounded-lg text-sm font-medium">
                Capturing... ({capturedPhotos.length}/{multiShotCount})
              </div>
            )}
          </div>
        </div>

        {/* Captured Photos Preview - Right Side */}
        <div className="lg:col-span-1">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Captured Photos</h3>
            
            {/* Photo Preview Strip */}
            <div className="space-y-3">
              {capturedPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="relative bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"
                >
                  <img
                    src={photo.originalSrc}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-32 object-cover"
                    style={getImageStyle(photo.filtersApplied)}
                  />
                  <div className="absolute top-2 right-2 bg-white bg-opacity-75 text-gray-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  {photo.filtersApplied && (photo.filtersApplied.basic.length > 0 || Object.keys(photo.filtersApplied.advanced).length > 0) && (
                    <div className="absolute bottom-2 left-2 bg-pink-500 text-white text-xs px-2 py-1 rounded-full">
                      🎨
                    </div>
                  )}
                </div>
              ))}
              
              {/* Empty slots for remaining photos */}
              {Array.from({ length: Math.max(0, multiShotCount - capturedPhotos.length) }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 h-32 flex items-center justify-center"
                >
                  <div className="text-gray-400 text-sm">
                    Photo {capturedPhotos.length + index + 1}
                  </div>
                </div>
              ))}
            </div>

            {/* Photo Count */}
            {capturedPhotos.length > 0 && (
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg text-center">
                📷 {capturedPhotos.length}/{multiShotCount} photo{capturedPhotos.length !== 1 ? 's' : ''} captured
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Options */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          Choose a filter for your photos!
        </h3>
        
        {/* Selected Filter Indicator */}
        {/* {selectedFilter !== 'No Filter' && (
          <div className="text-center mb-4">
            <div className="inline-block bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-medium">
              🎨 Filter: {selectedFilter}
            </div>
          </div>
        )} */}
        
        <div className="flex flex-wrap justify-center gap-2">
          {['No Filter', 'B&W', 'Sepia', 'Vintage', 'Soft', 'Noir', 'Vivid', 'Warm', 'Cool'].map((filter) => (
            <button
              key={filter}
              onClick={() => handleFilterSelect(filter)}
              className={`border rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                selectedFilter === filter
                  ? 'bg-pink-500 text-white border-pink-500 shadow-lg'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-pink-300'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        
        {/* Filter Description */}
        <div className="text-center mt-3">
          <p className="text-sm text-gray-600">
            {selectedFilter === 'No Filter' && 'Original photos without any effects'}
            {selectedFilter === 'B&W' && 'Classic black and white photography'}
            {selectedFilter === 'Sepia' && 'Vintage brown-tone effect'}
            {selectedFilter === 'Vintage' && 'Old-school film look with warm tones'}
            {selectedFilter === 'Soft' && 'Gentle, dreamy soft focus effect'}
            {selectedFilter === 'Noir' && 'High contrast black and white'}
            {selectedFilter === 'Vivid' && 'Bold, saturated colors'}
            {selectedFilter === 'Warm' && 'Cozy warm color temperature'}
            {selectedFilter === 'Cool' && 'Cool blue-tinted effect'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CameraPreview;