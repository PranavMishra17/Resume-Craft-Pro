'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, FileText, X, Check } from 'lucide-react'

interface ResumeUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (file: File) => void
  onPaste: (content: string, format: 'latex' | 'markdown' | 'text') => void
}

export default function ResumeUploadModal({
  isOpen,
  onClose,
  onUpload,
  onPaste
}: ResumeUploadModalProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload')
  const [pastedContent, setPastedContent] = useState('')
  const [pasteFormat, setPasteFormat] = useState<'latex' | 'markdown' | 'text'>('latex')
  const [fileName, setFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const validFile = files.find(f =>
      f.name.endsWith('.tex') ||
      f.name.endsWith('.pdf') ||
      f.name.endsWith('.docx') ||
      f.name.endsWith('.md')
    )

    if (validFile) {
      setFileName(validFile.name)
      onUpload(validFile)
    }
  }, [onUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      setFileName(files[0].name)
      onUpload(files[0])
    }
  }, [onUpload])

  const handlePasteContent = useCallback(() => {
    if (pastedContent.trim()) {
      onPaste(pastedContent, pasteFormat)
    }
  }, [pastedContent, pasteFormat, onPaste])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Upload Your Resume
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Get started by uploading your resume or pasting its content
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 font-medium text-sm transition-colors relative ${
                activeTab === 'upload'
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Upload File
              {activeTab === 'upload' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`px-4 py-2 font-medium text-sm transition-colors relative ${
                activeTab === 'paste'
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Paste Content
              {activeTab === 'paste' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'upload' ? (
            <div>
              {/* Drag & Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-12 transition-all ${
                  isDragging
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-300 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".tex,.pdf,.docx,.md"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 mb-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    {fileName ? (
                      <Check className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    ) : (
                      <Upload className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>

                  {fileName ? (
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        {fileName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        File uploaded successfully!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        Drag & drop your resume here
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        or
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Browse Files
                      </button>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                        Supported formats: LaTeX (.tex), PDF, DOCX, Markdown (.md)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Format Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">
                  Content Format
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPasteFormat('latex')}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      pasteFormat === 'latex'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                        : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-400 hover:border-purple-300 dark:hover:border-purple-700'
                    }`}
                  >
                    LaTeX (.tex)
                  </button>
                  <button
                    onClick={() => setPasteFormat('markdown')}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      pasteFormat === 'markdown'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                        : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-400 hover:border-purple-300 dark:hover:border-purple-700'
                    }`}
                  >
                    Markdown (.md)
                  </button>
                  <button
                    onClick={() => setPasteFormat('text')}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      pasteFormat === 'text'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                        : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-400 hover:border-purple-300 dark:hover:border-purple-700'
                    }`}
                  >
                    Plain Text
                  </button>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-400 mt-1">
                  Select the format that matches your pasted content
                </p>
              </div>

              {/* Content Textarea */}
              <div>
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">
                  Resume Content
                </label>
                <textarea
                  value={pastedContent}
                  onChange={(e) => setPastedContent(e.target.value)}
                  placeholder="Paste your resume content here..."
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
                />
              </div>

              <button
                onClick={handlePasteContent}
                disabled={!pastedContent.trim()}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Use Pasted Content
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <FileText className="w-4 h-4 inline mr-1" />
              Your resume is processed locally and securely
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
