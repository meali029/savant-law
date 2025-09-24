// pages/index.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Plus, X, Search, Loader, ArrowLeft, FileText } from 'lucide-react'
import Header from '../../components/Header/Header'
import { useLanguage } from '../../context/LanguageContext' // Import your custom hook

// Mock document data
const documentData = [
  // Group 1: Voting Agreement versions
  { id: '1', title: 'voting_agreement', date: 'Feb 18, 2025', status: 'Draft', type: 'contract', version: 'v3', group: 'voting_agreement' },
  { id: '2', title: 'voting_agreement', date: 'Feb 10, 2025', status: 'Draft', type: 'contract', version: 'v2', group: 'voting_agreement' },
  { id: '3', title: 'voting_agreement', date: 'Feb 5, 2025', status: 'Draft', type: 'contract', version: 'v1', group: 'voting_agreement' },

  // Group 2: Founder Agreement versions
  { id: '4', title: 'founder_agreement', date: 'Feb 15, 2025', status: 'Draft', type: 'contract', version: 'v5', group: 'founder_agreement' },
  { id: '5', title: 'founder_agreement', date: 'Feb 13, 2025', status: 'Draft', type: 'contract', version: 'v4', group: 'founder_agreement' },
  { id: '6', title: 'founder_agreement', date: 'Jan 28, 2025', status: 'Draft', type: 'contract', version: 'v3', group: 'founder_agreement' },
  { id: '7', title: 'founder_agreement', date: 'Jan 26, 2025', status: 'Draft', type: 'contract', version: 'v2', group: 'founder_agreement' },
  { id: '8', title: 'founder_agreement', date: 'Jan 24, 2025', status: 'Draft', type: 'contract', version: 'v1', group: 'founder_agreement' },

  // Other documents
  { id: '9', title: 'management_rights_letter', date: 'Feb 8, 2025', status: 'Draft', type: 'letter', version: 'v1', group: 'management_rights' },
];

// Mock changes data for demos
const mockChanges = {
  voting_agreement: {
    v1_v2: [
      {
        section: "Voting Rights",
        before: "Each shareholder gets one vote per share owned.",
        after: "Each shareholder gets one vote per share owned, with Class A shares having 10x voting power.",
        impact: "This significantly increases the voting power of Class A shareholders, potentially reducing your influence if you don't hold Class A shares."
      },
      {
        section: "Board Representation",
        before: "The board consists of 5 members elected by shareholders.",
        after: "The board consists of 7 members, with 3 appointed by the majority Class A holder.",
        impact: "This gives more control to the Class A majority holder and reduces your ability to influence board composition."
      }
    ],
    v2_v3: [
      {
        section: "Transfer Restrictions",
        before: "Shares may be transferred after a 1-year holding period.",
        after: "Shares may be transferred after a 2-year holding period, subject to right of first refusal.",
        impact: "This extends your lock-up period and gives the company or other shareholders priority to buy your shares if you decide to sell."
      },
      {
        section: "Drag-Along Rights",
        before: "75% of shareholders must approve to force a sale.",
        after: "60% of shareholders can force a sale, with Class A shares counting as 1.5x votes.",
        impact: "This makes it easier for majority shareholders to force a company sale even if you disagree."
      }
    ]
  },
  founder_agreement: {
    v1_v2: [
      {
        section: "Intellectual Property Assignment",
        before: "Founders assign IP created during employment.",
        after: "Founders assign all IP created during employment and 12 months after departure.",
        impact: "This extends your IP obligations beyond your employment period, potentially limiting your ability to work on similar projects after leaving."
      },
      {
        section: "Non-Compete",
        before: "6-month non-compete within the same industry.",
        after: "12-month non-compete within the same or adjacent industries.",
        impact: "This restricts your ability to work in related fields for a longer period after leaving the company."
      }
    ],
    v2_v3: [
      {
        section: "Vesting Schedule",
        before: "4-year vesting with 1-year cliff.",
        after: "4-year vesting with 1-year cliff and acceleration on change of control.",
        impact: "This benefits you by allowing your shares to vest immediately if the company is acquired."
      }
    ],
    v3_v4: [
      {
        section: "Dispute Resolution",
        before: "Disputes resolved through litigation in Delaware courts.",
        after: "Disputes resolved through binding arbitration in San Francisco.",
        impact: "This changes how conflicts are handled and may affect costs and outcomes of potential disputes."
      }
    ],
    v4_v5: [
      {
        section: "Termination Clauses",
        before: "Company can terminate with 30 days notice.",
        after: "Company can terminate with 30 days notice, but must provide 3 months severance for termination without cause.",
        impact: "This provides you with more financial protection if terminated without cause."
      }
    ]
  }
};

