// Document Content Formatter Utility - Fixed Line Spacing
// Add this to your utils folder or include it in documentApi.js

export class DocumentFormatter {
  
    /**
     * Clean and format API document content for display in editable viewer
     * @param {Object} apiResponse - Response from getContractPages API
     * @returns {string} - Clean, formatted HTML content
     */
    static formatApiContent(apiResponse) {
      if (!apiResponse || !apiResponse.pages || !Array.isArray(apiResponse.pages)) {
        console.warn('Invalid API response structure');
        return '';
      }
  
      let formattedContent = '';
      
      // Process each page
      apiResponse.pages
        .sort((a, b) => a.page_number - b.page_number)
        .forEach((page, pageIndex) => {
          const cleanContent = this.cleanPageContent(page.content || page.html_content || '');
          
          // Add page break for multiple pages (except first page)
          if (pageIndex > 0) {
            formattedContent += '<div class="page-break"></div>\n';
          }
          
          formattedContent += cleanContent;
        });
  
      return formattedContent;
    }
  
    /**
     * Clean individual page content
     * @param {string} htmlContent - Raw HTML content from API
     * @returns {string} - Cleaned HTML content
     */
    static cleanPageContent(htmlContent) {
      if (!htmlContent) return '';
  
      // Create temporary container
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = htmlContent;
  
      // Remove page wrapper divs with absolute positioning
      const pageWrappers = tempContainer.querySelectorAll('div[id^="page"]');
      pageWrappers.forEach(wrapper => {
        wrapper.style.cssText = ''; // Remove all inline styles
        wrapper.removeAttribute('style');
      });
  
      // Process all elements to clean formatting
      this.processElements(tempContainer);
  
      // Combine consecutive paragraphs that should be on the same line
      this.combineConsecutiveParagraphs(tempContainer);
  
      return tempContainer.innerHTML;
    }
  
    /**
     * Combine consecutive paragraphs that are part of the same logical line
     * @param {Element} container - Container element to process
     */
    static combineConsecutiveParagraphs(container) {
      const paragraphs = container.querySelectorAll('p');
      const toRemove = [];
      
      for (let i = 0; i < paragraphs.length - 1; i++) {
        const current = paragraphs[i];
        const next = paragraphs[i + 1];
        
        // Check if this looks like a line that was split artificially
        const currentText = current.textContent.trim();
        const nextText = next.textContent.trim();
        
        // If current paragraph doesn't end with punctuation and next doesn't start with capital/number
        // and both are relatively short, combine them
        if (currentText.length > 0 && nextText.length > 0 &&
            !currentText.match(/[.!?:]$/) && 
            !nextText.match(/^[A-Z0-9]/) &&
            currentText.length < 120 && nextText.length < 120) {
          
          // Combine the paragraphs
          current.innerHTML += ' ' + next.innerHTML;
          toRemove.push(next);
        }
      }
      
      // Remove the combined paragraphs
      toRemove.forEach(p => p.remove());
    }
  
    /**
     * Process and clean all elements in the container
     * @param {Element} container - Container element to process
     */
    static processElements(container) {
      const elements = container.querySelectorAll('*');
      
      elements.forEach(element => {
        // Clean headings
        if (element.tagName === 'H1' || element.tagName === 'H2' || element.tagName === 'H3') {
          this.cleanHeading(element);
        }
        // Clean paragraphs
        else if (element.tagName === 'P') {
          this.cleanParagraph(element);
        }
        // Remove problematic containers
        else if (element.tagName === 'DIV' && element.id && element.id.startsWith('page')) {
          this.cleanPageDiv(element);
        }
      });
  
      // Convert section headings with class to proper h2 tags
      const sectionHeadings = container.querySelectorAll('p.section-heading');
      sectionHeadings.forEach(p => {
        const h2 = document.createElement('h2');
        h2.innerHTML = p.innerHTML;
        h2.className = 'document-heading';
        p.parentNode.replaceChild(h2, p);
      });
  
      // Detect and convert paragraphs that look like headings
      const allParagraphs = container.querySelectorAll('p');
      allParagraphs.forEach(p => {
        const text = p.textContent.trim();
        // Check if it looks like a section heading (number followed by period and text)
        if (text.match(/^\d+\.\s+[A-Z][^.]*$/) && text.length < 50) {
          const h2 = document.createElement('h2');
          h2.innerHTML = p.innerHTML;
          h2.className = 'document-section-heading';
          p.parentNode.replaceChild(h2, p);
        }
      });
    }
  
