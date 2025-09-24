// Enhanced ProjectDocuments component with proper upload/generation handling
'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Loader,
  ArrowLeft,
  FileText,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import Header from '../../components/Header/Header'
import DocumentCreationModal from '../../components/DocumentEditing/DocumentCreationModal'
import { getToken } from '../../services/authApi'
import { DocumentAPI } from '../../services/documentApi'
import { useLanguage } from '../../context/LanguageContext'

// Import our components
import DocumentsGrid from './components/DocumentsGrid'
import DocumentOptionsModal from './components/DocumentOptionsModal'
import DeleteConfirmationModal from './components/DeleteConfirmationModal'
import { useUploadManager } from './components/useUploadManager'

// CSS for line clamping
const lineClampStyles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`

export default function ProjectDocuments() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id
  const { t } = useLanguage()

  // Main state
  const [showDocumentCreationModal, setShowDocumentCreationModal] = useState(false)
  const [showDocumentOptionsModal, setShowDocumentOptionsModal] = useState(false)
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState([])
  const [analyzeQuery, setAnalyzeQuery] = useState('')
  const [userRole, setUserRole] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [analysisResults, setAnalysisResults] = useState(null)
  const [viewMode, setViewMode] = useState('all')
  const [projectInfo, setProjectInfo] = useState(null)
  const [isLoadingProject, setIsLoadingProject] = useState(true)
  const [documents, setDocuments] = useState([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Analysis state
  const [analysisProgress, setAnalysisProgress] = useState('')
  const [analysisChanges, setAnalysisChanges] = useState([])
  const [analysisError, setAnalysisError] = useState(null)

  // Document status tracking - ONLY for uploaded documents
  const [documentStatuses, setDocumentStatuses] = useState({}) // contractId -> status info
  const [statusPollingIntervals, setStatusPollingIntervals] = useState({}) // contractId -> intervalId

  // Upload manager hook with enhanced callback
  const uploadManager = useUploadManager(projectId, (uploadedDocuments) => {
    console.log('Upload completed:', uploadedDocuments)
    
    // Start status polling ONLY for uploaded documents
    uploadedDocuments.forEach(doc => {
      if (doc.needsStatusPolling && doc.contractId) {
        console.log('Starting status polling for uploaded document:', doc.contractId)
        startStatusPolling(doc.contractId)
      }
    })
    
    // Refresh documents list
    fetchDocuments()
    
    // Close the DocumentOptionsModal when upload is completed
    if (uploadedDocuments.length > 0) {
      setShowDocumentOptionsModal(false)
    }
  })

  useEffect(() => {
    if (!getToken()) router.push('/sign-in')
  }, [router])

  useEffect(() => {
    async function fetchInfo() {
      if (!projectId) return
      try {
        const res = await fetch('https://api.getmediarank.com/api/v1/projects/list', {
          headers: { Authorization: `Bearer ${getToken()}` }
        })
        const list = await res.json()
        // Handle new API response structure - check both owned and shared projects
        const ownedProjects = list.owned_projects || [];
        const sharedProjects = list.shared_projects || [];
        const allProjects = [...ownedProjects, ...sharedProjects];
        const found = allProjects.find(p => p.id === projectId)
        if (found) setProjectInfo(found)
        else router.push('/projects')
      } catch {
        setProjectInfo({
          id: projectId,
          project_name: `Project ${projectId}`,
          user_id: '',
          date: new Date().toISOString()
        })
      } finally {
        setIsLoadingProject(false)
      }
    }
    fetchInfo()
  }, [projectId, router])

  // Enhanced document status checking - ONLY for uploaded documents
  const checkDocumentStatus = async (contractId) => {
    try {
      const statusResponse = await DocumentAPI.getDocumentStatus(contractId)
      if (statusResponse.success) {
        const { status, progress, error } = statusResponse
        
        setDocumentStatuses(prev => ({
          ...prev,
          [contractId]: { status, progress, error, lastChecked: Date.now() }
        }))

        // Update the specific document in the documents array
        setDocuments(prevDocs => 
          prevDocs.map(doc => 
            doc.contractId === contractId 
              ? {
                  ...doc,
                  status: status,
                  isProcessing: status === 'in_progress',
                  progress: progress || 0,
                  processingError: error
                }
              : doc
          )
        )

        // If document is done or error, stop polling
        if (status === 'done' || status === 'error') {
          const intervals = statusPollingIntervals
          if (intervals[contractId]) {
            clearInterval(intervals[contractId])
            delete intervals[contractId]
            setStatusPollingIntervals({ ...intervals })
          }
        }

        return { status, progress, error }
      }
    } catch (error) {
      console.error(`Error checking status for ${contractId}:`, error)
      return null
    }
  }

  // Start polling for document status - ONLY for uploaded documents
  const startStatusPolling = (contractId) => {
    // Don't start polling if already polling
    if (statusPollingIntervals[contractId]) {
      return
    }

    console.log(`Starting status polling for uploaded document ${contractId}`)
    
    // Initial check
    checkDocumentStatus(contractId)
    
    // Set up polling interval
    const intervalId = setInterval(() => {
      checkDocumentStatus(contractId)
    }, 3000) // Check every 3 seconds
    
    setStatusPollingIntervals(prev => ({
      ...prev,
      [contractId]: intervalId
    }))

    // Auto-stop polling after 10 minutes (safety measure)
    setTimeout(() => {
      if (statusPollingIntervals[contractId]) {
        clearInterval(statusPollingIntervals[contractId])
        setStatusPollingIntervals(prev => {
          const newIntervals = { ...prev }
          delete newIntervals[contractId]
          return newIntervals
        })
      }
    }, 600000) // 10 minutes
  }

  // Stop all polling when component unmounts
  useEffect(() => {
    return () => {
      Object.values(statusPollingIntervals).forEach(intervalId => {
        clearInterval(intervalId)
      })
    }
  }, [])

  async function fetchDocuments() {
    setIsLoadingDocuments(true)
    const resp = await DocumentAPI.getContracts(projectId)
    if (resp.success) {
      const transformed = resp.contracts.map(c => {
        const contractStatus = documentStatuses[c.id]
        
        return {
          id: c.id,
          title: c.name || c.title || `Document ${c.id.slice(0, 8)}`,
          date: new Date(c.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          status: contractStatus?.status || 'unknown', // Use actual API status
          type: 'document',
          version: c.version || 'v1',
          filename: (c.name || c.title || `Document_${c.id.slice(0, 8)}`) + '.html',
          contractId: c.id,
          // Enhanced processing info
          isProcessing: contractStatus?.status === 'in_progress',
          progress: contractStatus?.progress || 0,
          processingError: contractStatus?.error,
          // NEW: Determine document origin type
          documentType: c.document_type || 'generated', // 'uploaded' or 'generated'
          isUploaded: c.document_type === 'uploaded'
        }
      })
      
      setDocuments(transformed)
      
      // Start polling ONLY for uploaded documents that are still processing
      transformed.forEach(doc => {
        if (doc.isUploaded && doc.isProcessing && !statusPollingIntervals[doc.contractId]) {
          console.log('Starting polling for uploaded document:', doc.contractId)
          startStatusPolling(doc.contractId)
        }
      })
    } else {
      setDocuments([])
    }
    setIsLoadingDocuments(false)
  }

  useEffect(() => {
    if (getToken()) fetchDocuments()
  }, [projectId])

  // Enhanced document click handler
  const handleDocumentClick = (doc, event) => {
    if (event && (event.target.closest('.action-button') || event.defaultPrevented)) {
      return
    }
    
    if (isSelectionMode) {
      toggleDocumentSelection(doc)
      return
    }

    // DIFFERENT HANDLING FOR UPLOADED VS GENERATED DOCUMENTS
    if (doc.isUploaded) {
      // For uploaded documents, check processing status
      const docStatus = documentStatuses[doc.contractId]
      
      if (docStatus?.status === 'in_progress') {
        alert(`Document is still processing (${docStatus.progress}%). Please wait for it to complete.`)
        return
      }
      
      if (docStatus?.status === 'error') {
        alert(`Document processing failed: ${docStatus.error}. Please try regenerating the document.`)
        return
      }
      
      if (docStatus?.status !== 'done' && doc.status !== 'done') {
        // If we don't have status info, check it now
        checkDocumentStatus(doc.contractId).then(result => {
          if (result?.status === 'done') {
            // Status just became ready, allow navigation
            router.push(`/documents?contract_id=${doc.contractId}&ready=true`)
          } else if (result?.status === 'in_progress') {
            alert(`Document is still processing (${result.progress}%). Please wait for it to complete.`)
            // Start polling if not already polling
            if (!statusPollingIntervals[doc.contractId]) {
              startStatusPolling(doc.contractId)
            }
          } else if (result?.status === 'error') {
            alert(`Document processing failed: ${result.error}. Please try regenerating the document.`)
          } else {
            alert('Unable to determine document status. Please try again.')
          }
        })
        return
      }
    }
    
    // For both uploaded (ready) and generated documents, navigate to document viewer
    router.push(`/documents?contract_id=${doc.contractId}&ready=true`)
  }

  const toggleDocumentSelection = (doc) => {
    if (selectedDocuments.some(x => x.id === doc.id)) {
      setSelectedDocuments(s => s.filter(x => x.id !== doc.id))
    } else {
      setSelectedDocuments(s => [...s, doc])
      setIsSelectionMode(true)
    }
  }

  const handleRenameDocument = async (doc, newTitle) => {
    const result = await DocumentAPI.renameDocument(doc.contractId, newTitle)
    
    if (result.success) {
      setDocuments(docs => docs.map(d => 
        d.id === doc.id 
          ? { ...d, title: result.title }
          : d
      ))
    } else {
      throw new Error('Failed to rename document')
    }
  }

  const confirmDeleteDocument = (doc) => {
    setDocumentToDelete(doc)
    setShowDeleteModal(true)
  }

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return
    setIsDeleting(true)
    try {
      const resp = await DocumentAPI.deleteDocument(documentToDelete.contractId)
      if (resp.success) {
        setDocuments(d => d.filter(x => x.id !== documentToDelete.id))
        setSelectedDocuments(s => s.filter(x => x.id !== documentToDelete.id))
        
        // Stop polling for this document if it was being polled
        const intervals = statusPollingIntervals
        if (intervals[documentToDelete.contractId]) {
          clearInterval(intervals[documentToDelete.contractId])
          delete intervals[documentToDelete.contractId]
          setStatusPollingIntervals({ ...intervals })
        }
        
        // Remove from status tracking
        setDocumentStatuses(prev => {
          const newStatuses = { ...prev }
          delete newStatuses[documentToDelete.contractId]
          return newStatuses
        })
        
        setShowDeleteModal(false)
        setDocumentToDelete(null)
      } else {
        alert('Error deleting document')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete document: ' + (error.message || 'Unknown error'))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleVersionUpdate = async (doc, newVersion) => {
    try {
      console.log('Updating version for document:', doc.contractId, 'to version:', newVersion)
      const result = await DocumentAPI.updateDocumentVersion(doc.contractId, newVersion)
      
      if (result.success) {
        setDocuments(docs => docs.map(d => 
          d.id === doc.id 
            ? { ...d, version: result.version }
            : d
        ))
        
        setSelectedDocuments(selected => selected.map(d =>
          d.id === doc.id
            ? { ...d, version: result.version }
            : d
        ))
        
        console.log('Version updated successfully to:', result.version)
      } else {
        throw new Error('Failed to update version')
      }
    } catch (error) {
      console.error('Version update error:', error)
      alert('Failed to update document version: ' + (error.message || 'Unknown error'))
    }
  }

  // Modal handlers
  const handleCreateDocument = () => {
    setShowDocumentOptionsModal(true)
  }

  const handleGenerateDocument = () => {
    setShowDocumentOptionsModal(false)
    setShowDocumentCreationModal(true)
  }

  const handleUploadDocument = () => {
    uploadManager.triggerFileInput()
  }

  const handleTemplateDocument = () => {
    setShowDocumentOptionsModal(false)
    router.push(`/templates?project_id=${projectId}`)
  }

  const handleCloseDocumentOptions = () => {
    setShowDocumentOptionsModal(false)
    uploadManager.resetUpload()
  }

  // Selection handlers
  const clearSelectionMode = () => {
    setSelectedDocuments([])
    setIsSelectionMode(false)
  }

  useEffect(() => {
    if (!selectedDocuments.length) setIsSelectionMode(false)
  }, [selectedDocuments])

  // ENHANCED: Handle document generation completion - navigate to documents page
  const handleDocumentGenerated = (contractId) => {
    console.log(`Generated document creation started for contract: ${contractId}`)
    
    // For GENERATED documents, navigate to documents page to show generation process
    router.push(`/documents?contract_id=${contractId}`)
  }

  // Analysis handlers (keeping existing implementation)
  const handleAnalyzeSubmit = async () => {
    if (selectedDocuments.length < 2) {
      alert('Please select at least two documents for analysis')
      return
    }

    if (!userRole.trim()) {
      alert('Please enter your role for the analysis')
      return
    }

    setAnalysisChanges([])
    setAnalysisProgress('')
    setAnalysisError(null)
    setIsAnalyzing(true)
    
    const contractIds = selectedDocuments.map(doc => doc.contractId)
    console.log('Starting analysis for contracts:', contractIds)
    
    try {
      await DocumentAPI.analyzeDocuments(
        contractIds,
        userRole,
        analyzeQuery,
        (progressData) => {
          console.log('Analysis progress:', progressData)
          
          if (progressData.type === 'started') {
            setAnalysisProgress(progressData.message)
          } else if (progressData.type === 'change') {
            setAnalysisChanges(progressData.changes)
            setAnalysisProgress(`Discovered ${progressData.changes.length} changes...`)
            
            setTimeout(() => {
              const element = document.getElementById('changes-bottom')
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' })
              }
            }, 100)
          }
        },
        (result) => {
          console.log('Analysis completed:', result)
          setAnalysisResults({
            changes: result.changes,
            totalChanges: result.totalChanges,
            documents: selectedDocuments,
            userRole: userRole,
            query: analyzeQuery
          })
          setIsAnalyzing(false)
          setShowAnalyzeModal(false)
          setShowResults(true)
        },
        (error) => {
          console.error('Analysis error:', error)
          setAnalysisError(error.message || 'Analysis failed')
          setIsAnalyzing(false)
        }
      )
    } catch (error) {
      console.error('Analysis error:', error)
      setAnalysisError(error.message || 'Analysis failed')
      setIsAnalyzing(false)
    }
  }

  // Group documents for grouped view
  const grouped = documents.reduce((acc, d) => {
    const baseTitle = d.title.replace(/\s*v\d+(\.\d+)?\s*$/i, '').trim()
    const groupKey = baseTitle || d.title
    acc[groupKey] = acc[groupKey] || []
    acc[groupKey].push(d)
    return acc
  }, {})

  Object.values(grouped).forEach(arr =>
    arr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  )

  const handleBack = () => router.push('/projects')

  if (isLoadingProject) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <Header />
        <div className="flex justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      </div>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: lineClampStyles }} />
      <Header />

      <input
        ref={uploadManager.fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        multiple
        onChange={uploadManager.handleFileUpload}
        className="hidden"
        disabled={uploadManager.isUploading}
      />

      <div className="min-h-screen p-6 bg-gray-50 dark:bg-black">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-6">
            <button onClick={handleBack} className="mr-4 p-2 rounded-full bg-gray-100 dark:bg-gray-700">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                <span>Projects</span>
                <span>›</span>
                <span>{projectInfo?.project_name}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                Documents
              </h1>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center mb-8">
            <p className="text-gray-600 dark:text-gray-300">Manage your project documents</p>
            <div className="flex items-center space-x-4 text-[14px]">
              <div className="flex rounded-lg border">
                <button
                  onClick={() => setViewMode('all')}
                  className={`px-4 py-2 ${viewMode === 'all' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                  All Documents
                </button>
                <button
                  onClick={() => setViewMode('grouped')}
                  className={`px-4 py-2 ${viewMode === 'grouped' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                  By Contract
                </button>
              </div>
              <button
                onClick={() =>
                  selectedDocuments.length === documents.length
                    ? clearSelectionMode()
                    : (setIsSelectionMode(true), setSelectedDocuments(documents))
                }
                className="px-4 py-2 border rounded-lg">
                {selectedDocuments.length === documents.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={() => setShowAnalyzeModal(true)}
                disabled={selectedDocuments.length < 2}
                className={`px-6 py-3 rounded-lg ${
                  selectedDocuments.length < 2
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                } flex items-center space-x-2 transition-colors`}>
                <Search size={18} />
                <span>Analyze ({selectedDocuments.length})</span>
              </button>
            </div>
          </div>

          {/* Content */}
          {isLoadingDocuments ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-indigo-500" />
              <span className="ml-3 text-gray-600 dark:text-gray-300">Loading documents...</span>
            </div>
          ) : viewMode === 'all' ? (
            <DocumentsGrid
              documents={documents}
              selectedDocuments={selectedDocuments}
              isSelectionMode={isSelectionMode}
              onCreateDocument={handleCreateDocument}
              onDocumentClick={handleDocumentClick}
              onToggleSelection={toggleDocumentSelection}
              onRenameDocument={handleRenameDocument}
              onDeleteDocument={confirmDeleteDocument}
              onVersionUpdate={handleVersionUpdate}
            />
          ) : (
            <div className="space-y-8">
              {Object.entries(grouped).map(([groupKey, groupDocs]) => (
                <div key={groupKey} className="p-6 rounded-xl shadow bg-white dark:bg-gray-800">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                      {groupKey}
                    </h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {groupDocs.length} Document{groupDocs.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {groupDocs.map(doc => (
                      <motion.div
                        key={doc.id}
                        whileHover={{ y: -5 }}
                        onClick={(e) => handleDocumentClick(doc, e)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedDocuments.some(d => d.id === doc.id)
                            ? 'ring-2 ring-indigo-500 border-indigo-300'
                            : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300'
                        } ${doc.isProcessing ? 'opacity-75' : ''}`}>
                        <div className="flex items-center mb-2">
                          <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded mr-3">
                            {doc.isProcessing ? (
                              <Loader className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
                            ) : (
                              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            )}
                          </div>
                          <div className="flex-1">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-100 block">
                            {doc.title.split(" ").slice(0, 5).join(" ") + (doc.title.split(" ").length > 5 ? "..." : "")}
                            </span>

                            {doc.isProcessing && (
                              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                Processing... {doc.progress}%
                              </div>
                            )}
                            {doc.isUploaded && (
                              <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                📁 Uploaded
                              </div>
                            )}
                            {selectedDocuments.some(d => d.id === doc.id) && (
                              <div className="inline-block mt-1 w-4 h-4 bg-indigo-500 dark:bg-indigo-400 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{doc.date}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modals */}
          <DocumentCreationModal
            isOpen={showDocumentCreationModal}
            onClose={() => setShowDocumentCreationModal(false)}
            onDocumentGenerated={handleDocumentGenerated}
            projectId={projectId}
          />

          <DocumentOptionsModal
            isOpen={showDocumentOptionsModal}
            onClose={handleCloseDocumentOptions}
            onGenerate={handleGenerateDocument}
            onTemplate={handleTemplateDocument}
            onUpload={handleUploadDocument}
            isUploading={uploadManager.isUploading}
            uploadingFiles={uploadManager.uploadingFiles}
            uploadError={uploadManager.uploadError}
            setUploadError={uploadManager.setUploadError}
            isDraggingOver={uploadManager.isDraggingOver}
            onDragEnter={uploadManager.handleDragEnter}
            onDragLeave={uploadManager.handleDragLeave}
            onDragOver={uploadManager.handleDragOver}
            onDrop={uploadManager.handleDrop}
          />

          <DeleteConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDeleteDocument}
            documentTitle={documentToDelete?.title || ''}
            isDeleting={isDeleting}
          />

          {/* Analysis Modal with Real-time Changes */}
          <AnimatePresence>
            {showAnalyzeModal && (
              <motion.div
                className="fixed inset-0 flex items-center justify-center bg-black/40 p-4 z-50"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}>
                <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full transition-all duration-300 ${
                  isAnalyzing ? 'max-w-7xl max-h-[90vh]' : 'max-w-lg'
                } overflow-hidden flex flex-col`}>
                  <div className="bg-indigo-600 dark:bg-indigo-700 p-4 flex justify-between rounded-t-xl flex-shrink-0">
                    <h2 className="text-lg font-semibold text-white">
                      {isAnalyzing ? 'Document Analysis in Progress' : 'Analyze Documents'}
                    </h2>
                    <button 
                      onClick={() => setShowAnalyzeModal(false)} 
                      disabled={isAnalyzing} 
                      className="text-white hover:text-gray-200 disabled:opacity-50">
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className={`flex-1 overflow-hidden ${isAnalyzing ? 'flex' : ''}`}>
                    {/* Left Panel - Form (when analyzing) or Full Panel (when not analyzing) */}
                    <div className={`${isAnalyzing ? 'w-1/3 border-r border-gray-200 dark:border-gray-600' : 'w-full'} p-6 overflow-y-auto`}>
                      <div className="mb-4">
                        <p className="text-gray-600 dark:text-gray-300 mb-2">
                          Selected Documents ({selectedDocuments.length}):
                        </p>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {selectedDocuments.map(doc => (
                            <div key={doc.id} className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <FileText className="w-3 h-3 mr-1" />
                              {doc.title}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Your Role *
                        </label>
                        <input
                          type="text"
                          className="w-full p-3 border rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="e.g., Investor, Legal Advisor, Business Analyst"
                          value={userRole}
                          onChange={e => setUserRole(e.target.value)}
                          disabled={isAnalyzing}
                        />
                      </div>
                      
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Additional Requirements (Optional)
                        </label>
                        <textarea
                          rows={3}
                          className="w-full p-3 border rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="e.g., Focus on financial terms, voting rights, and exit clauses..."
                          value={analyzeQuery}
                          onChange={e => setAnalyzeQuery(e.target.value)}
                          disabled={isAnalyzing}
                        />
                      </div>

                      {/* Analysis Progress */}
                      {isAnalyzing && (
                        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                          <div className="flex items-center mb-2">
                            <Loader className="w-4 h-4 animate-spin text-blue-600 mr-2" />
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                              Analyzing documents...
                            </span>
                          </div>
                          {analysisProgress && (
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                              {analysisProgress}
                            </p>
                          )}
                          <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                            {analysisChanges.length} change{analysisChanges.length !== 1 ? 's' : ''} found so far...
                          </p>
                        </div>
                      )}

                      {/* Analysis Error */}
                      {analysisError && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                          <div className="flex items-center">
                            <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                            <span className="text-sm font-medium text-red-800 dark:text-red-300">
                              Analysis Failed
                            </span>
                          </div>
                          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                            {analysisError}
                          </p>
                        </div>
                      )}
                      
                      <button 
                        onClick={handleAnalyzeSubmit} 
                        disabled={selectedDocuments.length < 2 || !userRole.trim() || isAnalyzing} 
                        className="w-full py-3 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                        {isAnalyzing ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin mr-2" />
                            <span>Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-5 h-5 mr-2" />
                            <span>Start Analysis</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Right Panel - Real-time Changes Display (only when analyzing) */}
                    {isAnalyzing && (
                      <div className="w-2/3 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                            Changes Discovered ({analysisChanges.length})
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Changes appear here as they are discovered in real-time
                          </p>
                        </div>

                        {/* Real-time Changes List */}
                        <div className="space-y-4">
                          {analysisChanges.length === 0 ? (
                            <div className="text-center py-8">
                              <Loader className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
                              <p className="text-gray-500 dark:text-gray-400">
                                Waiting for changes to be discovered...
                              </p>
                            </div>
                          ) : (
                            analysisChanges.map((change, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-4 shadow-sm">
                                
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                                    {change.section}
                                  </h4>
                                  <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded">
                                    Change #{idx + 1}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
                                  <div className="p-3 rounded border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
                                    <div className="text-xs text-red-600 dark:text-red-400 mb-1 font-medium">
                                      BEFORE ({change.version_from || 'Original'})
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed line-clamp-3">
                                      {change.before}
                                    </p>
                                  </div>
                                  <div className="p-3 rounded border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20">
                                    <div className="text-xs text-green-600 dark:text-green-400 mb-1 font-medium">
                                      AFTER ({change.version_to || 'Updated'})
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed line-clamp-3">
                                      {change.after}
                                    </p>
                                  </div>
                                </div>
                                
                                {change.impact_for_role && (
                                  <div className="p-3 rounded border border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20">
                                    <div className="text-xs text-yellow-700 dark:text-yellow-400 mb-1 font-medium">
                                      IMPACT FOR {userRole.toUpperCase()}
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed line-clamp-2">
                                      {change.impact_for_role}
                                    </p>
                                  </div>
                                )}
                              </motion.div>
                            ))
                          )}
                        </div>

                        {/* Auto-scroll to bottom when new changes arrive */}
                        <div id="changes-bottom" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Analysis Results Modal */}
          <AnimatePresence>
            {showResults && analysisResults && (
              <motion.div
                className="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="bg-indigo-600 dark:bg-indigo-700 p-4 flex justify-between items-center sticky top-0 rounded-t-xl">
                    <div>
                      <h2 className="text-xl font-semibold text-white">Analysis Results</h2>
                      <p className="text-indigo-100 text-sm">
                        {analysisResults.totalChanges} change{analysisResults.totalChanges !== 1 ? 's' : ''} found • Role: {analysisResults.userRole}
                      </p>
                    </div>
                    <button 
                      onClick={() => setShowResults(false)}
                      className="text-white hover:text-gray-200">
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="p-6">
                    {analysisResults.changes && analysisResults.changes.length > 0 ? (
                      <div className="space-y-6">
                        {analysisResults.changes.map((change, idx) => (
                          <div key={idx} className="border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4 text-indigo-700 dark:text-indigo-400">
                              {change.section}
                            </h3>
                            
                            <div className="grid lg:grid-cols-2 gap-4 mb-4">
                              <div className="p-4 rounded-lg border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
                                <div className="text-xs text-red-600 dark:text-red-400 mb-2 font-medium">
                                  BEFORE ({change.version_from || 'Original'})
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                  {change.before}
                                </p>
                              </div>
                              <div className="p-4 rounded-lg border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20">
                                <div className="text-xs text-green-600 dark:text-green-400 mb-2 font-medium">
                                  AFTER ({change.version_to || 'Updated'})
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                  {change.after}
                                </p>
                              </div>
                            </div>
                            
                            <div className="p-4 rounded-lg border border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20">
                              <div className="text-xs text-yellow-700 dark:text-yellow-400 mb-2 font-medium">
                                IMPACT FOR {analysisResults.userRole.toUpperCase()}
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                {change.impact_for_role || change.impact || 'No specific impact analysis available.'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                        <h3 className="text-xl font-medium text-gray-600 dark:text-gray-300 mb-2">
                          No Changes Found
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          The selected documents appear to be identical or have no significant differences.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}