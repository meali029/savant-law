"use client";
import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  Columns, 
  Globe, 
  FileDown,
  Home,
  Database,
  MessageSquare,
  Bell,
  Search,
  Folder,
  ChevronRight,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react';
import Header from '../../components/Header/Header';
import { useLanguage } from '../../context/LanguageContext';

function TabularReviewPage() {
  const { t } = useLanguage();
  const [isDocumentsPanelOpen, setIsDocumentsPanelOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState({});

  const documentsData = [
    {
      type: 'folder',
      name: 'Playbook',
      documentCount: 1,
      id: 'playbook'
    },
    {
      type: 'folder',
      name: 'DPAs',
      documentCount: 5,
      id: 'dpas'
    },
    {
      type: 'folder',
      name: 'Directives',
      documentCount: 9,
      id: 'directives'
    },
    {
      type: 'folder',
      name: 'Employment agreements',
      documentCount: 3,
      id: 'employment'
    },
    {
      type: 'folder',
      name: 'Loan agreements',
      documentCount: 10,
      id: 'loan'
    },
    {
      type: 'folder',
      name: 'IP',
      documentCount: 4,
      id: 'ip'
    },
    {
      type: 'folder',
      name: 'Development',
      documentCount: 23,
      id: 'development'
    },
    {
      type: 'folder',
      name: 'Human resources',
      documentCount: 18,
      id: 'hr'
    },
    {
      type: 'file',
      name: 'DOJ_EmailFile_3.pdf',
      status: 'online',
      timestamp: 'about 1 hour ago'
    },
    {
      type: 'file',
      name: 'DOJ_EmailFile_2.pdf',
      status: 'online',
      timestamp: 'about 1 hour ago'
    },
    {
      type: 'file',
      name: 'DOJ_EmailFile_1.pdf',
      status: 'online',
      timestamp: 'about 1 hour ago'
    },
    {
      type: 'file',
      name: 'SPA (1).pdf',
      timestamp: '12/02/2025'
    },
    {
      type: 'file',
      name: 'ILTA Technology Survey 202...',
      timestamp: '12/02/2025'
    }
  ];

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Header />
      
      <div className="flex">
        {/* Sidebar */}
        <div className="w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen transition-colors duration-300">
          <div className="flex flex-col items-center py-4 space-y-6">
            <button className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Home className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button 
              className={`p-3 rounded-lg transition-colors ${
                isDocumentsPanelOpen 
                  ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              onClick={() => setIsDocumentsPanelOpen(!isDocumentsPanelOpen)}
            >
              <FileText className="w-5 h-5" />
            </button>
            <button className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </button>
            <button className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Documents Panel */}
        <div className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${
          isDocumentsPanelOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'
        }`}>
          <div className="h-full flex flex-col">
            {/* Documents Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t.tabular.documents}</h2>
                <button 
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  onClick={() => setIsDocumentsPanelOpen(false)}
                >
                  <ArrowLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder={t.tabular.searchPlaceholder}
                  className="w-full text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 text-sm pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
                />
              </div>
              
              {/* New Button */}
              <button className="w-full mt-3 flex items-center justify-center space-x-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t.tabular.newButton}</span>
              </button>
            </div>

            {/* Documents List */}
            <div className="flex-1 overflow-y-auto">
              {documentsData.map((item, index) => (
                <div key={index} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                  {item.type === 'folder' ? (
                    <div 
                      className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      onClick={() => toggleFolder(item.id)}
                    >
                      <div className="flex items-center space-x-3">
                        {expandedFolders[item.id] ? (
                          <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        )}
                        <Folder className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{item.documentCount} {t.tabular.documentsCount}</div>
                        </div>
                      </div>
                      <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded flex items-center justify-center">
                          <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</div>
                          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                            {item.status && (
                              <>
                                <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
                                <span>{item.status}</span>
                                <span>•</span>
                              </>
                            )}
                            <span>{item.timestamp}</span>
                          </div>
                        </div>
                      </div>
                      <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Top Navigation Bar */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t.tabular.reviewTitle.replace('{number}', 139)}</h1>
              </div>
              
              <div className="flex items-center space-x-3">
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t.tabular.addDocuments}</span>
                </button>
                
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Columns className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t.tabular.addColumns}</span>
                </button>
                
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t.tabular.language}</span>
                </button>
                
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t.tabular.templates}</span>
                </button>
                
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <FileDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t.tabular.export}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="p-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
              {/* Table Header */}
              <div className="grid grid-cols-6 border-b border-gray-200 dark:border-gray-700">
                <div className="p-3 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.tabular.document}</span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600 flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <Plus className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t.tabular.addColumn}</span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600"></div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600"></div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600"></div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700"></div>
              </div>

              {/* Table Body - Excel-like grid */}
              <div className="overflow-auto">
                {/* Rows */}
                {Array.from({ length: 15 }, (_, rowIndex) => (
                  <div key={rowIndex} className="grid grid-cols-6 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    {/* First column - Document */}
                    <div className="p-3 border-r border-gray-200 dark:border-gray-600 min-h-[48px] flex items-center">
                      {rowIndex === 0 ? (
                        <button className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                          <Plus className="w-4 h-4" />
                          <span className="text-sm">{t.tabular.addDocuments}</span>
                        </button>
                      ) : (
                        <input
                          className="w-full bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-opacity-20 rounded px-2 py-1"
                        
                        />
                      )}
                    </div>
                    
                    {/* Other columns - Editable cells */}
                    {Array.from({ length: 5 }, (_, colIndex) => (
                      <div key={colIndex} className={`p-3 min-h-[48px] flex items-center ${colIndex < 4 ? 'border-r border-gray-200 dark:border-gray-600' : ''}`}>
                        <input
                          className="w-full bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-opacity-20 rounded px-2 py-1"
                        
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TabularReviewPage;