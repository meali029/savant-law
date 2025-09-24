import React, { useState, useEffect } from 'react';
import { Zap, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

const RelatedChangesView = ({ 
  textSuggestions = [],
  onApplyChange,
  isTracking = false,
  pendingChanges = 0,
  onRetryAnalysis
}) => {
  const [appliedSuggestions, setAppliedSuggestions] = useState(new Set());
  const [dismissedSuggestions, setDismissedSuggestions] = useState(new Set());

  // Filter out dismissed suggestions
  const visibleSuggestions = textSuggestions.filter(s => !dismissedSuggestions.has(s.id));

  const handleApply = (suggestionId) => {
    const suggestion = textSuggestions.find(s => s.id === suggestionId);
    if (suggestion && onApplyChange) {
      // Call the parent's apply change handler
      const success = onApplyChange(suggestion.original, suggestion.suggested);
      
      // Only mark as applied if the change was successful
      if (success !== false) {
        setAppliedSuggestions(prev => new Set([...prev, suggestionId]));
        console.log('Applied related suggestion:', suggestionId);
      } else {
        console.warn('Failed to apply related suggestion:', suggestionId);
      }
    } else {
      // Mark as applied even if no callback (for UI consistency)
      setAppliedSuggestions(prev => new Set([...prev, suggestionId]));
      console.log('Applied related suggestion (no callback):', suggestionId);
    }
  };

  const handleDismiss = (suggestionId) => {
    console.log('Dismissed related suggestion:', suggestionId);
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
  };

  const handleApplyAll = () => {
    visibleSuggestions.forEach(suggestion => {
      if (!appliedSuggestions.has(suggestion.id)) {
        handleApply(suggestion.id);
      }
    });
  };

  const handleDismissAll = () => {
    visibleSuggestions.forEach(suggestion => {
      if (!appliedSuggestions.has(suggestion.id)) {
        handleDismiss(suggestion.id);
      }
    });
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 mb-2">
          <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-blue-800 dark:text-blue-300 text-base">
            Related Changes
          </h3>
        </div>
        
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>{visibleSuggestions.length} suggestions</span>
          </div>
          <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>{appliedSuggestions.size} applied</span>
          </div>
          {pendingChanges > 0 && (
            <div className="flex items-center space-x-1 text-orange-600 dark:text-orange-400">
              <Clock className="w-3 h-3" />
              <span>{pendingChanges} pending</span>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {visibleSuggestions.length > 1 && (
          <div className="flex space-x-2 mt-4">
            <button
              onClick={handleApplyAll}
              disabled={isTracking}
              className="flex-1 px-3 py-2 text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors font-medium"
            >
              Apply All
            </button>
            <button
              onClick={handleDismissAll}
              disabled={isTracking}
              className="flex-1 px-3 py-2 text-xs border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Dismiss All
            </button>
          </div>
        )}
      </div>
      
      <div className="p-4">
        {/* Tracking State */}
        {isTracking && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-blue-800 dark:text-blue-200 font-medium">Analyzing Related Changes...</span>
            </div>
            <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
              AI is finding content that should be updated based on your recent edits
            </p>
          </div>
        )}

        {/* Pending Changes Indicator */}
        {pendingChanges > 0 && !isTracking && (
          <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span className="text-orange-800 dark:text-orange-200 font-medium">
                  {pendingChanges} change{pendingChanges > 1 ? 's' : ''} detected
                </span>
              </div>
              {onRetryAnalysis && (
                <button
                  onClick={onRetryAnalysis}
                  className="px-3 py-1 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded text-sm hover:bg-orange-200 dark:hover:bg-orange-900/60 transition-colors"
                >
                  Analyze Now
                </button>
              )}
            </div>
            <p className="text-orange-700 dark:text-orange-300 text-sm mt-1">
              Waiting for you to finish editing before analyzing...
            </p>
          </div>
        )}

        {/* Suggestions List */}
        {visibleSuggestions.length > 0 && (
          <div className="space-y-4">
            {visibleSuggestions.map((suggestion, index) => {
              const isApplied = appliedSuggestions.has(suggestion.id);
              
              return (
                <div 
                  key={suggestion.id}
                  className={`relative overflow-hidden rounded-xl transition-all duration-500 transform ${
                    isApplied 
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 scale-[0.98]' 
                      : 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-white ${
                          isApplied ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                              {suggestion.title || `Change ${index + 1}`}
                            </h4>
                            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                              Related
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {suggestion.impact || suggestion.header}
                            </span>
                            {suggestion.confidence && (
                              <span className={`text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                                {getConfidenceLabel(suggestion.confidence)} ({Math.round(suggestion.confidence * 100)}%)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isApplied && (
                        <div className="flex items-center space-x-1">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            Applied
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {!isApplied && (
                      <>
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium uppercase tracking-wide">
                            Current:
                          </p>
                          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-600 p-3 text-sm text-gray-700 dark:text-gray-300 rounded-r-lg">
                            {suggestion.original}
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium uppercase tracking-wide">
                            Suggested:
                          </p>
                          <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 dark:border-green-600 p-3 text-sm text-gray-700 dark:text-gray-300 rounded-r-lg">
                            {suggestion.suggested}
                          </div>
                        </div>

                        {suggestion.reason && (
                          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-xs text-blue-800 dark:text-blue-200 italic">
                              💡 {suggestion.reason}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleDismiss(suggestion.id)}
                            className="flex-1 px-3 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 font-medium"
                          >
                            <XCircle className="w-4 h-4 inline mr-1" />
                            Dismiss
                          </button>
                          <button 
                            onClick={() => handleApply(suggestion.id)}
                            className="flex-1 px-3 py-2 text-sm bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            <CheckCircle2 className="w-4 h-4 inline mr-1" />
                            Apply Change
                          </button>
                        </div>
                      </>
                    )}
                    
                    {isApplied && (
                      <div className="text-sm text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-800/30 p-3 rounded-lg border border-green-200 dark:border-green-700">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="font-medium">This change has been applied to your document.</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Empty State */}
        {!isTracking && pendingChanges === 0 && visibleSuggestions.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center">
              <Zap className="w-10 h-10 text-blue-400 dark:text-blue-500" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Related Changes
            </h4>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
              Make edits to your document to get AI-powered suggestions for related content that should be updated.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Changes are analyzed automatically after you finish editing
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
};

export default RelatedChangesView;