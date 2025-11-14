'use client';

/**
 * DocumentViewer Component - Displays document with line numbers and preview mode
 */

import { useState, useEffect } from 'react';
import { Document, Line } from '@/lib/parsers/types';
import LineItem from './LineItem';
import Toast from '../ui/Toast';
import { FileText, Download, Eye, Edit3, Upload } from 'lucide-react';

interface DocumentViewerProps {
  document: Document | null;
  onLineToggleLock?: (line: Line) => void;
  onExport?: (format: 'docx' | 'pdf' | 'markdown') => void;
  onFormatPreservingExport?: (format: 'docx' | 'pdf' | 'markdown') => void;
  hasEdits?: boolean; // Whether document has been edited (show format-preserving option)
  onUpload?: (file: File) => void;
  isUploading?: boolean;
  selectedLine?: Line | null;
  onLineSelect?: (line: Line | null) => void;
  onRunLLMDetection?: () => void;
  isRunningLLMDetection?: boolean;
}

// Placeholder Badge Component with hover interaction
function PlaceholderBadge({
  count,
  onRunDetection,
  isRunning
}: {
  count: number;
  onRunDetection?: () => void;
  isRunning?: boolean;
}) {
  const [showButton, setShowButton] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [detectedCount, setDetectedCount] = useState(0);
  const [wasRunning, setWasRunning] = useState(false);

  // Handle detection completion
  const handleRunDetection = () => {
    if (onRunDetection) {
      onRunDetection();
    }
  };

  // Track when detection completes
  useEffect(() => {
    if (isRunning) {
      setWasRunning(true);
    } else if (wasRunning && !isRunning) {
      // Detection just completed
      setDetectedCount(count);
      setShowSuccessMessage(true);
      setShowButton(false);
      setWasRunning(false);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  }, [isRunning, wasRunning, count]);

  return (
    <div className="flex items-center gap-2">
      <div className="relative px-3 py-1.5 bg-yellow-100 border border-yellow-300 rounded-md text-xs font-medium text-yellow-800 group">
        <span>{count} placeholder{count !== 1 ? 's' : ''} detected</span>

        {/* Hover - "Not satisfied?" link */}
        {!showButton && !showSuccessMessage && (
          <div className="absolute -bottom-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            <button
              className="text-xs text-purple-600 underline hover:text-purple-700"
              onClick={() => setShowButton(true)}
            >
              Not satisfied?
            </button>
          </div>
        )}
      </div>

      {/* Detection Button - Persists after clicking "Not satisfied?" */}
      {showButton && onRunDetection && !showSuccessMessage && (
        <button
          onClick={handleRunDetection}
          disabled={isRunning}
          className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isRunning ? 'Running detection...' : 'Run LLM-powered detection'}
        </button>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="px-3 py-1.5 bg-green-100 border border-green-300 rounded-md text-xs font-medium text-green-800">
          Detected {detectedCount} placeholder{detectedCount !== 1 ? 's' : ''}!
        </div>
      )}
    </div>
  );
}

