// Complete DocumentPage component with Region Header, Jurisdiction Support, and Fixed Text Replacement
"use client"
import Header from '../Header/Header';
import DocumentCreationModal from '../DocumentEditing/DocumentCreationModal';
import StreamingDocumentViewer from '../StreamingDocumentViewer';
import TextSelectionToolbar from '../DocumentPage/TextSelectionToolbar';
import DocumentToolbar from '../DocumentPage/DocumentToolbar';
import GenerationProgress from '../DocumentPage/GenerationProgress';
import LoadingSpinner from '../DocumentPage/LoadingSpinner';
import RightSidebar from '../DocumentPage/RightSidebar/RightSidebar';
import RegionHeader from '../DocumentPage/RegionHeader';
import { ToastContainer } from '../ui/Toast';
import { useTextSelection } from '../../hooks/useTextSelection';
import { useDocumentGeneration } from '../../hooks/useDocumentGeneration';
import { useTextChangeTracker } from '../../hooks/useTextChangeTracker';
import { useToast } from '../../hooks/useToast';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useLanguage } from '../../context/LanguageContext';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getToken, getUserId, getCurrentUser } from '../../services/authApi';
import { DocumentAPI } from '../../services/documentApi';
import DocumentScore from './DocumentScore';
import websocketService from '../../services/websocketApi';


const DocumentPage = () => {
  // Language hook
  const { t } = useLanguage();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userDocuments, setUserDocuments] = useState([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(true);
  const [selectedContext, setSelectedContext] = useState(null);
  const [selectedRiskContent, setSelectedRiskContent] = useState(null);
  const [textSuggestions, setTextSuggestions] = useState([]);
  const [documentScore, setDocumentScore] = useState(null);

  // Add these new state variables to your DocumentPage component:
const [riskCategories, setRiskCategories] = useState([]);
const [isLoadingRiskCategories, setIsLoadingRiskCategories] = useState(false);
const [selectedRiskCategory, setSelectedRiskCategory] = useState(null);

  // Add remote cursors state
  const [remoteCursors, setRemoteCursors] = useState(new Map());
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isUserEditing, setIsUserEditing] = useState(false);
  // Buffer for ordering cursor updates after inserts
  const pendingCursorByUserRef = useRef(new Map());
  const pendingCursorTimeoutsRef = useRef(new Map());
  const lastInsertAtRef = useRef(new Map());
  // Buffer for ordering text inserts per user
  const pendingInsertsByUserRef = useRef(new Map());
  const insertFlushTimeoutsRef = useRef(new Map());

  const [isRiskAnalysisStreaming, setIsRiskAnalysisStreaming] = useState(false);
const [riskAnalysisProgress, setRiskAnalysisProgress] = useState(0);
const [riskAnalysisStatus, setRiskAnalysisStatus] = useState('');

  // Region and jurisdiction state
  const [selectedRegion, setSelectedRegion] = useState('us-california');
  const [jurisdictionAnalysis, setJurisdictionAnalysis] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [lastSavedContent, setLastSavedContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const contentEditableRef = useRef(null);
  const router = useRouter();
  const searchParams = useSearchParams();
// First, add a ref to access the viewer methods
const documentViewerRef = useRef(null);

  // Toast hook
  const { toasts, removeToast, showSuccess, showError, showInfo } = useToast();

  // Custom hooks
  const {
    documentContent,
    documentTitle,
    isLoading,
    isGenerating,
    generationProgress,
    generationStatus,
    currentContractId,
    setDocumentTitle,
    setCurrentContractId,
    handleDocumentGenerated,
    handleNewDocument: baseHandleNewDocument,
    handleContentChange,
    loadExistingContract
  } = useDocumentGeneration();

  // Connect contentEditableRef to the StreamingDocumentViewer's element
  useEffect(() => {
    const connectRefs = () => {
      if (documentViewerRef.current && documentViewerRef.current.element) {
        contentEditableRef.current = documentViewerRef.current.element;
      }
    };
    
    // Try to connect immediately
    connectRefs();
    
    // Also try after a short delay to ensure the component is mounted
    const timeoutId = setTimeout(connectRefs, 100);
    
    return () => clearTimeout(timeoutId);
  }, [documentContent]); // Re-connect when document content changes

  // WebSocket hook for real-time collaboration
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
    onSyncResponse,
    getCurrentUser
  } = useWebSocket(currentContractId);

  const {
    selectionToolbarPosition,
    selectedText,
    handleFormat,
    handleComment
  } = useTextSelection(contentEditableRef);

  // Text change tracking hook
  const { isTracking, trackContentChange, pendingChanges, triggerAnalysis } = useTextChangeTracker(
      documentContent,
      currentContractId,
      (suggestions) => {
        console.log('Received text suggestions:', suggestions);
        setTextSuggestions(suggestions);

        if (suggestions.length > 0 && isRightSidebarCollapsed) {
          setIsRightSidebarCollapsed(false);
          setTimeout(() => {
            scrollToRightSidebar();
          }, 300);
        }
      }
  );


// 1. Update the onCursorMove handler to properly handle selections:
useEffect(() => {
  if (!documentViewerRef.current) return;

  // Handle cursor movement from other users
  onCursorMove((message) => {
    if (documentViewerRef.current && documentViewerRef.current.updateRemoteCursor) {
      // Find the user info from activeUsers
      const user = activeUsers.find(u => u.userId === message.userId);
      
      // Create cursor data with selection if present
      const cursorData = {
        userId: message.userId,
        position: message.position,
        userName: user?.fullName || user?.email || 'Anonymous',
        userColor: user?.color || '#3B82F6',
        selection: message.selection || null, // Include selection data
        lastUpdate: Date.now()
      };
      
      console.log('📨 Received cursor update:', {
        userId: message.userId,
        position: `L${message.position.line}:C${message.position.ch}`,
        hasSelection: !!message.selection,
        selection: message.selection ? {
          start: `L${message.selection.start.line}:C${message.selection.start.ch}`,
          end: `L${message.selection.end.line}:C${message.selection.end.ch}`
        } : null
      });
      
      // Defer the visual update slightly to allow text inserts (newlines) to apply first
      const apply = () => {
        setRemoteCursors(prev => {
          const updated = new Map(prev);
          updated.set(message.userId, cursorData);
          return updated;
        });
      };
      if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
        requestAnimationFrame(() => setTimeout(apply, 0));
      } else {
        setTimeout(apply, 0);
      }
    }
  });
}, [onCursorMove, activeUsers]);





// Handle local text insertion - send to other users
const handleLocalTextInsert = useCallback((text, position) => {
  console.log('📤 Sending text insert:', {
    text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    position: `Ch:${position.ch}`, // Character-only position
    textLength: text.length
  });
  
  // Send text insert through WebSocket (character-only)
  const characterPosition = { ch: position.ch };
  sendTextInsert(text, characterPosition);
}, [sendTextInsert]);

// Handle local text deletion - send to other users
const handleLocalTextDelete = useCallback((from, to) => {
  console.log('📤 Sending text delete:', {
    from: `Ch:${from.ch}`,
    to: `Ch:${to.ch}`
  });
  
  // Send text delete through WebSocket (character-only)
  const characterFrom = { ch: from.ch };
  const characterTo = { ch: to.ch };
  sendTextDelete(characterFrom, characterTo);
}, [sendTextDelete]);



