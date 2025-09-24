import { getToken } from './authApi';

const API_BASE_URL = 'https://api.getmediarank.com/api/v1';

function authHeaders(extraHeaders = {}) {
  const token = getToken();
  return token
    ? { ...extraHeaders, Authorization: `Bearer ${token}` }
    : extraHeaders;
}

export class DocumentAPI {

  // NEW: Format and clean document content for better manipulation
  static formatDocumentContent(content) {
    if (!content) return '';
    
    console.log('🔧 Formatting document content...');
    console.log('Original content length:', content.length);
    
    try {
      // First, convert \n characters to <br> tags for proper HTML line breaks
      let processedContent = content.replace(/\n/g, '<br>');
      
      // Create a temporary div to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = processedContent;
      
      // Function to clean text nodes
      const cleanTextNode = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          // Remove excessive whitespace while preserving intentional spacing
          let cleanedText = node.textContent
            .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
            .replace(/\n\s*/g, '\n')        // Remove spaces after newlines
            .replace(/\s*\n/g, '\n')        // Remove spaces before newlines
            .replace(/\n{3,}/g, '\n\n')     // Limit consecutive newlines to max 2
            .trim();                        // Remove leading/trailing whitespace
          
          // Only update if there's a meaningful change
          if (cleanedText !== node.textContent) {
            node.textContent = cleanedText;
          }
        }
      };
      
      // Function to clean element nodes
      const cleanElementNode = (element) => {
        // Clean text nodes within this element
        const walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
          textNodes.push(node);
        }
        
        textNodes.forEach(cleanTextNode);
        
        // Handle specific elements that need special treatment
        const tagName = element.tagName.toLowerCase();
        
        // For paragraphs, ensure proper spacing
        if (tagName === 'p') {
          // Remove empty paragraphs or paragraphs with only whitespace
          if (!element.textContent.trim()) {
            element.remove();
            return;
          }
          
          // Ensure paragraphs don't have excessive internal spacing
          const textContent = element.textContent.trim();
          if (textContent) {
            element.textContent = textContent;
          }
        }
        
        // For divs, clean up excessive line breaks
        if (tagName === 'div') {
          // Remove divs that are empty or contain only whitespace
          if (!element.textContent.trim() && !element.children.length) {
            element.remove();
            return;
          }
        }
        
