import { AppliedFilters, BASIC_FILTERS, ADVANCED_FILTERS } from '../types/filters';
import { Sticker, Frame, Photo } from '../types/photo';

export class ImageProcessor {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor() {
    // Only create canvas on client side
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d')!;
    }
  }

  // Apply filters to an image
  async applyFilters(imageSrc: string, filters: AppliedFilters): Promise<string> {
    return new Promise((resolve) => {
      if (!this.canvas || !this.ctx) {
        resolve(imageSrc); // Return original if canvas not available
        return;
      }

      const img = new Image();
      img.onload = () => {
        this.canvas!.width = img.width;
        this.canvas!.height = img.height;
        
        // Apply basic filters
        let filterString = '';
        filters.basic.forEach(filterName => {
          const filter = BASIC_FILTERS.find(f => f.name === filterName);
          if (filter) {
            filterString += filter.value + ' ';
          }
        });

        // Apply advanced filters
        Object.entries(filters.advanced).forEach(([name, value]) => {
          const filter = ADVANCED_FILTERS.find(f => f.name === name);
          if (filter) {
            filterString += `${name}(${value}${filter.unit}) `;
          }
        });

        this.ctx!.filter = filterString.trim();
        this.ctx!.drawImage(img, 0, 0);
        
        resolve(this.canvas!.toDataURL('image/jpeg', 0.9));
      };
      img.src = imageSrc;
    });
  }

  // Add stickers to an image
  async addStickers(imageSrc: string, stickers: Sticker[]): Promise<string> {
    return new Promise((resolve) => {
      if (!this.canvas || !this.ctx) {
        resolve(imageSrc);
        return;
      }

      const img = new Image();
      img.onload = () => {
        this.canvas!.width = img.width;
        this.canvas!.height = img.height;
        this.ctx!.drawImage(img, 0, 0);

        // Sort stickers by z-index
        const sortedStickers = [...stickers].sort((a, b) => a.zIndex - b.zIndex);

        // Load and draw each sticker
        let loadedStickers = 0;
        sortedStickers.forEach(sticker => {
          const stickerImg = new Image();
          stickerImg.onload = () => {
            this.ctx!.save();
            this.ctx!.translate(sticker.x + sticker.width / 2, sticker.y + sticker.height / 2);
            this.ctx!.rotate((sticker.rotation * Math.PI) / 180);
            this.ctx!.drawImage(
              stickerImg,
              -sticker.width / 2,
              -sticker.height / 2,
              sticker.width,
              sticker.height
            );
            this.ctx!.restore();
            
            loadedStickers++;
            if (loadedStickers === sortedStickers.length) {
              resolve(this.canvas!.toDataURL('image/jpeg', 0.9));
            }
          };
          stickerImg.src = sticker.src;
        });

        if (sortedStickers.length === 0) {
          resolve(this.canvas!.toDataURL('image/jpeg', 0.9));
        }
      };
      img.src = imageSrc;
    });
  }

  // Add frame to an image
  async addFrame(imageSrc: string, frame: Frame): Promise<string> {
    return new Promise((resolve) => {
      if (!this.canvas || !this.ctx) {
        resolve(imageSrc);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const frameImg = new Image();
        frameImg.onload = () => {
          // Create a new canvas with frame dimensions
          const frameCanvas = document.createElement('canvas');
          const frameCtx = frameCanvas.getContext('2d')!;
          
          frameCanvas.width = frameImg.width;
          frameCanvas.height = frameImg.height;
          
          // Draw the frame first
          frameCtx.drawImage(frameImg, 0, 0);
          
          // Calculate position to center the photo in the frame
          const scale = Math.min(
            (frameImg.width * 0.8) / img.width,
            (frameImg.height * 0.8) / img.height
          );
          
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          const x = (frameImg.width - scaledWidth) / 2;
          const y = (frameImg.height - scaledHeight) / 2;
          
          // Draw the photo on top of the frame
          frameCtx.drawImage(img, x, y, scaledWidth, scaledHeight);
          
          resolve(frameCanvas.toDataURL('image/jpeg', 0.9));
        };
        frameImg.src = frame.src;
      };
      img.src = imageSrc;
    });
  }

  // Resize image to specific dimensions
  async resizeImage(imageSrc: string, width: number, height: number): Promise<string> {
    return new Promise((resolve) => {
      if (!this.canvas || !this.ctx) {
        resolve(imageSrc);
        return;
      }

      const img = new Image();
      img.onload = () => {
        this.canvas!.width = width;
        this.canvas!.height = height;
        this.ctx!.drawImage(img, 0, 0, width, height);
        resolve(this.canvas!.toDataURL('image/jpeg', 0.9));
      };
      img.src = imageSrc;
    });
  }

  // Convert image to blob for download
  async imageToBlob(imageSrc: string, format: 'jpeg' | 'png' = 'jpeg'): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.canvas || !this.ctx) {
        // Create a fallback blob
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob((blob) => {
            resolve(blob!);
          }, `image/${format}`, 0.9);
        };
        img.src = imageSrc;
        return;
      }

      const img = new Image();
      img.onload = () => {
        this.canvas!.width = img.width;
        this.canvas!.height = img.height;
        this.ctx!.drawImage(img, 0, 0);
        
        this.canvas!.toBlob((blob) => {
          resolve(blob!);
        }, `image/${format}`, 0.9);
      };
      img.src = imageSrc;
    });
  }

  // Get image metadata
  async getImageMetadata(imageSrc: string): Promise<{ width: number; height: number; fileSize: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const blob = this.imageToBlob(imageSrc);
        blob.then(blobData => {
          resolve({
            width: img.width,
            height: img.height,
            fileSize: blobData.size
          });
        });
      };
      img.src = imageSrc;
    });
  }

  // Remove background (simplified version - in real app you'd use AI service)
  async removeBackground(imageSrc: string): Promise<string> {
    // This is a placeholder - in a real implementation you'd call an AI service
    // For now, we'll just return the original image
    return imageSrc;
  }

  // Create photo strip with multiple images
  async createPhotoStrip(photos: string[], frame?: Frame): Promise<string> {
    return new Promise((resolve) => {
      const stripCanvas = document.createElement('canvas');
      const stripCtx = stripCanvas.getContext('2d')!;
      
      const stripWidth = 800;
      const photoHeight = stripWidth / photos.length;
      stripCanvas.width = stripWidth;
      stripCanvas.height = photoHeight;
      
      let loadedPhotos = 0;
      photos.forEach((photoSrc, index) => {
        const img = new Image();
        img.onload = () => {
          const x = (stripWidth / photos.length) * index;
          const y = 0;
          const width = stripWidth / photos.length;
          const height = photoHeight;
          
          stripCtx.drawImage(img, x, y, width, height);
          
          loadedPhotos++;
          if (loadedPhotos === photos.length) {
            resolve(stripCanvas.toDataURL('image/jpeg', 0.9));
          }
        };
        img.src = photoSrc;
      });
    });
  }
}

// Utility functions
export const downloadImage = (imageSrc: string, filename: string) => {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('a');
  link.href = imageSrc;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const shareToSocialMedia = (platform: string, imageSrc: string, text: string) => {
  if (typeof window === 'undefined') return;

  const shareData = {
    title: 'My Photo Booth Photo',
    text: text,
    url: imageSrc
  };

  if (navigator.share && platform === 'native') {
    navigator.share(shareData);
  } else {
    // Fallback for specific platforms
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(imageSrc)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(imageSrc)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + imageSrc)}`
    };
    
    if (urls[platform as keyof typeof urls]) {
      window.open(urls[platform as keyof typeof urls], '_blank');
    }
  }
};

export const generateFilename = (prefix: string = 'photobooth'): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}-${timestamp}.jpg`;
};
