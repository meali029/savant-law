// Enhanced DocumentCard component with upload/generation status indicators
import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Edit3, Trash2, Check, X, Loader, ChevronDown, AlertCircle, Clock, Upload } from 'lucide-react'

export default function DocumentCard({
  doc,
  isSelected,
  isSelectionMode,
  onDocumentClick,
  onToggleSelection,
  onRename,
  onDelete,
  onVersionUpdate,
  isRenaming = false
}) {
  const [editingDocument, setEditingDocument] = useState(null)
  const [newDocumentTitle, setNewDocumentTitle] = useState('')
  const [isRenamingState, setIsRenamingState] = useState(false)
  const [isUpdatingVersion, setIsUpdatingVersion] = useState(false)
  const [showVersionDropdown, setShowVersionDropdown] = useState(false)
  const dropdownRef = useRef(null)

  const startRenaming = (doc) => {
    setEditingDocument(doc.id)
    setNewDocumentTitle(doc.title)
  }

  const cancelRenaming = () => {
    setEditingDocument(null)
    setNewDocumentTitle('')
  }

  const saveRename = async (doc) => {
    if (!newDocumentTitle.trim()) {
      cancelRenaming()
      return
    }

    setIsRenamingState(true)
    try {
      await onRename(doc, newDocumentTitle.trim())
      setEditingDocument(null)
      setNewDocumentTitle('')
    } catch (error) {
      console.error('Rename error:', error)
      alert('Failed to rename document: ' + (error.message || 'Unknown error'))
    } finally {
      setIsRenamingState(false)
    }
  }

  const handleVersionChange = async (newVersion) => {
    if (newVersion === doc.version) {
      setShowVersionDropdown(false)
      return
    }

    setIsUpdatingVersion(true)
    setShowVersionDropdown(false)
    
    try {
      await onVersionUpdate(doc, newVersion)
    } catch (error) {
      console.error('Version update error:', error)
    } finally {
      setIsUpdatingVersion(false)
    }
  }

  const availableVersions = ['v1', 'v2', 'v3', 'v4', 'v5']

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowVersionDropdown(false)
      }
    }

    if (showVersionDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [showVersionDropdown])

  // Enhanced document type and status detection
  const isClickable = !doc.isProcessing && doc.status !== 'Error'
  
  const getCursorStyle = () => {
    if (doc.isProcessing) return 'cursor-wait'
    if (doc.status === 'Error') return 'cursor-not-allowed'
    return 'cursor-pointer'
  }

  // Enhanced status display with upload/generation indicators
  const getStatusDisplay = () => {
    if (doc.isProcessing) {
      return {
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900',
        icon: <Clock className="w-3 h-3 mr-1" />,
        text: doc.isUploaded ? `Processing Upload... ${doc.progress}%` : `Generating... ${doc.progress}%`
      }
    }
    
    if (doc.status === 'Error') {
      return {
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900',
        icon: <AlertCircle className="w-3 h-3 mr-1" />,
        text: 'Error'
      }
    }
    
    return {
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900',
      icon: <Check className="w-3 h-3 mr-1" />,
      text: 'Ready'
    }
  }

  const statusDisplay = getStatusDisplay()

  // Document type indicator
  const getDocumentTypeDisplay = () => {
    if (doc.isUploaded) {
      return {
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-900',
        icon: <Upload className="w-3 h-3 mr-1" />,
        text: 'Uploaded'
      }
    }
    return null
  }

  const typeDisplay = getDocumentTypeDisplay()

  return (
    <motion.div
      whileHover={isClickable ? { y: -5 } : {}}
      onClick={(e) => isClickable && onDocumentClick(doc, e)}
      className={`relative h-72 rounded-xl shadow-md group bg-white dark:bg-gray-800 ${
        isSelected ? 'ring-2 ring-indigo-500' : ''
      } ${getCursorStyle()} ${doc.isProcessing ? 'opacity-75' : ''} ${
        !isClickable ? 'pointer-events-none' : ''
      }`}>
      
      {/* Processing overlay */}
      {doc.isProcessing && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 rounded-xl flex items-center justify-center z-10">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {doc.isUploaded ? 'Processing Upload...' : 'Generating...'}
            </div>
            <div className="text-xs text-blue-500 dark:text-blue-300">
              {doc.progress}% complete
            </div>
          </div>
        </div>
      )}
      
      {/* Top section - Document preview */}
      <div className="h-1/2 bg-gray-50 dark:bg-gray-700 p-5 relative rounded-t-xl">
        {/* Selection checkbox */}
        <div
          className="absolute top-2 left-2 w-6 h-6 rounded-full border-2 bg-white dark:bg-gray-700 flex items-center justify-center cursor-pointer"
          onClick={e => {
            e.stopPropagation()
            onToggleSelection(doc)
          }}>
          {isSelected && (
            <div className="w-3 h-3 bg-indigo-500 dark:bg-indigo-400 rounded-full" />
          )}
        </div>

        {/* Document type indicator */}
        {typeDisplay && (
          <div className="absolute top-2 right-12">
            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${typeDisplay.bgColor} ${typeDisplay.color}`}>
              {typeDisplay.icon}
              {typeDisplay.text}
            </span>
          </div>
        )}
        
        {/* Delete button - hide when processing */}
        {!doc.isProcessing && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="action-button w-6 h-6 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-800"
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                e.nativeEvent.stopImmediatePropagation()
                onDelete(doc)
              }}
              onMouseDown={e => {
                e.stopPropagation()
              }}
              title="Delete document">
              <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
            </button>
          </div>
        )}
        
        {/* Document preview content */}
        <div className="space-y-2 pt-8">
          <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
          <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-5/6" />
          <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-2/3" />
          <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-4/5" />
        </div>
        <div className="absolute top-8 left-10 right-10 flex items-center space-x-1">
          <div className="h-3 w-3 bg-gray-300 dark:bg-gray-600 rounded-sm" />
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/3" />
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
          <div className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs text-gray-500 dark:text-gray-400">
            {doc.type}
          </div>
          
          {/* Version selector - hide when processing */}
          {!doc.isProcessing && (
            <div className="relative" ref={dropdownRef}>
              <button
                className={`action-button px-2 py-1 rounded text-xs font-medium flex items-center space-x-1 transition-colors ${
                  isUpdatingVersion 
                    ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                    : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800'
                }`}
                onClick={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  e.nativeEvent.stopImmediatePropagation()
                  if (!isUpdatingVersion) {
                    setShowVersionDropdown(!showVersionDropdown)
                  }
                }}
                onMouseDown={e => {
                  e.stopPropagation()
                }}
                disabled={isUpdatingVersion}
                title="Change version">
                {isUpdatingVersion ? (
                  <>
                    <Loader className="w-3 h-3 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <span>{doc.version}</span>
                    <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
              
              {/* Version dropdown */}
              {showVersionDropdown && !isUpdatingVersion && (
                <div className="absolute bottom-full right-0 mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-20 min-w-[80px]">
                  {availableVersions.map(version => (
                    <button
                      key={version}
                      className={`w-full px-3 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-md last:rounded-b-md ${
                        version === doc.version 
                          ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                      onClick={e => {
                        e.preventDefault()
                        e.stopPropagation()
                        e.nativeEvent.stopImmediatePropagation()
                        handleVersionChange(version)
                      }}
                      onMouseDown={e => {
                        e.stopPropagation()
                      }}>
                      {version}
                      {version === doc.version && <span className="ml-1">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom section - Document info */}
      <div className="p-5" onClick={e => e.stopPropagation()}>
        {editingDocument === doc.id ? (
          <div className="mb-2">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newDocumentTitle}
                onChange={(e) => setNewDocumentTitle(e.target.value)}
                className="flex-1 text-sm font-medium bg-transparent border-b border-indigo-300 focus:border-indigo-500 outline-none text-gray-800 dark:text-gray-100"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') saveRename(doc)
                  if (e.key === 'Escape') cancelRenaming()
                }}
                autoFocus
                disabled={isRenamingState}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  saveRename(doc)
                }}
                disabled={isRenamingState}
                className="text-green-600 hover:text-green-700 disabled:opacity-50">
                {isRenamingState ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  cancelRenaming()
                }}
                disabled={isRenamingState}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-800 dark:text-gray-100 truncate flex-1">
              {doc.title}
            </h3>
            {/* Edit button - hide when processing */}
            {!doc.isProcessing && (
              <button
                className="action-button ml-2 px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900 flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-800 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  e.nativeEvent.stopImmediatePropagation()
                  startRenaming(doc)
                }}
                onMouseDown={e => {
                  e.stopPropagation()
                }}
                title="Rename document">
                <Edit3 className="w-3 h-3 text-blue-600 dark:text-blue-400 mr-1" />
                <span className="text-blue-600 dark:text-blue-400">Edit</span>
              </button>
            )}
          </div>
        )}
        <div className="flex items-center text-gray-500 dark:text-gray-400 mb-3 text-sm">
          <Calendar className="w-4 h-4 mr-1" />
          <span>{doc.date}</span>
        </div>
        
        {/* Enhanced status display with document type */}
        <div className="space-y-2">
          <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${statusDisplay.bgColor} ${statusDisplay.color}`}>
            {statusDisplay.icon}
            {statusDisplay.text}
          </span>
          
          {/* Processing progress bar */}
          {doc.isProcessing && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 dark:bg-blue-400 h-1.5 rounded-full transition-all duration-300" 
                  style={{ width: `${doc.progress}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Error message */}
          {doc.status === 'Error' && doc.processingError && (
            <div className="mt-2 text-xs text-red-600 dark:text-red-400">
              {doc.processingError}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}