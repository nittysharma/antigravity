const Database = require('better-sqlite3');
const path = require('path');

// Create database file in the server directory
const db = new Database(path.join(__dirname, 'chat.db'), { verbose: console.log });

// Initialize database tables
function initializeDatabase() {
  // Rooms table
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      room_id TEXT PRIMARY KEY,
      pin TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      author TEXT NOT NULL,
      username TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'text',
      time TEXT NOT NULL,
      reply_to TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE
    )
  `);

  // Reactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id TEXT NOT NULL,
      username TEXT NOT NULL,
      reaction TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(message_id, username),
      FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
    )
  `);

  console.log('Database initialized successfully');
}

// Room operations
function createRoom(roomId, pin) {
  const stmt = db.prepare('INSERT OR IGNORE INTO rooms (room_id, pin) VALUES (?, ?)');
  return stmt.run(roomId, pin);
}

function getRoom(roomId) {
  const stmt = db.prepare('SELECT * FROM rooms WHERE room_id = ?');
  return stmt.get(roomId);
}

function deleteRoom(roomId) {
  const stmt = db.prepare('DELETE FROM rooms WHERE room_id = ?');
  return stmt.run(roomId);
}

// Message operations
function saveMessage(messageData) {
  const stmt = db.prepare(`
    INSERT INTO messages (id, room_id, author, username, message, type, time, reply_to)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  return stmt.run(
    messageData.id,
    messageData.roomId,
    messageData.author,
    messageData.username,
    messageData.message,
    messageData.type || 'text',
    messageData.time,
    messageData.replyTo ? JSON.stringify(messageData.replyTo) : null
  );
}

function getMessages(roomId) {
  const stmt = db.prepare(`
    SELECT 
      m.*,
      GROUP_CONCAT(r.username || ':' || r.reaction) as reactions_data
    FROM messages m
    LEFT JOIN reactions r ON m.id = r.message_id
    WHERE m.room_id = ?
    GROUP BY m.id
    ORDER BY m.created_at ASC
  `);
  
  const messages = stmt.all(roomId);
  
  // Parse reactions and replyTo
  return messages.map(msg => {
    const reactions = {};
    if (msg.reactions_data) {
      msg.reactions_data.split(',').forEach(item => {
        const [username, reaction] = item.split(':');
        if (username && reaction) {
          reactions[username] = reaction;
        }
      });
    }
    
    return {
      id: msg.id,
      roomId: msg.room_id,
      author: msg.author,
      username: msg.username,
      message: msg.message,
      type: msg.type,
      time: msg.time,
      replyTo: msg.reply_to ? JSON.parse(msg.reply_to) : null,
      reactions: reactions
    };
  });
}

function deleteMessage(messageId) {
  const stmt = db.prepare('DELETE FROM messages WHERE id = ?');
  return stmt.run(messageId);
}

// Reaction operations
function saveReaction(messageId, username, reaction) {
  const stmt = db.prepare(`
    INSERT INTO reactions (message_id, username, reaction)
    VALUES (?, ?, ?)
    ON CONFLICT(message_id, username) 
    DO UPDATE SET reaction = excluded.reaction
  `);
  
  return stmt.run(messageId, username, reaction);
}

function getReactions(messageId) {
  const stmt = db.prepare('SELECT username, reaction FROM reactions WHERE message_id = ?');
  const reactions = stmt.all(messageId);
  
  const result = {};
  reactions.forEach(r => {
    result[r.username] = r.reaction;
  });
  
  return result;
}

// Initialize database on module load
initializeDatabase();

module.exports = {
  db,
  createRoom,
  getRoom,
  deleteRoom,
  saveMessage,
  getMessages,
  deleteMessage,
  saveReaction,
  getReactions
};
