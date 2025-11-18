/**
 * Context File Manager Component
 *
 * Upload and manage context files:
 * - Resume (.tex, .docx, .pdf)
 * - Projects (.txt, .md, .pdf, .docx)
 * - Portfolio (.txt, .md, .pdf, .docx)
 * - Job Description (.txt)
 *
 * Features:
 * - File size validation and progress
 * - Total size tracking
 * - File type indicators
 * - Delete files
 */

'use client';

import { useState } from 'react';
import { Upload, FileText, Folder, Briefcase, X, AlertCircle } from 'lucide-react';
import { ContextFile } from '@/lib/parsers/types';

interface ContextFileManagerProps {
  files: {
    resume?: ContextFile;
    projects?: ContextFile;
    portfolio?: ContextFile;
    jobDescription?: ContextFile;
  };
  onFilesChange: (files: {
    resume?: ContextFile;
    projects?: ContextFile;
    portfolio?: ContextFile;
    jobDescription?: ContextFile;
  }) => void;
  onUploadComplete?: () => void;
  showOnlyProjectsAndPortfolio?: boolean;
}

const FILE_SIZE_LIMITS = {
  resume: 2 * 1024 * 1024,      // 2MB
  projects: 2 * 1024 * 1024,    // 2MB
  portfolio: 2 * 1024 * 1024,   // 2MB
  jobDescription: 1 * 1024 * 1024, // 1MB
  total: 8 * 1024 * 1024        // 8MB
};

export default function ContextFileManager({
  files,
  onFilesChange,
  onUploadComplete,
  showOnlyProjectsAndPortfolio = false
}: ContextFileManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Calculate total size
  const totalSize = Object.values(files).reduce((sum, file) => {
    return sum + (file?.fileSize || 0);
  }, 0);

  // Handle file selection
  const handleFileSelect = async (
    type: 'resume' | 'projects' | 'portfolio' | 'jobDescription',
    file: File
  ) => {
    setUploadError(null);

    // Validate file size
    const limit = FILE_SIZE_LIMITS[type];
    if (file.size > limit) {
      setUploadError(
        `File too large (${formatBytes(file.size)} > ${formatBytes(limit)})`
      );
      return;
    }

    // Check total size
    const newTotalSize = totalSize + file.size;
    if (newTotalSize > FILE_SIZE_LIMITS.total) {
      setUploadError(
        `Total size would exceed limit (${formatBytes(newTotalSize)} > ${formatBytes(FILE_SIZE_LIMITS.total)})`
      );
      return;
    }

    // Upload file
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append(type, file);

      const response = await fetch('/api/upload-context', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      // Find the uploaded file
      const uploadedFile = data.files.find((f: ContextFile) => f.type === type);
      if (uploadedFile) {
        onFilesChange({
          ...files,
          [type]: uploadedFile
        });

        if (onUploadComplete) {
          onUploadComplete();
        }
      }

      // Show warnings if any
      if (data.warnings && data.warnings.length > 0) {
        console.warn('[CONTEXT_FILES] Upload warnings:', data.warnings);
      }

    } catch (error) {
      console.error('[CONTEXT_FILES] Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file deletion
  const handleDelete = (type: 'resume' | 'projects' | 'portfolio' | 'jobDescription') => {
    const newFiles = { ...files };
    delete newFiles[type];
    onFilesChange(newFiles);
  };

  // File type configurations
  const allFileTypes = [
    {
      key: 'resume' as const,
      label: 'Resume',
      icon: FileText,
      accept: '.tex,.docx,.md,.pdf',
      color: 'bg-blue-500',
      description: 'LaTeX, DOCX, or PDF'
    },
    {
      key: 'projects' as const,
      label: 'Projects',
      icon: Folder,
      accept: '.txt,.md,.pdf,.docx',
      color: 'bg-green-500',
      description: 'Additional projects'
    },
    {
      key: 'portfolio' as const,
      label: 'Portfolio',
      icon: Briefcase,
      accept: '.txt,.md,.pdf,.docx',
      color: 'bg-purple-500',
      description: 'Portfolio content'
    },
    {
      key: 'jobDescription' as const,
      label: 'Job Description',
      icon: FileText,
      accept: '.txt',
      color: 'bg-orange-500',
      description: 'Target job posting'
    }
  ];

  // Filter file types based on prop
  const fileTypes = showOnlyProjectsAndPortfolio
    ? allFileTypes.filter(type => type.key === 'projects' || type.key === 'portfolio')
    : allFileTypes;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {showOnlyProjectsAndPortfolio ? 'Additional Context' : 'Context Files'}
      </h3>

      {/* Error display */}
      {uploadError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{uploadError}</p>
          </div>
          <button
            onClick={() => setUploadError(null)}
            className="text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* File list */}
      <div className="space-y-3 mb-4">
        {fileTypes.map((type) => {
          const file = files[type.key];
          const Icon = type.icon;

          return (
            <div
              key={type.key}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`p-2 ${type.color} bg-opacity-10 rounded-lg`}>
                  <Icon className={`w-5 h-5 ${type.color.replace('bg-', 'text-')}`} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{type.label}</span>
                    <span className="text-xs text-gray-500">
                      ({formatBytes(FILE_SIZE_LIMITS[type.key])} max)
                    </span>
                  </div>

                  {file ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-600">{file.fileName}</span>
                      <span className="text-xs text-gray-500">
                        {formatBytes(file.fileSize)}
                      </span>
                      <span className="text-xs text-green-600">✓</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                  )}
                </div>

                {file ? (
                  <button
                    onClick={() => handleDelete(type.key)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept={type.accept}
                      onChange={(e) => {
                        const selectedFile = e.target.files?.[0];
                        if (selectedFile) {
                          handleFileSelect(type.key, selectedFile);
                        }
                        e.target.value = ''; // Reset input
                      }}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <div className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </div>
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Total size indicator */}
      <div className="border-t border-gray-200 pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Total Size</span>
          <span className="text-sm font-medium text-gray-900">
            {formatBytes(totalSize)} / {formatBytes(FILE_SIZE_LIMITS.total)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              totalSize > FILE_SIZE_LIMITS.total * 0.9
                ? 'bg-red-500'
                : totalSize > FILE_SIZE_LIMITS.total * 0.7
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min((totalSize / FILE_SIZE_LIMITS.total) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Loading indicator */}
      {isUploading && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            Uploading and parsing file...
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
