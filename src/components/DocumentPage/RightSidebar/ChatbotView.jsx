import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Mic, Settings, RefreshCw, X, AlertTriangle, FileText, Shield, Bot, User, Edit3, Check, XCircle } from 'lucide-react';
import Image from 'next/image';
import { DocumentAPI } from '../../../services/documentApi';
import { ChangesAnalysisAPI } from '../../../services/changesAnalysisApi';

const ChatbotView = ({ onSwitchToChanges, documentContent = '', selectedContext = null, onClearContext, onApplyChanges, onApplyChange }) => {
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you with document analysis, editing, and answering questions about your content. How can I assist you today?',
      timestamp: new Date().toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [contextText, setContextText] = useState(selectedContext);
  const [suggestedChanges, setSuggestedChanges] = useState([]);
  const [isStreamingChanges, setIsStreamingChanges] = useState(false);
  const [currentChangeIndex, setCurrentChangeIndex] = useState(0);
  const [applyingChanges, setApplyingChanges] = useState(new Set());
  const messagesEndRef = useRef(null);

  // Update context when selectedContext changes
  useEffect(() => {
    if (selectedContext && selectedContext !== contextText) {
      setContextText(selectedContext);
      // Add a context message to show what was selected
      const contextMessage = {
        id: Date.now(),
        type: 'context',
        content: selectedContext,
        timestamp: new Date().toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
      setMessages(prev => [...prev, contextMessage]);
    }
  }, [selectedContext]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Helper function to extract text content from HTML
  const extractTextFromHTML = (html) => {
    if (!html) return '';
    console.log('🔍 Extracting text from HTML:', html.substring(0, 200) + '...');
    
    // Create a temporary div to extract text content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const extractedText = tempDiv.textContent || tempDiv.innerText || '';
    
    console.log('📄 Extracted text:', extractedText.substring(0, 200) + '...');
    return extractedText;
  };

  // Helper function to convert messages to API format
  const convertMessagesToAPIFormat = (chatMessages) => {
    return chatMessages
      .filter(msg => msg.type === 'user' || msg.type === 'assistant')
      .map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));
  };

  // Handle changes analysis streaming
  const handleChangesAnalysis = async (userRequest) => {
    console.log('🔍 Starting changes analysis with:', { userRequest, documentContent: !!documentContent });
    
    if (!documentContent) {
      console.error('❌ No document content available');
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'No document content available for analysis. Please make sure a document is loaded.',
        timestamp: new Date().toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    setIsStreamingChanges(true);
    setSuggestedChanges([]);
    setCurrentChangeIndex(0);

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: userRequest,
      timestamp: new Date().toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
    setMessages(prev => [...prev, userMessage]);

    // Add assistant message indicating analysis is starting
    const assistantMessage = {
      id: Date.now() + 1,
      type: 'assistant',
      content: 'Analyzing your document for requested changes...',
      timestamp: new Date().toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      isStreaming: true
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Send HTML content directly to ensure better text matching
      console.log('📄 Sending HTML document content:', documentContent.substring(0, 200) + '...');
      
      const pages = ChangesAnalysisAPI.prepareDocumentPages(documentContent);
      const messages = ChangesAnalysisAPI.prepareMessages(userRequest);

      console.log('📋 API params:', { messages, pages: pages.length, number_of_changes: 4 });

      const params = {
        messages,
        pages,
        number_of_changes: 4 // Default value, can be adjusted
      };

      await ChangesAnalysisAPI.streamChangesAnalysis(
        params,
        // onChunk callback
        (changeData) => {
          setSuggestedChanges(prev => {
            const newChanges = [...prev, changeData];
            
            // Add the change as a new assistant message
            const changeMessage = {
              id: Date.now() + Math.random(),
              type: 'assistant',
              content: `**Suggested Change ${newChanges.length}:**\n\n**Original:** ${changeData.old_sentence}\n\n**New:** ${changeData.new_sentence}\n\n**Reason:** ${changeData.reason}\n\n*Click "Apply" to implement this change.*`,
              timestamp: new Date().toLocaleTimeString('en-GB', { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              isChangeSuggestion: true,
              changeData: changeData
            };
            
            setMessages(prevMessages => [...prevMessages, changeMessage]);
            
            return newChanges;
          });
          setCurrentChangeIndex(prev => prev + 1);
        },
        // onComplete callback
        (completeData) => {
          setIsStreamingChanges(false);
          
          // Add a completion message
          const completionMessage = {
            id: Date.now() + Math.random(),
            type: 'assistant',
            content: `✅ **Analysis Complete!**\n\nI found ${completeData.total_changes} suggested changes for your document. Each change has been presented above with an "Apply" button. You can apply them individually or use the "Apply All" option below.`,
            timestamp: new Date().toLocaleTimeString('en-GB', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            isCompletionMessage: true,
            totalChanges: completeData.total_changes
          };
          
          setMessages(prev => [...prev, completionMessage]);
        },
        // onError callback
        (error) => {
          setIsStreamingChanges(false);
          console.error('Changes analysis error:', error);
          
          const errorMessage = {
            id: Date.now() + 1,
            type: 'assistant',
            content: 'I encountered an error while analyzing your document for changes. Please try again.',
            timestamp: new Date().toLocaleTimeString('en-GB', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            isError: true
          };
          
          setMessages(prev => prev.map(msg => 
            msg.isStreaming ? { ...msg, isStreaming: false } : msg
          ).concat(errorMessage));
        }
      );
    } catch (error) {
      setIsStreamingChanges(false);
      console.error('Error in changes analysis:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'I encountered an error while analyzing your document for changes. Please try again.',
        timestamp: new Date().toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        isError: true
      };
      
      setMessages(prev => prev.map(msg => 
        msg.isStreaming ? { ...msg, isStreaming: false } : msg
      ).concat(errorMessage));
    }
  };

  // Handle applying a specific change
  const handleApplyChange = (change) => {
    console.log('🎯 Applying change:', change);
    
    // Add loading state for this change
    const changeId = `${change.old_sentence}-${change.new_sentence}`;
    setApplyingChanges(prev => new Set(prev).add(changeId));
    
    const applyFunction = onApplyChange || onApplyChanges;
    if (applyFunction) {
      console.log('✅ Apply function exists, calling with:', change.old_sentence, change.new_sentence);
      
      // Test if the old sentence exists in the document
      const extractedContent = extractTextFromHTML(documentContent);
      const oldSentenceExists = extractedContent.includes(change.old_sentence);
      console.log('🔍 Old sentence exists in document:', oldSentenceExists);
      
      if (!oldSentenceExists) {
        console.warn('⚠️ Old sentence not found in document. This might cause the change to fail.');
        console.log('🔍 Document content sample:', extractedContent.substring(0, 500));
        console.log('🔍 Looking for:', change.old_sentence);
        
        // NEW: Try to find the text with HTML tags
        const htmlPattern = change.old_sentence.replace(/(\w+)/g, '<strong>$1</strong>');
        console.log('🔍 Trying HTML pattern:', htmlPattern);
        const htmlExists = documentContent.includes(htmlPattern);
        console.log('🔍 HTML pattern exists:', htmlExists);
        
        if (htmlExists) {
          console.log('✅ Found HTML version, updating change object');
          change.old_sentence = htmlPattern;
          change.new_sentence = change.new_sentence.replace(/(\w+)/g, '<strong>$1</strong>');
        }
      }
      
      const result = applyFunction(change.old_sentence, change.new_sentence);
      console.log('📝 Apply result:', result);
      
      if (result) {
        console.log('✅ Change applied successfully!');
        
        // Remove the applied change from the suggestions list
        setSuggestedChanges(prev => prev.filter(c => 
          c.old_sentence !== change.old_sentence || 
          c.new_sentence !== change.new_sentence ||
          c.reason !== change.reason
        ));
        
        // Remove the change suggestion message from the chat
        setMessages(prev => prev.filter(msg => 
          !(msg.isChangeSuggestion && 
            msg.changeData && 
            msg.changeData.old_sentence === change.old_sentence && 
            msg.changeData.new_sentence === change.new_sentence)
        ));
        
        // Remove loading state
        setApplyingChanges(prev => {
          const newSet = new Set(prev);
          newSet.delete(changeId);
          return newSet;
        });
        
        // Force a re-render by updating the document content
        setTimeout(() => {
          console.log('🔄 Forcing re-render...');
          // This will trigger a re-render of the document viewer
          if (documentContent) {
            console.log('📄 Current document content length:', documentContent.length);
          }
          
          // Check if the change was actually applied to the DOM
          const documentElement = document.querySelector('[data-right-sidebar]')?.parentElement?.querySelector('[contenteditable="true"]');
          if (documentElement) {
            const currentText = documentElement.innerText || documentElement.textContent || '';
            console.log('🔍 Current DOM content:', currentText.substring(0, 200) + '...');
            const changeApplied = currentText.includes(change.new_sentence);
            console.log('✅ Change visible in DOM:', changeApplied);
            
            // If change is not visible, try to force update the content
            if (!changeApplied) {
              console.log('⚠️ Change not visible, attempting to force update...');
              const currentHTML = documentElement.innerHTML;
              const updatedHTML = currentHTML.replace(change.old_sentence, change.new_sentence);
              documentElement.innerHTML = updatedHTML;
              console.log('🔄 Forced DOM update completed');
            }
          }
        }, 100);
      } else {
        console.error('❌ Change application failed');
        // Remove loading state on failure
        setApplyingChanges(prev => {
          const newSet = new Set(prev);
          newSet.delete(changeId);
          return newSet;
        });
      }
    } else {
      console.error('❌ Apply function is not available');
      // Remove loading state on error
      setApplyingChanges(prev => {
        const newSet = new Set(prev);
        newSet.delete(changeId);
        return newSet;
      });
    }
  };

  // Handle applying all changes
  const handleApplyAllChanges = () => {
    console.log('🎯 Applying all changes:', suggestedChanges);
    const applyFunction = onApplyChange || onApplyChanges;
    if (applyFunction && suggestedChanges.length > 0) {
      // Add loading state for all changes
      const allChangeIds = suggestedChanges.map(change => `${change.old_sentence}-${change.new_sentence}`);
      setApplyingChanges(prev => new Set([...prev, ...allChangeIds]));
      
      let allApplied = true;
      
      suggestedChanges.forEach((change, index) => {
        console.log(`📝 Applying change ${index + 1}:`, change);
        const result = applyFunction(change.old_sentence, change.new_sentence);
        console.log(`📝 Apply result ${index + 1}:`, result);
        
        if (!result) {
          allApplied = false;
        }
      });
      
      // Clear all suggestions if all changes were applied successfully
      if (allApplied) {
        console.log('✅ All changes applied successfully, clearing suggestions');
        setSuggestedChanges([]);
        
        // Remove all change suggestion messages from the chat
        setMessages(prev => prev.filter(msg => !msg.isChangeSuggestion));
      } else {
        console.log('⚠️ Some changes failed to apply, keeping suggestions');
      }
      
      // Clear loading state
      setTimeout(() => {
        setApplyingChanges(new Set());
      }, 500);
    } else {
      console.error('❌ Cannot apply changes:', { applyFunction: !!applyFunction, suggestedChangesLength: suggestedChanges.length });
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Check if the message is requesting changes to the document
    const changeKeywords = ['change', 'update', 'modify', 'edit', 'replace', 'revise', 'amend'];
    const isChangeRequest = changeKeywords.some(keyword => 
      inputMessage.toLowerCase().includes(keyword)
    );

    if (isChangeRequest && documentContent) {
      // Route to changes analysis
      await handleChangesAnalysis(inputMessage);
      setInputMessage('');
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Prepare context - use selected context or full document
      const context = contextText || extractTextFromHTML(documentContent);
      
      // Get all previous messages for context
      const allMessages = [...messages, userMessage];
      const apiMessages = convertMessagesToAPIFormat(allMessages);

      // Call the real API
      const response = await DocumentAPI.chatWithContext(context, apiMessages);
      
      if (response.success) {
        const assistantMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: response.reply,
          timestamp: new Date().toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to get response from AI');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        timestamp: new Date().toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (action) => {
    if (action === 'risk') {
      onSwitchToChanges();
    } else if (action === 'summarize') {
      setInputMessage('Please provide a summary of this document.');
      handleSendMessage();
    } else if (action === 'compliance') {
      setInputMessage('Please analyze this document for compliance and legal issues.');
      handleSendMessage();
    } else if (action === 'changes') {
      setInputMessage('Please suggest improvements and changes for this document.');
      handleSendMessage();
    }
  };

  const handleClearContextClick = () => {
    setContextText(null);
    if (onClearContext) {
      onClearContext();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Ask Savant</h3>
              <div className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>{isStreamingChanges ? 'Analyzing Changes...' : 'Connected'}</span>
        </div>
       
          </div>
        </div>
        <div className="flex items-center space-x-1">
         
          <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors">
            <Settings className="w-4 h-4" />
          </button>
          <button 
            onClick={() => {
              setMessages([{
                id: 1,
                type: 'assistant',
                content: 'Hello! I\'m your AI assistant. I can help you with document analysis, editing, and answering questions about your content. How can I assist you today?',
                timestamp: new Date().toLocaleTimeString('en-GB', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })
              }]);
              setContextText(null);
              if (onClearContext) onClearContext();
            }}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Context Display */}
      {contextText && (
        <div className="p-3 mx-4 mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Selected Context</span>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200 line-clamp-3">
                "{contextText}"
              </p>
            </div>
            <button
              onClick={handleClearContextClick}
              className="ml-2 p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded transition-colors"
              title="Clear context"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            {message.type === 'context' ? (
              // Context message display
              <></>
            //   <div className="flex justify-center">
            //     <div className="max-w-[85%] bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            //       <div className="flex items-center space-x-2 mb-1">
            //         <FileText className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            //         <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
            //           Context Added - {message.timestamp}
            //         </span>
            //       </div>
            //       <p className="text-sm text-yellow-800 dark:text-yellow-200">
            //         Selected text: "{message.content}"
            //       </p>
            //     </div>
            //   </div>
            ) : (
              // Regular message display
              <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                  {message.type === 'assistant' && (
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-6 h-6 rounded-xl flex items-center justify-center overflow-hidden">
                        <Image
                          src="/logo.png"
                          alt="Savant AI"
                          width={24}
                          height={24}
                          className="object-contain"
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Savant AI {message.timestamp}
                      </span>
                    </div>
                  )}
                  
                  {message.type === 'user' && (
                    <div className="flex items-center justify-end space-x-2 mb-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        You {message.timestamp}
                      </span>
                      <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <User className='text-white' size={16}/>
                      </div>
                    </div>
                  )}

                  <div className={`rounded-lg p-3 ${
                    message.type === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : message.isError
                      ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                      : message.isChangeSuggestion
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}>
                    <div className="text-sm whitespace-pre-wrap">
                      {message.isChangeSuggestion ? (
                        <div>
                          {/* Header with change number and icon */}
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                              <Edit3 className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <div className="font-semibold text-green-700 dark:text-green-300 text-sm">
                                Suggested Change
                              </div>
                              <div className="text-xs text-green-600 dark:text-green-400">
                                Review and apply this modification
                              </div>
                            </div>
                          </div>

                          {/* Content sections */}
                          <div className="space-y-1">
                            {message.content.split('\n').map((line, index) => {
                              if (line.startsWith('**') && line.endsWith('**') && !line.includes('Original:') && !line.includes('New:') && !line.includes('Reason:')) {
                                return <div key={index} className="font-semibold text-green-700 dark:text-green-300 text-sm">{line.replace(/\*\*/g, '')}</div>;
                              } else if (line.startsWith('*') && line.endsWith('*')) {
                                return <div key={index} className="text-xs text-gray-500 dark:text-gray-400 italic">{line.replace(/\*/g, '')}</div>;
                              } else if (line.startsWith('**Original:**')) {
                                return <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-red-200 dark:border-red-800 shadow-sm">
                                  <div className="flex items-center space-x-2 mb-3">
                                    <div className="w-5 h-5 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                                    </div>
                                    <span className="font-medium text-red-700 dark:text-red-300 text-sm">Original Text</span>
                                  </div>
                                  <div className="text-sm text-gray-700 dark:text-gray-300 bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border-l-4 border-red-400">
                                    <div 
                                      className="prose prose-sm max-w-none"
                                      style={{
                                        lineHeight: '1.5',
                                        fontSize: 'inherit'
                                      }}
                                      dangerouslySetInnerHTML={{ 
                                        __html: line.replace('**Original:**', '').trim() 
                                      }}
                                    />
                                  </div>
                                </div>;
                              } else if (line.startsWith('**New:**')) {
                                return <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-800 shadow-sm">
                                  <div className="flex items-center space-x-2 mb-3">
                                    <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                                    </div>
                                    <span className="font-medium text-green-700 dark:text-green-300 text-sm">New Text</span>
                                  </div>
                                  <div className="text-sm text-gray-700 dark:text-gray-300 bg-green-50 dark:bg-green-900/10 p-3 rounded-lg border-l-4 border-green-400">
                                    <div 
                                      className="prose prose-sm max-w-none"
                                      style={{
                                        lineHeight: '1.5',
                                        fontSize: 'inherit'
                                      }}
                                      dangerouslySetInnerHTML={{ 
                                        __html: line.replace('**New:**', '').trim() 
                                      }}
                                    />
                                  </div>
                                </div>;
                              } else if (line.startsWith('**Reason:**')) {
                                return <div key={index} className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-200 dark:border-blue-800 shadow-sm">
                                  <div className="flex items-center space-x-2 mb-3">
                                    <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                                    </div>
                                    <span className="font-medium text-blue-700 dark:text-blue-300 text-sm">Reason for Change</span>
                                  </div>
                                  <div className="text-sm text-gray-700 dark:text-gray-300 italic">
                                    {line.replace('**Reason:**', '').trim()}
                                  </div>
                                </div>;
                              } else if (line.trim()) {
                                return <div key={index} className="text-gray-700 dark:text-gray-300">{line}</div>;
                              } else {
                                return <div key={index} className="h-2"></div>;
                              }
                            })}
                          </div>
                          
                          {/* Apply button for this change */}
                          <div className="flex justify-end mt-6">
                            <button
                              onClick={() => {
                                console.log('🔘 Apply button clicked for change:', message.changeData);
                                handleApplyChange(message.changeData);
                              }}
                              disabled={applyingChanges.has(`${message.changeData.old_sentence}-${message.changeData.new_sentence}`)}
                              className={`flex items-center space-x-3 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm ${
                                applyingChanges.has(`${message.changeData.old_sentence}-${message.changeData.new_sentence}`)
                                  ? 'bg-gray-400 cursor-not-allowed text-white'
                                  : 'bg-green-500 hover:bg-green-600 hover:shadow-md text-white transform hover:scale-105'
                              }`}
                            >
                              {applyingChanges.has(`${message.changeData.old_sentence}-${message.changeData.new_sentence}`) ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>Applying...</span>
                                </>
                              ) : (
                                <>
                                  <Edit3 className="w-4 h-4" />
                                  <span>Apply Change</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : message.isCompletionMessage ? (
                        <div>
                          {/* Header with completion icon */}
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            </div>
                            <div>
                              <div className="font-semibold text-blue-700 dark:text-blue-300 text-sm">
                                Analysis Complete
                              </div>
                              <div className="text-xs text-blue-600 dark:text-blue-400">
                                Review the suggested changes above
                              </div>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                            {message.content.split('\n').map((line, index) => {
                              if (line.startsWith('✅')) {
                                return <div key={index} className="font-semibold text-green-700 dark:text-green-300 text-sm">{line}</div>;
                              } else if (line.startsWith('**') && line.endsWith('**')) {
                                return <div key={index} className="font-semibold text-gray-700 dark:text-gray-300 text-sm">{line.replace(/\*\*/g, '')}</div>;
                              } else if (line.trim()) {
                                return <div key={index} className="text-gray-700 dark:text-gray-300 text-sm">{line}</div>;
                              } else {
                                return <div key={index} className="h-2"></div>;
                              }
                            })}
                          </div>
                          
                          {/* Apply All button */}
                          {suggestedChanges.length > 0 && (
                            <div className="flex justify-end mt-6">
                              <button
                                onClick={() => {
                                  console.log('🔘 Apply All button clicked');
                                  handleApplyAllChanges();
                                }}
                                disabled={applyingChanges.size > 0}
                                className={`flex items-center space-x-3 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm ${
                                  applyingChanges.size > 0
                                    ? 'bg-gray-400 cursor-not-allowed text-white'
                                    : 'bg-blue-500 hover:bg-blue-600 hover:shadow-md text-white transform hover:scale-105'
                                }`}
                              >
                                {applyingChanges.size > 0 ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Applying All...</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-4 h-4" />
                                    <span>Apply All Changes</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>{message.content}</div>
                      )}
                    </div>
                    {message.status && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                        {message.status}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[85%]">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-6 h-6 rounded-xl flex items-center justify-center overflow-hidden">
                  <Image
                    src="/logo.png"
                    alt="Savant AI"
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  AI Assistant is typing...
                </span>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div />
      </div>



      {/* Quick Actions */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <button 
            className="flex flex-col items-center space-y-1 p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            onClick={() => handleQuickAction('risk')}
          >
            <div className="w-6 h-6 border border-current rounded flex items-center justify-center">
              <AlertTriangle className="w-3 h-3" />
            </div>
            <span>Risk Analysis</span>
          </button>
          
          <button 
            className="flex flex-col items-center space-y-1 p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            onClick={() => handleQuickAction('summarize')}
          >
            <div className="w-6 h-6 border border-current rounded flex items-center justify-center">
              <FileText className="w-3 h-3" />
            </div>
            <span>Summarize</span>
          </button>
          
          <button 
            className="flex flex-col items-center space-y-1 p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            onClick={() => handleQuickAction('compliance')}
          >
            <div className="w-6 h-6 border border-current rounded flex items-center justify-center">
              <Shield className="w-3 h-3" />
            </div>
            <span>Compliance</span>
          </button>

       
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2 justify-center items-center">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={contextText ? "Ask about the selected text..." : "Enter a question or instruction..."}
              className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-none"
              rows="1"
              style={{ minHeight: '40px', maxHeight: '120px' }}
              disabled={isTyping || isStreamingChanges}
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <Mic className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping || isStreamingChanges}
            className="p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
          AI Assistant may produce inaccurate information. Consider verifying important content.
        </p>
      </div>
    </div>
  );
};

export default ChatbotView;