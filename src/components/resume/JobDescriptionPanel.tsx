'use client'

import { useState, useEffect } from 'react'
import { Info, FileText, ChevronDown } from 'lucide-react'

interface JobDescriptionPanelProps {
  jobDescription: string
  jobField?: string
  onJobDescriptionChange: (jd: string) => void
  onJobFieldChange: (field: string) => void
  disabled?: boolean
  isAnalyzed?: boolean
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
  disabled = false,
  isAnalyzed = false
}: JobDescriptionPanelProps) {
  const [showInfo, setShowInfo] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [lastAnalyzedJD, setLastAnalyzedJD] = useState('')
  const [hasAutoCollapsed, setHasAutoCollapsed] = useState(false)
  const [autoDetectedIndustry, setAutoDetectedIndustry] = useState<string | null>(null)

  const selectedField = JOB_FIELDS.find(f => f.value === jobField) || JOB_FIELDS[0]

  // Auto-collapse after analysis (only once per JD)
  useEffect(() => {
    if (isAnalyzed && jobDescription.length > 0) {
      // Check if this is a new JD being analyzed
      if (lastAnalyzedJD !== jobDescription) {
        setLastAnalyzedJD(jobDescription)
        setHasAutoCollapsed(false)
      }
      // Only auto-collapse if we haven't done so for this JD yet
      else if (!hasAutoCollapsed && !isCollapsed) {
        setIsCollapsed(true)
        setHasAutoCollapsed(true)
      }
    }
  }, [isAnalyzed, jobDescription, lastAnalyzedJD, hasAutoCollapsed, isCollapsed])

  // Auto-detect industry from job description
  const detectIndustry = (jdText: string): string => {
    const lowerJD = jdText.toLowerCase()

    // Industry keyword patterns (prioritized)
    if (lowerJD.includes('machine learning') || lowerJD.includes('deep learning') ||
        lowerJD.includes('neural network') || lowerJD.includes('ai engineer') ||
        lowerJD.includes('ml engineer') || lowerJD.includes('artificial intelligence')) {
      return 'aiml'
    }
    if (lowerJD.includes('data scientist') || lowerJD.includes('data analyst') ||
        lowerJD.includes('data engineer') || lowerJD.includes('analytics') ||
        lowerJD.includes('tableau') || lowerJD.includes('power bi')) {
      return 'data'
    }
    if (lowerJD.includes('devops') || lowerJD.includes('sre') ||
        lowerJD.includes('site reliability') || lowerJD.includes('kubernetes') ||
        lowerJD.includes('terraform') || lowerJD.includes('jenkins')) {
      return 'devops'
    }
    if (lowerJD.includes('cloud architect') || lowerJD.includes('aws') ||
        lowerJD.includes('azure') || lowerJD.includes('gcp') ||
        lowerJD.includes('cloud engineer')) {
      return 'cloud'
    }
    if (lowerJD.includes('react') || lowerJD.includes('vue') ||
        lowerJD.includes('angular') || lowerJD.includes('frontend') ||
        lowerJD.includes('front-end') || lowerJD.includes('ui developer')) {
      return 'frontend'
    }
    if (lowerJD.includes('backend') || lowerJD.includes('back-end') ||
        lowerJD.includes('api developer') || lowerJD.includes('microservices') ||
        lowerJD.includes('node.js') || lowerJD.includes('django') || lowerJD.includes('spring')) {
      return 'backend'
    }
    if (lowerJD.includes('full stack') || lowerJD.includes('fullstack') ||
        lowerJD.includes('full-stack')) {
      return 'fullstack'
    }
    if (lowerJD.includes('ios') || lowerJD.includes('android') ||
        lowerJD.includes('react native') || lowerJD.includes('flutter') ||
        lowerJD.includes('mobile developer')) {
      return 'mobile'
    }
    if (lowerJD.includes('security engineer') || lowerJD.includes('cybersecurity') ||
        lowerJD.includes('penetration test') || lowerJD.includes('infosec') ||
        lowerJD.includes('security analyst')) {
      return 'security'
    }
    if (lowerJD.includes('product manager') || lowerJD.includes('product owner') ||
        lowerJD.includes('pm ') || lowerJD.includes('product lead')) {
      return 'product'
    }
    if (lowerJD.includes('ux designer') || lowerJD.includes('ui designer') ||
        lowerJD.includes('ux/ui') || lowerJD.includes('product designer')) {
      return 'design'
    }
    if (lowerJD.includes('software engineer') || lowerJD.includes('sde') ||
        lowerJD.includes('software developer')) {
      return 'swe'
    }

    return 'all' // Default if no match
  }

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
        {isCollapsed ? (
          /* Collapsed View - One Line Preview */
          <div
            onClick={() => setIsCollapsed(false)}
            className="w-full px-3 py-2 border border-purple-300 dark:border-purple-700 rounded-lg bg-purple-50/50 dark:bg-purple-900/10 text-gray-800 dark:text-gray-200 text-sm cursor-pointer hover:bg-purple-100/50 dark:hover:bg-purple-900/20 transition-colors group flex items-center justify-between gap-2"
          >
            <span className="flex-1 truncate">
              {jobDescription.length > 100
                ? `${jobDescription.substring(0, 100)}...`
                : jobDescription}
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                Click to edit
              </span>
              <ChevronDown className="w-4 h-4 text-purple-600 dark:text-purple-400 rotate-180 group-hover:scale-110 transition-transform" />
            </div>
          </div>
        ) : (
          /* Expanded View - Full Textarea */
          <textarea
            value={jobDescription}
            onChange={(e) => {
              const newValue = e.target.value
              onJobDescriptionChange(newValue)

              // Auto-expand if collapsed (for iteration)
              if (isCollapsed) {
                setIsCollapsed(false)
              }

              // Auto-detect industry when user pastes/types significant content
              if (newValue.length > 100 && jobField === 'all') {
                const detectedIndustry = detectIndustry(newValue)
                if (detectedIndustry !== 'all') {
                  onJobFieldChange(detectedIndustry)
                  setAutoDetectedIndustry(detectedIndustry)
                  // Clear notification after 3 seconds
                  setTimeout(() => setAutoDetectedIndustry(null), 3000)
                }
              }
            }}
            disabled={disabled}
            placeholder="Paste the complete job description here..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          />
        )}

        {/* Character Count */}
        {!isCollapsed && (
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
        )}

        {/* Auto-Detection Notification */}
        {autoDetectedIndustry && (
          <div className="mt-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-xs text-green-700 dark:text-green-300 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>
                Auto-detected industry: <strong>{JOB_FIELDS.find(f => f.value === autoDetectedIndustry)?.label}</strong>
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
