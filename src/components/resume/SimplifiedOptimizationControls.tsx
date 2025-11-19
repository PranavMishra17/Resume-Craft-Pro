'use client'

import { useState } from 'react'
import { Sparkles, FileText, X } from 'lucide-react'

interface SimplifiedOptimizationControlsProps {
  onOptimize: () => void
  disabled?: boolean
  isOptimizing?: boolean
  customInstructions?: string
  onCustomInstructionsChange?: (instructions: string) => void
}

export default function SimplifiedOptimizationControls({
  onOptimize,
  disabled = false,
  isOptimizing = false,
  customInstructions = '',
  onCustomInstructionsChange
}: SimplifiedOptimizationControlsProps) {
  const [showCustomInstructions, setShowCustomInstructions] = useState(false)

  return (
    <div className="space-y-3">
      {/* Button Group */}
      <div className="flex gap-2">
        {/* Custom Instructions Button */}
        <button
          onClick={() => setShowCustomInstructions(!showCustomInstructions)}
          className={`flex-shrink-0 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-all ${
            showCustomInstructions || customInstructions
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-600 hover:bg-gray-700 text-white'
          }`}
          title="Add custom instructions for optimization"
        >
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">Instructions</span>
        </button>

        {/* Craft Resume Button */}
        <button
          onClick={onOptimize}
          disabled={disabled || isOptimizing}
          className="flex-1 flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-base shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:transform-none"
        >
          {isOptimizing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Crafting Resume...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Craft Resume</span>
            </>
          )}
        </button>
      </div>

      {/* Custom Instructions Input */}
      {showCustomInstructions && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-blue-900 dark:text-blue-300">
              Custom Instructions for AI
            </label>
            <button
              onClick={() => setShowCustomInstructions(false)}
              className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <textarea
            value={customInstructions}
            onChange={(e) => onCustomInstructionsChange?.(e.target.value)}
            placeholder="e.g., Focus on leadership skills, use action verbs, emphasize quantifiable results..."
            rows={3}
            className="w-full px-3 py-2 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
          />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            These instructions will guide the AI during optimization (e.g., tone, style, focus areas)
          </p>
        </div>
      )}
    </div>
  )
}