        // Clean up spans that are empty or redundant
        if (tagName === 'span') {
          if (!element.textContent.trim()) {
            element.remove();
            return;
          }
          
          // If span has no attributes and contains only text, unwrap it
          if (element.attributes.length === 0 && element.children.length === 0) {
            const textNode = document.createTextNode(element.textContent);
            element.parentNode.insertBefore(textNode, element);
            element.remove();
            return;
          }
        }
      };
      
      // Clean the entire document
      cleanElementNode(tempDiv);
      
      // Get the cleaned HTML
      let cleanedHTML = tempDiv.innerHTML;
      
      // Additional cleanup for common issues
      cleanedHTML = cleanedHTML
        // Remove excessive line breaks between elements
        .replace(/>\s*\n\s*</g, '>\n<')
        // Preserve spacing around inline elements (strong, em, span, etc.)
        .replace(/>\s+</g, '> <')  // Ensure single space between tags
        .replace(/>\s*</g, '> <')  // Add space if no space exists
        // Normalize line breaks
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        // Remove empty lines
        .replace(/\n\s*\n/g, '\n')
        // Clean up excessive whitespace in attributes
        .replace(/\s*=\s*/g, '=')
        .replace(/\s*"\s*/g, '"')
        // Remove trailing whitespace
        .trim();
      
      // NEW: Fix spacing around inline elements to prevent text running together
      cleanedHTML = cleanedHTML
        // Ensure space after closing strong tags
        .replace(/<\/strong>(\w)/g, '</strong> $1')
        // Ensure space before opening strong tags
        .replace(/(\w)<strong>/g, '$1 <strong>')
        // Ensure space after closing em tags
        .replace(/<\/em>(\w)/g, '</em> $1')
        // Ensure space before opening em tags
        .replace(/(\w)<em>/g, '$1 <em>')
        // Ensure space after closing span tags
        .replace(/<\/span>(\w)/g, '</span> $1')
        // Ensure space before opening span tags
        .replace(/(\w)<span>/g, '$1 <span>')
        // Ensure space after closing b tags
        .replace(/<\/b>(\w)/g, '</b> $1')
        // Ensure space before opening b tags
        .replace(/(\w)<b>/g, '$1 <b>')
        // Ensure space after closing i tags
        .replace(/<\/i>(\w)/g, '</i> $1')
        // Ensure space before opening i tags
        .replace(/(\w)<i>/g, '$1 <i>');
      
      console.log('✅ Document content formatted successfully');
      console.log('Formatted content length:', cleanedHTML.length);
      
      return cleanedHTML;
      
    } catch (error) {
      console.error('❌ Error formatting document content:', error);
      // Return original content if formatting fails
      return content;
    }
  }

  // NEW: Utility method to extract clean text from HTML content
  static extractCleanText(htmlContent) {
    if (!htmlContent) return '';
    
    try {
      // First convert \n to <br> tags if they exist as literal strings
      let processedContent = htmlContent.replace(/\\n/g, '<br>');
      
      // Create a temporary div to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = processedContent;
      
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
    } catch (error) {
      console.error('❌ Error extracting clean text:', error);
      return htmlContent;
    }
  }

  // NEW: Utility method to normalize content for comparison
  static normalizeContentForComparison(content) {
    if (!content) return '';
    
    // First convert \n to <br> tags if they exist as literal strings
    let processedContent = content.replace(/\\n/g, '<br>');
    
    return this.extractCleanText(processedContent)
      .toLowerCase()
      .replace(/[^\w\s]/g, '')  // Remove punctuation
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .trim();
  }

  // NEW: Flexible text matching that handles spacing variations and preserves punctuation
  static findFlexibleTextMatch(documentContent, searchText, replacementText) {
    if (!documentContent || !searchText) {
      console.log('❌ Missing content or search text for flexible matching');
      return null;
    }

    console.log('🔍 Starting flexible text matching...');
    console.log('Search text:', searchText);
    console.log('Replacement text:', replacementText);
    console.log('Document content sample:', documentContent.substring(0, 200));

    // Method 1: Try exact match first
    if (documentContent.includes(searchText)) {
      console.log('✅ Exact match found');
      return {
        method: 'exact',
        updatedContent: documentContent.replace(searchText, replacementText)
      };
    }

    // Method 2: Try with normalized whitespace (handles multiple spaces, tabs, etc.)
    const normalizeWhitespace = (text) => {
      return text
        .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
        .trim();
    };

    const normalizedSearch = normalizeWhitespace(searchText);
    const normalizedContent = normalizeWhitespace(documentContent);

    if (normalizedContent.includes(normalizedSearch)) {
      console.log('✅ Normalized whitespace match found');
      // Find the actual text in the original content with flexible whitespace
      const flexiblePattern = searchText.replace(/\s+/g, '\\s+');
      const regex = new RegExp(flexiblePattern, 'g');
      
      if (regex.test(documentContent)) {
        const updatedContent = documentContent.replace(regex, replacementText);
        return {
          method: 'flexible_whitespace',
          updatedContent: updatedContent
        };
      }
    }

    // Method 3: Try with bracket spacing variations (specific to the user's issue)
    const bracketVariations = [
      searchText,
      searchText.replace(/\s*–\s*/g, '–'),  // Remove spaces around en dash
      searchText.replace(/\s*–\s*/g, ' – '), // Add spaces around en dash
      searchText.replace(/\s*-\s*/g, '-'),   // Remove spaces around hyphen
      searchText.replace(/\s*-\s*/g, ' - '), // Add spaces around hyphen
      searchText.replace(/\s*—\s*/g, '—'),  // Remove spaces around em dash
      searchText.replace(/\s*—\s*/g, ' — '), // Add spaces around em dash
    ];

    // Method 3.5: Try with HTML tag variations (for cases where API returns plain text but document has HTML)
    const htmlVariations = [
      searchText,
      // Add <strong> tags around names
      searchText.replace(/(\w+)\s+(\w+)/g, '<strong>$1 $2</strong>'),
      // Add <strong> tags around single words (for cases like "Brian Patel")
      searchText.replace(/(\w+)/g, '<strong>$1</strong>'),
    ];

    for (const variation of bracketVariations) {
      if (documentContent.includes(variation)) {
        console.log('✅ Bracket spacing variation match found:', variation);
        return {
          method: 'bracket_variation',
          updatedContent: documentContent.replace(variation, replacementText)
        };
      }
    }

    // Try HTML variations
    for (const variation of htmlVariations) {
      if (documentContent.includes(variation)) {
        console.log('✅ HTML variation match found:', variation);
        // Create corresponding replacement with HTML tags
        let htmlReplacement = replacementText;
        if (variation.includes('<strong>')) {
          // Add <strong> tags to replacement text
          htmlReplacement = replacementText.replace(/(\w+)\s+(\w+)/g, '<strong>$1 $2</strong>');
        }
        return {
          method: 'html_variation',
          updatedContent: documentContent.replace(variation, htmlReplacement)
        };
      }
    }

    // Method 4: Try with case-insensitive matching
    const caseInsensitiveRegex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    if (caseInsensitiveRegex.test(documentContent)) {
      console.log('✅ Case-insensitive match found');
      const updatedContent = documentContent.replace(caseInsensitiveRegex, replacementText);
      return {
        method: 'case_insensitive',
        updatedContent: updatedContent
      };
    }

    // Method 5: Try with punctuation variations
    const punctuationVariations = [
      searchText,
      searchText.replace(/[–—]/g, '-'),  // Convert dashes to hyphens
      searchText.replace(/[-–—]/g, '–'), // Convert all to en dash
      searchText.replace(/[-–—]/g, '—'), // Convert all to em dash
    ];

    for (const variation of punctuationVariations) {
      if (documentContent.includes(variation)) {
        console.log('✅ Punctuation variation match found:', variation);
        return {
          method: 'punctuation_variation',
          updatedContent: documentContent.replace(variation, replacementText)
        };
      }
    }

    // Method 6: Try with HTML entity variations
    const htmlEntityVariations = [
      searchText,
      searchText.replace(/–/g, '&ndash;'),
      searchText.replace(/—/g, '&mdash;'),
      searchText.replace(/&ndash;/g, '–'),
      searchText.replace(/&mdash;/g, '—'),
    ];

    for (const variation of htmlEntityVariations) {
      if (documentContent.includes(variation)) {
        console.log('✅ HTML entity variation match found:', variation);
        return {
          method: 'html_entity_variation',
          updatedContent: documentContent.replace(variation, replacementText)
        };
      }
    }

    // Method 7: Try with word boundary matching (most flexible)
    const words = searchText.split(/\s+/).filter(word => word.length > 0);
    if (words.length > 1) {
      // Create a pattern that matches words in sequence with flexible spacing
      const wordPattern = words.map(word => 
        word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      ).join('\\s+');
      
      const wordRegex = new RegExp(wordPattern, 'gi');
      if (wordRegex.test(documentContent)) {
        console.log('✅ Word boundary match found');
        const updatedContent = documentContent.replace(wordRegex, replacementText);
        return {
          method: 'word_boundary',
          updatedContent: updatedContent
        };
      }
    }

    // Method 8: Try HTML-aware text matching (most sophisticated)
    const htmlAwareMatch = findHTMLAwareMatch(documentContent, searchText, replacementText);
    if (htmlAwareMatch) {
      console.log('✅ HTML-aware match found');
      return htmlAwareMatch;
    }

    console.log('❌ No flexible match found');
    return null;
  }

  // Helper function for HTML-aware text matching
  static findHTMLAwareMatch(documentContent, searchText, replacementText) {
    try {
      // Create a temporary div to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = documentContent;
      
      // Function to recursively search and replace text in DOM nodes
      const searchAndReplaceInNode = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const nodeText = node.textContent;
          if (nodeText.includes(searchText)) {
            // Found the text in this text node
            const newText = nodeText.replace(searchText, replacementText);
            node.textContent = newText;
            return true;
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          // Search in child nodes
          for (let child of node.childNodes) {
            if (searchAndReplaceInNode(child)) {
              return true;
            }
          }
        }
        return false;
      };
      
      // Try to find and replace
      const replaced = searchAndReplaceInNode(tempDiv);
      if (replaced) {
        return {
          method: 'html_aware_dom',
          updatedContent: tempDiv.innerHTML
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error in HTML-aware matching:', error);
      return null;
    }
  }

  // NEW: Fix spacing issues in HTML content from API
  static fixHTMLSpacing(content) {
    if (!content) return '';
    
    console.log('🔧 Fixing HTML spacing issues...');
    
    let fixedContent = content
      // Fix spacing around inline elements
      .replace(/<\/strong>(\w)/g, '</strong> $1')
      .replace(/(\w)<strong>/g, '$1 <strong>')
      .replace(/<\/em>(\w)/g, '</em> $1')
      .replace(/(\w)<em>/g, '$1 <em>')
      .replace(/<\/span>(\w)/g, '</span> $1')
      .replace(/(\w)<span>/g, '$1 <span>')
      .replace(/<\/b>(\w)/g, '</b> $1')
      .replace(/(\w)<b>/g, '$1 <b>')
      .replace(/<\/i>(\w)/g, '</i> $1')
      .replace(/(\w)<i>/g, '$1 <i>')
      // Fix spacing around brackets
      .replace(/\](\w)/g, '] $1')
      .replace(/(\w)\[/g, '$1 [')
      // Normalize multiple spaces to single space
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log('✅ HTML spacing fixed');
    return fixedContent;
  }

  // NEW: Test function for HTML spacing issues
  static testHTMLSpacing(content) {
    if (!content) return '';
    
    console.log('🧪 Testing HTML spacing...');
    console.log('Original content sample:', content.substring(0, 300));
    
    const fixedContent = this.fixHTMLSpacing(content);
    console.log('Fixed content sample:', fixedContent.substring(0, 300));
    
    // Test specific patterns
    const testPatterns = [
      /<\/strong>(\w)/g,
      /(\w)<strong>/g,
      /\](\w)/g,
      /(\w)\[/g
    ];
    
    testPatterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        console.log(`Pattern ${index + 1} found ${matches.length} matches:`, matches.slice(0, 5));
      }
    });
    
    return fixedContent;
  }

  // NEW: Get document score
