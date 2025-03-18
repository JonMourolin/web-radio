# Version 0.3.0 - Streaming Server Update

Release Date: March 18, 2025

## Overview

Version 0.3.0 introduces a major architectural update to Web Radio with the addition of a dedicated streaming server. This update transforms the application from a simple client-side player into a true web radio experience, where all listeners hear the same tracks simultaneously.

## Key Features

### Dedicated Streaming Server
- Node.js-based server that handles audio processing and streaming
- Runs independently from the Next.js application
- Provides a continuous audio stream regardless of client connections

### FFmpeg Integration
- Professional audio processing using FFmpeg
- Proper audio format conversion for web streaming
- Consistent audio quality across all devices

### Synchronized Listening Experience
- All connected users hear the same track at the same time
- No more individual playback control (like a real radio)
- Server-side playlist management

### Smart Playlist Algorithm
- Randomized track selection from the Cloudinary library
- Tracks history management to prevent recent repetitions
- Automatic transitions between songs

### Stream Status API
- Real-time information about currently playing track
- Preview of upcoming tracks
- Stream health and statistics

### Improved Player UI
- New StreamPlayer component designed for streaming
- Display of currently playing track with metadata
- Preview of upcoming tracks

## Technical Changes

1. **Architecture**: Shifted from client-side audio processing to server-side streaming
2. **Dependencies**: Added FFmpeg as a system requirement
3. **APIs**: New endpoints for stream status and health
4. **Configuration**: New setup scripts for streaming server configuration

## Setup Instructions

Please refer to the README.md file for detailed setup instructions. The key changes to note:

1. FFmpeg must be installed on the system running the streaming server
2. The streaming server must be started before the Next.js application
3. Environment variables must be properly configured for both components

## Known Limitations

- The streaming server must be deployed separately in production environments
- System resources requirements are higher due to FFmpeg audio processing
- Limited support for audio formats (MP3 recommended)

## Future Plans

- Docker containerization for easier deployment
- Multiple streaming channels/stations
- DJ scheduling and programming
- User request system
- Audio effects and processing options
- Broadcast analytics 