import React from 'react';
import { Search, FileText, RefreshCw } from 'lucide-react';

const DocumentSidebar = ({
  searchQuery,
  setSearchQuery,
  userDocuments,
  isLoadingDocuments,
  loadUserDocuments,
  handleNewDocument,
  onDocumentSelect,
  updateUrlWithContractId
}) => {
  const filteredDocuments = userDocuments.filter(doc =>
    doc.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-64 pr-8">
      <button
        onClick={handleNewDocument}
        className="w-full bg-gray-800 dark:bg-gray-700 text-white px-4 py-3 rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 mb-4 text-sm font-semibold cursor-pointer transition-colors"
      >
        New Document
      </button>
      
      <div className="mb-6 text-sm">
        <div className="relative">
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-md pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          </div>
        </div>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">My Documents</h3>
          <button
            onClick={loadUserDocuments}
            disabled={isLoadingDocuments}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
            title="Refresh documents"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingDocuments ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="space-y-1 text-sm">
          {isLoadingDocuments ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 py-4 text-center">
              {searchQuery ? 'No documents found' : 'No documents yet'}
            </div>
          ) : (
            filteredDocuments.map((doc) => (
              <div 
                key={doc.id}
                className="flex items-center p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer transition-colors group"
                onClick={() => onDocumentSelect(doc)}
              >
                <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{doc.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {new Date(doc.upload_date || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentSidebar;