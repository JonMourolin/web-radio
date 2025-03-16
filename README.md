# Web Radio

A modern web radio application built with Next.js and React.

**Version**: 0.2.6  
**Documentation**: [Version 0.2.6](docs/VERSION_0.2.6.md)

## Features

- 🎵 Continuous random playback of audio tracks
- 🎨 Modern, responsive user interface
- 🎧 Simple audio controls with volume adjustment
- 🖼️ Album cover display
- 📝 Automatic metadata enrichment from Discogs
- 🔄 Seamless track transitions
- 📱 Mobile-friendly design
- 🎯 Minimalist user experience
- ☁️ Cloud-based storage with Cloudinary
- 📊 Upload progress tracking
- 🔍 Discogs integration for metadata

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/web-radio.git
   cd web-radio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create uploads directory:
   ```bash
   mkdir -p public/uploads
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

   Or build and start for production:
   ```bash
   npm run build
   npm start
   ```

## Usage

1. Access the admin interface at `/admin`
2. Upload audio files through the admin interface
3. Visit the main page to start listening
4. Use the play/pause button and volume control to manage playback
5. Tracks will play continuously in random order

## Directory Structure

```
web-radio/
├── app/
│   ├── components/      # React components
│   ├── types/          # TypeScript types
│   ├── api/            # API routes
│   └── admin/          # Admin interface
├── public/
│   └── uploads/        # Audio files storage
└── docs/              # Documentation
```

## Technologies

- Next.js 15.2
- React 19
- TypeScript
- Tailwind CSS
- Cloudinary
- Discogs API
- music-metadata

## License

MIT License - See [LICENSE](LICENSE) for details.
