import React, { useState, useEffect, useRef } from 'react';
import RemoteCursor from './RemoteCursor';
import { getUserId } from '../../services/authApi';

const RemoteCursorsContainer = ({ 
  remoteCursors = [], 
  currentUserId,
  onCursorClick = null,
  documentRef = null
}) => {
  const [cursors, setCursors] = useState(new Map());
  const cursorTimeouts = useRef(new Map());

  // Update cursors when remoteCursors prop changes
  useEffect(() => {
    const newCursors = new Map();
    
    remoteCursors.forEach(cursor => {
      // Don't show current user's cursor
      if (cursor.userId === currentUserId || cursor.userId === getUserId()) return;
      
      newCursors.set(cursor.userId, {
        ...cursor,
        isActive: true,
        lastUpdate: Date.now()
      });
    });

    setCursors(newCursors);
  }, [remoteCursors, currentUserId]);

  // Handle cursor timeout
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const updatedCursors = new Map(cursors);
      let hasChanges = false;

      updatedCursors.forEach((cursor, userId) => {
        // Mark cursor as inactive if no update in last 5 seconds
        if (now - cursor.lastUpdate > 5000) {
          updatedCursors.set(userId, {
            ...cursor,
            isActive: false
          });
          hasChanges = true;
        }
      });

      if (hasChanges) {
        setCursors(updatedCursors);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cursors]);

  // Update cursor position when new message arrives
  const updateCursor = (userId, position, userName, userColor) => {
    setCursors(prev => {
      const updated = new Map(prev);
      updated.set(userId, {
        userId,
        position,
        userName,
        userColor,
        isActive: true,
        lastUpdate: Date.now()
      });
      return updated;
    });
  };

  // Expose updateCursor method for parent component
  useEffect(() => {
    if (window.updateRemoteCursor) {
      window.updateRemoteCursor = updateCursor;
    }
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {Array.from(cursors.values()).map((cursor) => (
        <RemoteCursor
          key={cursor.userId}
          userId={cursor.userId}
          position={cursor.position}
          userName={cursor.userName}
          userColor={cursor.userColor}
          isActive={cursor.isActive}
          documentRef={documentRef}
        />
      ))}
    </div>
  );
};

export default RemoteCursorsContainer; 