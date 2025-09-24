"use client"
import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';

const WebSocketDemo = () => {
  const [contractId, setContractId] = useState('68907ad03ecd1180cd214109');
  const [userToken, setUserToken] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjoxNzU0OTAzNTc5fQ.yzWoIDNlUtvkSAUMaInzklfnZeM1r4Kx7sYyWeStYGw');
  const [isConnected, setIsConnected] = useState(false);
  const [documentContent, setDocumentContent] = useState('');
  const [lineNumbers, setLineNumbers] = useState('');
  const [logEntries, setLogEntries] = useState([]);
  const [stats, setStats] = useState({
    messageCount: 0,
    cursorCount: 0,
    activeUsers: 0
  });

  const editorRef = useRef(null);
  const lastCursorPosition = useRef({ line: 0, ch: 0 });

  // WebSocket hook
  const {
    connectionStatus,
    activeUsers,
    isConnecting,
    error: websocketError,
    stats: websocketStats,
    sendCursorMove,
    sendTextInsert,
    sendTextDelete,
    requestSync,
    onCursorMove,
    onTextInsert,
    onTextDelete,
    onSyncResponse
  } = useWebSocket(isConnected ? contractId : null);

  // Update line numbers
  const updateLineNumbers = () => {
    const lines = documentContent.split('\n');
    setLineNumbers(lines.map((_, index) => index + 1).join('\n'));
  };

  // Log function
  const log = (type, message) => {
    const timestamp = new Date().toLocaleTimeString();
    const entry = `[${timestamp}] ${message}`;
    setLogEntries(prev => [...prev, { type, message: entry }]);
  };

  // Get cursor position (character-only)
  const getCursorPosition = (editor) => {
    const pos = editor.selectionStart;
    return { ch: pos };
  };

  // Handle text input
  const handleTextInput = () => {
    updateLineNumbers();
    
    if (editorRef.current && connectionStatus === 'connected') {
      const cursorPos = getCursorPosition(editorRef.current);
      
      if (cursorPos.ch !== lastCursorPosition.current.ch) {
        lastCursorPosition.current = cursorPos;
        sendCursorMove(cursorPos);
      }
    }
  };

  // Handle key down
  const handleKeyDown = (event) => {
    if (connectionStatus === 'connected') {
      const cursorPos = getCursorPosition(editorRef.current);
      sendCursorMove(cursorPos);
    }
  };

  // Handle cursor move
  const handleCursorMove = () => {
    if (connectionStatus === 'connected') {
      const cursorPos = getCursorPosition(editorRef.current);
      sendCursorMove(cursorPos);
    }
  };

  // WebSocket event handlers
  useEffect(() => {
    onCursorMove((message) => {
      log('cursor', `Cursor moved by ${message.userId} to character position ${message.position.ch}`);
    });

    onTextInsert((message) => {
      log('text', `Text inserted by ${message.userId}: "${message.text}"`);
    });

    onTextDelete((message) => {
      log('text', `Text deleted by ${message.userId} from character ${message.from.ch} to ${message.to.ch}`);
    });

    onSyncResponse((message) => {
      log('info', `Received sync response with ${message.edits?.length || 0} edits`);
    });
  }, [onCursorMove, onTextInsert, onTextDelete, onSyncResponse]);

  // Update stats
  useEffect(() => {
    setStats(websocketStats);
  }, [websocketStats]);

  // Update line numbers when content changes
  useEffect(() => {
    updateLineNumbers();
  }, [documentContent]);

  // Connection status effect
  useEffect(() => {
    if (connectionStatus === 'connected') {
      setIsConnected(true);
      log('success', 'Connected to contract WebSocket!');
    } else if (connectionStatus === 'disconnected') {
      setIsConnected(false);
      log('warning', 'Disconnected from WebSocket');
    }
  }, [connectionStatus]);

  // Error effect
  useEffect(() => {
    if (websocketError) {
      log('error', `WebSocket Error: ${websocketError}`);
    }
  }, [websocketError]);

  // Simulate functions
  const simulateTyping = () => {
    if (connectionStatus === 'connected') {
      const cursorPos = getCursorPosition(editorRef.current);
      sendTextInsert('Hello from demo! ', cursorPos);
      log('info', 'Simulated text insertion');
    }
  };

  const simulateCursorMove = () => {
    if (connectionStatus === 'connected') {
      sendCursorMove({ ch: Math.floor(Math.random() * 500) });
      log('info', 'Simulated cursor movement');
    }
  };

  const handleRequestSync = () => {
    if (connectionStatus === 'connected') {
      requestSync();
      log('info', 'Requested sync with server');
    }
  };

  const clearLog = () => {
    setLogEntries([]);
    log('info', 'Log cleared');
  };

  const exportLog = () => {
    const logText = logEntries.map(entry => entry.message).join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `websocket-demo-log-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    log('info', 'Log exported');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-400">🔧 Real-time Contract Editing Demo</h1>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">{connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          {/* Active Users */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-blue-400 mb-3">👥 Active Users</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activeUsers.map((user) => (
                <div key={user.userId} className="flex items-center space-x-2 p-2 bg-gray-700 rounded">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: user.color || '#3B82F6' }}
                  >
                    {(user.fullName || user.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm">{user.fullName || user.email}</div>
                    <div className="text-xs text-gray-400">{user.userType}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-blue-400 mb-3">🎮 Controls</h3>
            <div className="space-y-2">
              <button
                onClick={simulateTyping}
                disabled={connectionStatus !== 'connected'}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Simulate Typing
              </button>
              <button
                onClick={simulateCursorMove}
                disabled={connectionStatus !== 'connected'}
                className="w-full px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
              >
                Simulate Cursor
              </button>
                              <button
                  onClick={handleRequestSync}
                  disabled={connectionStatus !== 'connected'}
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                >
                  Request Sync
                </button>
            </div>
          </div>

          {/* Stats */}
          <div className="p-4">
            <h3 className="text-sm font-semibold text-blue-400 mb-3">📊 Stats</h3>
            <div className="space-y-1 text-sm">
              <div>Users Online: {stats.activeUsers}</div>
              <div>Messages Sent: {stats.messageCount}</div>
              <div>Cursor Moves: {stats.cursorCount}</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Editor Header */}
          <div className="bg-gray-800 border-b border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span>Contract:</span>
                <span className="bg-gray-700 px-2 py-1 rounded text-sm font-mono">
                  {contractId.substring(0, 8)}...
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={clearLog}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Clear Log
                </button>
                <button
                  onClick={exportLog}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  Export Log
                </button>
              </div>
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 flex">
            <div className="w-12 bg-gray-800 text-gray-500 p-4 font-mono text-sm text-right border-r border-gray-700">
              {lineNumbers}
            </div>
            <textarea
              ref={editorRef}
              value={documentContent}
              onChange={(e) => setDocumentContent(e.target.value)}
              onInput={handleTextInput}
              onKeyDown={handleKeyDown}
              onMouseUp={handleCursorMove}
              onKeyUp={handleCursorMove}
              className="flex-1 bg-gray-900 text-gray-100 p-4 font-mono text-sm resize-none outline-none"
              placeholder="Start typing to see real-time collaboration..."
            />
          </div>

          {/* Log Panel */}
          <div className="h-48 bg-gray-800 border-t border-gray-700 p-3 overflow-y-auto">
            <div className="font-mono text-xs space-y-1">
              {logEntries.map((entry, index) => (
                <div key={index} className={`${entry.type === 'error' ? 'text-red-400' : entry.type === 'success' ? 'text-green-400' : entry.type === 'warning' ? 'text-yellow-400' : 'text-blue-400'}`}>
                  {entry.message}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebSocketDemo; 