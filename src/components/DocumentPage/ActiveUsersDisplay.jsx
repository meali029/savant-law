import React from 'react';
import { Users, Wifi, WifiOff, Loader2 } from 'lucide-react';

/**
 * ActiveUsersDisplay component
 * Displays active users in the document collaboration session.
 * Expects activeUsers array to contain unique users (no duplicates by userId).
 */
const ActiveUsersDisplay = ({ 
  activeUsers = [], 
  connectionStatus = 'disconnected',
  isConnecting = false,
  onUserClick = null 
}) => {
  const getConnectionStatusIcon = () => {
    if (isConnecting) {
      return <Loader2 className="w-3 h-3 animate-spin text-yellow-500" />;
    }
    
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-3 h-3 text-green-500" />;
      case 'disconnected':
        return <WifiOff className="w-3 h-3 text-red-500" />;
      default:
        return <WifiOff className="w-3 h-3 text-gray-500" />;
    }
  };

  const getConnectionStatusText = () => {
    if (isConnecting) return 'Connecting...';
    
    switch (connectionStatus) {
      case 'connected':
        return `${activeUsers.length} active`;
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = () => {
    if (isConnecting) return 'text-yellow-600';
    
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600';
      case 'disconnected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Connection Status */}
      <div className="flex items-center space-x-1">
        {getConnectionStatusIcon()}
        <span className={`text-xs font-medium ${getStatusColor()}`}>
          {getConnectionStatusText()}
        </span>
      </div>

      {/* Active Users */}
      {activeUsers.length > 0 && (
        <div className="flex items-center space-x-1">
          <Users className="w-3 h-3 text-blue-500" />
          <div className="flex -space-x-1">
            {activeUsers.slice(0, 3).map((user, index) => (
              <div
                key={user.userId}
                className={`w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium cursor-pointer hover:scale-110 transition-transform`}
                style={{
                  backgroundColor: user.color || '#3B82F6',
                  color: 'white',
                  zIndex: activeUsers.length - index
                }}
                title={`${user.fullName || user.email} (${user.userType})`}
                onClick={() => onUserClick && onUserClick(user)}
              >
                {(user.fullName || user.email || user.userId).charAt(0).toUpperCase()}
              </div>
            ))}
            {activeUsers.length > 3 && (
              <div className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                +{activeUsers.length - 3}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tooltip for more users */}
      {activeUsers.length > 3 && (
        <div className="relative group">
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            <div className="flex flex-col space-y-1">
              {activeUsers.map((user) => (
                <div key={user.userId} className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-medium"
                    style={{
                      backgroundColor: user.color || '#3B82F6',
                      color: 'white'
                    }}
                  >
                    {(user.fullName || user.email || user.userId).charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs">
                    {user.fullName || user.email}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({user.userType})
                  </span>
                </div>
              ))}
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveUsersDisplay; 