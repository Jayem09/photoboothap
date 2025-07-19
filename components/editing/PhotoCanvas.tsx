import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Photo, Sticker, Frame } from '../../types/photo';
import { AppliedFilters } from '../../types/filters';
import Button from '../ui/Button';

interface FrameLayout {
  id: string;
  name: string;
  photoCount: number;
  layout: 'horizontal' | 'vertical' | 'grid';
  columns?: number;
  rows?: number;
  description: string;
}

interface PhotoCanvasProps {
  photo: Photo | Photo[]; // Changed to accept single photo or array of photos
  appliedFilters: AppliedFilters;
  stickers: Sticker[];
  selectedFrame?: Frame;
  selectedLayout?: FrameLayout;
  onPhotoUpdate: (updates: Partial<Photo>) => void;
  onDownload: () => void;
  onShare: (platform: string) => void;
}

const PhotoCanvas: React.FC<PhotoCanvasProps> = ({
  photo,
  appliedFilters,
  stickers,
  selectedFrame,
  selectedLayout,
  onPhotoUpdate,
  onDownload,
  onShare,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImageSrc, setProcessedImageSrc] = useState<string>('');
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Convert photo to array for consistent handling
  const photos = Array.isArray(photo) ? photo : [photo];
  const primaryPhoto = photos[0]; // Use first photo as primary for metadata

  // Function to get dynamic rotation for grid layout
  const getGridRotation = (index: number) => {
    const rotations = [-3, 2, -1, 4]; // Different rotations for each photo
    return rotations[index] || 0;
  };

  // Function to get offset positioning for grid layout
  const getGridOffset = (index: number) => {
    const offsets = [
      { x: -2, y: -1 }, // Top left
      { x: 1, y: -2 },  // Top right
      { x: -1, y: 1 },  // Bottom left
      { x: 2, y: 0 }    // Bottom right
    ];
    return offsets[index] || { x: 0, y: 0 };
  };

  // Set initial processed image source
  useEffect(() => {
    if (primaryPhoto?.originalSrc) {
      setProcessedImageSrc(primaryPhoto.processedSrc || primaryPhoto.originalSrc);
    }
  }, [primaryPhoto?.originalSrc, primaryPhoto?.processedSrc]);

  // Apply CSS filters based on appliedFilters
  const getImageStyle = () => {
    let filter = '';
    
    // Apply basic filters
    appliedFilters.basic.forEach(basicFilter => {
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
    Object.entries(appliedFilters.advanced).forEach(([key, value]) => {
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

  // Handle sticker selection
  const handleStickerClick = useCallback((stickerId: string) => {
    setSelectedSticker(selectedSticker === stickerId ? null : stickerId);
  }, [selectedSticker]);

  // Handle mouse events for dragging stickers
  const handleMouseDown = useCallback((e: React.MouseEvent, stickerId: string) => {
    if (!selectedSticker || selectedSticker !== stickerId) return;
    
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, [selectedSticker]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedSticker) return;
    
    const sticker = stickers.find(s => s.id === selectedSticker);
    if (!sticker) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;

    // Update sticker position
    const updatedStickers = stickers.map(s =>
      s.id === selectedSticker ? { ...s, x: newX, y: newY } : s
    );
    
    onPhotoUpdate({ stickers: updatedStickers });
  }, [isDragging, selectedSticker, stickers, dragOffset, onPhotoUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle keyboard events for selected sticker
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedSticker) return;

      const sticker = stickers.find(s => s.id === selectedSticker);
      if (!sticker) return;

      let updatedSticker = { ...sticker };

      switch (e.key) {
        case 'ArrowLeft':
          updatedSticker.x -= 5;
          break;
        case 'ArrowRight':
          updatedSticker.x += 5;
          break;
        case 'ArrowUp':
          updatedSticker.y -= 5;
          break;
        case 'ArrowDown':
          updatedSticker.y += 5;
          break;
        case 'Delete':
        case 'Backspace':
          const updatedStickers = stickers.filter(s => s.id !== selectedSticker);
          onPhotoUpdate({ stickers: updatedStickers });
          setSelectedSticker(null);
          return;
        default:
          return;
      }

      const updatedStickers = stickers.map(s =>
        s.id === selectedSticker ? updatedSticker : s
      );
      onPhotoUpdate({ stickers: updatedStickers });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedSticker, stickers, onPhotoUpdate]);

  if (!primaryPhoto?.originalSrc) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <div className="text-gray-500">No photo available</div>
      </div>
    );
  }

    // Create photo strip based on selected layout
  const createPhotoStrip = () => {
    const photoCount = selectedLayout?.photoCount || 3;
    const layout = selectedLayout?.layout || 'vertical';
    
    // For single portrait, create a different layout
    if (photoCount === 1) {
      const portraitStyle = {
        backgroundColor: 'white',
        border: '2px solid white',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
        width: '200px',
        margin: '0 auto',
      };

      return (
        <div className="relative" style={portraitStyle}>
          {/* Single Portrait */}
          <div className="relative">
            <div className="bg-black rounded-none h-48">
              {/* Photo content */}
              <img
                src={primaryPhoto.originalSrc}
                alt="Portrait"
                className="w-full h-full object-cover"
                style={getImageStyle()}
              />
              
              {/* Sticker overlays */}
              {stickers.map((sticker) => (
                <div
                  key={sticker.id}
                  className={`absolute cursor-move ${
                    selectedSticker === sticker.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  style={{
                    left: sticker.x,
                    top: sticker.y,
                    width: sticker.width,
                    height: sticker.height,
                    transform: `rotate(${sticker.rotation}deg)`,
                    zIndex: sticker.zIndex,
                  }}
                  onClick={() => handleStickerClick(sticker.id)}
                  onMouseDown={(e) => handleMouseDown(e, sticker.id)}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                >
                  <img
                    src={sticker.src}
                    alt={sticker.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Portrait footer */}
          <div className="text-center mt-3 text-gray-600 text-xs">
            PhotoBooth - {new Date().toLocaleDateString()}, {new Date().toLocaleTimeString()}
          </div>
        </div>
      );
    }
    
    // For multiple photos, create photo strip
    const stripStyle = {
      background: layout === 'grid' ? '#f8f9fa' : layout === 'horizontal' ? 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)' : 'white',
      border: layout === 'grid' ? '1px solid #e9ecef' : layout === 'horizontal' ? '3px solid white' : '2px solid white',
      borderRadius: layout === 'grid' ? '12px' : layout === 'horizontal' ? '4px' : '8px',
      padding: layout === 'grid' ? '16px' : layout === 'horizontal' ? '8px' : '12px',
      boxShadow: layout === 'grid' ? '0 8px 25px rgba(0,0,0,0.1)' : layout === 'horizontal' ? '0 8px 25px rgba(0,0,0,0.15)' : '0 4px 8px rgba(0,0,0,0.15)',
      width: layout === 'grid' ? '320px' : layout === 'horizontal' ? '420px' : '200px',
      margin: '0 auto',
    };

    return (
      <div className="relative" style={stripStyle}>
        {/* Photo Strip Container */}
        {layout === 'horizontal' && (
          <>
            {/* Main torn edge */}
            <div 
              className="absolute -right-1 top-0 bottom-0 w-3 bg-white"
              style={{
                clipPath: 'polygon(0 0, 100% 0, 85% 15%, 100% 30%, 85% 45%, 100% 60%, 85% 75%, 100% 90%, 85% 100%, 0 100%)',
                boxShadow: '2px 0 4px rgba(0,0,0,0.1)'
              }}
            />
            {/* Additional torn edge detail */}
            <div 
              className="absolute -right-2 top-2 bottom-2 w-1 bg-white opacity-60"
              style={{
                clipPath: 'polygon(0 0, 100% 0, 70% 25%, 100% 50%, 70% 75%, 100% 100%, 0 100%)'
              }}
            />
            {/* Subtle border accent */}
            <div 
              className="absolute inset-0 border border-white/20 pointer-events-none"
              style={{ borderRadius: '4px' }}
            />
          </>
        )}
        <div className={
          layout === 'grid' ? 'grid grid-cols-2 gap-4 p-4 relative' : 
          layout === 'horizontal' ? `grid grid-cols-${photoCount} gap-0` : 
          'space-y-1'
        }>
          {/* Photos based on layout */}
          {Array.from({ length: photoCount }).map((_, index) => (
            <div key={index} className="relative">
              <div 
                className={`bg-black rounded-none ${
                  layout === 'grid' ? 'h-32' :
                  layout === 'horizontal' ? 'h-36' : 'h-32'
                }`}
                style={{
                  border: layout === 'grid' ? '3px solid white' : layout === 'horizontal' ? '2px solid white' : '1px solid #e5e7eb',
                  marginBottom: layout === 'vertical' && index < photoCount - 1 ? '2px' : '0',
                  transform: layout === 'grid' ? `rotate(${getGridRotation(index)}deg) translate(${getGridOffset(index).x}px, ${getGridOffset(index).y}px)` : 'none',
                  boxShadow: layout === 'grid' ? '0 6px 20px rgba(0,0,0,0.2)' : layout === 'horizontal' ? '0 2px 4px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.1)' : 'none',
                  transition: layout === 'grid' ? 'transform 0.3s ease' : layout === 'horizontal' ? 'all 0.3s ease' : 'none',
                  backgroundColor: layout === 'grid' ? 'white' : 'black',
                  padding: layout === 'grid' ? '8px' : '0',
                  borderRight: layout === 'horizontal' && index < photoCount - 1 ? '2px solid white' : 'none',
                  position: layout === 'horizontal' ? 'relative' : 'static'
                }}
              >
                {/* Photo content */}
                <img
                  src={photos[index]?.originalSrc || photos[0]?.originalSrc || primaryPhoto?.originalSrc}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                  style={getImageStyle()}
                />
                
                {/* Sticker overlays for each photo */}
                {stickers.map((sticker) => (
                  <div
                    key={`${sticker.id}-${index}`}
                    className={`absolute cursor-move ${
                      selectedSticker === sticker.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    style={{
                      left: sticker.x,
                      top: sticker.y,
                      width: sticker.width,
                      height: sticker.height,
                      transform: `rotate(${sticker.rotation}deg)`,
                      zIndex: sticker.zIndex,
                    }}
                    onClick={() => handleStickerClick(sticker.id)}
                    onMouseDown={(e) => handleMouseDown(e, sticker.id)}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                  >
                    <img
                      src={sticker.src}
                      alt={sticker.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Photo strip footer */}
        <div className="text-center mt-3 text-gray-600 text-xs">
          PhotoBooth - {new Date().toLocaleDateString()}, {new Date().toLocaleTimeString()}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Photo Strip Display */}
      <div className="relative">
        {createPhotoStrip()}
        
        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
            <div className="text-white text-lg">Processing...</div>
          </div>
        )}
      </div>

      {/* Photo Info */}
      <div className="text-center space-y-2">
        <div className="text-sm text-gray-600">
          Photos: {photos.length} captured
        </div>
        {primaryPhoto?.metadata && (
          <>
            <div className="text-sm text-gray-600">
              Size: {primaryPhoto.metadata.width} × {primaryPhoto.metadata.height}
            </div>
            <div className="text-sm text-gray-600">
              File size: {(primaryPhoto.metadata.fileSize / 1024).toFixed(1)} KB
            </div>
          </>
        )}
        {appliedFilters.basic.length > 0 && (
          <div className="text-sm text-blue-600">
            Filters: {appliedFilters.basic.join(', ')}
          </div>
        )}
        {stickers.length > 0 && (
          <div className="text-sm text-green-600">
            Stickers: {stickers.length}
          </div>
        )}
        {selectedFrame && (
          <div className="text-sm text-purple-600">
            Frame: {selectedFrame.name}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button 
          label="Download" 
          onClick={onDownload}
        />
        <Button 
          label="Share on Facebook" 
          onClick={() => onShare('facebook')}
        />
        <Button 
          label="Share on Twitter" 
          onClick={() => onShare('twitter')}
        />
        <Button 
          label="Share on WhatsApp" 
          onClick={() => onShare('whatsapp')}
        />
      </div>

      {/* Hidden Canvas for Processing */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />

      {/* Keyboard Shortcuts Help */}
      {selectedSticker && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-xs text-blue-800">
            <div className="font-medium mb-1">Keyboard Shortcuts:</div>
            <div>• Arrow keys: Move sticker</div>
            <div>• Delete/Backspace: Remove sticker</div>
            <div>• Click: Select sticker</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoCanvas;
