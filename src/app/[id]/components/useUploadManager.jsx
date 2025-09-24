// Enhanced useUploadManager hook with proper document type tracking
import { useState, useRef } from 'react'
import { DocumentAPI } from '../../../services/documentApi'

export function useUploadManager(projectId, onUploadComplete) {
  const [uploadingFiles, setUploadingFiles] = useState([])
  const [uploadError, setUploadError] = useState(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  const fileInputRef = useRef(null)

  // Validate files
  const validateFiles = (files) => {
    const validFiles = []
    const errors = []
    
    Array.from(files).forEach((file) => {
      // Check if file is a PDF or DOC/DOCX
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
      if (!allowedTypes.includes(file.type)) {
        errors.push(`File "${file.name}" is not a supported format (PDF, DOC, DOCX)`)
        return
      }
      
      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        errors.push(`File "${file.name}" is too large (max 10MB)`)
        return
      }
      
      validFiles.push(file)
    })
    
    return { validFiles, errors }
  }

  // Upload multiple files and track them for status polling
  const uploadMultipleFiles = async (files) => {
    const { validFiles, errors } = validateFiles(files)
    
    if (errors.length > 0) {
      setUploadError(errors.join(', '))
      return { success: false, errors }
    }
    
    if (validFiles.length === 0) {
      setUploadError('No valid files to upload')
      return { success: false, errors: ['No valid files'] }
    }
    
    setUploadError(null)
    
    // Initialize upload tracking for each file
    const fileUploadStates = validFiles.map((file, index) => ({
      id: `${file.name}-${Date.now()}-${index}`,
      name: file.name,
      status: 'uploading',
      progress: 0,
      error: null,
      contractId: null
    }))
    
    setUploadingFiles(fileUploadStates)
    
    const uploadedDocuments = []
    
    // Upload files one by one
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]
      const fileState = fileUploadStates[i]
      
      try {
        // Update progress to show starting
        setUploadingFiles(prev => prev.map(f => 
          f.id === fileState.id 
            ? { ...f, progress: 25 }
            : f
        ))
        
        const result = await DocumentAPI.uploadDocumentFromPDF(
          projectId,
          file,
          `Uploaded document: ${file.name}`
        )
        
        if (result.success) {
          // Update progress to complete
          setUploadingFiles(prev => prev.map(f => 
            f.id === fileState.id 
              ? { ...f, status: 'completed', progress: 100, contractId: result.contract_id }
              : f
          ))
          
          // Add to uploaded documents list with type marking
          uploadedDocuments.push({
            contractId: result.contract_id,
            fileName: file.name,
            type: 'uploaded', // Mark as uploaded document
            needsStatusPolling: true // Flag for status polling
          })
        } else {
          throw new Error('Upload failed')
        }
      } catch (error) {
        console.error(`Upload error for ${file.name}:`, error)
        setUploadingFiles(prev => prev.map(f => 
          f.id === fileState.id 
            ? { ...f, status: 'error', error: error.message || 'Upload failed' }
            : f
        ))
      }
    }
    
    // Call completion callback with uploaded documents info
    if (onUploadComplete) {
      onUploadComplete(uploadedDocuments)
    }
    
    // Auto-reset after 2 seconds if all uploads completed successfully
    setTimeout(() => {
      setUploadingFiles(prev => {
        const allCompleted = prev.every(f => f.status === 'completed')
        const hasErrors = prev.some(f => f.status === 'error')
        
        if (allCompleted && !hasErrors) {
          return []
        }
        
        return prev
      })
    }, 2000)
    
    return { 
      success: true, 
      uploadedDocuments,
      totalUploaded: uploadedDocuments.length 
    }
  }

  // File input handler
  const handleFileUpload = async (event) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    
    const result = await uploadMultipleFiles(files)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    return result
  }

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(prev => prev + 1)
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOver(true)
    }
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(prev => prev - 1)
    if (dragCounter === 1) {
      setIsDraggingOver(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)
    setDragCounter(0)
    
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      return await uploadMultipleFiles(files)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const isUploading = uploadingFiles.some(f => f.status === 'uploading')

  const resetUpload = () => {
    setUploadingFiles([])
    setUploadError(null)
    setIsDraggingOver(false)
    setDragCounter(0)
  }

  return {
    uploadingFiles,
    uploadError,
    setUploadError,
    isDraggingOver,
    isUploading,
    fileInputRef,
    handleFileUpload,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    triggerFileInput,
    resetUpload,
    uploadMultipleFiles // Expose for direct use
  }
}