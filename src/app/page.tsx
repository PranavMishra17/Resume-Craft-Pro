'use client';

/**
 * Resume-Craft-Pro - Complete Application
 * Document editing + Resume optimization
 */

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Document, Line, Message, Chat, EditHistory, OriginalDocument } from '@/lib/parsers/types';
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
  const [chatWidth, setChatWidth] = useState(500); // Default 500px
  const [isResizingChat, setIsResizingChat] = useState(false);

  // Load chats and custom API key from localStorage on mount
  useEffect(() => {
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
      localStorage.setItem('resume-craft-pro-chat-width', chatWidth.toString());
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
      const format = file.name.endsWith('.docx') ? 'docx' : file.name.endsWith('.pdf') ? 'pdf' : 'markdown';

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

      // If current chat exists and has no messages, reuse it (rename it to filename)
      // Otherwise create a new chat
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

      // Send to API with optional custom prompt and API key
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

      // Update document if it was modified
      if (data.document) {
        setDocument(data.document);
        saveDocument(data.document);

        // Track edits for format-preserving export
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
            console.info(`[EDIT_TRACKING] Tracked ${newEdits.length} new edits`);
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
    // Create a new empty chat without document
    // User will see upload prompt in document viewer
    const newChat = createChat('New Chat', undefined);
    const updatedChats = [newChat, ...chats];
    setChats(updatedChats);
    setCurrentChat(newChat);
    setDocument(null); // Clear document to show upload prompt
    saveChats(updatedChats);
  };

  // Handle select chat
  const handleSelectChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChat(chat);

      // Load associated document if different
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

    // If current chat was deleted, clear it
    if (currentChat?.id === chatId) {
      setCurrentChat(null);
    }
  };

  // Handle export (regular - uses current preview state)
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

  // Handle format-preserving export (shows preview modal)
  const handleFormatPreservingExport = async (format: 'docx' | 'pdf' | 'markdown') => {
    if (!document) {
      setError('No document to export');
      return;
    }

    try {
      setError(null);

      // Load original file and edit history if not already loaded
      const original = originalFile || await loadOriginalFile(document.id);
      const history = editHistory || loadEditHistory(document.id);

      if (original && history && history.edits.length > 0) {
        // Show preview modal
        setShowPreviewModal(true);
      } else {
        // Fallback to regular export if no edits or original file
        console.info('[EXPORT] No edits or original file, using regular export');
        await exportDocument(document, format);
      }
    } catch (error) {
      console.error('Error opening preview:', error);
      setError(error instanceof Error ? error.message : 'Failed to open preview');
    }
  };

  // Handle actual download from preview modal
  const handleDownloadFromPreview = async () => {
    if (!document || !originalFile || !editHistory) {
      setError('Missing document data');
      return;
    }

    try {
      setError(null);
      console.info('[EXPORT] Using format-preserving export');
      await exportDocumentPreserveFormat(document, originalFile, editHistory);
    } catch (error) {
      console.error('Error exporting document:', error);
      setError(error instanceof Error ? error.message : 'Failed to export document');
    }
  };

  // Handle auto-lock non-placeholder lines
  const handleAutoLock = () => {
    if (!document) return;

    const updatedLines = document.lines.map(line => ({
      ...line,
      // Lock all lines that are NOT placeholders
      isLocked: !line.isPlaceholder
    }));

    const updatedDocument = {
      ...document,
      lines: updatedLines
    };

    setDocument(updatedDocument);
    saveDocument(updatedDocument);

    console.log('[AUTO_LOCK] Locked all non-placeholder lines');
  };

  // Handle LLM-powered placeholder detection
  const handleRunLLMDetection = async () => {
    if (!document) return;

    try {
      setIsRunningLLMDetection(true);
      setError(null);

      console.log('[LLM_DETECTION] Starting LLM-powered detection');

      // Prepare lines for API
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

      console.log(`[LLM_DETECTION] Detected ${data.placeholderCount} placeholder lines`);

      // Update document with LLM results
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

      console.log('[LLM_DETECTION] Document updated with LLM results');

    } catch (error) {
      console.error('[LLM_DETECTION] Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to run LLM detection');
    } finally {
      setIsRunningLLMDetection(false);
    }
  };

  // Handle API key change
  const handleApiKeyChange = (apiKey: string) => {
    setCustomApiKey(apiKey);
    localStorage.setItem('clausecraft-custom-api-key', apiKey);
    console.log('[API_KEY] Custom API key saved');
  };

  // Handle API key clear
  const handleClearApiKey = () => {
    setCustomApiKey(null);
    localStorage.removeItem('clausecraft-custom-api-key');
    console.log('[API_KEY] Cleared custom API key, using default');
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
              alt="ClauseCraft Logo"
              width={48}
              height={48}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ClauseCraft</h1>
              <p className="text-sm text-gray-600">Agentic Document Editor</p>
            </div>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="ml-2 p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Center - Upload Button */}
          <div className="flex-1 flex justify-center">
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
              <Upload className="w-5 h-5" />
              <span className="font-medium">
                {isUploading ? 'Uploading...' : 'Upload Document'}
              </span>
              <input
                type="file"
                accept=".docx,.pdf,.md,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>

          {/* Right - Personal Image with Hover Effect */}
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

                {/* Sliding Text with Wave Background */}
                <div className="absolute top-0 right-full h-14 flex items-center pointer-events-none pr-3">
                  <div
                    className="h-10 bg-gradient-to-r from-red-500 via-blue-600 to-black opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out rounded-full px-5 flex items-center whitespace-nowrap -translate-x-8 group-hover:translate-x-0 group-hover:animate-wave shadow-lg"
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
        {/* Left Sidebar - Chat History (Collapsible) */}
        <ChatHistory
          chats={chats}
          currentChatId={currentChat?.id}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
        />

        {/* Middle - Document Viewer */}
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

        {/* Right - Chat Interface */}
        <div className="flex-shrink-0 relative" style={{ width: `${chatWidth}px` }}>
          {/* Resize Handle */}
          <div
            onMouseDown={() => setIsResizingChat(true)}
            className={`absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors z-20 ${
              isResizingChat ? 'bg-blue-500' : ''
            }`}
            title="Drag to resize chat"
          />
          <ChatInterface
            messages={currentChat?.messages || []}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
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
    </div>
  );
}
