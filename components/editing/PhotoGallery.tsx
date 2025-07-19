import React, { useState, useCallback } from 'react';
import { Photo } from '../../types/photo';
import { usePhotos } from '../../hooks/usePhotos';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface PhotoGalleryProps {
  sessionId?: string;
  onPhotoSelect?: (photo: Photo) => void;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  sessionId,
  onPhotoSelect,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const {
    photos,
    downloadPhoto,
    sharePhoto,
    deletePhoto,
    clearSession,
    exportSession,
  } = usePhotos({ sessionId });

  // Handle photo selection
  const handlePhotoSelect = useCallback((photo: Photo) => {
    setSelectedPhoto(photo);
    setIsModalOpen(true);
    if (onPhotoSelect) {
      onPhotoSelect(photo);
    }
  }, [onPhotoSelect]);

  // Handle photo download
  const handleDownload = useCallback((photo: Photo) => {
    downloadPhoto(photo);
  }, [downloadPhoto]);

  // Handle photo share
  const handleShare = useCallback((photo: Photo, platform: string) => {
    sharePhoto(photo, platform);
  }, [sharePhoto]);

  // Handle photo deletion
  const handleDelete = useCallback((photoId: string) => {
    deletePhoto(photoId);
    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto(null);
      setIsModalOpen(false);
    }
  }, [deletePhoto, selectedPhoto]);

  // Handle session export
  const handleExportSession = useCallback(() => {
    exportSession();
  }, [exportSession]);

  // Handle session clear
  const handleClearSession = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all photos? This action cannot be undone.')) {
      clearSession();
    }
  }, [clearSession]);

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-4">No photos yet</div>
        <div className="text-gray-400 text-sm">Take some photos to see them here!</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gallery Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Photo Gallery ({photos.length} photos)
          </h3>
          <p className="text-sm text-gray-600">
            Session: {sessionId || 'Current Session'}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 text-sm ${
                viewMode === 'grid'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              List
            </button>
          </div>
          
          <Button 
            label="Export Session" 
            onClick={handleExportSession}
          />
          <Button 
            label="Clear All" 
            onClick={handleClearSession}
          />
        </div>
      </div>

      {/* Photo Grid/List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-4'}>
        {photos.map((photo) => (
          <div
            key={photo.id}
            className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform hover:scale-105 ${
              viewMode === 'list' ? 'flex' : ''
            }`}
            onClick={() => handlePhotoSelect(photo)}
          >
            {/* Photo Thumbnail */}
            <div className={`relative ${viewMode === 'list' ? 'w-24 h-24 flex-shrink-0' : 'aspect-square'}`}>
              <img
                src={photo.processedSrc || photo.originalSrc}
                alt={photo.filename}
                className="w-full h-full object-cover"
              />
              
              {/* Photo Status Indicators */}
              <div className="absolute top-2 right-2 flex space-x-1">
                {photo.isDownloaded && (
                  <div className="w-2 h-2 bg-green-500 rounded-full" title="Downloaded" />
                )}
                {photo.isShared && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" title="Shared" />
                )}
              </div>
              
              {/* Photo Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2">
                <div className="font-medium">{photo.filename}</div>
                <div>{new Date(photo.createdAt).toLocaleTimeString()}</div>
              </div>
            </div>

            {/* Photo Details (List Mode) */}
            {viewMode === 'list' && (
              <div className="flex-1 p-4">
                <div className="space-y-2">
                  <div className="font-medium text-gray-800">{photo.filename}</div>
                  <div className="text-sm text-gray-600">
                    Size: {photo.metadata.width} × {photo.metadata.height}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(photo.createdAt).toLocaleString()}
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(photo);
                      }}
                      className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                    >
                      Download
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(photo.id);
                      }}
                      className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Photo Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {selectedPhoto && (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {selectedPhoto.filename}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            {/* Photo Display */}
            <div className="mb-4">
              <img
                src={selectedPhoto.processedSrc || selectedPhoto.originalSrc}
                alt={selectedPhoto.filename}
                className="max-w-full h-auto rounded-lg shadow-lg"
              />
            </div>
            
            {/* Photo Details */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">Size</div>
                <div className="text-gray-600">
                  {selectedPhoto.metadata.width} × {selectedPhoto.metadata.height}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-700">File Size</div>
                <div className="text-gray-600">
                  {(selectedPhoto.metadata.fileSize / 1024).toFixed(1)} KB
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Created</div>
                <div className="text-gray-600">
                  {new Date(selectedPhoto.createdAt).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Format</div>
                <div className="text-gray-600 capitalize">
                  {selectedPhoto.metadata.format}
                </div>
              </div>
            </div>
            
            {/* Applied Filters */}
            {selectedPhoto.filtersApplied.basic.length > 0 && (
              <div className="mb-4">
                <div className="font-medium text-gray-700 mb-2">Applied Filters</div>
                <div className="flex flex-wrap gap-2">
                  {selectedPhoto.filtersApplied.basic.map(filter => (
                    <span
                      key={filter}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {filter}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Stickers */}
            {selectedPhoto.stickers.length > 0 && (
              <div className="mb-4">
                <div className="font-medium text-gray-700 mb-2">Stickers</div>
                <div className="flex flex-wrap gap-2">
                  {selectedPhoto.stickers.map(sticker => (
                    <span
                      key={sticker.id}
                      className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                    >
                      {sticker.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button 
                label="Download" 
                onClick={() => handleDownload(selectedPhoto)}
              />
              <Button 
                label="Share on Facebook" 
                onClick={() => handleShare(selectedPhoto, 'facebook')}
              />
              <Button 
                label="Share on Twitter" 
                onClick={() => handleShare(selectedPhoto, 'twitter')}
              />
              <Button 
                label="Share on WhatsApp" 
                onClick={() => handleShare(selectedPhoto, 'whatsapp')}
              />
              <Button 
                label="Delete" 
                onClick={() => handleDelete(selectedPhoto.id)}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PhotoGallery; 