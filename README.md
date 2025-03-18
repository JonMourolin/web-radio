# Web Radio

A modern web radio application built with Next.js and React.

**Version**: 0.3.0  
**Documentation**: [Version 0.3.0](docs/VERSION_0.3.0.md)  
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
- 🔊 Dedicated audio streaming server
- 🎚️ FFmpeg-powered audio processing
- 🔁 Smart playlist rotation algorithm
- 📡 Real-time stream status API
- 🔌 Easy configuration with setup scripts

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

4. Install FFmpeg (required for the streaming server):
   - macOS: `brew install ffmpeg`
   - Ubuntu/Debian: `sudo apt install ffmpeg`
   - Windows: Download from [ffmpeg.org](https://ffmpeg.org/download.html)

5. Set up the streaming server:
   ```
   node scripts/setup-streaming.js
   ```

## Usage

1. Start the streaming server:
   ```
   node scripts/run-stream-server.js
   ```
   This server must be running for the radio functionality to work.

2. In a separate terminal, start the Next.js development server:
   ```
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture

The application consists of two main components:

1. **Next.js Web Application**: Handles the user interface, API endpoints, and file uploads.

2. **Streaming Server**: A dedicated Node.js server that:
   - Retrieves tracks from Cloudinary
   - Creates a synchronized broadcast for all listeners
   - Uses FFmpeg for audio processing and streaming
   - Provides status information via API endpoints

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

Note: In production, the streaming server must be deployed separately on a server with FFmpeg installed.

## License

MIT

## Author

Your Name