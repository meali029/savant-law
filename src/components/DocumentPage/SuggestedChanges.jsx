import React from 'react';

const SuggestedChanges = () => {
  return (
    <div className="w-[400px] pl-8">
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-gray-200 dark:border-purple-800 rounded-lg p-4 transition-colors duration-300">
        <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-4 text-base">Suggested Changes</h3>
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 bg-blue-500 dark:bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-2">
                1
              </div>
              <h4 className="font-medium text-base text-gray-900 dark:text-gray-100">Reduce arrears period</h4>
            </div>
            
            <div className="mb-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Original:</p>
              <div className="bg-gray-50 dark:bg-gray-700 border-l-4 border-gray-300 dark:border-gray-600 p-3 text-sm text-gray-700 dark:text-gray-300">
                High-Risk AI refers to artificial intelligence systems that pose a significant threat to the health, safety, or fundamental rights of individuals due to the context or manner in which they are used.
              </div>
            </div>
            
            <div className="mb-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Suggested:</p>
              <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 dark:border-green-600 p-3 text-sm text-gray-700 dark:text-gray-300">
                High-Risk AI refers to systems that pose serious risks to health, safety, or fundamental rights based on their use or context.
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Dismiss
              </button>
              <button className="px-3 py-1 text-sm bg-purple-500 dark:bg-purple-600 text-white rounded hover:bg-purple-600 dark:hover:bg-purple-700 transition-colors">
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuggestedChanges;
