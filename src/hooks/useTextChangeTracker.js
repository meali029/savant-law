import { useState, useEffect, useRef, useCallback } from 'react';
import { DocumentAPI } from '../services/documentApi';

export const useTextChangeTracker = (documentContent, contractId, onSuggestedChanges) => {
  const [isTracking, setIsTracking] = useState(false);
  const [pendingChanges, setPendingChanges] = useState([]);
  
  // Refs to track state without causing re-renders
  const previousContentRef = useRef('');
  const debounceTimerRef = useRef(null);
  const isProcessingRef = useRef(false);
  
  // Process pending changes and call API
  const processPendingChanges = useCallback(async (currentContent) => {
    if (pendingChanges.length === 0 || isProcessingRef.current || !contractId) return;
    
    setIsTracking(true);
    isProcessingRef.current = true;
    
    try {
      console.log('Processing pending changes:', pendingChanges);
      
      // Convert document content to pages (split by page breaks or use as single page)
      const pages = splitContentIntoPages(currentContent);
      
      // Call the API
      const response = await DocumentAPI.getSuggestedChanges(pendingChanges, pages);
      
      if (response.success && response.suggestedChanges?.length > 0) {
        console.log('Received suggested changes:', response.suggestedChanges);
        
        // Transform API response to match SuggestedChangesView format
        const transformedSuggestions = response.suggestedChanges.map((change, index) => ({
          id: Date.now() + index,
          title: change.title || `Change ${index + 1}`,
          number: index + 1,
          original: change.original,
          suggested: change.suggested,
          type: 'suggestion',
          impact: change.header || 'Related Change',
          confidence: change.confidence,
          reason: change.reason
        }));
        
        // Call the callback to update the UI
        if (onSuggestedChanges) {
          onSuggestedChanges(transformedSuggestions);
        }
      }
      
      // Clear pending changes
      setPendingChanges([]);
      
    } catch (error) {
      console.error('Error processing text changes:', error);
    } finally {
      setIsTracking(false);
      isProcessingRef.current = false;
    }
  }, [pendingChanges, contractId, onSuggestedChanges]);

  // Track content changes and detect text modifications
  const trackContentChange = useCallback((newContent) => {
    if (isProcessingRef.current || !contractId) return;
    
    const previousContent = previousContentRef.current;
    previousContentRef.current = newContent;
    
    // Skip if no previous content or content is empty
    if (!previousContent || !newContent) return;
    
    // Convert HTML to plain text for comparison
    const extractText = (html) => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      return tempDiv.textContent || tempDiv.innerText || '';
    };
    
    const oldText = extractText(previousContent).trim();
    const newText = extractText(newContent).trim();
    
    // Skip if texts are identical
    if (oldText === newText) return;
    
    console.log('Text change detected:', { oldText: oldText.substring(0, 100), newText: newText.substring(0, 100) });
    
    // Find changes using a simple diff approach
    const changes = findTextChanges(oldText, newText);
    
    if (changes.length > 0) {
      console.log('Found changes:', changes);
      setPendingChanges(prev => [...prev, ...changes]);
      
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Set new timer - wait for user to finish editing
      debounceTimerRef.current = setTimeout(() => {
        processPendingChanges(newContent);
      }, 10000); // 10 seconds delay after last edit
    }
  }, [contractId, processPendingChanges]);

  // Simple text diff function to find changes
  const findTextChanges = (oldText, newText) => {
    const changes = [];
    
    // Split into words for comparison
    const oldWords = oldText.split(/\s+/);
    const newWords = newText.split(/\s+/);
    
    // Find sequences of changes
    let i = 0, j = 0;
    while (i < oldWords.length && j < newWords.length) {
      if (oldWords[i] !== newWords[j]) {
        // Found a difference - try to find the span of change
        let oldEnd = i;
        let newEnd = j;
        
        // Look ahead to find where texts converge again
        let found = false;
        for (let k = i + 1; k < Math.min(i + 10, oldWords.length) && !found; k++) {
          for (let l = j + 1; l < Math.min(j + 10, newWords.length) && !found; l++) {
            if (oldWords[k] === newWords[l]) {
              oldEnd = k;
              newEnd = l;
              found = true;
            }
          }
        }
        
        if (!found) {
          // Take a reasonable chunk
          oldEnd = Math.min(i + 5, oldWords.length);
          newEnd = Math.min(j + 5, newWords.length);
        }
        
        const fromText = oldWords.slice(i, oldEnd).join(' ');
        const toText = newWords.slice(j, newEnd).join(' ');
        
        if (fromText && toText && fromText !== toText) {
          changes.push({ from_text: fromText, to_text: toText });
        }
        
        i = oldEnd;
        j = newEnd;
      } else {
        i++;
        j++;
      }
    }
    
    return changes;
  };



  // Split content into pages (simple implementation)
  const splitContentIntoPages = (content) => {
    if (!content) return [];
    
    // Extract text content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // For now, treat the entire document as one page
    // You can enhance this to split by actual page breaks or sections
    return [textContent];
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Update previous content when document content changes externally
  useEffect(() => {
    if (documentContent !== previousContentRef.current) {
      trackContentChange(documentContent);
    }
  }, [documentContent, trackContentChange]);

  // Manual trigger function for immediate analysis
  const triggerAnalysis = useCallback(() => {
    if (pendingChanges.length > 0 && !isProcessingRef.current && contractId) {
      // Clear any existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Trigger immediate analysis
      processPendingChanges(documentContent);
    }
  }, [pendingChanges, contractId, documentContent, processPendingChanges]);

  return {
    isTracking,
    trackContentChange,
    pendingChanges: pendingChanges.length,
    triggerAnalysis // NEW: Manual trigger function
  };
};