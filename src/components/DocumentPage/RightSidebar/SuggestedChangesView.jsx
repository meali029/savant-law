import React, { useState, useEffect, useRef } from 'react';
import { DocumentAPI } from '../../../services/documentApi';
import { Globe, AlertTriangle, Loader2, CheckCircle2, XCircle, Clock, Shield, Star } from 'lucide-react';

const SuggestedChangesView = ({ 
  selectedRiskContent = null, 
  contractId = null, 
  documentContent = '', 
  onApplyChange,
  onClearRiskContent,
  // Jurisdiction change props
  jurisdictionAnalysis = null,
  onClearJurisdictionAnalysis
}) => {
  const [riskSuggestions, setRiskSuggestions] = useState([]);
  const [jurisdictionSuggestions, setJurisdictionSuggestions] = useState([]);
  const [appliedSuggestions, setAppliedSuggestions] = useState(new Set());
  const [dismissedSuggestions, setDismissedSuggestions] = useState(new Set());
  const [isLoadingRisk, setIsLoadingRisk] = useState(false);
  const [isLoadingJurisdiction, setIsLoadingJurisdiction] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('risk');
  
  // NEW: Risk categories state
  const [riskCategories, setRiskCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoriesError, setCategoriesError] = useState('');
  
  // Risk analysis streaming state
  const [riskStatus, setRiskStatus] = useState('');
  const [riskProgress, setRiskProgress] = useState(0);
  
  // Jurisdiction analysis state
  const [jurisdictionStatus, setJurisdictionStatus] = useState('');
  const [jurisdictionProgress, setJurisdictionProgress] = useState(0);
  
  // Categories streaming state
  const [categoriesStatus, setCategoriesStatus] = useState('');
  const [categoriesProgress, setCategoriesProgress] = useState(0);
  
  // NEW: Bulk apply state
  const [isApplyingAll, setIsApplyingAll] = useState(false);
  
  const [needsReload, setNeedsReload] = useState(false);
  
  const prevSelectedRiskContent = useRef(selectedRiskContent);
  const prevContractId = useRef(contractId);
  const initialLoadDone = useRef(false);

  const allSuggestions = activeTab === 'risk' ? riskSuggestions : jurisdictionSuggestions;

  const extractTextFromHTML = (html) => {
    if (!html) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  // Helper function to get category badge color
  const getCategoryBadgeColor = (score) => {
    if (score >= 90) return 'bg-red-500 text-white';
    if (score >= 80) return 'bg-orange-500 text-white';
    if (score >= 70) return 'bg-yellow-500 text-white';
    if (score >= 60) return 'bg-blue-500 text-white';
    return 'bg-green-500 text-white';
  };

  // Helper function to get category icon
  const getCategoryIcon = (score) => {
    if (score >= 90) return '🚨';
    if (score >= 80) return '⚠️';
    if (score >= 70) return '⚡';
    if (score >= 60) return '💡';
    return '✅';
  };

  // Handle jurisdiction analysis trigger
  useEffect(() => {
    if (jurisdictionAnalysis) {
      console.log('Starting jurisdiction analysis:', jurisdictionAnalysis);
      setActiveTab('jurisdiction');
      loadJurisdictionAnalysis(jurisdictionAnalysis.regionName, jurisdictionAnalysis.documentContent);
    }
  }, [jurisdictionAnalysis]);

  // Load risk categories and analysis when selectedRiskContent or contractId changes
  useEffect(() => {
    console.log('SuggestedChangesView - Effect triggered');
    console.log('selectedRiskContent:', selectedRiskContent);
    console.log('contractId:', contractId);
    console.log('documentContent length:', documentContent?.length || 0);
    
    const selectedContentChanged = prevSelectedRiskContent.current !== selectedRiskContent;
    const contractIdChanged = prevContractId.current !== contractId;
    
    if (contractId && (selectedContentChanged || contractIdChanged || !initialLoadDone.current)) {
      // Load risk categories first
      loadRiskCategories();
      initialLoadDone.current = true;
    } else {
      console.log('Skipping risk analysis - no meaningful changes detected');
    }
    
    prevSelectedRiskContent.current = selectedRiskContent;
    prevContractId.current = contractId;
    
  }, [selectedRiskContent, contractId]);

  // NEW: Load risk categories
  const loadRiskCategories = async () => {
    console.log('loadRiskCategories called');
    
    if (!contractId) {
      console.error('No contractId provided for risk categories analysis');
      return;
    }

    setIsLoadingCategories(true);
    setCategoriesError('');
    setRiskCategories([]);
    setCategoriesStatus('Starting categories analysis...');
    setCategoriesProgress(0);

    try {
      const content = selectedRiskContent || extractTextFromHTML(documentContent);
      
      console.log('Content to analyze for categories (length):', content.length);
      
      if (!content.trim()) {
        console.warn('No content available for categories analysis');
        setRiskCategories([]);
        setIsLoadingCategories(false);
        return;
      }

      console.log('Calling DocumentAPI.getRiskCategories...');

      await DocumentAPI.getRiskCategories(
        content,
        // onProgress callback
        (progressData) => {
          console.log('Risk categories progress:', progressData);
          
          if (progressData.message) {
            setCategoriesStatus(progressData.message);
          }
          
          if (progressData.type === 'started') {
            setCategoriesStatus(progressData.message || 'Starting categories analysis...');
            setCategoriesProgress(5);
          } else if (progressData.type === 'category' && progressData.category) {
            // Real-time category addition
            console.log('🔥 REAL-TIME: Adding new category:', progressData.category);
            
            setRiskCategories(prev => {
              const existingIndex = prev.findIndex(c => c.id === progressData.category.id);
              
              if (existingIndex === -1) {
                return [progressData.category, ...prev];
              } else {
                const updated = [...prev];
                updated[existingIndex] = progressData.category;
                return updated;
              }
            });
            
            setCategoriesProgress(prev => Math.min(90, prev + 10));
            setCategoriesStatus(`Found category: ${progressData.category.category}`);
          }
        },
        // onComplete callback
        (completeData) => {
          console.log('Risk categories analysis completed:', completeData);
          setCategoriesStatus('Categories analysis completed!');
          setCategoriesProgress(100);
          setIsLoadingCategories(false);
          
          if (completeData.categories && completeData.categories.length > 0) {
            setRiskCategories(completeData.categories);
          }
        },
        // onError callback
        (error) => {
          console.error('Risk categories analysis error:', error);
          setCategoriesError(error.message || 'Failed to analyze risk categories');
          setIsLoadingCategories(false);
          setCategoriesStatus('Categories analysis failed');
          setCategoriesProgress(0);
        }
      );
    } catch (error) {
      console.error('Error loading risk categories:', error);
      setCategoriesError(error.message || 'Failed to load risk categories. Please try again.');
      setRiskCategories([]);
      setIsLoadingCategories(false);
      setCategoriesStatus('Categories analysis failed');
      setCategoriesProgress(0);
    }
  };

  // NEW: Load risks for a specific category
  const loadRisksForCategory = async (category) => {
    console.log('loadRisksForCategory called for:', category.category);
    
    if (!contractId) {
      console.error('No contractId provided for category risk analysis');
      return;
    }

    setSelectedCategory(category);
    setIsLoadingRisk(true);
    setError('');
    setRiskSuggestions([]);
    setRiskStatus('Starting risk analysis...');
    setRiskProgress(0);
    setAppliedSuggestions(new Set());

    try {
      const content = selectedRiskContent || extractTextFromHTML(documentContent);
      
      console.log('Content to analyze (length):', content.length);
      console.log('Category:', category.category);
      console.log('Number of changes:', category.number_of_changes);
      
      if (!content.trim()) {
        console.warn('No content available for analysis');
        setRiskSuggestions([]);
        setIsLoadingRisk(false);
        return;
      }

      console.log('Calling DocumentAPI.getRiskAnalysis with category filter...');

      await DocumentAPI.getRiskAnalysis(
        contractId,
        content,
        // onProgress callback
        (progressData) => {
          console.log('Category risk analysis progress:', progressData);
          
          if (progressData.message) {
            setRiskStatus(progressData.message);
          }
          
          if (progressData.type === 'started') {
            setRiskStatus(progressData.message || 'Starting risk analysis...');
            setRiskProgress(5);
          } else if (progressData.type === 'risk' && progressData.risk) {
            // Real-time risk addition
            console.log('🔥 REAL-TIME: Adding new risk for category:', progressData.risk);
            
            setRiskSuggestions(prev => {
              const existingIndex = prev.findIndex(s => s.id === progressData.risk.id);
              
              if (existingIndex === -1) {
                return [progressData.risk, ...prev];
              } else {
                const updated = [...prev];
                updated[existingIndex] = progressData.risk;
                return updated;
              }
            });
            
            setRiskProgress(prev => Math.min(90, prev + 10));
            setRiskStatus(`Found risk: ${progressData.risk.title || 'New risk detected'}`);
          }
        },
        // onComplete callback
        (completeData) => {
          console.log('Category risk analysis completed:', completeData);
          setRiskStatus('Risk analysis completed successfully!');
          setRiskProgress(100);
          setIsLoadingRisk(false);
          
          if (completeData.risks && completeData.risks.length > 0) {
            setRiskSuggestions(completeData.risks);
          }
        },
        // onError callback
        (error) => {
          console.error('Category risk analysis error:', error);
          setError(error.message || 'Failed to analyze risks for category');
          setIsLoadingRisk(false);
          setRiskStatus('Risk analysis failed');
          setRiskProgress(0);
        },
        // NEW: Pass category and number of changes
        category.category,
        category.number_of_changes
      );
    } catch (error) {
      console.error('Error loading category risks:', error);
      setError(error.message || 'Failed to load category risks. Please try again.');
      setRiskSuggestions([]);
      setIsLoadingRisk(false);
      setRiskStatus('Risk analysis failed');
      setRiskProgress(0);
    }
  };

  // Load jurisdiction analysis with streaming
  const loadJurisdictionAnalysis = async (regionName, content) => {
    console.log('loadJurisdictionAnalysis called');
    
    if (!regionName || !content) {
      console.error('No region name or content provided for jurisdiction analysis');
      return;
    }

    setIsLoadingJurisdiction(true);
    setError('');
    setJurisdictionSuggestions([]);
    setJurisdictionStatus('Starting analysis...');
    setJurisdictionProgress(0);
    setAppliedSuggestions(new Set());

    try {
      const pages = DocumentAPI.convertDocumentToPages(content);
      
      console.log('Starting jurisdiction change analysis...');
      
      await DocumentAPI.analyzeJurisdictionChange(
        regionName,
        pages,
        (progressData) => {
          console.log('Jurisdiction analysis progress:', progressData);
          
          if (progressData.message) {
            setJurisdictionStatus(progressData.message);
          }
          
          if (progressData.type === 'started') {
            setJurisdictionStatus(progressData.message || 'Analysis started...');
            setJurisdictionProgress(5);
          } else if (progressData.type === 'processing_page') {
            setJurisdictionStatus(progressData.message || `Processing page ${progressData.page_number}...`);
            setJurisdictionProgress(10);
          } else if (progressData.type === 'change' && progressData.change) {
            console.log('🔥 REAL-TIME: Adding new jurisdiction change:', progressData.change);
            
            setJurisdictionSuggestions(prev => {
              const existingIndex = prev.findIndex(s => s.id === progressData.change.id);
              
              if (existingIndex === -1) {
                return [progressData.change, ...prev];
              } else {
                const updated = [...prev];
                updated[existingIndex] = progressData.change;
                return updated;
              }
            });
            
            setJurisdictionProgress(prev => Math.min(85, prev + 15));
            setJurisdictionStatus(`Found change: ${progressData.change.section || 'Update required'}`);
          } else if (progressData.type === 'page_completed') {
            setJurisdictionStatus(progressData.message || `Completed page ${progressData.page_number}`);
            setJurisdictionProgress(prev => Math.min(90, prev + 10));
          }
        },
        (completeData) => {
          console.log('Jurisdiction analysis completed:', completeData);
          setJurisdictionStatus('Analysis completed successfully!');
          setJurisdictionProgress(100);
          setIsLoadingJurisdiction(false);
          
          if (completeData.changes && completeData.changes.length > 0) {
            setJurisdictionSuggestions(completeData.changes);
          }
        },
        (error) => {
          console.error('Jurisdiction analysis error:', error);
          setError(error.message || 'Failed to analyze jurisdiction changes');
          setIsLoadingJurisdiction(false);
          setJurisdictionStatus('Analysis failed');
          setJurisdictionProgress(0);
        }
      );
    } catch (error) {
      console.error('Error starting jurisdiction analysis:', error);
      setError(error.message || 'Failed to start jurisdiction analysis');
      setJurisdictionSuggestions([]);
      setIsLoadingJurisdiction(false);
      setJurisdictionStatus('Analysis failed');
      setJurisdictionProgress(0);
    }
  };

  // Reload when all changes are applied
  useEffect(() => {
    if (needsReload && allSuggestions.length > 0 && appliedSuggestions.size === allSuggestions.length) {
      console.log('All suggestions applied, reloading analysis...');
      if (activeTab === 'risk' && selectedCategory) {
        loadRisksForCategory(selectedCategory);
      }
      setNeedsReload(false);
    }
  }, [appliedSuggestions.size, allSuggestions.length, needsReload, activeTab, selectedCategory]);

  const handleApply = (suggestionId) => {
    const suggestion = allSuggestions.find(s => s.id === suggestionId);
    if (suggestion && onApplyChange) {
      const success = onApplyChange(suggestion.original, suggestion.suggested);
      
      if (success !== false) {
        const newAppliedSuggestions = new Set([...appliedSuggestions, suggestionId]);
        setAppliedSuggestions(newAppliedSuggestions);
        
        if (newAppliedSuggestions.size === allSuggestions.length) {
          console.log('All suggestions applied, marking for reload...');
          setNeedsReload(true);
        }
        
        console.log('Applied suggestion:', suggestionId);
      } else {
        console.warn('Failed to apply suggestion:', suggestionId);
      }
    } else {
      const newAppliedSuggestions = new Set([...appliedSuggestions, suggestionId]);
      setAppliedSuggestions(newAppliedSuggestions);
      
      if (newAppliedSuggestions.size === allSuggestions.length) {
        console.log('All suggestions applied, marking for reload...');
        setNeedsReload(true);
      }
      
      console.log('Applied suggestion (no callback):', suggestionId);
    }
  };

  const handleDismiss = (suggestionId) => {
    console.log('Dismissed suggestion:', suggestionId);
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
  };

  // NEW: Handle Apply All functionality
  const handleApplyAll = async () => {
    if (!visibleSuggestions.length || isApplyingAll) return;
    
    setIsApplyingAll(true);
    
    try {
      console.log('🚀 Applying all suggestions:', visibleSuggestions.length);
      
      // Apply each suggestion that hasn't been applied yet
      for (const suggestion of visibleSuggestions) {
        if (!appliedSuggestions.has(suggestion.id)) {
          console.log(`Applying suggestion ${suggestion.id}...`);
          
          if (onApplyChange) {
            // Determine the original and suggested text based on the suggestion type
            let original, suggested;
            
            if (activeTab === 'risk' && suggestion.context) {
              // For risk analysis, use context and apply changes
              original = suggestion.context;
              if (suggestion.changes && suggestion.changes.length > 0) {
                suggested = suggestion.changes.reduce((text, change) => {
                  return text.replace(change.from, change.to);
                }, suggestion.context);
              } else {
                suggested = suggestion.context; // No changes to apply
              }
            } else {
              // For jurisdiction or other types, use original/suggested directly
              original = suggestion.original;
              suggested = suggestion.suggested;
            }
            
            const success = onApplyChange(original, suggested);
            
            if (success !== false) {
              // Mark as applied
              setAppliedSuggestions(prev => new Set([...prev, suggestion.id]));
              console.log(`✅ Successfully applied suggestion ${suggestion.id}`);
              
              // Add a small delay between applications to avoid overwhelming the UI
              await new Promise(resolve => setTimeout(resolve, 100));
            } else {
              console.warn(`❌ Failed to apply suggestion ${suggestion.id}`);
            }
          } else {
            // No callback, just mark as applied for UI consistency
            setAppliedSuggestions(prev => new Set([...prev, suggestion.id]));
          }
        }
      }
      
      console.log('✅ Finished applying all suggestions');
      
      // If all suggestions are now applied, trigger reload
      const totalApplied = appliedSuggestions.size + visibleSuggestions.filter(s => !appliedSuggestions.has(s.id)).length;
      if (totalApplied === allSuggestions.length) {
        setNeedsReload(true);
      }
      
    } catch (error) {
      console.error('Error applying all suggestions:', error);
    } finally {
      setIsApplyingAll(false);
    }
  };

  // NEW: Handle Dismiss All functionality
  const handleDismissAll = () => {
    const suggestionsToExclude = visibleSuggestions
      .filter(s => !appliedSuggestions.has(s.id))
      .map(s => s.id);
    
    if (suggestionsToExclude.length > 0) {
      setDismissedSuggestions(prev => {
        const newSet = new Set(prev);
        suggestionsToExclude.forEach(id => newSet.add(id));
        return newSet;
      });
      
      console.log('Dismissed all remaining suggestions:', suggestionsToExclude.length);
    }
  };

  const handleClearRiskContent = () => {
    if (onClearRiskContent) {
      onClearRiskContent();
    }
  };

  const handleClearJurisdictionAnalysis = () => {
    if (onClearJurisdictionAnalysis) {
      onClearJurisdictionAnalysis();
    }
    setJurisdictionSuggestions([]);
    setJurisdictionStatus('');
    setJurisdictionProgress(0);
  };

  const handleManualReload = () => {
    console.log('Manual reload triggered');
    if (activeTab === 'risk') {
      if (selectedCategory) {
        loadRisksForCategory(selectedCategory);
      } else {
        loadRiskCategories();
      }
    }
  };

  // NEW: Function to render change highlights with proper styling
  const renderChangeHighlight = (original, changes) => {
    if (!changes || changes.length === 0) {
      return <span>{original}</span>;
    }

    let processedText = original;
    const elements = [];
    let lastIndex = 0;

    // Sort changes by position to handle them in order
    const sortedChanges = changes.sort((a, b) => {
      const aIndex = original.indexOf(a.from);
      const bIndex = original.indexOf(b.from);
      return aIndex - bIndex;
    });

    sortedChanges.forEach((change, index) => {
      const fromIndex = original.indexOf(change.from, lastIndex);
      
      if (fromIndex !== -1) {
        // Add text before the change
        if (fromIndex > lastIndex) {
          elements.push(
            <span key={`before-${index}`}>
              {original.substring(lastIndex, fromIndex)}
            </span>
          );
        }

        // Add the "from" text with strikethrough and red background
        elements.push(
          <span 
            key={`from-${index}`}
            className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 line-through px-1 rounded"
            title={`Remove: ${change.from}`}
          >
            {change.from}
          </span>
        );

        // Add the "to" text with green background
        elements.push(
          <span 
            key={`to-${index}`}
            className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-1 rounded ml-1"
            title={`Replace with: ${change.to}`}
          >
            {change.to}
          </span>
        );

        lastIndex = fromIndex + change.from.length;
      }
    });

    // Add remaining text
    if (lastIndex < original.length) {
      elements.push(
        <span key="after">
          {original.substring(lastIndex)}
        </span>
      );
    }

    return <span>{elements}</span>;
  };

  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRiskLevelIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return '💡';
      default: return '📝';
    }
  };

  // Filter out dismissed suggestions
  const visibleSuggestions = allSuggestions.filter(s => !dismissedSuggestions.has(s.id));

  // Count suggestions by type
  const riskCount = riskSuggestions.filter(s => !dismissedSuggestions.has(s.id)).length;
  const jurisdictionCount = jurisdictionSuggestions.filter(s => !dismissedSuggestions.has(s.id)).length;

  // NEW: Count suggestions that can be applied
  const unappliedSuggestions = visibleSuggestions.filter(s => !appliedSuggestions.has(s.id));
  const canShowBulkActions = unappliedSuggestions.length > 0;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      {/* Header with tabs */}
      <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-4">
          <button
            onClick={() => {
              setActiveTab('risk');
              setSelectedCategory(null);
              setRiskSuggestions([]);
            }}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex-1 ${
              activeTab === 'risk'
                ? 'bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Risk Analysis</span>
            {riskCount > 0 && (
              <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full text-xs">
                {riskCount}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('jurisdiction')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex-1 ${
              activeTab === 'jurisdiction'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Jurisdiction</span>
            {jurisdictionCount > 0 && (
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs">
                {jurisdictionCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-purple-800 dark:text-purple-300 text-base">
            {activeTab === 'risk' 
              ? selectedCategory 
                ? `${selectedCategory.category} Risks`
                : 'Risk Categories'
              : 'Jurisdiction Changes'
            }
          </h3>
          <button
            onClick={handleManualReload}
            disabled={activeTab === 'risk' ? (isLoadingRisk || isLoadingCategories) : isLoadingJurisdiction}
            className="px-3 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50"
            title="Refresh analysis"
          >
            {(activeTab === 'risk' ? (isLoadingRisk || isLoadingCategories) : isLoadingJurisdiction) ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1 text-purple-600 dark:text-purple-400">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>
              {activeTab === 'risk' 
                ? selectedCategory 
                  ? `${visibleSuggestions.length} risks found`
                  : `${riskCategories.length} categories found`
                : `${visibleSuggestions.length} changes found`
              }
            </span>
          </div>
          <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>{appliedSuggestions.size} applied</span>
          </div>
        </div>

        {/* NEW: Bulk Actions for Risk Analysis and Jurisdiction */}
        {canShowBulkActions && !isLoadingRisk && !isLoadingJurisdiction && selectedCategory && (
          <div className="flex space-x-2 mt-4">
            <button
              onClick={handleApplyAll}
              disabled={isApplyingAll}
              className="flex-1 px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-purple-300 disabled:to-purple-400 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:shadow-sm"
            >
              {isApplyingAll ? (
                <>
                  <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                  Applying {unappliedSuggestions.length} changes...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 inline mr-2" />
                  Apply All ({unappliedSuggestions.length})
                </>
              )}
            </button>
            <button
              onClick={handleDismissAll}
              disabled={isApplyingAll}
              className="flex-1 px-4 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 font-medium disabled:opacity-50"
            >
              <XCircle className="w-4 h-4 inline mr-2" />
              Dismiss All
            </button>
          </div>
        )}
        
        {/* Selected content indicator for risk analysis */}
        {activeTab === 'risk' && selectedRiskContent && (
          <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Analyzing Selected Text</span>
                </div>
                <p className="text-sm text-orange-800 dark:text-orange-200 line-clamp-2">
                  "{selectedRiskContent}"
                </p>
              </div>
              <button
                onClick={handleClearRiskContent}
                className="ml-2 p-1 text-orange-500 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 rounded transition-colors"
                title="Analyze full document instead"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Jurisdiction analysis indicator */}
        {activeTab === 'jurisdiction' && jurisdictionAnalysis && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    Analyzing for {jurisdictionAnalysis.regionName}
                  </span>
                </div>
                {jurisdictionStatus && (
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {jurisdictionStatus}
                  </p>
                )}
                {isLoadingJurisdiction && jurisdictionProgress > 0 && (
                  <div className="mt-2 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                    <div 
                      className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${jurisdictionProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
              <button
                onClick={handleClearJurisdictionAnalysis}
                className="ml-2 p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded transition-colors"
                title="Clear jurisdiction analysis"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4">
        {/* Error State */}
        {(error || categoriesError) && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-red-800 dark:text-red-200 font-medium">Error</span>
            </div>
            <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error || categoriesError}</p>
            <button 
              onClick={handleManualReload}
              className="mt-2 px-3 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded text-sm hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* NEW: Risk Categories as Tabs */}
        {activeTab === 'risk' && (
          <>
            {/* Loading State for Categories */}
            {isLoadingCategories && riskCategories.length === 0 && (
              <div className="text-center py-12">
                <div className="w-8 h-8 mx-auto mb-4 border-4 border-purple-200 dark:border-purple-800 border-t-purple-500 dark:border-t-purple-400 rounded-full animate-spin"></div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Analyzing Risk Categories...
                </h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  AI is categorizing potential risks in your document
                </p>
                {categoriesStatus && (
                  <p className="text-purple-600 dark:text-purple-400 text-sm mt-2">
                    {categoriesStatus}
                  </p>
                )}
              </div>
            )}

            {/* Real-time Categories Progress Banner */}
            {isLoadingCategories && riskCategories.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="flex-1">
                    <span className="text-blue-800 dark:text-blue-200 font-medium text-sm">
                      {categoriesStatus || 'Discovering more categories...'}
                    </span>
                    <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                      🔄 Categories appear in real-time as they're discovered
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Risk Categories Tabs */}
            {riskCategories.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Risk Categories ({riskCategories.length})
                </h4>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {riskCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => loadRisksForCategory(category)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${
                        selectedCategory?.id === category.id
                          ? 'bg-red-500 text-white border-red-500 shadow-lg'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        category.score >= 90 ? 'bg-red-500' :
                        category.score >= 80 ? 'bg-orange-500' :
                        category.score >= 70 ? 'bg-yellow-500' :
                        category.score >= 60 ? 'bg-blue-500' : 'bg-green-500'
                      } ${selectedCategory?.id === category.id ? 'bg-white' : ''}`}></div>
                      <span className="capitalize">{category.category}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        selectedCategory?.id === category.id 
                          ? 'bg-white/20 text-white' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {category.number_of_changes}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State for Categories */}
            {!isLoadingCategories && !categoriesError && riskCategories.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center">
                  <Shield className="w-10 h-10 text-purple-400 dark:text-purple-500" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {!contractId 
                    ? 'No Document Available' 
                    : 'No Risk Categories Found'
                  }
                </h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                  {!contractId 
                    ? 'Generate a document first to analyze and get suggestions'
                    : selectedRiskContent 
                      ? 'No risk categories detected in the selected text'
                      : 'Your document appears to be well-structured with minimal categorizable risks'
                  }
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {!contractId 
                    ? 'Analysis requires an active document'
                    : 'Select text to analyze specific sections or make edits to get suggestions'
                  }
                </p>
              </div>
            )}
          </>
        )}

        {/* Risk Category Details View */}
        {activeTab === 'risk' && selectedCategory && (
          <>
            {/* Category Header */}
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${getCategoryBadgeColor(selectedCategory.score)}`}>
                    {getCategoryIcon(selectedCategory.score)} {selectedCategory.score_header}
                  </div>
                </div>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  Score: {selectedCategory.score}/100
                </span>
              </div>
              <h3 className="text-xl font-semibold text-red-800 dark:text-red-300 capitalize mb-1">
                {selectedCategory.category} Risks
              </h3>
              <p className="text-red-700 dark:text-red-300 text-sm">
                Expected {selectedCategory.number_of_changes} risk{selectedCategory.number_of_changes !== 1 ? 's' : ''} in this category
              </p>
              {isLoadingRisk && riskStatus && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                  {riskStatus}
                </p>
              )}
            </div>

            {/* Loading State for Category Risks */}
            {isLoadingRisk && visibleSuggestions.length === 0 && (
              <div className="text-center py-12">
                <div className="w-8 h-8 mx-auto mb-4 border-4 border-red-200 dark:border-red-800 border-t-red-500 dark:border-t-red-400 rounded-full animate-spin"></div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Analyzing {selectedCategory.category} Risks...
                </h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  AI is finding specific risks in the {selectedCategory.category} category
                </p>
                {riskStatus && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                    {riskStatus}
                  </p>
                )}
              </div>
            )}

            {/* Real-time Risk Analysis Progress Banner */}
            {isLoadingRisk && visibleSuggestions.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="flex-1">
                    <span className="text-blue-800 dark:text-blue-200 font-medium text-sm">
                      {riskStatus || 'Discovering more risks...'}
                    </span>
                    <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                      🔄 Risks appear in real-time as they're discovered
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Loading State for Jurisdiction */}
        {activeTab === 'jurisdiction' && isLoadingJurisdiction && visibleSuggestions.length === 0 && (
          <div className="text-center py-12">
            <div className="w-8 h-8 mx-auto mb-4 border-4 border-blue-200 dark:border-blue-800 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin"></div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Analyzing Jurisdiction Changes...
            </h4>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              AI is adapting your document to the selected jurisdiction
            </p>
            {jurisdictionStatus && (
              <p className="text-blue-600 dark:text-blue-400 text-sm mt-2">
                {jurisdictionStatus}
              </p>
            )}
          </div>
        )}

        {/* Real-time Analysis Progress Banner for Jurisdiction */}
        {activeTab === 'jurisdiction' && isLoadingJurisdiction && visibleSuggestions.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="flex-1">
                <span className="text-blue-800 dark:text-blue-200 font-medium text-sm">
                  {jurisdictionStatus || 'Discovering more changes...'}
                </span>
                <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                  🔄 Changes appear in real-time as they're discovered
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Suggestions List with Real-time Updates - Only show when we have a selected category or jurisdiction analysis */}
        {((activeTab === 'risk' && selectedCategory) || activeTab === 'jurisdiction') && visibleSuggestions.length > 0 && (
          <div className="space-y-6">
            {visibleSuggestions.map((suggestion, index) => {
              const isApplied = appliedSuggestions.has(suggestion.id);
              const isNewlyDiscovered = (activeTab === 'risk' ? isLoadingRisk : isLoadingJurisdiction) && index < 3;
              
              return (
                <div 
                  key={suggestion.id}
                  className={`relative overflow-hidden rounded-xl transition-all duration-300 ${
                    isApplied 
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800' 
                      : isNewlyDiscovered
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-300 dark:border-blue-600'
                      : 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3 flex-1">
                        {/* Risk Level Badge for Risk Analysis */}
                        {activeTab === 'risk' && suggestion.risk_level && (
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskLevelColor(suggestion.risk_level)}`}>
                            {getRiskLevelIcon(suggestion.risk_level)} {suggestion.risk_level.toUpperCase()}
                          </div>
                        )}
                        
                        {/* Index Badge for other types */}
                        {(!suggestion.risk_level || activeTab !== 'risk') && (
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold border-2 ${
                            isApplied 
                              ? 'bg-green-500 text-white border-green-500' 
                              : isNewlyDiscovered
                              ? 'bg-blue-500 text-white border-blue-500'
                              : activeTab === 'risk'
                              ? 'bg-red-500 text-white border-red-500'
                              : 'bg-blue-500 text-white border-blue-500'
                          }`}>
                            {index + 1}
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base mb-1">
                                {suggestion.title || suggestion.section || `Change ${index + 1}`}
                              </h4>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                                  {suggestion.impact || suggestion.header || suggestion.category}
                                </span>
                                {suggestion.category && activeTab === 'risk' && (
                                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                                    {suggestion.category}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isApplied && (
                              <div className="flex items-center space-x-2 ml-4">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                <span className="text-sm text-green-600 dark:text-green-400 font-bold">
                                  Applied
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {!isApplied && (
                      <>
                        {/* Context Section for Risk Analysis */}
                        {activeTab === 'risk' && suggestion.context && (
                          <div className="mb-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-semibold uppercase tracking-wide">
                              Current Text:
                            </p>
                            <div className="bg-gray-50 dark:bg-gray-700 border-l-4 border-gray-400 dark:border-gray-600 p-4 text-sm text-gray-700 dark:text-gray-300 rounded-r-lg">
                              {suggestion.changes && suggestion.changes.length > 0 ? (
                                renderChangeHighlight(suggestion.context, suggestion.changes)
                              ) : (
                                suggestion.context
                              )}
                            </div>
                          </div>
                        )}

                        {/* Original/Suggested for other types */}
                        {(!suggestion.context || activeTab !== 'risk') && (
                          <>
                            <div className="mb-4">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-semibold uppercase tracking-wide">
                                Original:
                              </p>
                              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-600 p-4 text-sm text-gray-700 dark:text-gray-300 rounded-r-lg">
                                {suggestion.original}
                              </div>
                            </div>
                            
                            <div className="mb-4">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-semibold uppercase tracking-wide">
                                Suggested:
                              </p>
                              <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 dark:border-green-600 p-4 text-sm text-gray-700 dark:text-gray-300 rounded-r-lg">
                                {suggestion.suggested}
                              </div>
                            </div>
                          </>
                        )}

                        {/* Reason Section */}
                        {suggestion.reason && (
                          <div className="mb-5 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-start space-x-2">
                              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                                <span className="text-white text-xs font-bold">?</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-1 uppercase tracking-wide">
                                  Why this change?
                                </p>
                                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                                  {suggestion.reason}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex space-x-3">
                          <button 
                            onClick={() => handleDismiss(suggestion.id)}
                            className="flex-1 px-4 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 font-medium"
                          >
                            <XCircle className="w-4 h-4 inline mr-1" />
                            Dismiss
                          </button>
                          <button 
                            onClick={() => handleApply(suggestion.id)}
                            className="flex-1 px-4 py-2 text-sm bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            <CheckCircle2 className="w-4 h-4 inline mr-1" />
                            Apply Change
                          </button>
                        </div>
                      </>
                    )}
                    
                    {isApplied && (
                      <div className="text-sm text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-800/30 p-4 rounded-lg border border-green-200 dark:border-green-700">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="font-medium">This change has been successfully applied to your document.</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Empty State for Category Risks */}
        {activeTab === 'risk' && selectedCategory && !isLoadingRisk && !error && visibleSuggestions.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center">
              <Shield className="w-10 h-10 text-red-400 dark:text-red-500" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Risks Found in {selectedCategory.category}
            </h4>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
              No specific risks were detected in the {selectedCategory.category} category for the analyzed content.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              This category may have been resolved or the content doesn't contain applicable risks
            </p>
          </div>
        )}

        {/* Empty State for Jurisdiction */}
        {activeTab === 'jurisdiction' && !isLoadingJurisdiction && !error && visibleSuggestions.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center">
              <Globe className="w-10 h-10 text-blue-400 dark:text-blue-500" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {!contractId 
                ? 'No Document Available' 
                : 'No Jurisdiction Changes Needed'
              }
            </h4>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
              {!contractId 
                ? 'Generate a document first to analyze and get suggestions'
                : 'Your document is already compliant with the selected jurisdiction'
              }
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {!contractId 
                ? 'Analysis requires an active document'
                : 'Select a different region to check for jurisdiction-specific changes'
              }
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
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default SuggestedChangesView;