import React from 'react';
import { MessageSquare, Smile, Edit3, Bold, Italic, Underline, Strikethrough, Code, Type, Asterisk } from 'lucide-react';

const TextSelectionToolbar = ({ position, onFormat, onComment, onAskSavant, onRiskAnalysis, selectedText }) => {
  if (!position) return null;

  const formatOptions = [
    { icon: Bold, command: 'bold', tooltip: 'Bold' },
    { icon: Italic, command: 'italic', tooltip: 'Italic' },
    { icon: Underline, command: 'underline', tooltip: 'Underline' },
    // { icon: Strikethrough, command: 'strikethrough', tooltip: 'Strikethrough' },
    // { icon: Code, command: 'code', tooltip: 'Code' },
  ];

  const handleAskSavant = () => {
    if (onAskSavant && selectedText) {
      onAskSavant(selectedText);
    }
  };

  const handleRiskAnalysis = () => {
    if (onRiskAnalysis && selectedText) {
      onRiskAnalysis(selectedText);
    }
  };

  return (
    <div 
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg px-2 py-1 flex items-center space-x-1"
      style={{
        left: position.x,
        top: position.y - 50,
        transform: 'translateX(-50%)',
        zIndex: 9999,
      }}
    >
      <button
        onClick={handleAskSavant}
        className="flex items-center space-x-1 px-2 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
        title="Ask AI Assistant about selected text"
      >
        <MessageSquare className="w-4 h-4" />
        <span className="text-sm font-medium">Ask Savant</span>
      </button>
      
      <button
        onClick={handleRiskAnalysis}
        className="flex items-center space-x-1 px-2 py-1 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors"
        title="Risk Analysis of selected text"
      >
        <Asterisk className="w-4 h-4" />
        <span className="text-sm">Risk Analysis</span>
      </button>

      <button
        onClick={() => onComment && onComment(selectedText)}
        className="p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        title="Add Comment"
      >
        <Edit3 className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

      {formatOptions.map(({ icon: Icon, command, tooltip }) => (
        <button
          key={command}
          onClick={() => onFormat && onFormat(command)}
          className="p-1 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
          title={tooltip}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
};

export default TextSelectionToolbar;