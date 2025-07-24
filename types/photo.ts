import { AppliedFilters } from './filters';

export interface Sticker {
  id: string;
  src: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
}

export interface Frame {
  id: string;
  name: string;
  src: string;
  preview: string;
  category: 'classic' | 'modern' | 'fun' | 'elegant';
}

export interface Photo {
  id: string;
  sessionId: string;
  filename: string;
  originalSrc: string;
  processedSrc?: string;
  imageUrl: string;
  filtersApplied: AppliedFilters;
  stickers: Sticker[];
  frameId?: string;
  size: 'small' | 'medium' | 'large';
  createdAt: Date;
  isDownloaded: boolean;
  isShared: boolean;
  metadata: {
    width: number;
    height: number;
    fileSize: number;
    format: 'jpeg' | 'png';
  };
}

export interface PhotoSession {
  id: string;
  userId?: string;
  photos: Photo[];
  createdAt: Date;
  settings: {
    countdownDuration: number;
    photoSize: 'small' | 'medium' | 'large';
    defaultFrame?: string;
    audioEnabled: boolean;
  };
}

export interface SocialShareConfig {
  platform: 'facebook' | 'instagram' | 'twitter' | 'whatsapp';
  url: string;
  text: string;
  hashtags: string[];
}

export interface PhotoSize {
  name: 'small' | 'medium' | 'large';
  width: number;
  height: number;
  label: string;
  description: string;
}

export const PHOTO_SIZES: PhotoSize[] = [
  { name: 'small', width: 640, height: 480, label: 'Small', description: 'Perfect for social media' },
  { name: 'medium', width: 1280, height: 960, label: 'Medium', description: 'Standard print size' },
  { name: 'large', width: 1920, height: 1440, label: 'Large', description: 'High quality prints' },
];
