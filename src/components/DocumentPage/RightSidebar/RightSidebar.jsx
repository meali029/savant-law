import React, { useState, useEffect } from 'react';
import { MessageSquare, FileEdit, Zap, ChevronRight, ChevronLeft, X } from 'lucide-react';
import ChatbotView from './ChatbotView';
import SuggestedChangesView from './SuggestedChangesView';
// import RelatedChangesView from './RelatedChangesView';

const RightSidebar = ({ 
  isCollapsed, 
  onToggleCollapse, 
  documentContent = '', 
  selectedContext = null, 
  onClearContext,
  selectedRiskContent = null,
  onClearRiskContent,
  contractId = null,
  onApplyChange,
  textSuggestions = [], // Text change suggestions
  onClearTextSuggestions, // Clear text suggestions handler
  isTracking = false, // Tracking status
  pendingChanges = 0, // Number of pending changes
  onRetryAnalysis, // Retry analysis function
  // NEW: Jurisdiction analysis props
  jurisdictionAnalysis = null,
  onClearJurisdictionAnalysis
}) => {
  const [activeView, setActiveView] = useState('chat'); // 'chat', 'suggestions', or 'related'

  // Auto-switch to chat when context is selected
  useEffect(() => {
    if (selectedContext) {
      setActiveView('chat');
    }
  }, [selectedContext]);

  // Auto-switch to suggestions when risk content is selected
  useEffect(() => {
    if (selectedRiskContent) {
      setActiveView('suggestions');
    }
  }, [selectedRiskContent]);

  // NEW: Auto-switch to suggestions when jurisdiction analysis is triggered
  useEffect(() => {
    if (jurisdictionAnalysis) {
      setActiveView('suggestions');
    }
  }, [jurisdictionAnalysis]);

  // Auto-switch to related when text suggestions are received
  // useEffect(() => {
  //   if (textSuggestions.length > 0) {
  //     setActiveView('related');
  //   }
  // }, [textSuggestions]);

  // Debug logging
  useEffect(() => {
    console.log('RightSidebar - selectedRiskContent changed:', selectedRiskContent);
    console.log('RightSidebar - contractId:', contractId);
    console.log('RightSidebar - activeView:', activeView);
    console.log('RightSidebar - textSuggestions:', textSuggestions);
    console.log('RightSidebar - jurisdictionAnalysis:', jurisdictionAnalysis);
  }, [selectedRiskContent, contractId, activeView, textSuggestions, jurisdictionAnalysis]);

  // Count total suggestions
  const totalSuggestions = textSuggestions.length;
  const hasNotifications = selectedContext || selectedRiskContent || totalSuggestions > 0 || pendingChanges > 0 || jurisdictionAnalysis;

  if (isCollapsed) {
    return (
      <div className="w-16 bg-white dark:bg-gray-800 border-l shadow-sm border-gray-200 dark:border-gray-700 flex flex-col items-center transition-all duration-300" style={{ height: 'calc(100vh - 140px)' }} data-right-sidebar>
        <button
          onClick={onToggleCollapse}
          className="p-2 mt-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mb-6 group"
          title="Expand sidebar"
        >
          <ChevronLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
        
        <div className="space-y-4">
          <button
            onClick={() => {
              setActiveView('chat');
              onToggleCollapse();
            }}
            className={`p-3 ml-2 rounded-xl transition-all duration-200 relative group ${
              activeView === 'chat'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="AI Assistant"
          >
            <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {activeView === 'chat' && (
              <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-blue-300 rounded-full"></div>
            )}
            {selectedContext && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full"></div>
            )}
          </button>
          
          <button
            onClick={() => {
              setActiveView('suggestions');
              onToggleCollapse();
            }}
            className={`p-3 ml-2 rounded-xl transition-all duration-200 relative group ${
              activeView === 'suggestions'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Risk Analysis & Jurisdiction"
          >
            <FileEdit className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {activeView === 'suggestions' && (
              <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-purple-500 rounded-full"></div>
            )}
            {(selectedRiskContent || jurisdictionAnalysis) && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            )}
          </button>

          {/* <button
            onClick={() => {
              setActiveView('related');
              onToggleCollapse();
            }}
            className={`p-3 ml-2 rounded-xl transition-all duration-200 relative group ${
              activeView === 'related'
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Related Changes"
          >
            <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {activeView === 'related' && (
              <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-full"></div>
            )}
            {(totalSuggestions > 0 || pendingChanges > 0) && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                {totalSuggestions > 0 ? totalSuggestions : pendingChanges}
              </div>
            )}
          </button> */}
        </div>
      </div>
    );
  }

  return (
    <div className="w-[420px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-sm flex flex-col transition-all duration-300" style={{ height: 'calc(100vh - 140px)' }} data-right-sidebar>
      {/* Header with glassmorphism effect */}
      <div className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setActiveView('chat')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 relative ${
              activeView === 'chat'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Assistant</span>
            {activeView === 'chat' && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            )}
            {selectedContext && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                !
              </div>
            )}
          </button>
          
          <button
            onClick={() => setActiveView('suggestions')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 relative ${
              activeView === 'suggestions'
                ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <FileEdit className="w-4 h-4" />
            <span>Analysis</span>
            {(selectedRiskContent || jurisdictionAnalysis) && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                !
              </div>
            )}
          </button>

          {/* <button
            onClick={() => setActiveView('related')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 relative ${
              activeView === 'related'
                ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Related</span>
            {(totalSuggestions > 0 || pendingChanges > 0) && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                {totalSuggestions > 0 ? totalSuggestions : pendingChanges}
              </div>
            )}
          </button> */}
        </div>
        
        <button
          onClick={onToggleCollapse}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group"
          title="Collapse sidebar"
        >
          <ChevronRight className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Content with enhanced styling */}
      <div className="flex-1 overflow-hidden bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
        {activeView === 'chat' && (
          <ChatbotView 
            onSwitchToChanges={() => setActiveView('suggestions')} 
            documentContent={documentContent}
            selectedContext={selectedContext}
            onClearContext={onClearContext}
            onApplyChanges={onApplyChange}
            onApplyChange={onApplyChange}
          />
        )}
        {activeView === 'suggestions' && (
          <SuggestedChangesView 
            selectedRiskContent={selectedRiskContent}
            contractId={contractId}
            documentContent={documentContent}
            onApplyChange={onApplyChange}
            onClearRiskContent={onClearRiskContent}
            // NEW: Pass jurisdiction analysis props
            jurisdictionAnalysis={jurisdictionAnalysis}
            onClearJurisdictionAnalysis={onClearJurisdictionAnalysis}
          />
        )}
       
      </div>
    </div>
  );
};

export default RightSidebar;