export default function DocumentViewer({
  document,
  onLineToggleLock,
  onExport,
  onFormatPreservingExport,
  hasEdits = false,
  onUpload,
  isUploading = false,
  selectedLine = null,
  onLineSelect,
  onRunLLMDetection,
  isRunningLLMDetection = false
}: DocumentViewerProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handleLineSelect = (line: Line) => {
    if (onLineSelect) {
      onLineSelect(line.lineNumber === selectedLine?.lineNumber ? null : line);
    }
  };

  const handleCopyLine = (lineNumber: number) => {
    setToastMessage(`Line ${lineNumber} copied to clipboard`);
    setShowToast(true);
  };

  const handleCloseToast = () => {
    setShowToast(false);
  };

  // Truncate filename to max 40 chars
  const truncateFilename = (filename: string, maxLength: number = 40) => {
    if (filename.length <= maxLength) return filename;
    const extension = filename.split('.').pop() || '';
    const nameWithoutExt = filename.slice(0, filename.lastIndexOf('.'));
    const truncated = nameWithoutExt.slice(0, maxLength - extension.length - 4) + '...';
    return `${truncated}.${extension}`;
  };

  // Count placeholders
  const placeholderCount = document?.lines.filter(l => l.isPlaceholder).length || 0;

  // Group lines by page for preview mode
  const groupLinesByPage = () => {
    const pages: { [key: number]: Line[] } = {};
    document?.lines.forEach(line => {
      if (!pages[line.pageNumber]) {
        pages[line.pageNumber] = [];
      }
      pages[line.pageNumber].push(line);
    });
    return pages;
  };

  if (!document) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50 p-8">
        <div className="text-center max-w-md">
          <FileText className="w-20 h-20 text-gray-300 mb-6 mx-auto" />
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Document Loaded</h3>

          {onUpload ? (
            <>
              <p className="text-base text-gray-700 mb-6">
                Upload a document to get started with AI-powered editing
              </p>
              <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-base font-medium">
                <Upload className="w-5 h-5" />
                <span>{isUploading ? 'Uploading...' : 'Upload Document'}</span>
                <input
                  type="file"
                  accept=".docx,.pdf,.md,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && onUpload) onUpload(file);
                  }}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-800">
                  <strong className="text-gray-900">Supported formats:</strong> DOCX, PDF, Markdown
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="text-base text-gray-700 mb-6">
                Upload a document using the button in the top-right corner to get started
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-800">
                  <strong className="text-gray-900">Supported formats:</strong> DOCX, PDF, Markdown
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h2
                className="text-lg font-semibold text-gray-900"
                title={document.metadata.fileName || 'Untitled'}
              >
                {truncateFilename(document.metadata.fileName || 'Untitled')}
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                {document.metadata.totalLines} lines • {document.metadata.totalPages} pages • {document.metadata.format.toUpperCase()}
              </p>
            </div>
            {/* Placeholder Badge */}
            {placeholderCount > 0 && (
              <PlaceholderBadge
                count={placeholderCount}
                onRunDetection={onRunLLMDetection}
                isRunning={isRunningLLMDetection}
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Preview Toggle */}
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm ${
                isPreviewMode
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={isPreviewMode ? 'Exit preview mode' : 'Preview document'}
            >
              {isPreviewMode ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{isPreviewMode ? 'Edit' : 'Preview'}</span>
            </button>

            {/* Export Button */}
            {onExport && (
              <div className="relative group">
                <button
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  title="Export document"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-200">
                    Preview Export (Current State)
                  </div>
                  <button
                    onClick={() => onExport('docx')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
                  >
                    Export as DOCX
                  </button>
                  <button
                    onClick={() => onExport('pdf')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
                  >
                    Export as PDF
                  </button>
                  <button
                    onClick={() => onExport('markdown')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
                  >
                    Export as Markdown
                  </button>

                  {/* Format-Preserving Export (only show if edits exist) */}
                  {hasEdits && onFormatPreservingExport && (
                    <>
                      <div className="border-t border-gray-200 my-1"></div>
                      <div className="px-3 py-2 text-xs font-semibold text-green-600 border-b border-gray-200">
                        ✨ Format-Preserving Export
                      </div>
                      <button
                        onClick={() => onFormatPreservingExport('docx')}
                        className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 font-medium"
                        title="Applies edits to original file - preserves all formatting"
                      >
                        🎨 Export DOCX (Original Style)
                      </button>
                      <button
                        onClick={() => onFormatPreservingExport('pdf')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
                      >
                        Export PDF
                      </button>
                      <button
                        onClick={() => onFormatPreservingExport('markdown')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
                      >
                        Export Markdown
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 overflow-y-auto">
        {document.lines.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600">Document is empty</p>
          </div>
        ) : isPreviewMode ? (
          /* Preview Mode - Show as pages */
          <div className="p-8 bg-gray-100 space-y-8">
            {Object.entries(groupLinesByPage()).map(([pageNum, lines]) => (
              <div
                key={pageNum}
                className="bg-white shadow-lg mx-auto max-w-4xl p-12 min-h-[11in] relative"
                style={{ width: '8.5in' }}
              >
                {/* Page Number */}
                <div className="absolute top-4 right-4 text-xs text-gray-400">
                  Page {pageNum}
                </div>

                {/* Page Content */}
                <div className="space-y-2">
                  {lines.map(line => {
                    // Build style object based on formatting
                    const style: React.CSSProperties = {
                      color: line.formatting?.color || '#1a1a1a',
                      textAlign: line.formatting?.alignment || 'left',
                      fontSize: line.formatting?.fontSize ? `${line.formatting.fontSize}px` : '14px',
                      fontFamily: line.formatting?.fontFamily || 'inherit',
                      fontWeight: line.formatting?.bold ? 'bold' : 'normal',
                      fontStyle: line.formatting?.italic ? 'italic' : 'normal',
                      textDecoration: line.formatting?.underline ? 'underline' : 'none',
                      backgroundColor: line.formatting?.backgroundColor || 'transparent'
                    };

                    return (
                      <p
                        key={line.lineNumber}
                        className={`leading-relaxed ${
                          line.isPlaceholder
                            ? 'bg-yellow-100 px-2 py-1 rounded'
                            : ''
                        } ${
                          line.isLocked
                            ? 'bg-red-50 px-1 border-l-2 border-red-400'
                            : ''
                        }`}
                        style={style}
                      >
                        {line.text || '\u00A0'}
                      </p>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Edit Mode - Show with line numbers */
          <div className="divide-y divide-gray-200">
            {document.lines.map((line, index) => {
              // Check if this is the first line of a new page
              const isNewPage = index > 0 && line.pageNumber !== document.lines[index - 1].pageNumber;

              return (
                <div key={line.lineNumber}>
                  {isNewPage && (
                    <div className="bg-gray-200 border-y-2 border-gray-400 px-4 py-2 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700">
                        — Page {line.pageNumber} —
                      </span>
                    </div>
                  )}
                  <LineItem
                    line={line}
                    isSelected={selectedLine?.lineNumber === line.lineNumber}
                    onSelect={handleLineSelect}
                    onToggleLock={onLineToggleLock}
                    onCopyLine={handleCopyLine}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>


      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={handleCloseToast}
      />
    </div>
  );
}
