/**
 * Keyword Analysis Panel Component
 *
 * Display keyword gap analysis:
 * - JD keywords identified
 * - Resume coverage percentage
 * - Missing keywords
 * - Suggestions
 * - Trigger optimization button
 */

'use client';

import { useState } from 'react';
import { Search, TrendingUp, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { KeywordAnalysis } from '@/lib/parsers/types';

interface KeywordAnalysisPanelProps {
  analysis: KeywordAnalysis | null;
  isAnalyzing: boolean;
  onAnalyze?: () => void;
  onOptimize?: () => void;
  isOptimizing?: boolean;
}

export default function KeywordAnalysisPanel({
  analysis,
  isAnalyzing,
  onAnalyze,
  onOptimize,
  isOptimizing
}: KeywordAnalysisPanelProps) {
  const [showAllKeywords, setShowAllKeywords] = useState(false);

  // Coverage status
  const getCoverageStatus = (coverage: number) => {
    if (coverage >= 90) return { color: 'green', label: 'Excellent', icon: CheckCircle };
    if (coverage >= 70) return { color: 'yellow', label: 'Good', icon: TrendingUp };
    if (coverage >= 50) return { color: 'orange', label: 'Fair', icon: AlertTriangle };
    return { color: 'red', label: 'Poor', icon: AlertTriangle };
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Keyword Analysis</h3>

        {onAnalyze && !analysis && (
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>{isAnalyzing ? 'Analyzing...' : 'Analyze'}</span>
          </button>
        )}
      </div>

      {isAnalyzing && (
        <div className="py-8 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-3"></div>
          <p className="text-sm text-gray-600">Analyzing keywords...</p>
          <p className="text-xs text-gray-500 mt-1">This may take 10-15 seconds</p>
        </div>
      )}

      {!isAnalyzing && !analysis && (
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <Search className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-sm text-gray-600">Upload resume and job description</p>
          <p className="text-xs text-gray-500 mt-1">Then click Analyze to see keyword coverage</p>
        </div>
      )}

      {analysis && (
        <div className="space-y-4">
          {/* Coverage Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Keyword Coverage</span>
              {(() => {
                const status = getCoverageStatus(analysis.coverage);
                const StatusIcon = status.icon;
                return (
                  <div className={`flex items-center gap-1 text-${status.color}-600`}>
                    <StatusIcon className="w-4 h-4" />
                    <span className="text-xs font-medium">{status.label}</span>
                  </div>
                );
              })()}
            </div>

            {/* Large coverage number */}
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-4xl font-bold text-gray-900">
                {Math.round(analysis.coverage)}%
              </span>
              <span className="text-sm text-gray-600">
                ({analysis.resumeKeywords.length}/{analysis.jdKeywords.length} keywords)
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  analysis.coverage >= 90
                    ? 'bg-green-500'
                    : analysis.coverage >= 70
                    ? 'bg-yellow-500'
                    : analysis.coverage >= 50
                    ? 'bg-orange-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(analysis.coverage, 100)}%` }}
              />
            </div>
          </div>

          {/* Missing Keywords */}
          {analysis.missingKeywords.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Missing Keywords ({analysis.missingKeywords.length})
                  </span>
                </div>
                {analysis.missingKeywords.length > 10 && (
                  <button
                    onClick={() => setShowAllKeywords(!showAllKeywords)}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    {showAllKeywords ? 'Show Less' : 'Show All'}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {(showAllKeywords
                  ? analysis.missingKeywords
                  : analysis.missingKeywords.slice(0, 10)
                ).map((keyword) => (
                  <span
                    key={keyword}
                    className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full border border-red-200"
                  >
                    {keyword}
                  </span>
                ))}
              </div>

              {!showAllKeywords && analysis.missingKeywords.length > 10 && (
                <p className="text-xs text-gray-500 mt-2">
                  +{analysis.missingKeywords.length - 10} more keywords
                </p>
              )}
            </div>
          )}

          {/* Present Keywords */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">
                Present Keywords ({analysis.resumeKeywords.length})
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {analysis.resumeKeywords.slice(0, 15).map((keyword) => (
                <span
                  key={keyword}
                  className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200"
                >
                  {keyword}
                </span>
              ))}
              {analysis.resumeKeywords.length > 15 && (
                <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full border border-gray-200">
                  +{analysis.resumeKeywords.length - 15} more
                </span>
              )}
            </div>
          </div>

          {/* Optimize Button */}
          {onOptimize && analysis.missingKeywords.length > 0 && (
            <button
              onClick={onOptimize}
              disabled={isOptimizing}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              <Zap className="w-5 h-5" />
              <span>{isOptimizing ? 'Optimizing Resume...' : 'Optimize Resume'}</span>
            </button>
          )}

          {/* Success message if coverage is excellent */}
          {analysis.coverage >= 95 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Excellent! Your resume has great keyword coverage.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
