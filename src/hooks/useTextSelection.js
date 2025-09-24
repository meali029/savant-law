import { useState, useCallback, useEffect } from 'react';

export const useTextSelection = (contentEditableRef) => {
  const [selectionToolbarPosition, setSelectionToolbarPosition] = useState(null);
  const [selectedText, setSelectedText] = useState('');

  const isSelectionInDocumentContent = useCallback((selection) => {
    if (!selection.rangeCount || !contentEditableRef.current) return false;
    
    const range = selection.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;
    
    return contentEditableRef.current.contains(
      commonAncestor.nodeType === Node.TEXT_NODE ? commonAncestor.parentNode : commonAncestor
    );
  }, [contentEditableRef]);

  const calculateToolbarPosition = useCallback((range) => {
    const rect = range.getBoundingClientRect();
    
    // Use viewport coordinates directly (don't add scrollY)
    const x = rect.left + rect.width / 2;
    const y = rect.top;
    
    // Check if toolbar would appear above viewport
    const toolbarHeight = 50;
    const finalY = y - toolbarHeight < 0 ? rect.bottom + 10 : y;
    
    return { x, y: finalY };
  }, []);

  const handleFormat = (command) => {
    const selection = window.getSelection();
    
    if (selection.rangeCount > 0 && !selection.isCollapsed && isSelectionInDocumentContent(selection)) {
      document.execCommand(command, false, null);
      
      setTimeout(() => {
        const updatedSelection = window.getSelection();
        if (updatedSelection.rangeCount > 0 && !updatedSelection.isCollapsed && 
            isSelectionInDocumentContent(updatedSelection)) {
          const range = updatedSelection.getRangeAt(0);
          const position = calculateToolbarPosition(range);
          setSelectionToolbarPosition(position);
        }
      }, 10);
    }
  };

  const handleComment = (text) => {
    console.log('Adding comment for text:', text);
  };

  const updateSelectionState = useCallback(() => {
    const selection = window.getSelection();
    
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      if (isSelectionInDocumentContent(selection)) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const text = selection.toString().trim();
        
        // Check if selection is visible in viewport
        if (text && rect.width > 0 && rect.height > 0) {
          setSelectedText(text);
          const position = calculateToolbarPosition(range);
          setSelectionToolbarPosition(position);
        } else {
          setSelectionToolbarPosition(null);
          setSelectedText('');
        }
      } else {
        setSelectionToolbarPosition(null);
        setSelectedText('');
      }
    } else {
      setSelectionToolbarPosition(null);
      setSelectedText('');
    }
  }, [isSelectionInDocumentContent, calculateToolbarPosition]);

  useEffect(() => {
    const handleSelectionChange = () => {
      updateSelectionState();
    };

    const handleMouseUp = () => {
      // Small delay to ensure selection is finalized
      setTimeout(updateSelectionState, 10);
    };

    const handleScroll = () => {
      // Hide toolbar on scroll to prevent positioning issues
      if (selectionToolbarPosition) {
        setSelectionToolbarPosition(null);
        setSelectedText('');
      }
    };

    const handleClickOutside = (e) => {
      // Don't hide if clicking on toolbar or related elements
      if (!e.target.closest('.selection-toolbar') && 
          !e.target.closest('.comment-modal') &&
          !e.target.closest('[contenteditable]')) {
        setTimeout(() => {
          const selection = window.getSelection();
          if (selection.isCollapsed || selection.toString().trim() === '' || 
              !isSelectionInDocumentContent(selection)) {
            setSelectionToolbarPosition(null);
            setSelectedText('');
          }
        }, 10);
      }
    };

    // Add event listeners
    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('click', handleClickOutside);
    
    // Add scroll listeners to main containers that might scroll
    window.addEventListener('scroll', handleScroll, true); // Use capture phase
    window.addEventListener('resize', handleScroll);

    return () => {
      // Cleanup
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isSelectionInDocumentContent, updateSelectionState, selectionToolbarPosition]);

  return {
    selectionToolbarPosition,
    selectedText,
    handleFormat,
    handleComment
  };
};