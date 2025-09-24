export const zh = {
  logoAlt: "标志",

  signIn: {
    headerTitle: "登录",
    headerSubtitle: "请登录以继续访问您的账户。",
    errorMessage: "用户名或密码无效",
    usernameLabel: "用户名",
    passwordLabel: "密码",
    signInButton: "登录",
    needAccountText: "需要账户？",
    createAccount: "创建一个",
  },

  loading: "加载中...",

  signUp: {
    headerTitle: "注册",
    headerSubtitle: "现在就加入我们",
    errorMessage: "注册失败。请尝试不同的用户名。",
    fullNameLabel: "全名",
    usernameLabel: "用户名",
    passwordLabel: "密码",
    signUpButton: "注册",
    alreadyMemberText: "已经是会员了？",
    loginHere: "在这里登录",
  },

  projectsPage: {
    header: {
      title: "项目",
      description: "浏览您的项目或立即开始创建新项目。",
    },
    projectCard: {
      unknownDate: "未知日期",
      sharedStatus: "已共享",
      privateStatus: "私人",
    },
    createCard: {
      creating: "创建中...",
      title: "创建新项目",
    },
    createModal: {
      title: "创建新项目",
      label: "项目名称",
      placeholder: "输入项目名称...",
      submitButton: "创建项目",
    },
    deleteModal: {
      title: "删除项目",
      confirmationText: '您确定要删除"{{projectName}}"吗？此操作无法撤销。',
      confirmButton: "删除项目",
    },
    emptyState: {
      title: "还没有项目",
      description: "创建您的第一个项目以开始使用。",
    },
    alerts: {
      createFailed: "创建项目失败。请重试。",
      deleteFailed: "删除项目失败。请重试。",
    },
  },

  projectDocuments: {
    breadcrumb: {
      projects: "项目",
      separator: ">"
    },
    title: "项目文档",
    description: "管理和分析您的项目文档",
    viewMode: {
      allDocuments: "所有文档",
      byContract: "按合同"
    },
    selectAll: "全选",
    deselectAll: "取消全选",
    analyseButton: "分析",
    generateNewDocument: "生成新文档",
    loadingDocuments: "正在加载文档...",
    analyseModal: {
      title: "分析文档",
      selectAtLeastTwo: "请选择至少2个文档进行分析",
      impactPrompt: "正在分析{{count}}个文档以进行影响评估",
      inputPlaceholder: "您的角色（例如：法律顾问、经理）",
      textareaPlaceholder: "输入您的具体分析查询...",
      startButton: "开始分析",
      analyzingButton: "分析中...",
      defaultRole: "法律专业人士"
    },
    deleteModal: {
      title: "删除文档",
      warning: "您确定要删除'{{title}}'吗？此操作无法撤销。",
      cancel: "取消",
      delete: "删除",
      errorFallback: "删除文档时出错"
    },
    results: {
      title: "分析结果",
      changesFrom: "从{{fromVersion}}到{{toVersion}}的变更",
      beforeLabel: "之前",
      afterLabel: "之后",
      impactFor: "对{{role}}的影响",
      noChangesTitle: "未发现变更",
      noChangesText: "所选文档似乎是相同的。",
      exampleSection: "第3.2节 - 付款条款",
      exampleBefore: "发票日期后30天内付款",
      exampleAfter: "发票日期后15天内付款",
      exampleImpact: "此变更显著缩短了付款期限，可能改善现金流，但可能需要与客户重新协商。"
    },
    loadingMessage: {
      0: "初始化分析...",
      1: "处理文档...",
      2: "比较版本...",
      3: "生成见解..."
    }
  },

  documentsPage: {
    header: {
      title: "文档",
      description: "浏览您的文档或立即开始创建新文档。",
    },
    viewModes: {
      allDocuments: "所有文档",
      byContract: "按合同"
    },
    actions: {
      analyse: "分析",
      generateNew: "生成新文档"
    },
    documentCard: {
      versions: "版本",
      status: {
        draft: "草稿"
      },
      types: {
        contract: "合同",
        letter: "信函"
      }
    },
    analyseModal: {
      title: "分析文档",
      selectDocumentsPrompt: "请选择至少两个文档来分析差异。",
      changesPrompt: "这{{count}}个不同版本之间做了什么更改，作为一个",
      roleInputPlaceholder: "创始人、投资者、员工...",
      additionalRequirementsPlaceholder: "附加要求或要分析的具体方面...",
      startButton: "开始分析",
      analyzingButton: "正在分析文档...",
      validationError: "请选择同一文档的版本进行比较。"
    },
    loadingMessages: {
      0: "分析文档结构...",
      1: "比较合同条款...",
      2: "识别关键变更...",
      3: "评估潜在影响..."
    },
    results: {
      title: "版本比较",
      changesFromTo: "从{{fromVersion}}到{{toVersion}}的变更",
      beforeLabel: "之前：",
      afterLabel: "之后：",
      impactLabel: "对{{role}}的影响：",
      noChangesFound: "未发现变更",
      noChangesDescription: "我们未能在这些版本之间找到任何重大变更。"
    },
    documentNames: {
      votingAgreement: "投票协议",
      founderAgreement: "创始人协议",
      managementRightsLetter: "管理权利函"
    },
    sections: {
      votingRights: "投票权",
      boardRepresentation: "董事会代表",
      transferRestrictions: "转让限制",
      dragAlongRights: "拖拽权利",
      intellectualPropertyAssignment: "知识产权转让",
      nonCompete: "竞业禁止",
      vestingSchedule: "归属时间表",
      disputeResolution: "争议解决",
      terminationClauses: "终止条款"
    }
  },

  // NEW: DocumentPage Chinese translations
  documentPage: {
    saving: "保存中...",
    saved: "已保存",
    unsavedChanges: "未保存的更改",
    noDocumentToSave: "没有文档可保存！",
    noChangesToSave: "没有更改需要保存。",
    documentSavedSuccessfully: "文档保存成功！",
    failedToSaveDocument: "文档保存失败",
    noContentToDownload: "没有内容可下载！",
    noContentToShare: "没有内容可分享！",
    generatedDocument: "生成的文档",
    documentLinkCopied: "文档链接已复制到剪贴板！",
    emptyState: {
      noDocumentSelected: "未选择文档",
      createOrSelectDocument: "创建新文档或选择现有文档以开始使用",
      createNewDocument: "创建新文档"
    },
    toast: {
      documentSaved: "文档保存成功！",
      noChangesToSave: "没有更改需要保存。",
      saveError: "文档保存失败：{{error}}",
      noDocumentToSave: "没有文档可保存！"
    },
    toolbar: {
      save: "保存",
      download: "下载",
      share: "分享",
      newDocument: "新文档"
    },
    generation: {
      generatingDocument: "正在生成文档...",
      preparingContent: "正在准备内容...",
      almostDone: "即将完成...",
      loadingDocument: "正在加载文档..."
    }
  },

  documentCreationModal: {
    step1Title: '步骤 1/3：情景描述',
    step2Title: '步骤 2/3：选择文档模板',
    step3Title: '步骤 3/3：补充信息',
    situationDescriptionLabel: '情景描述',
    situationDescriptionPlaceholder: "描述您的法律文档需求（例如：'保密与竞业协议'）",
    validatingDescription: '正在验证...',
    legalDocumentRelated: '与法律文档相关 ✓',
    mayNotBeLegalDocumentRelated: '可能与法律文档无关',
    pdfFileAttachmentsLabel: 'PDF 文件附件（可选）',
    addPdfFileButton: '添加 PDF 文件',
    filesWillBeAnalyzed: '文件将被立即分析',
    chooseDocumentTemplateDescription: '根据您的描述从 AI 建议中选择模板，从模板库中选择，或上传 PDF 文档创建新模板。',
    aiSuggestedButton: 'AI 建议',
    vaultTemplatesButton: '模板库',
    uploadDocumentButton: '上传文档',
    loadingTemplates: '正在加载模板...',
    matchPercentage: '匹配',
    noAiSuggestedTemplates: '没有可用的 AI 建议模板。',
    createdBy: '创建者',
    vault: '模板库',
    noVaultTemplates: '没有可用的模板库模板。',
    templateNameLabel: '模板名称',
    templateNamePlaceholder: '输入模板名称',
    templateDescriptionLabel: '模板描述',
    templateDescriptionPlaceholder: '描述此模板用途',
    optional: '可选',
    uploadPdfDocumentLabel: '上传 PDF 文档',
    uploadingPdf: '正在上传...',
    choosePdfFile: '选择 PDF 文件',
    enterTemplateNameFirst: '请先输入模板名称',
    onlyPdfFilesSupported: '仅支持 PDF 文件',
    justCreated: '刚创建',
    uploaded: '已上传',
    selected: '已选择',
    unknownTemplate: '未知模板',
    aiSuggested: 'AI 建议',
    vaultTemplate: '模板库模板',
    uploadedDocument: '已上传文档',
    additionalInformationDescription: '请补充信息以定制您的文档。所有字段均为可选，您可以跳过任何问题并使用默认值生成文档。',
    generating: '正在生成...',
    aiFillAll: 'AI 一键填写',
    loadingQuestions: '正在加载问题...',
    enterAnswerPlaceholder: '输入您的答案（可选）...',
    noAdditionalInformationRequired: '此模板无需补充信息。',
    proceedToGenerate: '您可以继续生成文档。',
    backButton: '上一步',
    cancelButton: '取消',
    analyzingFiles: '正在分析文件...',
    generateDocument: '生成文档',
    nextButton: '下一步',
  },

  common: {
    delete: "删除",
    cancel: "取消",
    creating: "创建中...",
    deleting: "删除中...",
    close: "关闭",
    back: "返回",
    select: "选择",
    selected: "已选择",
    remove: "移除",
    confirm: "确认"
  },

  nav: {
    vault: "保险库",
    templates: "模板",
    chatbot: "聊天机器人",
    projects: "项目",
    tabular: "表格",
    profile: "个人资料",
    settings: "设置",
    logout: "登出"
  },

  chat: {
    sidebar: {
      searchPlaceholder: "搜索",
      documents: "文档",
      addDocument: "添加文件夹",
      folders: {
        general: "常规",
        sales: "销售",
        negotiation: "谈判",
        marketing: "营销"
      },
      recentChats: "最近聊天",
      addChat: "新聊天",
      userProfile: "用户资料",
      settings: "设置"
    },
    header: {
      openSidebar: "打开侧边栏",
      openMenu: "打开菜单"
    },
    main: {
      welcomeTitle: "今天我们如何为您提供帮助？",
      welcomeSubtitle: "",
      inputPlaceholderTop: "询问法律问题...",
      inputPlaceholderBottom: "输入您的法律问题...",
      sendButton: "发送",
      generalSearch: {
        title: "常规搜索",
        description: "通过常规搜索找到问题的答案"
      },
      databaseSearch: {
        title: "数据库搜索",
        description: "通过数据库搜索找到问题的答案"
      },
      assistHighlight: "协助",
      logoAlt: "标志"
    },
    typingIndicator: {
      text: "AI正在输入..."
    },
    error: {
      apiFailed: "抱歉，出现了问题。请重试。",
      connectionError: "抱歉，我现在无法连接到服务。请稍后重试。",
      noResponse: "抱歉，我现在无法生成回复。"
    },
    messages: {
      defaultRecentChats: [
        "如何增加...",
        "最佳方法是什么...",
        "最佳方法是什么..."
      ]
    }
  },

  vault: {
    addPage: '添加页面',
    new: '新建',
    pageNotFound: '未找到页面',
    templateTools: '模板工具',
    editCurrentPage: '编辑当前页面',
    editingModeActive: '编辑模式激活',
    save: '保存',
    cancel: '取消',
    reset: '重置',
    download: '下载',
    downloading: '正在下载...',
    saving: '正在保存...',
    autoRedaction: '自动修订',
    autoRedactAll: '全部自动修订',
    redactingAll: '全部修订中...',
    orSelectSpecificTypes: '或选择特定类型',
    selectInformationToRedact: '选择要修订的信息：',
    selectAll: '全选',
    clearAll: '清除全部',
    redactingSelected: '正在修订所选...',
    redactSelected: '修订所选',
    templateSaved: '模板已保存！',
    templateId: '模板ID：',
    name: '名称：',
    page: '页面：',
    status: '状态：',
    templateLoaded: '✓ 模板已加载',
    loadingTemplate: '正在加载模板...',
    errorLoadingTemplate: '加载模板出错',
    tryAgain: '重试',
    noTemplateData: '没有可用的模板数据',
    noPagesYet: '还没有页面',
    createFirstPage: '创建第一页',
    emptyTemplate: '空模板',
    createPageToStart: '创建页面以开始编辑',
    createPageToAccessTools: '创建页面以访问编辑工具',
    templateIdLabel: '模板ID：',
    pagesLabel: '页面数：',
    statusLabel: '状态：',
    emptyTemplateStatus: '⚠️ 空模板',
    createFromPDF: '通过PDF创建',
    uploadPDFToCreate: '上传PDF以创建新模板',
    vaultTemplates: '模板库',
    browseTemplates: '浏览您的模板或通过PDF创建新模板',
    noTemplatesYet: '还没有模板',
    uploadPDFToCreateFirst: '上传PDF文档以创建您的第一个模板',
    uploadPDFDocument: '上传PDF文档',
    dropPDFHere: '将PDF拖到此处',
    dragDropOrClick: '拖放或点击浏览（最大10MB）',
    onlyPDFAllowed: '只允许PDF文件',
    fileSizeLimit: '文件大小必须小于10MB',
    templateName: '模板名称',
    enterTemplateName: '输入模板名称',
    description: '描述',
    optionalDescription: '模板的可选描述',
    cancelBtn: '取消',
    createTemplate: '创建模板',
    creating: '创建中...',
    ready: '已就绪',
    by: '由',
    noTemplates: '还没有模板',
    uploadPDFToCreateFirstTemplate: '上传PDF文档以创建您的第一个模板',
    delete: '删除',
    loading: '加载中...',
    error: '错误',
    redactionTypes: {
      names: '姓名',
      dates: '日期',
      dollarAmount: '金额',
      companyNames: '公司名称'
    },
    createTemplateFromPDF: '通过PDF创建模板',
    // ...add more as needed
  },

  tabular: {
    documents: '文档',
    searchPlaceholder: '搜索',
    newButton: '新建',
    documentsCount: '个文档',
    reviewTitle: '表格审查 #{number}',
    addDocuments: '添加文档',
    addColumns: '添加列',
    language: '语言',
    templates: '模板',
    export: '导出',
    document: '文档',
    addColumn: '添加列',
    documentPlaceholder: '文档名称...',
    columnPlaceholder: '列值...',
  }
};