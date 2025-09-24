import React, { useState } from 'react';
import { Save, Share2, FileText, Eye, EyeOff, Activity, Loader2 } from 'lucide-react';
import WebSocketStatus from './WebSocketStatus';

const DocumentToolbar = ({
  documentTitle,
  isGenerating,
  generationProgress,
  currentContractId,
  documentContent,
  onSave,
  onDownload, // This will be replaced with API call
  onShare,
  isTracking = false, // Tracking status
  pendingChanges = 0, // Number of pending changes
  // NEW: Save-related props
  isSaving = false, // Whether save operation is in progress
  hasUnsavedChanges = false, // Whether there are unsaved changes
  saveError = null, // Any save error message
  // WebSocket props
  connectionStatus = 'disconnected',
  isConnecting = false,
  websocketStats = {}
}) => {
  const [showPreview, setShowPreview] = useState(false);

  const hasContent = documentContent && documentContent.trim().length > 0;

  // Determine save button state
  const canSave = hasContent && !isGenerating && !isSaving && hasUnsavedChanges;
  const saveButtonText = isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save' : 'Saved';



  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Left Section - Document Info */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate max-w-xs">
              {documentTitle || 'Untitled Document'}
              {hasUnsavedChanges && <span className="text-orange-500 ml-1">*</span>}
            </h1>
          </div>
          
          {/* Document Status */}
          <div className="flex items-center space-x-3 text-sm">
            {isGenerating && (
              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Generating... {generationProgress}%</span>
              </div>
            )}
            
            {isSaving && (
              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
            

            
            {/* {hasContent && !isGenerating && !isSaving && !isDownloading && (
              <div className="flex items-center space-x-2">
                {hasUnsavedChanges ? (
                  <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    <span>Unsaved changes</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Saved</span>
                  </div>
                )}
              </div>
            )} */}
            
            {/* Tracking Status */}
            {isTracking && (
              <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
                <Activity className="w-4 h-4 animate-pulse" />
                <span>Analyzing changes...</span>
              </div>
            )}
            
            {/* Pending Changes */}
            {pendingChanges > 0 && !isTracking && (
              <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                <span>{pendingChanges} change{pendingChanges > 1 ? 's' : ''} pending</span>
              </div>
            )}
            
            {/* {currentContractId && (
              <span className="text-gray-500 dark:text-gray-400 text-xs">
                ID: {currentContractId.substring(0, 8)}...
              </span>
            )} */}
            
            {/* WebSocket Status */}
            {/* <WebSocketStatus
              connectionStatus={connectionStatus}
              isConnecting={isConnecting}
              stats={websocketStats}
              showStats={true}
            /> */}
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center space-x-2">
          {/* Preview Toggle */}
          {/* <button
            onClick={() => setShowPreview(!showPreview)}
            disabled={!hasContent}
            className={`p-2 rounded-lg transition-colors ${
              hasContent
                ? 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
            }`}
            title={showPreview ? 'Hide Preview' : 'Show Preview'}
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button> */}

          {/* Enhanced Save Button */}
          <button
            onClick={onSave}
            disabled={!canSave}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              canSave
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md transform hover:scale-105'
                : isSaving
                ? 'bg-blue-400 text-white cursor-wait'
                : hasUnsavedChanges
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 cursor-default'
            }`}
            title={
              !hasContent 
                ? 'No content to save' 
                : isGenerating 
                ? 'Cannot save while generating' 
                : isSaving 
                ? 'Saving in progress...' 
                : !hasUnsavedChanges 
                ? 'No changes to save' 
                : 'Save document'
            }
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saveButtonText}</span>
          </button>



          {/* Share Button */}
          {/* <button
            onClick={onShare}
            disabled={!hasContent || isGenerating}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              hasContent && !isGenerating
                ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-sm'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button> */}
        </div>
      </div>

      {/* Error Messages */}
      {saveError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-red-700 dark:text-red-300 text-sm">
            Save failed: {saveError}
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentToolbar;