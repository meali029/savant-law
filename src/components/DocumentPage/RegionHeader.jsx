import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Link2, UserPlus, Download, Pen, Loader2 } from 'lucide-react';
import { InviteModal } from './InviteModal';
import ActiveUsersDisplay from './ActiveUsersDisplay';
import { useRouter } from 'next/navigation';


const RegionHeader = ({ 
  selectedRegion, 
  onRegionChange, 
  currentContractId, 
  activeUsers = [], 
  connectionStatus = 'disconnected', 
  isConnecting = false,
  // Document action props
  documentContent = '',
  isGenerating = false,
  onDownload = null
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const dropdownRef = useRef(null);
  const router = useRouter();

  // Available regions with their flags
  const regions = [
    { 
      id: 'us-california', 
      name: 'United States - California', 
      flag: '🇺🇸',
      country: 'United States',
      state: 'California'
    },
    { 
      id: 'us-newyork', 
      name: 'United States - New York', 
      flag: '🇺🇸',
      country: 'United States',
      state: 'New York'
    },
    { 
      id: 'us-texas', 
      name: 'United States - Texas', 
      flag: '🇺🇸',
      country: 'United States',
      state: 'Texas'
    },
    { 
      id: 'us-florida', 
      name: 'United States - Florida', 
      flag: '🇺🇸',
      country: 'United States',
      state: 'Florida'
    },
    { 
      id: 'us-illinois', 
      name: 'United States - Illinois', 
      flag: '🇺🇸',
      country: 'United States',
      state: 'Illinois'
    },
    { 
      id: 'uk', 
      name: 'United Kingdom', 
      flag: '🇬🇧',
      country: 'United Kingdom',
      state: null
    },
    { 
      id: 'canada', 
      name: 'Canada', 
      flag: '🇨🇦',
      country: 'Canada',
      state: null
    },
    { 
      id: 'australia', 
      name: 'Australia', 
      flag: '🇦🇺',
      country: 'Australia',
      state: null
    }
  ];

  // Default to first region if none selected
  const currentRegion = regions.find(r => r.id === selectedRegion) || regions[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleRegionSelect = (regionId) => {
    onRegionChange(regionId);
    setIsDropdownOpen(false);
  };

  // Enhanced download function using DocumentAPI
  const handleDownload = async () => {
    if (!currentContractId || !documentContent || isGenerating) return;

    setIsDownloading(true);
    setDownloadError(null);

    try {
      // Import DocumentAPI dynamically
      const { DocumentAPI } = await import('../../services/documentApi');
      
      const result = await DocumentAPI.exportDocument(currentContractId, 'Document');
      
      if (result.success) {
        // Call the original onDownload callback if provided
        if (onDownload) {
          onDownload();
        }
      }

    } catch (error) {
      console.error('Download error:', error);
      setDownloadError(error.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const hasContent = documentContent && documentContent.trim().length > 0;

  return (
    <>
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-8 py-2">
          <div className="flex items-center justify-between">
            {/* Left side - Legal Jurisdiction, Active Users, and Invite */}
            <div className="flex items-center space-x-6">
              {/* Legal Jurisdiction */}
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Legal Jurisdiction:
                </div>
                
                {/* Region Selector */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 px-3 py-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer min-w-[280px]"
                  >
                    <span className="text-xl" role="img" aria-label={currentRegion.country}>
                      {currentRegion.flag}
                    </span>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {currentRegion.name}
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                      {regions.map((region) => (
                        <button
                          key={region.id}
                          onClick={() => handleRegionSelect(region.id)}
                          className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                        >
                          <span className="text-2xl" role="img" aria-label={region.country}>
                            {region.flag}
                          </span>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {region.name}
                            </div>
                          </div>
                          {currentRegion.id === region.id && (
                            <Check className="w-4 h-4 text-blue-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Active Users Display */}
              <ActiveUsersDisplay
                activeUsers={activeUsers}
                connectionStatus={connectionStatus}
                isConnecting={isConnecting}
              />

              {/* Invite Button */}
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Invite
              </button>
            </div>

            {/* Right side - Action buttons */}
            <div className="flex items-center space-x-2">
              {/* <button className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                Publish
              </button> */}

              {/* Download Button */}
              <button
                onClick={handleDownload}
                disabled={!hasContent || isGenerating || !currentContractId || isDownloading}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  hasContent && !isGenerating && currentContractId && !isDownloading
                    ? 'bg-slate-700 hover:bg-slate-800 text-white shadow-md hover:shadow-lg border border-slate-600'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-600'
                }`}
                title={
                  !hasContent 
                    ? 'No content to download' 
                    : isGenerating 
                    ? 'Cannot download while generating' 
                    : !currentContractId 
                    ? 'Document ID required for download' 
                    : isDownloading 
                    ? 'Download in progress...' 
                    : 'Download document'
                }
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
              </button>

              {/* Proceed to Signing Button */}
              <button
                onClick={() => router.push(`/signature/${currentContractId}`)}
                disabled={!hasContent || isGenerating || !currentContractId}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  hasContent && !isGenerating && currentContractId
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg border border-indigo-500'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-600'
                }`}
                title={
                  !hasContent 
                    ? 'No content to sign' 
                    : isGenerating 
                    ? 'Cannot sign while generating' 
                    : !currentContractId 
                    ? 'Document ID required for signing' 
                    : 'Proceed to signing page'
                }
              >
                <Pen className="w-4 h-4" />
                <span>Proceed to Signing</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <InviteModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
        currentContractId={currentContractId}
      />
    </>
  );
};

export default RegionHeader;