# Application Architecture

This document describes the high-level architecture of the Chat Application.

## Architecture Diagram

```mermaid
graph TD
    subgraph Client [Client (Browser)]
        UI[React UI]
        subgraph Components
            Auth[AuthScreen]
            Chat[ChatRoom]
            Call[CallModal]
            MsgList[MessageList]
        end
        
        Store[Local State (useState/useRef)]
        SocketClient[Socket.io Client]
        WebRTC[WebRTC API]
        
        UI --> Components
        Chat --> MsgList
        Chat --> Call
        
        Components --> Store
        Components --> SocketClient
        Call --> WebRTC
    end

    subgraph Server [Server (Node.js)]
        Express[Express App]
        SocketServer[Socket.io Server]
        InMemory[In-Memory State (Active Users)]
        DB_Adapter[Database Adapter]
        
        Express --> SocketServer
        SocketServer --> InMemory
        SocketServer --> DB_Adapter
    end

    subgraph Database [Persistence]
        SQLite[(SQLite Database)]
    end

    %% Connections
    SocketClient <-->|WebSocket (Events: join, message, signal)| SocketServer
    WebRTC <-->|P2P Audio/Video Stream| WebRTC
    DB_Adapter <-->|SQL Queries| SQLite
    
    %% Data Flow
    SocketServer -.->|Relay Signaling| SocketClient
    SocketServer -.->|Persist Messages| DB_Adapter
```

## Component Description

### Client-Side
- **React UI**: The main user interface built with React and Vite.
- **Components**:
    - `AuthScreen`: Handles user login and room creation/joining.
    - `ChatRoom`: The main chat interface, managing messages and user interactions.
    - `CallModal`: Manages the calling interface, including incoming call notifications and active call controls.
    - `MessageList`: Displays the list of messages with support for reactions and replies.
- **Socket.io Client**: Manages real-time bidirectional communication with the server.
- **WebRTC API**: Handles peer-to-peer audio/video streaming directly between clients.

### Server-Side
- **Express App**: Serves the static frontend files and handles HTTP requests.
- **Socket.io Server**: Handles real-time events (messaging, signaling, room management).
- **In-Memory State**: Tracks active users in rooms for real-time presence.
- **Database Adapter**: Abstraction layer for interacting with the SQLite database.

### Database
- **SQLite**: Persists rooms, messages, and reactions.

## Key Workflows

1.  **Messaging**:
    -   Client sends `send_message` event via Socket.io.
    -   Server receives event, saves message to SQLite.
    -   Server broadcasts `receive_message` to other clients in the room.

2.  **Calling (WebRTC)**:
    -   Initiator sends `call_user` signal via Socket.io.
    -   Server relays signal to target user.
    -   Target accepts, sending `answer_call` signal back.
    -   ICE candidates are exchanged via server relay.
    -   Direct P2P connection is established for audio stream.
