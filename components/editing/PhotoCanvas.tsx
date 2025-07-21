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
  photo: Photo | Photo[];
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
  const previewRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImageSrc, setProcessedImageSrc] = useState<string>('');
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Convert photo to array for consistent handling
  const photos = Array.isArray(photo) ? photo : [photo];
  const primaryPhoto = photos[0];

  // Function to get dynamic rotation for grid layout
  const getGridRotation = (index: number) => {
    const rotations = [-3, 2, -1, 4];
    return rotations[index] || 0;
  };

  // Function to get offset positioning for grid layout
  const getGridOffset = (index: number) => {
    const offsets = [
      { x: -2, y: -1 },
      { x: 1, y: -2 },
      { x: -1, y: 1 },
      { x: 2, y: 0 }
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

  /**
   * Downloads the current photo strip as an image.
   *
   * This function draws the photo strip (with the selected layout, aspect ratio, and stickers)
   * onto a hidden canvas, preserving the original aspect ratio of each photo. It then
   * triggers a download of the resulting image as a PNG file. The function handles
   * different layouts (vertical, horizontal, grid) and ensures the preview matches the
   * downloaded image as closely as possible.
   */
  const handleDownload = useCallback(async () => {
    if (!previewRef.current) return;
    
    setIsProcessing(true);
    
    try {
      // Use html2canvas library (you'll need to install it)
      // For now, we'll use a different approach with canvas
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const photoCount = selectedLayout?.photoCount || 3;
      const layout = selectedLayout?.layout || 'vertical';
      
      // Set canvas dimensions based on layout to match preview exactly
      let canvasWidth, canvasHeight;
      
      if (photoCount === 1) {
        canvasWidth = 200;
        canvasHeight = 100;
      } else if (layout === 'horizontal') {
        canvasWidth = 420;
        canvasHeight = 200;
      } else if (layout === 'grid') {
        canvasWidth = 320;
        canvasHeight = 320;
      } else { // vertical - square crop, bigger images, 30px spacing
        const boxWidth = 420; // width of each 16:9 image
        const boxHeight = Math.round(boxWidth * 9 / 16); // 236px for 16:9
        const spacing = 25;
        const topMargin = 40;
        const bottomMargin = 160; // extra space for footer
        canvasWidth = 480;
        canvasHeight = topMargin + (boxHeight * photoCount) + (spacing * (photoCount - 1)) + 250; // 80px bottom margin for extra padding
      }
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Create background
      if (layout === 'grid') {
        ctx.fillStyle = '#f8f9fa';
      } else if (layout === 'horizontal') {
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#f8f9fa');
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = '#ffffff';
      }
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Draw border
      ctx.strokeStyle = layout === 'grid' ? '#e9ecef' : '#ffffff';
      ctx.lineWidth = layout === 'grid' ? 1 : layout === 'horizontal' ? 3 : 2;
      ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

      // Load and draw photos
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      };

      for (let i = 0; i < photoCount; i++) {
        const photoSrc = photos[i]?.originalSrc || photos[0]?.originalSrc || primaryPhoto?.originalSrc;
        if (!photoSrc) continue;

        try {
          const img = await loadImage(photoSrc);
          
          let x, y, width, height;
          
          if (layout === 'vertical') {
            const boxWidth = 420; // width of each 3:2 image
            const boxHeight = Math.round(boxWidth * 2 / 3); // 280px for 3:2
            const spacing = 30;
            const topMargin = 40;
            const x = (canvasWidth - boxWidth) / 2;
            const y = topMargin + i * (boxHeight + spacing);

            // Crop to 3:2
            const targetAspect = 3 / 2;
            const imgAspect = img.width / img.height;
            let sx, sy, sWidth, sHeight;
            if (imgAspect > targetAspect) {
              // Image is wider than 3:2, crop sides
              sHeight = img.height;
              sWidth = img.height * targetAspect;
              sx = (img.width - sWidth) / 2;
              sy = 0;
            } else {
              // Image is taller than 3:2, crop top/bottom
              sWidth = img.width;
              sHeight = img.width / targetAspect;
              sx = 0;
              sy = (img.height - sHeight) / 2;
            }

            // Fill background with white
            ctx.fillStyle = '#fff';
            ctx.fillRect(x, y, boxWidth, boxHeight);

            // Draw the cropped 3:2 image centered in the box
            ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, boxWidth, boxHeight);
          } else if (layout === 'grid') {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const x = 16 + col * 160;
            const y = 16 + row * 160;
            const width = 128;
            const height = 128;
            ctx.fillStyle = '#fff';
            ctx.fillRect(x, y, width, height);
            ctx.drawImage(img, x, y, width, height);
          } else if (layout === 'horizontal') {
            const photoWidth = (canvasWidth - 16) / photoCount;
            const x = 8 + (i * photoWidth);
            const y = 8;
            const width = photoWidth - 4;
            const height = canvasHeight - 40;
            ctx.fillStyle = '#fff';
            ctx.fillRect(x, y, width, height);
            ctx.drawImage(img, x, y, width, height);
          } else if (photoCount === 1) {
            // Single photo: portrait style
            const x = 12;
            const y = 12;
            const width = canvasWidth - 24;
            const height = 400;
            ctx.fillStyle = '#fff';
            ctx.fillRect(x, y, width, height);
            ctx.drawImage(img, x, y, width, height);
          }

          // Draw photo
          const boxWidth = 400;
          const boxHeight = 300;
          const imgAspect = img.width / img.height;
          const boxAspect = boxWidth / boxHeight;

          let drawWidth, drawHeight, offsetX, offsetY;

          if (imgAspect > boxAspect) {
            // Image is wider than the box: fit width, letterbox top/bottom
            drawWidth = boxWidth;
            drawHeight = boxWidth / imgAspect;
            offsetX = x;
            offsetY = y + (boxHeight - drawHeight) / 2;
          } else {
            // Image is taller than the box: fit height, pillarbox left/right
            drawHeight = boxHeight;
            drawWidth = boxHeight * imgAspect;
            offsetX = x + (boxWidth - drawWidth) / 2;
            offsetY = y;
          }

          // Optional: fill background with white
          ctx.fillStyle = '#fff';
          ctx.fillRect(x, y, boxWidth, boxHeight);

          // Draw the image centered in the box
          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          
          if (layout === 'grid') {
            ctx.restore();
          }
          
        } catch (error) {
          console.error('Error loading image:', error);
        }
      }

      // Draw stickers
      for (const sticker of stickers) {
        try {
          const stickerImg = await loadImage(sticker.src);
          ctx.save();
          ctx.translate(sticker.x + sticker.width/2, sticker.y + sticker.height/2);
          ctx.rotate((sticker.rotation * Math.PI) / 180);
          ctx.drawImage(stickerImg, -sticker.width/2, -sticker.height/2, sticker.width, sticker.height);
          ctx.restore();
        } catch (error) {
          console.error('Error loading sticker:', error);
        }
      }

      // Draw footer text with proper positioning
      ctx.fillStyle = '#6b7280';
      ctx.font = '17px Arial';  // Larger font for footer
      ctx.textAlign = 'center';
      const footerText = `Adelaide - ${new Date().toLocaleDateString()}, ${new Date().toLocaleTimeString()}`;
      ctx.fillText(footerText, canvasWidth / 2, canvasHeight - 13);  // Adjust position

      // Download the canvas as image
      const link = document.createElement('a');
      link.download = `photobooth-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error downloading image:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [photos, primaryPhoto, selectedLayout, stickers, appliedFilters]);
      

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
          <div className="relative">
            <div className="bg-black rounded-none h-48">
              <img
                src={primaryPhoto.originalSrc}
                alt="Portrait"
                className="w-full h-full object-cover"
                style={getImageStyle()}
              />
              
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
        {layout === 'horizontal' && (
          <>
            <div 
              className="absolute -right-1 top-0 bottom-0 w-3 bg-white"
              style={{
                clipPath: 'polygon(0 0, 100% 0, 85% 15%, 100% 30%, 85% 45%, 100% 60%, 85% 75%, 100% 90%, 85% 100%, 0 100%)',
                boxShadow: '2px 0 4px rgba(0,0,0,0.1)'
              }}
            />
            <div 
              className="absolute -right-2 top-2 bottom-2 w-1 bg-white opacity-60"
              style={{
                clipPath: 'polygon(0 0, 100% 0, 70% 25%, 100% 50%, 70% 75%, 100% 100%, 0 100%)'
              }}
            />
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
          {Array.from({ length: photoCount }).map((_, index) => {
            // Calculate aspect ratio for each photo
            const meta = photos[index]?.metadata || primaryPhoto?.metadata;
            const aspectRatio = meta ? `${meta.width} / ${meta.height}` : '4 / 3';
            return (
              <div key={index} className="relative">
                <div 
                  className={`bg-black rounded-none ${
                    layout === 'grid' ? 'h-32' :
                    layout === 'horizontal' ? 'h-36' : ''
                  }`}
                  style={{
                    height: layout === 'vertical' ? undefined : undefined,
                    aspectRatio: layout === 'vertical' ? aspectRatio : undefined,
                    border: layout === 'grid' ? '3px solid white' : layout === 'horizontal' ? '2px solid white' : '1px solid #e5e7eb',
                    marginBottom: layout === 'vertical' && index < photoCount - 1 ? '10px' : '0',
                    transform: layout === 'grid' ? `rotate(${getGridRotation(index)}deg) translate(${getGridOffset(index).x}px, ${getGridOffset(index).y}px)` : 'none',
                    boxShadow: layout === 'grid' ? '0 6px 20px rgba(0,0,0,0.2)' : layout === 'horizontal' ? '0 2px 4px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.1)' : 'none',
                    transition: layout === 'grid' ? 'transform 0.3s ease' : layout === 'horizontal' ? 'all 0.3s ease' : 'none',
                    backgroundColor: layout === 'grid' ? 'white' : 'black',
                    padding: layout === 'grid' ? '8px' : '0',
                    borderRight: layout === 'horizontal' && index < photoCount - 1 ? '2px solid white' : 'none',
                    position: layout === 'horizontal' ? 'relative' : 'static'
                  }}
                >
                  <img
                    src={photos[index]?.originalSrc || photos[0]?.originalSrc || primaryPhoto?.originalSrc}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                    style={getImageStyle()}
                  />
                  
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
            );
          })}
        </div>

        <div className="text-center mt-3 text-gray-600 text-xs">
          PhotoBooth - {new Date().toLocaleDateString()}, {new Date().toLocaleTimeString()}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Photo Strip Display */}
      <div className="relative" ref={previewRef}>
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
          onClick={handleDownload}
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