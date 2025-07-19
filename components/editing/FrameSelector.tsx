import React, { useState, useCallback } from 'react';
import { Frame } from '../../types/photo';
import Button from '../ui/Button';

interface FrameSelectorProps {
  selectedFrameId?: string;
  onFrameSelect: (frame: Frame | null) => void;
  onFrameRemove: () => void;
}

// Sample frame data - in a real app, these would be loaded from a server
const SAMPLE_FRAMES: Frame[] = [
  {
    id: 'classic-1',
    name: 'Classic White',
    src: '/frames/classic-white.png',
    preview: '/frames/classic-white-preview.png',
    category: 'classic'
  },
  {
    id: 'classic-2',
    name: 'Classic Black',
    src: '/frames/classic-black.png',
    preview: '/frames/classic-black-preview.png',
    category: 'classic'
  },
  {
    id: 'modern-1',
    name: 'Modern Minimal',
    src: '/frames/modern-minimal.png',
    preview: '/frames/modern-minimal-preview.png',
    category: 'modern'
  },
  {
    id: 'modern-2',
    name: 'Modern Gradient',
    src: '/frames/modern-gradient.png',
    preview: '/frames/modern-gradient-preview.png',
    category: 'modern'
  },
  {
    id: 'fun-1',
    name: 'Party Border',
    src: '/frames/party-border.png',
    preview: '/frames/party-border-preview.png',
    category: 'fun'
  },
  {
    id: 'fun-2',
    name: 'Balloon Frame',
    src: '/frames/balloon-frame.png',
    preview: '/frames/balloon-frame-preview.png',
    category: 'fun'
  },
  {
    id: 'elegant-1',
    name: 'Elegant Gold',
    src: '/frames/elegant-gold.png',
    preview: '/frames/elegant-gold-preview.png',
    category: 'elegant'
  },
  {
    id: 'elegant-2',
    name: 'Elegant Silver',
    src: '/frames/elegant-silver.png',
    preview: '/frames/elegant-silver-preview.png',
    category: 'elegant'
  },
];

const FrameSelector: React.FC<FrameSelectorProps> = ({
  selectedFrameId,
  onFrameSelect,
  onFrameRemove,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredFrame, setHoveredFrame] = useState<string | null>(null);

  // Filter frames by category
  const filteredFrames = SAMPLE_FRAMES.filter(frame => 
    selectedCategory === 'all' || frame.category === selectedCategory
  );

  // Get unique categories
  const categories = ['all', ...new Set(SAMPLE_FRAMES.map(f => f.category))];

  // Handle frame selection
  const handleFrameSelect = useCallback((frame: Frame) => {
    if (selectedFrameId === frame.id) {
      onFrameRemove();
    } else {
      onFrameSelect(frame);
    }
  }, [selectedFrameId, onFrameSelect, onFrameRemove]);

  // Handle frame removal
  const handleFrameRemove = useCallback(() => {
    onFrameRemove();
  }, [onFrameRemove]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Photo Frames</h3>
        {selectedFrameId && (
          <Button 
            label="Remove Frame" 
            onClick={handleFrameRemove}
          />
        )}
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

      {/* Frame Grid */}
      <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {filteredFrames.map((frame) => (
          <div
            key={frame.id}
            className={`relative border-2 rounded-lg cursor-pointer transition-all ${
              selectedFrameId === frame.id
                ? 'border-blue-500 bg-blue-50'
                : hoveredFrame === frame.id
                ? 'border-blue-300 bg-blue-25'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleFrameSelect(frame)}
            onMouseEnter={() => setHoveredFrame(frame.id)}
            onMouseLeave={() => setHoveredFrame(null)}
          >
            {/* Frame Preview */}
            <div className="aspect-square bg-gray-100 rounded flex items-center justify-center relative overflow-hidden">
              {/* Placeholder for frame preview */}
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white rounded-lg shadow-sm mx-auto mb-2"></div>
                  <div className="text-xs text-gray-600 font-medium">{frame.name}</div>
                </div>
              </div>
              
              {/* Selected indicator */}
              {selectedFrameId === frame.id && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>

            {/* Frame Info */}
            <div className="p-2">
              <div className="text-sm font-medium text-gray-800 truncate">
                {frame.name}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {frame.category}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Frames Message */}
      {filteredFrames.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-lg mb-2">No frames available</div>
          <div className="text-sm">Try selecting a different category</div>
        </div>
      )}

      {/* Selected Frame Info */}
      {selectedFrameId && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-800">
                Selected Frame
              </div>
              <div className="text-xs text-blue-600">
                {SAMPLE_FRAMES.find(f => f.id === selectedFrameId)?.name}
              </div>
            </div>
            <button
              onClick={handleFrameRemove}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Frame Tips */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-600">
          <div className="font-medium mb-1">💡 Frame Tips:</div>
          <ul className="space-y-1">
            <li>• Frames add a classic photo booth feel</li>
            <li>• Choose frames that match your style</li>
            <li>• You can remove frames anytime</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FrameSelector;
