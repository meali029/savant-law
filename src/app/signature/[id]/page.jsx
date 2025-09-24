"use client"
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DocumentAPI } from '../../../services/documentApi';
import { Pen, X, Type, Check, Download, Loader2 } from 'lucide-react';
import Header from '../../../components/Header/Header';

const SignaturePage = () => {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id;
  
  const [documentContent, setDocumentContent] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signatureBoxes, setSignatureBoxes] = useState([]);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [currentSignatureBox, setCurrentSignatureBox] = useState(null);
  const [signatureText, setSignatureText] = useState('');
  const [selectedFont, setSelectedFont] = useState('script');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [signatureMode, setSignatureMode] = useState('type'); // 'type' or 'draw'
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnSignature, setDrawnSignature] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  
  const documentRef = useRef(null);
  const signatureModalRef = useRef(null);
  const canvasRef = useRef(null);

  // Load document content
  useEffect(() => {
    const loadDocument = async () => {
      if (!documentId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const result = await DocumentAPI.getDocument(documentId);
        
        if (result.success) {
          setDocumentContent(result.data.content || '');
          setDocumentTitle(result.data.title || 'Untitled Document');
        } else {
          console.error('Failed to load document:', result.error);
          setError(result.error || 'Failed to load document');
        }
      } catch (error) {
        console.error('Error loading document:', error);
        setError(error.message || 'Failed to load document');
      } finally {
        setIsLoading(false);
      }
    };

    loadDocument();
  }, [documentId]);

  // Handle document click to add signature box
  const handleDocumentClick = (e) => {
    if (e.target.closest('.signature-box')) return; // Don't add if clicking on existing signature box
    
    const rect = documentRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newSignatureBox = {
      id: Date.now(),
      x,
      y,
      signature: '',
      isSigned: false
    };
    
    setSignatureBoxes(prev => [...prev, newSignatureBox]);
    // Don't show modal immediately - only when clicking "Sign"
  };

  // Handle document right click to prevent default context menu
  const handleDocumentRightClick = (e) => {
    if (e.target.closest('.signature-box')) return; // Don't prevent if clicking on signature box
    e.preventDefault();
  };

  // Handle signature box drag start
  const handleDragStart = (e, signatureBox) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setCurrentSignatureBox(signatureBox);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // Handle signature box drag
  const handleDrag = (e) => {
    if (!isDragging || !currentSignatureBox) return;
    
    const rect = documentRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;
    
    setSignatureBoxes(prev => prev.map(box => 
      box.id === currentSignatureBox.id 
        ? { ...box, x, y }
        : box
    ));
  };

  // Handle signature box drag end
  const handleDragEnd = () => {
    // Reset drag state immediately
    setIsDragging(false);
    setCurrentSignatureBox(null);
    
    // Auto-save after dragging signature
    setTimeout(() => {
      localStorage.setItem(`signatures_${documentId}`, JSON.stringify(signatureBoxes));
    }, 100);
  };

  // Handle signature box click to edit
  const handleSignatureBoxClick = (signatureBox) => {
    setCurrentSignatureBox(signatureBox);
    setSignatureText(signatureBox.signature);
    setShowSignatureModal(true);
  };

  // Handle sign button click - disabled for left click
  const handleSignButtonClick = (e, signatureBox) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Left click is disabled - only right click opens modal
    console.log('Left click on Sign button - disabled');
  };

  // Handle right click on signature box
  const handleSignatureBoxRightClick = (e, signatureBox) => {
    console.log('Right-click detected on signature box:', signatureBox.id);
    e.preventDefault();
    e.stopPropagation();
    
    // Force reset drag state and open modal
    setIsDragging(false);
    setCurrentSignatureBox(signatureBox);
    
    // Set the appropriate mode and data based on existing signature
    if (signatureBox.signatureMode === 'draw' || signatureBox.signature.startsWith('data:image')) {
      setSignatureMode('draw');
      setDrawnSignature(signatureBox.signature);
      setSignatureText('');
    } else {
      setSignatureMode('type');
      setSignatureText(signatureBox.signature || '');
      setDrawnSignature('');
    }
    
    setShowSignatureModal(true);
    console.log('Opening signature modal for signature box:', signatureBox.id);
  };

  // Handle delete signature box
  const handleDeleteSignatureBox = (e, signatureBoxId) => {
    e.stopPropagation();
    setSignatureBoxes(prev => {
      const updated = prev.filter(box => box.id !== signatureBoxId);
      // Auto-save after deleting signature
      setTimeout(() => {
        localStorage.setItem(`signatures_${documentId}`, JSON.stringify(updated));
      }, 100);
      return updated;
    });
  };

  // Handle signature creation/editing
  const handleCreateSignature = () => {
    if (!currentSignatureBox) {
      console.log('Cannot create signature: missing signature box');
      return;
    }

    // Check if we have content based on mode
    if (signatureMode === 'type' && !signatureText.trim()) {
      console.log('Cannot create signature: missing text');
      return;
    }
    
    if (signatureMode === 'draw' && !drawnSignature) {
      console.log('Cannot create signature: missing drawing');
      return;
    }
    
    console.log('Creating signature for box:', currentSignatureBox.id, 'Mode:', signatureMode);
    
    const updatedSignatureBox = {
      ...currentSignatureBox,
      signature: signatureMode === 'type' ? signatureText : drawnSignature,
      font: signatureMode === 'type' ? selectedFont : 'drawn',
      signatureMode: signatureMode,
      isSigned: true
    };
    
    setSignatureBoxes(prev => {
      const updated = prev.map(box => 
        box.id === currentSignatureBox.id 
          ? updatedSignatureBox
          : box
      );
      
      // Auto-save after creating signature
      setTimeout(() => {
        localStorage.setItem(`signatures_${documentId}`, JSON.stringify(updated));
      }, 100);
      
      return updated;
    });
    
    setShowSignatureModal(false);
    setSignatureText('');
    setDrawnSignature('');
    setCurrentSignatureBox(null);
    setSignatureMode('type');
  };

  // Handle modal close
  const handleCloseModal = () => {
    console.log('Closing modal, current signature box:', currentSignatureBox);
    setShowSignatureModal(false);
    setSignatureText('');
    setDrawnSignature('');
    setCurrentSignatureBox(null);
    setSignatureMode('type');
  };

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (signatureModalRef.current && !signatureModalRef.current.contains(event.target)) {
        handleCloseModal();
      }
    };

    if (showSignatureModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSignatureModal]);

  // Add global drag event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleDragEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, currentSignatureBox, dragOffset]);

  // Reset drag state when component unmounts or when not dragging
  useEffect(() => {
    if (!isDragging && !showSignatureModal) {
      setCurrentSignatureBox(null);
    }
  }, [isDragging, showSignatureModal]);

  const getFontStyle = (font) => {
    switch (font) {
      case 'script':
        return 'font-serif italic';
      case 'serif':
        return 'font-serif';
      case 'sans':
        return 'font-sans';
      default:
        return 'font-serif italic';
    }
  };

  // Save signatures to localStorage
  const saveSignatures = () => {
    try {
      localStorage.setItem(`signatures_${documentId}`, JSON.stringify(signatureBoxes));
      setIsSaving(true);
      setTimeout(() => setIsSaving(false), 1000);
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      successMessage.textContent = 'Signatures saved successfully!';
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 3000);
    } catch (error) {
      console.error('Error saving signatures:', error);
      
      // Show error message
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      errorMessage.textContent = 'Failed to save signatures';
      document.body.appendChild(errorMessage);
      
      setTimeout(() => {
        document.body.removeChild(errorMessage);
      }, 3000);
    }
  };

  // Download document as PDF with signatures
  const downloadDocument = async () => {
    if (!documentId || !documentContent) return;

    setIsDownloading(true);
    setDownloadError(null);

    try {
      // Import jsPDF
      const jsPDF = (await import('jspdf')).default;

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Set margins
      const margin = 20;
      const pageWidth = 210 - (2 * margin);
      const pageHeight = 297 - (2 * margin);
      
      // Parse HTML content to preserve formatting
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = documentContent;
      
      // Remove any script, style, and other non-content elements
      const scripts = tempDiv.querySelectorAll('script, style, meta, link');
      scripts.forEach(el => el.remove());
      
      // Function to process HTML elements and preserve formatting
      const processElement = (element, level = 0) => {
        const blocks = [];
        
        // Handle different element types
        if (element.nodeType === Node.TEXT_NODE) {
          const text = element.textContent.trim();
          if (text) {
            blocks.push({ type: 'text', content: text, level });
          }
        } else if (element.nodeType === Node.ELEMENT_NODE) {
          const tagName = element.tagName.toLowerCase();
          
          // Handle headings
          if (tagName.match(/^h[1-6]$/)) {
            const text = element.textContent.trim();
            if (text) {
              blocks.push({ type: 'heading', content: text, level: parseInt(tagName[1]), elementLevel: level });
            }
          }
          // Handle paragraphs
          else if (tagName === 'p') {
            const text = element.textContent.trim();
            if (text) {
              blocks.push({ type: 'paragraph', content: text, level });
            }
          }
          // Handle line breaks
          else if (tagName === 'br') {
            blocks.push({ type: 'linebreak', level });
          }
          // Handle lists
          else if (tagName === 'ul' || tagName === 'ol') {
            const listItems = element.querySelectorAll('li');
            listItems.forEach((item, index) => {
              const text = item.textContent.trim();
              if (text) {
                blocks.push({ 
                  type: 'listitem', 
                  content: text, 
                  level: level + 1,
                  listType: tagName === 'ul' ? 'bullet' : 'number',
                  listIndex: index + 1
                });
              }
            });
          }
          // Handle divs and other block elements
          else if (tagName === 'div' || tagName === 'section' || tagName === 'article') {
            // Process child elements
            Array.from(element.childNodes).forEach(child => {
              blocks.push(...processElement(child, level + 1));
            });
          }
          // Handle inline elements (span, strong, em, etc.)
          else if (tagName === 'span' || tagName === 'strong' || tagName === 'em' || tagName === 'b' || tagName === 'i') {
            const text = element.textContent.trim();
            if (text) {
              blocks.push({ type: 'text', content: text, level, style: tagName });
            }
          }
          // For other elements, process their children
          else {
            Array.from(element.childNodes).forEach(child => {
              blocks.push(...processElement(child, level));
            });
          }
        }
        
        return blocks;
      };
      
      // Process the entire document
      const documentBlocks = processElement(tempDiv);
      
      // Only capture the document as image - no text rendering
      
             // Convert the entire document with signatures to an image
       const documentContainer = documentRef.current;
       if (!documentContainer) {
         throw new Error('Document container not found');
       }
       
       // Temporarily hide signature box borders before capturing
       const signatureBoxElements = documentContainer.querySelectorAll('.signature-box');
       const originalBorderStyles = [];
       
       signatureBoxElements.forEach((element, index) => {
         originalBorderStyles[index] = element.style.border;
         element.style.border = 'none'; // Remove the green dashed border
       });
       
       // Use html2canvas to capture the entire document with signatures
       const html2canvas = (await import('html2canvas')).default;
       
       const canvas = await html2canvas(documentContainer, {
         scale: 2, // Higher resolution
         useCORS: true,
         allowTaint: true,
         backgroundColor: '#ffffff',
         width: documentContainer.scrollWidth,
         height: documentContainer.scrollHeight,
         scrollX: 0,
         scrollY: 0
       });
       
       // Restore signature box borders after capturing
       signatureBoxElements.forEach((element, index) => {
         element.style.border = originalBorderStyles[index];
       });
      
      // Convert canvas to blob
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/png', 1.0);
      });
      
      // Create image from blob
      const img = new Image();
      img.src = URL.createObjectURL(blob);
      
      // Wait for image to load
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      // Calculate dimensions to fit the image on PDF pages
      const imgAspectRatio = img.width / img.height;
      const pdfAspectRatio = pageWidth / pageHeight;
      
      let imgWidth, imgHeight;
      
      if (imgAspectRatio > pdfAspectRatio) {
        // Image is wider than PDF page - fit to width
        imgWidth = pageWidth;
        imgHeight = pageWidth / imgAspectRatio;
      } else {
        // Image is taller than PDF page - fit to height
        imgHeight = pageHeight;
        imgWidth = pageHeight * imgAspectRatio;
      }
      
      // Center the image on the page
      const x = margin + (pageWidth - imgWidth) / 2;
      const y = margin + (pageHeight - imgHeight) / 2;
      
             // Add the image to PDF
       pdf.addImage(img, 'PNG', x, y, imgWidth, imgHeight);
       
       // Save the PDF
       pdf.save(`${documentTitle || 'Document'}_signed.pdf`);
       
       // Show success message
       const successMessage = document.createElement('div');
       successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
       successMessage.textContent = 'Document downloaded successfully!';
       document.body.appendChild(successMessage);
       
       setTimeout(() => {
         document.body.removeChild(successMessage);
       }, 3000);
       
       setIsDownloading(false);
      
    } catch (error) {
      console.error('Error downloading document:', error);
      setDownloadError(error.message);
      
      // Show error message
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      errorMessage.textContent = 'Failed to download document';
      document.body.appendChild(errorMessage);
      
      setTimeout(() => {
        document.body.removeChild(errorMessage);
      }, 3000);
    } finally {
      setIsDownloading(false);
    }
  };

  // Load signatures from localStorage
  const loadSignatures = () => {
    try {
      const saved = localStorage.getItem(`signatures_${documentId}`);
      if (saved) {
        setSignatureBoxes(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading signatures:', error);
    }
  };

  // Load saved signatures when document loads
  useEffect(() => {
    if (documentId && !isLoading) {
      loadSignatures();
    }
  }, [documentId, isLoading]);

  // Initialize canvas when drawing mode is selected
  useEffect(() => {
    if (signatureMode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      // Set drawing style
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Load existing drawn signature if available
      if (drawnSignature && drawnSignature.startsWith('data:image')) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = drawnSignature;
      }
    }
  }, [signatureMode, drawnSignature]);

  // Drawing functions
  const startDrawing = (e) => {
    if (signatureMode !== 'draw') return;
    
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (signatureMode !== 'draw' || !isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (signatureMode !== 'draw') return;
    
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.closePath();
    
    // Convert canvas to data URL for storage
    setDrawnSignature(canvas.toDataURL());
  };

  const clearCanvas = () => {
    if (signatureMode !== 'draw' || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawnSignature('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading document...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <style dangerouslySetInnerHTML={{
        __html: `
          .document-content h1, .document-content h2, .document-content h3 {
            margin-top: 2rem !important;
            margin-bottom: 1.5rem !important;
            line-height: 1.4 !important;
          }
          .document-content p {
            margin-bottom: 1.5rem !important;
            line-height: 2.2 !important;
          }
          .document-content ul, .document-content ol {
            margin-bottom: 1.5rem !important;
            padding-left: 2rem !important;
          }
          .document-content li {
            margin-bottom: 0.8rem !important;
            line-height: 2.2 !important;
          }
          .document-content strong {
            font-weight: 600 !important;
          }
          .document-content em {
            font-style: italic !important;
          }
          .document-content br {
            margin-bottom: 0.5rem !important;
          }
          .document-content {
            padding-bottom: 2rem !important;
          }
          .document-content > *:not(:last-child) {
            margin-bottom: 1.5rem !important;
          }
        `
      }} />
      <Header />
      
      {/* Fixed Header */}
      <div className="sticky top-16 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Pen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {documentTitle}
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Digital Signature Workspace
                    </p>
                  </div>
                </div>
                
                {/* Signature Status */}
                {signatureBoxes.length > 0 && (
                  <div className="hidden md:flex items-center space-x-4 ml-8">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {signatureBoxes.length} signature{signatureBoxes.length > 1 ? 's' : ''} added
                      </span>
                    </div>
                    {signatureBoxes.filter(box => box.isSigned).length > 0 && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {signatureBoxes.filter(box => box.isSigned).length} signed
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={saveSignatures}
                disabled={isSaving}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2 shadow-md hover:shadow-lg border border-slate-600"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">Saving...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span className="text-sm font-medium">Save</span>
                  </>
                )}
              </button>
              
              {/* Download Button */}
              <button
                onClick={downloadDocument}
                disabled={isDownloading || !documentContent || signatureBoxes.length === 0}
                className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg border ${
                  isDownloading || !documentContent || signatureBoxes.length === 0
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border-gray-300 dark:border-gray-600'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500'
                }`}
                title={
                  !documentContent 
                    ? 'No document content to download' 
                    : signatureBoxes.length === 0 
                    ? 'No signatures to include' 
                    : isDownloading 
                    ? 'Download in progress...' 
                    : 'Download signed document as PDF'
                }
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">{isDownloading ? 'Downloading...' : 'Download'}</span>
              </button>
              
              <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-sm font-medium">Back</span>
              </button>
            </div>
          </div>
          

        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6">

        {/* Document Container */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mx-auto" style={{ 
          maxWidth: '210mm', 
          width: '100%',
          minWidth: '280px'
        }}>
          <div 
            ref={documentRef}
            className="relative min-h-[800px] p-12 cursor-crosshair"
            onClick={handleDocumentClick}
            onContextMenu={handleDocumentRightClick}
            style={{ userSelect: 'none' }}
          >
            {/* Document Content */}
            <div 
              className="document-content prose prose-lg max-w-none text-gray-900 dark:text-gray-100"
              style={{ 
                position: 'relative',
                zIndex: 1,
                fontSize: '16px',
                lineHeight: '2.2',
                letterSpacing: '0.01em'
              }}
              dangerouslySetInnerHTML={{ 
                __html: documentContent 
              }}
            />

                         {/* Signature Boxes */}
                           {signatureBoxes.map((signatureBox) => (
                <div
                  key={signatureBox.id}
                  className={`signature-box absolute cursor-move group ${
                    signatureBox.isSigned ? 'border-green-300' : 'border-red-300'
                  } border-2 border-dashed rounded-lg p-3 min-w-[120px] min-h-[60px] flex items-center justify-center hover:shadow-lg transition-all duration-200 bg-transparent`}
                  style={{
                    left: signatureBox.x,
                    top: signatureBox.y,
                    zIndex: 10
                  }}
                  onMouseDown={(e) => handleDragStart(e, signatureBox)}
                  onContextMenu={(e) => handleSignatureBoxRightClick(e, signatureBox)}
                >
                  {signatureBox.isSigned ? (
                    <button
                      onClick={(e) => handleSignButtonClick(e, signatureBox)}
                      className={`text-center hover:opacity-80 transition-opacity`}
                    >
                      {signatureBox.signatureMode === 'draw' ? (
                        <img 
                          src={signatureBox.signature} 
                          alt="Drawn signature" 
                          className="max-w-full max-h-full object-contain"
                          style={{ maxHeight: '40px' }}
                        />
                      ) : (
                        <div className={`text-lg font-bold text-gray-900 dark:text-gray-100 ${getFontStyle(signatureBox.font)}`}>
                          {signatureBox.signature}
                        </div>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleSignButtonClick(e, signatureBox)}
                      className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
                    >
                      <Pen className="w-4 h-4" />
                      <span className="text-sm font-medium">Sign</span>
                    </button>
                  )}
                 
                 {/* Delete Button */}
                 <button
                   onClick={(e) => handleDeleteSignatureBox(e, signatureBox.id)}
                   className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                 >
                   <X className="w-3 h-3" />
                 </button>
                 
                 {/* Tooltip */}
                 <div className="absolute top-full left-0 mt-2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                   Right-click to sign • Drag to move • Click X to delete
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      {console.log('Modal state:', showSignatureModal, 'Current signature box:', currentSignatureBox)}
      {showSignatureModal && currentSignatureBox && currentSignatureBox.id && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div 
            ref={signatureModalRef}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <Pen className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Add Signature
                </h2>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Signature Method Selection */}
              <div className="flex space-x-2 mb-6">
                <button 
                  onClick={() => setSignatureMode('draw')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                    signatureMode === 'draw'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Pen className="w-4 h-4" />
                  <span className="text-sm">Draw</span>
                </button>
                <button 
                  onClick={() => setSignatureMode('type')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                    signatureMode === 'type'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Type className="w-4 h-4" />
                  <span className="text-sm">Type</span>
                </button>
              </div>

              {/* Text Input - Only show in type mode */}
              {signatureMode === 'type' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Signature Text
                  </label>
                  <input
                    type="text"
                    value={signatureText}
                    onChange={(e) => setSignatureText(e.target.value)}
                    placeholder="Enter your signature"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}

              {/* Drawing Canvas - Only show in draw mode */}
              {signatureMode === 'draw' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Draw Your Signature
                  </label>
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white">
                    <canvas
                      ref={canvasRef}
                      className="w-full h-32 border border-gray-200 rounded cursor-crosshair"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <button
                        onClick={clearCanvas}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded hover:bg-red-50 transition-colors"
                      >
                        Clear
                      </button>
                      <span className="text-xs text-gray-500">Draw your signature above</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Font Style Selection - Only show in type mode */}
              {signatureMode === 'type' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Font Style
                  </label>
                  <div className="flex space-x-2">
                    {[
                      { key: 'script', label: 'Script' },
                      { key: 'serif', label: 'Serif' },
                      { key: 'sans', label: 'Sans Serif' }
                    ].map((font) => (
                      <button
                        key={font.key}
                        onClick={() => setSelectedFont(font.key)}
                        className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                          selectedFont === font.key
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {font.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Signature Preview */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preview
                </label>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 min-h-[80px] flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                  {signatureMode === 'draw' ? (
                    drawnSignature ? (
                      <img 
                        src={drawnSignature} 
                        alt="Drawn signature preview" 
                        className="max-w-full max-h-full object-contain"
                        style={{ maxHeight: '60px' }}
                      />
                    ) : (
                      <div className="text-gray-400 dark:text-gray-500">
                        Draw your signature to see preview
                      </div>
                    )
                  ) : (
                    signatureText ? (
                      <div className={`text-2xl ${getFontStyle(selectedFont)} text-gray-900 dark:text-gray-100`}>
                        {signatureText}
                      </div>
                    ) : (
                      <div className="text-gray-400 dark:text-gray-500">
                        Type your signature to see preview
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleCreateSignature}
                  disabled={
                    (signatureMode === 'type' && !signatureText.trim()) ||
                    (signatureMode === 'draw' && !drawnSignature)
                  }
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignaturePage;
