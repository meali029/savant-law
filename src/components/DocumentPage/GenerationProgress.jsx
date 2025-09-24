import React from 'react';

const GenerationProgress = ({ 
  isGenerating, 
  documentContent, 
  generationStatus, 
  generationProgress 
}) => {
  if (!isGenerating || documentContent) return null;

  return (
    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="animate-pulse w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-2"></div>
          <span className="text-blue-700 dark:text-blue-300 text-sm">{generationStatus}</span>
        </div>
        <div className="text-blue-700 dark:text-blue-300 text-sm font-medium">
          {generationProgress}%
        </div>
      </div>
      {generationProgress > 1 && (
        <div className="mt-2 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-1">
          <div 
            className="bg-blue-600 dark:bg-blue-400 h-1 rounded-full transition-all duration-300"
            style={{ width: `${generationProgress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default GenerationProgress;