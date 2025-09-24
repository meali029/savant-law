"use client"
import React, { useState, useEffect } from 'react'
import { Calendar, Search, FileText, Upload, Mic, X, AlertCircle, Loader2, Loader, CheckCircle } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext';
import { getToken, getUserId, getCurrentUser } from '../../services/authApi';

function TemplateDocumentModal({ isOpen, onClose, templateData, onDocumentGenerated }) {
  const { t } = useLanguage();
  const tc = t.documentCreationModal || t; // fallback to t if documentCreationModal is undefined
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    situationDescription: '',
    answers: {},
    files: []
  })

  const [contractId, setContractId] = useState('')
  const [isInitializing, setIsInitializing] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState(new Set()) // Track which files are uploading
  const [uploadedFiles, setUploadedFiles] = useState(new Set()) // Track which files are uploaded
  const [fileUploadErrors, setFileUploadErrors] = useState({}) // Track upload errors
  const [templateQuestions, setTemplateQuestions] = useState([])
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [isLoadingAIAnswers, setIsLoadingAIAnswers] = useState(false)
  const [aiAnswersProgress, setAiAnswersProgress] = useState('')
  const [aiAnswersError, setAiAnswersError] = useState(null)
  const [streamingAnswers, setStreamingAnswers] = useState({})

  const fileInputRef = React.useRef(null)
  const hasInitializedRef = React.useRef(false)

  // Initialize contract when modal opens
  useEffect(() => {
    if (isOpen && !contractId && templateData?.id && !hasInitializedRef.current) {
      hasInitializedRef.current = true
      initializeContract()
    }
  }, [isOpen, contractId, templateData?.id])

  const initializeContract = async () => {
    // Prevent duplicate calls
    if (isInitializing) {
      return
    }
    
    setIsInitializing(true)
    try {
      const token = getToken()
      if (!token) {
        throw new Error('No authentication token available')
      }

      const response = await fetch('https://api.getmediarank.com/api/v1/contracts/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          template_id: templateData?.id
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setContractId(data.contract_id)
    } catch (error) {
      console.error('Error initializing contract:', error)
      setError('Failed to initialize contract')
    } finally {
      setIsInitializing(false)
    }
  }

  if (!isOpen) return null

  const handleNext = async () => {
    setError('')
    setLoading(true)
    
    try {
      if (currentStep === 1) {
        // Step 1: Validate and submit description
        if (!formData.situationDescription.trim()) {
          setError('Please provide a situation description')
          setLoading(false)
          return
        }

        // Submit description to API
        if (contractId) {
          const token = getToken()
          if (!token) {
            throw new Error('No authentication token available')
          }

          const response = await fetch(`https://api.getmediarank.com/api/v1/contracts/${contractId}/description`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              description: formData.situationDescription
            })
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          // Proceed to step 2 after successful submission
          setCurrentStep(2)
          
          // Load template questions
          if (templateData && templateData.id) {
            loadTemplateQuestions(templateData.id)
          }
        } else {
          throw new Error('Contract ID not available')
        }
      } else if (currentStep === 2) {
        // Step 2: Submit answers and close modal
        if (contractId && templateData && templateData.id) {
          const token = getToken()
          if (!token) {
            throw new Error('No authentication token available')
          }

          const response = await fetch(`https://api.getmediarank.com/api/v1/template-management/contracts/${contractId}/templates/${templateData.id}/submit_answers`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              answers: formData.answers
            })
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const result = await response.json()
          console.log('Answers submitted successfully:', result)
        }
        
        // Close modal and start document generation
        onClose()
        
        // Start document generation with polling
        if (onDocumentGenerated) {
          onDocumentGenerated(contractId)
        }
        
        // Reset form
        resetForm()
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.')
    }
    
    setLoading(false)
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError('')
    }
  }

  const resetForm = () => {
    setCurrentStep(1)
    setError('')
    setContractId('')
    setUploadingFiles(new Set())
    setUploadedFiles(new Set())
    setFileUploadErrors({})
    setTemplateQuestions([])
    setIsLoadingQuestions(false)
    setAiAnswersProgress('')
    setAiAnswersError(null)
    setStreamingAnswers({})
    hasInitializedRef.current = false
    setFormData({
      situationDescription: '',
      answers: {},
      files: []
    })
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAnswerChange = (questionKey, answer) => {
    setFormData(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionKey]: answer
      }
    }))
  }

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files)
    
    // Filter for supported files (PDF, DOC, DOCX)
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    const supportedFiles = files.filter(file => allowedTypes.includes(file.type))
    
    // Add files to form data immediately
    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...supportedFiles]
    }))

    // Upload each supported file
    if (contractId) {
      supportedFiles.forEach(file => {
        uploadFileToAPI(file)
      })
    }
  }

  const uploadFileToAPI = async (file) => {
    const fileId = `${file.name}-${file.lastModified}` // Unique identifier for the file
    
    try {
      setUploadingFiles(prev => new Set([...prev, fileId]))
      setFileUploadErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fileId]
        return newErrors
      })

      const token = getToken()
      if (!token) {
        throw new Error('No authentication token available')
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`https://api.getmediarank.com/api/v1/contracts/${contractId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Mark as successfully uploaded
      setUploadedFiles(prev => new Set([...prev, fileId]))
      
    } catch (uploadError) {
      console.error(`Failed to upload ${file.name}:`, uploadError.message)
      setFileUploadErrors(prev => ({
        ...prev,
        [fileId]: uploadError.message
      }))
    } finally {
      setUploadingFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(fileId)
        return newSet
      })
    }
  }

  const removeFile = (index) => {
    const fileToRemove = formData.files[index]
    const fileId = `${fileToRemove.name}-${fileToRemove.lastModified}`
    
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }))
    
    // Clean up tracking states
    setUploadingFiles(prev => {
      const newSet = new Set(prev)
      newSet.delete(fileId)
      return newSet
    })
    setUploadedFiles(prev => {
      const newSet = new Set(prev)
      newSet.delete(fileId)
      return newSet
    })
    setFileUploadErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fileId]
      return newErrors
    })
  }

  const getFileStatus = (file) => {
    const fileId = `${file.name}-${file.lastModified}`
    const isUploading = uploadingFiles.has(fileId)
    const isUploaded = uploadedFiles.has(fileId)
    const hasError = fileUploadErrors[fileId]
    
    return { isUploading, isUploaded, hasError, fileId }
  }

  const loadTemplateQuestions = async (templateId) => {
    setIsLoadingQuestions(true)
    try {
      const token = getToken()
      if (!token) {
        throw new Error('No authentication token available')
      }

      const response = await fetch(`https://api.getmediarank.com/api/v1/template-management/templates/${templateId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.questions && Array.isArray(data.questions)) {
        setTemplateQuestions(data.questions)
        
        // Initialize answers for all questions
        const initialAnswers = {}
        data.questions.forEach(question => {
          initialAnswers[question.id] = ''
        })
        
        setFormData(prev => ({
          ...prev,
          answers: {
            ...prev.answers,
            ...initialAnswers
          }
        }))
      }
    } catch (error) {
      console.error('Error loading template questions:', error)
      setError('Failed to load template questions')
    } finally {
      setIsLoadingQuestions(false)
    }
  }

  const handleAIFillAnswers = async () => {
    if (templateQuestions.length === 0 || !templateData || !contractId) return

    setIsLoadingAIAnswers(true)
    setAiAnswersError(null)
    setAiAnswersProgress('Starting AI answer generation...')
    setStreamingAnswers({}) // Reset streaming answers
    
    try {
      const token = getToken()
      if (!token) {
        throw new Error('No authentication token available')
      }

      const response = await fetch(`https://api.getmediarank.com/api/v1/template-management/contracts/${contractId}/templates/${templateData.id}/ai_suggested_answers_stream`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.answer) {
                const { question_id, answer } = data.answer
                
                // Update streaming answers
                setStreamingAnswers(prev => ({
                  ...prev,
                  [question_id]: answer
                }))
                
                // Update form data with the new answer immediately
                setFormData(prev => ({
                  ...prev,
                  answers: {
                    ...prev.answers,
                    [question_id]: answer
                  }
                }))
                
                // Update progress message
                setAiAnswersProgress(`Generated ${data.progress} answers...`)
              } else if (data.status === 'completed') {
                setAiAnswersProgress(`Completed! Generated ${data.total_questions} AI suggested answers.`)
                setIsLoadingAIAnswers(false)
                
                // Auto-clear the progress message after 3 seconds
                setTimeout(() => {
                  setAiAnswersProgress('')
                }, 3000)
                return
              }
            } catch (parseError) {
              console.error('Error parsing streaming data:', parseError)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error getting AI suggested answers:', error)
      setAiAnswersError('Failed to get AI suggested answers. Please try again.')
      setIsLoadingAIAnswers(false)
      setAiAnswersProgress('')
    }
  }

  const renderProgressBar = () => {
    return (
      <div className="flex items-center mb-6">
        {[1, 2].map((step) => (
          <React.Fragment key={step}>
            <div className={`w-8 h-1 rounded ${step <= currentStep ? 'bg-blue-500 dark:bg-blue-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
            {step < 2 && <div className="w-4" />}
          </React.Fragment>
        ))}
      </div>
    )
  }

  const renderStep1 = () => (
    <div>
      <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-gray-100">Step 1/2: Describe Your Legal Situation</h2>
      
      <div className="mb-6">
        <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
          {tc.situationDescriptionLabel || 'Situation Description'} *
        </label>
        <textarea
          className="text-sm w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-none transition-colors"
          placeholder={tc.situationDescriptionPlaceholder || 'Describe your legal situation in detail...'}
          value={formData.situationDescription}
          onChange={(e) => handleInputChange('situationDescription', e.target.value)}
        />
      </div>

      {/* Template Info Display */}
      {templateData && (
        <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Selected Template:</h3>
          {contractId && (
            <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
              Contract ID: {contractId}
            </div>
          )}
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">{templateData.name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">{templateData.description}</p>
              {templateData.tags && templateData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {templateData.tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                templateData.complexity === 'Simple' ? 'bg-green-100 text-green-800' :
                templateData.complexity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {templateData.complexity}
              </span>
              {templateData.is_featured && (
                <span className="text-yellow-400">★</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* File Upload Section */}
      <div className="mb-8">
        <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-4">
          Upload Documents (Optional)
        </label>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center text-sm transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 mr-4 transition-colors"
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Add Documents
          </button>
          <span className="text-gray-500 dark:text-gray-400">Files will be analyzed and incorporated into your document</span>
        </div>
        
        {/* File List */}
        {formData.files.length > 0 && (
          <div className="mt-4 space-y-3">
            {formData.files.map((file, index) => {
              const { isUploading, isUploaded, hasError } = getFileStatus(file)
              
              return (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  hasError 
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                    : isUploaded 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                }`}>
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      hasError 
                        ? 'bg-red-100 dark:bg-red-900' 
                        : isUploaded 
                        ? 'bg-green-100 dark:bg-green-900'
                        : 'bg-gray-100 dark:bg-gray-600'
                    }`}>
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      ) : hasError ? (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      ) : isUploaded ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <FileText className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {isUploading ? (
                          'Uploading...'
                        ) : hasError ? (
                          <span className="text-red-600">Upload failed: {hasError}</span>
                        ) : isUploaded ? (
                          'Successfully uploaded ✓'
                        ) : (
                          `${(file.size / 1024 / 1024).toFixed(2)} MB`
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeFile(index)}
                    disabled={isUploading}
                    className="text-gray-400 hover:text-red-600 ml-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remove file"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  const renderStep2 = () => {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-gray-100">Step 2/2: Additional Information</h2>
        
        <div className="mb-3 text-sm">
          <span className="text-blue-500 dark:text-blue-400 font-medium">{tc.selected || 'Selected'}: </span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {templateData?.name || tc.unknownTemplate || 'Unknown Template'}
          </span>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
          {tc.additionalInformationDescription || 'Please provide additional information to customize your document.'}
        </p>

        {/* AI Fill All Button */}
        {templateQuestions.length > 0 && !isLoadingQuestions && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={handleAIFillAnswers}
              disabled={isLoadingAIAnswers || isLoadingQuestions}
              className="px-4 py-2 bg-purple-500 dark:bg-purple-600 text-white rounded-md hover:bg-purple-600 dark:hover:bg-purple-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
            >
              {isLoadingAIAnswers ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI Fill All
                </>
              )}
            </button>
          </div>
        )}

        {/* AI Answers Progress */}
        {isLoadingAIAnswers && (
          <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
            <div className="flex items-center mb-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600 mr-2" />
              <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
                Generating AI answers...
              </span>
            </div>
            {aiAnswersProgress && (
              <p className="text-sm text-purple-600 dark:text-purple-400">
                {aiAnswersProgress}
              </p>
            )}
            <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">
              Answers will appear in real-time as they are generated
            </p>
          </div>
        )}

        {/* AI Answers Error */}
        {aiAnswersError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-sm font-medium text-red-800 dark:text-red-300">
                AI Answers Generation Failed
              </span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {aiAnswersError}
            </p>
          </div>
        )}

        {/* AI Fill Success Message */}
        {!isLoadingAIAnswers && aiAnswersProgress && !aiAnswersError && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800 dark:text-green-300">
                {aiAnswersProgress}
              </span>
            </div>
          </div>
        )}

        {/* Questions Loading State */}
        {isLoadingQuestions && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <div className="flex items-center">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Loading template questions...
              </span>
            </div>
          </div>
        )}

        <div className="text-sm overflow-y-auto max-h-[40vh]">
          <div className="space-y-4 mb-4 px-3 pt-3">
            {templateQuestions.length > 0 ? (
              templateQuestions.map((question, index) => {
                const questionKey = question.id
                const isAnswered = formData.answers[questionKey] && formData.answers[questionKey].toString().trim()
                const isBeingAnswered = isLoadingAIAnswers && streamingAnswers[questionKey] && !formData.answers[questionKey]
                
                return (
                  <div 
                    key={questionKey} 
                    className={`transition-all duration-500 ${
                      !isAnswered ? 'ring-2 ring-blue-200 dark:ring-blue-800 rounded-lg p-3 bg-blue-50 dark:bg-orange-900/10' : ''
                    } ${
                      isBeingAnswered ? 'bg-purple-50 dark:bg-purple-900/10 rounded-lg p-3 border-l-4 border-purple-500' : ''
                    }`}>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                      {!isAnswered && <span className="text-blue-500 mr-1">⚠</span>}
                      <span className="text-blue-600 dark:text-blue-400 font-medium mr-2">Q{index + 1}:</span>
                      {question.text}
                      <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">({tc.optional || 'Optional'})</span>
                      {isBeingAnswered && (
                        <span className="inline-flex items-center text-purple-500 text-xs ml-2">
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          AI answering...
                        </span>
                      )}
                    </label>
                    <textarea
                      className={`w-full px-3 py-2 border ${
                        !isAnswered ? 'border-blue-300 dark:border-blue-600' : 
                        isBeingAnswered ? 'border-purple-300 dark:border-purple-600' :
                        'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-none transition-colors`}
                      rows="2"
                      value={formData.answers[questionKey] || ''}
                      onChange={(e) => handleAnswerChange(questionKey, e.target.value)}
                      placeholder={
                        isBeingAnswered ? 'AI is generating answer...' : 
                        (tc.enterAnswerPlaceholder || 'Enter your answer...')
                      }
                      disabled={isBeingAnswered}
                    />
                    {/* Show real-time answer preview while streaming */}
                    {isBeingAnswered && streamingAnswers[questionKey] && (
                      <div className="mt-2 p-2 bg-purple-100 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded text-xs">
                        <div className="flex items-center mb-1">
                          <Loader2 className="w-3 h-3 animate-spin text-purple-600 mr-1" />
                          <span className="text-purple-600 dark:text-purple-400 font-medium">AI Preview:</span>
                        </div>
                        <p className="text-purple-700 dark:text-purple-300">{streamingAnswers[questionKey]}</p>
                      </div>
                    )}
                  </div>
                )
              })
            ) : !isLoadingQuestions ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No questions available for this template</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto transition-colors duration-300">
        <div className="p-8">
          {renderProgressBar()}
          
          {isInitializing && (
            <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900/20 border border-blue-400 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded">
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Initializing contract...
              </div>
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded">
              {error}
            </div>
          )}
          
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          
          <div className="flex justify-between mt-5">
            <div className="flex space-x-4 text-sm">
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  disabled={loading}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  {tc.backButton || 'Back'}
                </button>
              )}
              <button
                onClick={() => {
                  resetForm()
                  onClose()
                }}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {tc.cancelButton || 'Cancel'}
              </button>
            </div>
            
            <button
              onClick={handleNext}
              disabled={
                loading ||
                (currentStep === 1 && !formData.situationDescription.trim())
              }
              className="px-6 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-md hover:bg-blue-600 dark:hover:bg-blue-700 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {currentStep === 2 ? (tc.generateDocument || 'Generate Document') : (tc.nextButton || 'Next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TemplateDocumentModal
