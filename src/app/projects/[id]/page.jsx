'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Plus, X, Search, Loader, ArrowLeft, FileText, Trash2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import Header from '../../../components/Header/Header'
import DocumentCreationModal from '../../../components/DocumentEditing/DocumentCreationModal'
import { getToken } from '../../../services/authApi'
import { DocumentAPI } from '../../../services/documentApi'

export default function ProjectDocuments() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id
  
  // AUTH GUARD: Redirect to /sign-in if not authenticated
  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.push('/sign-in')
    }
  }, [router])

  // Document Creation Modal state
  const [showDocumentCreationModal, setShowDocumentCreationModal] = useState(false);

  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [analyzeQuery, setAnalyzeQuery] = useState('');
  const [userRole, setUserRole] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [viewMode, setViewMode] = useState('all');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [projectInfo, setProjectInfo] = useState(null);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Loading messages for each phase
  const loadingMessages = [
    "Analyzing document structure...",
    "Comparing contract clauses...",
    "Identifying key changes...",
    "Evaluating potential impacts..."
  ];

  const clearSelectionMode = () => {
    setSelectedDocuments([]);
    setIsSelectionMode(false);
  };

  // Handle document generation success
  const handleDocumentGenerated = (contractId) => {
    console.log('Document generated with contract ID:', contractId);
    // Navigate to the documents page with the contract_id
    router.push(`/documents?contract_id=${contractId}`);
  };

  // Load project info (keeping existing logic)
  useEffect(() => {
    const fetchProjectInfo = async () => {
      if (!projectId) return
      
      try {
        const token = getToken()
        const response = await fetch('https://api.getmediarank.com/api/v1/projects/list', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch projects')
        }

        const projects = await response.json()
        // Handle new API response structure - check both owned and shared projects
        const ownedProjects = projects.owned_projects || [];
        const sharedProjects = projects.shared_projects || [];
        const allProjects = [...ownedProjects, ...sharedProjects];
        const currentProject = allProjects.find(project => project.id === projectId)
        
        if (currentProject) {
          setProjectInfo(currentProject)
        } else {
          // Project not found, redirect to projects page
          router.push('/projects')
        }
      } catch (error) {
        console.error('Error fetching project:', error)
        // Fallback to mock data
        setProjectInfo({
          id: projectId,
          project_name: `Project ${projectId}`,
          user_id: "abdell",
          date: new Date().toISOString()
        })
      } finally {
        setIsLoadingProject(false)
      }
    }

    fetchProjectInfo()
  }, [projectId, router])

  // NEW: Load documents from contracts API
  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoadingDocuments(true);
      try {
        console.log('🔍 Fetching all user contracts...');
        
        const response = await DocumentAPI.getContracts(projectId);
        
        if (response.success) {
          console.log('📄 Received contracts:', response.contracts);
          
          // Transform API data to match the component's expected format
          const transformedDocuments = response.contracts.map(contract => ({
            id: contract.id,
            title: contract.name || `Document ${contract.id.substring(0, 8)}...`,
            date: new Date(contract.created_at).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            }),
            status: 'Ready', // Since these are completed contracts
            type: 'document',
            version: 'v1',
            group: contract.name ? contract.name.toLowerCase().replace(/\s+/g, '_') : `document_${contract.id.substring(0, 8)}`,
            filename: contract.name || `Document_${contract.id.substring(0, 8)}.html`,
            contractId: contract.id // Keep the original contract ID for navigation
          }));
          
          console.log('🔄 Transformed documents:', transformedDocuments);
          setDocuments(transformedDocuments);
        } else {
          console.warn('❌ Failed to fetch contracts');
          setDocuments([]);
        }
      } catch (error) {
        console.error('❌ Error fetching documents:', error);
        setDocuments([]); // Set empty array on error
      } finally {
        setIsLoadingDocuments(false);
      }
    }

    // Only fetch documents if user is authenticated
    const token = getToken();
    if (token) {
      fetchDocuments();
    }
  }, []);

// Updated handleDeleteDocument function for your ProjectDocuments component

