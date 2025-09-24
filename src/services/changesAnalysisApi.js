const CHANGES_ANALYSIS_API_URL = 'https://api.getmediarank.com/api/v1/changes_analysis/changes_analysis_stream';

export const ChangesAnalysisAPI = {
  /**
   * Stream changes analysis for document modifications
   * @param {Object} params - The parameters for the changes analysis
   * @param {Array} params.messages - Array of message objects with content and message_type
   * @param {Array} params.pages - Array of page objects with page_number and page_content
   * @param {number} params.number_of_changes - Expected number of changes
   * @param {Function} onChunk - Callback function called for each streaming chunk
   * @param {Function} onComplete - Callback function called when streaming is complete
   * @param {Function} onError - Callback function called on error
   */
  streamChangesAnalysis: async (params, onChunk, onComplete, onError) => {
    try {
      const response = await fetch(CHANGES_ANALYSIS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'change') {
                onChunk(data.data);
              } else if (data.type === 'complete') {
                onComplete(data);
                return;
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in changes analysis stream:', error);
      
      // If it's a network error or API is not available, provide a fallback
      if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
        console.warn('API not available, using fallback response');
        
        // Simulate the API response for testing
        const mockChanges = [
          {
            old_sentence: "Anas",
            new_sentence: "ANAS UPDATED",
            reason: "Testing name replacement",
            page_number: 1
          },
          {
            old_sentence: "Meryem",
            new_sentence: "MERYEM UPDATED",
            reason: "Testing another name replacement",
            page_number: 1
          },
          {
            old_sentence: "Partner 1",
            new_sentence: "PARTNER ONE",
            reason: "Testing partner designation replacement",
            page_number: 1
          },
          {
            old_sentence: "PARTNERSHIP AGREEMENT",
            new_sentence: "UPDATED PARTNERSHIP AGREEMENT",
            reason: "Testing title replacement",
            page_number: 1
          }
        ];
        
        // Simulate streaming
        mockChanges.forEach((change, index) => {
          setTimeout(() => onChunk(change), index * 1000);
        });
        
        setTimeout(() => onComplete({ total_changes: mockChanges.length }), mockChanges.length * 1000 + 500);
        return;
      }
      
      onError(error);
    }
  },

  /**
   * Prepare document pages for the API
   * @param {string} documentContent - The full document content (HTML format)
   * @returns {Array} Array of page objects
   */
  prepareDocumentPages: (documentContent) => {
    if (!documentContent) return [];
    
    console.log('🔧 Preparing document pages with HTML content...');
    console.log('Content type:', typeof documentContent);
    console.log('Content length:', documentContent.length);
    console.log('Content sample:', documentContent.substring(0, 300));
    
    // Split HTML content into pages while preserving HTML structure
    const pages = [];
    const contentLength = documentContent.length;
    const pageSize = 3000; // Increased size for HTML content
    
    for (let i = 0; i < contentLength; i += pageSize) {
      const pageContent = documentContent.slice(i, i + pageSize);
      const pageNumber = Math.floor(i / pageSize) + 1;
      
      // Ensure we don't break in the middle of HTML tags
      let adjustedContent = pageContent;
      if (i + pageSize < contentLength) {
        // Find the last complete HTML tag or word boundary
        const lastTagMatch = pageContent.lastIndexOf('>');
        const lastSpaceMatch = pageContent.lastIndexOf(' ');
        
        if (lastTagMatch > lastSpaceMatch && lastTagMatch > pageContent.length * 0.8) {
          // Break at tag boundary
          adjustedContent = pageContent.substring(0, lastTagMatch + 1);
        } else if (lastSpaceMatch > pageContent.length * 0.8) {
          // Break at word boundary
          adjustedContent = pageContent.substring(0, lastSpaceMatch);
        }
      }
      
      pages.push({
        page_number: pageNumber,
        page_content: adjustedContent
      });
      
      console.log(`Page ${pageNumber} content length:`, adjustedContent.length);
    }
    
    console.log(`✅ Prepared ${pages.length} pages with HTML content`);
    return pages;
  },

  /**
   * Prepare messages for the API
   * @param {string} userRequest - The user's request for changes
   * @returns {Array} Array of message objects
   */
  prepareMessages: (userRequest) => {
    return [
      {
        content: userRequest,
        message_type: "text"
      }
    ];
  }
};
