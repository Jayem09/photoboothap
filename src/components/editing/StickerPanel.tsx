import React, { useState, useCallback } from 'react';
import { Sticker } from '../../types/photo';
import Button from '../ui/Button';

interface StickerPanelProps {
  stickers: Sticker[];
  onStickersChange: (stickers: Sticker[]) => void;
  onAddSticker: (sticker: Sticker) => void;
  onRemoveSticker: (stickerId: string) => void;
  onUpdateSticker: (stickerId: string, updates: Partial<Sticker>) => void;
}

// Sample sticker data - in a real app, these would be loaded from a server
const SAMPLE_STICKERS = [
  { id: 'emoji-1', src: '/stickers/emoji-1.png', name: 'Smile', category: 'emoji' },
  { id: 'emoji-2', src: '/stickers/emoji-2.png', name: 'Heart', category: 'emoji' },
  { id: 'emoji-3', src: '/stickers/emoji-3.png', name: 'Star', category: 'emoji' },
  { id: 'text-1', src: '/stickers/text-1.png', name: 'Love', category: 'text' },
  { id: 'text-2', src: '/stickers/text-2.png', name: 'Fun', category: 'text' },
  { id: 'decoration-1', src: '/stickers/decoration-1.png', name: 'Flower', category: 'decoration' },
  { id: 'decoration-2', src: '/stickers/decoration-2.png', name: 'Crown', category: 'decoration' },
];

const StickerPanel: React.FC<StickerPanelProps> = ({
  stickers,
  onStickersChange,
  onAddSticker,
  onRemoveSticker,
  onUpdateSticker,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null);

  // Filter stickers by category
  const filteredStickers = SAMPLE_STICKERS.filter(sticker => 
    selectedCategory === 'all' || sticker.category === selectedCategory
  );

  // Get unique categories
  const categories = ['all', ...new Set(SAMPLE_STICKERS.map(s => s.category))];

  // Handle adding a sticker
  const handleAddSticker = useCallback((stickerData: typeof SAMPLE_STICKERS[0]) => {
    const newSticker: Sticker = {
      id: `${stickerData.id}-${Date.now()}`,
      src: stickerData.src,
      name: stickerData.name,
      x: 100,
      y: 100,
      width: 60,
      height: 60,
      rotation: 0,
      zIndex: stickers.length + 1,
    };

    onAddSticker(newSticker);
  }, [stickers.length, onAddSticker]);

  // Handle sticker selection
  const handleStickerSelect = useCallback((sticker: Sticker) => {
    setSelectedSticker(sticker);
  }, []);

  // Handle sticker removal
  const handleRemoveSticker = useCallback((stickerId: string) => {
    onRemoveSticker(stickerId);
    if (selectedSticker?.id === stickerId) {
      setSelectedSticker(null);
    }
  }, [selectedSticker, onRemoveSticker]);

  // Handle sticker property updates
  const handleStickerUpdate = useCallback((stickerId: string, property: keyof Sticker, value: unknown) => {
    onUpdateSticker(stickerId, { [property]: value });
    
    // Update selected sticker if it's the one being edited
    if (selectedSticker?.id === stickerId) {
      setSelectedSticker(prev => prev ? { ...prev, [property]: value } : null);
    }
  }, [selectedSticker, onUpdateSticker]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Stickers</h3>
        <Button 
          label="Clear All" 
          onClick={() => onStickersChange([])}
        />
      </div>

      {/* Category Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Sticker Library */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Available Stickers</h4>
        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
          {filteredStickers.map((sticker) => (
            <button
              key={sticker.id}
              onClick={() => handleAddSticker(sticker)}
              className="p-2 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              title={sticker.name}
            >
              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-xs">
                {sticker.name.charAt(0)}
              </div>
              <div className="text-xs text-gray-600 mt-1 truncate">
                {sticker.name}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Applied Stickers */}
      {stickers.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Applied Stickers ({stickers.length})
          </h4>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {stickers.map((sticker) => (
              <div
                key={sticker.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedSticker?.id === sticker.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleStickerSelect(sticker)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{sticker.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveSticker(sticker.id);
                    }}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    ×
                  </button>
                </div>
                
                {/* Sticker Preview */}
                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-xs mb-2">
                  {sticker.name.charAt(0)}
                </div>

                {/* Sticker Properties */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Position:</span>
                    <span>{sticker.x}, {sticker.y}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span>{sticker.width}×{sticker.height}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rotation:</span>
                    <span>{sticker.rotation}°</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sticker Properties Editor */}
      {selectedSticker && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Edit: {selectedSticker.name}
          </h4>
          
          <div className="space-y-3">
            {/* Position */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">X Position</label>
              <input
                type="range"
                min="0"
                max="500"
                value={selectedSticker.x}
                onChange={(e) => handleStickerUpdate(selectedSticker.id, 'x', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500">{selectedSticker.x}</div>
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 mb-1">Y Position</label>
              <input
                type="range"
                min="0"
                max="500"
                value={selectedSticker.y}
                onChange={(e) => handleStickerUpdate(selectedSticker.id, 'y', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500">{selectedSticker.y}</div>
            </div>

            {/* Size */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Width</label>
              <input
                type="range"
                min="20"
                max="200"
                value={selectedSticker.width}
                onChange={(e) => handleStickerUpdate(selectedSticker.id, 'width', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500">{selectedSticker.width}px</div>
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 mb-1">Height</label>
              <input
                type="range"
                min="20"
                max="200"
                value={selectedSticker.height}
                onChange={(e) => handleStickerUpdate(selectedSticker.id, 'height', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500">{selectedSticker.height}px</div>
            </div>

            {/* Rotation */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Rotation</label>
              <input
                type="range"
                min="0"
                max="360"
                value={selectedSticker.rotation}
                onChange={(e) => handleStickerUpdate(selectedSticker.id, 'rotation', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500">{selectedSticker.rotation}°</div>
            </div>

            {/* Z-Index */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Layer</label>
              <input
                type="range"
                min="1"
                max={stickers.length}
                value={selectedSticker.zIndex}
                onChange={(e) => handleStickerUpdate(selectedSticker.id, 'zIndex', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500">Layer {selectedSticker.zIndex}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StickerPanel;