import React, { useEffect, useState, useMemo } from 'react';
import { User } from 'lucide-react';

const RemoteCursor = ({ 
  userId, 
  position, 
  userName, 
  userColor = '#3B82F6',
  isActive = true,
  documentRef = null // Reference to the document container
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // Hide cursor after 3 seconds of inactivity
  useEffect(() => {
    if (!isActive) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [isActive]);

  // Calculate accurate pixel position from character offset
  const pixelPosition = useMemo(() => {
    if (!documentRef || !position.ch) {
      return { left: 0, top: 0 };
    }

    try {
      // Get the document content element
      const contentElement = documentRef.current;
      if (!contentElement) {
        return { left: 0, top: 0 };
      }

      // Create a range to measure the exact position
      const range = document.createRange();
      const walker = document.createTreeWalker(
        contentElement,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let currentOffset = 0;
      let node;
      let targetNode = null;
      let targetOffset = 0;

      // Find the text node and offset for the character position
      while (node = walker.nextNode()) {
        const nodeLength = node.textContent.length;
        if (currentOffset + nodeLength >= position.ch) {
          targetNode = node;
          targetOffset = position.ch - currentOffset;
          break;
        }
        currentOffset += nodeLength;
      }

      if (targetNode) {
        // Set the range to the target position
        range.setStart(targetNode, targetOffset);
        range.setEnd(targetNode, targetOffset);

        // Get the bounding rectangle
        const rect = range.getBoundingClientRect();
        const containerRect = contentElement.getBoundingClientRect();

        return {
          left: rect.left - containerRect.left,
          top: rect.top - containerRect.top
        };
      }
    } catch (error) {
      console.warn('Error calculating cursor position:', error);
    }

    // Fallback to approximate positioning
    return { left: 0, top: 0 };
  }, [position.ch, documentRef]);

  if (!isVisible) return null;

  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-200"
      style={{
        left: `${pixelPosition.left}px`,
        top: `${pixelPosition.top}px`,
      }}
    >
      {/* Cursor line */}
      <div
        className="w-0.5 h-5 animate-pulse"
        style={{ backgroundColor: userColor }}
      />
      
      {/* User label */}
      <div
        className="absolute top-6 left-0 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap shadow-lg"
        style={{ backgroundColor: userColor }}
      >
        <div className="flex items-center space-x-1">
          <User className="w-3 h-3" />
          <span>{userName}</span>
        </div>
      </div>
    </div>
  );
};

export default RemoteCursor; 