// 3. Update the remote cursor update callback:
const updateRemoteCursor = useCallback((userId, position, userName, userColor, selection = null) => {
  if (userId === currentUserId || userId === getUserId()) return; // Don't show own cursor
  
  console.log('🔄 Updating remote cursor:', {
    userId,
    userName,
    position: `Ch:${position.ch}`, // Character-only position
    hasSelection: !!selection
  });
  
  setRemoteCursors(prev => {
    const updated = new Map(prev);
    updated.set(userId, {
      userId,
      position: { ch: position.ch }, // Ensure only character position is used
      userName,
      userColor,
      selection, // Include selection data
      lastUpdate: Date.now()
    });
    return updated;
  });
}, [currentUserId]);


  // Remove inactive cursors
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setRemoteCursors(prev => {
        const updated = new Map(prev);
        let hasChanges = false;
        
        updated.forEach((cursor, userId) => {
          // Remove cursors that haven't been updated in 5 seconds
          if (now - cursor.lastUpdate > 5000) {
            updated.delete(userId);
            hasChanges = true;
          }
        });
        
        return hasChanges ? updated : prev;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Set current user ID from auth API
  useEffect(() => {
    const initializeUser = async () => {
      try {
        // First try to get from cookies
        let userId = getUserId();
        
        if (!userId) {
          // If not in cookies, fetch from API
          const userData = await getCurrentUser();
          if (userData) {
            userId = userData.id;
          }
        }
        
        if (userId) {
          console.log('👤 Current user ID set:', userId);
          setCurrentUserId(userId);
        }
      } catch (error) {
        console.error('Error getting current user ID:', error);
      }
    };
    
    initializeUser();
  }, []);



  // Shared position calculation functions (matching StreamingDocumentViewer logic)
const getPositionFromOffset = useCallback((offset, text) => {
  if (!text) return null
  
  const textUpToOffset = text.substring(0, offset)
  const lines = textUpToOffset.split('\n')
  
  return {
    line: lines.length - 1,
    ch: lines[lines.length - 1].length
  }
}, [])

const getOffsetFromPosition = useCallback((position, text) => {
  if (!text) return -1
  
  const lines = text.split('\n')
  
  console.log('🔍 getOffsetFromPosition called with:', {
    position,
    textLength: text.length,
    linesCount: lines.length,
    textSample: text.substring(0, 100) + (text.length > 100 ? '...' : '')
  });
  
  let offset = 0
  for (let i = 0; i < position.line && i < lines.length; i++) {
    offset += lines[i].length + 1 // +1 for newline
  }
  offset += Math.min(position.ch, lines[position.line]?.length || 0)
  
  console.log('🔍 getOffsetFromPosition result:', {
    position,
    calculatedOffset: offset,
    linesProcessed: Math.min(position.line, lines.length),
    finalLineLength: lines[position.line]?.length || 0
  });
  
  return offset
}, [])

// Helper function to apply text changes using character-only position system
const applyRemoteTextChange = useCallback((element, change, isInsertion = true) => {
  if (!element) return false;

  // Save current selection/cursor position
  const selection = window.getSelection();
  let savedRange = null;
  
  if (selection.rangeCount > 0) {
    savedRange = selection.getRangeAt(0).cloneRange();
  }

  console.log('🔍 applyRemoteTextChange debugging:', {
    isInsertion,
    changePosition: isInsertion ? change.position : undefined,
    changeFrom: !isInsertion ? change.from : undefined,
    changeTo: !isInsertion ? change.to : undefined,
    elementInnerHTML: element.innerHTML.substring(0, 200) + (element.innerHTML.length > 200 ? '...' : '')
  });

  if (isInsertion) {
    // Handle text insertion using character-only position
    const position = change.position;
    
    console.log('🔍 Character-based insertion:', {
      requestedPosition: position,
      textToInsert: change.text
    });
    
    // Use character offset directly (no conversion needed)
    const characterOffset = position.ch || 0;
    
      console.log('🔍 Using character offset directly:', {
      characterOffset: characterOffset,
      textToInsert: change.text,
      elementTextLength: (element.innerText || element.textContent || '').length
    });
    
    // Find the DOM position for this character offset
  console.log('🔍 Looking for DOM position for character offset:', characterOffset);
  console.log('🔍 Element text content length:', (element.innerText || element.textContent || '').length);
    
    const domPosition = getDOMPositionFromOffset(characterOffset, element);
    
    if (!domPosition) {
      // Special case: Document is empty or no text nodes found
      console.log('⚠️ No DOM position found, document might be empty');
      
      // Check if the document is empty
      const hasTextContent = element.innerText || element.textContent || '';
      if (!hasTextContent.trim()) {
        console.log('📝 Document is empty, inserting first text');
        
        // Special handling for <br> tags in empty document
        if (change.text === '<br>') {
          const brElement = document.createElement('br');
          element.appendChild(brElement);
          
          console.log('✅ <br> tag inserted in empty document');
        } else {
          // Create a new text node and append it to the element
          const textNode = document.createTextNode(change.text);
          element.appendChild(textNode);
          
          console.log('✅ Text inserted in empty document:', {
            text: change.text,
            elementInnerHTML: element.innerHTML.substring(0, 100) + (element.innerHTML.length > 100 ? '...' : '')
          });
        }
        
        return true;
      } else {
        console.error('❌ Could not find DOM position for character offset:', characterOffset);
        console.error('❌ Document text content:', hasTextContent.substring(0, 200) + '...');
        return false;
      }
    }
    
  // Insert text at the DOM position
    const { node, offset } = domPosition;
    
    console.log('🔍 DOM position found:', {
      node: node.textContent.substring(0, 50) + (node.textContent.length > 50 ? '...' : ''),
      offset: offset,
      nodeLength: node.textContent.length
    });
    
    // Check if the target text node is between <br> tags
    const parent = node.parentNode;
    const nextSibling = node.nextSibling;
    const prevSibling = node.previousSibling;
    
    // If the text node is between <br> tags, we need to find a better insertion point
    if (nextSibling && nextSibling.nodeName === 'BR' && prevSibling && prevSibling.nodeName === 'BR') {
      console.log('🔍 Text node is between <br> tags, finding better insertion point...');
      
      // Look for a text node that's not between <br> tags
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let betterNode = null;
      let betterOffset = 0;
      let currentOffset = 0;
      
      while (betterNode = walker.nextNode()) {
        const nodeLength = betterNode.textContent.length;
        
        // Check if this text node is not between <br> tags
        const nodeParent = betterNode.parentNode;
        const nodeNextSibling = betterNode.nextSibling;
        const nodePrevSibling = betterNode.previousSibling;
        
        if (!(nodeNextSibling && nodeNextSibling.nodeName === 'BR' && nodePrevSibling && nodePrevSibling.nodeName === 'BR')) {
          // This is a better text node - not between <br> tags
          if (currentOffset + nodeLength >= characterOffset) {
            betterOffset = characterOffset - currentOffset;
            break;
          }
        }
        
        currentOffset += nodeLength;
      }
      
      if (betterNode && betterNode !== node) {
        console.log('✅ Found better insertion point:', {
          originalNode: node.textContent.substring(0, 20),
          betterNode: betterNode.textContent.substring(0, 20),
          betterOffset: betterOffset
        });
        
        // Use the better node for insertion
        const beforeText = betterNode.textContent.substring(0, betterOffset);
        const afterText = betterNode.textContent.substring(betterOffset);
        betterNode.textContent = beforeText + change.text + afterText;
        
        console.log('✅ Text inserted at better position:', {
          text: change.text,
          textCharCode: change.text.charCodeAt(0),
          position: position,
          characterOffset: characterOffset,
          nodeTextAfter: betterNode.textContent.substring(0, 100) + (betterNode.textContent.length > 100 ? '...' : ''),
          nodeTextAfterLength: betterNode.textContent.length
        });
        
        return true;
      }
    }
    
    console.log('🔍 About to insert text:', {
      text: change.text,
      textCharCode: change.text.charCodeAt(0),
      atOffset: offset,
      nodeTextBefore: node.textContent.substring(0, offset),
      nodeTextAfter: node.textContent.substring(offset)
    });
    
    // Special handling for newlines: support both "\n" and explicit <br>
    if (change.text && (change.text.includes('\n') || change.text === '<br>')) {
      // If it's exactly one <br>, keep the existing path
      if (change.text === '<br>') {
        console.log('↵ Inserting <br> tag at character position:', position);
        const brElement = document.createElement('br');
        const beforeText = node.textContent.substring(0, offset);
        const afterText = node.textContent.substring(offset);
        const beforeNode = document.createTextNode(beforeText);
        const afterNode = document.createTextNode(afterText);
        const parent = node.parentNode;
        parent.insertBefore(beforeNode, node);
        parent.insertBefore(brElement, node);
        parent.insertBefore(afterNode, node);
        parent.removeChild(node);
        console.log('✅ <br> tag inserted successfully');
      } else {
        console.log('↵ Inserting newline(s) as <br> at character position:', position, 'text:', JSON.stringify(change.text));
        const parts = change.text.split(/\r?\n/);
        const beforeText = node.textContent.substring(0, offset);
        const afterTextOriginal = node.textContent.substring(offset);
        // Replace current node content up to insertion point with first part
        node.textContent = beforeText + (parts[0] || '');
        let currentTextNode = node;
        // For each subsequent part, insert a <br> and a new text node
        for (let i = 1; i < parts.length; i++) {
          const br = document.createElement('br');
          currentTextNode.parentNode.insertBefore(br, currentTextNode.nextSibling);
          const newText = document.createTextNode(parts[i] || '');
          currentTextNode.parentNode.insertBefore(newText, br.nextSibling);
          currentTextNode = newText;
        }
        // Append the original tail after the last inserted piece
        currentTextNode.textContent = currentTextNode.textContent + afterTextOriginal;
        console.log('✅ Newline(s) inserted as <br> elements');
      }
    } else if (change.text === '<br>') {
      console.log('↵ Inserting <br> tag at character position:', position);
      
      // Create a <br> element
      const brElement = document.createElement('br');
      
      // Split the text node at the insertion point
      const beforeText = node.textContent.substring(0, offset);
      const afterText = node.textContent.substring(offset);
      
      // Create new text nodes
      const beforeNode = document.createTextNode(beforeText);
      const afterNode = document.createTextNode(afterText);
      
      // Replace the original node with the new structure
      const parent = node.parentNode;
      parent.insertBefore(beforeNode, node);
      parent.insertBefore(brElement, node);
      parent.insertBefore(afterNode, node);
      parent.removeChild(node);
      
      console.log('✅ <br> tag inserted successfully');
    } else {
      // Regular text insertion
      const beforeText = node.textContent.substring(0, offset);
      const afterText = node.textContent.substring(offset);
      
      console.log('🔍 Text insertion details:', {
        beforeText: beforeText.substring(Math.max(0, beforeText.length - 10), beforeText.length),
        afterText: afterText.substring(0, Math.min(10, afterText.length)),
        insertingText: change.text,
        insertingTextCharCode: change.text.charCodeAt(0),
        nodeTextBefore: node.textContent.substring(0, 50) + (node.textContent.length > 50 ? '...' : '')
      });
      
      // Update the text node normally. If the insertion point is adjacent to a <br>,
      // ensure we don't accidentally create a visual double space by normalizing
      // the boundary only when both sides are spaces.
      const merged = beforeText + change.text + afterText;
      if (change.text === ' ' && /\s$/.test(beforeText) && /^\s/.test(afterText)) {
        node.textContent = beforeText + ' ' + afterText.replace(/^\s+/, '');
      } else {
        node.textContent = merged;
      }
      
      console.log('✅ Text inserted at character position:', {
        text: change.text,
        textCharCode: change.text.charCodeAt(0),
        position: position,
        characterOffset: characterOffset,
        nodeTextAfter: node.textContent.substring(0, 100) + (node.textContent.length > 100 ? '...' : ''),
        nodeTextAfterLength: node.textContent.length
      });
      
      console.log('🔍 Element content after insertion:', {
        innerHTML: element.innerHTML.substring(0, 200) + (element.innerHTML.length > 200 ? '...' : ''),
        innerText: element.innerText.substring(0, 100) + (element.innerText.length > 100 ? '...' : ''),
        textContent: element.textContent.substring(0, 100) + (element.textContent.length > 100 ? '...' : '')
      });
      
      // Debug the DOM structure around the inserted text
      console.log('🔍 DOM structure around inserted text:', {
        nodeParent: node.parentNode.tagName,
        nodeParentInnerHTML: node.parentNode.innerHTML.substring(0, 100) + (node.parentNode.innerHTML.length > 100 ? '...' : ''),
        nodeNextSibling: node.nextSibling ? node.nextSibling.nodeName : 'null',
        nodePreviousSibling: node.previousSibling ? node.previousSibling.nodeName : 'null'
      });
      
      // Check if there are <br> tags being created
      const hasBrTags = element.innerHTML.includes('<br>');
      console.log('🔍 HTML structure check:', {
        hasBrTags: hasBrTags,
        brCount: (element.innerHTML.match(/<br>/g) || []).length,
        htmlSample: element.innerHTML.substring(0, 300) + (element.innerHTML.length > 300 ? '...' : '')
      });
    }
    
  } else {
    // Handle text deletion using character-only position
    const fromPosition = change.from;
    const toPosition = change.to;
    
    console.log('🔍 Character-based deletion:', {
      requestedFrom: fromPosition,
      requestedTo: toPosition
    });
    
    // Use character offsets directly (no conversion needed)
    const fromOffset = fromPosition.ch || 0;
    const toOffset = toPosition.ch || 0;
    
    console.log('🔍 Using character offsets directly:', {
      from: fromPosition,
      to: toPosition,
      fromOffset: fromOffset,
      toOffset: toOffset
    });
    
    // Special case: Delete entire document (from 0 to end)
    if (fromOffset === 0 && toOffset > 0) {
      const fullText = element.innerText || element.textContent || '';
      if (toOffset >= fullText.length) {
        console.log('🗑️ Deleting entire document content');
        element.innerHTML = '';
        
        console.log('✅ Entire document deleted');
        return true;
      }
    }
    
    // Find the DOM positions for these character offsets
    const fromDomPosition = getDOMPositionFromOffset(fromOffset, element);
    const toDomPosition = getDOMPositionFromOffset(toOffset, element);
    
    if (!fromDomPosition) {
      console.error('❌ Could not find from DOM position for deletion:', change);
      return false;
    }
    
    // Handle the case where toDomPosition is null (deletion to end of document)
    if (!toDomPosition) {
      console.log('⚠️ toDomPosition is null, treating as deletion to end of document');
      
      // Delete from the fromDomPosition to the end of the document
      const node = fromDomPosition.node;
      const fromNodeOffset = fromDomPosition.offset;
      
      const beforeText = node.textContent.substring(0, fromNodeOffset);
      node.textContent = beforeText;
      
      // Also clear any remaining text nodes after this one
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let currentNode = node;
      let foundCurrentNode = false;
      
      while (currentNode = walker.nextNode()) {
        if (currentNode === node) {
          foundCurrentNode = true;
          continue;
        }
        
        if (foundCurrentNode) {
          // Clear this text node
          currentNode.textContent = '';
        }
      }
      
      console.log('✅ Text deleted to end of document:', {
        from: change.from,
        to: change.to,
        nodeTextAfter: node.textContent.substring(0, 100) + (node.textContent.length > 100 ? '...' : '')
      });
      
    } else {
      // Handle deletion within the same text node
      if (fromDomPosition.node === toDomPosition.node) {
        const node = fromDomPosition.node;
        const fromNodeOffset = fromDomPosition.offset;
        const toNodeOffset = toDomPosition.offset;
        
        const beforeText = node.textContent.substring(0, fromNodeOffset);
        const afterText = node.textContent.substring(toNodeOffset);
        
        node.textContent = beforeText + afterText;
        
        console.log('✅ Text deleted from same node:', {
          from: change.from,
          to: change.to,
          deletedLength: toNodeOffset - fromNodeOffset,
          deletedText: node.textContent.substring(fromNodeOffset, toNodeOffset)
        });
        
      } else {
        // Handle deletion across multiple text nodes
        console.log('⚠️ Cross-node deletion - implementing fallback');
        
        // Delete from the first node
        const firstNode = fromDomPosition.node;
        const fromNodeOffset = fromDomPosition.offset;
        
        const beforeText = firstNode.textContent.substring(0, fromNodeOffset);
        firstNode.textContent = beforeText;
        
        // Clear all text nodes between fromDomPosition and toDomPosition
        const walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        let currentNode;
        let inDeletionRange = false;
        
        while (currentNode = walker.nextNode()) {
          if (currentNode === fromDomPosition.node) {
            inDeletionRange = true;
            continue;
          }
          
          if (currentNode === toDomPosition.node) {
            // Clear the end node from the toOffset
            const toNodeOffset = toDomPosition.offset;
            const afterText = currentNode.textContent.substring(toNodeOffset);
            currentNode.textContent = afterText;
            break;
          }
          
          if (inDeletionRange) {
            // Clear this text node
            currentNode.textContent = '';
          }
        }
        
        console.log('✅ Text deleted across multiple nodes:', {
          from: change.from,
          to: change.to,
          firstNodeTextAfter: firstNode.textContent.substring(0, 100) + (firstNode.textContent.length > 100 ? '...' : '')
        });
      }
    }
  }

  // Restore cursor position
  if (savedRange) {
    try {
      selection.removeAllRanges();
      selection.addRange(savedRange);
    } catch (error) {
      console.warn('Could not restore cursor position:', error);
    }
  }

  return true;
}, []);

// Helper function to get DOM position from character offset
const getDOMPositionFromOffset = useCallback((offset, element) => {
  if (!element) return null;

  // Walk the DOM and map character offsets to positions, counting <br> as a single "\n"
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    null,
    false
  );

  let currentOffset = 0;
  let node;
  let lastTextNode = null;

  const findNextTextNode = (fromNode) => {
    const tw = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    let n;
    let after = false;
    while ((n = tw.nextNode())) {
      if (!after) {
        // Once we pass the fromNode in document order, mark as after
        if (fromNode.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING) {
          after = true;
          // Ensure it's actually following (not preceding)
          if (!(n.compareDocumentPosition(fromNode) & Node.DOCUMENT_POSITION_FOLLOWING)) {
            // n is the first text node after fromNode
            return n;
          }
        }
      } else {
        return n;
      }
    }
    return null;
  };

  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) {
      const len = node.textContent.length;
      if (currentOffset + len >= offset) {
        return { node, offset: offset - currentOffset };
      }
      currentOffset += len;
      lastTextNode = node;
      continue;
    }

    if (node.nodeType === Node.ELEMENT_NODE && node.nodeName === 'BR') {
      // Newline represented in innerText
      if (offset <= currentOffset) {
        // Position falls at this newline; place caret after the <br>
        let nextText = findNextTextNode(node);
        if (!nextText) {
          // Create an empty text node after <br> so we can insert after newline
          const empty = document.createTextNode('');
          if (node.parentNode) {
            node.parentNode.insertBefore(empty, node.nextSibling);
            nextText = empty;
          }
        }
        if (nextText) {
          return { node: nextText, offset: 0 };
        }
      }
      // Consume the newline character represented by <br>
      currentOffset += 1;
      continue;
    }
  }

  // If we get here, map to end of the last text node or create one at end
  if (lastTextNode) {
    return { node: lastTextNode, offset: lastTextNode.textContent.length };
  }

  // No text nodes at all; ensure there's a text node to insert into
  const empty = document.createTextNode('');
  element.appendChild(empty);
  return { node: empty, offset: 0 };
}, []);

