import React, { useState, useCallback } from 'react';
import { BASIC_FILTERS, ADVANCED_FILTERS, AppliedFilters } from '../../types/filters';
import Button from '../ui/Button';

interface FilterPanelProps {
  appliedFilters: AppliedFilters;
  onFiltersChange: (filters: AppliedFilters) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  appliedFilters,
  onFiltersChange,
  onApplyFilters,
  onResetFilters,
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

  // Handle basic filter toggle
  const handleBasicFilterToggle = useCallback((filterName: string) => {
    const newBasicFilters = appliedFilters.basic.includes(filterName)
      ? appliedFilters.basic.filter(f => f !== filterName)
      : [...appliedFilters.basic, filterName];

    onFiltersChange({
      ...appliedFilters,
      basic: newBasicFilters,
    });
  }, [appliedFilters, onFiltersChange]);

  // Handle advanced filter change
  const handleAdvancedFilterChange = useCallback((filterName: string, value: number) => {
    const newAdvancedFilters = {
      ...appliedFilters.advanced,
      [filterName]: value,
    };

    onFiltersChange({
      ...appliedFilters,
      advanced: newAdvancedFilters,
    });
  }, [appliedFilters, onFiltersChange]);

  // Reset all filters
  const handleReset = useCallback(() => {
    onFiltersChange({
      basic: [],
      advanced: {},
    });
    onResetFilters();
  }, [onFiltersChange, onResetFilters]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Photo Filters</h3>
        <Button 
          label="Reset" 
          onClick={handleReset}
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'basic'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('basic')}
        >
          Basic Filters
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'advanced'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('advanced')}
        >
          Advanced
        </button>
      </div>

      {/* Basic Filters */}
      {activeTab === 'basic' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {BASIC_FILTERS.map((filter) => (
              <button
                key={filter.name}
                onClick={() => handleBasicFilterToggle(filter.name)}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  appliedFilters.basic.includes(filter.name)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-sm font-medium">{filter.label}</div>
                {filter.preview && (
                  <div 
                    className="w-full h-8 mt-2 rounded"
                    style={{ filter: filter.value }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      {activeTab === 'advanced' && (
        <div className="space-y-4">
          {ADVANCED_FILTERS.map((filter) => (
            <div key={filter.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">
                  {filter.label}
                </label>
                <span className="text-xs text-gray-500">
                  {appliedFilters.advanced[filter.name] || filter.defaultValue}{filter.unit}
                </span>
              </div>
              <input
                type="range"
                min={filter.min}
                max={filter.max}
                step={filter.step}
                value={appliedFilters.advanced[filter.name] || filter.defaultValue}
                onChange={(e) => handleAdvancedFilterChange(filter.name, parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{filter.min}{filter.unit}</span>
                <span>{filter.max}{filter.unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Apply Button */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <Button 
          label="Apply Filters" 
          onClick={onApplyFilters}
        />
      </div>

      {/* Active Filters Summary */}
      {(appliedFilters.basic.length > 0 || Object.keys(appliedFilters.advanced).length > 0) && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-2">Active Filters:</div>
          <div className="space-y-1">
            {appliedFilters.basic.map(filterName => {
              const filter = BASIC_FILTERS.find(f => f.name === filterName);
              return (
                <div key={filterName} className="text-xs text-gray-600">
                  • {filter?.label || filterName}
                </div>
              );
            })}
            {Object.entries(appliedFilters.advanced).map(([name, value]) => {
              const filter = ADVANCED_FILTERS.find(f => f.name === name);
              return (
                <div key={name} className="text-xs text-gray-600">
                  • {filter?.label || name}: {value}{filter?.unit}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