static async getDocumentScore(contractId) {
  console.log('📊 DocumentAPI.getDocumentScore called');
  console.log('contractId:', contractId);
  
  try {
    const url = `${API_BASE_URL}/contracts/${contractId}/score`;
    console.log('Score API URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: authHeaders(),
    });
    
    console.log('Score API Response status:', response.status);
    console.log('Score API Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Score API Error response:', errorText);
      throw new Error(`Get score failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Score API Response data:', data);
    
    return {
      success: true,
      contract_id: data.contract_id,
      score: data.score
    };
  } catch (error) {
    console.error('❌ Error in getDocumentScore:', error);
    throw error;
  }
}

// Update document score
static async updateDocumentScore(contractId, score) {
  console.log('📝 DocumentAPI.updateDocumentScore called');
  console.log('contractId:', contractId);
  console.log('score:', score);
  
  try {
    const url = `${API_BASE_URL}/contracts/${contractId}/score`;
    console.log('Update Score API URL:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ score }),
    });
    
    console.log('Update Score API Response status:', response.status);
    console.log('Update Score API Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update Score API Error response:', errorText);
      throw new Error(`Update score failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Update Score API Response data:', data);
    
    return {
      success: true,
      contract_id: data.contract_id,
      score: data.score,
      status: data.status
    };
  } catch (error) {
    console.error('❌ Error in updateDocumentScore:', error);
    throw error;
  }
}


  // NEW: Get risk categories with streaming
static async getRiskCategories(content, onProgress, onComplete, onError) {
  console.log('📊 DocumentAPI.getRiskCategories called (streaming)');
  console.log('content length:', content?.length || 0);
  
  try {
    const url = `${API_BASE_URL}/risk_categories_analyze_stream`;
    console.log('Risk Categories Streaming API URL:', url);
    
    const requestBody = { content };
    console.log('Request body:', requestBody);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(requestBody),
    });
    
    console.log('Risk Categories Streaming API Response status:', response.status);
    console.log('Risk Categories Streaming API Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Risk Categories Streaming API Error response:', errorText);
      throw new Error(`Risk categories analysis failed: ${response.status} ${response.statusText}`);
    }
    
    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let buffer = '';
    let categories = [];
    let isComplete = false;
    let currentStatus = null;
    
    while (!isComplete) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('Risk categories stream completed');
        isComplete = true;
        break;
      }
      
      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.trim() === '') continue;
        
        // Parse Server-Sent Events format
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.substring(6); // Remove 'data: ' prefix
            const data = JSON.parse(jsonStr);
            
            console.log('Received risk categories streaming data:', data);
            
            if (data.status === 'started') {
              console.log('Risk categories analysis started:', data.message);
              currentStatus = 'started';
              if (onProgress) {
                onProgress({
                  type: 'started',
                  message: data.message,
                  categories: [],
                  status: 'started'
                });
              }
            } else if (data.category) {
              // Add category to our collection
              const newCategory = {
                ...data.category,
                id: `category_${Date.now()}_${categories.length}`,
                timestamp: new Date().toISOString()
              };
              
              categories.push(newCategory);
              console.log('New category received, total categories:', categories.length);
              
              if (onProgress) {
                onProgress({
                  type: 'category',
                  category: newCategory,
                  categories: [...categories],
                  progress: data.progress,
                  status: currentStatus || 'analyzing'
                });
              }
            } else if (data.status === 'completed') {
              console.log('Risk categories analysis completed, total:', data.total_categories);
              isComplete = true;
              
              if (onComplete) {
                onComplete({
                  categories: categories,
                  totalCategories: data.total_categories,
                  status: 'completed',
                  message: data.message
                });
              }
            } else if (data.status === 'error') {
              console.error('Risk categories analysis error:', data.error);
              isComplete = true;
              
              if (onError) {
                onError(new Error(data.error || 'Risk categories analysis failed'));
              }
            }
          } catch (parseError) {
            console.error('Error parsing risk categories streaming data:', parseError, 'Line:', line);
          }
        }
      }
    }
    
    return {
      success: true,
      categories: categories
    };
  } catch (error) {
    console.error('❌ Error in getRiskCategories:', error);
    if (onError) {
      onError(error);
    }
    throw error;
  }
}


