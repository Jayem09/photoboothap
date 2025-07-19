# Photo Booth App 📸

A modern, feature-rich photo booth application built with Next.js, React, and TypeScript. Capture, edit, and share your photos with a variety of filters, stickers, frames, and social sharing capabilities.

## ✨ Features

### 📷 **Camera & Capture**

- **High-quality photo capture** with customizable resolution
- **Countdown timer** with audio support
- **Multi-shot mode** for capturing multiple photos in sequence
- **Camera error handling** with fallback options
- **Photo size selection** (Small, Medium, Large)
- **Audio countdown** with customizable sounds

### 🎨 **Photo Editing**

- **Basic Filters**: Grayscale, Sepia, Invert, Blur, Brightness, Contrast, Saturation, Hue Rotation
- **Advanced Filters**: Adjustable brightness, contrast, saturation, blur, hue, and opacity with sliders
- **Real-time filter preview** with live updates
- **Filter combinations** - apply multiple filters simultaneously
- **Filter reset** functionality

### 🏷️ **Stickers & Decorations**

- **Drag-and-drop sticker placement** with precise positioning
- **Sticker categories**: Emojis, Text, Decorations
- **Sticker properties**: Position, size, rotation, layer order
- **Keyboard shortcuts** for sticker manipulation (arrow keys, delete)
- **Sticker library** with categorized collections
- **Real-time sticker editing** with property controls

### 🖼️ **Photo Frames**

- **Classic frames**: White, Black borders
- **Modern frames**: Minimal, Gradient styles
- **Fun frames**: Party borders, Balloon frames
- **Elegant frames**: Gold, Silver decorative frames
- **Frame categories** for easy browsing
- **Frame preview** with visual selection

### 💾 **Photo Management**

- **Photo gallery** with grid and list views
- **Photo history** with session management
- **Photo metadata** display (size, file size, format)
- **Photo status indicators** (downloaded, shared)
- **Session export/import** functionality
- **Photo deletion** with confirmation

### 📤 **Download & Sharing**

- **High-quality downloads** in JPEG/PNG format
- **Social media sharing** to Facebook, Twitter, WhatsApp
- **Native sharing** support for mobile devices
- **Customizable filenames** with timestamps
- **Share status tracking** for photos

### 🎵 **Audio Features**

- **Countdown audio** with customizable sounds
- **Audio toggle** for enabling/disabling sounds
- **Web Audio API** integration for high-quality audio
- **Cross-platform audio support**

### 📱 **User Experience**

- **Responsive design** for desktop and mobile
- **Smooth animations** and transitions
- **Loading states** and error handling
- **Keyboard shortcuts** for power users
- **Accessibility features** with proper ARIA labels
- **Touch-friendly interface** for mobile devices

### 🔧 **Technical Features**

- **TypeScript** for type safety
- **Canvas-based image processing** for high performance
- **Local storage** for photo persistence
- **Error boundaries** for robust error handling
- **Optimized image processing** with Web Workers
- **Progressive Web App** capabilities

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Modern web browser with camera access

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/photobooth-app.git
   cd photobooth-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Environment Setup

Create a `.env.local` file in the root directory:

```env
# Optional: Database configuration for cloud storage
DATABASE_URL=your_database_url_here

# Optional: Cloud storage configuration
CLOUDINARY_URL=your_cloudinary_url_here
```

## 📖 Usage Guide

### Taking Photos

1. **Navigate to Camera View**

   - Click the "Camera" tab in the header
   - Allow camera permissions when prompted

2. **Configure Settings**

   - Select photo size (Small, Medium, Large)
   - Enable/disable audio countdown
   - Choose multi-shot mode if desired

3. **Capture Photo**
   - Click "Take Photo" to start countdown
   - Position yourself in frame
   - Photo will be captured automatically

### Editing Photos

1. **Access Edit View**

   - After capturing, you'll be taken to the edit view
   - Or click "Edit" tab to edit existing photos

2. **Apply Filters**

   - Use the Filter Panel on the right
   - Select basic filters or adjust advanced settings
   - Click "Apply Filters" to process

3. **Add Stickers**

   - Browse sticker categories in the Sticker Panel
   - Click stickers to add them to your photo
   - Drag stickers to reposition
   - Use keyboard shortcuts for precise control

4. **Add Frames**
   - Browse frame categories in the Frame Panel
   - Click frames to apply them
   - Remove frames using the "Remove Frame" button

### Managing Photos

1. **View Gallery**

   - Click "Gallery" tab to see all photos
   - Switch between grid and list views
   - Click photos to view details

2. **Download Photos**

   - Click "Download" button on any photo
   - Photos are saved in high quality
   - Filenames include timestamps

3. **Share Photos**
   - Click share buttons for social platforms
   - Use native sharing on mobile devices
   - Share status is tracked

## 🛠️ Technical Architecture

### Core Components

- **`useCamera`**: Camera management and photo capture
- **`useCountdown`**: Countdown timer with audio
- **`usePhotos`**: Photo storage and management
- **`ImageProcessor`**: Canvas-based image processing
- **`PhotoCanvas`**: Interactive photo editing
- **`PhotoGallery`**: Photo browsing and management

### File Structure

```
photobooth-app/
├── app/                    # Next.js app directory
├── components/            # React components
│   ├── camera/           # Camera-related components
│   ├── editing/          # Photo editing components
│   ├── layout/           # Layout components
│   └── ui/              # Reusable UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── types/                # TypeScript type definitions
└── public/              # Static assets
```

### Key Technologies

- **Next.js 15**: React framework with App Router
- **React 19**: Latest React with concurrent features
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Canvas API**: Image processing and manipulation
- **Web Audio API**: Audio countdown functionality
- **Local Storage**: Photo persistence

## 🎯 Feature Roadmap

### Planned Features

- [ ] **AI Background Removal** - Remove backgrounds automatically
- [ ] **Cloud Storage** - Save photos to cloud services
- [ ] **User Accounts** - Login and photo sync
- [ ] **Photo Strips** - Classic photo booth strips
- [ ] **Video Recording** - Capture short videos
- [ ] **QR Code Sharing** - Share photos via QR codes
- [ ] **Print Integration** - Direct printing support
- [ ] **Advanced Filters** - AI-powered filters
- [ ] **Photo Effects** - Vintage, retro effects
- [ ] **Multi-language** - Internationalization support

### Performance Optimizations

- [ ] **Image compression** for faster uploads
- [ ] **Lazy loading** for gallery images
- [ ] **Web Workers** for heavy processing
- [ ] **Service Worker** for offline support
- [ ] **Image caching** for better performance

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Webcam** for camera integration
- **Fabric.js** for canvas manipulation
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Lucide React** for icons

## 📞 Support

If you encounter any issues or have questions:

- **Issues**: [GitHub Issues](https://github.com/yourusername/photobooth-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/photobooth-app/discussions)
- **Email**: support@photobooth-app.com

---

**Made with ❤️ by the Photo Booth App Team**
# photoboothap
