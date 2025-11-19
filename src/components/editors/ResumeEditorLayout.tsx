'use client';

/**
 * Resume Editor Layout
 * Split view: LaTeX Editor (left) | PDF Preview (right)
 */

import { useState, useCallback, useEffect } from 'react';
import MonacoLatexEditor, { EditorToolbar } from './MonacoLatexEditor';
import PdfPreview from './PdfPreview';
import type { Resume } from '@/types/resume';
import { reconstructLatex } from '@/lib/parsers/latex-parser';
import { FileDown, AlertCircle } from 'lucide-react';

interface ResumeEditorLayoutProps {
  resume: Resume;
  onSave?: (updatedSource: string) => void;
  onExport?: (format: 'tex' | 'pdf') => void;
}

export default function ResumeEditorLayout({
  resume,
  onSave,
  onExport,
}: ResumeEditorLayoutProps) {
  const [latexSource, setLatexSource] = useState<string>(resume.rawSource);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [compilationError, setCompilationError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Track changes
  useEffect(() => {
    if (latexSource !== resume.rawSource) {
      setHasUnsavedChanges(true);
    }
  }, [latexSource, resume.rawSource]);

  // Preview PDF compilation
  const handlePreview = useCallback(async () => {
    setIsCompiling(true);
    setCompilationError(null);
    setShowPreview(true); // Show preview panel when compiling

    try {
      console.log('[EDITOR-LAYOUT] Compiling LaTeX...');

      const response = await fetch('/api/compile-latex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latexSource,
          validate: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Compilation failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Cleanup old URL
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }

      setPdfUrl(url);
      console.log('[EDITOR-LAYOUT] Compilation successful');
    } catch (error) {
      console.error('[EDITOR-LAYOUT] Compilation error:', error);
      setCompilationError(
        error instanceof Error ? error.message : 'Failed to compile LaTeX'
      );
    } finally {
      setIsCompiling(false);
    }
  }, [latexSource, pdfUrl]);

  // Save changes
  const handleSave = useCallback(async () => {
    setIsSaving(true);

    try {
      // Call parent save handler
      if (onSave) {
        await onSave(latexSource);
      }

      // Save to localStorage as backup
      localStorage.setItem(`resume_${resume.id}`, latexSource);

      setHasUnsavedChanges(false);
      console.log('[EDITOR-LAYOUT] Changes saved');

      // Show success notification
      showNotification('Changes saved successfully', 'success');
    } catch (error) {
      console.error('[EDITOR-LAYOUT] Save error:', error);
      showNotification('Failed to save changes', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [latexSource, resume.id, onSave]);

  // Export handler
  const handleExport = useCallback(
    (format: 'tex' | 'pdf') => {
      if (format === 'tex') {
        // Export LaTeX source
        const blob = new Blob([latexSource], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = resume.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (format === 'pdf' && pdfUrl) {
        // Export PDF (already compiled)
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = resume.fileName.replace('.tex', '.pdf');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        showNotification('Please compile PDF first', 'warning');
      }

      if (onExport) {
        onExport(format);
      }
    },
    [latexSource, pdfUrl, resume, onExport]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }

      // Ctrl/Cmd + P: Preview
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePreview();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handlePreview]);

  // Cleanup PDF URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <div className="flex flex-col h-screen">
      {/* Header with unsaved changes indicator */}
      {hasUnsavedChanges && (
        <div className="bg-yellow-100 dark:bg-yellow-900/20 border-b border-yellow-300 dark:border-yellow-800 px-4 py-2 flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-300">
          <AlertCircle className="w-4 h-4" />
          <span>You have unsaved changes</span>
          <button
            onClick={handleSave}
            className="ml-auto px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-xs"
          >
            Save Now
          </button>
        </div>
      )}

      {/* Toolbar */}
      <EditorToolbar
        onPreview={handlePreview}
        onSave={handleSave}
        onExport={() => handleExport('tex')}
        isCompiling={isCompiling}
        isSaving={isSaving}
      />

      {/* Compilation error banner */}
      {compilationError && (
        <div className="bg-red-100 dark:bg-red-900/20 border-b border-red-300 dark:border-red-800 px-4 py-3 flex items-start gap-2 text-sm text-red-800 dark:text-red-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Compilation Error</p>
            <p className="mt-1">{compilationError}</p>
          </div>
          <button
            onClick={() => setCompilationError(null)}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Editor View (with optional preview) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Monaco Editor */}
        <div className={`${showPreview ? 'w-1/2 border-r dark:border-gray-700' : 'w-full'} flex flex-col`}>
          <div className="flex-1">
            <MonacoLatexEditor
              value={latexSource}
              onChange={setLatexSource}
              theme="vs-dark"
            />
          </div>
        </div>

        {/* PDF Preview (only when toggled) */}
        {showPreview && (
          <div className="w-1/2 flex flex-col relative">
            {/* Close preview button */}
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-2 right-2 z-10 p-2 bg-gray-800/90 hover:bg-gray-700 text-white rounded-lg shadow-lg"
              title="Close Preview"
            >
              ✕
            </button>
            <PdfPreview pdfUrl={pdfUrl} fileName={resume.fileName.replace('.tex', '.pdf')} />
          </div>
        )}
      </div>

      {/* Export Menu (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="relative group">
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 transition-all">
            <FileDown className="w-5 h-5" />
            <span>Export</span>
          </button>

          {/* Dropdown */}
          <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity">
            <button
              onClick={() => handleExport('tex')}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg flex items-center gap-2"
            >
              <span>📄</span>
              <span>Export as .tex</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg flex items-center gap-2"
              disabled={!pdfUrl}
            >
              <span>📑</span>
              <span>Export as .pdf</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Notification helper (could be extracted to separate utility)
 */
function showNotification(message: string, type: 'success' | 'error' | 'warning') {
  // Simple toast notification (could use a library like react-hot-toast)
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
    type === 'success'
      ? 'bg-green-600 text-white'
      : type === 'error'
      ? 'bg-red-600 text-white'
      : 'bg-yellow-600 text-white'
  }`;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}
