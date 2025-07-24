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
  onRetake?: () => void;
  onBack?: () => void;
  addPhoto?: (photo: Photo) => void;
  sessionId?: string;
  userId?: string;
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
  onRetake,
  onBack,
  addPhoto,
  sessionId,
  userId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null); // for preview only
  const exportCanvasRef = useRef<HTMLCanvasElement>(null); // for saving/exporting only
  const previewRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImageSrc, setProcessedImageSrc] = useState<string>('');
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [stripColor, setStripColor] = useState<string>('#ffffff'); // default to white
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [saveDisabled, setSaveDisabled] = useState(false);

  // Convert photo to array for consistent handling
  const photos = Array.isArray(photo) ? photo : [photo];
  const primaryPhoto = photos[0];

  // Use the correct variable for your photo URL/data
  const photoUrl = processedImageSrc || (Array.isArray(photo) ? photo[0]?.originalSrc : (photo as Photo)?.originalSrc);

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

  // Draw the photo strip to the hidden export canvas (for download/save)
  const drawStripToCanvas = useCallback(async () => {
    const canvas = exportCanvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const photoCount = selectedLayout?.photoCount || 3;
    const layout = selectedLayout?.layout || 'vertical';
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
    } else {
      const boxWidth = 420;
      const boxHeight = Math.round(boxWidth * 9 / 13);
      const topMargin = 40;
      canvasWidth = 480;
      canvasHeight = topMargin + (boxHeight * photoCount) + ((photoCount - 1)) + 350;
    }
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    if (layout === 'grid') {
      ctx.fillStyle = '#f8f9fa';
    } else if (layout === 'horizontal') {
      const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(1, '#f8f9fa');
      ctx.fillStyle = gradient;
    } else if (layout === 'vertical') {
      ctx.fillStyle = stripColor;
    } else {
      ctx.fillStyle = '#ffffff';
    }
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
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
      // Always use the original, full-res image as the source
      const photoSrc = Array.isArray(photo)
        ? (photo[i]?.originalSrc || photo[0]?.originalSrc || primaryPhoto?.originalSrc)
        : primaryPhoto?.originalSrc;
      if (!photoSrc) continue;
      try {
        const img = await loadImage(photoSrc);
        let x, y, width, height;
        if (layout === 'vertical') {
          const boxWidth = 420;
          const boxHeight = Math.round(boxWidth * 2 / 3);
          const spacing = 17;
          const topMargin = 40;
          x = (canvasWidth - boxWidth) / 2;
          y = topMargin + i * (boxHeight + spacing);
          const targetAspect = 3 / 2;
          const imgAspect = img.width / img.height;
          let sx, sy, sWidth, sHeight;
          if (imgAspect > targetAspect) {
            sHeight = img.height;
            sWidth = img.height * targetAspect;
            sx = (img.width - sWidth) / 2;
            sy = 0;
          } else {
            sWidth = img.width;
            sHeight = img.width / targetAspect;
            sx = 0;
            sy = (img.height - sHeight) / 2;
          }
          ctx.fillStyle = '#fff';
          ctx.fillRect(x, y, boxWidth, boxHeight);
          ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, boxWidth, boxHeight);
        } else if (layout === 'grid') {
          const col = i % 2;
          const row = Math.floor(i / 2);
          x = 16 + col * 160;
          y = 16 + row * 160;
          width = 128;
          height = 128;
          ctx.fillStyle = '#fff';
          ctx.fillRect(x, y, width, height);
          ctx.drawImage(img, x, y, width, height);
        } else if (layout === 'horizontal') {
          const photoWidth = (canvasWidth - 16) / photoCount;
          x = 8 + (i * photoWidth);
          y = 8;
          width = photoWidth - 4;
          height = canvasHeight - 40;
          ctx.fillStyle = '#fff';
          ctx.fillRect(x, y, width, height);
          ctx.drawImage(img, x, y, width, height);
        } else if (photoCount === 1) {
          x = 12;
          y = 12;
          width = canvasWidth - 24;
          height = 400;
          ctx.fillStyle = '#fff';
          ctx.fillRect(x, y, width, height);
          ctx.drawImage(img, x, y, width, height);
        }
      } catch (error) {
        console.error('Error loading image:', error);
      }
    }
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
    ctx.fillStyle = '#6b7280';
    ctx.font = '17px Arial';
    ctx.textAlign = 'center';
    const footerText = `Adelaide - ${new Date().toLocaleDateString()}, ${new Date().toLocaleTimeString()}`;
    ctx.fillText(footerText, canvasWidth / 2, canvasHeight - 73);
    return canvas;
  }, [photo, primaryPhoto, selectedLayout, stickers, appliedFilters, stripColor]);

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

      const updatedSticker = { ...sticker };

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

  // Use drawStripToCanvas before download
  const handleDownload = useCallback(async () => {
    setIsProcessing(true);
    try {
      const canvas = await drawStripToCanvas();
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = `Adelaide-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error downloading image:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [drawStripToCanvas]);

  // Re-enable save when retake or edit
  useEffect(() => {
    setSaveDisabled(false);
  }, [primaryPhoto, appliedFilters, stickers, selectedFrame, selectedLayout]);

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

          <div className="text-center mt-3 text-gray-600 text-xs" style={{ marginBottom: '40px' }}>
            Adelaide - {new Date().toLocaleDateString()}, {new Date().toLocaleTimeString()}
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
      <div className="max-w-5xl mx-auto">
        {onBack && (
          <button className="mb-9 bg-white/80 rounded-full px-4 py-2 shadow hover:bg-pink-100 transition" onClick={onBack}>
            ← Back
          </button>
        )}
        <div className="flex flex-row items-start gap-8">
          {/* Photo strip card */}
          <div className="rounded-lg shadow-3xl max-w-xl w-full p-6 pb-16 flex-1" style={{ background: stripColor, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}>
            {/* Photo strip rendering starts here */}
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
              'space-y-2' // <-- increase this value for more spacing
            }>
              {Array.from({ length: photoCount }).map((_, index) => {
                // Calculate aspect ratio for each photo
                const meta = photos[index]?.metadata || primaryPhoto?.metadata;
                const aspectRatio = meta ? `${meta.width} / ${meta.height}` : '4 / 3';
                return (
                  <div key={index} className="relative">
                    <div 
                      className="rounded-none"
                      style={{
                        border: 'none',
                        marginBottom: 0,
                        backgroundColor: 'transparent',
                        aspectRatio: layout === 'vertical' ? aspectRatio : undefined,
                        boxShadow: layout === 'grid' ? '0 6px 20px rgba(0,0,0,0.2)' : layout === 'horizontal' ? '0 2px 4px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.1)' : 'none',
                        transition: layout === 'grid' ? 'transform 0.3s ease' : layout === 'horizontal' ? 'all 0.3s ease' : 'none',
                        // backgroundColor: layout === 'grid' ? 'white' : 'black',
                        padding: layout === 'grid' ? '8px' : '0',
                        borderRight: layout === 'horizontal' && index < photoCount - 1 ? '2px solid white' : 'none',
                        position: layout === 'horizontal' ? 'relative' : 'static'
                      }}
                    >
                      <img
                        src={photos[index]?.originalSrc || photos[0]?.originalSrc || primaryPhoto?.originalSrc}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-56 object-cover"
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

            <div style={{ height: '64px' }} /> {/* 64px of space */}
            <div className="text-center text-gray-600 text-xs" style={{ marginTop: '100px' }}>
              Adelaide - {new Date().toLocaleDateString()}, {new Date().toLocaleTimeString()}
            </div>
          </div>
          {/* Action buttons and color selector in a column */}
          <div className="flex flex-col gap-4 items-start ml-10 min-w-[220px]">
            {/* Action buttons in a vertical stack */}
            <div className="flex flex-col gap-3 w-full bg-white/80 rounded-xl shadow-md px-6 py-6 mb-4">
              <Button label="Download" onClick={handleDownload} className="w-full transition-all hover:bg-blue-600 hover:text-white" />
              {onRetake && (
                <Button label="Retake" onClick={onRetake} variant="secondary" className="w-full transition-all hover:bg-pink-600 hover:text-white" />
              )}
              <button
                className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold transition-all"
                onClick={async () => {
                  setSaveStatus("Saving...");
                  setSaveDisabled(true);
                  const canvas = await drawStripToCanvas();
                  let finalImageUrl = photoUrl;
                  if (canvas) {
                    finalImageUrl = canvas.toDataURL('image/png');
                  }
                  // Create a single photo object for the composited strip
                  const stripPhoto = {
                    id: crypto.randomUUID(),
                    sessionId: sessionId || '',
                    userId: userId || '',
                    filename: `strip-${Date.now()}.png`,
                    originalSrc: finalImageUrl,
                    processedSrc: finalImageUrl,
                    imageUrl: finalImageUrl,
                    filtersApplied: { basic: [], advanced: {} },
                    stickers: [],
                    size: 'large' as const,
                    createdAt: new Date(),
                    isDownloaded: false,
                    isShared: false,
                    metadata: {
                      width: canvas ? canvas.width : 0,
                      height: canvas ? canvas.height : 0,
                      fileSize: finalImageUrl.length * 0.75,
                      format: 'png' as const,
                    },
                  };
                  const res = await fetch("/api/photos", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(stripPhoto),
                    credentials: 'include',
                  });
                  if (res.ok) {
                    setSaveStatus("Saved to gallery!");
                    if (addPhoto) {
                      addPhoto(stripPhoto);
                    }
                  } else {
                    const data = await res.json().catch(() => ({}));
                    setSaveStatus("Failed to save: " + (data.error || res.statusText));
                    setSaveDisabled(false);
                    console.error("Save error:", data);
                  }
                }}
                disabled={saveDisabled}
              >
                Save to Gallery
              </button>
              {saveStatus && <div className="text-sm mt-2 w-full text-center">{saveStatus}</div>}
              <Button label="Share on Twitter" onClick={() => onShare('twitter')} className="w-full transition-all hover:bg-blue-600 hover:text-white" />
              <Button label="Share on WhatsApp" onClick={() => onShare('whatsapp')} className="w-full transition-all hover:bg-blue-600 hover:text-white" />
            </div>
            {/* Frame/strip color selector */}
            <div className="mt-6 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">Frame/Strip Color</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {['#ffffff', '#000000', '#ff69b4', '#4ade80', '#3b82f6', '#fde047', '#a78bfa', '#be123c'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setStripColor(color)}
                    className="w-8 h-8 rounded-full border-2 border-gray-300"
                    style={{
                      backgroundColor: color,
                      borderColor: stripColor === color ? '#f472b6' : '#d1d5db',
                      boxShadow: stripColor === color ? '0 0 0 2px #f472b6' : undefined,
                    }}
                    aria-label={`Select frame color ${color}`}
                  />
                ))}
                <input
                  type="color"
                  value={stripColor}
                  onChange={e => setStripColor(e.target.value)}
                  className="w-8 h-8 rounded-full border-2 border-gray-300 ml-2"
                  aria-label="Custom frame color"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Photo Strip Display */}
      <div
        className="relative flex items-center justify-center"
        ref={previewRef}
        style={{
          maxWidth: 'auto',
          background: '#fff',
          borderRadius: '18px',
          boxShadow: '0 8px 32px 0 rgba(31,38,135,0.12)',
          border: '2px solid #f3f4f6',
          overflow: 'hidden',
          padding: '16px 0',
        }}
      >
        {createPhotoStrip()}
        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
            <div className="text-white text-lg">Processing...</div>
          </div>
        )}
      </div>

      {/* Preview Canvas (if you use it for display, keep as is) */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
      {/* Export/Save Canvas (never shown) */}
      <canvas
        ref={exportCanvasRef}
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