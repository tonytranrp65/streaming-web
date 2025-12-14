const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = process.env.PORT || 3000;

// Store active streams and their viewers
const activeStreams = new Map(); // roomId -> { host: socketId, viewers: Set, streamInfo: {} }

// Serve static files from the Src directory
app.use(express.static(path.join(__dirname, 'Src')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Src', 'home.html'));
});

app.get('/stream/:roomId', (req, res) => {
  res.sendFile(path.join(__dirname, 'Src', 'stream.html'));
});

app.get('/create', (req, res) => {
  res.sendFile(path.join(__dirname, 'Src', 'create.html'));
});

// API endpoints
app.get('/api/streams', (req, res) => {
  const streams = Array.from(activeStreams.entries()).map(([roomId, data]) => ({
    roomId,
    ...data.streamInfo,
    viewerCount: data.viewers.size
  }));
  res.json(streams);
});

// Get network interfaces to find local IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const interface = interfaces[interfaceName];
    for (const address of interface) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }
  return 'localhost';
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Create a new stream
  socket.on('create-stream', (streamData) => {
    try {
      const roomId = generateRoomId();
      console.log(`📺 Creating stream: ${roomId} with data:`, streamData);

      activeStreams.set(roomId, {
        host: socket.id,
        viewers: new Set(),
        streamInfo: {
          title: streamData.title || 'Untitled Stream',
          description: streamData.description || '',
          createdAt: new Date().toISOString()
        }
      });

      socket.join(roomId);
      socket.emit('stream-created', { roomId });

      console.log(`📺 Stream created successfully: ${roomId} by ${socket.id}`);
      io.emit('stream-list-updated', getActiveStreams());
    } catch (error) {
      console.error('Error creating stream:', error);
      socket.emit('error', { message: 'Failed to create stream' });
    }
  });

  // Join an existing stream
  socket.on('join-stream', (data) => {
    const { roomId, isHost } = data;
    console.log(`👥 User ${socket.id} attempting to join stream: ${roomId} (host: ${isHost})`);
    console.log('Active streams:', Array.from(activeStreams.keys()));

    if (!activeStreams.has(roomId)) {
      console.log(`❌ Stream not found: ${roomId}`);
      socket.emit('error', { message: 'Stream not found' });
      return;
    }

    const streamData = activeStreams.get(roomId);
    socket.join(roomId);

    // Check if this is the host reconnecting
    if (isHost && streamData.host !== socket.id) {
      console.log(`👑 Host reclaiming stream: ${roomId}`);
      streamData.host = socket.id; // Transfer ownership to this socket
    } else if (!isHost) {
      // Regular viewer
      streamData.viewers.add(socket.id);

      // Notify the host that a viewer joined
      const hostSocket = streamData.host;
      io.to(hostSocket).emit('viewer-joined', {
        viewerId: socket.id,
        viewerCount: streamData.viewers.size
      });

      // Notify host to create peer connection for this viewer
      io.to(hostSocket).emit('viewer-joined-stream', socket.id);
    }

    socket.emit('stream-joined', {
      roomId,
      streamInfo: streamData.streamInfo,
      viewerCount: streamData.viewers.size,
      isHost: streamData.host === socket.id
    });

    console.log(`👥 User ${socket.id} successfully joined stream: ${roomId} (host: ${streamData.host === socket.id})`);
  });

  // WebRTC signaling for streaming
  socket.on('stream-offer', (data) => {
    // Send offer to specific viewer or all viewers in the room
    if (data.to) {
      io.to(data.to).emit('stream-offer', {
        offer: data.offer,
        from: socket.id
      });
    } else {
      socket.to(data.roomId).emit('stream-offer', {
        offer: data.offer,
        from: socket.id
      });
    }
  });

  socket.on('stream-answer', (data) => {
    // Send answer to the specific user who sent the offer
    if (data.to) {
      io.to(data.to).emit('stream-answer', {
        answer: data.answer,
        from: socket.id
      });
    } else {
      // Broadcast to room if no specific target
      socket.to(data.roomId).emit('stream-answer', {
        answer: data.answer,
        from: socket.id
      });
    }
  });

  socket.on('ice-candidate', (data) => {
    // Send ICE candidate to the specific target or broadcast to room
    if (data.to) {
      io.to(data.to).emit('ice-candidate', {
        candidate: data.candidate,
        from: socket.id
      });
    } else {
      socket.to(data.roomId).emit('ice-candidate', {
        candidate: data.candidate,
        from: socket.id
      });
    }
  });

  // Chat messages
  socket.on('chat-message', (data) => {
    const { roomId, message, username } = data;
    io.to(roomId).emit('chat-message', {
      message,
      username: username || 'Anonymous',
      timestamp: new Date().toISOString(),
      userId: socket.id
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);

    // Check if this user was hosting a stream
    for (const [roomId, streamData] of activeStreams.entries()) {
      if (streamData.host === socket.id) {
        // Host disconnected - don't immediately end the stream
        // Give them 30 seconds to reconnect (in case they're just navigating pages)
        console.log(`⏳ Host disconnected from stream ${roomId}, waiting for reconnection...`);

        setTimeout(() => {
          // Check if the stream still exists and if the host hasn't reconnected
          if (activeStreams.has(roomId) && activeStreams.get(roomId).host === socket.id) {
            console.log(`📺 Host didn't reconnect, ending stream: ${roomId}`);
            io.to(roomId).emit('stream-ended', { reason: 'Host disconnected' });
            activeStreams.delete(roomId);
            io.emit('stream-list-updated', getActiveStreams());
          }
        }, 30000); // 30 second grace period

        break;
      } else if (streamData.viewers.has(socket.id)) {
        // Viewer disconnected
        streamData.viewers.delete(socket.id);
        const hostSocket = streamData.host;
        io.to(hostSocket).emit('viewer-left', {
          viewerId: socket.id,
          viewerCount: streamData.viewers.size
        });
      }
    }
  });
});

// Helper functions
function generateRoomId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function getActiveStreams() {
  return Array.from(activeStreams.entries()).map(([roomId, data]) => ({
    roomId,
    ...data.streamInfo,
    viewerCount: data.viewers.size
  }));
}

server.listen(PORT, () => {
  const localIP = getLocalIP();
  console.log('🚀 Multi-user streaming server is running!');
  console.log(`📱 Local: http://localhost:${PORT}`);
  console.log(`🌐 Network: http://${localIP}:${PORT}`);
  console.log('\n💡 Open your browser and go to one of the URLs above');
  console.log('💡 Create streams and share them with others!');
});
