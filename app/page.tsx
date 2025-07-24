"use client";

import React, { useState, useCallback } from "react";
import { Photo, Sticker, Frame } from "../types/photo";
import { AppliedFilters } from "../types/filters";
import { usePhotos } from "../hooks/usePhotos";
import CameraPreview from "../components/camera/CameraPreview";
import PhotoCanvas from "../components/editing/PhotoCanvas";
import PhotoGallery from "../components/editing/PhotoGallery";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Modal from "../components/ui/Modal";
import Head from 'next/head';
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";

type ViewMode = 'frame-selection' | 'camera' | 'editing' | 'gallery';

interface FrameLayout {
  id: string;
  name: string;
  photoCount: number;
  layout: 'horizontal' | 'vertical' | 'grid';
  columns?: number;
  rows?: number;
  description: string;
  sampleImage?: string;
}

const FRAME_LAYOUTS: FrameLayout[] = [
  {
    id: 'layout-1',
    name: 'Classic Strip (3 photos)',
    photoCount: 3,
    layout: 'vertical',
    description: 'Traditional vertical photo strip',
    sampleImage: '/frames/classic-strip-3.png'
  },
  {
    id: 'layout-2',
    name: 'Single Portrait',
    photoCount: 1,
    layout: 'vertical',
    description: 'One large portrait photo',
    sampleImage: '/frames/single-portrait.png'
  },
  {
    id: 'layout-3',
    name: 'Photo Strip (4 photos)',
    photoCount: 4,
    layout: 'vertical',
    description: 'Four photos in a vertical strip',
    sampleImage: '/frames/4stripe-image.png'
  },
  {
    id: 'layout-4',
    name: 'Grid (4 photos)',
    photoCount: 4,
    layout: 'grid',
    description: 'Four photos stripe',
    sampleImage: '/frames/4stripe-image-grid.png'
  },
  {
    id: 'layout-5',
    name: 'Wide Strip (4 photos)',
    photoCount: 4,
    layout: 'horizontal',
    description: 'Four photos in a horizontal layout',
    sampleImage: '/frames/wide-strip.png'
  }
];

