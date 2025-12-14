# StreamSwitch - Multi-User Live Streaming Platform

A comprehensive live streaming platform where multiple users can create streams, join existing streams, and chat in real-time.

## Features

- 🎥 **Multi-user streaming**: Create your own streams and join others
- 💬 **Real-time chat**: Chat with all viewers in any stream
- 👥 **Viewer management**: See viewer counts and manage your audience
- 🎨 **Modern UI**: Beautiful dark theme with responsive design
- 🔄 **Room-based architecture**: Each stream has its own unique room
- 🌐 **Network accessible**: Share streams across your local network

## Quick Start

### Automated Setup (Recommended)

Run the Python setup script to automatically install dependencies and start the server:

```bash
python setup.py
```

The setup script will:
- ✅ Check if Node.js/npm are installed
- 📦 Install all dependencies (including Socket.io)
- 🚀 Start the multi-user streaming server
- 🌐 Display local and network access URLs

### Manual Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

## How to Use

### For Streamers:
1. **Visit the homepage** at `http://localhost:3000`
2. **Click "Start Streaming"** to create a new stream
3. **Enter your stream details** (title and description)
4. **Grant camera/microphone permissions** when prompted
5. **Share your stream URL** with viewers

### For Viewers:
1. **Visit the homepage** to see active streams
2. **Click "Watch Stream"** on any active stream
3. **Chat with other viewers** in real-time
4. **Enjoy the live stream!**

## Architecture

- **Backend**: Node.js + Express + Socket.io
- **Real-time Communication**: WebRTC for streaming + Socket.io for chat
- **Room System**: Each stream has a unique room ID
- **Multi-user Support**: Unlimited viewers per stream

## Technologies Used

- **Backend**: Node.js + Express + Socket.io
- **Frontend**: HTML5 + Vanilla JavaScript
- **Real-time**: WebRTC (streaming) + Socket.io (chat)
- **Styling**: CSS3 with modern responsive design
- **Architecture**: Room-based multi-user system

## Author

tony-EJ
