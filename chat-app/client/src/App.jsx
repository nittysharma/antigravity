import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import AuthScreen from './components/AuthScreen';
import ChatRoom from './components/ChatRoom';
import LockScreen from './components/LockScreen';

const socket = io.connect(window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin);

function App() {
  const [roomData, setRoomData] = useState(null); // { roomId, pin, username }
  const [isLocked, setIsLocked] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Auto-lock timer
  useEffect(() => {
    if (!roomData || isLocked) return;

    const checkActivity = setInterval(() => {
      if (Date.now() - lastActivity > 5 * 60 * 1000) { // 5 minutes
        setIsLocked(true);
      }
    }, 1000);

    const handleActivity = () => setLastActivity(Date.now());

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      clearInterval(checkActivity);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [roomData, isLocked, lastActivity]);

  const handleCreateRoom = ({ username, roomId, pin }) => {
    socket.emit('create_room', { roomId, pin, username });
    // Listen for success/error
    socket.once('room_joined', () => {
      setRoomData({ roomId, pin, username });
      setLastActivity(Date.now());
    });
    socket.once('error', (msg) => alert(msg));
  };

  const handleJoinRoom = ({ username, roomId, pin }) => {
    socket.emit('join_room', { roomId, pin, username });
    socket.once('room_joined', () => {
      setRoomData({ roomId, pin, username });
      setLastActivity(Date.now());
    });
    socket.once('error', (msg) => alert(msg));
  };

  const handleUnlock = (enteredPin) => {
    if (enteredPin === roomData.pin) {
      setIsLocked(false);
      setLastActivity(Date.now());
      return true;
    }
    return false;
  };

  const handleExit = () => {
    setRoomData(null);
    setIsLocked(false);
    socket.emit('leave_room'); // Optional: handle on server if needed, or just disconnect logic handles it
    window.location.reload(); // Simple reset
  };

  if (!roomData) {
    return <AuthScreen onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-900 text-white">
      {isLocked && (
        <LockScreen onUnlock={handleUnlock} onExit={handleExit} />
      )}
      <ChatRoom
        socket={socket}
        username={roomData.username}
        roomId={roomData.roomId}
        onLock={() => setIsLocked(true)}
      />
    </div>
  );
}

export default App;
