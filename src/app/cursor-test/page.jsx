"use client"
import React, { useState, useEffect } from 'react';
import StreamingDocumentViewer from '../../components/StreamingDocumentViewer';

const CursorTestPage = () => {
  const [content, setContent] = useState(`Line 1: This is a test document for cursor visualization
Line 2: Multiple users can be editing simultaneously
Line 3: Each user has their own colored cursor
Line 4: Cursors show the user's name and position
Line 5: The cursors fade out after 3 seconds of inactivity
Line 6: This simulates real-time collaborative editing
Line 7: Users can see where others are working
Line 8: This improves collaboration and reduces conflicts
Line 9: The system tracks cursor positions in real-time
Line 10: Each cursor has a unique color and user info`);

  const [remoteCursors, setRemoteCursors] = useState([
    {
      userId: 'user1',
      position: { line: 2, ch: 10 },
      userName: 'John Doe',
      userColor: '#3B82F6',
      lastUpdate: Date.now()
    },
    {
      userId: 'user2',
      position: { line: 5, ch: 15 },
      userName: 'Jane Smith',
      userColor: '#EF4444',
      lastUpdate: Date.now()
    }
  ]);

  const handleCursorMove = (position, selection) => {
    console.log('Cursor moved to:', position, 'selection:', selection);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Cursor Position Test</h1>
      <p className="mb-4 text-gray-600">Test cursor position calculation and remote cursor display</p>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Test Cursors:</h2>
        <div className="space-y-2">
          {remoteCursors.map((cursor, index) => (
            <div key={cursor.userId} className="flex items-center space-x-4">
              <span className="text-sm font-medium">{cursor.userName}:</span>
              <span className="text-sm text-gray-600">
                Line {cursor.position.line}, Char {cursor.position.ch}
              </span>
              <button
                onClick={() => {
                  const newCursors = [...remoteCursors];
                  newCursors[index].position = {
                    line: Math.floor(Math.random() * 10) + 1,
                    ch: Math.floor(Math.random() * 50)
                  };
                  setRemoteCursors(newCursors);
                }}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Move Randomly
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-gray-300 rounded-lg">
        <StreamingDocumentViewer
          content={content}
          isStreaming={false}
          onContentChange={setContent}
          className="prose max-w-none p-4 min-h-[400px]"
          editable={true}
          preserveCursor={true}
          showLineNumbers={true}
          activeUsers={[]}
          currentUserId="test-user"
          onCursorMove={handleCursorMove}
          connectionStatus="connected"
          remoteCursors={remoteCursors}
          onRemoteCursorUpdate={(userId, position, userName, userColor) => {
            console.log('Remote cursor update:', { userId, position, userName, userColor });
          }}
        />
      </div>
    </div>
  );
};

export default CursorTestPage; 