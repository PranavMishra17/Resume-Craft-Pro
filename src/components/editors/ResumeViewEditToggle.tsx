'use client';

/**
 * Resume View/Edit Toggle Wrapper
 * Switches between DocumentViewer (optimization view) and ResumeEditorLayout (LaTeX editing)
 */

import { useState } from 'react';
import { Document } from '@/lib/parsers/types';
import { Resume } from '@/types/resume';
import DocumentViewer from '@/components/document/DocumentViewer';
import ResumeEditorLayout from './ResumeEditorLayout';
import { Eye, Code, AlertCircle } from 'lucide-react';

interface ResumeViewEditToggleProps {
  // For optimization view
  document: Document | null;
  onLineToggleLock: (lineNumber: number) => void;
  onExport: (format: 'docx' | 'pdf' | 'markdown') => void;
  onFormatPreservingExport: () => void;
  hasEdits: boolean;
  onUpload: (file: File) => void;
  isUploading: boolean;
  selectedLine: any;
  onLineSelect: (line: any) => void;
  onRunLLMDetection: () => void;
  isRunningLLMDetection: boolean;

  // For LaTeX edit view
  resume: Resume | null;
  onResumeSave?: (updatedSource: string) => void;
}

type ViewMode = 'optimize' | 'edit';

export default function ResumeViewEditToggle(props: ResumeViewEditToggleProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('optimize');

  const canEdit = props.resume?.sourceFormat === 'latex';

  // Only show toggle if LaTeX resume is available
  const showToggle = canEdit && props.resume;

  return (
    <div className="flex flex-col h-full">
      {/* Mode Toggle Bar */}
      {showToggle && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">Mode:</span>
            <div className="flex bg-white/20 rounded-lg p-1">
              <button
                onClick={() => setViewMode('optimize')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md transition-all ${
                  viewMode === 'optimize'
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span className="font-medium">Optimize View</span>
              </button>
              <button
                onClick={() => setViewMode('edit')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md transition-all ${
                  viewMode === 'edit'
                    ? 'bg-white text-purple-600 shadow-md'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Code className="w-4 h-4" />
                <span className="font-medium">LaTeX Editor</span>
              </button>
            </div>
          </div>

          <div className="text-xs opacity-90">
            {viewMode === 'optimize'
              ? '💡 Switch to Editor to modify LaTeX source directly'
              : '💡 Switch to Optimize View for AI-powered keyword optimization'}
          </div>
        </div>
      )}

      {/* Mode-specific content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'optimize' || !canEdit ? (
          // Optimization view (default for all formats)
          <DocumentViewer
            document={props.document}
            onLineToggleLock={props.onLineToggleLock}
            onExport={props.onExport}
            onFormatPreservingExport={props.onFormatPreservingExport}
            hasEdits={props.hasEdits}
            onUpload={props.onUpload}
            isUploading={props.isUploading}
            selectedLine={props.selectedLine}
            onLineSelect={props.onLineSelect}
            onRunLLMDetection={props.onRunLLMDetection}
            isRunningLLMDetection={props.isRunningLLMDetection}
          />
        ) : (
          // LaTeX editor view (only for LaTeX resumes)
          <>
            {props.resume ? (
              <ResumeEditorLayout
                resume={props.resume}
                onSave={props.onResumeSave}
                onExport={(format) => {
                  if (format === 'tex') {
                    props.onExport('markdown'); // Placeholder
                  }
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-red-50 dark:bg-red-900/20">
                <div className="flex flex-col items-center gap-3 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-16 h-16" />
                  <p className="text-lg font-semibold">Resume data not available</p>
                  <p className="text-sm">Please re-upload your LaTeX resume</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