// NEW: Check document PDF parsing status
static async getDocumentStatus(contractId) {
  console.log('📊 DocumentAPI.getDocumentStatus called');
  console.log('contractId:', contractId);
  
  try {
    const url = `${API_BASE_URL}/contracts/${contractId}/pdf_parsing_status`;
    console.log('Status API URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: authHeaders(),
    });
    
    console.log('Status API Response status:', response.status);
    console.log('Status API Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Status API Error response:', errorText);
      throw new Error(`Status check failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Status API Response data:', data);
    
    return {
      success: true,
      status: data.status, // 'in_progress', 'done', or 'error'
      progress: data.progress,
      error: data.error
    };
  } catch (error) {
    console.error('❌ Error in getDocumentStatus:', error);
    throw error;
  }
}

// NEW: Jurisdiction Change Analysis with Streaming
static async analyzeJurisdictionChange(regionName, pages, onProgress, onComplete, onError) {
  console.log('📊 DocumentAPI.analyzeJurisdictionChange called');
  console.log('regionName:', regionName);
  console.log('pages count:', pages?.length || 0);
  
  try {
    const url = `${API_BASE_URL}/jurisdiction/jurisdiction-change`;
    console.log('Jurisdiction Change API URL:', url);
    
    const requestBody = {
      region_name: regionName,
      pages: pages
    };
    console.log('Request body:', requestBody);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(requestBody),
    });
    
    console.log('Jurisdiction Change API Response status:', response.status);
    console.log('Jurisdiction Change API Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Jurisdiction Change API Error response:', errorText);
      throw new Error(`Jurisdiction change analysis failed: ${response.status} ${response.statusText}`);
    }
    
    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let buffer = '';
    let changes = [];
    let isComplete = false;
    let currentStatus = null;
    let currentPageNumber = null;
    
    while (!isComplete) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('Jurisdiction change stream completed');
        isComplete = true;
        break;
      }
      
      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.trim() === '') continue;
        
        // Parse Server-Sent Events format
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.substring(6); // Remove 'data: ' prefix
            const data = JSON.parse(jsonStr);
            
            console.log('Received jurisdiction change streaming data:', data);
            
            if (data.status === 'started') {
              console.log('Jurisdiction change analysis started:', data.message);
              currentStatus = 'started';
              if (onProgress) {
                onProgress({
                  type: 'started',
                  message: data.message,
                  changes: [],
                  status: 'started'
                });
              }
            } else if (data.status === 'processing_page') {
              console.log('Processing page:', data.page_number);
              currentPageNumber = data.page_number;
              currentStatus = 'processing';
              if (onProgress) {
                onProgress({
                  type: 'processing_page',
                  page_number: data.page_number,
                  message: data.message,
                  changes: [...changes],
                  status: 'processing'
                });
              }
            } else if (data.change) {
              // Add change to our collection
              const newChange = {
                ...data.change,
                id: `jurisdiction_${Date.now()}_${changes.length}`,
                type: 'jurisdiction',
                source: 'jurisdiction_change',
                timestamp: new Date().toISOString()
              };
              
              changes.push(newChange);
              console.log('New jurisdiction change received, total changes:', changes.length);
              
              if (onProgress) {
                onProgress({
                  type: 'change',
                  change: newChange,
                  changes: [...changes],
                  progress: data.progress,
                  status: currentStatus || 'processing'
                });
              }
            } else if (data.status === 'page_completed') {
              console.log('Page completed:', data.page_number);
              if (onProgress) {
                onProgress({
                  type: 'page_completed',
                  page_number: data.page_number,
                  message: data.message,
                  changes: [...changes],
                  status: 'page_completed'
                });
              }
            } else if (data.status === 'completed') {
              console.log('Jurisdiction change analysis completed');
              isComplete = true;
              
              if (onComplete) {
                onComplete({
                  changes: changes,
                  totalChanges: changes.length,
                  status: 'completed',
                  message: data.message
                });
              }
            } else if (data.status === 'error') {
              console.error('Jurisdiction change analysis error:', data.error);
              isComplete = true;
              
              if (onError) {
                onError(new Error(data.error || 'Jurisdiction change analysis failed'));
              }
            }
          } catch (parseError) {
            console.error('Error parsing jurisdiction change streaming data:', parseError, 'Line:', line);
          }
        }
      }
    }
    
    return {
      success: true,
      changes: changes
    };
  } catch (error) {
    console.error('❌ Error in analyzeJurisdictionChange:', error);
    if (onError) {
      onError(error);
    }
    throw error;
  }
}

// Helper method to convert document content to pages format for API
static convertDocumentToPages(documentContent) {
  // For now, we'll treat the entire document as one page
  // You can modify this logic to split content into multiple pages if needed
  return [
    {
      page_number: 1,
      html_content: documentContent
    }
  ];
}

// Helper method to get region name in the format expected by API
static getRegionNameForAPI(regionId) {
  const regionMapping = {
    'us-california': 'USA California',
    'us-newyork': 'USA New York',
    'us-texas': 'USA Texas',
    'us-florida': 'USA Florida',
    'us-illinois': 'USA Illinois',
    'uk': 'United Kingdom',
    'canada': 'Canada',
    'australia': 'Australia'
  };
  
  return regionMapping[regionId] || regionId;
}

  static async analyzeDocuments(contractIds, role, additionalRequirements = '', onProgress, onComplete, onError) {
    console.log('📊 DocumentAPI.analyzeDocuments called');
    console.log('contractIds:', contractIds);
    console.log('role:', role);
    console.log('additionalRequirements:', additionalRequirements);
    
    try {
      const url = `${API_BASE_URL}/analysis/analyze`;
      console.log('Analysis API URL:', url);
      
      const requestBody = {
        contract_ids: contractIds,
        role: role,
        additional_requirements: additionalRequirements || ''
      };
      console.log('Request body:', requestBody);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(requestBody),
      });
      
      console.log('Analysis API Response status:', response.status);
      console.log('Analysis API Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Analysis API Error response:', errorText);
        throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
      }
      
      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let buffer = '';
      let changes = [];
      let isComplete = false;
      
      while (!isComplete) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('Stream completed');
          isComplete = true;
          break;
        }
        
        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          // Parse Server-Sent Events format
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.substring(6); // Remove 'data: ' prefix
              const data = JSON.parse(jsonStr);
              
              console.log('Received streaming data:', data);
              
              if (data.status === 'started') {
                console.log('Analysis started:', data.message);
                if (onProgress) {
                  onProgress({
                    type: 'started',
                    message: data.message,
                    changes: []
                  });
                }
              } else if (data.change) {
                // Add change to our collection
                changes.push(data.change);
                console.log('New change received, total changes:', changes.length);
                
                if (onProgress) {
                  onProgress({
                    type: 'change',
                    change: data.change,
                    changes: [...changes],
                    progress: data.progress
                  });
                }
              } else if (data.status === 'completed') {
                console.log('Analysis completed, total changes:', data.total_changes);
                isComplete = true;
                
                if (onComplete) {
                  onComplete({
                    changes: changes,
                    totalChanges: data.total_changes,
                    status: 'completed'
                  });
                }
              } else if (data.status === 'error') {
                console.error('Analysis error:', data.error);
                isComplete = true;
                
                if (onError) {
                  onError(new Error(data.error || 'Analysis failed'));
                }
              }
            } catch (parseError) {
              console.error('Error parsing streaming data:', parseError, 'Line:', line);
            }
          }
        }
      }
      
      return {
        success: true,
        changes: changes
      };
    } catch (error) {
      console.error('❌ Error in analyzeDocuments:', error);
      if (onError) {
        onError(error);
      }
      throw error;
    }
  }


  // NEW: Update document version
  static async updateDocumentVersion(contractId, version) {
    console.log('📝 DocumentAPI.updateDocumentVersion called');
    console.log('contractId:', contractId);
    console.log('version:', version);
    
    try {
      const url = `${API_BASE_URL}/contracts/${contractId}/version`;
      console.log('Update Version API URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ version }),
      });
      
      console.log('Update Version API Response status:', response.status);
      console.log('Update Version API Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update Version API Error response:', errorText);
        throw new Error(`Version update failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Update Version API Response data:', data);
      
      return {
        success: true,
        contract_id: data.contract_id,
        version: data.version,
        status: data.status
      };
    } catch (error) {
      console.error('❌ Error in updateDocumentVersion:', error);
      throw error;
    }
  }



     // NEW: Upload document from PDF
  static async uploadDocumentFromPDF(projectId, file, description) {
    console.log('📤 DocumentAPI.uploadDocumentFromPDF called');
    console.log('projectId:', projectId);
    console.log('file:', file?.name || 'No file');
    console.log('description:', description);
    
    try {
      const url = `${API_BASE_URL}/contracts/from_pdf`;
      console.log('Upload API URL:', url);
      
      const formData = new FormData();
      formData.append('project_id', projectId);
      formData.append('description', description || 'Uploaded document');
      formData.append('file', file);
      
      console.log('FormData prepared');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });
      
      console.log('Upload API Response status:', response.status);
      console.log('Upload API Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload API Error response:', errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Upload API Response data:', data);
      
      return {
        success: true,
        contract_id: data.contract_id,
        project_id: data.project_id,
        title: data.title,
        description: data.description,
        created_by: data.created_by,
        created_at: data.created_at
      };
    } catch (error) {
      console.error('❌ Error in uploadDocumentFromPDF:', error);
      throw error;
    }
  }

  // NEW: Rename document
  static async renameDocument(contractId, newTitle) {
    console.log('✏️ DocumentAPI.renameDocument called');
    console.log('contractId:', contractId);
    console.log('newTitle:', newTitle);
    
    try {
      const url = `${API_BASE_URL}/contracts/${contractId}/title`;
      console.log('Rename API URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ title: newTitle }),
      });
      
      console.log('Rename API Response status:', response.status);
      console.log('Rename API Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Rename API Error response:', errorText);
        throw new Error(`Rename failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Rename API Response data:', data);
      
      return {
        success: true,
        message: data.message,
        contract_id: data.contract_id,
        title: data.title
      };
    } catch (error) {
      console.error('❌ Error in renameDocument:', error);
      throw error;
    }
  }

    // NEW: Export document function
    static async exportDocument(documentId, documentTitle = 'document') {
      console.log('📥 DocumentAPI.exportDocument called');
      console.log('documentId:', documentId);
      console.log('documentTitle:', documentTitle);
      
      try {
        const url = `${API_BASE_URL}/documents/${documentId}/export`;
        console.log('Export API URL:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: authHeaders(),
        });
        
        console.log('Export API Response status:', response.status);
        console.log('Export API Response ok:', response.ok);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Export API Error response:', errorText);
          throw new Error(`Export failed: ${response.status} ${response.statusText}`);
        }
        
        // Get the filename from the response headers or use a default
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `${documentTitle || 'document'}.pdf`; // Default filename
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
          }
        }
  
        // Create blob from response
        const blob = await response.blob();
        
        // Create download link and trigger download
        const url_blob = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url_blob;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url_blob);
  
        console.log('✅ Document exported successfully:', filename);
        
        return {
          success: true,
          filename: filename,
          message: 'Document exported successfully'
        };
      } catch (error) {
        console.error('❌ Error in exportDocument:', error);
        throw error;
      }
    }



  // NEW: Delete document/contract
  static async deleteDocument(documentId) {
    console.log('🗑️ DocumentAPI.deleteDocument called');
    console.log('documentId:', documentId);
    
    try {
      const url = `${API_BASE_URL}/contracts/${documentId}`;
      console.log('Delete API URL:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      
      console.log('Delete API Response status:', response.status);
      console.log('Delete API Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete API Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Delete API Response data:', data);
      
      return {
        success: true,
        message: data.detail || 'Document deleted successfully'
      };
    } catch (error) {
      console.error('❌ Error in deleteDocument:', error);
      throw error;
    }
  }


  // NEW: Save document pages
  static async saveContractPages(contractId, content) {
    console.log('💾 DocumentAPI.saveContractPages called');
    console.log('contractId:', contractId);
    console.log('content length:', content?.length || 0);
    
    try {
      const url = `${API_BASE_URL}/contracts/${contractId}/pages`;
      console.log('API URL:', url);
      
      // For now, we'll save as a single page. You can modify this logic
      // if you need to split content into multiple pages
      const pages = [
        {
          page_number: 1,
          content: content
        }
      ];
      
      const requestBody = { pages };
      console.log('Request body:', requestBody);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(requestBody),
      });
      
      console.log('API Response status:', response.status);
      console.log('API Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API Response data:', data);
      
      return {
        success: true,
        contract_id: data.contract_id,
        pages: data.pages
      };
    } catch (error) {
      console.error('❌ Error in saveContractPages:', error);
      throw error;
    }
  }


  // NEW: Get all contracts (documents) - Add this method
  static async getContracts(projectId) {
    try {
      console.log('📡 Fetching all contracts...');
      
      // Build URL with project_id query parameter
      const url = projectId 
        ? `${API_BASE_URL}/contracts?project_id=${projectId}`
        : `${API_BASE_URL}/contracts`;
      
      console.log('Request URL:', url);
      
      const response = await fetch(url, {
        headers: authHeaders(),
      });
      
      console.log('Contracts API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Contracts API response data:', data);
      
      return {
        success: true,
        contracts: data.contracts || []
      };
    } catch (error) {
      console.error('❌ Error fetching contracts:', error);
      throw error;
    }
  }

  // UPDATE: Enhance existing getContractPages method with better logging
  static async getContractPages(contractId) {
    try {
      console.log(`📖 Fetching pages for contract: ${contractId}`);
      const response = await fetch(`${API_BASE_URL}/contracts/${contractId}/pages`, {
        headers: authHeaders(),
      });
      
      console.log(`Contract pages API response status for ${contractId}:`, response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Contract pages API response data for ${contractId}:`, data);
      
      // Format each page's content with spacing fixes
      const formattedPages = (data.pages || []).map(page => {
        const rawContent = page.html_content || page.content;
        const formattedContent = this.formatDocumentContent(rawContent);
        const spacingFixedContent = this.fixHTMLSpacing(formattedContent);
        
        return {
          ...page,
          content: spacingFixedContent,
          html_content: spacingFixedContent
        };
      });
      
      return {
        success: true,
        contract_id: data.contract_id,
        pages: formattedPages
      };
    } catch (error) {
      console.error(`❌ Error fetching contract pages for ${contractId}:`, error);
      throw error;
    }
  }

  // UPDATE: Enhance existing loadExistingContract method
  static async loadExistingContract(contractId, onComplete, onError) {
    try {
      console.log(`📖 Loading existing contract: ${contractId}`);
      
      const response = await this.getContractPages(contractId);
      
      if (response.success && response.pages) {
        console.log('✅ Successfully loaded contract pages:', response.pages.length);
        
        // Combine pages content (already formatted by getContractPages)
        const combinedContent = response.pages
          .sort((a, b) => a.page_number - b.page_number)
          .map(page => page.html_content || page.content)
          .join('');
          
        console.log('📄 Combined content length:', combinedContent.length);
        
        // Additional formatting for the combined content to ensure consistency
        const formattedContent = this.formatDocumentContent(combinedContent);
        const finalFormattedContent = this.fixHTMLSpacing(formattedContent);
          
        if (onComplete) {
          onComplete(response.pages, finalFormattedContent);
        }
      } else {
        throw new Error('No pages found for this contract');
      }
    } catch (error) {
      console.error('❌ Error loading existing contract:', error);
      if (onError) {
        onError(error);
      }
    }
  }

  // Step 0: Start a new contract
  static async startContract(projectId) {
    try {
      const response = await fetch(`${API_BASE_URL}/contracts/start`, {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: projectId
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        contract_id: data.contract_id,
      };
    } catch (error) {
      console.error('Error starting contract:', error);
      throw error;
    }
  }

  // Step 1: Upload file to contract
  static async uploadFile(contractId, file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/contracts/${contractId}/upload`, {
        method: 'POST',
        body: formData,
        headers: authHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        ...data
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Step 1: Update contract description
  static async updateDescription(contractId, description) {
    try {
      const response = await fetch(`${API_BASE_URL}/contracts/${contractId}/description`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ description }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        message: data.detail
      };
    } catch (error) {
      console.error('Error updating description:', error);
      throw error;
    }
  }

  // Validate if description is legal document related
  static async validateLegalDocument(userInput) {
    try {
      const response = await fetch(`${API_BASE_URL}/gpt/is-legal-doc`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ user_input: userInput }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        isRelated: data.related
      };
    } catch (error) {
      console.error('Error validating legal document:', error);
      throw error;
    }
  }

  // Step 2: Get template suggestions
  static async getTemplateSuggestions(contractId) {
    try {
      const response = await fetch(`${API_BASE_URL}/contracts/${contractId}/suggest_templates`, {
        method: 'GET',
        headers: authHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const templates = await response.json();
      return {
        success: true,
        templates: templates.map(template => ({
          name: template.name,
          description: template.description,
          score: Math.round(template.score * 100) // Convert to percentage
        }))
      };
    } catch (error) {
      console.error('Error fetching template suggestions:', error);
      throw error;
    }
  }

  // Step 2: Set selected template (AI suggested)
  static async setSelectedTemplate(contractId, templateName, templateDescription) {
    try {
      const response = await fetch(`${API_BASE_URL}/contracts/${contractId}/set_template`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          template_name: templateName,
          template_description: templateDescription
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        message: data.detail
      };
    } catch (error) {
      console.error('Error setting template:', error);
      throw error;
    }
  }

  // Step 2: Get vault templates
  static async getVaultTemplates() {
    try {
      const response = await fetch(`${API_BASE_URL}/templates`, {
        method: 'GET',
        headers: authHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const templates = await response.json();
      return {
        success: true,
        templates: templates.map(template => ({
          template_id: template.template_id,
          name: template.name,
          description: template.description,
          created_by: template.created_by,
          created_at: template.created_at,
          type: 'vault' // Mark as vault template
        }))
      };
    } catch (error) {
      console.error('Error fetching vault templates:', error);
      throw error;
    }
  }

  // Step 2: Set vault template (base template)
  static async setVaultTemplate(contractId, templateId) {
    try {
      const response = await fetch(`${API_BASE_URL}/contracts/${contractId}/set_base_template`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          template_id: templateId
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        message: data.detail
      };
    } catch (error) {
      console.error('Error setting vault template:', error);
      throw error;
    }
  }

  // Step 2: Create template from PDF upload
  static async createTemplateFromPDF(file, name, description) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      formData.append('description', description);
      
      const response = await fetch(`${API_BASE_URL}/templates/from_pdf`, {
        method: 'POST',
        body: formData,
        headers: authHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        template_id: data.template_id,
        name: data.name,
        description: data.description,
        created_by: data.created_by,
        created_at: data.created_at
      };
    } catch (error) {
      console.error('Error creating template from PDF:', error);
      throw error;
    }
  }

  // Step 3: Get missing information questions
// Replace the existing getMissingInfoQuestions method in DocumentAPI with this streaming version

// Step 3: Get missing information questions with streaming
static async getMissingInfoQuestions(contractId, onProgress, onComplete, onError) {
  console.log('📊 DocumentAPI.getMissingInfoQuestions called (streaming)');
  console.log('contractId:', contractId);
  
  try {
    const url = `${API_BASE_URL}/contracts/${contractId}/missing_info_stream`;
    console.log('Missing Info Streaming API URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: authHeaders(),
    });
    
    console.log('Missing Info Streaming API Response status:', response.status);
    console.log('Missing Info Streaming API Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Missing Info Streaming API Error response:', errorText);
      throw new Error(`Missing info questions failed: ${response.status} ${response.statusText}`);
    }
    
    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let buffer = '';
    let questions = [];
    let isComplete = false;
    let currentStatus = null;
    
    while (!isComplete) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('Missing info questions stream completed');
        isComplete = true;
        break;
      }
      
      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.trim() === '') continue;
        
        // Parse Server-Sent Events format
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.substring(6); // Remove 'data: ' prefix
            const data = JSON.parse(jsonStr);
            
            console.log('Received missing info streaming data:', data);
            
            if (data.status === 'started') {
              console.log('Missing info generation started:', data.message);
              currentStatus = 'started';
              if (onProgress) {
                onProgress({
                  type: 'started',
                  message: data.message,
                  questions: [],
                  status: 'started'
                });
              }
            } else if (data.question) {
              // Add question to our collection
              const newQuestion = {
                question: data.question,
                index: data.index,
                id: `question_${Date.now()}_${data.index}`,
                timestamp: new Date().toISOString()
              };
              
              questions.push(newQuestion);
              console.log('New question received, total questions:', questions.length);
              
              if (onProgress) {
                onProgress({
                  type: 'question',
                  question: newQuestion,
                  questions: [...questions],
                  questionCount: questions.length,
                  status: currentStatus || 'generating'
                });
              }
            } else if (data.status === 'completed') {
              console.log('Missing info questions completed, total:', data.total);
              isComplete = true;
              
              if (onComplete) {
                onComplete({
                  questions: questions,
                  totalQuestions: data.total,
                  status: 'completed',
                  message: `Generated ${data.total} questions`
                });
              }
            } else if (data.status === 'error') {
              console.error('Missing info questions error:', data.error);
              isComplete = true;
              
              if (onError) {
                onError(new Error(data.error || 'Missing info questions generation failed'));
              }
            }
          } catch (parseError) {
            console.error('Error parsing missing info streaming data:', parseError, 'Line:', line);
          }
        }
      }
    }
    
    return {
      success: true,
      questions: questions
    };
  } catch (error) {
    console.error('❌ Error in getMissingInfoQuestions:', error);
    if (onError) {
      onError(error);
    }
    throw error;
  }
}

  // Step 3: Submit answers to missing info questions
  static async submitMissingInfoAnswers(contractId, answers) {
    try {
      const response = await fetch(`${API_BASE_URL}/contracts/${contractId}/submit_missing_info`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ answers }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        attributes: data.attributes
      };
    } catch (error) {
      console.error('Error submitting missing info answers:', error);
      throw error;
    }
  }

  // Updated DocumentAPI method for streaming AI suggested answers
static async getAISuggestedAnswers(contractId, questions, onProgress, onComplete, onError) {
  console.log('📊 DocumentAPI.getAISuggestedAnswers called (streaming)');
  console.log('contractId:', contractId);
  console.log('questions count:', questions?.length || 0);
  
  try {
    const url = `${API_BASE_URL}/contracts/${contractId}/ai_suggested_answers_stream`;
    console.log('AI Suggested Answers Streaming API URL:', url);
    
    const requestBody = { questions };
    console.log('Request body:', requestBody);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(requestBody),
    });
    
    console.log('AI Suggested Answers Streaming API Response status:', response.status);
    console.log('AI Suggested Answers Streaming API Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Suggested Answers Streaming API Error response:', errorText);
      throw new Error(`AI suggested answers failed: ${response.status} ${response.statusText}`);
    }
    
    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let buffer = '';
    let answers = {};
    let isComplete = false;
    let totalQuestions = questions.length;
    let answeredCount = 0;
    
    while (!isComplete) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('AI suggested answers stream completed');
        isComplete = true;
        break;
      }
      
      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.trim() === '') continue;
        
        // Parse Server-Sent Events format
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.substring(6); // Remove 'data: ' prefix
            const data = JSON.parse(jsonStr);
            
            console.log('Received AI answers streaming data:', data);
            
            if (data.answer) {
              // Add answer to our collection
              const { question, answer } = data.answer;
              answers[question] = answer;
              answeredCount++;
              
              console.log(`New answer received for "${question}": "${answer}"`);
              console.log(`Progress: ${answeredCount}/${totalQuestions}`);
              
              if (onProgress) {
                onProgress({
                  type: 'answer',
                  question: question,
                  answer: answer,
                  answers: { ...answers },
                  progress: data.progress,
                  answeredCount: answeredCount,
                  totalQuestions: totalQuestions,
                  status: 'generating'
                });
              }
            } else if (data.status === 'completed') {
              console.log('AI suggested answers completed, total questions:', data.total_questions);
              isComplete = true;
              
              if (onComplete) {
                onComplete({
                  answers: answers,
                  totalQuestions: data.total_questions,
                  status: 'completed',
                  message: `Generated ${data.total_questions} AI suggested answers`
                });
              }
            } else if (data.status === 'error') {
              console.error('AI suggested answers error:', data.error);
              isComplete = true;
              
              if (onError) {
                onError(new Error(data.error || 'AI suggested answers generation failed'));
              }
            }
          } catch (parseError) {
            console.error('Error parsing AI answers streaming data:', parseError, 'Line:', line);
          }
        }
      }
    }
    
    return {
      success: true,
      answers: answers
    };
  } catch (error) {
    console.error('❌ Error in getAISuggestedAnswers:', error);
    if (onError) {
      onError(error);
    }
    throw error;
  }
}

  // Chat with context API
  static async chatWithContext(context, messages) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/with_context`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ 
          context,
          messages 
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        reply: data.reply
      };
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  }

  // NEW: Get suggested changes based on text edits
  static async getSuggestedChanges(lastActions, pages) {
    console.log('📡 DocumentAPI.getSuggestedChanges called');
    console.log('lastActions:', lastActions);
    console.log('pages count:', pages?.length || 0);
    
    try {
      const url = `${API_BASE_URL}/chat/suggest_related_changes`;
      console.log('API URL:', url);
      
      const requestBody = { 
        last_actions: lastActions,
        pages: pages 
      };
      console.log('Request body:', requestBody);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(requestBody),
      });
      
      console.log('API Response status:', response.status);
      console.log('API Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API Response data:', data);
      
      return {
        success: true,
        suggestedChanges: data.suggested_changes
      };
    } catch (error) {
      console.error('❌ Error in getSuggestedChanges:', error);
      throw error;
    }
  }