export default function Documents() {
  const { t } = useLanguage(); // Use the custom hook

  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [analyzeQuery, setAnalyzeQuery] = useState('');
  const [userRole, setUserRole] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [viewMode, setViewMode] = useState('all');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingPhase, setLoadingPhase] = useState(0);

  // Loading messages for each phase - now using translations
  const loadingMessages = [
    t.documentsPage.loadingMessages["0"],
    t.documentsPage.loadingMessages["1"],
    t.documentsPage.loadingMessages["2"],
    t.documentsPage.loadingMessages["3"]
  ];

  // Helper function to get document name translation
  const getDocumentDisplayName = (title) => {
    const nameMap = {
      'voting_agreement': t.documentsPage.documentNames.votingAgreement,
      'founder_agreement': t.documentsPage.documentNames.founderAgreement,
      'management_rights_letter': t.documentsPage.documentNames.managementRightsLetter
    };
    return nameMap[title] || title;
  };

  // Helper function to get section name translation
  const getSectionDisplayName = (section) => {
    const sectionMap = {
      'Voting Rights': t.documentsPage.sections.votingRights,
      'Board Representation': t.documentsPage.sections.boardRepresentation,
      'Transfer Restrictions': t.documentsPage.sections.transferRestrictions,
      'Drag-Along Rights': t.documentsPage.sections.dragAlongRights,
      'Intellectual Property Assignment': t.documentsPage.sections.intellectualPropertyAssignment,
      'Non-Compete': t.documentsPage.sections.nonCompete,
      'Vesting Schedule': t.documentsPage.sections.vestingSchedule,
      'Dispute Resolution': t.documentsPage.sections.disputeResolution,
      'Termination Clauses': t.documentsPage.sections.terminationClauses
    };
    return sectionMap[section] || section;
  };

  // Toggle document selection
  const toggleDocumentSelection = (doc) => {
    if (selectedDocuments.some(d => d.id === doc.id)) {
      setSelectedDocuments(selectedDocuments.filter(d => d.id !== doc.id));
    } else {
      setSelectedDocuments([...selectedDocuments, doc]);
    }
  };

  // Progress bar animation for analysis
  useEffect(() => {
    let interval;

    if (isAnalyzing) {
      interval = setInterval(() => {
        setLoadingProgress(prev => {
          const newValue = prev + 1;

          // Update loading phase based on progress
          const newPhase = Math.floor(newValue / 25);
          if (newPhase !== loadingPhase && newPhase < 4) {
            setLoadingPhase(newPhase);
          }

          if (newValue >= 100) {
            clearInterval(interval);
            return 100;
          }
          return newValue;
        });
      }, 30);
    } else {
      setLoadingProgress(0);
      setLoadingPhase(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAnalyzing, loadingPhase]);

  // Handle analysis submission with loading animation
  const handleAnalyzeSubmit = () => {
    // Check if we have documents from the same group
    const groups = selectedDocuments.map(doc => doc.group);
    const uniqueGroups = Array.from(new Set(groups));

    if (uniqueGroups.length !== 1) {
      alert(t.documentsPage.analyseModal.validationError);
      return;
    }

    // Set loading state
    setIsAnalyzing(true);

    // Simulate API call
    setTimeout(() => {
      const group = uniqueGroups[0];

      // Sort documents by version
      const sortedDocs = [...selectedDocuments].sort((a, b) => {
        const versionA = parseInt(a.version?.replace('v', '') || '0');
        const versionB = parseInt(b.version?.replace('v', '') || '0');
        return versionA - versionB;
      });

      // Generate analysis results
      let results = [];

      // For each consecutive pair of documents, get mock diff data
      for (let i = 0; i < sortedDocs.length - 1; i++) {
        const currVersion = sortedDocs[i].version?.replace('v', '');
        const nextVersion = sortedDocs[i+1].version?.replace('v', '');

        const key = `v${currVersion}_v${nextVersion}`;

        if (group && mockChanges[group] && mockChanges[group][key]) {
          results.push({
            fromVersion: sortedDocs[i].version,
            toVersion: sortedDocs[i + 1].version,
            changes: mockChanges[group][key]
          });
        }
      }

      setAnalysisResults({
        documentTitle: getDocumentDisplayName(sortedDocs[0].title),
        versions: sortedDocs.map(doc => doc.version),
        userRole: userRole || 'Legal Professional',
        results: results
      });

      // End loading state and close modal
      setIsAnalyzing(false);
      setShowAnalyzeModal(false);
      setShowResults(true);
    }, 4000); // 4 second simulated loading time
  };

  // Group documents by title and version
  const groupedDocuments = documentData.reduce((acc, doc) => {
    if (!acc[doc.group || '']) {
      acc[doc.group || ''] = [];
    }
    acc[doc.group || ''].push(doc);
    return acc;
  }, {});

  // Sort documents by date (newest first) within each group
  Object.keys(groupedDocuments).forEach(key => {
    groupedDocuments[key].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  });

  return (
      <>
        <Header />
        <div className="min-h-screen p-6 bg-gray-50 dark:bg-black transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            {!showResults ? (
                <>
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        {t.documentsPage.header.title}
                      </h1>
                      <p className="text-gray-600 dark:text-gray-300 mt-1">
                        {t.documentsPage.header.description}
                      </p>
                    </div>

                    <div className="flex space-x-4 text-[14px]">
                      <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                        <button
                            onClick={() => setViewMode('all')}
                            className={`px-4 py-2 transition-colors ${viewMode === 'all'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                        >
                          {t.documentsPage.viewModes.allDocuments}
                        </button>
                        <button
                            onClick={() => setViewMode('grouped')}
                            className={`px-4 py-2 transition-colors ${viewMode === 'grouped'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                        >
                          {t.documentsPage.viewModes.byContract}
                        </button>
                      </div>

                      <button
                          onClick={() => setShowAnalyzeModal(true)}
                          disabled={selectedDocuments.length < 2}
                          className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                              selectedDocuments.length < 2
                                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                  : 'bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 shadow-lg hover:shadow-xl'
                          }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Search size={18} />
                          <span>{t.documentsPage.actions.analyse}</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {viewMode === 'all' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {/* New document card */}
                        <div className="bg-white dark:bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-sm rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-700 p-6 flex flex-col items-center justify-center h-72 transition-all duration-300 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md cursor-pointer">
                          <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mb-4">
                            <Plus className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <h3 className="text-lg font-medium text-indigo-700 dark:text-indigo-400">
                            {t.documentsPage.actions.generateNew}
                          </h3>
                        </div>

                        {/* Document cards with text skeleton design */}
                        {documentData.map((doc) => (
                            <motion.div
                                key={doc.id}
                                whileHover={{ y: -5 }}
                                className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md transition-all duration-300 h-72 ${
                                    selectedDocuments.some(d => d.id === doc.id)
                                        ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 shadow-lg'
                                        : 'hover:shadow-lg'
                                } cursor-pointer`}
                                onClick={() => toggleDocumentSelection(doc)}
                            >
                              <div className="h-1/2 bg-gray-50 dark:bg-gray-700 relative p-5 flex flex-col justify-center">
                                {/* Text skeleton */}
                                <div className="space-y-2">
                                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-5/6"></div>
                                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
                                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-4/5"></div>
                                </div>

                                {/* Title placeholder at top */}
                                <div className="absolute top-3 left-3 right-3">
                                  <div className="flex items-center">
                                    <div className="h-3 w-3 rounded-sm bg-gray-300 dark:bg-gray-600 mr-1"></div>
                                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
                                  </div>
                                </div>

                                {/* Document type and version indicator */}
                                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                                  <div className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded-md text-xs text-gray-500 dark:text-gray-400">
                                    {t.documentsPage.documentCard.types[doc.type]}
                                  </div>

                                  {/* Version indicator */}
                                  {doc.version && (
                                      <div className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-md text-xs font-medium">
                                        {doc.version}
                                      </div>
                                  )}
                                </div>

                                {/* Selection indicator */}
                                {selectedDocuments.some(d => d.id === doc.id) && (
                                    <div className="absolute top-3 right-3 w-6 h-6 bg-indigo-500 dark:bg-indigo-400 rounded-full flex items-center justify-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                )}
                              </div>

                              <div className="p-5">
                                <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-2 truncate">
                                  {getDocumentDisplayName(doc.title)}
                                </h3>
                                <div className="flex items-center text-gray-500 dark:text-gray-400 mb-3 text-sm">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  <span>{doc.date}</span>
                                </div>
                                <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300">
                                  {t.documentsPage.documentCard.status.draft}
                                </span>
                              </div>
                            </motion.div>
                        ))}
                      </div>
                  ) : (
                      <div className="space-y-8">
                        {Object.entries(groupedDocuments).map(([group, docs]) => (
                            <div key={group} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 transition-colors duration-300">
                              <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                                  {getDocumentDisplayName(docs[0].title)}
                                </h2>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {docs.length} {t.documentsPage.documentCard.versions}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {docs.map((doc) => (
                                    <motion.div
                                        key={doc.id}
                                        whileHover={{ y: -5 }}
                                        className={`bg-white dark:bg-gray-700 rounded-lg border overflow-hidden transition-all duration-300 cursor-pointer ${
                                            selectedDocuments.some(d => d.id === doc.id)
                                                ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 shadow-md'
                                                : 'border-gray-200 dark:border-gray-600 hover:shadow'
                                        }`}
                                        onClick={() => toggleDocumentSelection(doc)}
                                    >
                                      <div className="flex items-center p-4">
                                        <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-lg mr-3">
                                          <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div>
                                          <div className="flex items-center">
                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{doc.version}</span>
                                            {selectedDocuments.some(d => d.id === doc.id) && (
                                                <div className="ml-2 w-4 h-4 bg-indigo-500 dark:bg-indigo-400 rounded-full flex items-center justify-center">
                                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                  </svg>
                                                </div>
                                            )}
                                          </div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400">{doc.date}</div>
                                        </div>
                                      </div>
                                    </motion.div>
                                ))}
                              </div>
                            </div>
                        ))}
                      </div>
                  )}
                </>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-300">
                  <div className="flex items-center mb-6">
                    <button
                        onClick={() => setShowResults(false)}
                        className="mr-4 p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <div>
                      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                        {t.documentsPage.results.title}
                      </h1>
                      <p className="text-gray-600 dark:text-gray-300">
                        {analysisResults.documentTitle} • {analysisResults.versions.join(' → ')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 space-y-8">
                    {analysisResults.results.length > 0 ? (
                        analysisResults.results.map((result, index) => (
                            <div key={index} className="border-t border-gray-200 dark:border-gray-700 pt-6">
                              <h2 className="text-xl font-semibold mb-4 text-indigo-700 dark:text-indigo-400">
                                {t.documentsPage.results.changesFromTo.replace('{{fromVersion}}', result.fromVersion).replace('{{toVersion}}', result.toVersion)}
                              </h2>
                              <div className="space-y-6">
                                {result.changes.map((change, changeIndex) => (
                                    <div key={changeIndex} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                      <h3 className="font-medium text-lg mb-3 text-gray-800 dark:text-gray-100">
                                        {getSectionDisplayName(change.section)}
                                      </h3>
                                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                                        <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
                                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                            {t.documentsPage.results.beforeLabel}
                                          </div>
                                          <p className="text-gray-700 dark:text-gray-300">{change.before}</p>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 p-3 rounded border border-indigo-200 dark:border-indigo-700">
                                          <div className="text-xs text-indigo-500 dark:text-indigo-400 mb-1">
                                            {t.documentsPage.results.afterLabel}
                                          </div>
                                          <p className="text-gray-700 dark:text-gray-300">{change.after}</p>
                                        </div>
                                      </div>
                                      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded border border-indigo-100 dark:border-indigo-800">
                                        <div className="text-xs text-indigo-600 dark:text-indigo-400 mb-1">
                                          {t.documentsPage.results.impactLabel.replace('{{role}}', analysisResults.userRole)}
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300">{change.impact}</p>
                                      </div>
                                    </div>
                                ))}
                              </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12">
                          <div className="text-gray-400 dark:text-gray-500 mb-4">
                            <Search className="w-12 h-12 mx-auto" />
                          </div>
                          <h3 className="text-xl font-medium text-gray-600 dark:text-gray-300 mb-2">
                            {t.documentsPage.results.noChangesFound}
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400">
                            {t.documentsPage.results.noChangesDescription}
                          </p>
                        </div>
                    )}
                  </div>
                </div>
            )}

            {/* Analysis Modal */}
            <AnimatePresence>
              {showAnalyzeModal && (
                  <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-w-md w-full"
                    >
                      <div className="bg-indigo-600 dark:bg-indigo-700 p-4">
                        <div className="flex justify-between items-center">
                          <h2 className="text-lg font-semibold text-white">
                            {t.documentsPage.analyseModal.title}
                          </h2>
                          <button
                              onClick={() => setShowAnalyzeModal(false)}
                              className="text-white hover:text-gray-200 transition-colors"
                              disabled={isAnalyzing}
                          >
                            <X size={24} />
                          </button>
                        </div>
                      </div>

                      {isAnalyzing && (
                          <div className="w-full bg-blue-100 dark:bg-blue-900">
                            <div
                                className="h-1 bg-indigo-600 dark:bg-indigo-500 transition-all duration-300"
                                style={{ width: `${loadingProgress}%` }}
                            ></div>
                          </div>
                      )}

                      <div className="p-6">
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2 mb-3">
                            {selectedDocuments.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-full text-sm flex items-center"
                                >
                                  {getDocumentDisplayName(doc.title)} {doc.version}
                                  <button
                                      className="ml-2 text-indigo-400 dark:text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-300"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleDocumentSelection(doc);
                                      }}
                                      disabled={isAnalyzing}
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                            ))}
                          </div>

                          <p className="text-gray-600 dark:text-gray-300 text-[14px]">
                            {selectedDocuments.length === 0 ? (
                                t.documentsPage.analyseModal.selectDocumentsPrompt
                            ) : (
                                t.documentsPage.analyseModal.changesPrompt.replace('{{count}}', selectedDocuments.length)
                            )}
                          </p>
                        </div>

                        <div className="mb-6">
                          <input
                              type="text"
                              className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all text-[14px]"
                              placeholder={t.documentsPage.analyseModal.roleInputPlaceholder}
                              value={userRole}
                              onChange={(e) => setUserRole(e.target.value)}
                              disabled={isAnalyzing}
                          />
                        </div>

                        <div className="mb-6 text-[14px]">
                          <textarea
                              className="w-full p-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all"
                              rows={4}
                              placeholder={t.documentsPage.analyseModal.additionalRequirementsPlaceholder}
                              value={analyzeQuery}
                              onChange={(e) => setAnalyzeQuery(e.target.value)}
                              disabled={isAnalyzing}
                          ></textarea>
                        </div>

                        <button
                            className="w-full py-3 bg-indigo-600 dark:bg-indigo-500 text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all flex items-center justify-center"
                            onClick={handleAnalyzeSubmit}
                            disabled={selectedDocuments.length < 2 || isAnalyzing}
                        >
                          {isAnalyzing ? (
                              <>
                                <Loader className="w-5 h-5 mr-2 animate-spin" />
                                <span>{t.documentsPage.analyseModal.analyzingButton}</span>
                              </>
                          ) : (
                              <span>{t.documentsPage.analyseModal.startButton}</span>
                          )}
                        </button>

                        {isAnalyzing && (
                            <div className="mt-4">
                              <div className="text-center text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-2">
                                {loadingMessages[loadingPhase]}
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                                <div className="animate-pulse space-y-2">
                                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded"></div>
                                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-5/6"></div>
                                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-4/6"></div>
                                </div>
                              </div>
                            </div>
                        )}
                      </div>
                    </motion.div>
                  </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </>
  )
}