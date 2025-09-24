import React from 'react';

const LoadingSpinner = ({ generationStatus }) => {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">
          {generationStatus || "Initializing document generation..."}
        </p>
        <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
          <div className="flex justify-center items-center">
            <div className="animate-pulse w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full mx-1"></div>
            <div className="animate-pulse w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full mx-1" style={{animationDelay: '0.2s'}}></div>
            <div className="animate-pulse w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full mx-1" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
