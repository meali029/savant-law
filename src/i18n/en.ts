export const en = {
  logoAlt: "Logo",

  signIn: {
    headerTitle: "Sign in",
    headerSubtitle: "Please login to continue to your account.",
    errorMessage: "Invalid username or password",
    usernameLabel: "Username",
    passwordLabel: "Password",
    signInButton: "Sign In",
    needAccountText: "Need an account?",
    createAccount: "Create one",
  },

  loading: "Loading...",

  signUp: {
    headerTitle: "Sign up",
    headerSubtitle: "Join us now",
    errorMessage: "Registration failed. Try a different username.",
    fullNameLabel: "Full Name",
    usernameLabel: "Username",
    passwordLabel: "Password",
    signUpButton: "Sign Up",
    alreadyMemberText: "Already a member?",
    loginHere: "Login here",
  },

  projectsPage: {
    header: {
      title: "Projects",
      description: "Browse your projects or start creating a new one instantly.",
    },
    projectCard: {
      unknownDate: "Unknown date",
      sharedStatus: "Shared",
      privateStatus: "Private",
    },
    createCard: {
      creating: "Creating...",
      title: "Create new Project",
    },
    createModal: {
      title: "Create New Project",
      label: "Project Name",
      placeholder: "Enter project name...",
      submitButton: "Create Project",
    },
    deleteModal: {
      title: "Delete Project",
      confirmationText:
          'Are you sure you want to delete "{{projectName}}"? This action cannot be undone.',
      confirmButton: "Delete Project",
    },
    emptyState: {
      title: "No Projects Yet",
      description: "Create your first project to get started.",
    },
    alerts: {
      createFailed: "Failed to create project. Please try again.",
      deleteFailed: "Failed to delete project. Please try again.",
    },
  },

  projectDocuments: {
    breadcrumb: {
      projects: "Projects",
      separator: ">"
    },
    title: "Project Documents",
    description: "Manage and analyze your project documents",
    viewMode: {
      allDocuments: "All Documents",
      byContract: "By Contract"
    },
    selectAll: "Select All",
    deselectAll: "Deselect All",
    analyseButton: "Analyze",
    generateNewDocument: "Generate New Document",
    loadingDocuments: "Loading documents...",
    analyseModal: {
      title: "Analyze Documents",
      selectAtLeastTwo: "Please select at least 2 documents to analyze",
      impactPrompt: "Analyzing {{count}} documents for impact assessment",
      inputPlaceholder: "Your role (e.g., Legal Counsel, Manager)",
      textareaPlaceholder: "Enter your specific analysis query...",
      startButton: "Start Analysis",
      analyzingButton: "Analyzing...",
      defaultRole: "Legal Professional"
    },
    deleteModal: {
      title: "Delete Document",
      warning: "Are you sure you want to delete '{{title}}'? This action cannot be undone.",
      cancel: "Cancel",
      delete: "Delete",
      errorFallback: "Error deleting document"
    },
    results: {
      title: "Analysis Results",
      changesFrom: "Changes from {{fromVersion}} to {{toVersion}}",
      beforeLabel: "Before",
      afterLabel: "After",
      impactFor: "Impact for {{role}}",
      noChangesTitle: "No Changes Found",
      noChangesText: "The selected documents appear to be identical.",
      exampleSection: "Section 3.2 - Payment Terms",
      exampleBefore: "Payment due within 30 days of invoice date",
      exampleAfter: "Payment due within 15 days of invoice date",
      exampleImpact: "This change significantly reduces payment terms, potentially improving cash flow but may require renegotiation with clients."
    },
    loadingMessage: {
      0: "Initializing analysis...",
      1: "Processing documents...",
      2: "Comparing versions...",
      3: "Generating insights..."
    }
  },

  documentsPage: {
    header: {
      title: "Documents",
      description: "Browse your documents or start creating new document instantly.",
    },
    viewModes: {
      allDocuments: "All Documents",
      byContract: "By Contract"
    },
    actions: {
      analyse: "Analyse",
      generateNew: "Generate new document"
    },
    documentCard: {
      versions: "versions",
      status: {
        draft: "Draft"
      },
      types: {
        contract: "contract",
        letter: "letter"
      }
    },
    analyseModal: {
      title: "Analyse documents",
      selectDocumentsPrompt: "Please select at least two documents to analyze differences.",
      changesPrompt: "What are the changes made between these {{count}} different versions, how would it impact me as",
      roleInputPlaceholder: "founder, investor, employee...",
      additionalRequirementsPlaceholder: "Additional requirements or specific aspects to analyze...",
      startButton: "Start Analysing",
      analyzingButton: "Analyzing documents...",
      validationError: "Please select versions of the same document to compare."
    },
    loadingMessages: {
      0: "Analyzing document structure...",
      1: "Comparing contract clauses...",
      2: "Identifying key changes...",
      3: "Evaluating potential impacts..."
    },
    results: {
      title: "Version Comparison",
      changesFromTo: "Changes from {{fromVersion}} to {{toVersion}}",
      beforeLabel: "Before:",
      afterLabel: "After:",
      impactLabel: "Impact for {{role}}:",
      noChangesFound: "No Changes Found",
      noChangesDescription: "We couldn't find any significant changes between these versions."
    },
    documentNames: {
      votingAgreement: "voting_agreement",
      founderAgreement: "founder_agreement",
      managementRightsLetter: "management_rights_letter"
    },
    sections: {
      votingRights: "Voting Rights",
      boardRepresentation: "Board Representation",
      transferRestrictions: "Transfer Restrictions",
      dragAlongRights: "Drag-Along Rights",
      intellectualPropertyAssignment: "Intellectual Property Assignment",
      nonCompete: "Non-Compete",
      vestingSchedule: "Vesting Schedule",
      disputeResolution: "Dispute Resolution",
      terminationClauses: "Termination Clauses"
    }
  },

  // NEW: DocumentPage translations
  documentPage: {
    saving: "Saving...",
    saved: "Saved",
    unsavedChanges: "Unsaved changes",
    noDocumentToSave: "No document to save!",
    noChangesToSave: "No changes to save.",
    documentSavedSuccessfully: "Document saved successfully!",
    failedToSaveDocument: "Failed to save document",
    noContentToDownload: "No content to download!",
    noContentToShare: "No content to share!",
    generatedDocument: "Generated document",
    documentLinkCopied: "Document link copied to clipboard!",
    emptyState: {
      noDocumentSelected: "No Document Selected",
      createOrSelectDocument: "Create a new document or select an existing one to get started",
      createNewDocument: "Create New Document"
    },
    toast: {
      documentSaved: "Document saved successfully!",
      noChangesToSave: "No changes to save.",
      saveError: "Failed to save document: {{error}}",
      noDocumentToSave: "No document to save!"
    },
    toolbar: {
      save: "Save",
      download: "Download",
      share: "Share",
      newDocument: "New Document"
    },
    generation: {
      generatingDocument: "Generating document...",
      preparingContent: "Preparing content...",
      almostDone: "Almost done...",
      loadingDocument: "Loading document..."
    }
  },

  documentCreationModal: {
    step1Title: 'Step 1/3: Situation Description',
    step2Title: 'Step 2/3: Select Document Template',
    step3Title: 'Step 3/3: Additional Information',
    situationDescriptionLabel: 'Situation Description',
    situationDescriptionPlaceholder: "Describe your legal document needs (e.g., 'Confidentiality and Non-Competition Agreement')",
    validatingDescription: 'Validating...',
    legalDocumentRelated: 'Legal document related ✓',
    mayNotBeLegalDocumentRelated: 'May not be legal document related',
    pdfFileAttachmentsLabel: 'PDF File Attachments (Optional)',
    addPdfFileButton: 'Add PDF File',
    filesWillBeAnalyzed: 'Files will be analyzed immediately',
    chooseDocumentTemplateDescription: 'Choose a template from AI suggestions based on your description, select from your vault templates, or upload a PDF document to create a new template.',
    aiSuggestedButton: 'AI Suggested',
    vaultTemplatesButton: 'Vault Templates',
    uploadDocumentButton: 'Upload Document',
    loadingTemplates: 'Loading templates...',
    matchPercentage: 'Match',
    noAiSuggestedTemplates: 'No AI-suggested templates available.',
    createdBy: 'Created by',
    vault: 'Vault',
    noVaultTemplates: 'No vault templates available.',
    templateNameLabel: 'Template Name',
    templateNamePlaceholder: 'Enter a name for your template',
    templateDescriptionLabel: 'Template Description',
    templateDescriptionPlaceholder: 'Describe what this template is for',
    optional: 'Optional',
    uploadPdfDocumentLabel: 'Upload PDF Document',
    uploadingPdf: 'Uploading...',
    choosePdfFile: 'Choose PDF File',
    enterTemplateNameFirst: 'Enter a template name first',
    onlyPdfFilesSupported: 'Only PDF files are supported',
    justCreated: 'Just created',
    uploaded: 'Uploaded',
    selected: 'Selected',
    unknownTemplate: 'Unknown Template',
    aiSuggested: 'AI Suggested',
    vaultTemplate: 'Vault Template',
    uploadedDocument: 'Uploaded Document',
    additionalInformationDescription: 'Please provide additional information to customize your document. All fields are optional - you can skip any questions and generate the document with default values.',
    generating: 'Generating...',
    aiFillAll: 'AI Fill All',
    loadingQuestions: 'Loading questions...',
    enterAnswerPlaceholder: 'Enter your answer (optional)...',
    noAdditionalInformationRequired: 'No additional information required for this template.',
    proceedToGenerate: 'You can proceed to generate your document.',
    backButton: 'Back',
    cancelButton: 'Cancel',
    analyzingFiles: 'Analyzing Files...',
    generateDocument: 'Generate Document',
    nextButton: 'Next',
  },

  common: {
    delete: "Delete",
    cancel: "Cancel",
    creating: "Creating...",
    deleting: "Deleting...",
    close: "Close",
    back: "Back",
    select: "Select",
    selected: "Selected",
    remove: "Remove",
    confirm: "Confirm"
  },

  nav: {
    vault: "Vault",
    templates: "Templates",
    chatbot: "Chatbot",
    tabular: "Tabular",
    projects: "Projects",
    profile: "Profile",
    settings: "Settings",
    logout: "Logout"
  },

  chat: {
    sidebar: {
      searchPlaceholder: "Search",
      documents: "Documents",
      addDocument: "Add Folder",
      folders: {
        general: "General",
        sales: "Sales",
        negotiation: "Negotiation",
        marketing: "Marketing"
      },
      recentChats: "Recent Chats",
      addChat: "New Chat",
      userProfile: "User Profile",
      settings: "Settings"
    },
    header: {
      openSidebar: "Open sidebar",
      openMenu: "Open menu"
    },
    main: {
      welcomeTitle: "How can we assist you today?",
      welcomeSubtitle: "",
      inputPlaceholderTop: "Ask a legal question...",
      inputPlaceholderBottom: "Type your legal question...",
      sendButton: "Send",
      generalSearch: {
        title: "General Search",
        description: "Find answers to your questions with general search"
      },
      databaseSearch: {
        title: "Database Search",
        description: "Find answers to your questions with database search"
      },
      assistHighlight: "assist",
      logoAlt: "Logo"
    },
    typingIndicator: {
      text: "AI is typing..."
    },
    error: {
      apiFailed: "Sorry, something went wrong. Please try again.",
      connectionError: "I'm sorry, I'm having trouble connecting to the service right now. Please try again later.",
      noResponse: "I apologize, but I couldn't generate a response at this time."
    },
    messages: {
      defaultRecentChats: [
        "How can I increase the...",
        "What's the best appro...",
        "What's the best appro..."
      ]
    }
  },

  vault: {
    addPage: 'Add Page',
    new: 'New',
    pageNotFound: 'Page not found',
    templateTools: 'Template Tools',
    editCurrentPage: 'Edit Current Page',
    editingModeActive: 'Editing Mode Active',
    save: 'Save',
    cancel: 'Cancel',
    reset: 'Reset',
    download: 'Download',
    downloading: 'Downloading...',
    saving: 'Saving...',
    autoRedaction: 'Auto Redaction',
    autoRedactAll: 'Auto Redact All',
    redactingAll: 'Redacting All...',
    orSelectSpecificTypes: 'or select specific types',
    selectInformationToRedact: 'Select Information to Redact:',
    selectAll: 'Select All',
    clearAll: 'Clear All',
    redactingSelected: 'Redacting Selected...',
    redactSelected: 'Redact Selected',
    templateSaved: 'Template Saved!',
    templateId: 'Template ID:',
    name: 'Name:',
    page: 'Page:',
    status: 'Status:',
    templateLoaded: '✓ Template Loaded',
    loadingTemplate: 'Loading template...',
    errorLoadingTemplate: 'Error Loading Template',
    tryAgain: 'Try Again',
    noTemplateData: 'No template data available',
    noPagesYet: 'No pages yet',
    createFirstPage: 'Create First Page',
    emptyTemplate: 'Empty Template',
    createPageToStart: 'Create a page to start editing',
    createPageToAccessTools: 'Create a page to access editing tools',
    templateIdLabel: 'Template ID:',
    pagesLabel: 'Pages:',
    statusLabel: 'Status:',
    emptyTemplateStatus: '⚠️ Empty Template',
    createFromPDF: 'Create from PDF',
    uploadPDFToCreate: 'Upload a PDF to create a new template',
    vaultTemplates: 'Vault Templates',
    browseTemplates: 'Browse your templates or create new ones from PDF documents',
    noTemplatesYet: 'No templates yet',
    uploadPDFToCreateFirst: 'Upload a PDF document to create your first template',
    uploadPDFDocument: 'Upload PDF Document',
    dropPDFHere: 'Drop PDF here',
    dragDropOrClick: 'Drag & drop or click to browse (Max 10MB)',
    onlyPDFAllowed: 'Only PDF files are allowed',
    fileSizeLimit: 'File size must be less than 10MB',
    templateName: 'Template Name',
    enterTemplateName: 'Enter template name',
    description: 'Description',
    optionalDescription: 'Optional description for your template',
    cancelBtn: 'Cancel',
    createTemplate: 'Create Template',
    creating: 'Creating...',
    ready: 'Ready',
    by: 'by',
    noTemplates: 'No templates yet',
    uploadPDFToCreateFirstTemplate: 'Upload a PDF document to create your first template',
    delete: 'Delete',
    loading: 'Loading...',
    error: 'Error',
    redactionTypes: {
      names: 'Names',
      dates: 'Dates',
      dollarAmount: 'Dollar amount',
      companyNames: 'Company names'
    },
    createTemplateFromPDF: 'Create Template from PDF',
    // ...add more as needed
  },

  tabular: {
    documents: 'Documents',
    searchPlaceholder: 'Search',
    newButton: 'New',
    documentsCount: 'documents',
    reviewTitle: 'Tabular Review #{number}',
    addDocuments: 'Add Documents',
    addColumns: 'Add Columns',
    language: 'Language',
    templates: 'Templates',
    export: 'Export',
    document: 'Document',
    addColumn: 'Add column',
    documentPlaceholder: 'Document name...',
    columnPlaceholder: 'Column value...',
  }
};