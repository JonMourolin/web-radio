# Web Radio

A modern web radio application built with Next.js and React.

**Version**: 0.3.1  
**Documentation**: [Version 0.3.1](docs/VERSION_0.3.1.md)  
**Coding Standards**: [Vibe Coding Rules](docs/VIBE_CODING_RULES.md)

## Features

- 📻 True radio streaming experience with shared listening
- 🎵 Continuous synchronized playback for all listeners
- 🎨 Matrix-inspired user interface
- 🎧 Simple audio controls with volume adjustment
- 🖼️ Album cover display
- 📝 Automatic metadata enrichment from Discogs
- 🔄 Seamless track transitions
- 📱 Mobile-friendly design
- 🎯 Minimalist user experience
- ☁️ Cloud-based storage with Cloudinary
- 📊 Upload progress tracking
- 🔍 Discogs integration for metadata
- 🔤 Monospace typography for futuristic look
- 📋 Coming up next preview section
- ⏱️ Remaining time display
- 🔇 Persistent pause state
- 🔧 Diagnostic tools for environment variables
- 🧪 Redis connectivity testing

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/web-radio.git
   cd web-radio
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   KV_REST_API_URL=your_upstash_redis_url
   KV_REST_API_TOKEN=your_upstash_redis_token
   ```

## Usage

1. Start the Next.js development server:
   ```
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture

The application uses a simplified architecture:

1. **Next.js Web Application**: Handles the user interface, API endpoints, and file uploads.
   - The built-in API handles radio state management
   - Cloudinary is used for audio file storage and direct streaming
   - Upstash Redis synchronizes playback state between listeners

## Environment Variables

- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
- `KV_REST_API_URL`: Your Upstash Redis URL
- `KV_REST_API_TOKEN`: Your Upstash Redis token

## Production Deployment

For production deployment with Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set the environment variables in Vercel dashboard
4. Deploy

Note: This application is designed to be deployed directly on Vercel without any additional server requirements.

## License

MIT

## Author

Your Name