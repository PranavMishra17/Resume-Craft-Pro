'use client';

/**
 * Resume-Craft-Pro - Chat Interface
 * AI-Powered Resume Optimization with LaTeX/DOCX Support
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
import InitialSetupModal from '@/components/modals/InitialSetupModal';
import FormatPreservePreview from '@/components/document/FormatPreservePreview';
import SettingsModal from '@/components/modals/SettingsModal';
import StatusBar from '@/components/layout/StatusBar';
import TokenCounter from '@/components/resume/TokenCounter';
import ResumeUploadModal from '@/components/modals/ResumeUploadModal';
import TabbedLeftPanel from '@/components/sidebar/TabbedLeftPanel';
import JobDescriptionPanel from '@/components/resume/JobDescriptionPanel';
import EnhancedKeywordAnalysis from '@/components/resume/EnhancedKeywordAnalysis';
import SimplifiedOptimizationControls from '@/components/resume/SimplifiedOptimizationControls';
import ContextFilesModal from '@/components/modals/ContextFilesModal';
import { Upload, AlertCircle, Settings, Plus } from 'lucide-react';

// NEW: Resume editor imports
import { Resume } from '@/types/resume';
import ResumeEditorLayout from '@/components/editors/ResumeEditorLayout';

export default function ChatPage() {
  const searchParams = useSearchParams();

  const [document, setDocument] = useState<Document | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [selectedLine, setSelectedLine] = useState<Line | null>(null);

  // NEW: Resume editor state
  const [parsedResume, setParsedResume] = useState<Resume | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);

  // Edit tracking state
  const [editHistory, setEditHistory] = useState<EditHistory | null>(null);
  const [originalFile, setOriginalFile] = useState<OriginalDocument | null>(null);

  // Preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [customApiKey, setCustomApiKey] = useState<string | null>(null);

  // Context files modal state
  const [showContextModal, setShowContextModal] = useState(false);

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
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [sessionId] = useState(`session-${Date.now()}`);

  // NEW: Modal and UI state for revamped interface
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [hasResumeUploaded, setHasResumeUploaded] = useState(false);

  // NEW: Panel collapse state
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isJDPanelCollapsed, setIsJDPanelCollapsed] = useState(false);
  const [isKeywordPanelCollapsed, setIsKeywordPanelCollapsed] = useState(false);
  const [isOptimizationPanelCollapsed, setIsOptimizationPanelCollapsed] = useState(false);

  // NEW: Job field state
  const [jobField, setJobField] = useState('all');

  // NEW: Keywords state
  const [jdKeywords, setJdKeywords] = useState<string[]>([]);
  const [resumeKeywords, setResumeKeywords] = useState<string[]>([]);
  const [disabledKeywords, setDisabledKeywords] = useState<string[]>([]);
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');

  // Load chats and handle URL params on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedChats = loadChats();
    setChats(storedChats);

    // Check URL params
    const isNewChat = searchParams.get('new') === 'true';
    const shouldShowSettings = searchParams.get('settings') === 'true';

    console.log('[CHAT] URL params:', { isNewChat, shouldShowSettings });

    if (isNewChat) {
      // Create new chat and show resume modal
      console.log('[CHAT] Starting new chat from URL');
      const newChat = createChat('New Chat', undefined);
      const updatedChats = [newChat, ...storedChats];
      setChats(updatedChats);
      setCurrentChat(newChat);
      setDocument(null);
      saveChats(updatedChats);
      setShowResumeModal(true);
    } else if (storedChats.length > 0) {
      // Load most recent chat
      const mostRecentChat = storedChats[0];
      setCurrentChat(mostRecentChat);

      // Try to load the associated document
      if (mostRecentChat.documentId) {
        const doc = loadDocument(mostRecentChat.documentId);
        if (doc) {
          setDocument(doc);
          setHasResumeUploaded(true);
        }
      }

      // Load context files from chat
      if (mostRecentChat.contextFiles) {
        setContextFiles(prev => ({
          ...prev,
          projects: mostRecentChat.contextFiles?.projects,
          portfolio: mostRecentChat.contextFiles?.portfolio
        }));
        console.log('[CHAT] Loaded context files from most recent chat:', mostRecentChat.contextFiles);
      }
    }

    if (shouldShowSettings) {
      setShowSettingsModal(true);
    }

    // Load custom API key if exists
    const storedApiKey = localStorage.getItem('resume-craft-pro-custom-api-key');
    if (storedApiKey) {
      setCustomApiKey(storedApiKey);
    }

    // Load job field and keywords from localStorage
    const savedJobField = localStorage.getItem('resume-craft-pro-job-field');
    if (savedJobField) setJobField(savedJobField);

    const savedDisabled = localStorage.getItem('resume-craft-pro-disabled-keywords');
    if (savedDisabled) {
      try {
        setDisabledKeywords(JSON.parse(savedDisabled));
      } catch (e) {
        console.error('[STORAGE] Failed to parse disabled keywords:', e);
      }
    }

    const savedCustom = localStorage.getItem('resume-craft-pro-custom-keywords');
    if (savedCustom) {
      try {
        setCustomKeywords(JSON.parse(savedCustom));
      } catch (e) {
        console.error('[STORAGE] Failed to parse custom keywords:', e);
      }
    }
  }, [searchParams]);

  // Update hasResumeUploaded when document changes
  useEffect(() => {
    if (document) {
      setHasResumeUploaded(true);
      setShowResumeModal(false);
    } else {
      setHasResumeUploaded(false);
    }
  }, [document]);

  // Persist job field to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('resume-craft-pro-job-field', jobField);
  }, [jobField]);

  // Persist disabled keywords to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('resume-craft-pro-disabled-keywords', JSON.stringify(disabledKeywords));
    } catch (e) {
      console.error('[STORAGE] Failed to save disabled keywords:', e);
    }
  }, [disabledKeywords]);

  // Persist custom keywords to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('resume-craft-pro-custom-keywords', JSON.stringify(customKeywords));
    } catch (e) {
      console.error('[STORAGE] Failed to save custom keywords:', e);
    }
  }, [customKeywords]);

  // Auto-extract keywords when JD changes (with debounce)
  useEffect(() => {
    if (!jobDescription || !document) return;

    // Reset analyzed state when JD changes
    setIsAnalyzed(false);

    const extractKeywords = async () => {
      try {
        console.log('[KEYWORDS] Auto-extracting keywords from JD');

        // Extract resume content from lines
        const resumeContent = document.lines
          .map(line => line.text)
          .join('\n');

        const response = await fetch('/api/analyze-keywords', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resumeContent,
            resumeFormat: document.metadata.format,
            fileName: document.metadata.fileName || 'resume',
            jobDescription: jobDescription.trim(),
            jobField: jobField,
            sessionId: sessionId,
            customApiKey: customApiKey || undefined
          })
        });

        const data = await response.json();

        if (response.ok && data.analysis) {
          setJdKeywords(data.analysis.jdKeywords || []);
          setResumeKeywords(data.analysis.resumeKeywords || []);
          setIsAnalyzed(true);
          console.log('[KEYWORDS] Auto-extracted:', data.analysis.jdKeywords?.length, 'JD keywords');
        }
      } catch (error) {
        console.error('[KEYWORDS] Auto-extraction error:', error);
      }
    };

    const debounce = setTimeout(() => {
      extractKeywords();
    }, 1000);

    return () => clearTimeout(debounce);
  }, [jobDescription, document, jobField, sessionId, customApiKey]);

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setError(null);

      console.log('[UPLOAD] Uploading file:', file.name);

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

      console.log('[UPLOAD] Document parsed successfully');
      setDocument(data.document);

      // Save document to localStorage
      saveDocument(data.document);

      // Mark resume as uploaded
      setHasResumeUploaded(true);
      setShowResumeModal(false);

      // NEW: If it's a LaTeX file, also parse it for the editor
      if (file.name.endsWith('.tex')) {
        console.log('[UPLOAD] Parsing LaTeX resume for editor...');
        setIsParsingResume(true);

        const parseFormData = new FormData();
        parseFormData.append('file', file);

        try {
          const parseResponse = await fetch('/api/parse-resume', {
            method: 'POST',
            body: parseFormData,
          });

          if (parseResponse.ok) {
            const parseData = await parseResponse.json();
            if (parseData.success && parseData.resume) {
              setParsedResume(parseData.resume);
              console.log('[UPLOAD] LaTeX resume parsed for editor successfully');
            }
          } else {
            console.warn('[UPLOAD] Failed to parse LaTeX resume for editor');
          }
        } catch (parseError) {
          console.error('[UPLOAD] Error parsing LaTeX for editor:', parseError);
        } finally {
          setIsParsingResume(false);
        }
      }

      // Store original file in IndexedDB
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

      // Update current chat with document
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
      console.error('[UPLOAD] Error uploading file:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  // NEW: Handle resume upload from modal
  const handleResumeUploadFromModal = async (file: File) => {
    try {
      console.log('[MODAL] Uploading resume:', file.name);
      await handleFileUpload(file);
    } catch (error) {
      console.error('[MODAL] Resume upload error:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload resume');
    }
  };

  // NEW: Handle resume paste from modal
  const handleResumePasteFromModal = async (content: string, format: 'latex' | 'markdown' | 'text') => {
    try {
      console.log('[MODAL] Processing pasted resume, format:', format);
      setIsUploading(true);
      setError(null);

      const extensions = { latex: '.tex', markdown: '.md', text: '.txt' };
      const extension = extensions[format];
      const mimeType = format === 'latex' ? 'text/x-tex' : 'text/plain';

      const blob = new Blob([content], { type: mimeType });
      const file = new File([blob], `pasted-resume${extension}`, { type: mimeType });

      await handleFileUpload(file);
    } catch (error) {
      console.error('[MODAL] Resume paste error:', error);
      setError(error instanceof Error ? error.message : 'Failed to process pasted resume');
    } finally {
      setIsUploading(false);
    }
  };

  // NEW: Handle modal close - go back to homepage if no resume
  const handleResumeModalClose = () => {
    console.log('[MODAL] Closing modal');
    if (!hasResumeUploaded && !document) {
      // If no resume uploaded, could redirect to homepage
      // For now just close the modal
      setShowResumeModal(false);
    } else {
      setShowResumeModal(false);
    }
  };

  // NEW: Handle toggle keyword
  const handleToggleKeyword = (keyword: string) => {
    setDisabledKeywords(prev =>
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
    console.log('[KEYWORDS] Toggled keyword:', keyword);
  };

  // NEW: Handle add custom keyword
  const handleAddCustomKeyword = (keyword: string) => {
    const keywords = keyword.split(',').map(k => k.trim()).filter(k => k);
    const newKeywords = keywords.filter(k =>
      !customKeywords.includes(k) && !jdKeywords.includes(k)
    );
    if (newKeywords.length > 0) {
      setCustomKeywords(prev => [...prev, ...newKeywords]);
      console.log('[KEYWORDS] Added custom keywords:', newKeywords);
    }
  };

  // NEW: Handle remove custom keyword
  const handleRemoveCustomKeyword = (keyword: string) => {
    setCustomKeywords(prev => prev.filter(k => k !== keyword));
    console.log('[KEYWORDS] Removed custom keyword:', keyword);
  };

  // NEW: Handle save context files
  const handleSaveContextFiles = (files: { projects?: ContextFile; portfolio?: ContextFile }) => {
    console.log('[CONTEXT] Saving context files:', files);
    setContextFiles(prev => ({
      ...prev,
      ...files
    }));

    // Update current chat with context files
    if (currentChat) {
      const updatedChat = {
        ...currentChat,
        contextFiles: {
          ...currentChat.contextFiles,
          projects: files.projects,
          portfolio: files.portfolio
        },
        updatedAt: new Date()
      };
      const updatedChats = chats.map(c => c.id === currentChat.id ? updatedChat : c);
      setChats(updatedChats);
      setCurrentChat(updatedChat);
      saveChats(updatedChats);
      console.log('[CONTEXT] Context files saved to chat');
    }
  };

  // NEW: Handle analyze keywords (manual)
  const handleAnalyzeKeywords = async () => {
    if (!document || !jobDescription.trim()) {
      setError('Please upload resume and provide job description');
      return;
    }

    try {
      console.log('[KEYWORDS] Starting manual keyword analysis');
      setIsAnalyzing(true);
      setError(null);

      // Extract resume content from lines
      const resumeContent = document.lines
        .map(line => line.text)
        .join('\n');

      console.log('[KEYWORDS] Resume content length:', resumeContent.length);

      const response = await fetch('/api/analyze-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeContent,
          resumeFormat: document.metadata.format,
          fileName: document.metadata.fileName || 'resume',
          jobDescription: jobDescription.trim(),
          sessionId: sessionId,
          customApiKey: customApiKey || undefined
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to analyze keywords');
      }

      console.log('[KEYWORDS] Analysis complete:', data.analysis);

      // Update keywords state with API response
      if (data.analysis) {
        setJdKeywords(data.analysis.jdKeywords || []);
        setResumeKeywords(data.analysis.resumeKeywords || []);
        setIsAnalyzed(true);
      }

      // Also update old state for backwards compatibility
      setKeywordAnalysis(data.analysis);
      setTokenUsage(data.tokenUsage || null);

    } catch (error) {
      console.error('[KEYWORDS] Error analyzing keywords:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze keywords');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // NEW: Handle optimize with keywords
  const handleOptimizeWithKeywords = async () => {
    if (!document || !jobDescription.trim()) {
      setError('Please upload resume and provide job description');
      return;
    }

    if (jdKeywords.length === 0) {
      setError('Please analyze keywords first');
      return;
    }

    try {
      console.log('[OPTIMIZATION] Starting optimization with keywords');
      setIsOptimizing(true);
      setError(null);

      // Get active keywords (excluding disabled ones)
      const activeKeywords = [
        ...jdKeywords.filter(k => !disabledKeywords.includes(k)),
        ...customKeywords.filter(k => !disabledKeywords.includes(k))
      ];

      console.log('[OPTIMIZATION] Active keywords:', activeKeywords.length);

      // Extract resume content from lines
      const resumeContent = document.lines
        .map(line => line.text)
        .join('\n');

      const response = await fetch('/api/optimize-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeContent,
          resumeFormat: document.metadata.format,
          jobDescription: jobDescription.trim(),
          jobField,
          keywords: activeKeywords,
          sessionId: sessionId,
          customApiKey: customApiKey || undefined,
          config: {
            mode: 'targeted',
            maxConcurrentCalls: 5,
            preserveLength: true,
            maintainTone: true
          }
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to optimize resume');
      }

      // Update document with optimized content
      if (data.optimizedResume) {
        const optimizedDoc: Document = {
          ...document,
          lines: data.optimizedResume.lines || document.lines
        };
        setDocument(optimizedDoc);
        saveDocument(optimizedDoc);
      }

      setTokenUsage(data.tokenUsage || null);

      // Auto-collapse panels
      setIsJDPanelCollapsed(true);
      setIsOptimizationPanelCollapsed(true);
      setIsLeftPanelCollapsed(true);

      console.log('[OPTIMIZATION] Completed successfully');

    } catch (error) {
      console.error('[OPTIMIZATION] Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to optimize resume');
    } finally {
      setIsOptimizing(false);
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
        content: data.response,
        timestamp: new Date()
      };

      // Update chat with assistant message
      const finalChat = {
        ...updatedChat,
        messages: [...updatedChat.messages, assistantMessage],
        updatedAt: new Date()
      };

      setCurrentChat(finalChat);

      const finalChats = chats.map(c =>
        c.id === currentChat.id ? finalChat : c
      );
      setChats(finalChats);
      saveChats(finalChats);

      // Update document if changes were made
      if (data.document) {
        setDocument(data.document);
        saveDocument(data.document);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle line toggle lock
  const handleLineToggleLock = (lineNumber: number) => {
    if (!document) return;

    const updatedLines = document.lines.map(line =>
      line.lineNumber === lineNumber
        ? { ...line, isLocked: !line.isLocked }
        : line
    );

    const updatedDocument = { ...document, lines: updatedLines };
    setDocument(updatedDocument);
    saveDocument(updatedDocument);
  };

  // Handle new chat
  const handleNewChat = () => {
    console.log('[CHAT] Creating new chat');
    const newChat = createChat('New Chat', undefined);
    const updatedChats = [newChat, ...chats];
    setChats(updatedChats);
    setCurrentChat(newChat);
    setDocument(null);
    saveChats(updatedChats);
    setShowResumeModal(true);
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

      // Load context files from chat
      if (chat.contextFiles) {
        setContextFiles(prev => ({
          ...prev,
          projects: chat.contextFiles?.projects,
          portfolio: chat.contextFiles?.portfolio
        }));
        console.log('[CHAT] Loaded context files from chat:', chat.contextFiles);
      } else {
        // Clear context files if chat has none
        setContextFiles(prev => ({
          ...prev,
          projects: undefined,
          portfolio: undefined
        }));
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

  // Handle export
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

  // Handle format preserving export
  const handleFormatPreservingExport = () => {
    if (!document || !originalFile) {
      setError('No original file available for format-preserving export');
      return;
    }

    setShowPreviewModal(true);
  };

  // Handle download from preview
  const handleDownloadFromPreview = async () => {
    if (!document || !originalFile) return;

    try {
      await exportDocumentPreserveFormat(document, originalFile);
      setShowPreviewModal(false);
    } catch (error) {
      console.error('Error in format-preserving export:', error);
      setError(error instanceof Error ? error.message : 'Failed to export document');
    }
  };

  // NEW: Handle resume source updates from editor
  const handleResumeSave = async (updatedSource: string) => {
    if (!parsedResume) return;

    // Update the parsed resume
    const updatedResume = {
      ...parsedResume,
      rawSource: updatedSource,
      updatedAt: new Date(),
    };

    setParsedResume(updatedResume);
    console.log('[CHAT] Resume source updated');
  };

  // Handle run LLM detection
  const handleRunLLMDetection = async () => {
    if (!document) {
      setError('No document loaded');
      return;
    }

    try {
      setIsRunningLLMDetection(true);
      setError(null);

      const response = await fetch('/api/detect-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: document.content,
          customApiKey: customApiKey || undefined
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to detect AI content');
      }

      // Show results in a simple alert for now
      alert(`AI Detection Results:\n\nLikelihood: ${data.likelihood}\nConfidence: ${data.confidence}%\n\nDetails: ${data.details}`);

    } catch (error) {
      console.error('Error running AI detection:', error);
      setError(error instanceof Error ? error.message : 'Failed to detect AI content');
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

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-950">
      {/* Resume Upload Modal - Shows when ?new=true or no document */}
      <ResumeUploadModal
        isOpen={showResumeModal && !hasResumeUploaded}
        onClose={handleResumeModalClose}
        onUpload={handleResumeUploadFromModal}
        onPaste={handleResumePasteFromModal}
      />

      {/* Header - Only show after resume uploaded */}
      {hasResumeUploaded && (
        <header className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resume-Craft-Pro</h1>
                <p className="text-sm text-gray-800 dark:text-gray-300">AI-Powered Resume Optimization</p>
              </div>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="ml-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5 text-gray-800 dark:text-gray-300" />
              </button>
            </div>

            {/* Center - Upload Button */}
            <div className="flex-1 flex justify-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                <Upload className="w-5 h-5" />
                <span className="font-medium">
                  {isUploading ? 'Uploading...' : 'Re-upload Resume'}
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
                onClick={() => setShowContextModal(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  contextFiles.projects || contextFiles.portfolio
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white shadow-lg shadow-yellow-500/30'
                    : 'border-2 border-dashed border-yellow-500/60 bg-transparent text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                }`}
                title={contextFiles.projects || contextFiles.portfolio
                  ? "Edit context files (active)"
                  : "Add context files (projects/portfolio)"}
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Add Context</span>
              </button>
            </div>

            {/* Right - Portfolio Button */}
            <div className="flex-1 flex justify-end">
              <div className="group relative">
                <a
                  href="https://portfolio-pranav-mishra-paranoid.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-gray-300 group-hover:border-blue-500 group-hover:scale-110 transition-all duration-300">
                    <Image
                      src="/images/me.jpg"
                      alt="Pranav Mishra"
                      width={56}
                      height={56}
                      className="object-cover"
                    />
                  </div>

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
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
              >
                ×
              </button>
            </div>
          )}
        </header>
      )}

      {/* Main Content - Only show after resume uploaded */}
      {hasResumeUploaded && (
        <div className="flex-1 flex overflow-hidden pb-10">
          {/* Left Panel - Tabbed (Chat History + Context Files) */}
          <TabbedLeftPanel
            chats={chats}
            currentChat={currentChat}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
            onDeleteChat={handleDeleteChat}
            contextFiles={contextFiles}
            onFilesChange={setContextFiles}
            isCollapsed={isLeftPanelCollapsed}
            onToggleCollapse={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
          />

          {/* Center - Document Viewer / Resume Editor */}
          <div className="flex-1">
            {parsedResume && parsedResume.sourceFormat === 'latex' ? (
              <ResumeEditorLayout
                resume={parsedResume}
                onSave={handleResumeSave}
                onExport={(format) => {
                  if (format === 'tex') handleExport('markdown');
                }}
              />
            ) : (
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
                onRunLLMDetection={() => {}}
                isRunningLLMDetection={false}
              />
            )}
          </div>

          {/* Right Panel - JD, Keywords, Optimization, Chat */}
          <div className="w-96 flex flex-col border-l border-gray-200 dark:border-gray-700 overflow-y-auto bg-white dark:bg-gray-900">
            {/* Job Description Panel */}
            {!isJDPanelCollapsed && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <JobDescriptionPanel
                  jobDescription={jobDescription}
                  jobField={jobField}
                  onJobDescriptionChange={setJobDescription}
                  onJobFieldChange={setJobField}
                  isAnalyzed={isAnalyzed}
                />
              </div>
            )}

            {/* Enhanced Keyword Analysis */}
            {!isKeywordPanelCollapsed && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <EnhancedKeywordAnalysis
                  jdKeywords={jdKeywords}
                  resumeKeywords={resumeKeywords}
                  disabledKeywords={disabledKeywords}
                  customKeywords={customKeywords}
                  onToggleKeyword={handleToggleKeyword}
                  onAddCustomKeyword={handleAddCustomKeyword}
                  onRemoveCustomKeyword={handleRemoveCustomKeyword}
                />
              </div>
            )}

            {/* Simplified Optimization Controls */}
            {!isOptimizationPanelCollapsed && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <SimplifiedOptimizationControls
                  onOptimize={handleOptimizeWithKeywords}
                  disabled={!jobDescription}
                  isOptimizing={isOptimizing}
                  customInstructions={customInstructions}
                  onCustomInstructionsChange={setCustomInstructions}
                />
              </div>
            )}

            {/* Token Counter */}
            {tokenUsage && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <TokenCounter usage={tokenUsage} />
              </div>
            )}

            {/* Chat Interface */}
            <div className="flex-1 flex flex-col">
              <ChatInterface
                messages={currentChat?.messages || []}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                selectedLine={selectedLine}
              />
            </div>
          </div>
        </div>
      )}

      {/* Initial Setup Modal */}
      <InitialSetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
      />

      {/* Format Preserve Preview Modal */}
      {showPreviewModal && document && originalFile && (
        <FormatPreservePreview
          document={document}
          originalFile={originalFile}
          onClose={() => setShowPreviewModal(false)}
          onDownload={handleDownloadFromPreview}
        />
      )}

      {/* Settings Modal - Available from both homepage and chat interface */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        chats={chats}
        customApiKey={customApiKey}
        onApiKeyChange={handleApiKeyChange}
        onClearApiKey={handleClearApiKey}
      />

      {/* Context Files Modal */}
      <ContextFilesModal
        isOpen={showContextModal}
        onClose={() => setShowContextModal(false)}
        contextFiles={contextFiles}
        onSave={handleSaveContextFiles}
      />

      {/* Status Bar */}
      <StatusBar
        document={document}
        currentChat={currentChat}
        isLoading={isLoading}
      />
    </div>
  );
}
