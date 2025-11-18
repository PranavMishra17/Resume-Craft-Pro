'use client'

import { Sparkles, Search } from 'lucide-react'

interface SimplifiedOptimizationControlsProps {
  onOptimize: () => void
  onAnalyze?: () => void
  disabled?: boolean
  isOptimizing?: boolean
  isAnalyzing?: boolean
}

export default function SimplifiedOptimizationControls({
  onOptimize,
  onAnalyze,
  disabled = false,
  isOptimizing = false,
  isAnalyzing = false
}: SimplifiedOptimizationControlsProps) {
  return (
    <div className="space-y-3">
      {/* Button Group */}
      <div className="flex gap-2">
        {/* Analyze Keywords Button */}
        {onAnalyze && (
          <button
            onClick={onAnalyze}
            disabled={disabled || isAnalyzing || isOptimizing}
            className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-all"
            title="Analyze keywords from job description"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">Analyzing...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Analyze</span>
              </>
            )}
          </button>
        )}

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
    </div>
  )
}
