export interface BasicFilter {
  name: string;
  value: string;
  label: string;
  preview?: string;
}

export interface AdvancedFilter {
  name: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit: string;
  label: string;
}

export interface FilterConfig {
  basicFilters: BasicFilter[];
  advancedFilters: AdvancedFilter[];
}

export interface AppliedFilters {
  basic: string[];
  advanced: Record<string, number>;
}

export const BASIC_FILTERS: BasicFilter[] = [
  { name: 'none', value: 'none', label: 'Original' },
  { name: 'grayscale', value: 'grayscale(100%)', label: 'Grayscale' },
  { name: 'sepia', value: 'sepia(100%)', label: 'Sepia' },
  { name: 'invert', value: 'invert(100%)', label: 'Invert' },
  { name: 'blur', value: 'blur(2px)', label: 'Blur' },
  { name: 'brightness', value: 'brightness(150%)', label: 'Bright' },
  { name: 'contrast', value: 'contrast(150%)', label: 'High Contrast' },
  { name: 'saturate', value: 'saturate(200%)', label: 'Vibrant' },
  { name: 'hue-rotate', value: 'hue-rotate(90deg)', label: 'Color Shift' },
];

export const ADVANCED_FILTERS: AdvancedFilter[] = [
  { name: 'brightness', min: 0, max: 300, step: 1, defaultValue: 100, unit: '%', label: 'Brightness' },
  { name: 'contrast', min: 0, max: 300, step: 1, defaultValue: 100, unit: '%', label: 'Contrast' },
  { name: 'saturate', min: 0, max: 300, step: 1, defaultValue: 100, unit: '%', label: 'Saturation' },
  { name: 'blur', min: 0, max: 10, step: 0.1, defaultValue: 0, unit: 'px', label: 'Blur' },
  { name: 'hue-rotate', min: 0, max: 360, step: 1, defaultValue: 0, unit: 'deg', label: 'Hue' },
  { name: 'opacity', min: 0, max: 100, step: 1, defaultValue: 100, unit: '%', label: 'Opacity' },
];
