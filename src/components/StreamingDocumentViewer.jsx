import React, { useEffect, useRef, useState, useCallback, useImperativeHandle } from 'react'

const StreamingDocumentViewer = React.forwardRef(({
  content,
  isStreaming,
  onContentChange,
  className = "",
  editable = true,
  preserveCursor = true,

  activeUsers = [],
  currentUserId = null,
  onCursorMove = null,
  connectionStatus = 'disconnected',
  remoteCursors = [],
  onRemoteCursorUpdate = null,
  // NEW: Add callbacks for text operations
  onTextInsert = null,
  onTextDelete = null
}, ref) => {
  const contentRef = useRef(null)
  const [isUserEditing, setIsUserEditing] = useState(false)
  const [internalContent, setInternalContent] = useState('')
  const userEditingTimeout = useRef(null)
  const lastExternalContent = useRef('')
  const previousContent = useRef('') // Track previous content for diff
  
  // NEW: Add flag to track when remote changes are being applied
  const isApplyingRemoteChange = useRef(false)
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    element: contentRef.current,
    updateRemoteCursor: (userId, position, userName, userColor) => {
      if (onRemoteCursorUpdate) {
        onRemoteCursorUpdate(userId, position, userName, userColor)
      }
    },
    getCursorPosition: () => getCursorPosition(),
    setContent: (newContent) => {
      if (contentRef.current) {
        // Set flag to indicate remote change is being applied
        isApplyingRemoteChange.current = true
        
        contentRef.current.innerHTML = newContent
        setInternalContent(newContent)
        previousContent.current = newContent
        
        // Reset flag after a short delay to allow the change to settle
        setTimeout(() => {
          isApplyingRemoteChange.current = false
        }, 50)
      }
    },
    // NEW: Method to update content from remote changes without triggering local detection
    updateRemoteContent: (newContent) => {
      if (contentRef.current) {
        console.log('🔍 updateRemoteContent called with:', {
          newContentLength: newContent.length,
          newContentSample: newContent.substring(0, 200) + (newContent.length > 200 ? '...' : ''),
          currentInnerHTML: contentRef.current.innerHTML.substring(0, 200) + (contentRef.current.innerHTML.length > 200 ? '...' : '')
        });
        
        // Set flag to indicate remote change is being applied
        isApplyingRemoteChange.current = true
        
        // Update content without triggering change detection
        contentRef.current.innerHTML = newContent
        setInternalContent(newContent)
        previousContent.current = newContent
        lastExternalContent.current = newContent
        
        console.log('✅ updateRemoteContent completed:', {
          newInnerHTML: contentRef.current.innerHTML.substring(0, 200) + (contentRef.current.innerHTML.length > 200 ? '...' : ''),
          newInnerText: contentRef.current.innerText.substring(0, 100) + (contentRef.current.innerText.length > 100 ? '...' : '')
        });
        
        // Reset flag after a longer delay to allow the change to settle
        setTimeout(() => {
          isApplyingRemoteChange.current = false
          console.log('🔄 Remote change flag reset');
        }, 500)
      }
    }
  }), [onRemoteCursorUpdate])

  // Initialize content
  useEffect(() => {
    if (content !== lastExternalContent.current && !isUserEditing && !isApplyingRemoteChange.current) {
      setInternalContent(content || '')
      lastExternalContent.current = content || ''
      previousContent.current = content || ''
    }
  }, [content, isUserEditing])

  // Character-offset based position calculation (using only character position)
  const getCursorPosition = useCallback(() => {
    const selection = window.getSelection()
    if (!selection.rangeCount || !contentRef.current) {
      console.log('🔴 Cursor: No selection or contentRef')
      return null
    }

    const range = selection.getRangeAt(0)
    if (!contentRef.current.contains(range.commonAncestorContainer)) {
      console.log('🔴 Cursor: Selection outside editor')
      return null
    }

  // Get all text content from the editor
  const fullText = contentRef.current.innerText || contentRef.current.textContent || ''
    console.log('📄 Full text length:', fullText.length)
    
    // Create a temporary range to measure offset
    const preCaretRange = document.createRange()
    preCaretRange.selectNodeContents(contentRef.current)
    preCaretRange.setEnd(range.startContainer, range.startOffset)
    
    // Get the text up to the cursor
    const textBeforeCursor = preCaretRange.toString()
    const characterOffset = textBeforeCursor.length
    
    console.log('📍 Character-based Cursor Position:', {
      characterOffset: characterOffset,
      totalTextLength: fullText.length,
      textBeforeCursorSample: textBeforeCursor.substring(Math.max(0, characterOffset - 50), characterOffset)
    })
    
    // Return only character offset for accurate positioning
    return { ch: characterOffset }
  }, [])

  // Calculate position from character offset
  const getPositionFromOffset = useCallback((offset, text = null) => {
    if (!contentRef.current && !text) return null
    
  const textToUse = text || (contentRef.current.innerText || contentRef.current.textContent || '')
    
    // Validate offset
    if (offset < 0 || offset > textToUse.length) {
      console.warn('Invalid character offset:', offset, 'text length:', textToUse.length)
      return null
    }
    
    // Convert character offset to line-based position
    const lines = textToUse.split('\n')
    let currentLine = 0
    let currentChar = 0
    
    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length + 1 // +1 for newline character
      if (currentChar + lineLength > offset) {
        // Found the line
        currentLine = i
        break
      }
      currentChar += lineLength
    }
    
    // Calculate character position within the line
    const charInLine = offset - currentChar
    
    return { line: currentLine, ch: charInLine }
  }, [])

  // Get character offset from line-based position
  const getOffsetFromPosition = useCallback((position, text = null) => {
    if (!contentRef.current && !text) return -1
    
  const textToUse = text || (contentRef.current.innerText || contentRef.current.textContent || '')
    const lines = textToUse.split('\n')
    
    // Validate line number
    if (position.line < 0 || position.line >= lines.length) {
      console.warn('Invalid line number:', position.line, 'total lines:', lines.length)
      return -1
    }
    
    // Calculate character offset from line-based position
    let offset = 0
    
    // Add up characters from previous lines
    for (let i = 0; i < position.line; i++) {
      offset += lines[i].length + 1 // +1 for newline character
    }
    
    // Add character position within the current line
    offset += Math.min(position.ch, lines[position.line].length)
    
    return offset
  }, [])

  // Get DOM position from character offset (counts <br> as a newline)
  const getDOMPositionFromOffset = useCallback((offset) => {
    if (!contentRef.current) return null

    const container = contentRef.current
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      null,
      false
    )

    let currentOffset = 0
    let node
    let lastTextNode = null

    const findNextTextNode = (fromNode) => {
      const tw = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false)
      let n
      let after = false
      while ((n = tw.nextNode())) {
        if (!after) {
          if (fromNode.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING) {
            after = true
            if (!(n.compareDocumentPosition(fromNode) & Node.DOCUMENT_POSITION_FOLLOWING)) {
              return n
            }
          }
        } else {
          return n
        }
      }
      return null
    }

    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.TEXT_NODE) {
        const len = node.textContent.length
        if (currentOffset + len >= offset) {
          return { node, offset: offset - currentOffset }
        }
        currentOffset += len
        lastTextNode = node
        continue
      }
      if (node.nodeType === Node.ELEMENT_NODE && node.nodeName === 'BR') {
        if (offset <= currentOffset) {
          let nextText = findNextTextNode(node)
          if (!nextText) {
            const empty = document.createTextNode('')
            node.parentNode?.insertBefore(empty, node.nextSibling)
            nextText = empty
          }
          return { node: nextText, offset: 0 }
        }
        currentOffset += 1
      }
    }

    if (lastTextNode) {
      return { node: lastTextNode, offset: lastTextNode.textContent.length }
    }

    const empty = document.createTextNode('')
    container.appendChild(empty)
    return { node: empty, offset: 0 }
  }, [])

  // Detect text changes using character-offset system
  const detectTextChanges = useCallback((oldText, newText) => {
    if (!onTextInsert && !onTextDelete) return
    
    // Skip if content is the same
    if (oldText === newText) return
    
    // NEW: Skip detection if remote changes are being applied
    if (isApplyingRemoteChange.current) {
      console.log('🚫 Skipping text change detection - remote change in progress')
      return
    }
    
    console.log('🔍 Character-offset text change detection:', {
      oldTextLength: oldText.length,
      newTextLength: newText.length,
      oldTextSample: oldText.substring(0, 100) + (oldText.length > 100 ? '...' : ''),
      newTextSample: newText.substring(0, 100) + (newText.length > 100 ? '...' : '')
    })
    
    // Get current cursor position for accurate insertion point
    const cursorPosition = getCursorPosition()
    if (!cursorPosition) {
      console.log('❌ No cursor position available for text change detection')
      return
    }
    
    // Simple case: text was added at the end
    if (newText.startsWith(oldText)) {
      const insertedText = newText.substring(oldText.length)
      if (onTextInsert && insertedText.length > 0) {
        console.log('📝 Text inserted at end:', insertedText, 'at position:', cursorPosition)
        console.log('🔍 Inserted text details:', {
          insertedText: insertedText,
          insertedTextCharCode: insertedText.charCodeAt(0),
          insertedTextLength: insertedText.length
        });
        onTextInsert(insertedText, cursorPosition)
      }
      return
    }
    
    // Simple case: text was deleted from the end
    if (oldText.startsWith(newText)) {
      const deletedLength = oldText.length - newText.length
      if (deletedLength > 0) {
        // Calculate the position where deletion started using character-only coordinates
        const deletionStartOffset = newText.length
        const deletionEndOffset = oldText.length
        
        const deletionStartPosition = { ch: deletionStartOffset }
        const deletionEndPosition = { ch: deletionEndOffset }
        
        if (onTextDelete && deletionStartPosition && deletionEndPosition) {
          console.log('🗑️ Text deleted from end:', {
            deletedLength,
            from: deletionStartPosition,
            to: deletionEndPosition
          })
          onTextDelete(deletionStartPosition, deletionEndPosition)
        }
      }
      return
    }
    
    // Complex case: find the first difference
    let diffStart = 0
    while (diffStart < Math.min(oldText.length, newText.length) && 
           oldText[diffStart] === newText[diffStart]) {
      diffStart++
    }
    
    console.log('🔍 Found first difference at character position:', diffStart)
    
    // Find the last difference (from the end)
    let diffEndOld = oldText.length
    let diffEndNew = newText.length
    while (diffEndOld > diffStart && diffEndNew > diffStart &&
           oldText[diffEndOld - 1] === newText[diffEndNew - 1]) {
      diffEndOld--
      diffEndNew--
    }
    
    // Calculate what changed
    const deletedText = oldText.substring(diffStart, diffEndOld)
    const insertedText = newText.substring(diffStart, diffEndNew)
    
    console.log('🔍 Calculated changes:', {
      deletedText: deletedText.substring(0, 50) + (deletedText.length > 50 ? '...' : ''),
      insertedText: insertedText.substring(0, 50) + (insertedText.length > 50 ? '...' : ''),
      deletedLength: deletedText.length,
      insertedLength: insertedText.length,
      diffStart: diffStart,
      diffEndOld: diffEndOld,
      diffEndNew: diffEndNew
    })
    
    // Only emit changes if there's actually something to change
    let changeEmitted = false
    
    // If text was deleted
    if (deletedText.length > 0 && onTextDelete) {
      const fromPos = { ch: diffStart }
      const toPos = { ch: diffEndOld }
      if (fromPos && toPos) {
        console.log('🗑️ Text deleted:', {
          deletedText: deletedText.substring(0, 50) + (deletedText.length > 50 ? '...' : ''),
          from: fromPos,
          to: toPos,
          diffStart: diffStart,
          diffEndOld: diffEndOld
        })
        onTextDelete(fromPos, toPos)
        changeEmitted = true
      }
    }
    
    // If text was inserted
    if (insertedText.length > 0 && onTextInsert) {
      const position = { ch: diffStart }
      if (position) {
        console.log('📝 Text inserted:', {
          text: insertedText.substring(0, 100) + (insertedText.length > 100 ? '...' : ''),
          position: position,
          textLength: insertedText.length,
          diffStart: diffStart
        })
        console.log('🔍 Inserted text details (complex case):', {
          insertedText: insertedText,
          insertedTextCharCode: insertedText.charCodeAt(0),
          insertedTextLength: insertedText.length,
          position: position
        });
        onTextInsert(insertedText, position)
        changeEmitted = true
      }
    }
    
    // If no change was emitted but there's a difference, log it
    if (!changeEmitted) {
      console.warn('⚠️ No change emitted despite text difference:', {
        oldTextLength: oldText.length,
        newTextLength: newText.length,
        deletedTextLength: deletedText.length,
        insertedTextLength: insertedText.length
      })
    }
  }, [onTextInsert, onTextDelete, getCursorPosition])

  // Track cursor position and notify parent
  const trackCursorPosition = useCallback(() => {
    if (!onCursorMove || connectionStatus !== 'connected') {
      console.log('🚫 Track Cursor: Skipped - onCursorMove:', !!onCursorMove, 'connected:', connectionStatus === 'connected')
      return
    }
    
    console.log('🎯 Tracking cursor position...')
    const position = getCursorPosition()
    if (position) {
      // Get selection if any
      const selection = window.getSelection()
      let selectionData = null
      
      if (selection.rangeCount > 0 && !selection.isCollapsed) {
        console.log('🔍 Selection detected, calculating range...')
        const range = selection.getRangeAt(0)
        
        // Calculate start position (already have it)
        const startPos = position
        
        // Calculate end position
        const preEndRange = document.createRange()
        preEndRange.selectNodeContents(contentRef.current)
        preEndRange.setEnd(range.endContainer, range.endOffset)
        const textBeforeEnd = preEndRange.toString()
        // Use absolute character offsets for selection as well
        const endPos = { ch: textBeforeEnd.length }
        
        selectionData = {
          start: startPos,
          end: endPos
        }
        
        console.log('📐 Selection range:', {
          start: `Ch:${startPos.ch}`,
          end: `Ch:${endPos.ch}`
        })
      }
      
      console.log('📤 Sending cursor position via WebSocket:', {
        position: `Ch:${position.ch}`,
        hasSelection: !!selectionData
      })
      onCursorMove(position, selectionData)
    } else {
      console.log('❌ No cursor position detected')
    }
  }, [getCursorPosition, onCursorMove, connectionStatus])

  // Handle cursor/selection changes
  useEffect(() => {
    if (!contentRef.current || connectionStatus !== 'connected') {
      console.log('🔌 Cursor tracking setup skipped - connected:', connectionStatus === 'connected')
      return
    }
    
    console.log('✅ Setting up cursor tracking listeners')
    
    const handleSelectionChange = () => {
      console.log('🖱️ Selection change detected')
      trackCursorPosition()
    }
    
    // Track cursor on various events
    const events = ['mouseup', 'keyup', 'focus', 'click']
    events.forEach(event => {
      contentRef.current.addEventListener(event, handleSelectionChange)
    })
    
    // Also track document-level selection changes
    document.addEventListener('selectionchange', handleSelectionChange)
    
    return () => {
      console.log('🧹 Cleaning up cursor tracking listeners')
      if (contentRef.current) {
        events.forEach(event => {
          contentRef.current.removeEventListener(event, handleSelectionChange)
        })
      }
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [trackCursorPosition, connectionStatus])







  // Convert character offset to pixel coordinates for remote cursors
  const getPixelPosition = useCallback((position) => {
    if (!contentRef.current) return null
    
    // Use character offset from position
    const characterOffset = position.ch
    
    // Find the DOM position for this character offset
    const domPosition = getDOMPositionFromOffset(characterOffset)
    if (!domPosition) {
      console.warn('Could not find DOM position for character offset:', characterOffset)
      return null
    }
    
    try {
      // Create a range at the DOM position
      const range = document.createRange()
      const { node, offset } = domPosition
      
      range.setStart(node, offset)
      range.setEnd(node, offset)
      
      let rect = range.getBoundingClientRect()
      const containerRect = contentRef.current.getBoundingClientRect()
      
      // Fallback: when range at start of a new line (e.g., just after <br>) may return a zero-size rect
      if ((!rect || (rect.width === 0 && rect.height === 0)) && node) {
        try {
          const marker = document.createElement('span')
          marker.setAttribute('data-cursor-probe', 'true')
          marker.style.display = 'inline-block'
          marker.style.width = '1px'
          marker.style.height = '1em'
          marker.style.padding = '0'
          marker.style.margin = '0'
          marker.style.border = '0'
          marker.style.background = 'transparent'
          
          const probeRange = document.createRange()
          probeRange.setStart(node, offset)
          probeRange.setEnd(node, offset)
          probeRange.insertNode(marker)
          
          rect = marker.getBoundingClientRect()
          
          // Clean up immediately
          marker.parentNode && marker.parentNode.removeChild(marker)
        } catch (e) {
          // Ignore, we'll fall back to container top-left
          console.warn('Cursor probe fallback failed:', e)
        }
      }
      
      if (!rect) {
        return { x: 0, y: 0 }
      }
      
      // Calculate position relative to the container
      const x = rect.left - containerRect.left + contentRef.current.scrollLeft
      const y = rect.top - containerRect.top + contentRef.current.scrollTop
      
      console.log('📍 Pixel position calculated:', {
        characterOffset: characterOffset,
        pixelPos: { x, y },
        nodeText: node.textContent.substring(0, 50) + (node.textContent.length > 50 ? '...' : '')
      })
      
      return { x, y }
    } catch (e) {
      console.warn('Error calculating pixel position:', e)
      return null
    }
  }, [getDOMPositionFromOffset])

  // Update DOM content when internal content changes
  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== internalContent && !isApplyingRemoteChange.current) {
      // NEW: Set flag when updating content to prevent change detection
      const isRemoteUpdate = isApplyingRemoteChange.current
      
      const selection = window.getSelection()
      const hadFocus = document.activeElement === contentRef.current
      let savedPosition = null
      let savedSelection = null
      
      // Save cursor position and selection if we have focus
      if (hadFocus && selection.rangeCount > 0 && preserveCursor && !isStreaming) {
        savedPosition = getCursorPosition()
        
        // Save selection if any
        if (!selection.isCollapsed) {
          const range = selection.getRangeAt(0)
          const startPos = getCursorPosition()
          
          // Calculate end position
          const preEndRange = document.createRange()
          preEndRange.selectNodeContents(contentRef.current)
          preEndRange.setEnd(range.endContainer, range.endOffset)
          
          const textBeforeEnd = preEndRange.toString()
          const endLines = textBeforeEnd.split('\n')
          const endPos = {
            line: endLines.length - 1,
            ch: endLines[endLines.length - 1].length
          }
          
          savedSelection = {
            start: startPos,
            end: endPos
          }
        }
      }

      // Update content
      contentRef.current.innerHTML = internalContent

      // Restore cursor position with improved logic
      if (hadFocus && (savedPosition || savedSelection) && preserveCursor && !isStreaming) {
        try {
          const text = contentRef.current.innerText || contentRef.current.textContent || ''
          const lines = text.split('\n')
          
          if (savedSelection) {
            // Restore selection
            const startOffset = getOffsetFromPosition(savedSelection.start, lines)
            const endOffset = getOffsetFromPosition(savedSelection.end, lines)
            
            const range = document.createRange()
            const walker = document.createTreeWalker(
              contentRef.current,
              NodeFilter.SHOW_TEXT,
              null,
              false
            )
            
            let currentOffset = 0
            let startNode = null
            let startOffsetInNode = 0
            let endNode = null
            let endOffsetInNode = 0
            
            while (node = walker.nextNode()) {
              const nodeLength = node.textContent.length
              
              if (!startNode && currentOffset + nodeLength >= startOffset) {
                startNode = node
                startOffsetInNode = startOffset - currentOffset
              }
              
              if (!endNode && currentOffset + nodeLength >= endOffset) {
                endNode = node
                endOffsetInNode = endOffset - currentOffset
                break
              }
              
              currentOffset += nodeLength
            }
            
            if (startNode && endNode) {
              range.setStart(startNode, startOffsetInNode)
              range.setEnd(endNode, endOffsetInNode)
              selection.removeAllRanges()
              selection.addRange(range)
              contentRef.current.focus()
            }
          } else if (savedPosition) {
            // Restore cursor position
            const targetOffset = getOffsetFromPosition(savedPosition, lines)
            
            const range = document.createRange()
            const walker = document.createTreeWalker(
              contentRef.current,
              NodeFilter.SHOW_TEXT,
              null,
              false
            )
            
            let currentOffset = 0
            let node
            let found = false
            
            while (node = walker.nextNode()) {
              const nodeLength = node.textContent.length
              if (currentOffset + nodeLength >= targetOffset) {
                const offsetInNode = Math.min(targetOffset - currentOffset, nodeLength)
                range.setStart(node, offsetInNode)
                range.setEnd(node, offsetInNode)
                found = true
                break
              }
              currentOffset += nodeLength
            }
            
            if (found) {
              selection.removeAllRanges()
              selection.addRange(range)
              contentRef.current.focus()
            }
          }
        } catch (error) {
          console.warn('Could not restore cursor:', error)
        }
      }
      
      // Helper function to get offset from position
      function getOffsetFromPosition(position, lines) {
        let offset = 0
        for (let i = 0; i < position.line && i < lines.length; i++) {
          offset += lines[i].length + 1 // +1 for newline
        }
        offset += Math.min(position.ch, lines[position.line]?.length || 0)
        return offset
      }

      // Auto-scroll during streaming
      if (isStreaming && contentRef.current) {
        contentRef.current.scrollTop = contentRef.current.scrollHeight
      }


    }
  }, [internalContent, isStreaming, preserveCursor, getCursorPosition])

  // Handle user input with text change detection
  const handleInput = useCallback((e) => {
    if (isStreaming) {
      e.preventDefault()
      return
    }
    
    // Note: do not return early when applying remote changes; we still need to
    // update internalContent/previousContent to keep diffs consistent. We'll
    // skip emitting changes later instead.
    if (isApplyingRemoteChange.current) {
      console.log('🚫 Skipping change emission (not state update) - remote change in progress')
    }

    setIsUserEditing(true)
    
  const newContent = contentRef.current.innerHTML
    // Use the same text extraction method for both old and new text to ensure consistency
    const extractTextFromHTML = (html) => {
      if (!html) return '';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.innerText || tempDiv.textContent || '';
    };
    
    const oldText = extractTextFromHTML(previousContent.current);
    const newText = extractTextFromHTML(contentRef.current.innerHTML);
    
    // Normalize text to ensure consistent line structure
    const normalizeText = (text) => {
      // Remove leading/trailing whitespace and normalize line endings
      return text.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    };
    
    const normalizedOldText = normalizeText(oldText);
    const normalizedNewText = normalizeText(newText);
    
    console.log('🔍 Sender text extraction:', {
      oldTextLength: oldText.length,
      newTextLength: newText.length,
      normalizedOldTextLength: normalizedOldText.length,
      normalizedNewTextLength: normalizedNewText.length,
      oldTextSample: oldText.substring(0, 100) + (oldText.length > 100 ? '...' : ''),
      newTextSample: newText.substring(0, 100) + (newText.length > 100 ? '...' : ''),
      normalizedOldTextSample: normalizedOldText.substring(0, 100) + (normalizedOldText.length > 100 ? '...' : ''),
      normalizedNewTextSample: normalizedNewText.substring(0, 100) + (normalizedNewText.length > 100 ? '...' : ''),
      contentRefInnerHTML: contentRef.current.innerHTML.substring(0, 200) + (contentRef.current.innerHTML.length > 200 ? '...' : '')
    });
    
    console.log('🔍 Text change detection:', {
      oldTextLength: oldText.length,
      newTextLength: newText.length,
      normalizedOldTextLength: normalizedOldText.length,
      normalizedNewTextLength: normalizedNewText.length,
      oldTextSample: oldText.substring(0, 50) + (oldText.length > 50 ? '...' : ''),
      newTextSample: newText.substring(0, 50) + (newText.length > 50 ? '...' : '')
    })
    
    // Detect and emit text changes using the same text extraction as cursor position
  const cursorText = contentRef.current.innerText || contentRef.current.textContent || ''
    console.log('🔍 Sender cursor-style text lines:', cursorText.split('\n').slice(0, 3).map((line, i) => `Line ${i}: "${line}"`));
    
    // Only detect text changes if not applying remote changes
    if (!isApplyingRemoteChange.current) {
      console.log('🔍 Detecting text changes (not remote update)');
      console.log('🔍 Text change details:', {
        oldTextLength: oldText.length,
        newTextLength: newText.length,
        oldTextSample: oldText.substring(0, 100) + (oldText.length > 100 ? '...' : ''),
        newTextSample: newText.substring(0, 100) + (newText.length > 100 ? '...' : '')
      });
      detectTextChanges(oldText, newText) // Use original text, not normalized
    } else {
      console.log('🚫 Skipping text change detection during remote update')
    }
    
    // Update content
    setInternalContent(newContent)
    lastExternalContent.current = newContent
    previousContent.current = newContent
    
    if (onContentChange) {
      onContentChange(newContent)
    }

    // Track cursor position after input
    trackCursorPosition()

    // Clear existing timeout
    if (userEditingTimeout.current) {
      clearTimeout(userEditingTimeout.current)
    }

    // Reset editing state after user stops typing
    userEditingTimeout.current = setTimeout(() => {
      setIsUserEditing(false)
    }, 500)
  }, [isStreaming, onContentChange, trackCursorPosition, detectTextChanges])

  // Handle other events
  const handleFocus = useCallback(() => {
    if (!isStreaming) {
      setIsUserEditing(true)
      trackCursorPosition()
    }
  }, [isStreaming, trackCursorPosition])

  const handleBlur = useCallback(() => {
    if (userEditingTimeout.current) {
      clearTimeout(userEditingTimeout.current)
    }
    
    setTimeout(() => {
      setIsUserEditing(false)
    }, 100)
  }, [])

  const handleKeyDown = useCallback((e) => {
    if (isStreaming) {
      e.preventDefault()
      return false
    }
    
    // Handle Space key explicitly to avoid innerText normalization issues
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault()

      const cursorPosition = getCursorPosition()
      if (!cursorPosition) {
        console.log('❌ No cursor position available for Space key')
        return false
      }

      // Send a single space through WebSocket
      if (onTextInsert) {
        console.log('⎵ Space key pressed, sending space at:', cursorPosition)
        onTextInsert(' ', cursorPosition)
      }

      // Prevent duplicate detection while we insert locally
      isApplyingRemoteChange.current = true

      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        const textNode = document.createTextNode(' ')
        range.insertNode(textNode)
        range.setStartAfter(textNode)
        range.setEndAfter(textNode)
        selection.removeAllRanges()
        selection.addRange(range)

        // Trigger input event to update content/state
        if (contentRef.current) {
          const event = new Event('input', { bubbles: true })
          contentRef.current.dispatchEvent(event)
        }
      }

      // Immediately send updated cursor position to collaborators
      try { trackCursorPosition() } catch {}

      setTimeout(() => {
        isApplyingRemoteChange.current = false
      }, 50)

      return false
    }

    // Handle Enter key for new line creation
    if (e.key === 'Enter') {
      e.preventDefault()
      
      // Get current cursor position
      const cursorPosition = getCursorPosition()
      if (!cursorPosition) {
        console.log('❌ No cursor position available for Enter key')
        return false
      }
      
      // If there's a selection, emit delete for that selection first
      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        if (!range.collapsed && onTextDelete) {
          const startPos = cursorPosition
          // Compute end position via preEndRange
          const preEndRange = document.createRange()
          preEndRange.selectNodeContents(contentRef.current)
          preEndRange.setEnd(range.endContainer, range.endOffset)
          const textBeforeEnd = preEndRange.toString()
          const endPos = { ch: textBeforeEnd.length }
          console.log('🗑️ Enter over selection, deleting before newline:', { from: startPos, to: endPos })
          onTextDelete(startPos, endPos)
        }
      }

      console.log('↵ Enter key pressed, sending newline (\\n):', {
        position: `L${cursorPosition.line}:C${cursorPosition.ch}`,
        text: '\n'
      })
      
      // Send newline through WebSocket (receiver converts to <br>)
      if (onTextInsert) {
        onTextInsert('\n', cursorPosition)
      }
      
      // Set flag to prevent automatic text change detection
      isApplyingRemoteChange.current = true
      
      // Insert the <br> tag in the DOM
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        // Create a <br> element and insert it
        const brElement = document.createElement('br')
        range.deleteContents()
        range.insertNode(brElement)
        
        // Ensure there is a text node after <br> for a stable caret anchor (empty so it doesn't affect offsets)
        let after = brElement.nextSibling
        if (!after || after.nodeType !== Node.TEXT_NODE) {
          const emptyText = document.createTextNode('')
          brElement.parentNode?.insertBefore(emptyText, brElement.nextSibling)
          after = emptyText
        }
        
        // Move cursor to the start of the following text node
        const newRange = document.createRange()
        newRange.setStart(after, 0)
        newRange.setEnd(after, 0)
        selection.removeAllRanges()
        selection.addRange(newRange)
        
        // Trigger content change to update the document
        if (contentRef.current) {
          const event = new Event('input', { bubbles: true })
          contentRef.current.dispatchEvent(event)
        }
      }
      
      // Immediately send updated cursor position to collaborators
      try { trackCursorPosition() } catch {}
      // Schedule extra checks to ensure post-Enter position is correct after layout
      if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
        try { requestAnimationFrame(() => { try { trackCursorPosition() } catch {} }) } catch {}
      }
      setTimeout(() => { try { trackCursorPosition() } catch {} }, 30)

      // Reset flag after a short delay to allow the change to settle
      setTimeout(() => {
        isApplyingRemoteChange.current = false
      }, 100)
      
      return false
    }
    
    // Track position on arrow keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
      setTimeout(trackCursorPosition, 0)
    }
    
    // Handle special keys that might delete text
    if (e.key === 'Backspace' || e.key === 'Delete') {
      // Get current selection/cursor position before the deletion
      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        
        if (!range.collapsed) {
          // Text is selected - it will be deleted
          const startPos = getCursorPosition()
          
          // Calculate end position
          const preEndRange = document.createRange()
          preEndRange.selectNodeContents(contentRef.current)
          preEndRange.setEnd(range.endContainer, range.endOffset)
          
          const textBeforeEnd = preEndRange.toString()
          const endLines = textBeforeEnd.split('\n')
          const endPos = {
            line: endLines.length - 1,
            ch: endLines[endLines.length - 1].length
          }
          
          // The handleInput will detect this deletion, but we can log it here
          console.log('🗑️ Selection will be deleted:', { from: startPos, to: endPos })
        }
      }
    }
  }, [isStreaming, trackCursorPosition, getCursorPosition, onTextInsert])

  const handlePaste = useCallback((e) => {
    if (isStreaming) {
      e.preventDefault()
      return false
    }
    
    // NEW: Skip paste handling if remote changes are being applied
    if (isApplyingRemoteChange.current) {
      console.log('🚫 Skipping paste handling - remote change in progress')
      e.preventDefault()
      return false
    }
    
    e.preventDefault()
    
    const paste = (e.clipboardData || window.clipboardData).getData('text/plain')
    const pastePosition = getCursorPosition()
    
    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      
      // If there's selected text, it will be deleted
      if (!range.collapsed) {
        const startPos = getCursorPosition()
        
        // Calculate end position
        const preEndRange = document.createRange()
        preEndRange.selectNodeContents(contentRef.current)
        preEndRange.setEnd(range.endContainer, range.endOffset)
        
        const textBeforeEnd = preEndRange.toString()
        const endLines = textBeforeEnd.split('\n')
        const endPos = {
          line: endLines.length - 1,
          ch: endLines[endLines.length - 1].length
        }
        
        // Emit delete event for the selection
        if (onTextDelete) {
          console.log('🗑️ Pasting over selection, deleting:', { from: startPos, to: endPos })
          onTextDelete(startPos, endPos)
        }
      }
      
      range.deleteContents()
      
      const textNode = document.createTextNode(paste)
      range.insertNode(textNode)
      
      // Emit insert event for the pasted text
      if (onTextInsert && pastePosition) {
        console.log('📝 Text pasted:', {
          text: paste.substring(0, 100) + (paste.length > 100 ? '...' : ''),
          position: pastePosition,
          textLength: paste.length
        })
        onTextInsert(paste, pastePosition)
      }
      
      range.setStartAfter(textNode)
      range.setEndAfter(textNode)
      selection.removeAllRanges()
      selection.addRange(range)
    }
    
    setTimeout(() => {
      if (contentRef.current) {
        const newContent = contentRef.current.innerHTML
        setInternalContent(newContent)
        lastExternalContent.current = newContent
        previousContent.current = newContent
        
        if (onContentChange) {
          onContentChange(newContent)
        }

        
        trackCursorPosition()
      }
    }, 0)
  }, [isStreaming, onContentChange, trackCursorPosition, getCursorPosition, onTextInsert, onTextDelete])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (userEditingTimeout.current) {
        clearTimeout(userEditingTimeout.current)
      }
    }
  }, [])



  return (
    <div className="relative">
        {isStreaming && (
          <div className="absolute top-2 right-2 z-10">
            <div className="flex items-center space-x-2 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-700 dark:text-blue-300">Generating...</span>
            </div>
          </div>
        )}
        
        {/* Remote Cursors Layer */}
        <div className="absolute inset-0 pointer-events-none z-20" style={{ overflow: 'hidden' }}>
          {remoteCursors.map((cursor) => {
            const pixelPos = getPixelPosition(cursor.position)
            if (!pixelPos) return null
            
            return (
              <div
                key={cursor.userId}
                className="absolute transition-all duration-100"
                style={{
                  left: `${pixelPos.x}px`,
                  top: `${pixelPos.y}px`,
                  transform: 'translateY(-2px)'
                }}
              >
                {/* Cursor line */}
                <div
                  className="w-0.5 h-5 animate-pulse"
                  style={{ backgroundColor: cursor.userColor || '#3B82F6' }}
                />
                {/* User label */}
                <div
                  className="absolute top-5 left-0 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap shadow-lg"
                  style={{ 
                    backgroundColor: cursor.userColor || '#3B82F6',
                    fontSize: '11px'
                  }}
                >
                  {cursor.userName || 'Anonymous'}
                </div>
              </div>
            )
          })}
        </div>
        
        <div
          ref={contentRef}
          className={`${className} ${isStreaming ? 'streaming-content' : ''} ${isUserEditing ? 'user-editing' : ''}`}
          contentEditable={editable && !isStreaming}
          suppressContentEditableWarning={true}
          onInput={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}

          onClick={trackCursorPosition}
          style={{
            outline: 'none',
            minHeight: '400px',
            cursor: isStreaming ? 'not-allowed' : 'text',
            userSelect: isStreaming ? 'none' : 'text',
            pointerEvents: isStreaming ? 'none' : 'auto',
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            overflow: 'hidden',
            overflowY: 'auto',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}
          placeholder={!internalContent ? "Start typing your document..." : undefined}
        />
      
      <style jsx>{`
        
        .streaming-content {
          border-left: 3px solid #3b82f6;
          animation: pulse-border 2s infinite;
        }
        
        .user-editing {
          border-left: 3px solid #10b981;
        }
        
        @keyframes pulse-border {
          0%, 100% {
            border-left-color: #3b82f6;
          }
          50% {
            border-left-color: #60a5fa;
          }
        }
        
        [contenteditable]:empty:before {
          content: attr(placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        [contenteditable] {
          word-wrap: break-word !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
          white-space: pre-wrap !important;
          max-width: 100% !important;
          overflow-x: hidden !important;
          line-height: 1.90rem !important;
          padding: 1rem !important;
        }
        
        [contenteditable] * {
          max-width: 100% !important;
          word-wrap: break-word !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
          line-height: 1.90rem !important;
          margin: 0.25rem 0 !important;
        }
        
        [contenteditable] p {
          margin: 0.5rem 0 !important;
          padding: 0.25rem 0 !important;
          line-height: 1.90rem !important;
        }
        
        [contenteditable] div {
          margin: 0.25rem 0 !important;
          padding: 0.25rem 0 !important;
          line-height: 1.90rem !important;
        }
        
        [contenteditable] pre,
        [contenteditable] code {
          white-space: pre-wrap !important;
          word-break: break-all !important;
          overflow-wrap: break-word !important;
          line-height: 1.90rem !important;
          margin: 0.25rem 0 !important;
        }
        
        [contenteditable] {
          font-size: 1rem;
          line-height: 1.90rem !important;
        }
        

        
        /* Additional spacing for better readability */
        [contenteditable] br {
          line-height: 0.5rem !important;
        }
        
        [contenteditable] br + br {
          line-height: 0.90rem !important;
        }
      `}</style>
    </div>
  )
})

StreamingDocumentViewer.displayName = 'StreamingDocumentViewer'

export default StreamingDocumentViewer
