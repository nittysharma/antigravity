const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
app.use(cors());

// Serve static files from the React client
app.use(express.static(path.join(__dirname, '../client/dist')));

const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 1e7, // 10MB
  cors: {
    origin: "http://localhost:5173", // Vite default port
    methods: ["GET", "POST"]
  }
});

// In-memory storage
const rooms = {}; // { roomId: { pin: '1234', users: [] } }

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on('create_room', ({ roomId, pin, username }) => {
    // Check if room exists in database
    const existingRoom = db.getRoom(roomId);
    if (existingRoom) {
      socket.emit('error', 'Room already exists');
      return;
    }

    // Save room to database
    db.createRoom(roomId, pin);

    // Keep in-memory state for active users
    rooms[roomId] = { pin, users: [] };
    socket.join(roomId);
    rooms[roomId].users.push({ id: socket.id, username });
    socket.emit('room_joined', { roomId, username });
    io.to(roomId).emit('user_list', rooms[roomId].users);
    console.log(`Room created: ${roomId} by ${username}`);
  });

  socket.on('join_room', ({ roomId, pin, username }) => {
    // Check database for room
    const room = db.getRoom(roomId);
    if (!room) {
      socket.emit('error', 'Room does not exist');
      return;
    }
    if (room.pin !== pin) {
      socket.emit('error', 'Incorrect PIN');
      return;
    }

    // Initialize in-memory room if not exists
    if (!rooms[roomId]) {
      rooms[roomId] = { pin: room.pin, users: [] };
    }

    socket.join(roomId);
    rooms[roomId].users.push({ id: socket.id, username });
    socket.emit('room_joined', { roomId, username });

    // Load messages from database
    const messages = db.getMessages(roomId);
    socket.emit('load_messages', messages);

    io.to(roomId).emit('user_list', rooms[roomId].users);
    console.log(`${username} joined room ${roomId}`);
  });

  socket.on('send_message', (data) => {
    // data: { roomId, author, message, time, type (text/image), file? }
    console.log(`Message sent in room ${data.roomId} by ${data.username} (Type: ${data.type})`);

    // Save message to database
    db.saveMessage(data);

    socket.to(data.roomId).emit('receive_message', data);
  });

  socket.on('typing', ({ roomId, username, isTyping }) => {
    socket.to(roomId).emit('user_typing', { username, isTyping });
  });

  socket.on('add_reaction', ({ roomId, messageId, reaction, username }) => {
    // Save reaction to database
    db.saveReaction(messageId, username, reaction);

    // Broadcast reaction to everyone in the room
    io.to(roomId).emit('message_reaction', { messageId, reaction, username });
  });

  // WebRTC Signaling
  socket.on('call_user', ({ userToCall, signalData, from, name }) => {
    io.to(userToCall).emit('call_user', { signal: signalData, from, name });
  });

  socket.on('answer_call', (data) => {
    io.to(data.to).emit('call_accepted', data.signal);
  });

  socket.on('ice_candidate', ({ to, candidate }) => {
    io.to(to).emit('ice_candidate', candidate);
  });

  socket.on('end_call', ({ to }) => {
    io.to(to).emit('end_call');
  });

  socket.on('get_users', ({ roomId }) => {
    if (rooms[roomId]) {
      socket.emit('user_list', rooms[roomId].users);
    }
  });

  socket.on('disconnect', () => {
    console.log('User Disconnected', socket.id);
    // Remove user from all rooms they were in
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const index = room.users.findIndex(u => u.id === socket.id);
      if (index !== -1) {
        const user = room.users[index];
        room.users.splice(index, 1);
        io.to(roomId).emit('user_list', room.users);
        // Keep room in database even if empty - rooms persist forever
        // Only clean up in-memory state if no active users
        if (room.users.length === 0) {
          delete rooms[roomId];
        }
      }
    }
  });
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

server.listen(3001, () => {
  console.log('SERVER RUNNING ON PORT 3001');
});