// Flush buffered inserts for a user in timestamp order and then flush their pending cursor
const flushPendingInserts = useCallback((userId) => {
  const list = pendingInsertsByUserRef.current.get(userId);
  if (!list || list.length === 0) return;

  // Sort by timestamp to respect original authoring order
  list.sort((a, b) => ((a.timestamp || 0) - (b.timestamp || 0)));

  if (documentViewerRef.current && documentViewerRef.current.element) {
    const element = documentViewerRef.current.element;
    let lastPositionCh = null;
    let lastTextLen = 0;
    for (const msg of list) {
      const applied = applyRemoteTextChange(element, {
        text: msg.text,
        position: msg.position
      }, true);
      if (applied) {
        const updatedContent = element.innerHTML;
        if (documentViewerRef.current.updateRemoteContent) {
          documentViewerRef.current.updateRemoteContent(updatedContent);
        } else {
          // Fallback: update state
          setIsUserEditing(true);
          handleContentChange(updatedContent);
          setTimeout(() => setIsUserEditing(false), 100);
        }
        // Track last message to derive cursor position
        lastPositionCh = (msg.position?.ch || 0);
        lastTextLen = (msg.text || '').replace(/\r\n?/g, '\n').length;
      }
    }
  }

  // Clear the list
  pendingInsertsByUserRef.current.set(userId, []);

  // After inserts, flush any pending cursor immediately
  const pendingCursor = pendingCursorByUserRef.current.get(userId);
  if (pendingCursor) {
    setRemoteCursors(prev => {
      const updated = new Map(prev);
      updated.set(userId, pendingCursor);
      return updated;
    });
    pendingCursorByUserRef.current.delete(userId);
    const t = pendingCursorTimeoutsRef.current.get(userId);
    if (t) {
      clearTimeout(t);
      pendingCursorTimeoutsRef.current.delete(userId);
    }
  }

  // If we applied inserts and have a last position, derive a fresh cursor location now
  if (lastPositionCh !== null) {
    const user = activeUsers.find(u => u.userId === userId);
    const derivedCursor = {
      userId,
      position: { ch: lastPositionCh + lastTextLen },
      userName: user?.fullName || user?.email || 'Anonymous',
      userColor: user?.color || '#3B82F6',
      selection: null,
      lastUpdate: Date.now()
    };
    if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
      requestAnimationFrame(() => {
        setRemoteCursors(prev => {
          const updated = new Map(prev);
          updated.set(userId, derivedCursor);
          return updated;
        });
      });
    } else {
      setRemoteCursors(prev => {
        const updated = new Map(prev);
        updated.set(userId, derivedCursor);
        return updated;
      });
    }
  }

  // Force a reflow of remote cursor overlays even if position hasn't changed
  if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
    requestAnimationFrame(() => {
      setRemoteCursors(prev => new Map(prev));
    });
  } else {
    setTimeout(() => setRemoteCursors(prev => new Map(prev)), 0);
  }
}, [applyRemoteTextChange, handleContentChange]);


// Update the WebSocket event handlers:
useEffect(() => {
  // Handle cursor movement from other users (keep existing code)
  onCursorMove((message) => {
    // Skip if it's from the current user
    if (message.userId === currentUserId || message.userId === getUserId()) {
      console.log('🚫 Skipping own cursor update - userId:', message.userId, 'currentUserId:', currentUserId);
      return;
    }

    if (documentViewerRef.current && documentViewerRef.current.updateRemoteCursor) {
      const user = activeUsers.find(u => u.userId === message.userId);
      
      const cursorData = {
        userId: message.userId,
        position: message.position,
        userName: user?.fullName || user?.email || 'Anonymous',
        userColor: user?.color || '#3B82F6',
        selection: message.selection || null,
        lastUpdate: Date.now()
      };
      
      console.log('📨 Received cursor update from other user:', {
        userId: message.userId,
        position: `Ch:${message.position.ch}`,
        hasSelection: !!message.selection
      });
      
      // Buffer the cursor update per user to coalesce and order after inserts
      pendingCursorByUserRef.current.set(message.userId, cursorData);
      const existing = pendingCursorTimeoutsRef.current.get(message.userId);
      if (existing) {
        clearTimeout(existing);
      }
      const timeoutId = setTimeout(() => {
        const data = pendingCursorByUserRef.current.get(message.userId);
        if (!data) return;
        setRemoteCursors(prev => {
          const updated = new Map(prev);
          updated.set(message.userId, data);
          return updated;
        });
        pendingCursorByUserRef.current.delete(message.userId);
        pendingCursorTimeoutsRef.current.delete(message.userId);
      }, 50);
      pendingCursorTimeoutsRef.current.set(message.userId, timeoutId);
    }
  });

  // Handle text insertion from other users (buffered/coalesced)
  onTextInsert((message) => {
    // Skip if it's from the current user (echo prevention)
    if (message.userId === currentUserId || message.userId === getUserId()) {
      console.log('🚫 Skipping own text insertion - userId:', message.userId, 'currentUserId:', currentUserId);
      return;
    }

    console.log('📥 Queueing remote text insert:', {
      userId: message.userId,
      text: message.text,
      position: message.position,
      timestamp: message.timestamp,
      textLength: message.text.length
    });

    const list = pendingInsertsByUserRef.current.get(message.userId) || [];
    list.push(message);
    pendingInsertsByUserRef.current.set(message.userId, list);

    const existing = insertFlushTimeoutsRef.current.get(message.userId);
    if (existing) clearTimeout(existing);
    // Coalesce quickly so newline applies before the next character
    const timeoutId = setTimeout(() => {
      insertFlushTimeoutsRef.current.delete(message.userId);
      flushPendingInserts(message.userId);
    }, 50);
    insertFlushTimeoutsRef.current.set(message.userId, timeoutId);
  });

  // Handle text deletion from other users
  onTextDelete((message) => {
    // Skip if it's from the current user (echo prevention)
    if (message.userId === currentUserId || message.userId === getUserId()) {
      console.log('🚫 Skipping own text deletion - userId:', message.userId, 'currentUserId:', currentUserId);
      return;
    }

    console.log('📥 Text deleted by other user:', {
      userId: message.userId,
      from: message.from,
      to: message.to
    });
    
    // Apply the text deletion to the document
    if (documentViewerRef.current && documentViewerRef.current.element) {
      const element = documentViewerRef.current.element;
      
      // Apply the change while preserving formatting
      const applied = applyRemoteTextChange(element, {
        from: message.from,
        to: message.to
      }, false);
      
      if (applied) {
        // Update state without triggering local change detection
        const updatedContent = element.innerHTML;
        
        // Use the updateRemoteContent method to properly handle remote changes
        console.log('🔍 Checking for updateRemoteContent method (text delete):', {
          hasUpdateRemoteContent: !!documentViewerRef.current.updateRemoteContent,
          documentViewerRef: !!documentViewerRef.current
        });
        
        if (documentViewerRef.current.updateRemoteContent) {
          console.log('✅ Using updateRemoteContent method for text delete');
          documentViewerRef.current.updateRemoteContent(updatedContent);
        } else {
          console.log('⚠️ Using fallback handleContentChange method for text delete');
          // Fallback: Temporarily disable change tracking to prevent echo
          setIsUserEditing(true);
          handleContentChange(updatedContent);
          
          // Re-enable after a short delay
          setTimeout(() => {
            setIsUserEditing(false);
          }, 100);
        }
        
        // Force a remote cursor overlay reflow after deletion
        if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
          requestAnimationFrame(() => {
            setRemoteCursors(prev => new Map(prev));
          });
        } else {
          setTimeout(() => setRemoteCursors(prev => new Map(prev)), 0);
        }
        
        // Show notification
        const user = activeUsers.find(u => u.userId === message.userId);
        const userName = user?.fullName || user?.email || 'User';
        const lines = message.to.line - message.from.line;
        if (lines > 0) {
          showInfo(`${userName} deleted ${lines + 1} line${lines > 0 ? 's' : ''}`);
        } else {
          const chars = message.to.ch - message.from.ch;
          showInfo(`${userName} deleted ${chars} character${chars > 1 ? 's' : ''}`);
        }
      }
    }
  });

  // Handle sync response
  onSyncResponse((message) => {
    console.log('Received sync response with', message.edits?.length || 0, 'edits');
  });
}, [onCursorMove, onTextInsert, onTextDelete, onSyncResponse, activeUsers, currentUserId, handleContentChange, showInfo, updateRemoteCursor, applyRemoteTextChange]);


  // Handle WebSocket errors
  useEffect(() => {
    if (websocketError) {
      showError(`WebSocket Error: ${websocketError}`);
    }
  }, [websocketError, showError]);

  // 2. Update the handleLocalCursorMove to log selection data:
  const handleLocalCursorMove = useCallback((position, selection) => {
    console.log('📤 Sending local cursor position:', {
      position: `Ch:${position.ch}`, // Character-only position
      hasSelection: !!selection,
      selection: selection ? {
        start: `Ch:${selection.start.ch}`,
        end: `Ch:${selection.end.ch}`
      } : null
    });
    
    // Send cursor position through WebSocket (character-only)
    const characterPosition = { ch: position.ch };
    if (selection) {
      const characterSelection = {
        start: { ch: selection.start.ch },
        end: { ch: selection.end.ch }
      };
      sendCursorMove(characterPosition, characterSelection);
    } else {
      sendCursorMove(characterPosition);
    }
  }, [sendCursorMove]);
  

  // Add this handler function
