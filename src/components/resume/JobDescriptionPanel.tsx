'use client'

import { useState } from 'react'
import { Info, FileText, ChevronDown } from 'lucide-react'

interface JobDescriptionPanelProps {
  jobDescription: string
  jobField?: string
  onJobDescriptionChange: (jd: string) => void
  onJobFieldChange: (field: string) => void
  disabled?: boolean
}

const JOB_FIELDS = [
  { value: 'all', label: 'Select Industry' },
  { value: 'swe', label: 'Software Engineering' },
  { value: 'aiml', label: 'AI/ML Engineering' },
  { value: 'data', label: 'Data Science' },
  { value: 'cloud', label: 'Cloud Computing' },
  { value: 'devops', label: 'DevOps/SRE' },
  { value: 'frontend', label: 'Frontend Development' },
  { value: 'backend', label: 'Backend Development' },
  { value: 'fullstack', label: 'Full Stack Development' },
  { value: 'mobile', label: 'Mobile Development' },
  { value: 'security', label: 'Cybersecurity' },
  { value: 'medical', label: 'Medical/Healthcare' },
  { value: 'finance', label: 'Finance/Banking' },
  { value: 'marketing', label: 'Marketing/Sales' },
  { value: 'product', label: 'Product Management' },
  { value: 'design', label: 'UI/UX Design' },
  { value: 'other', label: 'Other' }
]

export default function JobDescriptionPanel({
  jobDescription,
  jobField = 'all',
  onJobDescriptionChange,
  onJobFieldChange,
  disabled = false
}: JobDescriptionPanelProps) {
  const [showInfo, setShowInfo] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const selectedField = JOB_FIELDS.find(f => f.value === jobField) || JOB_FIELDS[0]

  return (
    <div className="space-y-4">
      {/* Header with Info Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            Job Description
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Job Field Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={disabled}
              className={`flex items-center gap-1 px-2 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed max-w-[120px] ${
                jobField !== 'all' ? 'border-2 border-yellow-500/60 dark:border-yellow-600/60' : 'border-2 border-transparent'
              }`}
              title={selectedField.label}
            >
              <span className="truncate">{selectedField.label}</span>
              <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
                  {JOB_FIELDS.map(field => (
                    <button
                      key={field.value}
                      onClick={() => {
                        onJobFieldChange(field.value)
                        setShowDropdown(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        field.value === jobField
                          ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-medium'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {field.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Info Button */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Show help"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
            How to use Job Description
          </h4>
          <ul className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
              <span>
                <strong>Paste the complete job posting</strong> including requirements, responsibilities, and qualifications
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
              <span>
                <strong>Select the job field</strong> to help the AI extract more relevant keywords (optional)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
              <span>
                <strong>Include specific technologies</strong> and tools mentioned in the posting
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
              <span>
                <strong>The AI will extract 15-20 key keywords</strong> focusing on technical skills, tools, and methodologies
              </span>
            </li>
          </ul>

          <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
            <p className="text-xs text-purple-700 dark:text-purple-300">
              <strong>Example:</strong> For a "Senior React Developer" role, include details about React, TypeScript, Redux, testing frameworks, and any specific libraries or tools mentioned.
            </p>
          </div>
        </div>
      )}

      {/* Job Description Textarea */}
      <div>
        <textarea
          value={jobDescription}
          onChange={(e) => onJobDescriptionChange(e.target.value)}
          disabled={disabled}
          placeholder="Paste the complete job description here..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        />

        {/* Character Count */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>
            {jobDescription.length > 0 && `${jobDescription.length} characters`}
          </span>
          {jobField !== 'all' && (
            <span className="text-purple-600 dark:text-purple-400">
              Field: {selectedField.label}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
