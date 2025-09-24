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
  AlertCircle
} from 'lucide-react'
import { getToken } from '../../services/authApi'
import { useRouter } from 'next/navigation'

const DocumentViewer = ({ docId = '687b9a2bdbd6c3a5eab314de' }) => {
  const router = useRouter()
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
  const [documentData, setDocumentData] = useState(null)
  const [originalDocumentData, setOriginalDocumentData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [redacting, setRedacting] = useState(false)
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

  // Fetch document content from API
  useEffect(() => {
    if (docId) {
      fetchDocumentContent(docId)
    }
  }, [docId])

  const fetchDocumentContent = async (documentId) => {
    setLoading(true)
    setError(null)
    
    try {
      const token = getToken()
      const response = await fetch(`https://api.getmediarank.com/api/v1/documents/${documentId}/parsed`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setDocumentData(data)
      setOriginalDocumentData(data) // Store original data for reset functionality
      setCurrentPage(1) // Reset to first page
    } catch (err) {
      console.error('Error fetching document:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const saveDocument = async () => {
    if (!documentData || !Array.isArray(documentData) || documentData.length === 0) {
      alert('No document data to save')
      return
    }

    setSaving(true)
    setSaveSuccess(null)
    
    try {
      const token = getToken()
      // Prepare the pages data for the API
      const pages = documentData.map(page => ({
        page_number: page.page_number,
        page_html: page.page_html
      }))

      // Generate a name based on the document ID and current timestamp
      const timestamp = new Date().toISOString().split('T')[0]
      const templateName = `Document ${docId?.slice(-8) || 'Unknown'} - ${timestamp}`
      const templateDescription = `Template created from document ${docId} with redactions applied`

      const response = await fetch('https://api.getmediarank.com/api/v1/templates/from_document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: templateName,
          description: templateDescription,
          pages: pages
        })
      })

      if (!response.ok) {
        throw new Error(`Save failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      setSaveSuccess(result)
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSaveSuccess(null)
      }, 5000)

    } catch (err) {
      console.error('Error saving document:', err)
      alert(`Save failed: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const autoRedact = async () => {
    if (!documentData || selectedRedactionTypes.length === 0) {
      alert('No document loaded or no redaction types selected')
      return
    }

    setRedacting(true)
    try {
      // Process each page
      const redactedPages = await Promise.all(
        documentData.map(async (page) => {
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

      setDocumentData(redactedPages)
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

  const resetDocument = () => {
    if (originalDocumentData) {
      setDocumentData(originalDocumentData)
      setSaveSuccess(null) // Clear any save success message
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

  const downloadDocument = async () => {
    if (!docId) {
      alert('No document ID available')
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
      let filename = 'document.pdf'
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
      console.error('Error downloading document:', err)
      alert(`Download failed: ${err.message}`)
    } finally {
      setDownloading(false)
    }
  }

  const handleEditStart = () => {
    setIsEditing(true)
    setEditContent(currentPageData?.page_html || '')
  }

  const handleEditSave = () => {
    if (!currentPageData) return
    // Update the page_html for the current page, preserving other pages
    setDocumentData(prev => prev.map(page =>
      page.page_number === currentPage
        ? { ...page, page_html: editableRef.current.innerHTML }
        : page
    ))
    setIsEditing(false)
  }

  const handleEditCancel = () => {
    setIsEditing(false)
  }

  const renderRedactedText = (text) => {
    // Simple redaction simulation - in a real app, this would be based on API response
    // For now, we'll just render the text as-is since the API response doesn't include redaction info
    return text
  }

  const renderPageContent = (pageData) => {
    if (!pageData) return null
    if (isEditing) {
      return (
        <div>
          <div
            ref={editableRef}
            contentEditable
            suppressContentEditableWarning
            className="border border-blue-300 rounded p-2 min-h-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ minHeight: '200px', background: '#fff', color: '#222', wordBreak: 'break-word' }}
            dangerouslySetInnerHTML={{ __html: editContent }}
          />
          <div className="mt-2 flex gap-2">
            <button onClick={handleEditSave} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Save</button>
            <button onClick={handleEditCancel} className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
          </div>
        </div>
      )
    }
    return (
      <div className="space-y-4">
        <div 
          className="text-sm leading-relaxed text-gray-800 overflow-hidden"
          style={{
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            hyphens: 'auto'
          }}
          dangerouslySetInnerHTML={{ 
            __html: pageData.page_html
              ? pageData.page_html.replace(/<\/p>/g, '</p><div style="margin-bottom: 12px;"></div>')
              : ''
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
          <p className="text-gray-600">Loading document...</p>
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
          <h2 className="text-xl font-semibold text-gray-900">Error Loading Document</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => fetchDocumentContent(docId)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // No document data
  if (!documentData || !Array.isArray(documentData) || documentData.length === 0) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <AlertCircle className="w-12 h-12 text-gray-400" />
          <p className="text-gray-600">No document data available</p>
        </div>
      </div>
    )
  }

  const totalPages = documentData.length
  const currentPageData = documentData.find(page => page.page_number === currentPage)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left Sidebar - Document Navigation */}
      <div className="w-100 bg-white border-r border-gray-200 flex flex-col">
        {/* Document Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
            <div className="flex items-center space-x-1">
              <span className="text-sm font-medium text-gray-900 truncate">Document {docId?.slice(-8) || 'Unknown'}</span>
            </div>
          </div>
        </div>

        {/* Document Preview */}
        <div className="p-4 flex-1 overflow-y-auto">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <div key={pageNum} className="mb-4">
              <div 
                className={`w-20 h-28 border-2 rounded-sm mb-2 mx-auto cursor-pointer transition-all duration-200 ${
                  currentPage === pageNum 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
                onClick={() => setCurrentPage(pageNum)}
              >
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">Page {pageNum}</div>
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
              <div className="text-xs text-center text-gray-600">{pageNum} of {totalPages}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Document Content */}
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
                  Page {currentPage} not found
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Redaction Controls */}
        <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
          {/* Choose Redaction Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Choose Redaction</h3>
            <ChevronDown className="w-5 h-5 text-gray-600" />
          </div>
          
          {/* Auto Redact Button */}
          <button 
            onClick={autoRedact}
            disabled={redacting || selectedRedactionTypes.length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium mb-4 flex items-center justify-center space-x-2 transition-colors"
          >
            {redacting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Redacting...</span>
              </>
            ) : (
              <>
                <Star className="w-4 h-4" />
                <span>Auto Redact</span>
              </>
            )}
          </button>

          {/* Save Success Message */}
          {saveSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">Document Saved!</span>
              </div>
              <div className="mt-1 text-xs text-green-600">
                Template ID: {saveSuccess.template_id}
              </div>
              <div className="mt-1 text-xs text-green-600">
                Name: {saveSuccess.name}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-8">
            <button 
              onClick={saveDocument}
              disabled={saving || !documentData}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed text-white p-2.5 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span className="text-sm">Save</span>
                </>
              )}
            </button>
            
            <button 
              onClick={downloadDocument}
              disabled={downloading}
              className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700 disabled:text-gray-400 p-2.5 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Downloading...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span className="text-sm">Download</span>
                </>
              )}
            </button>
            
            <button 
              onClick={resetDocument}
              disabled={!originalDocumentData}
              className="col-span-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700 disabled:text-gray-400 p-2.5 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <span>Reset Document</span>
            </button>
          </div>

          {/* Redaction Types */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-gray-900 mb-3">
              Select Information to Redact:
            </div>
            {redactionTypes.map((type) => (
              <label key={type} className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedRedactionTypes.includes(type)}
                  onChange={() => handleRedactionTypeToggle(type)}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-gray-700 group-hover:text-gray-900 transition-colors">{type}</span>
              </label>
            ))}
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-2">
                Selected: {selectedRedactionTypes.length} of {redactionTypes.length}
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setSelectedRedactionTypes([...redactionTypes])}
                  className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors"
                >
                  Select All
                </button>
                <button 
                  onClick={() => setSelectedRedactionTypes([])}
                  className="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {/* Current Document Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500 mb-2">Document ID:</div>
            <div className="text-sm font-mono text-gray-700 bg-gray-50 p-3 rounded border mb-4 break-all">
              {docId}
            </div>
            
            <div className="text-sm text-gray-500 mb-2">Page:</div>
            <div className="text-sm font-medium text-gray-700 bg-gray-50 p-3 rounded border mb-4">
              {currentPage} of {totalPages}
            </div>

            <div className="text-sm text-gray-500 mb-2">Status:</div>
            <div className="text-sm font-medium text-green-700 bg-green-50 p-3 rounded border">
              ✓ Document Loaded
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentViewer