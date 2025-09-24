import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Sparkles, Loader, FileText } from 'lucide-react'

export default function DocumentOptionsModal({
  isOpen,
  onClose,
  onGenerate,
  onUpload,
  onTemplate,
  isUploading,
  uploadingFiles,
  uploadError,
  setUploadError,
  isDraggingOver,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}>
          <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl max-w-lg w-full mx-4 transition-all ${
            isDraggingOver ? 'ring-2 ring-green-400 ring-opacity-50' : ''
          }`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Create New Document
              </h2>
              <button 
                onClick={onClose}
                disabled={isUploading}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
                <X size={24} />
              </button>
            </div>
            
            {/* Upload Error Display */}
            {uploadError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center">
                  <X className="w-4 h-4 text-red-500 mr-2" />
                  <span className="text-red-700 dark:text-red-300 text-sm">{uploadError}</span>
                  <button 
                    onClick={() => setUploadError(null)}
                    className="ml-auto text-red-500 hover:text-red-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Drag and Drop Overlay */}
            {isDraggingOver && (
              <div className="absolute inset-0 bg-green-50 dark:bg-green-900/20 border-2 border-dashed border-green-400 rounded-xl flex items-center justify-center z-10">
                <div className="text-center">
                  <Upload className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-lg font-semibold text-green-700 dark:text-green-300">Drop PDF or DOC files here</p>
                  <p className="text-sm text-green-600 dark:text-green-400">Multiple files supported</p>
                </div>
              </div>
            )}
            
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
              Choose how you'd like to create your document
            </p>
            
            <div className="space-y-4">
              {/* Generate Document Option */}
              <button
                onClick={onGenerate}
                disabled={isUploading}
                className="w-full p-4 border-2 border-indigo-200 dark:border-indigo-700 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mr-4 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 transition-colors">
                    <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">Generate Document</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Create from scratch using AI</p>
                  </div>
                </div>
              </button>

              {/* Choose Template Option */}
              <button
                onClick={onTemplate}
                disabled={isUploading}
                className="w-full p-4 border-2 border-purple-200 dark:border-purple-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-4 group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                    <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">Choose Template</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Start with a pre-designed template</p>
                  </div>
                </div>
              </button>
              
              {/* Upload Document Option */}
              <div className={`border-2 rounded-lg transition-colors ${
                isDraggingOver 
                  ? 'border-green-400 bg-green-50 dark:bg-green-900/20' 
                  : 'border-green-200 dark:border-green-700'
              }`}>
                <button
                  onClick={onUpload}
                  disabled={isUploading}
                  className="w-full p-4 hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed rounded-lg">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-4 group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
                      {isUploading ? (
                        <Loader className="w-6 h-6 text-green-600 dark:text-green-400 animate-spin" />
                      ) : (
                        <Upload className="w-6 h-6 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                        {isUploading ? `Uploading ${uploadingFiles.length} file(s)...` : 'Upload Documents'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {isUploading ? 'Please wait...' : 'Upload PDF/DOC files or drag & drop here'}
                      </p>
                    </div>
                  </div>
                </button>
                
                {/* Upload Progress Display */}
                {uploadingFiles.length > 0 && (
                  <div className="border-t border-green-200 dark:border-green-700 p-4 space-y-3 max-h-48 overflow-y-auto">
                    {uploadingFiles.map((file) => (
                      <div key={file.id} className="flex items-center space-x-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                              {file.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {file.status === 'uploading' && `${file.progress}%`}
                              {file.status === 'completed' && (
                                <span className="text-green-600 font-medium">✓ Completed</span>
                              )}
                              {file.status === 'error' && (
                                <span className="text-red-600 font-medium">✗ Failed</span>
                              )}
                            </span>
                          </div>
                          {file.status === 'uploading' && (
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div 
                                className="bg-green-500 h-1.5 rounded-full transition-all duration-300" 
                                style={{ width: `${file.progress}%` }}
                              />
                            </div>
                          )}
                          {file.error && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{file.error}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}