    /**
     * Clean heading elements
     * @param {Element} heading - Heading element to clean
     */
    static cleanHeading(heading) {
      // Remove all inline styles
      heading.removeAttribute('style');
      
      // Add clean classes based on heading level
      const level = heading.tagName.toLowerCase();
      heading.className = `document-${level}`;
    }
  
    /**
     * Clean paragraph elements with tighter spacing
     * @param {Element} paragraph - Paragraph element to clean
     */
    static cleanParagraph(paragraph) {
      // Remove all inline positioning styles
      paragraph.removeAttribute('style');
      
      // Add clean paragraph styling
      paragraph.className = 'document-paragraph';
      
      // Check if this is an empty paragraph
      if (!paragraph.textContent.trim()) {
        paragraph.remove(); // Remove empty paragraphs
        return;
      }
    }
  
    /**
     * Clean page div containers
     * @param {Element} pageDiv - Page div element to clean
     */
    static cleanPageDiv(pageDiv) {
      // Remove all positioning and size styles
      pageDiv.removeAttribute('style');
      pageDiv.className = 'document-page';
    }
  
    /**
     * Add document-wide CSS styles with tight spacing
     * @returns {string} - CSS styles for the document
     */
    static getDocumentStyles() {
      return `
        <style>
          .document-page {
            width: 100% !important;
            height: auto !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          .document-h1 {
            font-size: 1.375rem !important;
            font-weight: bold !important;
            margin: 1.5rem 0 0.75rem 0 !important;
            color: inherit !important;
            line-height: 1.3 !important;
          }
          
          .document-h2, .document-heading, .document-section-heading {
            font-size: 1.125rem !important;
            font-weight: 600 !important;
            margin: 1.25rem 0 0.5rem 0 !important;
            color: inherit !important;
            line-height: 1.3 !important;
          }
          
          .document-h3 {
            font-size: 1rem !important;
            font-weight: 600 !important;
            margin: 1rem 0 0.375rem 0 !important;
            color: inherit !important;
            line-height: 1.3 !important;
          }
          
          .document-paragraph {
            margin: 0 0 0.375rem 0 !important;
            line-height: 1.4 !important;
            color: inherit !important;
          }
          
          .page-break {
            margin: 1.5rem 0 !important;
            border-top: 1px solid #e5e7eb !important;
            padding-top: 1.5rem !important;
          }
          
          /* Override any absolute positioning */
          .document-page * {
            position: static !important;
            top: auto !important;
            left: auto !important;
            width: auto !important;
            height: auto !important;
          }
          
          /* Ensure first heading has no top margin */
          .document-page h1:first-child,
          .document-page h2:first-child,
          .document-page .document-h1:first-child,
          .document-page .document-h2:first-child {
            margin-top: 0 !important;
          }
        </style>
      `;
    }
  
    /**
     * Complete formatting with styles included
     * @param {Object} apiResponse - Response from getContractPages API
     * @returns {string} - Complete formatted HTML with styles
     */
    static formatCompleteDocument(apiResponse) {
      const styles = this.getDocumentStyles();
      const content = this.formatApiContent(apiResponse);
      
      return styles + content;
    }
  
    /**
     * Clean HTML entities and special characters
     * @param {string} text - Text to clean
     * @returns {string} - Cleaned text
     */
    static cleanHtmlEntities(text) {
      if (!text) return '';
      
      const entityMap = {
        '&#x201c;': '"',  // Left double quotation mark
        '&#x201d;': '"',  // Right double quotation mark
        '&#x2019;': "'",  // Right single quotation mark
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#x27;': "'",
        '&#x2F;': '/',
      };
      
      let cleanText = text;
      Object.keys(entityMap).forEach(entity => {
        cleanText = cleanText.replace(new RegExp(entity, 'g'), entityMap[entity]);
      });
      
      return cleanText;
    }
  
    /**
     * Format content specifically for the document viewer with tight spacing
     * @param {Object} apiResponse - Response from getContractPages API
     * @returns {string} - Formatted content ready for StreamingDocumentViewer
     */
    static formatForDocumentViewer(apiResponse) {
      let formattedContent = this.formatApiContent(apiResponse);
      
      // Clean HTML entities
      formattedContent = this.cleanHtmlEntities(formattedContent);
      
      // Wrap in a proper document structure if not already wrapped
      if (!formattedContent.includes('<div') && !formattedContent.includes('<article')) {
        formattedContent = `<div class="document-content">${formattedContent}</div>`;
      }
      
      return formattedContent;
    }
  }