# Chat Persistence Implementation

## Overview
The chat application now uses **SQLite database** for persistent storage. All messages, rooms, and reactions are saved to disk and will survive:
- Server restarts
- Page refreshes
- Users leaving and rejoining rooms

## Database Schema

### Tables

#### 1. `rooms`
Stores room information:
- `room_id` (TEXT, PRIMARY KEY) - Unique room identifier
- `pin` (TEXT) - Room PIN for access control
- `created_at` (DATETIME) - Timestamp when room was created

#### 2. `messages`
Stores all chat messages:
- `id` (TEXT, PRIMARY KEY) - Unique message identifier (UUID)
- `room_id` (TEXT) - Foreign key to rooms table
- `author` (TEXT) - Socket ID of message sender
- `username` (TEXT) - Display name of sender
- `message` (TEXT) - Message content
- `type` (TEXT) - Message type (text/image)
- `time` (TEXT) - ISO timestamp
- `reply_to` (TEXT) - JSON string of replied message (if any)
- `created_at` (DATETIME) - Database timestamp

#### 3. `reactions`
Stores message reactions:
- `id` (INTEGER, PRIMARY KEY) - Auto-increment ID
- `message_id` (TEXT) - Foreign key to messages table
- `username` (TEXT) - User who reacted
- `reaction` (TEXT) - Emoji reaction
- `created_at` (DATETIME) - Database timestamp
- UNIQUE constraint on (message_id, username) - One reaction per user per message

## How It Works

### Room Creation
1. User creates a room with roomId and PIN
2. Room is saved to database
3. Room persists even after all users leave

### Joining a Room
1. User enters roomId and PIN
2. Server verifies credentials against database
3. All historical messages are loaded from database
4. Messages include all reactions

### Sending Messages
1. Message is immediately saved to database
2. Message is broadcast to other users in real-time
3. Message persists forever

### Adding Reactions
1. Reaction is saved to database
2. Reaction is broadcast to all users in room
3. If user changes reaction, it updates in database

### Page Refresh / Rejoin
1. User rejoins with same roomId and PIN
2. Server loads all messages from database
3. All reactions are included
4. Chat history is fully restored

## Database File

- **Location**: `/chat-app/server/chat.db`
- **Type**: SQLite3 database file
- **Backup**: Copy `chat.db` file to backup all chat data
- **Reset**: Delete `chat.db` file to clear all data (will be recreated on next server start)

## Benefits

✅ **Persistent Storage** - Messages never disappear  
✅ **No External Dependencies** - SQLite is file-based, no database server needed  
✅ **Fast Performance** - In-memory caching for active rooms  
✅ **Easy Backup** - Single file contains all data  
✅ **Scalable** - Can migrate to PostgreSQL/MySQL later if needed  

## Migration Path

If you need to scale to a larger database in the future:
1. The database module (`database.js`) abstracts all DB operations
2. Simply replace the implementation with PostgreSQL/MySQL
3. No changes needed to the main server code

## Testing Persistence

1. **Create a room** and send some messages
2. **Refresh the page** - messages should still be there
3. **Restart the server** - messages should still be there
4. **Leave and rejoin the room** - all messages and reactions restored

## Notes

- The database file is added to `.gitignore` to avoid committing user data
- Rooms persist forever (no automatic cleanup)
- Consider adding admin tools to manage/delete old rooms if needed
