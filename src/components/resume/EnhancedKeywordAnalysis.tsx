'use client'

import { useState } from 'react'
import { Plus, X, Check } from 'lucide-react'

interface EnhancedKeywordAnalysisProps {
  jdKeywords: string[]
  resumeKeywords: string[]
  disabledKeywords?: string[]
  customKeywords?: string[]
  onToggleKeyword: (keyword: string) => void
  onAddCustomKeyword: (keyword: string) => void
  onRemoveCustomKeyword: (keyword: string) => void
}

export default function EnhancedKeywordAnalysis({
  jdKeywords,
  resumeKeywords,
  disabledKeywords = [],
  customKeywords = [],
  onToggleKeyword,
  onAddCustomKeyword,
  onRemoveCustomKeyword
}: EnhancedKeywordAnalysisProps) {
  const [isAddingKeyword, setIsAddingKeyword] = useState(false)
  const [newKeywords, setNewKeywords] = useState('')

  // Calculate keyword stats
  const presentKeywords = jdKeywords.filter(k =>
    resumeKeywords.some(rk => rk.toLowerCase() === k.toLowerCase())
  )
  const missingKeywords = jdKeywords.filter(k =>
    !resumeKeywords.some(rk => rk.toLowerCase() === k.toLowerCase())
  )

  const activeKeywords = [...jdKeywords, ...customKeywords].filter(
    k => !disabledKeywords.includes(k)
  )

  const coverage = jdKeywords.length > 0
    ? Math.round((presentKeywords.length / jdKeywords.length) * 100)
    : 0

  const handleAddKeywords = () => {
    const keywords = newKeywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)

    keywords.forEach(keyword => {
      if (!jdKeywords.includes(keyword) && !customKeywords.includes(keyword)) {
        onAddCustomKeyword(keyword)
      }
    })

    setNewKeywords('')
    setIsAddingKeyword(false)
  }

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 80) return 'text-green-600 dark:text-green-400'
    if (coverage >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getCoverageStatus = (coverage: number) => {
    if (coverage >= 80) return 'Excellent'
    if (coverage >= 60) return 'Good'
    if (coverage >= 40) return 'Fair'
    return 'Poor'
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Keyword Analysis
        </h3>
        <button
          onClick={() => setIsAddingKeyword(!isAddingKeyword)}
          className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
          title="Add custom keywords"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Coverage Stats */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Keyword Coverage
          </span>
          <span className={`text-2xl font-bold ${getCoverageColor(coverage)}`}>
            {coverage}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all ${
              coverage >= 80
                ? 'bg-green-500'
                : coverage >= 60
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${coverage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>
            {presentKeywords.length} of {jdKeywords.length} keywords present
          </span>
          <span className={`font-semibold ${getCoverageColor(coverage)}`}>
            {getCoverageStatus(coverage)}
          </span>
        </div>
      </div>

      {/* Add Custom Keywords */}
      {isAddingKeyword && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
              Add Custom Keywords
            </label>
            <input
              type="text"
              value={newKeywords}
              onChange={(e) => setNewKeywords(e.target.value)}
              placeholder="Enter keywords separated by commas..."
              className="w-full px-3 py-2 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddKeywords()
                }
              }}
            />
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Example: React, TypeScript, Docker
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddKeywords}
              disabled={!newKeywords.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              Add Keywords
            </button>
            <button
              onClick={() => {
                setIsAddingKeyword(false)
                setNewKeywords('')
              }}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Missing Keywords */}
      {missingKeywords.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-red-700 dark:text-red-400">
            Missing Keywords ({missingKeywords.filter(k => !disabledKeywords.includes(k)).length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {missingKeywords.map((keyword) => {
              const isDisabled = disabledKeywords.includes(keyword)
              return (
                <button
                  key={keyword}
                  onClick={() => onToggleKeyword(keyword)}
                  className={`group relative px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    isDisabled
                      ? 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 line-through'
                      : 'border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                  }`}
                  title={isDisabled ? 'Click to enable' : 'Click to disable'}
                >
                  {keyword}
                  {!isDisabled && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      ×
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Present Keywords */}
      {presentKeywords.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-green-700 dark:text-green-400">
            Present Keywords ({presentKeywords.filter(k => !disabledKeywords.includes(k)).length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {presentKeywords.map((keyword) => {
              const isDisabled = disabledKeywords.includes(keyword)
              return (
                <button
                  key={keyword}
                  onClick={() => onToggleKeyword(keyword)}
                  className={`group relative px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    isDisabled
                      ? 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 line-through'
                      : 'border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
                  }`}
                  title={isDisabled ? 'Click to enable' : 'Click to disable'}
                >
                  {keyword}
                  <Check className="inline-block w-3 h-3 ml-1" />
                  {!isDisabled && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      ×
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Custom Keywords */}
      {customKeywords.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400">
            Custom Keywords ({customKeywords.filter(k => !disabledKeywords.includes(k)).length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {customKeywords.map((keyword) => {
              const isDisabled = disabledKeywords.includes(keyword)
              return (
                <div
                  key={keyword}
                  className={`group relative flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    isDisabled
                      ? 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 line-through'
                      : 'border-blue-500 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                  }`}
                >
                  <button
                    onClick={() => onToggleKeyword(keyword)}
                    className="flex-1"
                    title={isDisabled ? 'Click to enable' : 'Click to disable'}
                  >
                    {keyword}
                  </button>
                  <button
                    onClick={() => onRemoveCustomKeyword(keyword)}
                    className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    title="Remove keyword"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Active Keywords Summary */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <strong>{activeKeywords.length}</strong> active keywords •{' '}
          <strong>{disabledKeywords.length}</strong> disabled •{' '}
          <strong>{customKeywords.length}</strong> custom
        </p>
      </div>
    </div>
  )
}
