# YTDL-X

A modern YouTube downloader built with Electron, React, and yt-dlp. Download YouTube videos with a clean, intuitive interface.

## Features

- **Video Downloads**: Download YouTube videos in various qualities
- **Quality Selection**: Choose from available video qualities (4K, 1080p, 720p, etc.)
- **Bulk Downloads**: Add multiple URLs and download them in queue
- **Queue Management**: Manage download queue with concurrent downloads
- **FFmpeg Integration**: Merge video and audio streams for best quality
- **Native Combined**: Download native combined formats when available
- **Download History**: Track all your downloads with status
- **Settings**: Customize download path, quality preferences, and more

## Prerequisites

- **Node.js** 18 or higher
- **yt-dlp** installed and available in PATH
- **FFmpeg** (optional, for better quality merging)

### Installing yt-dlp

```bash
# Using pip
pip install yt-dlp

# Using homebrew (macOS)
brew install yt-dlp

# Using chocolatey (Windows)
choco install yt-dlp
```

## Installation

```bash
# Clone the repository
git clone https://github.com/BrazeDaGreat/ytdlx.git
cd ytdlx

# Install dependencies
npm install
```

## Development

```bash
# Start development server
npm run dev

# Format code
npm run format

# Lint code
npm run lint
```

## Building

```bash
# Build for production
npm run build

# Build and package (without installer)
npm run build:unpack

# Build for specific platforms
npm run build:win
npm run build:mac  
npm run build:linux
```

## Usage

1. **Single Video Download**:
   - Enter YouTube URL in the home tab
   - Select desired quality
   - Click "Download Now" for immediate download or "Add to Queue"

2. **Bulk Downloads**:
   - Go to Queue tab
   - Add multiple URLs (paste from clipboard supported)
   - Fetch video metadata
   - Select quality for each video
   - Add all to download queue

3. **Queue Management**:
   - Monitor active downloads
   - Pause/resume queue
   - Set concurrent download limit
   - Clear completed downloads

4. **Settings**:
   - Set download folder
   - Configure default quality
   - Adjust concurrent downloads
   - Enable/disable notifications

## Project Structure

```
src/
├── main/                 # Electron main process
├── preload/             # Electron preload scripts
├── renderer/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── assets/      # CSS and images
│   │   └── utils.jsx    # Utility functions
└── lib/                 # Shared libraries
    ├── ytdlp-wrapper.cjs # BrazeDaGreat/node-ytdlp
    ├── config-store.cjs  # Settings persistence
    └── VERSION.js        # Version info
```

## Configuration

Settings should be automatically saved to:
- **Windows**: `%APPDATA%/ytdlx/ytdlx-config.json`
- **macOS**: `~/Library/Preferences/ytdlx/ytdlx-config.json`
- **Linux**: `~/.config/ytdlx/ytdlx-config.json`

### Download failures
- Check internet connection
- Verify YouTube URL is valid
- Some videos may be geo-restricted or private

## License

This project is for educational purposes. Please respect YouTube's Terms of Service and content creators' rights.

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch  
5. Create Pull Request