// UPDATED: Enhanced getRiskAnalysis to support category filtering
static async getRiskAnalysis(contractId, content, onProgress, onComplete, onError, category = null, numberOfChanges = null) {
  console.log('📊 DocumentAPI.getRiskAnalysis called (streaming)');
  console.log('contractId:', contractId);
  console.log('content length:', content?.length || 0);
  console.log('category:', category);
  console.log('numberOfChanges:', numberOfChanges);
  
  try {
    const url = `${API_BASE_URL}/risk_analysis/risk_analysis_stream`;
    console.log('Risk Analysis Streaming API URL:', url);
    
    const requestBody = { content };
    
    // Add category and number_of_changes if provided
    if (category) {
      requestBody.category = category;
    }
    if (numberOfChanges) {
      requestBody.number_of_changes = numberOfChanges;
    }
    
    console.log('Request body:', requestBody);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(requestBody),
    });
    
    console.log('Risk Analysis Streaming API Response status:', response.status);
    console.log('Risk Analysis Streaming API Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Risk Analysis Streaming API Error response:', errorText);
      throw new Error(`Risk analysis failed: ${response.status} ${response.statusText}`);
    }
    
    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let buffer = '';
    let risks = [];
    let isComplete = false;
    let currentStatus = null;
    
    while (!isComplete) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('Risk analysis stream completed');
        isComplete = true;
        break;
      }
      
      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.trim() === '') continue;
        
        // Parse Server-Sent Events format
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.substring(6); // Remove 'data: ' prefix
            const data = JSON.parse(jsonStr);
            
            console.log('Received risk analysis streaming data:', data);
            
            if (data.status === 'started') {
              console.log('Risk analysis started:', data.message);
              currentStatus = 'started';
              if (onProgress) {
                onProgress({
                  type: 'started',
                  message: data.message,
                  risks: [],
                  status: 'started'
                });
              }
            } else if (data.risk) {
              // Add risk to our collection
              const newRisk = {
                ...data.risk,
                id: `risk_${Date.now()}_${risks.length}`,
                type: 'risk',
                source: 'risk_analysis_stream',
                timestamp: new Date().toISOString(),
                // Transform the API response to match UI expectations
                original: data.risk.context,
                suggested: data.risk.changes?.map(change => 
                  data.risk.context.replace(change.from, change.to)
                ).join(' ') || data.risk.context,
                impact: data.risk.header,
                reason: data.risk.reason,
                changes: data.risk.changes || []
              };
              
              risks.push(newRisk);
              console.log('New risk received, total risks:', risks.length);
              
              if (onProgress) {
                onProgress({
                  type: 'risk',
                  risk: newRisk,
                  risks: [...risks],
                  riskCount: risks.length,
                  status: currentStatus || 'analyzing'
                });
              }
            } else if (data.status === 'completed') {
              console.log('Risk analysis completed:', data.message);
              isComplete = true;
              
              if (onComplete) {
                onComplete({
                  risks: risks,
                  totalRisks: risks.length,
                  status: 'completed',
                  message: data.message
                });
              }
            } else if (data.status === 'error') {
              console.error('Risk analysis error:', data.error);
              isComplete = true;
              
              if (onError) {
                onError(new Error(data.error || 'Risk analysis failed'));
              }
            }
          } catch (parseError) {
            console.error('Error parsing risk analysis streaming data:', parseError, 'Line:', line);
          }
        }
      }
    }
    
    return {
      success: true,
      risks: risks
    };
  } catch (error) {
    console.error('❌ Error in getRiskAnalysis:', error);
    if (onError) {
      onError(error);
    }
    throw error;
  }
}

  // Step 4: Create generation job
  static async createGenerationJob(contractId) {
    try {
      const response = await fetch(`${API_BASE_URL}/contracts/${contractId}/generate_request`, {
        method: 'POST',
        headers: authHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        job_id: data.job_id
      };
    } catch (error) {
      console.error('Error creating generation job:', error);
      throw error;
    }
  }

  // Step 4: Check generation job status
  static async checkGenerationStatus(contractId, jobId) {
    try {
      const response = await fetch(`${API_BASE_URL}/contracts/${contractId}/generate_status/${jobId}`, {
        method: 'GET',
        headers: authHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        status: data.status,
        progress: data.progress,
        error: data.error
      };
    } catch (error) {
      console.error('Error checking generation status:', error);
      throw error;
    }
  }

  // Step 4: Get generation result
  static async getGenerationResult(contractId, jobId) {
    try {
      const response = await fetch(`${API_BASE_URL}/contracts/${contractId}/generate_result/${jobId}`, {
        method: 'GET',
        headers: authHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        status: data.status,
        pages: data.pages,
        error: data.error
      };
    } catch (error) {
      console.error('Error getting generation result:', error);
      throw error;
    }
  }

  // Helper method: Complete document generation with polling
  static async generateDocumentWithPolling(contractId, onProgress, onComplete, onError) {
    try {
      // Start generation job
      const jobResponse = await this.createGenerationJob(contractId);
      if (!jobResponse.success) {
        throw new Error('Failed to create generation job');
      }

      const jobId = jobResponse.job_id;
      let isComplete = false;
      
      console.log(`Starting polling for contract ${contractId}, job ${jobId}`);
      
      // Poll for status updates
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await this.checkGenerationStatus(contractId, jobId);
          
          console.log('Status response:', statusResponse);
          
          if (statusResponse.success) {
            const { status, progress, error } = statusResponse;
            
            // Call progress callback
            if (onProgress) {
              onProgress(progress, status);
            }
            
            // Check if job is complete
            if (status === 'done') {
              clearInterval(pollInterval);
              isComplete = true;
              
              console.log('Generation completed, fetching result...');
              
              // Get the final result
              const resultResponse = await this.getGenerationResult(contractId, jobId);
              console.log('Result response:', resultResponse);
              
              if (resultResponse.success && onComplete) {
                onComplete(resultResponse.pages);
              } else {
                if (onError) {
                  onError(new Error('Failed to get generation result'));
                }
              }
            } else if (status === 'error') {
              clearInterval(pollInterval);
              isComplete = true;
              if (onError) {
                onError(new Error(error || 'Generation failed'));
              }
            }
          } else {
            // If status check fails, stop polling
            clearInterval(pollInterval);
            isComplete = true;
            if (onError) {
              onError(new Error('Failed to check generation status'));
            }
          }
        } catch (err) {
          console.error('Error during polling:', err);
          clearInterval(pollInterval);
          if (!isComplete && onError) {
            onError(err);
          }
        }
      }, 2000); // Poll every 2 seconds

      // Safety timeout (5 minutes)
      setTimeout(() => {
        if (!isComplete) {
          clearInterval(pollInterval);
          if (onError) {
            onError(new Error('Generation timeout'));
          }
        }
      }, 300000);

    } catch (error) {
      console.error('Error in generateDocumentWithPolling:', error);
      if (onError) {
        onError(error);
      }
    }
  }


  // Legacy compatibility methods (you can remove these once you update the UI)
  static async createRequest(description, files = []) {
    // This maps to the new flow: start contract + upload files + update description
    const contractResponse = await this.startContract();
    if (!contractResponse.success) {
      throw new Error('Failed to start contract');
    }

    const contractId = contractResponse.contract_id;

    // Upload files if any
    for (const file of files) {
      await this.uploadFile(contractId, file);
    }

    // Update description
    await this.updateDescription(contractId, description);

    return {
      success: true,
      request_id: contractId // Use contract_id as request_id for compatibility
    };
  }

  static async getTemplates(contractId) {
    const templates = await this.getTemplateSuggestions(contractId);
    return {
      success: templates.success,
      templates: templates.templates?.map(template => ({
        doc_id: template.name.toLowerCase().replace(/\s+/g, '_'),
        doc_name: template.name,
        doc_description: tem/plate.description,
        score: template.score
      })) || []
    };
  }

  static async generateDocument(contractId, templateName, answers) {
    // Set template
    const selectedTemplate = await this.getTemplateSuggestions(contractId);
    const template = selectedTemplate.templates?.find(t => 
      t.name.toLowerCase().replace(/\s+/g, '_') === templateName ||
      t.name === templateName
    );
    
    if (template) {
      await this.setSelectedTemplate(contractId, template.name, template.description);
    }

    // Submit answers
    await this.submitMissingInfoAnswers(contractId, answers);

    // Start generation
    return await this.createGenerationJob(contractId);
  }

  // Get document content and metadata
  static async getDocument(contractId) {
    console.log('📄 DocumentAPI.getDocument called for contractId:', contractId);
    
    try {
      const response = await fetch(`${API_BASE_URL}/contracts/${contractId}/pages`, {
        method: 'GET',
        headers: authHeaders({
          'Content-Type': 'application/json',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📄 Document data retrieved:', data);

      // Combine all pages content
      const combinedContent = data.pages
        ?.sort((a, b) => a.page_number - b.page_number)
        ?.map(page => page.content)
        ?.join('\n\n') || '';

      return {
        success: true,
        data: {
          id: data.contract_id || contractId,
          title: 'Document', // You might want to get this from a different endpoint
          content: combinedContent,
          pages: data.pages || [],
          status: 'loaded',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Error in getDocument:', error);
      return {
        success: false,
        error: error.message || 'Failed to retrieve document'
      };
    }
  }
}