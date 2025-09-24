import { useState, useEffect, useCallback, useRef } from 'react';
import websocketService from '../services/websocketApi';

export const useWebSocket = (contractId) => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [activeUsers, setActiveUsers] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    messageCount: 0,
    cursorCount: 0,
    activeUsers: 0
  });

  // Refs to store callback functions
  const onCursorMoveRef = useRef(null);
  const onTextInsertRef = useRef(null);
  const onTextDeleteRef = useRef(null);
  const onSyncResponseRef = useRef(null);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (!contractId) {
      setError('No contract ID provided');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Set up event handlers
      websocketService.onConnectionStatusChange = (status) => {
        setConnectionStatus(status);
        setIsConnecting(false);
      };

      websocketService.onCurrentUsers = (users) => {
        // Remove duplicates by userId to ensure unique users
        const uniqueUsers = users.filter((user, index, self) => 
          index === self.findIndex(u => u.userId === user.userId)
        );
        setActiveUsers(uniqueUsers);
        setStats(prev => ({ ...prev, activeUsers: uniqueUsers.length }));
      };

      websocketService.onUserJoin = (user) => {
        setActiveUsers(prev => {
          // Check if user already exists to prevent duplicates
          const userExists = prev.some(existingUser => existingUser.userId === user.userId);
          if (userExists) {
            return prev; // Return existing array if user already exists
          }
          // Only increment stats if user is actually added
          setStats(prev => ({ ...prev, activeUsers: prev.activeUsers + 1 }));
          return [...prev, user]; // Add user only if they don't exist
        });
      };

      websocketService.onUserLeave = (user) => {
        setActiveUsers(prev => prev.filter(u => u.userId !== user.userId));
        setStats(prev => ({ ...prev, activeUsers: prev.activeUsers - 1 }));
      };

      websocketService.onCursorMove = (message) => {
        if (onCursorMoveRef.current) {
          onCursorMoveRef.current(message);
        }
      };

      websocketService.onTextInsert = (message) => {
        if (onTextInsertRef.current) {
          onTextInsertRef.current(message);
        }
      };

      websocketService.onTextDelete = (message) => {
        if (onTextDeleteRef.current) {
          onTextDeleteRef.current(message);
        }
      };

      websocketService.onSyncResponse = (message) => {
        if (onSyncResponseRef.current) {
          onSyncResponseRef.current(message);
        }
      };

      websocketService.onError = (error) => {
        setError(error.message || 'WebSocket connection error');
        setIsConnecting(false);
      };

      // Connect to WebSocket
      await websocketService.connect(contractId);

    } catch (error) {
      setError(error.message || 'Failed to connect to WebSocket');
      setIsConnecting(false);
    }
  }, [contractId]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    websocketService.disconnect();
    setConnectionStatus('disconnected');
    setActiveUsers([]);
    setError(null);
  }, []);

  // Send cursor movement
  const sendCursorMove = useCallback((position, selection = null) => {
    return websocketService.sendCursorMove(position, selection);
  }, []);

  // Send text insertion
  const sendTextInsert = useCallback((text, position) => {
    return websocketService.sendTextInsert(text, position);
  }, []);

  // Send text deletion
  const sendTextDelete = useCallback((from, to) => {
    return websocketService.sendTextDelete(from, to);
  }, []);

  // Request sync
  const requestSync = useCallback(() => {
    return websocketService.requestSync();
  }, []);

  // Set up event handlers
  const onCursorMove = useCallback((callback) => {
    onCursorMoveRef.current = callback;
  }, []);

  const onTextInsert = useCallback((callback) => {
    onTextInsertRef.current = callback;
  }, []);

  const onTextDelete = useCallback((callback) => {
    onTextDeleteRef.current = callback;
  }, []);

  const onSyncResponse = useCallback((callback) => {
    onSyncResponseRef.current = callback;
  }, []);

  // Get connection status
  const getConnectionStatus = useCallback(() => {
    return websocketService.getConnectionStatus();
  }, []);

  // Get current user info
  const getCurrentUser = useCallback(() => {
    return websocketService.getCurrentUser();
  }, []);

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const status = websocketService.getConnectionStatus();
      setStats({
        messageCount: status.messageCount,
        cursorCount: status.cursorCount,
        activeUsers: status.activeUsers
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-connect when contractId changes
  useEffect(() => {
    if (contractId && connectionStatus === 'disconnected' && !isConnecting) {
      connect();
    }
  }, [contractId, connect, connectionStatus, isConnecting]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // State
    connectionStatus,
    activeUsers,
    isConnecting,
    error,
    stats,
    
    // Actions
    connect,
    disconnect,
    sendCursorMove,
    sendTextInsert,
    sendTextDelete,
    requestSync,
    
    // Event handlers
    onCursorMove,
    onTextInsert,
    onTextDelete,
    onSyncResponse,
    
    // Utilities
    getConnectionStatus,
    getCurrentUser
  };
}; 