// Handle document deletion
const handleDeleteDocument = async () => {
  if (!documentToDelete) return

  setIsDeleting(true)

  try {
    console.log('🗑️ Deleting document with contract ID:', documentToDelete.contractId);
    
    // Call the actual delete API
    const response = await DocumentAPI.deleteDocument(documentToDelete.contractId);
    
    if (response.success) {
      console.log('✅ Document deleted successfully:', response.message);
      
      // Remove from the documents list
      setDocuments(prev => prev.filter(doc => doc.id !== documentToDelete.id))
      
      // Remove from selected documents if it was selected
      setSelectedDocuments(prev => prev.filter(doc => doc.id !== documentToDelete.id))
      
      // Close modal
      setShowDeleteModal(false)
      setDocumentToDelete(null)
      
      // Optional: Show success message
      // You can add a toast notification here if you have one implemented
      console.log('Document deleted successfully!');
      
    } else {
      throw new Error('Delete operation failed');
    }
    
  } catch (error) {
    console.error('❌ Error deleting document:', error);
    
    // Show user-friendly error message
    const errorMessage = error.message.includes('HTTP error! status: 404') 
      ? 'Document not found. It may have already been deleted.'
      : error.message.includes('HTTP error! status: 403')
      ? 'You do not have permission to delete this document.'
      : `Failed to delete document: ${error.message}`;
    
    alert(errorMessage);
    
    // If document was not found (404), still remove it from the UI
    if (error.message.includes('HTTP error! status: 404')) {
      setDocuments(prev => prev.filter(doc => doc.id !== documentToDelete.id))
      setSelectedDocuments(prev => prev.filter(doc => doc.id !== documentToDelete.id))
      setShowDeleteModal(false)
      setDocumentToDelete(null)
    }
    
  } finally {
    setIsDeleting(false)
  }
}

  // Show delete confirmation modal
  const confirmDeleteDocument = (doc) => {
    setDocumentToDelete(doc)
    setShowDeleteModal(true)
  }

  // Toggle document selection
  const toggleDocumentSelection = (doc) => {
    if (selectedDocuments.some(d => d.id === doc.id)) {
      setSelectedDocuments(selectedDocuments.filter(d => d.id !== doc.id));
    } else {
      setSelectedDocuments([...selectedDocuments, doc]);
    }
  };

  // Handle document click - navigate to document viewer
  const handleDocumentClick = (doc) => {
    if (isSelectionMode) {
      toggleDocumentSelection(doc);
    } else {
      // Navigate to document viewer with contract ID and ready=true parameter
      console.log('🔗 Navigating to existing document:', doc.contractId);
      router.push(`/documents?contract_id=${doc.contractId}&ready=true`);
    }
  };
  // Progress bar animation for analysis
  useEffect(() => {
    let interval;
    
    if (isAnalyzing) {
      interval = setInterval(() => {
        setLoadingProgress(prev => {
          const newValue = prev + 1;
          
          // Update loading phase based on progress
          const newPhase = Math.floor(newValue / 25);
          if (newPhase !== loadingPhase && newPhase < 4) {
            setLoadingPhase(newPhase);
          }
          
          if (newValue >= 100) {
            clearInterval(interval);
            return 100;
          }
          return newValue;
        });
      }, 30);
    } else {
      setLoadingProgress(0);
      setLoadingPhase(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAnalyzing, loadingPhase]);

  // Handle analysis submission with loading animation (keeping existing mock logic)
  const handleAnalyzeSubmit = () => {
    // Check if we have documents from the same group
    const groups = selectedDocuments.map(doc => doc.group);
    const uniqueGroups = Array.from(new Set(groups));

    if (uniqueGroups.length !== 1) {
      alert("Please select versions of the same document to compare.");
      return;
    }

    // Set loading state
    setIsAnalyzing(true);
    
    // Simulate API call with mock data
    setTimeout(() => {
      const group = uniqueGroups[0];
      
      // Sort documents by version
      const sortedDocs = [...selectedDocuments].sort((a, b) => {
        const versionA = parseInt(a.version?.replace('v', '') || '0');
        const versionB = parseInt(b.version?.replace('v', '') || '0');
        return versionA - versionB;
      });
      
      // Mock analysis results
      const mockResults = [{
        fromVersion: sortedDocs[0]?.version || 'v1',
        toVersion: sortedDocs[1]?.version || 'v2',
        changes: [
          {
            section: "Terms and Conditions",
            before: "Standard contract terms apply.",
            after: "Enhanced contract terms with additional clauses apply.",
            impact: "This provides more comprehensive coverage and protection for both parties."
          }
        ]
      }];
      
      setAnalysisResults({
        documentTitle: sortedDocs[0]?.title || 'Document Comparison',
        versions: sortedDocs.map(doc => doc.version),
        userRole: userRole || 'you',
        results: mockResults
      });
      
      // End loading state and close modal
      setIsAnalyzing(false);
      setShowAnalyzeModal(false);
      setShowResults(true);
    }, 4000); // 4 second simulated loading time
  };

  // Group documents by title and version
  const groupedDocuments = documents.reduce((acc, doc) => {
    if (!acc[doc.group || '']) {
      acc[doc.group || ''] = [];
    }
    acc[doc.group || ''].push(doc);
    return acc;
  }, {});
  
  // Sort documents by date (newest first) within each group
  Object.keys(groupedDocuments).forEach(key => {
    groupedDocuments[key].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  });

  // Add this useEffect to automatically exit selection mode when no docs are selected:
  useEffect(() => {
    if (selectedDocuments.length === 0 && isSelectionMode) {
      setIsSelectionMode(false);
    }
  }, [selectedDocuments.length, isSelectionMode]);

  // Handle back navigation
  const handleBackToProjects = () => {
    router.push('/projects');
  };

  if (isLoadingProject) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
        <Header />
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
   <>
    <Header />
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-black transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {!showResults ? (
          <>
            <div className="flex items-center mb-6">
              <button 
                onClick={handleBackToProjects}
                className="mr-4 p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <div>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                  <span>Projects</span>
                  <span>/</span>
                  <span>{projectInfo?.project_name}</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Documents</h1>
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-8">
              <div>
                <p className="text-gray-600 dark:text-gray-300 mt-1">Browse your generated documents or create a new one instantly.</p>
              </div>
              
              <div className="flex space-x-4 text-[14px]">
                <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                  <button
                    onClick={() => setViewMode('all')}
                    className={`px-4 py-2 transition-colors ${viewMode === 'all' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                  >
                    All Documents
                  </button>
                  <button
                    onClick={() => setViewMode('grouped')}
                    className={`px-4 py-2 transition-colors ${viewMode === 'grouped' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                  >
                    By Contract
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (selectedDocuments.length === documents.length) {
                      clearSelectionMode();
                    } else {
                      setSelectedDocuments([...documents]);
                      setIsSelectionMode(true);
                    }
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-[14px]"
                >
                  {selectedDocuments.length === documents.length ? 'Deselect All' : 'Select All'}
                </button>
                
                <button
                  onClick={() => setShowAnalyzeModal(true)}
                  disabled={selectedDocuments.length < 2}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    selectedDocuments.length < 2 
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                      : 'bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 shadow-lg hover:shadow-xl'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Search size={18} />
                    <span>Analyse</span>
                  </div>
                </button>
              </div>
            </div>

            {isLoadingDocuments ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="ml-3 text-gray-600 dark:text-gray-300">Loading documents...</span>
              </div>
            ) : (
              <>
                {viewMode === 'all' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
  {/* New document card - Updated to use DocumentCreationModal */}
  <div 
    className="bg-white dark:bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-sm rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-700 p-6 flex flex-col items-center justify-center h-72 transition-all duration-300 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md cursor-pointer"
    onClick={() => setShowDocumentCreationModal(true)}
  >
    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mb-4">
      <Plus className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
    </div>
    <h3 className="text-lg font-medium text-indigo-700 dark:text-indigo-400">Generate new document</h3>
  </div>

  {/* Document cards with text skeleton design */}
  {documents.map((doc) => (
    <motion.div
      key={doc.id}
      whileHover={{ y: -5 }}
      className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md transition-all duration-300 h-72 relative group cursor-pointer ${
        selectedDocuments.some(d => d.id === doc.id) 
          ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 shadow-lg' 
          : 'hover:shadow-lg'
      }`}
      onClick={(e) => {
        e.preventDefault();
        handleDocumentClick(doc);
      }}
    >
      <div className="h-1/2 bg-gray-50 dark:bg-gray-700 relative p-5 flex flex-col justify-center">
        {/* Selection circle */}
        <div 
          className="absolute top-2 left-2 w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700 flex items-center justify-center cursor-pointer z-10"
          onClick={(e) => {
            e.stopPropagation();
            toggleDocumentSelection(doc);
          }}
        >
          {selectedDocuments.some(d => d.id === doc.id) && (
            <div className="w-3 h-3 bg-indigo-500 dark:bg-indigo-400 rounded-full"></div>
          )}
        </div>

        {/* Delete button - only show on hover */}
        <button
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-200 dark:hover:bg-red-800"
          onClick={(e) => {
            e.stopPropagation();
            confirmDeleteDocument(doc);
          }}
        >
          <Trash2 className="w-3 h-3" />
        </button>

        {/* Text skeleton */}
        <div className="space-y-2">
          <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
          <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-5/6"></div>
          <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
          <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-4/5"></div>
        </div>
        
        {/* Title placeholder at top */}
        <div className="absolute top-3 left-10 right-10">
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-sm bg-gray-300 dark:bg-gray-600 mr-1"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
          </div>
        </div>
        
        {/* Document type and version indicator */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
          <div className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded-md text-xs text-gray-500 dark:text-gray-400">
            {doc.type}
          </div>
          
          {/* Version indicator */}
          {doc.version && (
            <div className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-md text-xs font-medium">
              {doc.version}
            </div>
          )}
        </div>
      </div>
      
      <div className="p-5">
        <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-2 truncate">{doc.title}</h3>
        <div className="flex items-center text-gray-500 dark:text-gray-400 mb-3 text-sm">
          <Calendar className="w-4 h-4 mr-1" />
          <span>{doc.date}</span>
        </div>
        <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300">
          {doc.status}
        </span>
      </div>
    </motion.div>
  ))}
</div>
                ) : (
                  <div className="space-y-8">
                    {Object.entries(groupedDocuments).map(([group, docs]) => (
                      <div key={group} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 transition-colors duration-300">
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{docs[0].title}</h2>
                          <span className="text-sm text-gray-500 dark:text-gray-400">{docs.length} versions</span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {docs.map((doc) => (
                            <motion.div
                              key={doc.id}
                              whileHover={{ y: -5 }}
                              className={`bg-white dark:bg-gray-700 rounded-lg border overflow-hidden transition-all duration-300 relative group cursor-pointer ${
                                selectedDocuments.some(d => d.id === doc.id) 
                                  ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 shadow-md' 
                                  : 'border-gray-200 dark:border-gray-600 hover:shadow'
                              }`}
                              onClick={() => handleDocumentClick(doc)}
                            >
                              {/* Delete button for grouped view */}
                              <button
                                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-200 dark:hover:bg-red-800"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmDeleteDocument(doc);
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>

                              <div className="flex items-center p-4">
                                <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-lg mr-3">
                                  <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                  <div className="flex items-center">
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{doc.version}</span>
                                    {selectedDocuments.some(d => d.id === doc.id) && (
                                      <div className="ml-2 w-4 h-4 bg-indigo-500 dark:bg-indigo-400 rounded-full flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">{doc.date}</div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          // Analysis Results View (keeping existing logic)
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-300">
            <div className="flex items-center mb-6">
              <button 
                onClick={() => setShowResults(false)}
                className="mr-4 p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Version Comparison</h1>
                <p className="text-gray-600 dark:text-gray-300">{analysisResults?.documentTitle} • {analysisResults?.versions.join(' → ')}</p>
              </div>
            </div>
            
            <div className="mt-8 space-y-8">
              {analysisResults?.results.length > 0 ? (
                analysisResults.results.map((result, index) => (
                  <div key={index} className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h2 className="text-xl font-semibold mb-4 text-indigo-700 dark:text-indigo-400">
                      Changes from {result.fromVersion} to {result.toVersion}
                    </h2>
                    <div className="space-y-6">
                      {result.changes.map((change, changeIndex) => (
                        <div key={changeIndex} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <h3 className="font-medium text-lg mb-3 text-gray-800 dark:text-gray-100">{change.section}</h3>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Before:</div>
                              <p className="text-gray-700 dark:text-gray-300">{change.before}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-indigo-200 dark:border-indigo-700">
                              <div className="text-xs text-indigo-500 dark:text-indigo-400 mb-1">After:</div>
                              <p className="text-gray-700 dark:text-gray-300">{change.after}</p>
                            </div>
                          </div>
                          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded border border-indigo-100 dark:border-indigo-800">
                            <div className="text-xs text-indigo-600 dark:text-indigo-400 mb-1">Impact for {analysisResults?.userRole}:</div>
                            <p className="text-gray-700 dark:text-gray-300">{change.impact}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 dark:text-gray-500 mb-4">
                    <Search className="w-12 h-12 mx-auto" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-600 dark:text-gray-300 mb-2">No Changes Found</h3>
                  <p className="text-gray-500 dark:text-gray-400">We couldn't find any significant changes between these versions.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Document Creation Modal - NEW */}
        <DocumentCreationModal 
          isOpen={showDocumentCreationModal} 
          onClose={() => setShowDocumentCreationModal(false)}
          onDocumentGenerated={handleDocumentGenerated}
          projectId={projectId}
        />

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-w-md w-full"
              >
                <div className="bg-red-600 dark:bg-red-700 p-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-white">Delete Document</h2>
                    <button 
                      onClick={() => {
                        setShowDeleteModal(false)
                        setDocumentToDelete(null)
                      }}
                      className="text-white hover:text-gray-200 transition-colors"
                      disabled={isDeleting}
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mr-4">
                      <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Are you sure?</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">This action cannot be undone.</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      You are about to delete <span className="font-medium">"{documentToDelete?.title}"</span>. 
                      This will permanently remove the document.
                    </p>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button 
                      className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                      onClick={() => {
                        setShowDeleteModal(false)
                        setDocumentToDelete(null)
                      }}
                      disabled={isDeleting}
                    >
                      Cancel
                    </button>
                    <button 
                      className="flex-1 py-3 px-4 bg-red-600 dark:bg-red-500 text-white font-medium rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleDeleteDocument}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <Loader className="w-5 h-5 mr-2 animate-spin" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-5 h-5 mr-2" />
                          <span>Delete</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Analysis Modal (keeping existing logic) */}
        <AnimatePresence>
          {showAnalyzeModal && (
            <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-w-md w-full"
              >
                <div className="bg-indigo-600 dark:bg-indigo-700 p-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-white">Analyse documents</h2>
                    <button 
                      onClick={() => setShowAnalyzeModal(false)}
                      className="text-white hover:text-gray-200 transition-colors"
                      disabled={isAnalyzing}
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>
                
                {isAnalyzing && (
                  <div className="w-full bg-blue-100 dark:bg-blue-900">
                    <div 
                      className="h-1 bg-indigo-600 dark:bg-indigo-500 transition-all duration-300"
                      style={{ width: `${loadingProgress}%` }}
                    ></div>
                  </div>
                )}
                
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedDocuments.map((doc) => (
                        <div 
                          key={doc.id}
                          className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-full text-sm flex items-center"
                        >
                          {doc.title} {doc.version}
                          <button 
                            className="ml-2 text-indigo-400 dark:text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDocumentSelection(doc);
                            }}
                            disabled={isAnalyzing}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-300 text-[14px]">
                      {selectedDocuments.length === 0 ? (
                        "Please select at least two documents to analyze differences."
                      ) : (
                        `What are the changes made between these ${selectedDocuments.length} different versions, how would it impact me as`
                      )}
                    </p>
                  </div>
                  
                  <div className="mb-6">
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all text-[14px]"
                      placeholder="founder, investor, employee..."
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value)}
                      disabled={isAnalyzing}
                    />
                  </div>
                  
                  <div className="mb-6 text-[14px]">
                    <textarea
                      className="w-full p-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all"
                      rows={4}
                      placeholder="Additional requirements or specific aspects to analyze..."
                      value={analyzeQuery}
                      onChange={(e) => setAnalyzeQuery(e.target.value)}
                      disabled={isAnalyzing}
                    ></textarea>
                  </div>
                  
                  <button 
                    className="w-full py-3 bg-indigo-600 dark:bg-indigo-500 text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all flex items-center justify-center"
                    onClick={handleAnalyzeSubmit}
                    disabled={selectedDocuments.length < 2 || isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                        <span>Analyzing documents...</span>
                      </>
                    ) : (
                      <span>Start Analysing</span>
                    )}
                  </button>
                  
                  {isAnalyzing && (
                    <div className="mt-4">
                      <div className="text-center text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-2">
                        {loadingMessages[loadingPhase]}
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                        <div className="animate-pulse space-y-2">
                          <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded"></div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-5/6"></div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-4/6"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </>
  )
}