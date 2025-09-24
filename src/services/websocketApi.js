// WebSocket API Service for Real-time Document Editing

import { getToken, getUserId, getCurrentUser } from './authApi';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnecting = false;
    this.isConnected = false;
    this.contractId = null;
    this.userId = null;
    this.userName = null;
    this.userType = null;
    this.activeUsers = [];
    this.messageCount = 0;
    this.cursorCount = 0;
    this.lastCursorPosition = { ch: 0 };
    this.typingTimeout = null;
    
    // Event callbacks
    this.onUserJoin = null;
    this.onUserLeave = null;
    this.onCursorMove = null;
    this.onTextInsert = null;
    this.onTextDelete = null;
    this.onSyncResponse = null;
    this.onConnectionStatusChange = null;
    this.onCurrentUsers = null;
    this.onError = null;
  }

  // Connect to WebSocket
  async connect(contractId) {
    if (this.isConnecting || this.isConnected) {
      return;
    }

    this.contractId = contractId;
    this.isConnecting = true;

    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Get user info from token
      const userInfo = this.parseToken(token);
      
      // Try to get the real user ID from cookies or API
      let realUserId = getUserId();
      if (!realUserId) {
        try {
          const userData = await getCurrentUser();
          if (userData) {
            realUserId = userData.id;
          }
        } catch (error) {
          console.error('Error getting real user ID:', error);
        }
      }
      
      this.userId = realUserId || userInfo.sub; // Use real ID if available, fallback to email
      this.userName = userInfo.full_name || userInfo.email || userInfo.sub;
      this.userType = userInfo.user_type || 'user';

      const wsUrl = `wss://api.getmediarank.com/ws/contracts/${contractId}?token=${token}`;
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.messageCount = 0;
        this.cursorCount = 0;
        
        if (this.onConnectionStatusChange) {
          this.onConnectionStatusChange('connected');
        }
        
        console.log('WebSocket connected successfully');
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        this.isConnected = false;
        this.isConnecting = false;
        
        if (this.onConnectionStatusChange) {
          this.onConnectionStatusChange('disconnected');
        }
        
        console.log(`WebSocket disconnected: ${event.code} - ${event.reason}`);
        
        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        this.isConnecting = false;
        console.error('WebSocket error:', error);
        
        if (this.onError) {
          this.onError(error);
        }
      };

    } catch (error) {
      this.isConnecting = false;
      console.error('Failed to connect to WebSocket:', error);
      
      if (this.onError) {
        this.onError(error);
      }
    }
  }

  // Disconnect from WebSocket
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.activeUsers = [];
    this.reconnectAttempts = 0;
  }

  // Send message to WebSocket
  sendMessage(type, data = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        type,
        ...data,
        timestamp: Date.now()
      };
      
      if (type === 'text-insert') {
        console.log('📤 WebSocket sending text-insert message:', {
          type: message.type,
          text: message.text.substring(0, 100) + (message.text.length > 100 ? '...' : ''),
          position: message.position,
          timestamp: message.timestamp,
          textLength: message.text.length
        });
      }
      
      this.ws.send(JSON.stringify(message));
      this.messageCount++;
      return true;
    }
    return false;
  }

  // Send cursor movement
  sendCursorMove(position, selection = null) {
    // Handle character-only positions (ignore line numbers for accuracy)
    const currentCh = position.ch || 0;
    const lastCh = this.lastCursorPosition.ch || 0;
    
    if (currentCh !== lastCh) {
      this.lastCursorPosition = { ch: currentCh };
      this.cursorCount++;
      
      return this.sendMessage('cursor-move', {
        position: { ch: currentCh },
        selection
      });
    }
    return false;
  }

  // Send text insertion
  sendTextInsert(text, position) {
    // Ensure position uses character-only format
    const characterPosition = { ch: position.ch || 0 };
    
    console.log('🔍 WebSocket sendTextInsert called with:', {
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      position: characterPosition,
      textLength: text.length
    });
    return this.sendMessage('text-insert', {
      text,
      position: characterPosition
    });
  }

  // Send text deletion
  sendTextDelete(from, to) {
    // Ensure positions use character-only format
    const characterFrom = { ch: from.ch || 0 };
    const characterTo = { ch: to.ch || 0 };
    
    return this.sendMessage('text-delete', {
      from: characterFrom,
      to: characterTo
    });
  }

  // Request sync
  requestSync() {
    return this.sendMessage('sync-request');
  }

  // Handle incoming messages
  handleMessage(message) {
    console.log('Received WebSocket message:', message.type);
    
    switch (message.type) {
      case 'current-users':
        this.handleCurrentUsers(message.users);
        break;
        
      case 'user-join':
        this.handleUserJoin(message);
        break;
        
      case 'user-leave':
        this.handleUserLeave(message);
        break;
        
      case 'cursor-move':
        this.handleCursorMove(message);
        break;
        
      case 'text-insert':
        this.handleTextInsert(message);
        break;
        
      case 'text-delete':
        this.handleTextDelete(message);
        break;
        
      case 'sync-response':
        this.handleSyncResponse(message);
        break;
        
      default:
        console.log(`Unknown message type: ${message.type}`);
    }
  }

  // Handle current users
  handleCurrentUsers(users) {
    // Remove duplicates by userId to ensure unique users
    const uniqueUsers = users.filter((user, index, self) => 
      index === self.findIndex(u => u.userId === user.userId)
    );
    this.activeUsers = uniqueUsers;
    if (this.onCurrentUsers) {
      this.onCurrentUsers(uniqueUsers);
    }
    console.log(`Loaded ${uniqueUsers.length} active users`);
  }

  // Handle user join
  handleUserJoin(user) {
    // Check if user already exists to prevent duplicates
    const userExists = this.activeUsers.some(existingUser => existingUser.userId === user.userId);
    if (!userExists) {
      this.activeUsers.push(user);
      if (this.onUserJoin) {
        this.onUserJoin(user);
      }
      console.log(`User joined: ${user.fullName || user.email}`);
    } else {
      console.log(`User already exists, skipping duplicate: ${user.fullName || user.email}`);
    }
  }

  // Handle user leave
  handleUserLeave(user) {
    this.activeUsers = this.activeUsers.filter(u => u.userId !== user.userId);
    if (this.onUserLeave) {
      this.onUserLeave(user);
    }
    console.log(`User left: ${user.userId}`);
  }

  // Handle cursor movement
  handleCursorMove(message) {
    if (this.onCursorMove) {
      this.onCursorMove(message);
    }
  }

  // Handle text insertion
  handleTextInsert(message) {
    if (this.onTextInsert) {
      this.onTextInsert(message);
    }
  }

  // Handle text deletion
  handleTextDelete(message) {
    if (this.onTextDelete) {
      this.onTextDelete(message);
    }
  }

  // Handle sync response
  handleSyncResponse(message) {
    if (this.onSyncResponse) {
      this.onSyncResponse(message);
    }
  }

  // Schedule reconnection
  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (!this.isConnected && !this.isConnecting) {
        this.connect(this.contractId);
      }
    }, delay);
  }

  // Parse JWT token to get user info
  parseToken(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing token:', error);
      return { sub: 'unknown', email: 'unknown@example.com', user_type: 'user' };
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      activeUsers: this.activeUsers.length,
      messageCount: this.messageCount,
      cursorCount: this.cursorCount
    };
  }

  // Get active users
  getActiveUsers() {
    return this.activeUsers;
  }

  // Get current user info
  getCurrentUser() {
    return {
      userId: this.userId,
      userName: this.userName,
      userType: this.userType
    };
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService; 