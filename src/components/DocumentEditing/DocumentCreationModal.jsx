"use client"
import React, { useState, useRef, useEffect } from 'react'
import { Calendar, Search, FileText, Upload, Mic, X, AlertCircle, Loader2, Loader, CheckCircle } from 'lucide-react'
import { DocumentAPI } from '../../services/documentApi'
import { useLanguage } from '../../context/LanguageContext';

function DocumentCreationModal({ isOpen, onClose, onDocumentGenerated, projectId="" }) {
  const { t } = useLanguage();
  const tc = t.documentCreationModal || t; // fallback to t if documentCreationModal is undefined
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [contractId, setContractId] = useState('')
  const [templates, setTemplates] = useState([])
  const [vaultTemplates, setVaultTemplates] = useState([])
  const [selectedTemplateType, setSelectedTemplateType] = useState('ai') // 'ai', 'vault', or 'upload'
  const [uploadedTemplate, setUploadedTemplate] = useState(null)
  const [isUploadingPDF, setIsUploadingPDF] = useState(false)
  const [questions, setQuestions] = useState([])
  const [isValidatingDescription, setIsValidatingDescription] = useState(false)
  const [descriptionValidation, setDescriptionValidation] = useState(null)         
  const [isLoadingAIAnswers, setIsLoadingAIAnswers] = useState(false)
  
  // New states for immediate file upload
  const [uploadingFiles, setUploadingFiles] = useState(new Set()) // Track which files are uploading
  const [uploadedFiles, setUploadedFiles] = useState(new Set()) // Track which files are uploaded
  const [fileUploadErrors, setFileUploadErrors] = useState({}) // Track upload errors   
  // Add new state variables for streaming AI answers
const [aiAnswersProgress, setAiAnswersProgress] = useState('')
const [aiAnswersError, setAiAnswersError] = useState(null)
const [streamingAnswers, setStreamingAnswers] = useState({}) // Track answers as they arrive


  // Add this state to track the original order and current order of questions
  const [originalQuestions, setOriginalQuestions] = useState([])
  const [orderedQuestions, setOrderedQuestions] = useState([])

  // NEW: Streaming questions states
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [questionsProgress, setQuestionsProgress] = useState('')
  const [questionsError, setQuestionsError] = useState(null)
  
  const fileInputRef = useRef(null)
  const audioInputRef = useRef(null)
  
  const [formData, setFormData] = useState({
    situationDescription: '',
    selectedTemplate: '',
    selectedTemplateName: '',
    selectedTemplateId: '', // For vault templates
    selectedTemplateType: 'ai', // 'ai', 'vault', or 'upload'
    uploadFile: null, // For PDF upload
    uploadName: '', // Name for uploaded template
    uploadDescription: '', // Description for uploaded template
    files: [],
    answers: {} // Changed from dynamicFields to answers for questions
  })

  if (!isOpen) return null

  // Initialize contract when modal opens
  const initializeContract = async () => {
    if (!contractId) {
      try {
        const contractResponse = await DocumentAPI.startContract(projectId)
        if (contractResponse.success) {
          setContractId(contractResponse.contract_id)
          return contractResponse.contract_id
        }
      } catch (error) {
        console.error('Error initializing contract:', error)
        setError('Failed to initialize contract')
      }
    }
    return contractId
  }

  // Handle immediate file upload
  const uploadFileImmediately = async (file, currentContractId) => {
    const fileId = `${file.name}-${file.lastModified}` // Unique identifier for the file
    
    try {
      setUploadingFiles(prev => new Set([...prev, fileId]))
      setFileUploadErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fileId]
        return newErrors
      })

      await DocumentAPI.uploadFile(currentContractId, file)
      
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

  const validateDescription = async (description) => {
    if (!description.trim()) return

    setIsValidatingDescription(true)
    try {
      const validation = await DocumentAPI.validateLegalDocument(description)
      setDescriptionValidation(validation.isRelated)
    } catch (error) {
      console.error('Error validating description:', error)
      setDescriptionValidation(null)
    } finally {
      setIsValidatingDescription(false)
    }
  }

  // Add this helper function to reorder questions
  const reorderQuestionsByAnswerStatus = (questionsToOrder, currentAnswers) => {
    return [...questionsToOrder].sort((a, b) => {
      const questionKeyA = typeof a === 'object' ? a.question : a
      const questionKeyB = typeof b === 'object' ? b.question : b
      
      const isAnsweredA = currentAnswers[questionKeyA] && currentAnswers[questionKeyA].toString().trim()
      const isAnsweredB = currentAnswers[questionKeyB] && currentAnswers[questionKeyB].toString().trim()
      
      // Unanswered questions (false) come first, answered questions (true) come second
      if (isAnsweredA === isAnsweredB) return 0
      return isAnsweredA ? 1 : -1
    })
  }

  const handleNext = async () => {
    setError('')
    setLoading(true)
    
    try {
      if (currentStep === 1) {
        // Step 1: Validate and proceed to step 2
        if (!formData.situationDescription.trim()) {
          setError('Please provide a situation description')
          setLoading(false)
          return
        }

        // Ensure contract is initialized and description is updated
        let currentContractId = contractId
        if (!currentContractId) {
          currentContractId = await initializeContract()
        }

        if (!currentContractId) {
          throw new Error('Failed to initialize contract')
        }

        // Update description
        await DocumentAPI.updateDescription(currentContractId, formData.situationDescription)

        setCurrentStep(2)
        
        // Fetch both AI-suggested templates and vault templates
        const [templatesResponse, vaultResponse] = await Promise.all([
          DocumentAPI.getTemplateSuggestions(currentContractId),
          DocumentAPI.getVaultTemplates()
        ]);
        
        if (templatesResponse.success) {
          setTemplates(templatesResponse.templates);
          // Auto-select the first AI template with highest score
          if (templatesResponse.templates.length > 0) {
            const bestTemplate = templatesResponse.templates[0];
            setFormData(prev => ({
              ...prev,
              selectedTemplate: bestTemplate.name,
              selectedTemplateName: bestTemplate.name,
              selectedTemplateType: 'ai'
            }));
            setSelectedTemplateType('ai');
          }
        }
        
        if (vaultResponse.success) {
          setVaultTemplates(vaultResponse.templates);
        }
        
      } else if (currentStep === 2) {
        // Step 2: Set template and immediately move to step 3, then start streaming questions
        if (!formData.selectedTemplate && !formData.selectedTemplateId && !uploadedTemplate) {
          setError('Please select a template or upload a document')
          setLoading(false)
          return
        }

        // Set the selected template based on type
        if (formData.selectedTemplateType === 'ai') {
          const selectedTemplate = templates.find(t => t.name === formData.selectedTemplate)
          if (selectedTemplate) {
            await DocumentAPI.setSelectedTemplate(
              contractId, 
              selectedTemplate.name, 
              selectedTemplate.description
            )
          }
        } else if (formData.selectedTemplateType === 'vault') {
          await DocumentAPI.setVaultTemplate(contractId, formData.selectedTemplateId)
        } else if (formData.selectedTemplateType === 'upload' && uploadedTemplate) {
          await DocumentAPI.setVaultTemplate(contractId, uploadedTemplate.template_id)
        }

        // IMMEDIATELY move to step 3 and start showing the questions UI
        setCurrentStep(3)
        setLoading(false)  // Stop the loading state for the Next button
        
        // Initialize streaming state
        setIsLoadingQuestions(true)
        setQuestionsError(null)
        setQuestionsProgress('Starting question generation...')
        setQuestions([])
        setOriginalQuestions([])
        setOrderedQuestions([])
        
        // Initialize empty answers object
        setFormData(prev => ({
          ...prev,
          answers: {}
        }))

        // Start streaming questions in the background (don't await)
        DocumentAPI.getMissingInfoQuestions(
          contractId,
          // onProgress callback - handles real-time question streaming
          (progressData) => {
            console.log('Questions progress:', progressData)
            
            if (progressData.type === 'started') {
              setQuestionsProgress(progressData.message)
            } else if (progressData.type === 'question') {
              // IMMEDIATELY add new question to the UI as it arrives
              const newQuestion = progressData.question.question
              
              setQuestions(prev => {
                const updated = [...prev, newQuestion]
                console.log('Adding question to UI:', newQuestion)
                return updated
              })
              
              setOriginalQuestions(prev => [...prev, newQuestion])
              setOrderedQuestions(prev => [...prev, newQuestion])
              
              // Update progress message
              setQuestionsProgress(`Generated ${progressData.questionCount} question${progressData.questionCount !== 1 ? 's' : ''}...`)
              
              // Initialize answer for the new question
              setFormData(prev => ({
                ...prev,
                answers: {
                  ...prev.answers,
                  [newQuestion]: ''
                }
              }))
            }
          },
          // onComplete callback
          (result) => {
            console.log('Questions generation completed:', result)
            setIsLoadingQuestions(false)
            setQuestionsProgress(`Completed! Generated ${result.totalQuestions} questions.`)
            
            // Auto-clear the progress message after 2 seconds
            setTimeout(() => {
              setQuestionsProgress('')
            }, 2000)
          },
          // onError callback
          (error) => {
            console.error('Questions generation error:', error)
            setQuestionsError(error.message || 'Failed to generate questions')
            setIsLoadingQuestions(false)
          }
        ).catch(error => {
          console.error('Error starting questions stream:', error)
          setQuestionsError(error.message || 'Failed to start question generation')
          setIsLoadingQuestions(false)
        })
        
        // Don't wait for questions - user can see step 3 immediately
        return
        
      } else if (currentStep === 3) {
        // Step 3: Submit answers and generate document
        
        // Submit answers
        await DocumentAPI.submitMissingInfoAnswers(contractId, formData.answers)

        // Close modal and start generation
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
    setContractId('')
    setTemplates([])
    setVaultTemplates([])
    setQuestions([])
    setOriginalQuestions([])
    setOrderedQuestions([])
    setError('')
    setDescriptionValidation(null)
    setSelectedTemplateType('ai')
    setUploadedTemplate(null)
    setIsUploadingPDF(false)
    setUploadingFiles(new Set())
    setUploadedFiles(new Set())
    setFileUploadErrors({})
    setIsLoadingQuestions(false)
    setQuestionsProgress('')
    setQuestionsError(null)
    // NEW: Reset AI answers streaming state
  setAiAnswersProgress('')
  setAiAnswersError(null)
  setStreamingAnswers({})
    setFormData({
      situationDescription: '',
      selectedTemplate: '',
      selectedTemplateName: '',
      selectedTemplateId: '',
      selectedTemplateType: 'ai',
      uploadFile: null,
      uploadName: '',
      uploadDescription: '',
      files: [],
      answers: {}
    })
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Validate description when it changes
    if (field === 'situationDescription') {
      // Debounce validation
      setTimeout(() => validateDescription(value), 500)
    }
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


// Updated handleAIFillAnswers function with streaming support
const handleAIFillAnswers = async () => {
  if (questions.length === 0) return

  setIsLoadingAIAnswers(true)
  setAiAnswersError(null)
  setAiAnswersProgress('Starting AI answer generation...')
  setStreamingAnswers({}) // Reset streaming answers
  
  try {
    // Extract question strings from questions array (handle both string and object formats)
    const questionStrings = questions.map(questionItem => 
      typeof questionItem === 'object' ? questionItem.question : questionItem
    )

    // Use the new streaming API
    await DocumentAPI.getAISuggestedAnswers(
      contractId, 
      questionStrings,
      // onProgress callback - handles real-time answer streaming
      (progressData) => {
        console.log('AI answers progress:', progressData)
        
        if (progressData.type === 'answer') {
          const { question, answer, progress, answeredCount, totalQuestions } = progressData
          
          // Update streaming answers
          setStreamingAnswers(prev => ({
            ...prev,
            [question]: answer
          }))
          
          // Update form data with the new answer immediately
          setFormData(prev => ({
            ...prev,
            answers: {
              ...prev.answers,
              [question]: answer
            }
          }))
          
          // Update progress message
          setAiAnswersProgress(`Generated ${answeredCount}/${totalQuestions} answers... (${progress})`)
          
          // Reorder questions to show unanswered ones first
          const updatedAnswers = {
            ...formData.answers,
            [question]: answer
          }
          const reorderedQuestions = reorderQuestionsByAnswerStatus(originalQuestions, updatedAnswers)
          setOrderedQuestions(reorderedQuestions)
        }
      },
      // onComplete callback
      (result) => {
        console.log('AI answers generation completed:', result)
        setIsLoadingAIAnswers(false)
        setAiAnswersProgress(`Completed! Generated ${result.totalQuestions} AI suggested answers.`)
        
        // Final update to form data with all answers
        setFormData(prev => ({
          ...prev,
          answers: {
            ...prev.answers,
            ...result.answers
          }
        }))
        
        // Final reorder of questions
        const finalAnswers = {
          ...formData.answers,
          ...result.answers
        }
        const reorderedQuestions = reorderQuestionsByAnswerStatus(originalQuestions, finalAnswers)
        setOrderedQuestions(reorderedQuestions)
        
        // Auto-clear the progress message after 3 seconds
        setTimeout(() => {
          setAiAnswersProgress('')
        }, 3000)
      },
      // onError callback
      (error) => {
        console.error('AI answers generation error:', error)
        setAiAnswersError(error.message || 'Failed to generate AI suggested answers')
        setIsLoadingAIAnswers(false)
        setAiAnswersProgress('')
      }
    )
  } catch (error) {
    console.error('Error getting AI suggested answers:', error)
    setAiAnswersError('Failed to get AI suggested answers. Please try again.')
    setIsLoadingAIAnswers(false)
    setAiAnswersProgress('')
  }
}


  // Add a reset function for when going back to original order
  const resetQuestionOrder = () => {
    setOrderedQuestions(originalQuestions)
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
    const unsupportedFiles = files.filter(file => !allowedTypes.includes(file.type))
    
    if (unsupportedFiles.length > 0) {
      setError(`Only PDF, DOC, and DOCX files are supported. Skipped: ${unsupportedFiles.map(f => f.name).join(', ')}`)
    }
    
    // Add files to form data immediately
    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...supportedFiles]
    }))

    // Initialize contract if needed and upload files immediately
    let currentContractId = contractId
    if (!currentContractId) {
      currentContractId = await initializeContract()
    }

    if (currentContractId) {
      // Upload each supported file immediately
      supportedFiles.forEach(file => {
        uploadFileImmediately(file, currentContractId)
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

  const handleTemplateSelect = (template, type = 'ai') => {
    if (type === 'ai') {
      setFormData(prev => ({
        ...prev,
        selectedTemplate: template.name,
        selectedTemplateName: template.name,
        selectedTemplateId: '',
        selectedTemplateType: 'ai'
      }))
    } else if (type === 'vault') {
      setFormData(prev => ({
        ...prev,
        selectedTemplate: '',
        selectedTemplateName: template.name,
        selectedTemplateId: template.template_id,
        selectedTemplateType: 'vault'
      }))
    } else if (type === 'upload') {
      setFormData(prev => ({
        ...prev,
        selectedTemplate: '',
        selectedTemplateName: template.name,
        selectedTemplateId: template.template_id,
        selectedTemplateType: 'upload'
      }))
    }
    setSelectedTemplateType(type)
  }

  const handlePDFUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a PDF, DOC, or DOCX file')
      return
    }

    // Validate template name
    if (!formData.uploadName.trim()) {
      setError('Please enter a template name')
      return
    }

    setIsUploadingPDF(true)
    setError('')

    try {
      const response = await DocumentAPI.createTemplateFromPDF(
        file,
        formData.uploadName,
        formData.uploadDescription || `Template created from ${file.name}`
      )

      if (response.success) {
        const newTemplate = {
          template_id: response.template_id,
          name: response.name,
          description: response.description,
          created_by: response.created_by,
          created_at: response.created_at,
          type: 'upload'
        }
        
        setUploadedTemplate(newTemplate)
        handleTemplateSelect(newTemplate, 'upload')
        
        // Clear the form fields
        setFormData(prev => ({
          ...prev,
          uploadFile: null,
          uploadName: '',
          uploadDescription: ''
        }))
        
        // Clear the file input
        event.target.value = ''
      }
    } catch (error) {
      setError(error.message || 'Failed to upload PDF. Please try again.')
    } finally {
      setIsUploadingPDF(false)
    }
  }

  const renderProgressBar = () => {
    return (
      <div className="flex items-center mb-6">
        {[1, 2, 3].map((step) => (
          <React.Fragment key={step}>
            <div className={`w-8 h-1 rounded ${step <= currentStep ? 'bg-blue-500 dark:bg-blue-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
            {step < 3 && <div className="w-4" />}
          </React.Fragment>
        ))}
      </div>
    )
  }

  const renderFileList = (files) => {
    if (files.length === 0) return null

    return (
      <div className="mt-4 space-y-3">
        {files.map((file, index) => {
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
                    <FileText className="w-4 h-4 text-green-600" />
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
                      'Analyzing document...'
                    ) : hasError ? (
                      <span className="text-red-600">Upload failed: {hasError}</span>
                    ) : isUploaded ? (
                      'Successfully analyzed ✓'
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
    )
  }

  const renderStep1 = () => (
    <div>
      <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-gray-100">{tc.step1Title || 'Describe Your Legal Situation'}</h2>
      
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
        
        {/* Description validation indicator */}
        {isValidatingDescription && (
          <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500 mr-2"></div>
            {tc.validatingDescription || 'Validating description...'}
          </div>
        )}
        
        {descriptionValidation !== null && !isValidatingDescription && (
          <div className={`mt-2 flex items-center text-sm ${
            descriptionValidation 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-orange-600 dark:text-orange-400'
          }`}>
            <AlertCircle className="w-3 h-3 mr-2" />
            {descriptionValidation 
              ? (tc.legalDocumentRelated || 'This appears to be related to legal documents') 
              : (tc.mayNotBeLegalDocumentRelated || 'This may not be related to legal documents')}
          </div>
        )}
      </div>

      <div className="mb-8">
        <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-4">
          {tc.pdfFileAttachmentsLabel || 'PDF File Attachments (Optional)'}
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
            {tc.addPdfFileButton || 'Add PDF Files'}
          </button>
          <span className="text-gray-500 dark:text-gray-400">{tc.filesWillBeAnalyzed || 'Files will be analyzed and incorporated into your document'}</span>
        </div>
        {renderFileList(formData.files)}
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="text-sm">
      <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-gray-100">{tc.step2Title || 'Choose Document Template'}</h2>
      
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        {tc.chooseDocumentTemplateDescription || 'Select a template that best matches your legal document needs.'}
      </p>

      {/* Template Type Toggle */}
      <div className="mb-6">
        <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
          <button
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              selectedTemplateType === 'ai'
                ? 'bg-blue-500 dark:bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
            onClick={() => setSelectedTemplateType('ai')}
          >
            {tc.aiSuggestedButton || 'AI Suggested'}
          </button>
          <button
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              selectedTemplateType === 'vault'
                ? 'bg-blue-500 dark:bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
            onClick={() => setSelectedTemplateType('vault')}
          >
            {tc.vaultTemplatesButton || 'Vault Templates'}
          </button>
          <button
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              selectedTemplateType === 'upload'
                ? 'bg-blue-500 dark:bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
            onClick={() => setSelectedTemplateType('upload')}
          >
            {tc.uploadDocumentButton || 'Upload Document'}
          </button>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {loading && ((selectedTemplateType === 'ai' && templates.length === 0) || (selectedTemplateType === 'vault' && vaultTemplates.length === 0)) ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-300">{tc.loadingTemplates || 'Loading templates...'}</p>
          </div>
        ) : selectedTemplateType === 'ai' ? (
          templates.length > 0 ? (
            templates.map((template) => (
              <div
                key={template.name}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  formData.selectedTemplateType === 'ai' && formData.selectedTemplate === template.name
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
                onClick={() => handleTemplateSelect(template, 'ai')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="template"
                      checked={formData.selectedTemplateType === 'ai' && formData.selectedTemplate === template.name}
                      onChange={() => handleTemplateSelect(template, 'ai')}
                      className="mr-3"
                    />
                    <div>
                      <h3 className="font-semibold text-[16px] text-gray-900 dark:text-gray-100">{template.name}</h3>
                      <p className="text-gray-600 dark:text-gray-300">{template.description}</p>
                    </div>
                  </div>
                  <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs font-medium">
                    {tc.matchPercentage || 'Match'} {template.score}%
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>{tc.noAiSuggestedTemplates || 'No AI suggested templates available'}</p>
            </div>
          )
        ) : selectedTemplateType === 'vault' ? (
          vaultTemplates.length > 0 ? (
            vaultTemplates.map((template) => (
              <div
                key={template.template_id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  formData.selectedTemplateType === 'vault' && formData.selectedTemplateId === template.template_id
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
                onClick={() => handleTemplateSelect(template, 'vault')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="template"
                      checked={formData.selectedTemplateType === 'vault' && formData.selectedTemplateId === template.template_id}
                      onChange={() => handleTemplateSelect(template, 'vault')}
                      className="mr-3"
                    />
                    <div>
                      <h3 className="font-semibold text-[16px] text-gray-900 dark:text-gray-100">{template.name}</h3>
                      <p className="text-gray-600 dark:text-gray-300">{template.description}</p>
                      {template.created_by && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {tc.createdBy || 'Created by'} {template.created_by} • {new Date(template.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs font-medium">
                    {tc.vault || 'Vault'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>{tc.noVaultTemplates || 'No vault templates available'}</p>
            </div>
          )
        ) : (
          /* Upload Document Section */
          <div className="space-y-6">
            {/* Template Name Input */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                {tc.templateNameLabel || 'Template Name'} *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
                placeholder={tc.templateNamePlaceholder || 'Enter template name'}
                value={formData.uploadName}
                onChange={(e) => setFormData(prev => ({ ...prev, uploadName: e.target.value }))}
              />
            </div>

            {/* Template Description Input */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                {tc.templateDescriptionLabel || 'Template Description'} ({tc.optional || 'Optional'})
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-none transition-colors"
                rows="2"
                placeholder={tc.templateDescriptionPlaceholder || 'Enter template description'}
                value={formData.uploadDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, uploadDescription: e.target.value }))}
              />
            </div>

            {/* PDF Upload */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                {tc.uploadPdfDocumentLabel || 'Upload PDF Document'} *
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center transition-colors">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handlePDFUpload}
                  disabled={isUploadingPDF || !formData.uploadName.trim()}
                  className="hidden"
                  id="pdf-upload"
                />
                <label
                  htmlFor="pdf-upload"
                  className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                    isUploadingPDF || !formData.uploadName.trim()
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {isUploadingPDF ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                      {tc.uploadingPdf || 'Uploading PDF...'}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {tc.choosePdfFile || 'Choose PDF File'}
                    </>
                  )}
                </label>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {!formData.uploadName.trim() 
                    ? (tc.enterTemplateNameFirst || 'Enter template name first')
                    : (tc.onlyPdfFilesSupported || 'Only PDF files are supported')
                  }
                </p>
              </div>
            </div>

            {/* Show uploaded template */}
            {uploadedTemplate && (
              <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="template"
                    checked={formData.selectedTemplateType === 'upload'}
                    readOnly
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-[16px] text-gray-900 dark:text-gray-100">{uploadedTemplate.name}</h3>
                    <p className="text-gray-600 dark:text-gray-300">{uploadedTemplate.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {tc.justCreated || 'Just created'} • {new Date(uploadedTemplate.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs font-medium">
                    {tc.uploaded || 'Uploaded'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

const renderStep3 = () => {
  const selectedTemplate = formData.selectedTemplateType === 'ai' 
    ? templates.find(t => t.name === formData.selectedTemplate)
    : formData.selectedTemplateType === 'vault'
    ? vaultTemplates.find(t => t.template_id === formData.selectedTemplateId)
    : uploadedTemplate
  
  return (
    <div>
      <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-gray-100">{tc.step3Title || 'Additional Information'}</h2>
      
      <div className="mb-3 text-sm">
        <span className="text-blue-500 dark:text-blue-400 font-medium">{tc.selected || 'Selected'}: </span>
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {selectedTemplate?.name || tc.unknownTemplate || 'Unknown Template'}
        </span>
        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
          formData.selectedTemplateType === 'ai' 
            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
            : formData.selectedTemplateType === 'vault'
            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
            : 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
        }`}>
          {formData.selectedTemplateType === 'ai' 
            ? (tc.aiSuggested || 'AI Suggested')
            : formData.selectedTemplateType === 'vault'
            ? (tc.vaultTemplate || 'Vault Template')
            : (tc.uploadedDocument || 'Uploaded Document')
          }
        </span>
      </div>
      
      <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
        {tc.additionalInformationDescription || 'Please provide additional information to customize your document.'}
      </p>

      {/* Questions Loading State */}
      {isLoadingQuestions && (
        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <div className="flex items-center mb-2">
            <Loader className="w-4 h-4 animate-spin text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Generating questions...
            </span>
          </div>
          {questionsProgress && (
            <p className="text-sm text-blue-600 dark:text-blue-400">
              {questionsProgress}
            </p>
          )}
          <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
            Questions will appear here as they are generated
          </p>
        </div>
      )}

      {/* Questions Error */}
      {questionsError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
            <span className="text-sm font-medium text-red-800 dark:text-red-300">
              Questions Generation Failed
            </span>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            {questionsError}
          </p>
        </div>
      )}

      {/* AI Answers Progress */}
      {isLoadingAIAnswers && (
        <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
          <div className="flex items-center mb-2">
            <Loader className="w-4 h-4 animate-spin text-purple-600 mr-2" />
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

      {/* Success Message */}
      {!isLoadingQuestions && questionsProgress && !questionsError && (
        <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-800 dark:text-green-300">
              {questionsProgress}
            </span>
          </div>
        </div>
      )}

      {/* AI Fill Success Message */}
      {!isLoadingAIAnswers && aiAnswersProgress && !aiAnswersError && (
        <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-800 dark:text-green-300">
              {aiAnswersProgress}
            </span>
          </div>
        </div>
      )}

      {/* AI Fill Button and Reset Order Button */}
      {orderedQuestions.length > 0 && !isLoadingQuestions && (
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={resetQuestionOrder}
            className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Reset Order
          </button>
          <div className="flex items-center space-x-2">
            {/* Show AI Fill progress info when loading */}
            {isLoadingAIAnswers && (
              <div className="text-xs text-purple-600 dark:text-purple-400 mr-2">
                Generating answers...
              </div>
            )}
            <button
              onClick={handleAIFillAnswers}
              disabled={isLoadingAIAnswers || isLoadingQuestions}
              className="px-4 py-2 bg-purple-500 dark:bg-purple-600 text-white rounded-md hover:bg-purple-600 dark:hover:bg-purple-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
            >
              {isLoadingAIAnswers ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {tc.generating || 'Generating...'}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {tc.aiFillAll || 'AI Fill All'}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="text-sm overflow-y-auto max-h-[40vh]">
        <div className="space-y-4 mb-4 px-3 pt-3">
          {/* Always show the questions area, even when loading */}
          {orderedQuestions.length > 0 ? (
            <>
              {/* Show questions as they arrive in real-time */}
              {orderedQuestions.map((questionItem, index) => {
                const questionText = typeof questionItem === 'object' ? questionItem.question : questionItem
                const questionKey = questionText
                const isAnswered = formData.answers[questionKey] && formData.answers[questionKey].toString().trim()
                const isNewest = index === orderedQuestions.length - 1 && isLoadingQuestions
                const hasStreamingAnswer = streamingAnswers[questionKey] // Check if this question has a streaming answer
                const isBeingAnswered = isLoadingAIAnswers && hasStreamingAnswer && !formData.answers[questionKey]
                
                return (
                  <div 
                    key={`${questionKey}-${index}`} 
                    className={`transition-all duration-500 ${
                      !isAnswered ? 'ring-2 ring-blue-200 dark:ring-blue-800 rounded-lg p-3 bg-blue-50 dark:bg-orange-900/10' : ''
                    } ${
                      isNewest ? 'animate-pulse bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3 border-l-4 border-blue-500' : ''
                    } ${
                      isBeingAnswered ? 'bg-purple-50 dark:bg-purple-900/10 rounded-lg p-3 border-l-4 border-purple-500' : ''
                    }`}
                    style={{
                      animation: isNewest ? 'slideInFromTop 0.5s ease-out' : isBeingAnswered ? 'pulse 1s infinite' : 'none'
                    }}>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                      {!isAnswered && <span className="text-blue-500 mr-1">⚠</span>}
                      <span className="text-blue-600 dark:text-blue-400 font-medium mr-2">Q{index + 1}:</span>
                      {questionText}
                      <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">({tc.optional || 'Optional'})</span>
                      {isNewest && (
                        <span className="inline-flex items-center text-blue-500 text-xs ml-2 animate-bounce">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                          Just received
                        </span>
                      )}
                      {isBeingAnswered && (
                        <span className="inline-flex items-center text-purple-500 text-xs ml-2">
                          <Loader className="w-3 h-3 animate-spin mr-1" />
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
                          <Loader className="w-3 h-3 animate-spin text-purple-600 mr-1" />
                          <span className="text-purple-600 dark:text-purple-400 font-medium">AI Preview:</span>
                        </div>
                        <p className="text-purple-700 dark:text-purple-300">{streamingAnswers[questionKey]}</p>
                      </div>
                    )}
                  </div>
                )
              })}
              
              {/* Show loading indicator for more questions at the bottom */}
              {isLoadingQuestions && (
                <div className="text-center py-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-sm">Generating more questions...</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Initial loading state when no questions yet */
            <div className="text-center py-8">
              {isLoadingQuestions ? (
                <div>
                  <Loader className="w-8 h-8 animate-spin text-blue-500 dark:text-blue-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-300 font-medium">Generating your first question...</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Questions will appear here in real-time</p>
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400">
                  <p>{tc.noAdditionalInformationRequired || 'No additional information required'}</p>
                  <p className="text-xs mt-2">{tc.proceedToGenerate || 'You can proceed to generate your document'}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  )
}


  // Check if any files are still uploading
  const hasUploadingFiles = uploadingFiles.size > 0

  return (
    <div className="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto transition-colors duration-300">
        <div className="p-8">
          {renderProgressBar()}
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded">
              {error}
            </div>
          )}
          
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          
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
                hasUploadingFiles || // Disable if files are still uploading
                (currentStep === 1 && (
                  !formData.situationDescription.trim() ||
                  isValidatingDescription ||
                  descriptionValidation === false
                ))
              }
              className="px-6 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-md hover:bg-blue-600 dark:hover:bg-blue-700 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {hasUploadingFiles ? (
                tc.analyzingFiles || 'Analyzing files...'
              ) : (
                currentStep === 3 ? (tc.generateDocument || 'Generate Document') : (tc.nextButton || 'Next')
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentCreationModal