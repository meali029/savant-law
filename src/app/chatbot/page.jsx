"use client"
import React, { useState, useRef, useEffect } from 'react'
import {
  Search,
  Plus,
  MoreHorizontal,
  MessageSquare,
  Folder,
  User,
  Settings,
  Menu,
  X,
  Send,
  Paperclip,
  Globe,
  Database
} from 'lucide-react'
import { getToken } from '../../services/authApi'
import { useLanguage } from '../../context/LanguageContext'

// Mock theme provider since it's not available
const useTheme = () => {
  const [theme, setTheme] = useState('light')
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light')
  return { theme, toggleTheme }
}

function ChatSidebar({ isOpen, onClose }) {
  const { t } = useLanguage()

  const folders = [
    { name: t.chat.sidebar.folders.general, active: false },
    { name: t.chat.sidebar.folders.sales, active: true },
    { name: t.chat.sidebar.folders.negotiation, active: false },
    { name: t.chat.sidebar.folders.marketing, active: false }
  ]

  const recentChats = t.chat.messages.defaultRecentChats

  return (
      <>
        {/* Mobile overlay */}
        {isOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-40 lg:hidden" onClick={onClose} />
        )}

        {/* Sidebar */}
        <div className={`fixed left-0 top-0 h-full w-80 bg-gray-900 dark:bg-gray-950 text-white z-50 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 dark:border-gray-800">

              <div className="flex items-center space-x-2 justify-between mb-4">
                <div>
                  <img src="/SavantWhite.png" alt={t.logoAlt} className="w-8 rounded-full" />
                </div>
                <div>
                  <button className="p-1 hover:bg-gray-800 dark:hover:bg-gray-700 rounded transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button className="lg:hidden p-1 hover:bg-gray-800 dark:hover:bg-gray-700 rounded transition-colors" onClick={onClose}>
                <X className="w-5 h-5" />
              </button>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                    type="text"
                    placeholder={t.chat.sidebar.searchPlaceholder}
                    className="w-full bg-gray-800 dark:bg-gray-900 text-white placeholder-gray-400 dark:placeholder-gray-500 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 transition-colors"
                />
              </div>
            </div>

            {/* Documents Section */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-300 dark:text-gray-400">{t.chat.sidebar.documents}</h3>
                  <button
                      className="p-1 hover:bg-gray-800 dark:hover:bg-gray-700 rounded transition-colors"
                      title={t.chat.sidebar.addDocument}
                  >
                    <Plus className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </button>
                </div>

                <div className="space-y-1">
                  {folders.map((folder, index) => (
                      <div key={index} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors ${
                          folder.active ? 'bg-gray-800 dark:bg-gray-700 border-l-2 border-green-500 dark:border-green-400' : ''
                      }`}>
                        <div className="flex items-center space-x-3">
                          <Folder className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <span className="text-sm text-white">{folder.name}</span>
                        </div>
                        <button className="p-1 hover:bg-gray-700 dark:hover:bg-gray-600 rounded opacity-0 group-hover:opacity-100 transition-all">
                          <MoreHorizontal className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                        </button>
                      </div>
                  ))}
                </div>
              </div>

              {/* Recent Chats Section */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-300 dark:text-gray-400">{t.chat.sidebar.recentChats}</h3>
                  <button
                      className="p-1 hover:bg-gray-800 dark:hover:bg-gray-700 rounded transition-colors"
                      title={t.chat.sidebar.addChat}
                  >
                    <Plus className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </button>
                </div>

                <div className="space-y-1">
                  {recentChats.map((chat, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-800 dark:hover:bg-gray-700 group transition-colors">
                        <div className="flex items-center space-x-3">
                          <MessageSquare className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <span className="text-sm text-gray-300 dark:text-gray-400 truncate">{chat}</span>
                        </div>
                        <button className="p-1 hover:bg-gray-700 dark:hover:bg-gray-600 rounded opacity-0 group-hover:opacity-100 transition-all">
                          <MoreHorizontal className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                        </button>
                      </div>
                  ))}
                </div>
              </div>
            </div>

            {/* User Profile */}
            <div className="p-4 border-t border-gray-700 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-600 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-white">{t.chat.sidebar.userProfile}</span>
                </div>
                <button
                    className="p-1 hover:bg-gray-800 dark:hover:bg-gray-700 rounded transition-colors"
                    title={t.chat.sidebar.settings}
                >
                  <Settings className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
  )
}

