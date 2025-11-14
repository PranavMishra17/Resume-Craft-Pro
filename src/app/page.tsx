'use client';

/**
 * Resume-Craft-Pro - Complete Application
 * AI-Powered Resume Optimization with LaTeX/DOCX Support
 */

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Document, Line, Message, Chat, EditHistory, OriginalDocument, KeywordAnalysis, OptimizationConfig, ContextFile, TokenUsage } from '@/lib/parsers/types';
import {
  loadChats,
  saveChats,
  createChat,
  saveDocument,
  loadDocument,
  saveEditHistory,
  loadEditHistory,
  saveOriginalFile,
  loadOriginalFile
} from '@/lib/storage/chats';
import { exportDocument, exportDocumentPreserveFormat } from '@/lib/export';
import DocumentViewer from '@/components/document/DocumentViewer';
import ChatInterface from '@/components/chat/ChatInterface';
import ChatHistory from '@/components/sidebar/ChatHistory';
import InitialSetupModal from '@/components/modals/InitialSetupModal';
import FormatPreservePreview from '@/components/document/FormatPreservePreview';
import SettingsModal from '@/components/modals/SettingsModal';
import StatusBar from '@/components/layout/StatusBar';
import ContextFileManager from '@/components/resume/ContextFileManager';
import KeywordAnalysisPanel from '@/components/resume/KeywordAnalysisPanel';
import OptimizationControls from '@/components/resume/OptimizationControls';
import TokenCounter from '@/components/resume/TokenCounter';
import { Upload, AlertCircle, Settings, FileText, Briefcase, FolderOpen, FileCode, ChevronDown, ChevronUp, Plus, X, Sparkles } from 'lucide-react';