const handleScoreUpdate = useCallback((newScore) => {
  setDocumentScore(newScore);
  console.log('Document score updated:', newScore);
}, []);

  // Manual retry analysis function
  const handleRetryAnalysis = useCallback(() => {
    console.log('Manual retry analysis triggered');
    triggerAnalysis();
  }, [triggerAnalysis]);

  // Handle region change and trigger jurisdiction analysis
  const handleRegionChange = useCallback(async (regionId) => {
    console.log('Region changed to:', regionId);
    
    const previousRegion = selectedRegion;
    setSelectedRegion(regionId);
    
    // Only trigger jurisdiction analysis if we have document content and the region actually changed
    if (documentContent && regionId !== previousRegion && currentContractId) {
      console.log('Triggering jurisdiction analysis for region:', regionId);
      
      // Show success message
      showInfo(`Analyzing document for ${DocumentAPI.getRegionNameForAPI(regionId)} jurisdiction...`);
      
      // Prepare jurisdiction analysis data
      const jurisdictionData = {
        regionName: DocumentAPI.getRegionNameForAPI(regionId),
        regionId: regionId,
        documentContent: documentContent,
        contractId: currentContractId
      };
      
      setJurisdictionAnalysis(jurisdictionData);
      
      // Open right sidebar and switch to suggestions view
      setIsRightSidebarCollapsed(false);
      
      // Scroll to sidebar after a brief delay
      setTimeout(() => {
        scrollToRightSidebar();
      }, 300);
    } else if (!documentContent) {
      console.log('No document content available for jurisdiction analysis');
      showInfo('Generate or load a document first to analyze jurisdiction changes.');
    } else if (!currentContractId) {
      console.log('No contract ID available for jurisdiction analysis');
      showInfo('Document must be saved before analyzing jurisdiction changes.');
    }
  }, [selectedRegion, documentContent, currentContractId, showInfo]);

  // Clear jurisdiction analysis
  const handleClearJurisdictionAnalysis = useCallback(() => {
    setJurisdictionAnalysis(null);
  }, []);

  // AUTH GUARD
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/sign-in');
    }
  }, [router]);

  // Check URL for contract_id and handle document loading
  useEffect(() => {
    const urlContractId = searchParams.get('contract_id');
    const isReady = searchParams.get('ready') === 'true';
    
    console.log('URL contract_id:', urlContractId);
    console.log('URL ready parameter:', isReady);
    console.log('Current contract_id:', currentContractId);
    
    if (urlContractId && urlContractId !== currentContractId) {
      console.log('Setting new contract ID:', urlContractId);
      setCurrentContractId(urlContractId);
      
      if (isReady) {
        // Document is ready - load existing content directly
        console.log('🔄 Loading existing document content:', urlContractId);
        loadExistingContract(urlContractId);
      } else {
        // Document needs generation - start the generation process
        console.log('🚀 Starting document generation:', urlContractId);
        handleDocumentGenerated(urlContractId);
      }
    }
  }, [searchParams, currentContractId, setCurrentContractId, handleDocumentGenerated, loadExistingContract]);

  // Load user documents on mount
  useEffect(() => {
    loadUserDocuments();
  }, []);

  // Track unsaved changes
  useEffect(() => {
    if (documentContent && lastSavedContent !== documentContent) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [documentContent, lastSavedContent]);

  // Set initial saved content when document loads
  useEffect(() => {
    if (documentContent && !lastSavedContent && !isGenerating) {
      setLastSavedContent(documentContent);
      setHasUnsavedChanges(false);
    }
  }, [documentContent, lastSavedContent, isGenerating]);

  const loadUserDocuments = async () => {
    setIsLoadingDocuments(true);
    try {
      // You can implement actual API call here if needed
      const documents = [];
      setUserDocuments(documents);
    } catch (error) {
      console.error('Error loading user documents:', error);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const handleNewDocument = () => {
    baseHandleNewDocument();
    setIsModalOpen(true);
    setTextSuggestions([]);
    setJurisdictionAnalysis(null); // Clear jurisdiction analysis
    // Reset save-related states
    setLastSavedContent('');
    setHasUnsavedChanges(false);
    setSaveError(null);
  };

  const handleDocumentSelect = (doc) => {
    setCurrentContractId(doc.id);
    const url = new URL(window.location);
    url.searchParams.set('contract_id', doc.id);
    window.history.pushState({}, '', url.toString());
    setDocumentTitle(doc.name);
    setTextSuggestions([]);
    setJurisdictionAnalysis(null); // Clear jurisdiction analysis
    // Reset save-related states
    setLastSavedContent('');
    setHasUnsavedChanges(false);
    setSaveError(null);
    console.log('Loading document:', doc);
  };

  // Enhanced save document function with toast
  const saveDocument = async () => {
    if (!currentContractId || !documentContent) {
      console.warn('Cannot save: missing contract ID or content');
      showError('No document to save!');
      return;
    }

    if (!hasUnsavedChanges) {
      console.log('No unsaved changes detected');
      showInfo('No changes to save.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      console.log('💾 Saving document:', currentContractId);
      
      // Format the content before saving to ensure consistency
      const contentToSave = DocumentAPI.formatDocumentContent(documentContent);
      console.log('Formatted content for saving, length:', contentToSave.length);
      
      const response = await DocumentAPI.saveContractPages(currentContractId, contentToSave);
      
      if (response.success) {
        console.log('✅ Document saved successfully');
        setLastSavedContent(documentContent);
        setHasUnsavedChanges(false);
        showSuccess('Document saved successfully!');
      } else {
        throw new Error('Save operation returned unsuccessful status');
      }
    } catch (error) {
      console.error('❌ Error saving document:', error);
      setSaveError(error.message);
      showError(`Failed to save document: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const downloadDocument = () => {
    if (!documentContent) {
      alert('No content to download!');
      return;
    }

    const blob = new Blob([documentContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentTitle.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareDocument = () => {
    if (!documentContent) {
      alert(t.documentPage.noContentToShare);
      return;
    }

    if (navigator.share) {
      navigator.share({
        title: documentTitle,
        text: t.documentPage.generatedDocument,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert(t.documentPage.documentLinkCopied);
    }
  };

  // Enhanced content change handler that includes tracking
  const handleEnhancedContentChange = useCallback((newContent) => {
    console.log('🔄 handleEnhancedContentChange called with content length:', newContent.length);
    console.log('📄 New content sample:', newContent.substring(0, 200) + '...');
    handleContentChange(newContent);
    trackContentChange(newContent);
    console.log('✅ handleEnhancedContentChange completed');
  }, [handleContentChange, trackContentChange]);

  // NEW: Utility function to format content on demand
  const formatContentOnDemand = useCallback((content) => {
    if (!content) return '';
    return DocumentAPI.formatDocumentContent(content);
  }, []);

  // NEW: Utility function to extract clean text for comparison
  const extractCleanTextForComparison = useCallback((content) => {
    if (!content) return '';
    return DocumentAPI.extractCleanText(content);
  }, []);

  // NEW: Utility function to normalize content for comparison
  const normalizeContentForComparison = useCallback((content) => {
    if (!content) return '';
    return DocumentAPI.normalizeContentForComparison(content);
  }, []);

  // NEW: Test function to demonstrate formatting improvements
  const testDocumentFormatting = useCallback(() => {
    if (!documentContent) {
      console.log('No document content to test');
      return;
    }

    console.log('🧪 Testing document formatting...');
    
    // Test the original content
    console.log('Original content length:', documentContent.length);
    console.log('Original content sample:', documentContent.substring(0, 200));
    
    // Test the formatting function
    const formattedContent = DocumentAPI.formatDocumentContent(documentContent);
    console.log('Formatted content length:', formattedContent.length);
    console.log('Formatted content sample:', formattedContent.substring(0, 200));
    
    // Test text extraction
    const cleanText = DocumentAPI.extractCleanText(documentContent);
    console.log('Clean text length:', cleanText.length);
    console.log('Clean text sample:', cleanText.substring(0, 200));
    
    // Test normalization
    const normalizedText = DocumentAPI.normalizeContentForComparison(documentContent);
    console.log('Normalized text length:', normalizedText.length);
    console.log('Normalized text sample:', normalizedText.substring(0, 200));
    
    console.log('✅ Document formatting test completed');
  }, [documentContent]);

  // NEW: Test function specifically for bracket spacing issues
  const testBracketSpacing = useCallback(() => {
    if (!documentContent) {
      console.log('No document content to test');
      return;
    }

    console.log('🧪 Testing bracket spacing variations...');
    
    const testCases = [
      '[Receiving Party]agrees',
      '[Receiving Party] agrees',
      '[Receiving Party]  agrees',
      '[ Receiving Party ] agrees',
      '[Receiving Party ] agrees',
      '[ Receiving Party] agrees'
    ];

    const cleanContent = DocumentAPI.extractCleanText(documentContent);
    
    testCases.forEach((testCase, index) => {
      const found = cleanContent.includes(testCase);
      console.log(`Test case ${index + 1}: "${testCase}" - ${found ? '✅ FOUND' : '❌ NOT FOUND'}`);
    });

    // Test the enhanced normalization
    const normalizeBracketWhitespace = (text) => {
      return text
        .replace(/\[([^\]]+)\]/g, (match, content) => `[ ${content.trim()} ]`)
        .replace(/\s+/g, ' ')
        .trim();
    };

    const normalizedContent = normalizeBracketWhitespace(cleanContent);
    console.log('Normalized content sample:', normalizedContent.substring(0, 300));
    
    console.log('✅ Bracket spacing test completed');
  }, [documentContent]);

  // Expose test function globally for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.testBracketSpacing = testBracketSpacing;
      console.log('🧪 testBracketSpacing function exposed globally for development');
    }
  }, [testBracketSpacing]);

  // FIXED: Apply changes from risk analysis or text suggestions with proper whitespace handling
// ULTIMATE handleApplyChange function that preserves ALL formatting types

// Add global test function for debugging bracket spacing issues
useEffect(() => {
  window.testBracketSpacing = () => {
    console.log('🧪 Global bracket spacing test...');
    if (documentContent) {
      // Test the actual API response format
      const testOriginal = "Brian Patel – 35% Ownership, CTO";
      const testReplacement = "Brian Patel – 40% Ownership, CTO";
      console.log('🔍 Testing with API response format:', testOriginal);
      
      const result = DocumentAPI.findFlexibleTextMatch(documentContent, testOriginal, testReplacement);
      console.log('🧪 Global test result:', result);
      if (result) {
        console.log('✅ Global test successful! Method used:', result.method);
        // Apply the test change
        if (documentViewerRef.current?.setContent) {
          documentViewerRef.current.setContent(result.updatedContent);
        } else if (documentViewerRef.current?.element) {
          documentViewerRef.current.element.innerHTML = result.updatedContent;
        }
        handleEnhancedContentChange(result.updatedContent);
        showSuccess(`Test change applied using ${result.method} matching!`);
      } else {
        console.log('❌ Global test failed - no match found');
        // Try to find any variation
        console.log('🔍 Looking for any variation of the text...');
        const variations = [
          testOriginal,
          testOriginal.replace(/\s*–\s*/g, '–'),
          testOriginal.replace(/\s*–\s*/g, ' – '),
          testOriginal.replace(/(\w+)/g, '<strong>$1</strong>'),
          testOriginal.replace(/(\w+)\s+(\w+)/g, '<strong>$1 $2</strong>'),
        ];
        variations.forEach((variation, index) => {
          const found = documentContent.includes(variation);
          console.log(`Variation ${index + 1}: "${variation}" - Found: ${found}`);
        });
        showError('Test failed - could not find the text to replace');
      }
    } else {
      console.log('❌ No document content available for global test');
    }
  };
  
  return () => {
    delete window.testBracketSpacing;
  };
}, [documentContent, handleEnhancedContentChange, showSuccess, showError]);
const handleApplyChange = useCallback((originalText, suggestedText) => {
  if (!contentEditableRef.current || !documentContent) {
    return false;
  }

  console.log('🎯 Applying change with ultimate formatting preservation:', { 
    originalText: originalText.substring(0, 100) + '...', 
    suggestedText: suggestedText.substring(0, 100) + '...' 
  });
  
  try {
    // NEW: Method 0: Try flexible text matching first (handles spacing variations)
    const flexibleResult = tryFlexibleTextMatch(originalText, suggestedText);
    if (flexibleResult) {
      console.log('✅ Flexible text match successful');
      return flexibleResult;
    }

    // Method 1: Try exact HTML match first (fastest)
    const exactResult = tryExactHTMLMatch(originalText, suggestedText);
    if (exactResult) {
      console.log('✅ Exact HTML match successful');
      return exactResult;
    }

    // Method 2: Try DOM-based text replacement (preserves all formatting)
    const domResult = tryDOMBasedReplacement(originalText, suggestedText);
    if (domResult) {
      console.log('✅ DOM-based replacement successful');
      return domResult;
    }

    // Method 3: Try fuzzy text matching (handles slight variations)
    const fuzzyResult = tryFuzzyTextReplacement(originalText, suggestedText);
    if (fuzzyResult) {
      console.log('✅ Fuzzy text replacement successful');
      return fuzzyResult;
    }

    // Method 4: Try selection-based replacement if user has text selected
    const selectionResult = trySelectionBasedReplacement(originalText, suggestedText);
    if (selectionResult) {
      console.log('✅ Selection-based replacement successful');
      return selectionResult;
    }

    // If all methods fail, show helpful error
    console.warn('❌ All replacement methods failed');
    showError('Could not locate the exact text to replace. The text may have been modified or contains complex formatting.');
    return false;

  } catch (error) {
    console.error('❌ Error in ultimate apply change:', error);
    showError('Failed to apply change: ' + error.message);
    return false;
  }
}, [documentContent, showSuccess, showError, handleEnhancedContentChange]);

// Method 0: Flexible text matching - handles spacing variations and punctuation differences
const tryFlexibleTextMatch = (originalText, suggestedText) => {
  try {
    // Get the actual document content from the editor
    const currentContent = documentViewerRef.current?.element?.innerHTML || documentContent;
    
    if (!currentContent) {
      console.error('No content available for flexible matching');
      return false;
    }

    console.log('🔍 Trying flexible text matching...');
    console.log('Original text:', originalText);
    console.log('Suggested text:', suggestedText);

    // Use the new DocumentAPI flexible matching method
    const result = DocumentAPI.findFlexibleTextMatch(currentContent, originalText, suggestedText);
    
    if (result) {
      console.log('✅ Flexible text match found using method:', result.method);
      
      // Update both the editor and state
      if (documentViewerRef.current?.setContent) {
        documentViewerRef.current.setContent(result.updatedContent);
      } else if (documentViewerRef.current?.element) {
        documentViewerRef.current.element.innerHTML = result.updatedContent;
      }
      handleEnhancedContentChange(result.updatedContent);
      
      showSuccess(`Change applied successfully using ${result.method} matching!`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Error in flexible text matching:', error);
    return false;
  }
};

// Method 1: Exact HTML match - fastest for simple cases
const tryExactHTMLMatch = (originalText, suggestedText) => {
  try {
    // Get the actual document content from the editor
    const currentContent = documentViewerRef.current?.element?.innerHTML || documentContent;
    
    if (!currentContent) {
      console.error('No content available for matching');
      return false;
    }
    
    // Convert \n to <br> tags in both original and suggested text for proper matching
    const processedOriginalText = originalText.replace(/\\n/g, '<br>');
    const processedSuggestedText = suggestedText.replace(/\\n/g, '<br>');
    
    // NEW: Enhanced whitespace normalization for bracket patterns and HTML
    const normalizeBracketWhitespace = (text) => {
      return text
        // Normalize whitespace around brackets: [Text] -> [ Text ]
        .replace(/\[([^\]]+)\]/g, (match, content) => `[ ${content.trim()} ]`)
        // Normalize multiple spaces to single space
        .replace(/\s+/g, ' ')
        // Trim leading/trailing spaces
        .trim();
    };

    // NEW: Extract clean text from HTML for comparison
    const extractCleanTextFromHTML = (htmlText) => {
      if (!htmlText) return '';
      
      // Create a temporary div to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlText;
      
      // Extract text content
      let text = tempDiv.textContent || tempDiv.innerText || '';
      
      // Clean up the extracted text
      text = text
        .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
        .replace(/\n\s*/g, '\n')        // Remove spaces after newlines
        .replace(/\s*\n/g, '\n')        // Remove spaces before newlines
        .replace(/\n{3,}/g, '\n\n')     // Limit consecutive newlines to max 2
        .trim();                        // Remove leading/trailing whitespace
      
      return text;
    };
    
    // Apply enhanced normalization
    const enhancedOriginal = normalizeBracketWhitespace(processedOriginalText);
    const enhancedSuggested = normalizeBracketWhitespace(processedSuggestedText);
    const enhancedContent = normalizeBracketWhitespace(currentContent);
    
    // Extract clean text from HTML suggestions for comparison
    const cleanOriginalText = extractCleanTextFromHTML(enhancedOriginal);
    const cleanSuggestedText = extractCleanTextFromHTML(enhancedSuggested);
    
    // Use DocumentAPI utilities for better text normalization
    const normalizedOriginal = DocumentAPI.normalizeContentForComparison(cleanOriginalText);
    const normalizedSuggested = DocumentAPI.extractCleanText(cleanSuggestedText);
    const normalizedContent = DocumentAPI.normalizeContentForComparison(enhancedContent);

    console.log('🔍 Text matching debug:', {
      normalizedOriginal: normalizedOriginal.substring(0, 100),
      normalizedContent: normalizedContent.substring(0, 200),
      found: normalizedContent.includes(normalizedOriginal)
    });

    // Try direct replacement in HTML using normalized text
    if (normalizedContent.includes(normalizedOriginal)) {
      // For HTML content, we need to find and replace the actual HTML
      console.log('🔍 HTML replacement debug:', {
        originalHTML: processedOriginalText.substring(0, 100),
        suggestedHTML: processedSuggestedText.substring(0, 100),
        cleanOriginal: cleanOriginalText.substring(0, 100),
        cleanSuggested: cleanSuggestedText.substring(0, 100)
      });
      
      // Try to find the HTML content in the document
      if (currentContent.includes(processedOriginalText)) {
        // Direct HTML replacement
        const updatedContent = DocumentAPI.formatDocumentContent(
          currentContent.replace(processedOriginalText, processedSuggestedText)
        );
        
        console.log('✅ Direct HTML replacement successful');
        
        // Update both the editor and state
        if (documentViewerRef.current?.setContent) {
          documentViewerRef.current.setContent(updatedContent);
        } else if (documentViewerRef.current?.element) {
          documentViewerRef.current.element.innerHTML = updatedContent;
        }
        handleEnhancedContentChange(updatedContent);
        
        // Force a re-render
        setTimeout(() => {
          if (documentViewerRef.current?.setContent) {
            documentViewerRef.current.setContent(updatedContent);
          }
        }, 50);
        
        showSuccess('Change applied successfully!');
        return true;
      } else {
        // Fallback to text-based replacement
        const updatedContent = DocumentAPI.formatDocumentContent(
          currentContent.replace(cleanOriginalText, cleanSuggestedText)
        );
        
        // Update both the editor and state
        if (documentViewerRef.current?.setContent) {
          // Use the setContent method to properly update the viewer
          documentViewerRef.current.setContent(updatedContent);
          console.log('✅ Used setContent method to update viewer');
        } else if (documentViewerRef.current?.element) {
          // Fallback to direct DOM manipulation
          documentViewerRef.current.element.innerHTML = updatedContent;
          console.log('✅ Used direct DOM manipulation to update viewer');
        }
        handleEnhancedContentChange(updatedContent);
        
        // Force a re-render by triggering a state update
        setTimeout(() => {
          console.log('🔄 Forcing re-render after content update');
          // This will trigger the StreamingDocumentViewer to re-render
          if (documentViewerRef.current?.element) {
            const currentContent = documentViewerRef.current.element.innerHTML;
            console.log('📄 Current viewer content length:', currentContent.length);
            
            // Force the StreamingDocumentViewer to update by calling setContent again
            if (documentViewerRef.current?.setContent) {
              documentViewerRef.current.setContent(updatedContent);
              console.log('🔄 Forced setContent call to ensure UI update');
            }
          }
        }, 50);
        
        showSuccess('Change applied successfully!');
        return true;
      }
    }

    // Try with HTML entities decoded and HTML-aware matching
    const decodeHTMLEntities = (text) => {
      const textArea = document.createElement('textarea');
      textArea.innerHTML = text;
      return textArea.value;
    };

    const decodedOriginal = DocumentAPI.normalizeContentForComparison(decodeHTMLEntities(processedOriginalText));
    const decodedContent = DocumentAPI.normalizeContentForComparison(decodeHTMLEntities(currentContent));

    console.log('🔍 HTML-aware matching debug:', {
      decodedOriginal: decodedOriginal.substring(0, 100),
      decodedContent: decodedContent.substring(0, 200),
      found: decodedContent.includes(decodedOriginal)
    });

    if (decodedContent.includes(decodedOriginal)) {
      // Need to be careful here to preserve HTML structure
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = currentContent;
      
      // Walk through text nodes to find and replace
      const walker = document.createTreeWalker(
        tempDiv,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;
      let replaced = false;

      while (node = walker.nextNode()) {
        const nodeText = DocumentAPI.extractCleanText(node.textContent);
        const searchText = DocumentAPI.extractCleanText(processedOriginalText);
        
        console.log('🔍 Node text check:', {
          nodeText: nodeText.substring(0, 50),
          searchText: searchText.substring(0, 50),
          includes: nodeText.includes(searchText)
        });
        
        if (nodeText.includes(searchText)) {
          const replacementText = DocumentAPI.extractCleanText(processedSuggestedText);
          console.log('🔍 Replacing in node:', {
            original: node.textContent.substring(0, 50),
            replacement: replacementText.substring(0, 50)
          });
          node.textContent = node.textContent.replace(searchText, replacementText);
          replaced = true;
          break; // Only replace first occurrence
        }
      }

      if (replaced) {
        const updatedContent = DocumentAPI.formatDocumentContent(tempDiv.innerHTML);
        if (documentViewerRef.current?.setContent) {
          documentViewerRef.current.setContent(updatedContent);
        } else if (documentViewerRef.current?.element) {
          documentViewerRef.current.element.innerHTML = updatedContent;
        }
        handleEnhancedContentChange(updatedContent);
        showSuccess('Change applied successfully!');
        return true;
      }
    }

    // Try with flexible whitespace regex
    const escapeRegex = (string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    // Create a flexible pattern that allows for varying whitespace
    const cleanOriginal = DocumentAPI.extractCleanText(processedOriginalText);
    const flexiblePattern = escapeRegex(cleanOriginal)
      .split(/\s+/)
      .join('\\s+'); // Allow any amount of whitespace between words

    const flexibleRegex = new RegExp(flexiblePattern, 'gi');

    if (flexibleRegex.test(currentContent)) {
      const cleanSuggested = DocumentAPI.extractCleanText(processedSuggestedText);
      const updatedContent = DocumentAPI.formatDocumentContent(
        currentContent.replace(flexibleRegex, cleanSuggested)
      );
      
      if (documentViewerRef.current?.setContent) {
        documentViewerRef.current.setContent(updatedContent);
      } else if (documentViewerRef.current?.element) {
        documentViewerRef.current.element.innerHTML = updatedContent;
      }
      handleEnhancedContentChange(updatedContent);
      showSuccess('Change applied successfully!');
      return true;
    }

    // NEW: Enhanced bracket-aware flexible matching with HTML support
    const createBracketFlexiblePattern = (text) => {
      // Handle bracket patterns with flexible whitespace and HTML tags
      return text
        // Escape regex special characters
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        // Make bracket patterns flexible: [Text] -> \[\\s*Text\\s*\]
        .replace(/\\\[([^\\\]]+)\\\]/g, '\\\\[\\\\s*$1\\\\s*\\\\]')
        // Allow flexible whitespace around brackets
        .replace(/\\\[/g, '\\\\s*\\\\[')
        .replace(/\\\]/g, '\\\\]\\\\s*')
        // Allow any amount of whitespace between words
        .split(/\\s+/)
        .join('\\\\s+');
    };

    // NEW: HTML-aware text matching
    const createHTMLFlexiblePattern = (text) => {
      // Create patterns that can match text within HTML tags
      const cleanText = DocumentAPI.extractCleanText(text);
      return cleanText
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .split(/\s+/)
        .join('\\s+');
    };

    const bracketFlexiblePattern = createBracketFlexiblePattern(cleanOriginal);
    const bracketFlexibleRegex = new RegExp(bracketFlexiblePattern, 'gi');

    console.log('🔍 Bracket-flexible pattern debug:', {
      original: cleanOriginal,
      pattern: bracketFlexiblePattern,
      testResult: bracketFlexibleRegex.test(currentContent)
    });

    if (bracketFlexibleRegex.test(currentContent)) {
      const cleanSuggested = DocumentAPI.extractCleanText(processedSuggestedText);
      const updatedContent = DocumentAPI.formatDocumentContent(
        currentContent.replace(bracketFlexibleRegex, cleanSuggested)
      );
      
      if (documentViewerRef.current?.setContent) {
        documentViewerRef.current.setContent(updatedContent);
      } else if (documentViewerRef.current?.element) {
        documentViewerRef.current.element.innerHTML = updatedContent;
      }
      handleEnhancedContentChange(updatedContent);
      showSuccess('Change applied successfully!');
      return true;
    }

    // Try matching without HTML tags (for cases where text might span across tags)
    const stripHTMLTags = (html) => {
      return DocumentAPI.extractCleanText(html);
    };

    const contentWithoutTags = stripHTMLTags(currentContent);
    const normalizedContentWithoutTags = DocumentAPI.normalizeContentForComparison(contentWithoutTags);

    console.log('🔍 HTML-stripped matching debug:', {
      contentWithoutTags: contentWithoutTags.substring(0, 200),
      normalizedContentWithoutTags: normalizedContentWithoutTags.substring(0, 200),
      normalizedOriginal: normalizedOriginal.substring(0, 100),
      found: normalizedContentWithoutTags.includes(normalizedOriginal)
    });

    if (normalizedContentWithoutTags.includes(normalizedOriginal)) {
      // This is more complex - we found the text but it spans HTML tags
      // We need to use a different approach (DOM-based replacement)
      console.log('Text found but spans HTML tags, trying DOM-based approach');
      return false; // Let the DOM-based method handle this
    }

    // NEW: Try multiple bracket spacing variations with HTML support
    const tryBracketVariations = (originalText, suggestedText) => {
      const variations = [
        // Original as-is
        originalText,
        // Add space after closing bracket: [Text] -> [Text] 
        originalText.replace(/\](\w)/g, '] $1'),
        // Remove space after closing bracket: [Text]  -> [Text]
        originalText.replace(/\]\s+(\w)/g, ']$1'),
        // Add space before opening bracket: Text[ -> Text [
        originalText.replace(/(\w)\[/g, '$1 ['),
        // Remove space before opening bracket: Text [ -> Text[
        originalText.replace(/(\w)\s+\[/g, '$1['),
        // Normalize all bracket spacing: [Text] -> [ Text ]
        originalText.replace(/\[([^\]]+)\]/g, '[ $1 ]'),
        // Compact all bracket spacing: [ Text ] -> [Text]
        originalText.replace(/\[\s+([^\]]+)\s+\]/g, '[$1]'),
        // HTML-aware variations (extract text from HTML)
        DocumentAPI.extractCleanText(originalText),
        // HTML with normalized spacing
        DocumentAPI.extractCleanText(originalText).replace(/\](\w)/g, '] $1').replace(/(\w)\[/g, '$1 [')
      ];

      console.log('🔍 Trying bracket variations:', variations);

      for (const variation of variations) {
        const cleanVariation = DocumentAPI.extractCleanText(variation);
        const cleanSuggested = DocumentAPI.extractCleanText(suggestedText);
        
        if (currentContent.includes(cleanVariation)) {
          console.log('✅ Found match with variation:', cleanVariation);
          const updatedContent = DocumentAPI.formatDocumentContent(
            currentContent.replace(cleanVariation, cleanSuggested)
          );
          
          if (documentViewerRef.current?.setContent) {
            documentViewerRef.current.setContent(updatedContent);
          } else if (documentViewerRef.current?.element) {
            documentViewerRef.current.element.innerHTML = updatedContent;
          }
          handleEnhancedContentChange(updatedContent);
          showSuccess('Change applied successfully!');
          return true;
        }
      }
      return false;
    };

    // Try bracket variations
    if (tryBracketVariations(processedOriginalText, processedSuggestedText)) {
      return true;
    }

    // NEW: Try HTML-aware matching
    const htmlFlexiblePattern = createHTMLFlexiblePattern(processedOriginalText);
    const htmlFlexibleRegex = new RegExp(htmlFlexiblePattern, 'gi');

    console.log('🔍 HTML-flexible pattern debug:', {
      original: DocumentAPI.extractCleanText(processedOriginalText),
      pattern: htmlFlexiblePattern,
      testResult: htmlFlexibleRegex.test(currentContent)
    });

    if (htmlFlexibleRegex.test(currentContent)) {
      const cleanSuggested = DocumentAPI.extractCleanText(processedSuggestedText);
      const updatedContent = DocumentAPI.formatDocumentContent(
        currentContent.replace(htmlFlexibleRegex, cleanSuggested)
      );
      
      if (documentViewerRef.current?.setContent) {
        documentViewerRef.current.setContent(updatedContent);
      } else if (documentViewerRef.current?.element) {
        documentViewerRef.current.element.innerHTML = updatedContent;
      }
      handleEnhancedContentChange(updatedContent);
      showSuccess('Change applied successfully!');
      return true;
    }

    // Try case-insensitive match as last resort
    const caseInsensitiveRegex = new RegExp(escapeRegex(DocumentAPI.extractCleanText(processedOriginalText)), 'i');
    
    console.log('🔍 Case-insensitive matching debug:', {
      pattern: caseInsensitiveRegex.source,
      testResult: caseInsensitiveRegex.test(currentContent)
    });
    
    if (caseInsensitiveRegex.test(currentContent)) {
      const cleanSuggested = DocumentAPI.extractCleanText(processedSuggestedText);
      const updatedContent = DocumentAPI.formatDocumentContent(
        currentContent.replace(caseInsensitiveRegex, cleanSuggested)
      );
      
      if (documentViewerRef.current?.setContent) {
        documentViewerRef.current.setContent(updatedContent);
      } else if (documentViewerRef.current?.element) {
        documentViewerRef.current.element.innerHTML = updatedContent;
      }
      handleEnhancedContentChange(updatedContent);
      showSuccess('Change applied successfully (case-insensitive match)!');
      return true;
    }

    // Try HTML-aware replacement for formatted text
    console.log('🔍 Trying HTML-aware replacement...');
    const htmlAwareResult = tryHTMLAwareReplacement(originalText, suggestedText, currentContent);
    if (htmlAwareResult) {
      console.log('✅ HTML-aware replacement successful');
      return true;
    }

    console.log('Exact HTML match failed - text not found');
    return false;

  } catch (error) {
    console.error('Exact HTML match failed:', error);
    return false;
  }
};

// NEW: HTML-aware replacement for formatted text
const tryHTMLAwareReplacement = (originalText, suggestedText, currentContent) => {
  try {
    console.log('🔍 HTML-aware replacement for:', {
      originalText: originalText.substring(0, 100),
      suggestedText: suggestedText.substring(0, 100)
    });

    // Create a temporary div to work with the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = currentContent;

    // Get the text content without HTML tags
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    console.log('🔍 Text content without HTML:', textContent.substring(0, 200));

    // Find the position of the original text in the plain text
    const originalTextClean = DocumentAPI.extractCleanText(originalText);
    const textIndex = textContent.indexOf(originalTextClean);

    if (textIndex === -1) {
      console.log('❌ Original text not found in plain text content');
      return false;
    }

    console.log('🔍 Found text at index:', textIndex);

    // Walk through the DOM to find and replace the text while preserving HTML structure
    const walker = document.createTreeWalker(
      tempDiv,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let currentNode = walker.nextNode();
    let currentPos = 0;
    let replaced = false;

    while (currentNode && !replaced) {
      const nodeText = currentNode.textContent;
      const nodeLength = nodeText.length;

      // Check if this node contains part of our target text
      if (currentPos + nodeLength > textIndex && currentPos <= textIndex + originalTextClean.length) {
        console.log('🔍 Found relevant node:', {
          nodeText: nodeText.substring(0, 50),
          currentPos,
          textIndex,
          originalTextClean: originalTextClean.substring(0, 50)
        });

        // Calculate the overlap
        const startInNode = Math.max(0, textIndex - currentPos);
        const endInNode = Math.min(nodeLength, textIndex + originalTextClean.length - currentPos);

        if (startInNode < endInNode) {
          // This node contains part of our target text
          const beforeText = nodeText.substring(0, startInNode);
          const afterText = nodeText.substring(endInNode);
          
          // Replace the part that matches our target
          const targetPart = nodeText.substring(startInNode, endInNode);
          const replacementPart = DocumentAPI.extractCleanText(suggestedText);

          console.log('🔍 Replacing in node:', {
            targetPart: targetPart.substring(0, 50),
            replacementPart: replacementPart.substring(0, 50)
          });

          currentNode.textContent = beforeText + replacementPart + afterText;
          replaced = true;
        }
      }

      currentPos += nodeLength;
      currentNode = walker.nextNode();
    }

    if (replaced) {
      const updatedContent = DocumentAPI.formatDocumentContent(tempDiv.innerHTML);
      if (documentViewerRef.current?.setContent) {
        documentViewerRef.current.setContent(updatedContent);
      } else if (documentViewerRef.current?.element) {
        documentViewerRef.current.element.innerHTML = updatedContent;
      }
      handleEnhancedContentChange(updatedContent);
      showSuccess('Change applied successfully with HTML-aware replacement!');
      return true;
    }

    return false;
  } catch (error) {
    console.error('HTML-aware replacement failed:', error);
    return false;
  }
};

// Method 2: DOM-based replacement - preserves ALL formatting
const tryDOMBasedReplacement = (originalText, suggestedText) => {
  try {
    const container = document.createElement('div');
    container.innerHTML = documentContent;

    // Convert \n to <br> tags for proper matching
    const processedOriginalText = originalText.replace(/\\n/g, '<br>');
    const processedSuggestedText = suggestedText.replace(/\\n/g, '<br>');

    // Use DocumentAPI utilities for better text normalization
    const targetText = DocumentAPI.normalizeContentForComparison(processedOriginalText);
    const replacementText = DocumentAPI.extractCleanText(processedSuggestedText);

    // Create tree walker to traverse all text nodes
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent.trim()) {
        textNodes.push(node);
      }
    }

    // Build continuous text from all nodes
    let fullText = '';
    const nodePositions = [];
    
    textNodes.forEach(textNode => {
      const startPos = fullText.length;
      const nodeText = textNode.textContent;
      fullText += nodeText;
      const endPos = fullText.length;
      
      nodePositions.push({
        node: textNode,
        start: startPos,
        end: endPos,
        text: nodeText
      });
    });

    const normalizedFullText = DocumentAPI.normalizeContentForComparison(fullText);
    const matchIndex = normalizedFullText.indexOf(targetText);

    if (matchIndex === -1) {
      return false;
    }

    // Find the actual character positions in the original text
    let actualStart = -1;
    let actualEnd = -1;
    let normalizedIndex = 0;
    
    for (let i = 0; i < fullText.length; i++) {
      if (normalizedIndex === matchIndex && actualStart === -1) {
        actualStart = i;
      }
      if (normalizedIndex === matchIndex + targetText.length && actualEnd === -1) {
        actualEnd = i;
        break;
      }
      
      const char = fullText[i].toLowerCase();
      if (char !== ' ' || (normalizedIndex < normalizedFullText.length && normalizedFullText[normalizedIndex] === ' ')) {
        normalizedIndex++;
      }
    }

    if (actualStart === -1 || actualEnd === -1) {
      return false;
    }

    // Find affected nodes and replace content
    const affectedNodes = nodePositions.filter(nodePos => 
      nodePos.start < actualEnd && nodePos.end > actualStart
    );

    if (affectedNodes.length === 0) {
      return false;
    }

    if (affectedNodes.length === 1) {
      // Single node replacement
      const nodePos = affectedNodes[0];
      const node = nodePos.node;
      const relativeStart = Math.max(0, actualStart - nodePos.start);
      const relativeEnd = Math.min(nodePos.text.length, actualEnd - nodePos.start);
      
      const before = nodePos.text.substring(0, relativeStart);
      const after = nodePos.text.substring(relativeEnd);
      node.textContent = before + replacementText + after;
    } else {
      // Multi-node replacement
      affectedNodes.forEach((nodePos, index) => {
        const node = nodePos.node;
        
        if (index === 0) {
          // First node
          const relativeStart = actualStart - nodePos.start;
          const before = nodePos.text.substring(0, relativeStart);
          node.textContent = before + replacementText;
        } else if (index === affectedNodes.length - 1) {
          // Last node
          const relativeEnd = actualEnd - nodePos.start;
          const after = nodePos.text.substring(relativeEnd);
          node.textContent = after;
        } else {
          // Middle nodes
          node.textContent = '';
        }
      });
    }

    const updatedContent = DocumentAPI.formatDocumentContent(container.innerHTML);
    if (documentViewerRef.current?.setContent) {
      documentViewerRef.current.setContent(updatedContent);
    } else if (documentViewerRef.current?.element) {
      documentViewerRef.current.element.innerHTML = updatedContent;
    }
    handleEnhancedContentChange(updatedContent);
    showSuccess('Change applied successfully with formatting preserved!');
    return true;

  } catch (error) {
    console.error('DOM-based replacement failed:', error);
    return false;
  }
};

// Method 3: Fuzzy text replacement - handles variations
const tryFuzzyTextReplacement = (originalText, suggestedText) => {
  try {
    // Convert \n to <br> tags for proper processing
    const processedOriginalText = originalText.replace(/\\n/g, '<br>');
    const processedSuggestedText = suggestedText.replace(/\\n/g, '<br>');
    
    const words = DocumentAPI.extractCleanText(processedOriginalText).trim().split(/\s+/);
    if (words.length < 3) {
      return false; // Too short for fuzzy matching
    }

    // Try matching with first and last few words
    const startWords = words.slice(0, 2).join(' ');
    const endWords = words.slice(-2).join(' ');
    
    const fuzzyPattern = escapeRegex(startWords) + '[\\s\\S]*?' + escapeRegex(endWords);
    const fuzzyRegex = new RegExp(fuzzyPattern, 'gi');

    if (fuzzyRegex.test(documentContent)) {
      const cleanSuggested = DocumentAPI.extractCleanText(processedSuggestedText);
      const updatedContent = DocumentAPI.formatDocumentContent(
        documentContent.replace(fuzzyRegex, cleanSuggested)
      );
      handleEnhancedContentChange(updatedContent);
      showSuccess('Change applied successfully using fuzzy matching!');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Fuzzy replacement failed:', error);
    return false;
  }
};

// Method 4: Selection-based replacement
const trySelectionBasedReplacement = (originalText, suggestedText) => {
  try {
    const selection = window.getSelection();
    
    if (selection.rangeCount === 0 || !contentEditableRef.current) {
      return false;
    }

    const range = selection.getRangeAt(0);
    
    // Check if selection is within our editor
    if (!contentEditableRef.current.contains(range.commonAncestorContainer)) {
      return false;
    }

    const selectedText = selection.toString();
    
    // Convert \n to <br> tags for proper comparison
    const processedOriginalText = originalText.replace(/\\n/g, '<br>');
    const processedSuggestedText = suggestedText.replace(/\\n/g, '<br>');
    
    const normalizeText = (text) => DocumentAPI.normalizeContentForComparison(text);

    if (normalizeText(selectedText) === normalizeText(processedOriginalText)) {
      // Perfect match with selection
      range.deleteContents();
      
      // Insert the new text while preserving formatting context
      const cleanSuggested = DocumentAPI.extractCleanText(processedSuggestedText);
      const textNode = document.createTextNode(cleanSuggested);
      range.insertNode(textNode);
      
      // Clear selection
      selection.removeAllRanges();
      
      // Update content with formatting
      const updatedContent = DocumentAPI.formatDocumentContent(contentEditableRef.current.innerHTML);
      handleEnhancedContentChange(updatedContent);
      showSuccess('Change applied successfully using text selection!');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Selection-based replacement failed:', error);
    return false;
  }
};

// Helper function to escape regex characters
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

  // Clear selected context
  const handleClearContext = useCallback(() => {
    setSelectedContext(null);
  }, []);

  // Clear selected risk content
  const handleClearRiskContent = useCallback(() => {
    setSelectedRiskContent(null);
  }, []);

  // Clear text suggestions
  const handleClearTextSuggestions = useCallback(() => {
    setTextSuggestions([]);
  }, []);

  const scrollToRightSidebar = useCallback(() => {
    const rightSidebar = document.querySelector('[data-right-sidebar]');
    
    if (rightSidebar) {
      const sidebarRect = rightSidebar.getBoundingClientRect();
      const headerHeight = 80;
      const scrollPosition = window.scrollY + sidebarRect.top - headerHeight;
      
      window.scrollTo({
        top: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, []);



  // NEW: Function to start streaming risk analysis
// Update the startStreamingRiskAnalysis function to handle categories:
const startStreamingRiskAnalysis = useCallback(async (content, category = null, numberOfChanges = null) => {
  if (!currentContractId || !content) return;
  
  setIsRiskAnalysisStreaming(true);
  setRiskAnalysisProgress(0);
  
  if (category) {
    setRiskAnalysisStatus(`Starting ${category} risk analysis...`);
  } else {
    setRiskAnalysisStatus('Starting risk categories analysis...');
  }
  
  try {
    if (!category) {
      // First, get risk categories
      await DocumentAPI.getRiskCategories(
        content,
        // onProgress callback for categories
        (progressData) => {
          console.log('Risk categories progress in DocumentPage:', progressData);
          
          if (progressData.message) {
            setRiskAnalysisStatus(progressData.message);
          }
          
          if (progressData.type === 'started') {
            setRiskAnalysisStatus('Risk categories analysis started...');
            setRiskAnalysisProgress(5);
          } else if (progressData.type === 'category') {
            setRiskAnalysisStatus(`Found category: ${progressData.category?.category || 'New category detected'}`);
            setRiskAnalysisProgress(prev => Math.min(90, prev + 10));
          }
        },
        // onComplete callback for categories
        (completeData) => {
          console.log('Risk categories completed in DocumentPage:', completeData);
          setRiskAnalysisStatus('Risk categories analysis completed!');
          setRiskAnalysisProgress(100);
          setIsRiskAnalysisStreaming(false);
          
          // Show success message
          showSuccess(`Risk categories analysis completed! Found ${completeData.totalCategories || 0} risk categories.`);
        },
        // onError callback for categories
        (error) => {
          console.error('Risk categories error in DocumentPage:', error);
          setRiskAnalysisStatus('Risk categories analysis failed');
          setRiskAnalysisProgress(0);
          setIsRiskAnalysisStreaming(false);
          
          // Show error message
          showError(`Risk categories analysis failed: ${error.message}`);
        }
      );
    } else {
      // Analyze specific category risks
      await DocumentAPI.getRiskAnalysis(
        currentContractId,
        content,
        // onProgress callback for category risks
        (progressData) => {
          console.log('Category risk analysis progress in DocumentPage:', progressData);
          
          if (progressData.message) {
            setRiskAnalysisStatus(progressData.message);
          }
          
          if (progressData.type === 'started') {
            setRiskAnalysisStatus(`${category} risk analysis started...`);
            setRiskAnalysisProgress(5);
          } else if (progressData.type === 'risk') {
            setRiskAnalysisStatus(`Found ${category} risk: ${progressData.risk?.title || 'New risk detected'}`);
            setRiskAnalysisProgress(prev => Math.min(90, prev + 10));
          }
        },
        // onComplete callback for category risks
        (completeData) => {
          console.log('Category risk analysis completed in DocumentPage:', completeData);
          setRiskAnalysisStatus(`${category} risk analysis completed!`);
          setRiskAnalysisProgress(100);
          setIsRiskAnalysisStreaming(false);
          
          // Show success message
          showSuccess(`${category} risk analysis completed! Found ${completeData.totalRisks || 0} risks.`);
        },
        // onError callback for category risks
        (error) => {
          console.error('Category risk analysis error in DocumentPage:', error);
          setRiskAnalysisStatus(`${category} risk analysis failed`);
          setRiskAnalysisProgress(0);
          setIsRiskAnalysisStreaming(false);
          
          // Show error message
          showError(`${category} risk analysis failed: ${error.message}`);
        },
        // Pass category and numberOfChanges for filtering
        category,
        numberOfChanges
      );
    }
  } catch (error) {
    console.error('Error starting risk analysis:', error);
    setIsRiskAnalysisStreaming(false);
    setRiskAnalysisProgress(0);
    setRiskAnalysisStatus('');
    showError(`Failed to start risk analysis: ${error.message}`);
  }
}, [currentContractId, showSuccess, showError]);



// Update the handleRiskAnalysis function:
const handleRiskAnalysis = useCallback((text) => {
  const cleanText = text.replace(/<[^>]*>/g, '').trim();
  
  // Set the selected risk content to trigger analysis
  setSelectedRiskContent(cleanText);
  
  // Switch to risk analysis tab
  if (isRightSidebarCollapsed) {
    setIsRightSidebarCollapsed(false);
  }
  
  setTimeout(() => {
    scrollToRightSidebar();
  }, isRightSidebarCollapsed ? 300 : 100);
  
  console.log('Risk Analysis clicked with text:', cleanText);
  
  // Start with categories analysis first
  if (currentContractId && cleanText) {
    startStreamingRiskAnalysis(cleanText);
  }
}, [isRightSidebarCollapsed, scrollToRightSidebar, currentContractId, startStreamingRiskAnalysis]);


// Add a helper function to extract text from HTML:
const extractTextFromHTML = useCallback((html) => {
  if (!html) return '';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
}, []);
// Add these handlers for category management:
const handleRiskCategorySelected = useCallback((category) => {
  console.log('Risk category selected:', category);
  setSelectedRiskCategory(category);
  
  // Start analyzing risks for this specific category
  const content = selectedRiskContent || extractTextFromHTML(documentContent);
  if (currentContractId && content && category) {
    startStreamingRiskAnalysis(content, category.category, category.number_of_changes);
  }
}, [selectedRiskContent, documentContent, currentContractId, startStreamingRiskAnalysis]);

const handleClearRiskCategory = useCallback(() => {
  setSelectedRiskCategory(null);
  setRiskCategories([]);
}, []);





  // Updated "Ask Savant" handler
  const handleAskSavant = useCallback((text) => {
    const cleanText = text.replace(/<[^>]*>/g, '').trim();
    setSelectedContext(cleanText);
    
    if (isRightSidebarCollapsed) {
      setIsRightSidebarCollapsed(false);
    }
    
    setTimeout(() => {
      scrollToRightSidebar();
    }, isRightSidebarCollapsed ? 300 : 100);
    
    console.log('Ask Savant clicked with text:', cleanText);
  }, [isRightSidebarCollapsed, scrollToRightSidebar]);

  // Determine what to show
  const shouldShowLoadingSpinner = isLoading && !documentContent && !isGenerating;
  const shouldShowGenerationProgress = isGenerating && !documentContent;
  const shouldShowViewer = !shouldShowLoadingSpinner;

  // console.log('Render state:', {
  //   isLoading,
  //   isGenerating,
  //   hasContent: !!documentContent,
  //   shouldShowLoadingSpinner,
  //   shouldShowGenerationProgress,
  //   shouldShowViewer,
  //   generationStatus,
  //   generationProgress,
  //   isSaving,
  //   hasUnsavedChanges,
  //   selectedRegion,
  //   jurisdictionAnalysis: !!jurisdictionAnalysis
  // });

  return (
      <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300 w-full">
        <Header />

        {/* Toast Container */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />

        {/* Text Selection Toolbar */}
        <div className="selection-toolbar">
          <TextSelectionToolbar
              position={selectionToolbarPosition}
              onFormat={handleFormat}
              onComment={handleComment}
              onAskSavant={handleAskSavant}
              onRiskAnalysis={handleRiskAnalysis}
              selectedText={selectedText}
          />
        </div>

        {/* Region Header - Sticky position */}
        <div className="sticky top-16 z-10">
          <RegionHeader 
            selectedRegion={selectedRegion}
            onRegionChange={handleRegionChange}
            currentContractId={currentContractId}
            activeUsers={activeUsers}
            connectionStatus={connectionStatus}
            isConnecting={isConnecting}
            documentContent={documentContent}
            isGenerating={isGenerating}
            onDownload={() => {}}
          />
        </div>


<div className="p-8 px-15 max-w-full mx-auto">
  <div className="flex gap-6">
    {/* Left Sidebar - Document Score */}
    <div className="w-60 flex-shrink-0">
      <div className="sticky top-32 space-y-4">
         {/* Consult a Lawyer Button */}
         <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Legal Support
          </h3>
          <button
            onClick={() => window.open('https://calendly.com/andrew-jin36/savant-meeting', '_blank')}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Consult a Lawyer
          </button>
        </div>
        
        <DocumentScore 
          contractId={currentContractId}
          onScoreUpdate={handleScoreUpdate}
          showSuccess={showSuccess}
          showError={showError}
        />
        
        {/* You can add more widgets here in the future */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Document Info
          </h3>
          <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
            {currentContractId && (
              <p>ID: {currentContractId.substring(0, 8)}...</p>
            )}
            {documentContent && (
              <p>Length: {documentContent.length.toLocaleString()} characters</p>
            )}
            <p>Region: {selectedRegion}</p>
          </div>
        </div>

       
      </div>
    </div>

    {/* Main Content Area - Centered with limited width */}
    <div className={`flex-1 flex justify-center transition-all duration-300 ${
        isRightSidebarCollapsed
            ? '' // Add some right padding when sidebar is collapsed
            : ''  // Less padding when sidebar is open
    }`}>
        {/* Document Container with limited width */}
        <div className="w-full max-w-4xl"> {/* Limit the document width to 4xl (896px) */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg transition-colors duration-300">
                {/* Document Paper Effect */}
                <div className="p-8 lg:p-12"> {/* Generous padding to simulate document margins */}
                    <DocumentToolbar
                        documentTitle={documentTitle}
                        isGenerating={isGenerating}
                        generationProgress={generationProgress}
                        currentContractId={currentContractId}
                        documentContent={documentContent}
                        onSave={saveDocument}
                        onDownload={downloadDocument}
                        onShare={shareDocument}
                        isTracking={isTracking}
                        pendingChanges={pendingChanges}
                        isSaving={isSaving}
                        hasUnsavedChanges={hasUnsavedChanges}
                        saveError={saveError}
                        // NEW: Risk analysis streaming props
                        isRiskAnalysisStreaming={isRiskAnalysisStreaming}
                        riskAnalysisProgress={riskAnalysisProgress}
                        riskAnalysisStatus={riskAnalysisStatus}
                        // WebSocket props
                        connectionStatus={connectionStatus}
                        isConnecting={isConnecting}
                        websocketStats={websocketStats}
                    />

                    {/* Loading State */}
                    {shouldShowLoadingSpinner && (
                        <LoadingSpinner generationStatus={generationStatus} />
                    )}

                    {/* Document Content Area */}
                    {shouldShowViewer && (
                        <>
                            {/* Generation Progress - only show if generating and no content yet */}
                            {shouldShowGenerationProgress && (
                                <GenerationProgress
                                    isGenerating={isGenerating}
                                    documentContent={documentContent}
                                    generationStatus={generationStatus}
                                    generationProgress={generationProgress}
                                />
                            )}

                            {/* Document Viewer with document-like styling */}
                            <div className="relative z-0">
                                {/* Optional: Add subtle page lines effect */}
                                <div className="absolute inset-0 pointer-events-none opacity-5 z-0">
                                    <div className="h-full bg-white dark:bg-gray-900 to-transparent bg-repeat-y"
                                         style={{ backgroundSize: '100% 24px' }}></div>
                                </div>

                             
                                <StreamingDocumentViewer
                                ref={documentViewerRef}
                                content={documentContent || ''}
                                isStreaming={isGenerating}
                                onContentChange={handleEnhancedContentChange}
                                className="prose dark:bg-gray-800 p-4 dark:prose-invert max-w-none text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-opacity-50 rounded min-h-[600px] bg-transparent text-gray-900 dark:text-gray-100 relative z-0"
                                editable={!isGenerating}
                                preserveCursor={true}
                                showLineNumbers={true}
                                // Enhanced props for cursor tracking
                                activeUsers={activeUsers}
                                currentUserId={currentUserId}
                                onCursorMove={handleLocalCursorMove}
                                connectionStatus={connectionStatus}
                                // Remote cursor props
                                remoteCursors={Array.from(remoteCursors.values())}
                                onRemoteCursorUpdate={updateRemoteCursor}
                                // NEW: Text operation callbacks
                                onTextInsert={handleLocalTextInsert}
                                onTextDelete={handleLocalTextDelete}
                              />
                            </div>

                            {/* Empty State - show when no content and not generating */}
                            {!documentContent && !isGenerating && !isLoading && (
                                <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                                    <div className="text-center">
                                        <div className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                            {t.documentPage.emptyState.noDocumentSelected}
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                                            {t.documentPage.emptyState.createOrSelectDocument}
                                        </p>
                                        <button
                                            onClick={handleNewDocument}
                                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                        >
                                            {t.documentPage.emptyState.createNewDocument}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    </div>

    {/* Right Sidebar - Sticky position on the right */}
    <div className={`${isRightSidebarCollapsed ? 'w-16' : 'w-[420px]'} flex-shrink-0 transition-all duration-300`}>
      <div className="sticky top-32">
        <RightSidebar
            isCollapsed={isRightSidebarCollapsed}
            onToggleCollapse={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
            documentContent={documentContent}
            selectedContext={selectedContext}
            onClearContext={handleClearContext}
            selectedRiskContent={selectedRiskContent}
            onClearRiskContent={handleClearRiskContent}
            contractId={currentContractId}
            onApplyChange={handleApplyChange}
            textSuggestions={textSuggestions}
            onClearTextSuggestions={handleClearTextSuggestions}
            isTracking={isTracking}
            pendingChanges={pendingChanges}
            onRetryAnalysis={handleRetryAnalysis}
            // Jurisdiction analysis props
            jurisdictionAnalysis={jurisdictionAnalysis}
            onClearJurisdictionAnalysis={handleClearJurisdictionAnalysis}
            // NEW: Risk categories props
            riskCategories={riskCategories}
            selectedRiskCategory={selectedRiskCategory}
            onRiskCategorySelected={handleRiskCategorySelected}
            onClearRiskCategory={handleClearRiskCategory}
            isLoadingRiskCategories={isLoadingRiskCategories}
            // NEW: Risk analysis streaming props
            isRiskAnalysisStreaming={isRiskAnalysisStreaming}
            riskAnalysisProgress={riskAnalysisProgress}
            riskAnalysisStatus={riskAnalysisStatus}
        />
      </div>
    </div>
  </div>
</div>

          {/* Modal */}
          <DocumentCreationModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onDocumentGenerated={handleDocumentGenerated}
          />
      </div>
  );
};

export default DocumentPage;