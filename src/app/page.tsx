/**
 * Main Page - Resume-Craft-Pro
 * AI-Powered Resume Optimization
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Resume,
  ContextFile,
  KeywordAnalysis,
  OptimizationConfig,
  BulletOptimization,
  TokenUsage
} from '@/lib/parsers/types';
import { getTokenTracker } from '@/lib/tracking/token-tracker';
import { exportToLaTeX, downloadLaTeX } from '@/lib/export/latex';
import ContextFileManager from '@/components/resume/ContextFileManager';
import KeywordAnalysisPanel from '@/components/resume/KeywordAnalysisPanel';
import TokenCounter from '@/components/resume/TokenCounter';
import OptimizationControls from '@/components/resume/OptimizationControls';
import LaTeXViewer from '@/components/resume/LaTeXViewer';
import { AlertCircle, Settings, FileText, Sparkles } from 'lucide-react';

export default function Home() {
  // Session ID for token tracking
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

  // Context files state
  const [contextFiles, setContextFiles] = useState<{
    resume?: ContextFile;
    projects?: ContextFile;
    portfolio?: ContextFile;
    jobDescription?: ContextFile;
  }>({});

  // Resume state
  const [resume, setResume] = useState<Resume | null>(null);
  const [optimizedResume, setOptimizedResume] = useState<Resume | null>(null);

  // Job description state
  const [jobDescription, setJobDescription] = useState('');

  // Custom instructions state
  const [customInstructions, setCustomInstructions] = useState('');

  // Keyword analysis state
  const [keywordAnalysis, setKeywordAnalysis] = useState<KeywordAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Optimization state
  const [optimizationResults, setOptimizationResults] = useState<BulletOptimization[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Token usage state
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);

  // Optimization config state
  const [optimizationConfig, setOptimizationConfig] = useState<OptimizationConfig>({
    mode: 'targeted',
    maxConcurrentCalls: 5,
    preserveLength: true,
    maintainTone: true,
    maxKeywordsPerBullet: 2,
    minConfidenceScore: 0.6
  });

  // Settings state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [customApiKey, setCustomApiKey] = useState<string | null>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // View state (latex or comparison)
  const [viewMode, setViewMode] = useState<'latex' | 'comparison'>('latex');

  // Load custom API key from localStorage on mount
  useEffect(() => {
    const storedApiKey = localStorage.getItem('resume-craft-pro-api-key');
    if (storedApiKey) {
      setCustomApiKey(storedApiKey);
    }

    // Initialize token tracker session
    const tracker = getTokenTracker();
    tracker.initSession(sessionId);
  }, [sessionId]);

  // Update token usage periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const tracker = getTokenTracker();
      const usage = tracker.getSessionUsage(sessionId);
      if (usage) {
        setTokenUsage(usage);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId]);

  // Handle context files change
  const handleContextFilesChange = async (files: typeof contextFiles) => {
    setContextFiles(files);

    // If resume file is uploaded, parse it
    if (files.resume && files.resume !== contextFiles.resume) {
      try {
        setError(null);

        // For now, store the resume content
        // Full parsing will happen during optimization
        console.info('[PAGE] Resume file uploaded:', files.resume.fileName);

        // If it's LaTeX, we can display it
        if (files.resume.fileName.endsWith('.tex')) {
          // Resume will be parsed during analysis/optimization
        }
      } catch (err) {
        console.error('[PAGE] Error processing resume:', err);
        setError(err instanceof Error ? err.message : 'Failed to process resume');
      }
    }

    // If job description file is uploaded, extract content
    if (files.jobDescription && files.jobDescription !== contextFiles.jobDescription) {
      setJobDescription(files.jobDescription.content);
    }
  };

  // Handle analyze keywords
  const handleAnalyzeKeywords = async () => {
    if (!contextFiles.resume) {
      setError('Please upload a resume first');
      return;
    }

    if (!jobDescription || jobDescription.trim().length === 0) {
      setError('Please provide a job description');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      console.info('[PAGE] Starting keyword analysis');

      const response = await fetch('/api/analyze-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeContent: contextFiles.resume.content,
          resumeFormat: 'latex',
          fileName: contextFiles.resume.fileName,
          jobDescription,
          sessionId,
          customApiKey: customApiKey || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Keyword analysis failed');
      }

      // Convert keywordFrequency from object to Map
      const analysis: KeywordAnalysis = {
        ...data.analysis,
        keywordFrequency: new Map(Object.entries(data.analysis.keywordFrequency))
      };

      setKeywordAnalysis(analysis);
      console.info('[PAGE] Keyword analysis complete:', analysis);

    } catch (err) {
      console.error('[PAGE] Keyword analysis error:', err);
      setError(err instanceof Error ? err.message : 'Keyword analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle optimize resume
  const handleOptimizeResume = async () => {
    if (!contextFiles.resume) {
      setError('Please upload a resume first');
      return;
    }

    if (!jobDescription || jobDescription.trim().length === 0) {
      setError('Please provide a job description');
      return;
    }

    setIsOptimizing(true);
    setError(null);

    try {
      console.info('[PAGE] Starting resume optimization');

      const response = await fetch('/api/optimize-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeContent: contextFiles.resume.content,
          resumeFormat: 'latex',
          fileName: contextFiles.resume.fileName,
          jobDescription,
          projects: contextFiles.projects?.content,
          portfolio: contextFiles.portfolio?.content,
          customInstructions: customInstructions || undefined,
          config: optimizationConfig,
          sessionId,
          customApiKey: customApiKey || undefined
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Optimization failed');
      }

      console.info('[PAGE] Optimization complete:', data);

      // Update states
      setResume(data.optimizedResume);
      setOptimizedResume(data.optimizedResume);
      setOptimizationResults(data.changes);

      // Convert keywordFrequency from object to Map
      const finalAnalysis: KeywordAnalysis = {
        ...data.keywordAnalysis,
        keywordFrequency: new Map(Object.entries(data.keywordAnalysis.keywordFrequency || {}))
      };
      setKeywordAnalysis(finalAnalysis);

      // Switch to comparison view
      setViewMode('comparison');

    } catch (err) {
      console.error('[PAGE] Optimization error:', err);
      setError(err instanceof Error ? err.message : 'Optimization failed');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Handle export
  const handleExport = () => {
    if (!optimizedResume) {
      setError('No optimized resume to export');
      return;
    }

    try {
      const blob = exportToLaTeX(optimizedResume);
      downloadLaTeX(blob, contextFiles.resume?.fileName || 'resume');
      console.info('[PAGE] Resume exported successfully');
    } catch (err) {
      console.error('[PAGE] Export error:', err);
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  // Check if can optimize
  const canOptimize = contextFiles.resume && jobDescription.trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left - Title */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Resume-Craft-Pro
                </h1>
                <p className="text-sm text-gray-600">AI-Powered Resume Optimization</p>
              </div>
            </div>

            {/* Right - Settings & Profile */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>

              <a
                href="https://portfolio-pranav-mishra-paranoid.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
              >
                <span className="text-sm font-medium">View My Work</span>
              </a>
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
                className="text-red-600 hover:text-red-800 text-lg font-bold"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-[1800px] mx-auto w-full p-6">
        <div className="grid grid-cols-12 gap-6 h-full">
          {/* Left Sidebar - Context & Analysis */}
          <div className="col-span-3 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
            {/* Context File Manager */}
            <ContextFileManager
              files={contextFiles}
              onFilesChange={handleContextFilesChange}
            />

            {/* Keyword Analysis Panel */}
            <KeywordAnalysisPanel
              analysis={keywordAnalysis}
              isAnalyzing={isAnalyzing}
              onAnalyze={handleAnalyzeKeywords}
              onOptimize={handleOptimizeResume}
              isOptimizing={isOptimizing}
            />

            {/* Token Counter */}
            <TokenCounter
              sessionId={sessionId}
              tokenUsage={tokenUsage}
              isCompact={false}
            />
          </div>

          {/* Center - Document View */}
          <div className="col-span-6 space-y-4">
            {/* View Mode Toggle */}
            {optimizedResume && (
              <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('latex')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      viewMode === 'latex'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    LaTeX Source
                  </button>
                  <button
                    onClick={() => setViewMode('comparison')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      viewMode === 'comparison'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Changes ({optimizationResults.length})
                  </button>
                </div>

                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export LaTeX</span>
                </button>
              </div>
            )}

            {/* Document Display */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              {!contextFiles.resume && (
                <div className="h-[calc(100vh-250px)] flex flex-col items-center justify-center text-center p-8">
                  <Sparkles className="w-20 h-20 text-blue-300 mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Resume-Craft-Pro</h3>
                  <p className="text-gray-600 mb-6 max-w-md">
                    Upload your LaTeX resume and job description to optimize your resume with AI-powered keyword integration
                  </p>
                  <div className="flex flex-col gap-2 text-sm text-gray-500">
                    <p>✓ Intelligent keyword extraction</p>
                    <p>✓ Parallel bullet optimization</p>
                    <p>✓ Format preservation</p>
                    <p>✓ Token usage tracking</p>
                  </div>
                </div>
              )}

              {contextFiles.resume && viewMode === 'latex' && (
                <LaTeXViewer
                  content={optimizedResume?.latexSource || contextFiles.resume.content}
                  readOnly={true}
                  height="calc(100vh - 250px)"
                />
              )}

              {optimizedResume && viewMode === 'comparison' && (
                <div className="h-[calc(100vh-250px)] overflow-y-auto p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Optimization Results ({optimizationResults.length} bullets changed)
                  </h3>

                  {optimizationResults.map((result, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Line {result.lineNumber}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{result.tokensUsed} tokens</span>
                          <span className="text-xs text-green-600">
                            {Math.round(result.confidence * 100)}% confidence
                          </span>
                        </div>
                      </div>

                      {/* Original */}
                      <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                        <p className="text-xs font-medium text-red-700 mb-1">Original:</p>
                        <p className="text-sm text-gray-800">{result.originalText}</p>
                      </div>

                      {/* Optimized */}
                      <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                        <p className="text-xs font-medium text-green-700 mb-1">Optimized:</p>
                        <p className="text-sm text-gray-800">{result.optimizedText}</p>
                      </div>

                      {/* Added Keywords */}
                      <div className="flex flex-wrap gap-2">
                        {result.addedKeywords.map((keyword) => (
                          <span
                            key={keyword}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                          >
                            + {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Optimization Controls */}
          <div className="col-span-3 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
            <OptimizationControls
              jobDescription={jobDescription}
              onJobDescriptionChange={setJobDescription}
              customInstructions={customInstructions}
              onCustomInstructionsChange={setCustomInstructions}
              config={optimizationConfig}
              onConfigChange={setOptimizationConfig}
              onOptimize={handleOptimizeResume}
              isOptimizing={isOptimizing}
              canOptimize={!!canOptimize}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-[1800px] mx-auto px-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>© 2025 Resume-Craft-Pro by Pranav Mishra</p>
            <div className="flex items-center gap-4">
              <span>Session: {sessionId.slice(0, 12)}...</span>
              {tokenUsage && (
                <span className="font-medium text-blue-600">
                  {tokenUsage.totalTokens.toLocaleString()} tokens used
                </span>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
