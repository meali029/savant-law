# WebSocket Integration for Real-time Document Editing

This document describes the WebSocket integration that enables real-time collaborative document editing in the Savant application.

## Overview

The WebSocket integration provides real-time collaboration features including:
- User presence tracking
- Cursor position synchronization
- Text insertion/deletion synchronization
- Connection status monitoring
- Automatic reconnection

## Architecture

### Components

1. **WebSocket Service** (`src/services/websocketApi.js`)
   - Singleton service that manages WebSocket connections
   - Handles connection, disconnection, and message routing
   - Provides automatic reconnection with exponential backoff

2. **WebSocket Hook** (`src/hooks/useWebSocket.js`)
   - React hook that provides WebSocket functionality to components
   - Manages connection state and user presence
   - Provides event handlers for real-time updates

3. **Active Users Display** (`src/components/DocumentPage/ActiveUsersDisplay.jsx`)
   - Component that shows active users in the RegionHeader
   - Displays connection status and user avatars
   - Shows tooltip with detailed user information

4. **WebSocket Status** (`src/components/DocumentPage/WebSocketStatus.jsx`)
   - Component that shows connection status and statistics
   - Displays in the DocumentToolbar
   - Shows real-time collaboration metrics

### Integration Points

#### RegionHeader Integration
The `RegionHeader.jsx` component now includes an `ActiveUsersDisplay` component that shows:
- Connection status (connected/disconnected/connecting)
- Active users with avatars
- User count and details on hover

#### DocumentToolbar Integration
The `DocumentToolbar.jsx` component includes a `WebSocketStatus` component that shows:
- Connection status with color-coded indicators
- Real-time statistics (active users, messages, cursor moves)
- Connection health monitoring

#### DocumentPage Integration
The main `DocumentPage.jsx` component integrates WebSocket functionality:
- Automatic connection when a contract ID is available
- Real-time cursor position tracking
- Document interaction event handling
- Error handling and user notifications

## WebSocket Protocol

### Connection
```
wss://api.getmediarank.com/ws/contracts/{contractId}?token={jwt_token}
```

### Message Types

#### Outgoing Messages

1. **Cursor Movement**
```json
{
  "type": "cursor-move",
  "position": { "line": 0, "ch": 5 },
  "selection": null,
  "timestamp": 1234567890
}
```

2. **Text Insertion**
```json
{
  "type": "text-insert",
  "text": "Hello world",
  "position": { "line": 0, "ch": 5 },
  "timestamp": 1234567890
}
```

3. **Text Deletion**
```json
{
  "type": "text-delete",
  "from": { "line": 0, "ch": 5 },
  "to": { "line": 0, "ch": 10 },
  "timestamp": 1234567890
}
```

4. **Sync Request**
```json
{
  "type": "sync-request",
  "timestamp": 1234567890
}
```

#### Incoming Messages

1. **Current Users**
```json
{
  "type": "current-users",
  "users": [
    {
      "userId": "user123",
      "fullName": "John Doe",
      "email": "john@example.com",
      "userType": "lawyer",
      "color": "#3B82F6"
    }
  ]
}
```

2. **User Join**
```json
{
  "type": "user-join",
  "userId": "user123",
  "fullName": "John Doe",
  "email": "john@example.com",
  "userType": "lawyer",
  "color": "#3B82F6"
}
```

3. **User Leave**
```json
{
  "type": "user-leave",
  "userId": "user123"
}
```

4. **Cursor Movement**
```json
{
  "type": "cursor-move",
  "userId": "user123",
  "position": { "line": 0, "ch": 5 },
  "color": "#3B82F6"
}
```

5. **Text Insertion**
```json
{
  "type": "text-insert",
  "userId": "user123",
  "text": "Hello world",
  "position": { "line": 0, "ch": 5 }
}
```

6. **Text Deletion**
```json
{
  "type": "text-delete",
  "userId": "user123",
  "from": { "line": 0, "ch": 5 },
  "to": { "line": 0, "ch": 10 }
}
```

7. **Sync Response**
```json
{
  "type": "sync-response",
  "edits": [
    {
      "type": "insert",
      "text": "Hello",
      "position": { "line": 0, "ch": 0 },
      "timestamp": 1234567890
    }
  ]
}
```

## Usage

### Basic WebSocket Hook Usage

```javascript
import { useWebSocket } from '../../hooks/useWebSocket';

const MyComponent = ({ contractId }) => {
  const {
    connectionStatus,
    activeUsers,
    isConnecting,
    error,
    stats,
    sendCursorMove,
    sendTextInsert,
    sendTextDelete,
    onCursorMove,
    onTextInsert,
    onTextDelete
  } = useWebSocket(contractId);

  // Handle cursor movement from other users
  useEffect(() => {
    onCursorMove((message) => {
      console.log('Cursor moved by:', message.userId, 'to:', message.position);
    });
  }, [onCursorMove]);

  return (
    <div>
      <div>Status: {connectionStatus}</div>
      <div>Active Users: {activeUsers.length}</div>
    </div>
  );
};
```

### Active Users Display

```javascript
import ActiveUsersDisplay from './ActiveUsersDisplay';

<ActiveUsersDisplay
  activeUsers={activeUsers}
  connectionStatus={connectionStatus}
  isConnecting={isConnecting}
  onUserClick={(user) => console.log('User clicked:', user)}
/>
```

### WebSocket Status Display

```javascript
import WebSocketStatus from './WebSocketStatus';

<WebSocketStatus
  connectionStatus={connectionStatus}
  isConnecting={isConnecting}
  stats={websocketStats}
  showStats={true}
/>
```

## Demo Page

A demo page is available at `/websocket-demo` that demonstrates all WebSocket functionality:

- Real-time text editing
- User presence tracking
- Cursor movement visualization
- Connection status monitoring
- Statistics display
- Log export functionality

## Error Handling

The WebSocket integration includes comprehensive error handling:

1. **Connection Errors**: Automatic reconnection with exponential backoff
2. **Authentication Errors**: Token validation and refresh
3. **Message Parsing Errors**: Graceful degradation for malformed messages
4. **Network Errors**: Connection status updates and user notifications

## Security

- JWT token authentication required for all connections
- Token validation on connection establishment
- Automatic token refresh when needed
- Secure WebSocket connections (WSS)

## Performance

- Efficient message batching for cursor movements
- Debounced cursor position updates
- Automatic cleanup on component unmount
- Memory leak prevention with proper event listener cleanup

## Future Enhancements

1. **Visual Cursor Indicators**: Show other users' cursors in the document
2. **Conflict Resolution**: Handle simultaneous edits from multiple users
3. **Document Versioning**: Track document history and changes
4. **Presence Indicators**: Show user activity status (typing, idle, etc.)
5. **Chat Integration**: Real-time messaging between collaborators
6. **Document Locking**: Prevent conflicts during critical edits

## Troubleshooting

### Common Issues

1. **Connection Fails**: Check JWT token validity and network connectivity
2. **Users Not Showing**: Verify contract ID and user permissions
3. **Messages Not Sending**: Check WebSocket connection status
4. **Reconnection Loops**: Verify server availability and token refresh

### Debug Mode

Enable debug logging by setting `localStorage.debug = 'websocket'` in the browser console.

## API Endpoints

- **WebSocket**: `wss://api.getmediarank.com/ws/contracts/{contractId}`
- **Authentication**: Uses existing JWT token from auth system
- **Reconnection**: Automatic with exponential backoff (1s, 2s, 4s, 8s, 16s) 