const HomePage: React.FC = () => {
  const { data: session } = useSession();
  const userId = session?.user?.email ?? undefined;
  // Generate or retrieve a persistent sessionId for the session
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      let id = localStorage.getItem('photobooth-session-id');
      if (!id) {
        id = `session-${Date.now()}`;
        localStorage.setItem('photobooth-session-id', id);
      }
      return id;
    }
    return '';
  });
  const [viewMode, setViewMode] = useState<ViewMode>('frame-selection');
  const [selectedLayout, setSelectedLayout] = useState<FrameLayout | null>(null);
  const [currentPhoto, setCurrentPhoto] = useState<Photo | Photo[] | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<Photo[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({ basic: [], advanced: {} });
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { addPhoto, updatePhoto, downloadPhoto, sharePhoto } = usePhotos({ sessionId, userId });

  const handleBack = () => {
    setViewMode('frame-selection'); // or 'gallery', or whatever your previous page is
  };

  // Handle layout selection
  const handleLayoutSelect = useCallback((layout: FrameLayout) => {
    console.log('Selected layout:', layout);
    console.log('Photo count:', layout.photoCount);
    setSelectedLayout(layout);
    setViewMode('camera');
  }, []);

  // Handle photo capture
  const handlePhotoCaptured = useCallback((photos: Photo | Photo[]) => {
    console.log('Photos captured:', photos);
    
    // Only set currentPhoto for editing, do not add raw photos to gallery
    setCurrentPhoto(photos);
    setViewMode('editing');
  }, []);

  // Handle photo update
  const handlePhotoUpdate = useCallback((updates: Partial<Photo>) => {
    if (currentPhoto) {
      if (Array.isArray(currentPhoto)) {
        // Handle array of photos - update all photos with the same updates
        const updatedPhotos = currentPhoto.map(photo => ({ ...photo, ...updates }));
        setCurrentPhoto(updatedPhotos);
        // Update each photo individually
        updatedPhotos.forEach(photo => updatePhoto(photo.id, updates));
      } else {
        // Handle single photo
        const updatedPhoto = { ...currentPhoto, ...updates };
        setCurrentPhoto(updatedPhoto);
        updatePhoto(currentPhoto.id, updates);
      }
    }
  }, [currentPhoto, updatePhoto]);

  // Handle download
  const handleDownload = useCallback(() => {
    if (currentPhoto) {
      if (Array.isArray(currentPhoto)) {
        // For multiple photos, download the first one as representative
        downloadPhoto(currentPhoto[0]);
      } else {
        downloadPhoto(currentPhoto);
      }
    }
  }, [currentPhoto, downloadPhoto]);

  // Handle share
  const handleShare = useCallback((platform: string) => {
    if (currentPhoto) {
      if (Array.isArray(currentPhoto)) {
        // For multiple photos, share the first one as representative
        sharePhoto(currentPhoto[0], platform);
      } else {
        sharePhoto(currentPhoto, platform);
      }
    }
  }, [currentPhoto, sharePhoto]);

  // Handle filters change
  const handleFiltersChange = useCallback((filters: AppliedFilters) => {
    setAppliedFilters(filters);
  }, []);

  // Handle stickers change
  const handleStickersChange = useCallback((newStickers: Sticker[]) => {
    setStickers(newStickers);
  }, []);

  // Handle add sticker
  const handleAddSticker = useCallback((sticker: Sticker) => {
    setStickers(prev => [...prev, sticker]);
  }, []);

  // Handle remove sticker
  const handleRemoveSticker = useCallback((stickerId: string) => {
    setStickers(prev => prev.filter(s => s.id !== stickerId));
  }, []);

  // Handle update sticker
  const handleUpdateSticker = useCallback((stickerId: string, updates: Partial<Sticker>) => {
    setStickers(prev => prev.map(s => s.id === stickerId ? { ...s, ...updates } : s));
  }, []);

  // Handle frame selection
  const handleFrameSelect = useCallback((frame: Frame | null) => {
    setSelectedFrame(frame);
  }, []);

  // Handle frame removal
  const handleFrameRemove = useCallback(() => {
    setSelectedFrame(null);
  }, []);

  // Handle apply filters
  const handleApplyFilters = useCallback(() => {
    if (currentPhoto) {
      handlePhotoUpdate({
        filtersApplied: appliedFilters,
      });
    }
  }, [currentPhoto, appliedFilters, handlePhotoUpdate]);

  // Handle reset filters
  const handleResetFilters = useCallback(() => {
    setAppliedFilters({ basic: [], advanced: {} });
  }, []);

  // Handle retake photo
  const handleRetakePhoto = useCallback(() => {
    setCurrentPhoto(null);
    setAppliedFilters({ basic: [], advanced: {} });
    setStickers([]);
    setSelectedFrame(null);
    setViewMode('camera');
  }, []);

  // Handle new photo
  const handleNewPhoto = useCallback(() => {
    setViewMode('frame-selection');
  }, []);

  return (
    <>
      <Head>
        <title>SnapWithAdelaide</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-white via-pink-50 to-white">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Snap with Adelaide</h1>
                  <p className="text-gray-600 text-sm">Capture & Create Memories</p>
                </div>
              </div>
              {/* Navigation and Logout */}
              <div className="flex items-center space-x-4">
                <nav className="flex space-x-2">
                  <button
                    onClick={() => setViewMode('frame-selection')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      viewMode === 'frame-selection'
                        ? 'bg-pink-500 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    🖼️ Layouts
                  </button>
                  <button
                    onClick={() => setViewMode('camera')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      viewMode === 'camera'
                        ? 'bg-pink-500 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                    disabled={!selectedLayout}
                  >
                    📷 Camera
                  </button>
                  <button
                    onClick={() => setViewMode('editing')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      viewMode === 'editing'
                        ? 'bg-pink-500 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                    disabled={!currentPhoto}
                  >
                    ✨ Edit
                  </button>
                  <button
                    onClick={() => setViewMode('gallery')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      viewMode === 'gallery'
                        ? 'bg-pink-500 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    🖼️ Gallery
                  </button>
                </nav>
                <button
                  onClick={() => signOut()}
                  className="ml-4 px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {isLoading && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50">
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/30">
                <LoadingSpinner />
              </div>
            </div>
          )}

         {/* Frame Selection View */}
{viewMode === 'frame-selection' && (
    <div className="flex justify-center items-center min-h-screen p-4">
    <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose your layout</h2>
        <p className="text-gray-600">Select a layout for your photo session</p>
      </div>
      
      <div className="space-y-2">
        {FRAME_LAYOUTS.map((layout) => (
          <div 
            key={layout.id}
            className="flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
            onClick={() => handleLayoutSelect(layout)}
          >
            {/* Frame Preview */}
            <div className="flex-shrink-0 mr-4">
              {layout.sampleImage ? (
                <div className="w-16 h-20 bg-white border border-gray-200 rounded shadow-sm flex items-center justify-center">
                  <img 
                    src={layout.sampleImage}
                    alt={layout.name}
                    className="w-12 h-16 object-contain"
                    onError={(e) => {
                      console.error('Image failed to load:', layout.sampleImage);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="w-16 h-20 bg-white border border-gray-200 rounded shadow-sm flex items-center justify-center">
                  <div className="w-12 h-16 bg-black"></div>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="text-base font-medium text-gray-900">{layout.name}</h3>
              <p className="text-sm text-gray-500">{layout.photoCount} Poses</p>
            </div>

            {/* Simple arrow */}
            <div className="w-6 h-6 text-gray-400">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}

        {/* Camera View */}
        {viewMode === 'camera' && selectedLayout && (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-6">
              <h2 className="text-5xl font-bold text-black mb-4">
                Say Cheese! 📸
              </h2>
              <p className="text-gray-300 text-xl max-w-2xl mx-auto">
                Position yourself perfectly and click the capture button to start your photo session
              </p>
              
              {/* Layout Indicator */}
              <div className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-full text-sm font-medium shadow-lg">
                {selectedLayout.name} ({selectedLayout.photoCount} photos)
              </div>
            </div>
            
            {/* Camera Interface */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <CameraPreview
                  key="camera-main"
                  onPhotoCaptured={handlePhotoCaptured}
                  photoSize="medium"
                  countdownDuration={3}
                  audioEnabled={true}
                  multiShot={true}
                  multiShotCount={selectedLayout.photoCount}
                  onBack={handleBack}
                  sessionId={sessionId}
                />
              </div>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-4 pt-8">
              <div className="px-6 py-3 bg-white/10 backdrop-blur-md text-white rounded-full text-base font-medium border border-white/20">
                ✨ Professional Quality
              </div>
              <div className="px-6 py-3 bg-white/10 backdrop-blur-md text-white rounded-full text-base font-medium border border-white/20">
                🎨 Instant Editing
              </div>
              <div className="px-6 py-3 bg-white/10 backdrop-blur-md text-white rounded-full text-base font-medium border border-white/20">
                📱 Easy Sharing
              </div>
            </div>
          </div>
        )}

        {/* Editing View */}
        {viewMode === 'editing' && currentPhoto && selectedLayout && (
          <div className="flex flex-row items-start gap-12 max-w-6xl mx-auto">
            {/* Photo strip card only */}
            <div className="bg-white rounded-2xl shadow-lg p-8 w-full">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Photo Strip Preview</h2>
                <div className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                  {selectedLayout.name} ({selectedLayout.photoCount} photos)
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mt-8">
                <PhotoCanvas
                  photo={currentPhoto}
                  appliedFilters={appliedFilters}
                  stickers={stickers}
                  selectedFrame={selectedFrame || undefined}
                  onPhotoUpdate={handlePhotoUpdate}
                  onDownload={handleDownload}
                  onShare={handleShare}
                  selectedLayout={selectedLayout}
                  onRetake={handleRetakePhoto}
                  onBack={handleBack}
                  addPhoto={addPhoto}
                  sessionId={sessionId}
                  userId={userId}
                />
              </div>
            </div>
          </div>
        )}

        {/* Gallery View */}
        {viewMode === 'gallery' && (
          <div className="max-w-6xl mx-auto">
            <PhotoGallery sessionId={sessionId} userId={userId} />
          </div>
        )}
      </main>
    </div>
    </>
  );
};

export default HomePage;