export default function Home() {
  const [document, setDocument] = useState<Document | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [isRunningLLMDetection, setIsRunningLLMDetection] = useState(false);
  const [selectedLine, setSelectedLine] = useState<Line | null>(null);

  // Edit tracking state
  const [editHistory, setEditHistory] = useState<EditHistory | null>(null);
  const [originalFile, setOriginalFile] = useState<OriginalDocument | null>(null);

  // Preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [customApiKey, setCustomApiKey] = useState<string | null>(null);
  const [chatWidth, setChatWidth] = useState(500);
  const [isResizingChat, setIsResizingChat] = useState(false);

  // Resume optimization state
  const [contextFiles, setContextFiles] = useState<{
    resume?: ContextFile;
    projects?: ContextFile;
    portfolio?: ContextFile;
    jobDescription?: ContextFile;
  }>({});
  const [jobDescription, setJobDescription] = useState('');
  const [keywordAnalysis, setKeywordAnalysis] = useState<KeywordAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const [optimizationConfig, setOptimizationConfig] = useState<OptimizationConfig>({
    mode: 'targeted',
    maxConcurrentCalls: 5,
    preserveLength: true,
    maintainTone: true,
    maxKeywordsPerBullet: 3,
    minConfidenceScore: 0.7
  });
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [sessionId] = useState(`session-${Date.now()}`);

  // UI state
  const [showContextFiles, setShowContextFiles] = useState(true);
  const [showOptimizationPanel, setShowOptimizationPanel] = useState(true);
  const [showChatPanel, setShowChatPanel] = useState(true);

  // Resume paste modal
  const [showResumePasteModal, setShowResumePasteModal] = useState(false);
  const [resumePasteText, setResumePasteText] = useState('');

  // JD paste
  const [jdPasteText, setJdPasteText] = useState('');

  // Load chats and custom API key from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedChats = loadChats();
    setChats(storedChats);

    // Load custom API key if exists
    const storedApiKey = localStorage.getItem('resume-craft-pro-custom-api-key');
    if (storedApiKey) {
      setCustomApiKey(storedApiKey);
    }

    // Load chat width if exists
    const storedChatWidth = localStorage.getItem('resume-craft-pro-chat-width');
    if (storedChatWidth) {
      setChatWidth(parseInt(storedChatWidth, 10));
    }
  }, []);

  // Handle chat resize
  useEffect(() => {
    if (!isResizingChat) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      // Clamp width between 400px and 700px
      const clampedWidth = Math.max(400, Math.min(700, newWidth));
      setChatWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizingChat(false);
      // Save width to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('resume-craft-pro-chat-width', chatWidth.toString());
      }
    };

    window.document.addEventListener('mousemove', handleMouseMove);
    window.document.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.document.removeEventListener('mousemove', handleMouseMove);
      window.document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingChat, chatWidth]);

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setError(null);

      console.log('Uploading file:', file.name);

      // Store original file for format-preserving export
      const fileBuffer = await file.arrayBuffer();
      const format = file.name.endsWith('.docx') ? 'docx' : file.name.endsWith('.pdf') ? 'pdf' : file.name.endsWith('.tex') ? 'latex' : 'markdown';

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to parse document');
      }

      console.log('Document parsed successfully');
      setDocument(data.document);

      // Save document to localStorage
      saveDocument(data.document);

      // Store original file in IndexedDB for format-preserving export
      const originalDoc: OriginalDocument = {
        documentId: data.document.id,
        fileBuffer,
        fileName: file.name,
        format,
        uploadedAt: new Date()
      };
      await saveOriginalFile(originalDoc);
      setOriginalFile(originalDoc);

      // Initialize edit history
      const history: EditHistory = {
        documentId: data.document.id,
        edits: []
      };
      saveEditHistory(history);
      setEditHistory(history);

      // If current chat exists and has no messages, reuse it
      if (currentChat && currentChat.messages.length === 0) {
        const renamedChat = {
          ...currentChat,
          title: file.name,
          documentId: data.document.id,
          updatedAt: new Date()
        };
        const updatedChats = chats.map(c => c.id === currentChat.id ? renamedChat : c);
        setChats(updatedChats);
        setCurrentChat(renamedChat);
        saveChats(updatedChats);
      } else {
        // Create a new chat for this document
        const newChat = createChat(file.name, data.document.id);
        const updatedChats = [newChat, ...chats];
        setChats(updatedChats);
        setCurrentChat(newChat);
        saveChats(updatedChats);
      }

      // Show setup modal for new documents
      setShowSetupModal(true);

    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle resume paste
  const handleResumePaste = async () => {
    if (!resumePasteText.trim()) return;

    try {
      setIsUploading(true);
      setError(null);
      setShowResumePasteModal(false);

      // Create a text file from pasted content
      const blob = new Blob([resumePasteText], { type: 'text/plain' });
      const file = new File([blob], 'pasted-resume.txt', { type: 'text/plain' });

      await handleFileUpload(file);
      setResumePasteText('');
    } catch (error) {
      console.error('Error processing pasted resume:', error);
      setError(error instanceof Error ? error.message : 'Failed to process pasted resume');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle send message
  const handleSendMessage = async (messageText: string, customPrompt?: string) => {
    if (!document || !currentChat) {
      setError('No document or chat selected');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create user message
      const userMessage: Message = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content: messageText,
        timestamp: new Date()
      };

      // Add user message to chat
      const updatedChat = {
        ...currentChat,
        messages: [...currentChat.messages, userMessage],
        updatedAt: new Date()
      };

      setCurrentChat(updatedChat);

      // Update chats array
      const updatedChats = chats.map(c =>
        c.id === currentChat.id ? updatedChat : c
      );
      setChats(updatedChats);
      saveChats(updatedChats);

      // Send to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          document,
          chatHistory: currentChat.messages,
          customPrompt: customPrompt || undefined,
          customApiKey: customApiKey || undefined
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Create assistant message
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        citations: data.citations,
        actions: data.actions
      };

      // Update chat with assistant message
      const finalChat = {
        ...updatedChat,
        messages: [...updatedChat.messages, assistantMessage],
        updatedAt: new Date()
      };

      setCurrentChat(finalChat);

      // Update chats array again
      const finalChats = chats.map(c =>
        c.id === currentChat.id ? finalChat : c
      );
      setChats(finalChats);
      saveChats(finalChats);

      // Update document if modified
      if (data.document) {
        setDocument(data.document);
        saveDocument(data.document);

        // Track edits
        if (data.actions && editHistory) {
          const newEdits = data.actions
            .filter((action: any) => action.type === 'edit' && action.success && action.details?.modifiedLines)
            .flatMap((action: any) => {
              const modifiedLines = action.details.modifiedLines as number[];
              return modifiedLines.map((lineNum: number) => {
                const oldLine = document.lines.find(l => l.lineNumber === lineNum);
                const newLine = data.document.lines.find((l: Line) => l.lineNumber === lineNum);

                return {
                  lineNumber: lineNum,
                  originalText: oldLine?.text || '',
                  newText: newLine?.text || '',
                  timestamp: new Date(),
                  operation: action.details.operation as 'replace' | 'insert' | 'delete'
                };
              });
            });

          if (newEdits.length > 0) {
            const updatedHistory: EditHistory = {
              ...editHistory,
              edits: [...editHistory.edits, ...newEdits]
            };
            setEditHistory(updatedHistory);
            saveEditHistory(updatedHistory);
          }
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle line lock toggle
  const handleLineToggleLock = (line: Line) => {
    if (!document) return;

    const updatedLines = document.lines.map(l =>
      l.lineNumber === line.lineNumber
        ? { ...l, isLocked: !l.isLocked }
        : l
    );

    const updatedDocument = {
      ...document,
      lines: updatedLines
    };

    setDocument(updatedDocument);
    saveDocument(updatedDocument);
  };

  // Handle new chat
  const handleNewChat = () => {
    const newChat = createChat('New Chat', undefined);
    const updatedChats = [newChat, ...chats];
    setChats(updatedChats);
    setCurrentChat(newChat);
    setDocument(null);
    saveChats(updatedChats);
  };

  // Handle select chat
  const handleSelectChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChat(chat);

      // Load associated document
      if (chat.documentId && chat.documentId !== document?.id) {
        const doc = loadDocument(chat.documentId);
        if (doc) {
          setDocument(doc);
        }
      }
    }
  };

  // Handle delete chat
  const handleDeleteChat = (chatId: string) => {
    const updatedChats = chats.filter(c => c.id !== chatId);
    setChats(updatedChats);
    saveChats(updatedChats);

    if (currentChat?.id === chatId) {
      setCurrentChat(null);
    }
  };

  // Handle export (PDF only - LaTeX export removed as requested)
  const handleExport = async (format: 'docx' | 'pdf' | 'markdown') => {
    if (!document) {
      setError('No document to export');
      return;
    }

    try {
      setError(null);
      await exportDocument(document, format);
    } catch (error) {
      console.error('Error exporting document:', error);
      setError(error instanceof Error ? error.message : 'Failed to export document');
    }
  };

  // Handle format-preserving export
  const handleFormatPreservingExport = async (format: 'docx' | 'pdf' | 'markdown') => {
    if (!document) {
      setError('No document to export');
      return;
    }

    try {
      setError(null);

      const original = originalFile || await loadOriginalFile(document.id);
      const history = editHistory || loadEditHistory(document.id);

      if (original && history && history.edits.length > 0) {
        setShowPreviewModal(true);
      } else {
        await exportDocument(document, format);
      }
    } catch (error) {
      console.error('Error opening preview:', error);
      setError(error instanceof Error ? error.message : 'Failed to open preview');
    }
  };

  // Handle download from preview
  const handleDownloadFromPreview = async () => {
    if (!document || !originalFile || !editHistory) {
      setError('Missing document data');
      return;
    }

    try {
      setError(null);
      await exportDocumentPreserveFormat(document, originalFile, editHistory);
    } catch (error) {
      console.error('Error exporting document:', error);
      setError(error instanceof Error ? error.message : 'Failed to export document');
    }
  };

  // Handle auto-lock
  const handleAutoLock = () => {
    if (!document) return;

    const updatedLines = document.lines.map(line => ({
      ...line,
      isLocked: !line.isPlaceholder
    }));

    const updatedDocument = {
      ...document,
      lines: updatedLines
    };

    setDocument(updatedDocument);
    saveDocument(updatedDocument);
  };

  // Handle LLM detection
  const handleRunLLMDetection = async () => {
    if (!document) return;

    try {
      setIsRunningLLMDetection(true);
      setError(null);

      const linesData = document.lines.map(line => ({
        lineNumber: line.lineNumber,
        text: line.text
      }));

      const response = await fetch('/api/detect-placeholders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines: linesData,
          customApiKey: customApiKey || undefined
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to detect placeholders');
      }

      const updatedLines = document.lines.map(line => {
        const llmResult = data.results[line.lineNumber];
        if (llmResult) {
          return {
            ...line,
            isPlaceholder: llmResult.isPlaceholder,
            placeholderNames: llmResult.placeholderNames.length > 0 ? llmResult.placeholderNames : undefined
          };
        }
        return line;
      });

      const updatedDocument = {
        ...document,
        lines: updatedLines
      };

      setDocument(updatedDocument);
      saveDocument(updatedDocument);

    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to run LLM detection');
    } finally {
      setIsRunningLLMDetection(false);
    }
  };

  // Handle API key change
  const handleApiKeyChange = (apiKey: string) => {
    setCustomApiKey(apiKey);
    if (typeof window !== 'undefined') {
      localStorage.setItem('resume-craft-pro-custom-api-key', apiKey);
    }
  };

  // Handle API key clear
  const handleClearApiKey = () => {
    setCustomApiKey(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('resume-craft-pro-custom-api-key');
    }
  };

  // Handle keyword analysis
  const handleAnalyzeKeywords = async () => {
    if (!contextFiles.resume || !jobDescription.trim()) {
      setError('Please upload resume and provide job description');
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);

      const response = await fetch('/api/analyze-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: contextFiles.resume.content,
          jobDescription: jobDescription.trim(),
          customApiKey: customApiKey || undefined
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to analyze keywords');
      }

      setKeywordAnalysis(data.analysis);
      setTokenUsage(data.tokenUsage || null);

    } catch (error) {
      console.error('Error analyzing keywords:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze keywords');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle resume optimization
  const handleOptimizeResume = async () => {
    if (!contextFiles.resume || !jobDescription.trim()) {
      setError('Please upload resume and provide job description');
      return;
    }

    try {
      setIsOptimizing(true);
      setError(null);

      const response = await fetch('/api/optimize-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: contextFiles.resume.content,
          jobDescription: jobDescription.trim(),
          config: optimizationConfig,
          customInstructions: customInstructions || undefined,
          customApiKey: customApiKey || undefined
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to optimize resume');
      }

      // Update context files with optimized resume
      setContextFiles({
        ...contextFiles,
        resume: {
          ...contextFiles.resume!,
          content: data.optimizedResume
        }
      });

      setTokenUsage(data.tokenUsage || null);

      // Show success message
      alert('Resume optimized successfully! Review the changes in the document viewer.');

    } catch (error) {
      console.error('Error optimizing resume:', error);
      setError(error instanceof Error ? error.message : 'Failed to optimize resume');
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between relative">
          {/* Left - Title with Logo and Settings */}
          <div className="flex items-center gap-3 flex-1">
            <Image
              src="/images/title.png"
              alt="Resume-Craft-Pro Logo"
              width={48}
              height={48}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Resume-Craft-Pro</h1>
              <p className="text-sm text-gray-700">AI-Powered Resume Optimization</p>
            </div>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="ml-2 p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Center - Upload Button */}
          <div className="flex-1 flex justify-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
              <Upload className="w-5 h-5" />
              <span className="font-medium">
                {isUploading ? 'Uploading...' : 'Upload Document'}
              </span>
              <input
                type="file"
                accept=".docx,.pdf,.md,.txt,.tex"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
                disabled={isUploading}
              />
            </label>
            <button
              onClick={() => setShowResumePasteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">Paste Resume</span>
            </button>
          </div>

          {/* Right - Portfolio Button with Hover Effect */}
          <div className="flex-1 flex justify-end">
            <div className="group relative">
              <a
                href="https://portfolio-pranav-mishra-paranoid.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {/* Profile Image with Puff Effect */}
                <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-gray-300 group-hover:border-blue-500 group-hover:scale-110 transition-all duration-300">
                  <Image
                    src="/images/me.jpg"
                    alt="Pranav Mishra"
                    width={56}
                    height={56}
                    className="object-cover"
                  />
                </div>

                {/* Sliding Text with Gradient Background */}
                <div className="absolute top-0 right-full h-14 flex items-center pointer-events-none pr-3">
                  <div
                    className="h-10 bg-gradient-to-r from-red-500 via-blue-600 to-black opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out rounded-full px-5 flex items-center whitespace-nowrap -translate-x-8 group-hover:translate-x-0 shadow-lg"
                    style={{
                      backgroundSize: '200% 100%'
                    }}
                  >
                    <span className="text-white font-bold text-sm drop-shadow-lg">
                      PRANAV MISHRA - View more of my work →
                    </span>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden pb-10">
        {/* Left Sidebar - Chat History + Context Files */}
        <div className="flex flex-col w-72 border-r border-gray-200 bg-gray-50">
          {/* Chat History */}
          <div className="flex-shrink-0 h-1/2 border-b border-gray-200">
            <ChatHistory
              chats={chats}
              currentChatId={currentChat?.id}
              onSelectChat={handleSelectChat}
              onNewChat={handleNewChat}
              onDeleteChat={handleDeleteChat}
            />
          </div>

          {/* Context Files Manager */}
          <div className="flex-1 overflow-y-auto">
            {showContextFiles ? (
              <div className="h-full flex flex-col">
                <div className="flex-shrink-0 p-4 bg-white border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-blue-600" />
                    Context Files
                  </h3>
                  <button
                    onClick={() => setShowContextFiles(false)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Collapse"
                  >
                    <ChevronUp className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <ContextFileManager
                    files={contextFiles}
                    onFilesChange={setContextFiles}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <button
                  onClick={() => setShowContextFiles(true)}
                  className="flex flex-col items-center gap-2 p-4 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Plus className="w-6 h-6 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">Show Context Files</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center - Document Viewer */}
        <div className="flex-1">
          <DocumentViewer
            document={document}
            onLineToggleLock={handleLineToggleLock}
            onExport={handleExport}
            onFormatPreservingExport={handleFormatPreservingExport}
            hasEdits={editHistory ? editHistory.edits.length > 0 : false}
            onUpload={handleFileUpload}
            isUploading={isUploading}
            selectedLine={selectedLine}
            onLineSelect={setSelectedLine}
            onRunLLMDetection={handleRunLLMDetection}
            isRunningLLMDetection={isRunningLLMDetection}
          />
        </div>

        {/* Right Sidebar - JD + Keywords + Optimization + Chat */}
        <div className="flex-shrink-0 relative" style={{ width: `${chatWidth}px` }}>
          {/* Resize Handle */}
          <div
            onMouseDown={() => setIsResizingChat(true)}
            className={`absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors z-20 ${
              isResizingChat ? 'bg-blue-500' : ''
            }`}
            title="Drag to resize"
          />

          <div className="h-full flex flex-col overflow-y-auto bg-white">
            {/* Job Description Input */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-600" />
                  Job Description
                </h3>
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here...

Include:
- Required skills and technologies
- Qualifications
- Responsibilities"
                className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm text-gray-900"
              />
              <p className="text-xs text-gray-700 mt-1">
                {jobDescription.length > 0 ? `${jobDescription.length} characters` : 'Required for optimization'}
              </p>
              {jobDescription.length > 0 && (
                <button
                  onClick={handleAnalyzeKeywords}
                  disabled={isAnalyzing || !contextFiles.resume}
                  className="mt-2 w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Keywords'}
                </button>
              )}
            </div>

            {/* Keyword Analysis */}
            {showOptimizationPanel && (
              <div className="flex-shrink-0 p-4 border-b border-gray-200">
                <KeywordAnalysisPanel
                  analysis={keywordAnalysis}
                  isAnalyzing={isAnalyzing}
                  onAnalyze={handleAnalyzeKeywords}
                  onOptimize={handleOptimizeResume}
                  isOptimizing={isOptimizing}
                />
              </div>
            )}

            {/* Optimization Controls */}
            {showOptimizationPanel && (
              <div className="flex-shrink-0 p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Optimization</h3>
                  <button
                    onClick={() => setShowOptimizationPanel(false)}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <ChevronUp className="w-4 h-4" />
                    Collapse
                  </button>
                </div>
                <OptimizationControls
                  jobDescription={jobDescription}
                  onJobDescriptionChange={setJobDescription}
                  customInstructions={customInstructions}
                  onCustomInstructionsChange={setCustomInstructions}
                  config={optimizationConfig}
                  onConfigChange={setOptimizationConfig}
                  onOptimize={handleOptimizeResume}
                  isOptimizing={isOptimizing}
                  canOptimize={!!contextFiles.resume && jobDescription.trim().length > 0}
                />
              </div>
            )}

            {!showOptimizationPanel && (
              <div className="flex-shrink-0 p-4 border-b border-gray-200 flex justify-center">
                <button
                  onClick={() => setShowOptimizationPanel(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                  Show Optimization
                </button>
              </div>
            )}

            {/* Token Counter */}
            {tokenUsage && (
              <div className="flex-shrink-0 p-4 border-b border-gray-200">
                <TokenCounter
                  sessionId={sessionId}
                  tokenUsage={tokenUsage}
                  isCompact={true}
                />
              </div>
            )}

            {/* Chat Interface */}
            {showChatPanel && (
              <div className="flex-1 flex flex-col">
                <div className="flex-shrink-0 p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Chat</h3>
                  <button
                    onClick={() => setShowChatPanel(false)}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <ChevronUp className="w-4 h-4" />
                    Hide
                  </button>
                </div>
                <div className="flex-1">
                  <ChatInterface
                    messages={currentChat?.messages || []}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            )}

            {!showChatPanel && (
              <div className="flex-shrink-0 p-4 flex justify-center">
                <button
                  onClick={() => setShowChatPanel(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                  Show Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        document={document}
        selectedLine={selectedLine}
        onRunLLMDetection={handleRunLLMDetection}
        isRunningLLMDetection={isRunningLLMDetection}
      />

      {/* Initial Setup Modal */}
      {document && (
        <InitialSetupModal
          isOpen={showSetupModal}
          onClose={() => setShowSetupModal(false)}
          onAutoLock={handleAutoLock}
          placeholderCount={document.lines.filter(line => line.isPlaceholder).length}
          totalLines={document.lines.length}
        />
      )}

      {/* Format-Preserving Export Preview Modal */}
      {document && originalFile && editHistory && (
        <FormatPreservePreview
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          document={document}
          originalFile={originalFile}
          editHistory={editHistory}
          onDownload={handleDownloadFromPreview}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        chats={chats}
        customApiKey={customApiKey}
        onApiKeyChange={handleApiKeyChange}
        onClearApiKey={handleClearApiKey}
      />

      {/* Resume Paste Modal */}
      {showResumePasteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Paste Resume Text</h2>
              <button
                onClick={() => setShowResumePasteModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            <div className="p-6">
              <textarea
                value={resumePasteText}
                onChange={(e) => setResumePasteText(e.target.value)}
                placeholder="Paste your resume text here (LaTeX, plain text, or markdown)..."
                className="w-full h-96 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm text-gray-900 font-mono"
              />
              <p className="text-xs text-gray-700 mt-2">
                {resumePasteText.length} characters
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowResumePasteModal(false);
                  setResumePasteText('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResumePaste}
                disabled={!resumePasteText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Process Resume
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
