import { useState, useCallback } from 'react';
import { DocumentAPI } from '../services/documentApi';

export const useDocumentGeneration = () => {
  const [documentContent, setDocumentContent] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [currentContractId, setCurrentContractId] = useState('');
  const [currentJobId, setCurrentJobId] = useState('');

  // UPDATED: Support ready parameter
  const updateUrlWithContractId = useCallback((contractId, ready = false) => {
    const url = new URL(window.location);
    url.searchParams.set('contract_id', contractId);
    if (ready) {
      url.searchParams.set('ready', 'true');
    } else {
      url.searchParams.delete('ready');
    }
    window.history.pushState({}, '', url.toString());
  }, []);

  // UPDATED: Remove ready parameter too
  const clearUrlContractId = useCallback(() => {
    const url = new URL(window.location);
    url.searchParams.delete('contract_id');
    url.searchParams.delete('ready');
    window.history.pushState({}, '', url.toString());
  }, []);

  // NEW: Load existing contract by ID using getContractPages API
  const loadExistingContract = useCallback(async (contractId) => {
    console.log('🔍 Loading existing contract:', contractId);
    
    setIsLoading(true);
    setCurrentContractId(contractId);
    setDocumentContent('');
    setDocumentTitle('Loading Document...');
    setGenerationStatus('Loading existing document...');
    
    try {
      const response = await DocumentAPI.getContractPages(contractId);
      
      if (response.success && response.pages && response.pages.length > 0) {
        console.log('✅ Successfully loaded contract pages:', response.pages.length);
        
        // Combine pages content (already formatted by the API)
        const combinedContent = response.pages
          .sort((a, b) => a.page_number - b.page_number)
          .map(page => page.html_content || page.content) // Handle both field names
          .join('');
        
        console.log('📄 Combined content length:', combinedContent.length);
        
        // Additional formatting for the combined content to ensure consistency
        const finalFormattedContent = DocumentAPI.formatDocumentContent(combinedContent);
        
        // Update states with loaded content
        setDocumentContent(finalFormattedContent);
        setDocumentTitle(`Document ${contractId.substring(0, 8)}...`);
        setGenerationStatus('Document loaded successfully');
        
        // Update URL to include ready=true
        updateUrlWithContractId(contractId, true);
      } else {
        throw new Error('No pages found for this contract or empty response');
      }
    } catch (error) {
      console.error('❌ Error loading contract:', error);
      
      setDocumentContent(`
        <div style="padding: 20px; text-align: center; color: #ef4444;">
          <h2>Failed to Load Document</h2>
          <p>Error: ${error.message}</p>
          <p>The document may not exist, be incomplete, or you may not have access to it.</p>
        </div>
      `);
      setDocumentTitle('Document Load Failed');
      setGenerationStatus('Failed to load document');
    } finally {
      setIsLoading(false);
    }
  }, [updateUrlWithContractId]);

  // UPDATED: Support ready parameter in URL updates
  const handleDocumentGenerated = useCallback(async (contractId) => {
    console.log('🚀 Starting document generation for contract:', contractId);
    
    // Update URL without ready parameter (generation mode)
    updateUrlWithContractId(contractId, false);
    
    // Reset states and prepare for generation
    setIsLoading(true);
    setIsGenerating(true);
    setCurrentContractId(contractId);
    setDocumentContent('');
    setDocumentTitle('Generating Document...');
    setGenerationProgress(1);
    setGenerationStatus('Starting generation...');
    
    try {
      await DocumentAPI.generateDocumentWithPolling(
        contractId,
        (progress, status) => {
          console.log('📊 Generation progress:', progress, status);
          setGenerationProgress(progress || 1);
          
          // Update status messages based on the API status
          switch (status) {
            case 'pending':
              setGenerationStatus('Preparing document generation...');
              break;
            case 'in_progress':
              setGenerationStatus('Generating document content...');
              break;
            case 'done':
              setGenerationStatus('Document generation completed!');
              break;
            default:
              setGenerationStatus(`Status: ${status}`);
          }
          
          // Once we start getting progress, we're no longer in initial loading
          setIsLoading(false);
        },
        (pages) => {
          console.log('✅ Document generation completed with pages:', pages);
          
          // Generation completed successfully
          setIsGenerating(false);
          setGenerationProgress(100);
          setGenerationStatus('Document ready!');
          setDocumentTitle('Generated Document');
          setIsLoading(false);
          
          // UPDATED: Update URL to ready=true since document is now complete
          updateUrlWithContractId(contractId, true);
          
          if (pages && pages.length > 0) {
            const combinedContent = pages
              .sort((a, b) => a.page_number - b.page_number)
              .map(page => page.html_content)
              .join('');
            
            console.log('📄 Combined content length:', combinedContent.length);
            setDocumentContent(combinedContent);
          } else {
            console.warn('⚠️ No pages received from generation');
            setDocumentContent('<p>Document generated successfully, but no content was returned.</p>');
          }
        },
        (error) => {
          console.error('❌ Generation error:', error);
          
          // Generation failed
          setIsGenerating(false);
          setGenerationProgress(0);
          setGenerationStatus('Generation failed');
          setDocumentTitle('Document Generation Failed');
          setIsLoading(false);
          
          // Set error content
          setDocumentContent(`
            <div style="padding: 20px; text-align: center; color: #ef4444;">
              <h2>Document Generation Failed</h2>
              <p>Error: ${error.message}</p>
              <p>Please try generating the document again.</p>
            </div>
          `);
          
          console.error('Full error details:', error);
        }
      );
    } catch (error) {
      console.error('❌ Error starting document generation:', error);
      
      // Failed to start generation
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStatus('Failed to start generation');
      setDocumentTitle('Document Generation Failed');
      setIsLoading(false);
      
      // Set error content
      setDocumentContent(`
        <div style="padding: 20px; text-align: center; color: #ef4444;">
          <h2>Failed to Start Generation</h2>
          <p>Error: ${error.message}</p>
          <p>Please check your connection and try again.</p>
        </div>
      `);
    }
  }, [updateUrlWithContractId]);

  const handleNewDocument = useCallback(() => {
    console.log('🆕 Creating new document');
    
    clearUrlContractId();
    setCurrentContractId('');
    setCurrentJobId('');
    setDocumentContent('');
    setDocumentTitle('');
    setGenerationProgress(0);
    setGenerationStatus('');
    setIsLoading(false);
    setIsGenerating(false);
  }, [clearUrlContractId]);

  const handleContentChange = useCallback((newContent) => {
    console.log('📝 Content changed, length:', newContent?.length || 0);
    setDocumentContent(newContent);
  }, []);

  // Method to check if we're in a valid state for a contract ID
  const validateContractState = useCallback((contractId) => {
    if (!contractId) {
      console.warn('⚠️ No contract ID provided');
      return false;
    }
    
    if (currentContractId === contractId && (documentContent || isGenerating || isLoading)) {
      console.log('✅ Contract already loaded, generating, or loading');
      return true;
    }
    
    return false;
  }, [currentContractId, documentContent, isGenerating, isLoading]);

  // Handle contract ID from URL or direct navigation
  const handleContractFromUrl = useCallback(async (contractId, isReady = false) => {
    console.log('🔗 Handling contract from URL:', contractId, 'ready:', isReady);
    
    // Check if we're already handling this contract
    if (validateContractState(contractId)) {
      console.log('✅ Contract already being handled');
      return;
    }
    
    // Update current contract ID first
    setCurrentContractId(contractId);
    
    if (isReady) {
      // Load existing document
      await loadExistingContract(contractId);
    } else {
      // Start generation
      await handleDocumentGenerated(contractId);
    }
  }, [loadExistingContract, handleDocumentGenerated, validateContractState]);

  return {
    // State
    documentContent,
    documentTitle,
    isLoading,
    isGenerating,
    generationProgress,
    generationStatus,
    currentContractId,
    currentJobId,
    
    // Setters
    setDocumentTitle,
    setCurrentContractId,
    
    // Methods
    handleDocumentGenerated,
    handleNewDocument,
    handleContentChange,
    validateContractState,
    loadExistingContract, // NEW: Load existing documents
    handleContractFromUrl, // NEW: Handle URL-based navigation
    
    // Utilities
    updateUrlWithContractId,
    clearUrlContractId
  };
};