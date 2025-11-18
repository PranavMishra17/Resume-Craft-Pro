'use client'

import { useState, useCallback, useRef } from 'react'
import { X, Upload, FileText, Plus, Trash2, Info, Edit, Check } from 'lucide-react'
import { ContextFile } from '@/lib/parsers/types'

interface ContextFilesModalProps {
  isOpen: boolean
  onClose: () => void
  contextFiles: {
    projects?: ContextFile
    portfolio?: ContextFile
  }
  onSave: (files: { projects?: ContextFile; portfolio?: ContextFile }) => void
}

interface FileEntry {
  type: 'projects' | 'portfolio'
  name: string
  content: string
  saved?: boolean
}

export default function ContextFilesModal({
  isOpen,
  onClose,
  contextFiles,
  onSave
}: ContextFilesModalProps) {
  const [files, setFiles] = useState<FileEntry[]>(() => {
    const initial: FileEntry[] = []
    if (contextFiles.projects) {
      initial.push({
        type: 'projects',
        name: contextFiles.projects.name || 'Projects',
        content: contextFiles.projects.content,
        saved: true
      })
    }
    if (contextFiles.portfolio) {
      initial.push({
        type: 'portfolio',
        name: contextFiles.portfolio.name || 'Portfolio',
        content: contextFiles.portfolio.content,
        saved: true
      })
    }
    return initial
  })

  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addFile = (file: FileEntry) => {
    setFiles(prev => [...prev, file])
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    for (const file of droppedFiles) {
      let content = ''
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        content = `[PDF File: ${file.name}]\n\nNote: PDF content extraction is limited. Please paste the text content manually for best results.`
      } else {
        content = await file.text()
      }
      addFile({
        type: 'projects', // Default to projects
        name: file.name,
        content
      })
    }
  }, [])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    for (const file of selectedFiles) {
      let content = ''
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        content = `[PDF File: ${file.name}]\n\nNote: PDF content extraction is limited. Please paste the text content manually for best results.`
      } else {
        content = await file.text()
      }
      addFile({
        type: 'projects',
        name: file.name,
        content
      })
    }
    // Reset input value so same file can be selected again
    e.target.value = ''
  }, [])

  const addEmptyFile = (type: 'projects' | 'portfolio') => {
    setFiles(prev => [
      ...prev,
      {
        type,
        name: type === 'projects' ? 'New Project' : 'New Portfolio Item',
        content: ''
      }
    ])
  }

  const updateFile = (index: number, updates: Partial<FileEntry>) => {
    setFiles(prev =>
      prev.map((file, i) => (i === index ? { ...file, ...updates } : file))
    )
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const saveEntry = (index: number) => {
    setFiles(prev =>
      prev.map((file, i) => (i === index ? { ...file, saved: true } : file))
    )
  }

  const toggleEditEntry = (index: number) => {
    setFiles(prev =>
      prev.map((file, i) => (i === index ? { ...file, saved: !file.saved } : file))
    )
  }

  const handleSave = () => {
    const result: { projects?: ContextFile; portfolio?: ContextFile } = {}

    // Combine all projects into one
    const projectFiles = files.filter(f => f.type === 'projects' && f.content.trim())
    if (projectFiles.length > 0) {
      result.projects = {
        name: 'Projects',
        content: projectFiles.map(f => `# ${f.name}\n\n${f.content}`).join('\n\n---\n\n'),
        uploadedAt: new Date()
      }
    }

    // Combine all portfolio items into one
    const portfolioFiles = files.filter(f => f.type === 'portfolio' && f.content.trim())
    if (portfolioFiles.length > 0) {
      result.portfolio = {
        name: 'Portfolio',
        content: portfolioFiles.map(f => `# ${f.name}\n\n${f.content}`).join('\n\n---\n\n'),
        uploadedAt: new Date()
      }
    }

    onSave(result)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Add Context Files
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Add optional project details, portfolio items, or relevant experience not in your resume
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

        {/* Info Banner */}
        <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 flex-shrink-0">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium">All fields are optional!</p>
              <p className="mt-1 text-xs">
                Add details about your projects, portfolio work, or relevant experience that isn't already in your resume.
                This helps the AI better understand your background when crafting your resume.
              </p>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`mb-4 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
            }`}
          >
            <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              <span className="font-medium">Drag & drop files here</span> or{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-purple-600 dark:text-purple-400 hover:underline"
              >
                browse
              </button>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Supports .txt, .md, .docx, .pdf files
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.md,.docx,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Add Buttons */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => addEmptyFile('projects')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Project</span>
            </button>
            <button
              onClick={() => addEmptyFile('portfolio')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Portfolio Item</span>
            </button>
          </div>

          {/* Files List */}
          <div className="space-y-3">
            {files.map((file, index) => (
              <div
                key={index}
                className={`border-2 rounded-lg transition-all ${
                  file.type === 'projects'
                    ? 'border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10'
                    : 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10'
                } ${file.saved ? '' : 'p-4'}`}
              >
                {file.saved ? (
                  /* Collapsed View */
                  <div className="flex items-center gap-3 px-4 py-3">
                    <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          file.type === 'projects'
                            ? 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200'
                            : 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                        }`}>
                          {file.type === 'projects' ? 'Project' : 'Portfolio'}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {file.name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {file.content.length} characters
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => toggleEditEntry(index)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeFile(index)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Expanded View */
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <select
                        value={file.type}
                        onChange={e => updateFile(index, { type: e.target.value as 'projects' | 'portfolio' })}
                        className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      >
                        <option value="projects">Project</option>
                        <option value="portfolio">Portfolio</option>
                      </select>
                      <input
                        type="text"
                        value={file.name}
                        onChange={e => updateFile(index, { name: e.target.value })}
                        placeholder="Enter name..."
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      />
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      value={file.content}
                      onChange={e => updateFile(index, { content: e.target.value })}
                      placeholder="Paste or type content here..."
                      rows={6}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-3"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => saveEntry(index)}
                        disabled={!file.name.trim() || !file.content.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        <Check className="w-4 h-4" />
                        Save Entry
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {files.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No context files added yet</p>
                <p className="text-xs mt-1">Drag files, use the buttons above, or skip this step</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-medium"
          >
            Save Context Files
          </button>
        </div>
      </div>
    </div>
  )
}
