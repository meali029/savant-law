import { useEffect, useState, useRef } from 'react'
import { 
  ChevronLeft, 
  ChevronDown, 
  Star, 
  Plus, 
  Upload, 
  Download,
  Save,
  Loader2,
  AlertCircle,
  Zap,
  Edit
} from 'lucide-react'
import { getToken } from '../../services/authApi'
import { useRouter } from 'next/navigation'
import './DocumentVault.css'; // Add this import at the top (after React imports)
import { useLanguage } from '../../context/LanguageContext';

const DocumentVault = ({ docId }) => {
  const router = useRouter()
  const { t } = useLanguage();
  // AUTH GUARD: Redirect to /sign-in if not authenticated
  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.push('/sign-in')
    }
  }, [router])

  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRedactionTypes, setSelectedRedactionTypes] = useState(['Names', 'Dates', 'Dollar amount', 'Company names'])
  const [editingSection, setEditingSection] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [templateData, setTemplateData] = useState(null)
  const [originalTemplateData, setOriginalTemplateData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [redacting, setRedacting] = useState(false)
  const [redactingAll, setRedactingAll] = useState(false) // State for auto redact all
  const [streamingProgress, setStreamingProgress] = useState({}) // New state for streaming progress
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const editableRef = useRef(null)

  const redactionTypes = [
    'Names',
    'Dates', 
    'Dollar amount',
    'Company names'
  ]

  // Fetch template content from API
  useEffect(() => {
    if (docId) {
      fetchTemplateContent(docId)
    }
  }, [docId])

  const fetchTemplateContent = async (templateId) => {
    setLoading(true)
    setError(null)
    
    try {
      const token = getToken()
      const response = await fetch(`https://api.getmediarank.com/api/v1/templates/${templateId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch template: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      // Transform the template data to match the expected format
      // Handle empty pages array by creating an empty template structure
      const transformedData = data.pages && data.pages.length > 0 
        ? data.pages.map(page => ({
            page_number: page.page_number,
            page_html: page.page_html
          }))
        : []
      
      setTemplateData(transformedData)
      setOriginalTemplateData(transformedData) // Store original data for reset functionality
      setCurrentPage(transformedData.length > 0 ? 1 : 0) // Set to 0 if no pages
    } catch (err) {
      console.error('Error fetching template:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const saveTemplate = async () => {
    if (!templateData || !Array.isArray(templateData) || templateData.length === 0) {
      alert('No template data to save')
      return
    }
  
    if (!docId) {
      alert('No template ID available')
      return
    }
  
    setSaving(true)
    setSaveSuccess(null)
    
    try {
      const token = getToken()
      // Prepare the pages data for the API
      const pages = templateData.map(page => ({
        page_number: page.page_number,
        page_html: page.page_html
      }))
  
      const response = await fetch(`https://api.getmediarank.com/api/v1/templates/${docId}/pages`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pages: pages
        })
      })
  
      if (!response.ok) {
        throw new Error(`Save failed: ${response.status} ${response.statusText}`)
      }
  
      const result = await response.json()
      setSaveSuccess({
        template_id: docId,
        name: `Template ${docId?.slice(-8) || 'Unknown'}`,
        message: 'Template pages updated successfully',
        ...result
      })
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSaveSuccess(null)
      }, 5000)
  
    } catch (err) {
      console.error('Error saving template:', err)
      alert(`Save failed: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  // NEW: Streaming Auto redact all function using the streaming API
  const autoRedactAllStreaming = async () => {
    if (!templateData) {
      alert('No template loaded')
      return
    }

    setRedactingAll(true)
    setStreamingProgress({}) // Reset streaming progress

    try {
      // Process each page sequentially, starting from the first page
      const redactedPages = []
      
      for (let i = 0; i < templateData.length; i++) {
        const page = templateData[i]
        
        try {
          const token = getToken()
          
          // Initialize progress for this page
          setStreamingProgress(prev => ({
            ...prev,
            [page.page_number]: {
              status: 'processing',
              redactions: [],
              totalRedactions: 0
            }
          }))

          const response = await fetch('https://api.getmediarank.com/api/v1/auto_redact/auto_redact_stream', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              content: page.page_html
            })
          })

          if (!response.ok) {
            throw new Error(`Streaming redaction failed for page ${page.page_number}: ${response.status}`)
          }

          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let redactedContent = page.page_html
          const appliedRedactions = []

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
                                if (line.startsWith('data: ')) {
                    try {
                      const jsonData = JSON.parse(line.slice(6))
                      
                      if (jsonData.redaction) {
                        const { original, redacted, context } = jsonData.redaction
                        
                        console.log(`Applying redaction: "${original}" -> "${redacted}"`)
                        
                        // The API now provides the redacted text with HTML highlighting already included
                        // We need to replace the original text with the redacted version within the context
                        const beforeReplacement = redactedContent
                        
                        // Use global replacement for better reliability (ignore context for now)
                        const escapedOriginal = escapeRegExp(original)
                        
                        try {
                          redactedContent = redactedContent.replace(
                            new RegExp(escapedOriginal, 'gi'), 
                            redacted
                          )
                          
                          // Log if replacement was successful
                          if (beforeReplacement !== redactedContent) {
                            console.log(`Successfully applied redaction for "${original}" (global replacement)`)
                          } else {
                            console.warn(`No replacement found for "${original}"`)
                          }
                        } catch (regexError) {
                          console.error(`Regex error for redaction "${original}":`, regexError)
                          // Fallback to simple string replacement
                          redactedContent = redactedContent.replace(original, redacted)
                          console.log(`Applied fallback redaction for "${original}"`)
                        }
                        
                        appliedRedactions.push({ original, redacted, context })

                    // Update streaming progress in real-time
                    setStreamingProgress(prev => ({
                      ...prev,
                      [page.page_number]: {
                        ...prev[page.page_number],
                        redactions: [...(prev[page.page_number]?.redactions || []), jsonData.redaction]
                      }
                    }))

                    // Update the template data in real-time to show immediate changes
                    setTemplateData(prevData => 
                      prevData.map(p => 
                        p.page_number === page.page_number 
                          ? { ...p, page_html: redactedContent }
                          : p
                      )
                    )
                  }
                  
                  if (jsonData.status === 'completed') {
                    setStreamingProgress(prev => ({
                      ...prev,
                      [page.page_number]: {
                        ...prev[page.page_number],
                        status: 'completed',
                        totalRedactions: jsonData.total_redactions || appliedRedactions.length
                      }
                    }))
                  }
                } catch (parseError) {
                  console.error('Error parsing streaming data:', parseError)
                }
              }
            }
          }

          redactedPages.push({
            ...page,
            page_html: redactedContent,
            redactions: appliedRedactions
          })
        } catch (pageError) {
          console.error(`Error streaming redaction for page ${page.page_number}:`, pageError)
          setStreamingProgress(prev => ({
            ...prev,
            [page.page_number]: {
              ...prev[page.page_number],
              status: 'error',
              error: pageError.message
            }
          }))
          // Return original page if redaction fails
          redactedPages.push(page)
        }
      }

      // Final update with all redacted pages
      setTemplateData(redactedPages)
      
    } catch (err) {
      console.error('Error during streaming auto redact all:', err)
      alert(`Streaming auto redact all failed: ${err.message}`)
    } finally {
      setRedactingAll(false)
      // Clear streaming progress after a delay
      setTimeout(() => {
        setStreamingProgress({})
      }, 3000)
    }
  }

  // UPDATED: Auto redact function for selective redaction (existing functionality)
  const autoRedact = async () => {
    if (!templateData || selectedRedactionTypes.length === 0) {
      alert('No template loaded or no redaction types selected')
      return
    }

    setRedacting(true)
    try {
      // Process each page
      const redactedPages = await Promise.all(
        templateData.map(async (page) => {
          try {
            // Map UI redaction types to API format
            const apiRedactionTypes = selectedRedactionTypes.map(type => {
              switch (type) {
                case 'Names': return 'names'
                case 'Dates': return 'dates'
                case 'Dollar amount': return 'dollar amounts'
                case 'Company names': return 'company names'
                default: return type.toLowerCase()
              }
            })

            const token = getToken()
            const response = await fetch('https://api.getmediarank.com/api/v1/redact/auto/v2', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                content: page.page_html,
                redact: apiRedactionTypes
              })
            })

            if (!response.ok) {
              throw new Error(`Redaction failed for page ${page.page_number}: ${response.status}`)
            }

            const result = await response.json()
            
            // Apply replacements to the page content with highlighting
            let redactedContent = page.page_html
            const appliedReplacements = []
            
            if (result.replacements && Array.isArray(result.replacements)) {
              result.replacements.forEach(replacement => {
                // Use global replace to handle multiple occurrences with highlighting
                const highlightedReplacement = `<span style="background-color: rgba(62, 35, 193, 0.2); padding: 2px 4px; border-radius: 3px;">${replacement.after}</span>`
                redactedContent = redactedContent.replace(
                  new RegExp(escapeRegExp(replacement.before), 'g'), 
                  highlightedReplacement
                )
                appliedReplacements.push(replacement)
              })
            }

            return {
              ...page,
              page_html: redactedContent,
              replacements: appliedReplacements
            }
          } catch (pageError) {
            console.error(`Error redacting page ${page.page_number}:`, pageError)
            // Return original page if redaction fails
            return page
          }
        })
      )

      setTemplateData(redactedPages)
    } catch (err) {
      console.error('Error during auto redaction:', err)
      alert(`Auto redaction failed: ${err.message}`)
    } finally {
      setRedacting(false)
    }
  }

  // Helper function to escape special regex characters
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  const createNewPage = () => {
    const newPageNumber = templateData.length + 1
    const newPage = {
      page_number: newPageNumber,
      page_html: '<div id="page' + (newPageNumber - 1) + '" style="width:595.3pt;height:841.9pt"><p style="top:58.1pt;left:56.7pt;line-height:14.0pt;font-family:Times New Roman,serif;font-size:12.0pt;color:#000000;">Click here to start typing your content...</p></div>'
    }
    
    setTemplateData(prev => [...prev, newPage])
    setCurrentPage(newPageNumber)
    // Auto-enter edit mode for new pages
    setTimeout(() => {
      setIsEditing(true)
    }, 100)
  }

  const deletePage = (pageNumber) => {
    if (templateData.length <= 1) {
      alert('Cannot delete the last page')
      return
    }
    
    const updatedPages = templateData
      .filter(page => page.page_number !== pageNumber)
      .map((page, index) => ({
        ...page,
        page_number: index + 1
      }))
    
    setTemplateData(updatedPages)
    
    // Adjust current page if necessary
    if (currentPage > updatedPages.length) {
      setCurrentPage(updatedPages.length)
    } else if (currentPage >= pageNumber && currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const resetTemplate = () => {
    if (originalTemplateData) {
      setTemplateData(originalTemplateData)
      setSaveSuccess(null) // Clear any save success message
      setStreamingProgress({}) // Clear streaming progress
    }
  }

  const handleRedactionTypeToggle = (type) => {
    setSelectedRedactionTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type)
      } else {
        return [...prev, type]
      }
    })
  }

  const downloadTemplate = async () => {
    if (!docId) {
      alert('No template ID available')
      return
    }

    setDownloading(true)
    try {
      const token = getToken()
      const response = await fetch(`https://api.getmediarank.com/api/v1/documents/${docId}/export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`)
      }

      // Get the filename from Content-Disposition header or use a default
      const contentDisposition = response.headers.get('content-disposition')
      let filename = 'template.pdf'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '')
        }
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error downloading template:', err)
      alert(`Download failed: ${err.message}`)
    } finally {
      setDownloading(false)
    }
  }

  const handleEditStart = () => {
    setIsEditing(true)
    setEditContent(currentPageData?.page_html || '')
    // Focus the editable div after a short delay to ensure it's rendered
    setTimeout(() => {
      if (editableRef.current) {
        editableRef.current.focus()
      }
    }, 100)
  }

  const handleEditSave = () => {
    if (!currentPageData) return
    // Update the page_html for the current page, preserving other pages
    setTemplateData(prev => prev.map(page =>
      page.page_number === currentPage
        ? { ...page, page_html: editableRef.current.innerHTML }
        : page
    ))
    setIsEditing(false)
  }

  const handleEditCancel = () => {
    setIsEditing(false)
    // Reset the content to original
    if (editableRef.current && currentPageData) {
      editableRef.current.innerHTML = currentPageData.page_html
    }
  }

  const renderRedactedText = (text) => {
    // Simple redaction simulation - in a real app, this would be based on API response
    // For now, we'll just render the text as-is since the API response doesn't include redaction info
    return text
  }

  // Common styling for consistent appearance between edit and view modes
  const getContentStyles = () => ({
    minHeight: '600px', 
    background: '#fff', 
    color: '#222', 
    wordBreak: 'break-word',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    hyphens: 'auto',
    lineHeight: '1.6', // Consistent line height
    fontSize: '16px !important',
    fontFamily: 'Times New Roman, serif',
    maxWidth: '100%'
  })

  const renderPageContent = (pageData) => {
    if (!pageData) return null
    
    if (isEditing) {
      return (
        <div className="h-full">
          <div
            ref={editableRef}
            contentEditable
            suppressContentEditableWarning
            className="border-2 border-blue-300 rounded p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white vault-editable-content"
            style={getContentStyles()} // Use consistent styles
            dangerouslySetInnerHTML={{ __html: pageData.page_html }}
            onKeyDown={(e) => {
              // Handle common formatting shortcuts
              if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                  case 's':
                    e.preventDefault()
                    handleEditSave()
                    break
                  case 'Escape':
                    e.preventDefault()
                    handleEditCancel()
                    break
                }
              }
            }}
          />
        </div>
      )
    }
    
    return (
      <div className="space-y-4 h-full">
        <div 
          className="text-sm leading-relaxed text-gray-800 overflow-hidden cursor-pointer hover:bg-gray-50 p-4 rounded border-2 border-transparent hover:border-gray-200 transition-all"
          style={getContentStyles()} // Use consistent styles
          onClick={handleEditStart}
          dangerouslySetInnerHTML={{ 
            __html: pageData.page_html
              ? pageData.page_html.replace(/<\/p>/g, '</p><div style="margin-bottom: 12px;"></div>')
              : '<p style="color: #999; font-style: italic;">Click to start editing this page...</p>'
          }}
        />
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-gray-600">{t.vault.loadingTemplate}</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="flex flex-col items-center space-y-4 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900">{t.vault.errorLoadingTemplate}</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => fetchTemplateContent(docId)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {t.vault.tryAgain}
          </button>
        </div>
      </div>
    )
  }

  // No template data or empty template
  if (!templateData || !Array.isArray(templateData)) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <AlertCircle className="w-12 h-12 text-gray-400" />
          <p className="text-gray-600">{t.vault.noTemplateDataAvailable}</p>
        </div>
      </div>
    )
  }

  const totalPages = templateData.length
  const currentPageData = templateData.find(page => page.page_number === currentPage)

  // Handle empty template (no pages)
  if (templateData.length === 0) {
    return (
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Left Sidebar - Empty Template */}
        <div className="w-100 bg-white border-r border-gray-200 flex flex-col">
          {/* Template Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <ChevronLeft 
                className="w-4 h-4 text-gray-600 cursor-pointer" 
                onClick={() => router.push('/vault')}
              />
              <div className="flex items-center space-x-1">
                <span className="text-sm font-medium text-gray-900 truncate">{t.vault.templateTitle}</span>
              </div>
            </div>
          </div>

          {/* Empty State with Create Button */}
          <div className="p-4 flex-1 flex flex-col items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">{t.vault.noPagesYet}</h3>
              <p className="text-xs text-gray-500 mb-4">{t.vault.createFirstPage}</p>
              <button
                onClick={createNewPage}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t.vault.createFirstPageButton}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area - Empty */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 p-8 flex justify-center bg-gray-100 overflow-y-auto">
            <div className="bg-white shadow-lg mb-8 overflow-hidden flex items-center justify-center" style={{
              width: '210mm',
              minHeight: '297mm',
              maxWidth: '800px'
            }}>
              <div className="text-center text-gray-400">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-lg font-medium mb-2">{t.vault.emptyTemplate}</p>
                <p className="text-sm">{t.vault.createPageToStartEditing}</p>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Disabled */}
          <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">{t.vault.templateTools}</h3>
            </div>
            
            <div className="text-center text-gray-500 py-8">
              <p className="text-sm">{t.vault.createPageToAccessEditingTools}</p>
            </div>

            {/* Current Template Info */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500 mb-2">{t.vault.templateId}</div>
              <div className="text-sm font-mono text-gray-700 bg-gray-50 p-3 rounded border mb-4 break-all">
                {docId}
              </div>
              
              <div className="text-sm text-gray-500 mb-2">{t.vault.pages}</div>
              <div className="text-sm font-medium text-gray-700 bg-gray-50 p-3 rounded border mb-4">
                {totalPages} {t.vault.pages}
              </div>

              <div className="text-sm text-gray-500 mb-2">{t.vault.status}</div>
              <div className="text-sm font-medium text-orange-700 bg-orange-50 p-3 rounded border">
                {t.vault.emptyTemplateWarning}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" style={{ height: 'calc(100vh - 70px)' }}>
      {/* Left Sidebar - Template Navigation */}
      <div className="w-100 bg-white border-r border-gray-200 flex flex-col" >
        {/* Template Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <ChevronLeft 
              className="w-7 h-7 text-gray-600 cursor-pointer" 
              onClick={() => router.push('/vault')}
            />
            <span className="text-sm font-medium text-gray-600 truncate ">Vault</span>
           
          </div>
        </div>

        {/* Template Preview */}
        <div className="p-4 flex-1 overflow-y-auto" >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <div key={pageNum} className="mb-4">
              <div 
                className={`w-20 h-28 border-2 rounded-sm mb-2 mx-auto cursor-pointer transition-all duration-200 relative group ${
                  currentPage === pageNum 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {/* Delete Page Button */}
                {totalPages > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deletePage(pageNum)
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    ×
                  </button>
                )}
                
                {/* Streaming progress indicator */}
                {streamingProgress[pageNum] && (
                  <div className="absolute top-1 left-1 right-1">
                    <div className={`h-1 rounded-full ${
                      streamingProgress[pageNum].status === 'processing' ? 'bg-blue-500 animate-pulse' :
                      streamingProgress[pageNum].status === 'completed' ? 'bg-green-500' :
                      streamingProgress[pageNum].status === 'error' ? 'bg-red-500' : 'bg-gray-300'
                    }`}></div>
                  </div>
                )}
                
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">{t.vault.page}</div>
                    <div className="w-12 h-16 bg-gray-100 border border-gray-200 rounded-sm mx-auto">
                      <div className="p-1">
                        <div className="w-full h-1 bg-gray-300 rounded mb-1"></div>
                        <div className="w-3/4 h-1 bg-gray-300 rounded mb-1"></div>
                        <div className="w-full h-1 bg-gray-300 rounded mb-1"></div>
                        <div className="w-1/2 h-1 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-xs text-center text-gray-600">{pageNum} {t.vault.of} {totalPages}</div>
              
              {/* Streaming progress text */}
              {streamingProgress[pageNum] && (
                <div className="text-xs text-center mt-1">
                  {streamingProgress[pageNum].status === 'processing' && (
                    <span className="text-blue-600">Processing...</span>
                  )}
                  {streamingProgress[pageNum].status === 'completed' && (
                    <span className="text-green-600">
                      {streamingProgress[pageNum].totalRedactions} redactions
                    </span>
                  )}
                  {streamingProgress[pageNum].status === 'error' && (
                    <span className="text-red-600">Error</span>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {/* Add New Page Button */}
          <div className="mb-4">
            <button
              onClick={createNewPage}
              className="w-20 h-28 border-2 border-dashed border-blue-300 rounded-sm mb-2 mx-auto cursor-pointer transition-all duration-200 hover:border-blue-400 hover:bg-blue-50 flex items-center justify-center"
            >
              <div className="text-center">
                <Plus className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                <div className="text-xs text-blue-600">{t.vault.addPage}</div>
              </div>
            </button>
            <div className="text-xs text-center text-gray-400">{t.vault.new}</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Template Content */}
        <div className="flex-1 p-8 flex justify-center bg-gray-100 overflow-y-auto">
          {/* A4 Paper Container */}
          <div className="bg-white shadow-lg mb-8 overflow-hidden" style={{
            width: '210mm',
            minHeight: '297mm',
            maxWidth: '800px'
          }}>
            {/* Paper Content with proper containment */}
            <div className="p-8 h-full overflow-hidden" style={{
              maxWidth: '100%',
              wordWrap: 'break-word'
            }}>
              {currentPageData ? (
                <div 
                  className="h-full overflow-hidden"
                  style={{
                    // CSS to handle text overflow and wrapping
                    wordWrap: 'break-word',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    maxWidth: '100%'
                  }}
                >
                  {renderPageContent(currentPageData)}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  {t.vault.pageNotFound}
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Right Sidebar - Redaction Controls */}
      {/* make the hight of sidebar 100vh-100px */}
<div className="w-80 bg-white border-l border-slate-200 shadow-sm" >
  <div className="p-6 h-full overflow-y-auto">
    {/* Header */}
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-lg font-semibold text-slate-900">{t.vault.templateTools}</h3>
     
    </div>
    
    {/* Edit Mode Toggle */}
    <div className="mb-5">
      {!isEditing ? (
        <button 
          onClick={handleEditStart}
          disabled={!currentPageData}
          className="w-full bg-slate-900 text-sm hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center space-x-3 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <Edit className='w-5 h-5' />
          <span>{t.vault.editCurrentPage}</span>
        </button>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-slate-600 font-medium text-center bg-slate-50 py-2 px-4 rounded-lg">
            {t.vault.editingModeActive}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleEditSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {t.vault.save}
            </button>
            <button 
              onClick={handleEditCancel}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200"
            >
              {t.vault.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
    
    {/* Redaction Section */}
    <div className={`${isEditing ? 'opacity-40 pointer-events-none' : ''} transition-opacity duration-200`}>
      <div className="border-t border-slate-100 pt-4 mb-3">
        <h4 className="text-lg font-semibold text-slate-900 mb-2">{t.vault.autoRedaction}</h4>
        <p className="text-sm text-slate-500 mb-4">Automatically detect and redact sensitive information</p>
      </div>
      
      {/* Auto Redact All Button */}
      <button 
        onClick={autoRedactAllStreaming}
        disabled={redactingAll || isEditing}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium mb-5 flex items-center justify-center space-x-3 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        {redactingAll ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{t.vault.redactingAll}</span>
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" />
            <span>{t.vault.autoRedactAll}</span>
          </>
        )}
      </button>

      {/* Real-time streaming progress */}
      {Object.keys(streamingProgress).length > 0 && (
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-sm font-semibold text-slate-800 mb-3 flex items-center space-x-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
            <span>Processing Progress</span>
          </div>
          <div className="space-y-2">
            {Object.entries(streamingProgress).map(([pageNum, progress]) => (
              <div key={pageNum} className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">Page {pageNum}</span>
                {progress.status === 'processing' && (
                  <span className="text-indigo-600 flex items-center space-x-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Processing ({progress.redactions?.length || 0})</span>
                  </span>
                )}
                {progress.status === 'completed' && (
                  <span className="text-emerald-600 flex items-center space-x-1">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span>{progress.totalRedactions} redactions</span>
                  </span>
                )}
                {progress.status === 'error' && (
                  <span className="text-red-500 flex items-center space-x-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Error</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white text-slate-500 font-medium">{t.vault.orSelectSpecificTypes}</span>
        </div>
      </div>
    </div>

    {/* Save Success Message */}
    {saveSuccess && (
      <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          <span className="text-sm font-semibold text-emerald-800">{t.vault.templateSaved}</span>
        </div>
        <div className="space-y-1 text-xs text-emerald-700">
          <div>ID: {saveSuccess.template_id}</div>
          <div>Name: {saveSuccess.name}</div>
        </div>
      </div>
    )}

    {/* Action Buttons */}
    <div className="grid grid-cols-2 gap-3 mb-5">

      {/* you have yo modify the api of this saving button */}
      <button 
        onClick={saveTemplate}
        disabled={saving || !templateData || templateData.length === 0}
        className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">{t.vault.saving}</span>
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            <span className="text-sm font-medium">{t.vault.save}</span>
          </>
        )}
      </button>
      
      <button 
        onClick={downloadTemplate}
        disabled={downloading || !templateData || templateData.length === 0}
        className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white disabled:text-slate-400 p-2 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md"
      >
        {downloading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">{t.vault.downloading}</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">{t.vault.download}</span>
          </>
        )}
      </button>
      
      <button 
        onClick={resetTemplate}
        disabled={!originalTemplateData}
        className="bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:cursor-not-allowed text-slate-700 disabled:text-slate-400 p-2 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
      >
        <span className="text-sm font-medium">{t.vault.reset}</span>
      </button>
      
      <button 
        onClick={createNewPage}
        className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md"
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm font-medium">{t.vault.addPage}</span>
      </button>
    </div>

    {/* Redaction Types Section */}
    <div className={`space-y-4 ${isEditing ? 'opacity-40 pointer-events-none' : ''} transition-opacity duration-200`}>
      <div className="border-t border-slate-100 pt-4">
        <h5 className="text-base font-semibold text-slate-900 mb-1">
          {t.vault.selectInformationToRedact}
        </h5>
        <p className="text-sm text-slate-500 mb-4">Choose specific types of information to redact</p>
      </div>
      
      <div className="space-y-1">
        {redactionTypes.map((type) => (
          <label key={type} className="flex items-center space-x-3 cursor-pointer group px-3 py-1 rounded-lg hover:bg-slate-50 transition-colors duration-150 text-[15px]">
            <input
              type="checkbox"
              checked={selectedRedactionTypes.includes(type)}
              onChange={() => handleRedactionTypeToggle(type)}
              disabled={isEditing}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded transition-colors duration-150"
            />
            <span className="text-slate-700 group-hover:text-slate-900 transition-colors duration-150 font-medium">{type}</span>
          </label>
        ))}
      </div>
      
      <div className="border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
          <span>Selected: {selectedRedactionTypes.length} of {redactionTypes.length}</span>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setSelectedRedactionTypes([...redactionTypes])}
            disabled={isEditing}
            className="text-xs px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors duration-150 disabled:opacity-50 font-medium"
          >
            {t.vault.selectAll}
          </button>
          <button 
            onClick={() => setSelectedRedactionTypes([])}
            disabled={isEditing}
            className="text-xs px-3 py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors duration-150 disabled:opacity-50 font-medium"
          >
            {t.vault.clearAll}
          </button>
        </div>
      </div>

      {/* Selective Auto Redact Button */}
      <button 
        onClick={autoRedact}
        disabled={redacting || selectedRedactionTypes.length === 0 || isEditing}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center space-x-3 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        {redacting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{t.vault.redactingSelected}</span>
          </>
        ) : (
          <>
            <Star className="w-5 h-5" />
            <span>{t.vault.redactSelected}</span>
          </>
        )}
      </button>
    </div>

    {/* Template Info Section */}
    <div className="mt-4 pt-6 border-t border-slate-100">
      <h5 className="text-base font-semibold text-slate-900 mb-4">Template Information</h5>
      
      <div className="space-y-4">
        <div>
          <div className="text-sm font-medium text-slate-500 mb-1">{t.vault.templateId}</div>
          <div className="text-sm font-mono text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 break-all">
            {docId}
          </div>
        </div>
        
        <div>
          <div className="text-sm font-medium text-slate-500 mb-1">{t.vault.page}</div>
          <div className="text-sm font-semibold text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
            {currentPage} {t.vault.of} {totalPages}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-slate-500 mb-1">{t.vault.status}</div>
          <div className="text-sm font-semibold text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200 flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>{t.vault.templateLoaded}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
      </div>
    </div>
  )
}

export default DocumentVault