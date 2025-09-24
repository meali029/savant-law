import React from 'react';
import { Wifi, WifiOff, Loader2, Users, MessageSquare, MousePointer } from 'lucide-react';

const WebSocketStatus = ({ 
  connectionStatus = 'disconnected',
  isConnecting = false,
  stats = {},
  showStats = false 
}) => {
  const getStatusIcon = () => {
    if (isConnecting) {
      return <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />;
    }
    
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = () => {
    if (isConnecting) return 'text-yellow-600 dark:text-yellow-400';
    
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600 dark:text-green-400';
      case 'disconnected':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Connection Status */}
      <div className="flex items-center space-x-1">
        {getStatusIcon()}
        <span className={`text-xs font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      {/* Stats (optional) */}
      {showStats && connectionStatus === 'connected' && (
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <Users className="w-3 h-3" />
            <span>{stats.activeUsers || 0}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageSquare className="w-3 h-3" />
            <span>{stats.messageCount || 0}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MousePointer className="w-3 h-3" />
            <span>{stats.cursorCount || 0}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebSocketStatus; 