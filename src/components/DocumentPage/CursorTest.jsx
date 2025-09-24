import React, { useState, useEffect, useRef } from 'react';
import RemoteCursorsContainer from './RemoteCursorsContainer';

const CursorTest = () => {
  const [remoteCursors, setRemoteCursors] = useState([]);
  const [currentUser] = useState({ userId: 'current-user' });
  const documentRef = useRef(null);

  // Simulate cursor movements for testing
  useEffect(() => {
    const interval = setInterval(() => {
      const testUsers = [
        { userId: 'user1', userName: 'John Doe', userColor: '#3B82F6' },
        { userId: 'user2', userName: 'Jane Smith', userColor: '#EF4444' },
        { userId: 'user3', userName: 'Bob Wilson', userColor: '#10B981' }
      ];

      const randomUser = testUsers[Math.floor(Math.random() * testUsers.length)];
      // Use character-only position for accurate cursor tracking
      const randomPosition = {
        ch: Math.floor(Math.random() * 500) // Random character position
      };

      setRemoteCursors(prev => {
        const existing = prev.find(cursor => cursor.userId === randomUser.userId);
        
        if (existing) {
          return prev.map(cursor => 
            cursor.userId === randomUser.userId 
              ? { ...cursor, position: randomPosition, lastUpdate: Date.now() }
              : cursor
          );
        } else {
          return [...prev, {
            userId: randomUser.userId,
            position: randomPosition,
            userName: randomUser.userName,
            userColor: randomUser.userColor,
            lastUpdate: Date.now()
          }];
        }
      });
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Remote Cursor Test</h2>
      <p className="mb-4 text-gray-600">This demonstrates remote cursor visualization. Cursors will appear and move randomly.</p>
      
      <div className="relative border border-gray-300 rounded-lg p-4 h-96 bg-gray-50">
        <div ref={documentRef} className="font-mono text-sm leading-6">
          <div>Line 1: This is a test document for cursor visualization</div>
          <div>Line 2: Multiple users can be editing simultaneously</div>
          <div>Line 3: Each user has their own colored cursor</div>
          <div>Line 4: Cursors show the user's name and position</div>
          <div>Line 5: The cursors fade out after 3 seconds of inactivity</div>
          <div>Line 6: This simulates real-time collaborative editing</div>
          <div>Line 7: Users can see where others are working</div>
          <div>Line 8: This improves collaboration and reduces conflicts</div>
          <div>Line 9: The system tracks cursor positions in real-time</div>
          <div>Line 10: Each cursor has a unique color and user info</div>
          <div>Line 11: Cursors are positioned based on character position only</div>
          <div>Line 12: The animation shows cursor movement smoothly</div>
          <div>Line 13: This creates a more engaging editing experience</div>
          <div>Line 14: Users can see who is working on what</div>
          <div>Line 15: The system handles multiple concurrent users</div>
          <div>Line 16: Cursor positions are synchronized via WebSocket</div>
          <div>Line 17: Real-time updates ensure everyone stays in sync</div>
          <div>Line 18: The interface is responsive and user-friendly</div>
          <div>Line 19: Collaboration becomes more intuitive and efficient</div>
          <div>Line 20: This is the future of document editing</div>
        </div>
        
        <RemoteCursorsContainer
          remoteCursors={remoteCursors}
          currentUserId={currentUser.userId}
          documentRef={documentRef}
        />
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>Active cursors: {remoteCursors.length}</p>
        <p>This is a simulation - in real usage, cursors come from WebSocket messages</p>
      </div>
    </div>
  );
};

export default CursorTest; 