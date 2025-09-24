"use client"
import React, { useState, useEffect, useRef } from 'react'
import { Plus, Calendar, Trash2, AlertCircle, X, Upload, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Header from '../../components/Header/Header'
import Image from 'next/image'
import { getToken } from '../../services/authApi'
import { useLanguage } from '../../context/LanguageContext';

// Enhanced Modal Component with PDF Upload Support
const CreateTemplateModal = ({ isOpen, onClose, onSubmit, isCreating }) => {
  const [templateName, setTemplateName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (templateName.trim() && selectedFile) {
      onSubmit({
        name: templateName.trim(),
        description: description.trim(),
        file: selectedFile
      })
    }
  }

  const handleClose = () => {
    setTemplateName('')
    setDescription('')
    setSelectedFile(null)
    setUploadError('')
    onClose()
  }

  const validateFile = (file) => {
    // Check if file is PDF, DOC, or DOCX
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Only PDF, DOC, and DOCX files are allowed')
      return false
    }
    
    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (file.size > maxSize) {
      setUploadError('File size must be less than 10MB')
      return false
    }
    
    setUploadError('')
    return true
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (file && validateFile(file)) {
      setSelectedFile(file)
      // Auto-fill template name from filename if empty
      if (!templateName.trim()) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
        setTemplateName(nameWithoutExt)
      }
    }
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (validateFile(file)) {
        setSelectedFile(file)
        // Auto-fill template name from filename if empty
        if (!templateName.trim()) {
          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
          setTemplateName(nameWithoutExt)
        }
      }
    }
  }

  const handleClickUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setUploadError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!isOpen) return null

  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t.vault.createTemplateFromPDF}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isCreating}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* PDF Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.vault.uploadPDFDocument} *
            </label>
            
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
            />
            
            {!selectedFile ? (
              // Drop zone
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  isDragging 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
                onClick={handleClickUpload}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {isDragging ? t.vault.dropPDFHere : t.vault.uploadPDFDocument}
                </p>
                <p className="text-xs text-gray-500">
                  {t.vault.dragAndDropOrClickToBrowse} (Max 10MB)
                </p>
              </div>
            ) : (
              // Selected file display
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                {selectedFile.name.length > 30
                  ? selectedFile.name.substring(0, 30) + "..."
                  : selectedFile.name}
              </p>



                      <p className="text-xs text-gray-500">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    disabled={isCreating}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Upload error */}
            {uploadError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-2 flex-shrink-0" />
                {uploadError}
              </div>
            )}
          </div>

          {/* Template Name */}
          <div>
            <label htmlFor="templateName" className="block text-sm font-medium text-gray-700 mb-2">
              {t.vault.templateName} *
            </label>
            <input
              type="text"
              id="templateName"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t.vault.enterTemplateName}
              disabled={isCreating}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              {t.vault.description}
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder={t.vault.optionalDescription}
              disabled={isCreating}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              disabled={isCreating}
            >
              {t.vault.cancel}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={isCreating || !templateName.trim() || !selectedFile}
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t.vault.creating}
                </>
              ) : (
                t.vault.createTemplate
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function VaultTemplatesPage() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  const API_BASE_URL = 'https://api.getmediarank.com/api/v1'

  // Helper function to get auth headers
  const authHeaders = () => {
    const token = getToken()
    return {
      'Authorization': `Bearer ${token}`
    }
  }

  // Fetch all templates
  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/templates`, {
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setTemplates(data)
      setError(null)
    } catch (err) {
      setError(`Failed to fetch templates: ${err.message}`)
      console.error('Error fetching templates:', err)
    } finally {
      setLoading(false)
    }
  }

  // Create template from PDF using the new API
  const createTemplateFromPDF = async (templateData) => {
    try {
      setCreating(true)
      const formData = new FormData()
      formData.append('file', templateData.file)
      formData.append('name', templateData.name)
      formData.append('description', templateData.description || `Template created from ${templateData.file.name}`)

      const response = await fetch(`${API_BASE_URL}/templates/from_pdf`, {
        method: 'POST',
        body: formData,
        headers: authHeaders()
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      const newTemplate = await response.json()
      
      // Add the new template to the list
      setTemplates(prev => [newTemplate, ...prev])
      setError(null)
      setIsModalOpen(false) // Close modal on success
    } catch (err) {
      setError(`Failed to create template: ${err.message}`)
      console.error('Error creating template:', err)
    } finally {
      setCreating(false)
    }
  }

  // Delete template
  const deleteTemplate = async (templateId) => {
    try {
      setDeletingId(templateId)
      const response = await fetch(`${API_BASE_URL}/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Remove the template from the list
      setTemplates(prev => prev.filter(template => template.template_id !== templateId))
      setError(null)
    } catch (err) {
      setError(`Failed to delete template: ${err.message}`)
      console.error('Error deleting template:', err)
    } finally {
      setDeletingId(null)
    }
  }

  // Navigate to template editor
  const handleTemplateClick = (templateId) => {
    router.push(`/vault/${templateId}`)
  }

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  // Load templates on component mount
  useEffect(() => {
    fetchTemplates()
  }, [])

  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            {t.vault.vaultTemplates}
          </h1>
          <p className="text-gray-600">
            {t.vault.browseTemplatesOrCreateNew}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
                <div className="space-y-2 mb-4">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/5"></div>
                </div>
                <div className="space-y-2 mb-6">
                  <div className="h-2 bg-gray-100 rounded w-full"></div>
                  <div className="h-2 bg-gray-100 rounded w-3/4"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          /* Templates Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-base">
            {/* Create New Template Card */}
            <div 
              onClick={() => setIsModalOpen(true)}
              className="border-2 border-dashed border-blue-300 rounded-lg p-6 flex flex-col items-center justify-center min-h-[240px] hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-base font-semibold text-blue-600 text-center">
                {t.vault.createFromPDF}
              </h3>
              <p className="text-sm text-gray-500 text-center mt-2">
                {t.vault.uploadPDFToCreateNewTemplate}
              </p>
            </div>

            {/* Template Cards */}
            {templates.map((template) => (
              <div
                key={template.template_id}
                onClick={() => handleTemplateClick(template.template_id)}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer min-h-[240px] flex flex-col group relative"
              >
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteTemplate(template.template_id)
                  }}
                  disabled={deletingId === template.template_id}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                >
                  {deletingId === template.template_id ? (
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>

                {/* Document Preview Lines */}
                <div className="flex-1 mb-6">
                  <div className="space-y-2 mb-4">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/5"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 bg-gray-100 rounded w-full"></div>
                    <div className="h-2 bg-gray-100 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-100 rounded w-5/6"></div>
                  </div>
                </div>

                {/* Template Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 truncate" title={template.name}>
                    {template.name}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{formatDate(template.created_at)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {t.vault.ready}
                    </span>
                    <span className="text-xs text-gray-400">
                      {t.vault.by} {template.created_by}
                    </span>
                  </div>
                  {template.description && (
                    <p className="text-xs text-gray-500 truncate" title={template.description}>
                      {template.description}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Empty State */}
            {templates.length === 0 && !loading && (
              <div className="col-span-full text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t.vault.noTemplatesYet}
                </h3>
                <p className="text-gray-500 mb-4">
                  {t.vault.uploadPDFDocumentToCreateYourFirstTemplate}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      <CreateTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={createTemplateFromPDF}
        isCreating={creating}
      />
    </div>
  )
}

export default VaultTemplatesPage