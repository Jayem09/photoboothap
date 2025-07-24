import React, { useState, useCallback } from 'react';
import { Photo } from '../../types/photo';
import { usePhotos } from '../../hooks/usePhotos';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface PhotoGalleryProps {
  sessionId?: string;
  userId?: string;
  onPhotoSelect?: (photo: Photo) => void;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  sessionId,
  userId,
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
  } = usePhotos({ sessionId, userId });

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
      <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-3'}>
        {photos.map((photo) => (
          <div
            key={photo.id}
            className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-gray-200 ${
              viewMode === 'list' ? 'flex items-center p-4' : ''
            }`}
            onClick={() => handlePhotoSelect(photo)}
          >
            {/* Photo Thumbnail */}
            {viewMode === 'list' ? (
              // REDESIGNED LIST MODE
              <>
                {/* Enhanced Thumbnail */}
                <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden shadow-sm bg-gradient-to-br from-gray-50 to-gray-100 ring-1 ring-gray-200">
                  <img
                    src={photo.processedSrc || photo.originalSrc}
                    alt={photo.filename}
                    className="w-full h-full object-cover transition-all duration-200 hover:scale-105"
                  />
                </div>

                {/* Enhanced Content Section */}
                <div className="flex-1 ml-5 min-w-0">
                  {/* Header with filename and status */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base font-semibold text-gray-900 truncate pr-2">
                        {photo.filename}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-500">
                          {new Date(photo.createdAt).toLocaleDateString()} at {new Date(photo.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="flex items-center gap-2">
                          {photo.isDownloaded && (
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                              <span className="text-xs text-emerald-600 font-medium">Downloaded</span>
                            </div>
                          )}
                          {photo.isShared && (
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                              <span className="text-xs text-blue-600 font-medium">Shared</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Metadata row */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                      </svg>
                      {photo.metadata.width} × {photo.metadata.height}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                      {(photo.metadata.fileSize / 1024).toFixed(1)} KB
                    </span>
                    <span className="flex items-center gap-1 capitalize">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
                      </svg>
                      {photo.metadata.format}
                    </span>
                  </div>

                  {/* Tags and stickers */}
                  {(photo.filtersApplied.basic.length > 0 || photo.stickers.length > 0) && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {photo.filtersApplied.basic.map(filter => (
                        <span 
                          key={filter} 
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 border border-indigo-100"
                        >
                          <svg className="w-2.5 h-2.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                          </svg>
                          {filter}
                        </span>
                      ))}
                      {photo.stickers.map(sticker => (
                        <span 
                          key={sticker.id} 
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-100"
                        >
                          <svg className="w-2.5 h-2.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03z" clipRule="evenodd"/>
                          </svg>
                          {sticker.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Enhanced Action Buttons */}
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  {/* Primary action - Download */}
                  <button
                    onClick={e => { e.stopPropagation(); handleDownload(photo); }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-sm transition-all duration-200 hover:shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </button>

                  {/* Secondary actions dropdown */}
                  <div className="relative group">
                    <button
                      onClick={e => e.stopPropagation()}
                      className="flex items-center justify-center w-9 h-9 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                      </svg>
                    </button>
                    
                    {/* Dropdown menu */}
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <div className="py-1">
                        <button
                          onClick={e => { e.stopPropagation(); handleShare(photo, 'facebook'); }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center text-white text-xs font-bold">f</div>
                          Share on Facebook
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleShare(photo, 'twitter'); }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-4 h-4 bg-sky-500 rounded-sm flex items-center justify-center text-white text-xs">𝕏</div>
                          Share on Twitter
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleShare(photo, 'whatsapp'); }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-4 h-4 bg-green-500 rounded-sm flex items-center justify-center text-white text-xs">💬</div>
                          Share on WhatsApp
                        </button>
                        <hr className="my-1 border-gray-100" />
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(photo.id); }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Photo
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // ORIGINAL GRID MODE (unchanged)
              <div className="relative aspect-square">
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
            )}
          </div>
        ))}
      </div>

      {/* Photo Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {selectedPhoto && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-6 relative flex flex-col items-center">
            {/* Close Button */}
              <button
                onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-gray-700 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md border border-gray-200 transition-all"
              aria-label="Close"
              >
                ×
              </button>
            {/* Photo Display */}
            <div className="mb-6 w-full flex justify-center">
              <img
                src={selectedPhoto.imageUrl || selectedPhoto.processedSrc || selectedPhoto.originalSrc}
                alt={selectedPhoto.filename}
                className="max-w-full max-h-[60vh] rounded-xl shadow-lg border border-gray-100 bg-gray-50"
                style={{ objectFit: 'contain' }}
              />
            </div>
            {/* Photo Details */}
            <div className="w-full grid grid-cols-2 gap-4 mb-4 text-sm">
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
              <div className="mb-4 w-full">
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
              <div className="mb-4 w-full">
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
            <div className="flex flex-wrap gap-2 mt-4 w-full justify-center">
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