function Page() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [generalSearch, setGeneralSearch] = useState(true)
  const [databaseSearch, setDatabaseSearch] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const bottomInputRef = useRef(null)

  const { theme, toggleTheme } = useTheme()
  const { t } = useLanguage()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // API call to MediaRank
  const callMediaRankAPI = async (conversationMessages) => {
    try {
      const token = getToken()
      const response = await fetch('https://api.getmediarank.com/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: conversationMessages
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error calling MediaRank API:', error)
      throw error
    }
  }

  // Convert internal messages to API format
  const convertMessagesToAPIFormat = (messages, newUserMessage) => {
    const apiMessages = [
      {
        role: "system",
        content: "You are an AI legal assistant. You provide clear, concise, and accurate legal information, but do not offer legal advice."
      }
    ]

    // Add previous messages
    messages.forEach(msg => {
      if (msg.sender === 'user') {
        apiMessages.push({
          role: "user",
          content: msg.text
        })
      } else if (msg.sender === 'ai') {
        apiMessages.push({
          role: "assistant",
          content: msg.text
        })
      }
    })

    // Add the new user message
    apiMessages.push({
      role: "user",
      content: newUserMessage
    })

    return apiMessages
  }

  const handleSendMessage = async () => {
    if (message.trim() === '') return

    const userMessage = {
      id: Date.now(),
      text: message,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString()
    }

    setMessages(prev => [...prev, userMessage])
    const currentMessage = message
    setMessage('')
    setIsTyping(true)

    // Keep input focused after sending
    setTimeout(() => {
      const activeInput = hasMessages ? bottomInputRef.current : inputRef.current
      if (activeInput) {
        activeInput.focus()
      }
    }, 100)

    try {
      // Convert messages to API format
      const apiMessages = convertMessagesToAPIFormat(messages, currentMessage)

      // Call the API
      const apiResponse = await callMediaRankAPI(apiMessages)

      // Extract the assistant's response from the API response
      const responseText = apiResponse.response || t.chat.error.noResponse

      const aiMessage = {
        id: Date.now() + 1,
        text: responseText,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error getting AI response:', error)

      // Fallback response in case of error
      const errorMessage = {
        id: Date.now() + 1,
        text: t.chat.error.connectionError,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  const hasMessages = messages.length > 0

  return (
      <div className="flex h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
        <ChatSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between transition-colors duration-300">
            <button
                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                onClick={() => setSidebarOpen(true)}
                title={t.chat.header.openSidebar}
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div className="flex-1" />
            <button
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={t.chat.header.openMenu}
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {!hasMessages ? (
                /* Welcome Screen */
                <div className="flex-1 flex flex-col items-center justify-center p-8 transition-all duration-500">
                  <div className="text-center mb-12">
                    <div className="flex items-center justify-center mb-6">
                      <img  src={theme === 'dark' ? "/LogoWhite.png" : "/SavantLogo.png"} alt={t.chat.main.logoAlt} className="w-[200px] rounded-full" />
                    </div>
                    <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors duration-300">
                      {t.chat.main.welcomeTitle}
                    </h1>
                  </div>

                  {/* Input Area - Centered */}
                  <div className="w-full max-w-4xl">
                    <div className="relative mb-6">
                      <button className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <Paperclip className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      </button>
                      <input
                          ref={inputRef}
                          type="text"
                          placeholder={t.chat.main.inputPlaceholderTop}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-xl pl-16 pr-16 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-colors duration-300"
                      />
                      <button
                          onClick={handleSendMessage}
                          disabled={isTyping}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={t.chat.main.sendButton}
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Search Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-lg transition-all cursor-pointer">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <Globe className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t.chat.main.generalSearch.title}</h3>
                          </div>
                          <div className={`w-12 h-6 rounded-full p-1 transition-colors ${
                              generalSearch ? 'bg-purple-600 dark:bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                          }`}>
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                                generalSearch ? 'translate-x-6' : 'translate-x-0'
                            }`} />
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">{t.chat.main.generalSearch.description}</p>
                      </div>

                      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-lg transition-all cursor-pointer">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <Database className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t.chat.main.databaseSearch.title}</h3>
                          </div>
                          <div className={`w-12 h-6 rounded-full p-1 transition-colors ${
                              databaseSearch ? 'bg-purple-600 dark:bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                          }`}>
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                                databaseSearch ? 'translate-x-6' : 'translate-x-0'
                            }`} />
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">{t.chat.main.databaseSearch.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
            ) : (
                /* Chat Messages */
                <div className="flex-1 flex flex-col h-0 overflow-hidden">
                  {/* Messages Container */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 h-full">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                        >
                          <div
                              className={`max-w-xs lg:max-w-2xl px-4 py-3 rounded-lg ${
                                  msg.sender === 'user'
                                      ? 'bg-purple-600 text-white'
                                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                              }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                            <p className={`text-xs mt-1 ${
                                msg.sender === 'user' ? 'text-purple-200' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {msg.timestamp}
                            </p>
                          </div>
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 max-w-xs">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.chat.typingIndicator.text}</p>
                          </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area - Bottom */}
                  <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 transition-all duration-500">
                    <div className="relative">
                      <button className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <Paperclip className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      </button>
                      <input
                          type="text"
                          placeholder={t.chat.main.inputPlaceholderBottom}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          disabled={isTyping}
                          ref={bottomInputRef}
                          className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-xl pl-16 pr-16 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button
                          onClick={handleSendMessage}
                          disabled={isTyping}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={t.chat.main.sendButton}
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
            )}
          </div>
        </div>
      </div>
  )
}

export default Page