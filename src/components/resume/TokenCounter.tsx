/**
 * Token Counter Display Component
 *
 * Real-time display of LLM token usage:
 * - Total tokens used
 * - Estimated cost
 * - Call breakdown
 * - Session statistics
 */

'use client';

import { useState } from 'react';
import { DollarSign, Activity, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { TokenUsage } from '@/lib/parsers/types';

interface TokenCounterProps {
  sessionId: string;
  tokenUsage: TokenUsage | null;
  isCompact?: boolean;
}

export default function TokenCounter({
  sessionId,
  tokenUsage,
  isCompact = false
}: TokenCounterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // If no token usage yet
  if (!tokenUsage || tokenUsage.totalTokens === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Token Usage</span>
          </div>
          <span className="text-xs text-gray-400">No calls yet</span>
        </div>
      </div>
    );
  }

  // Compact view
  if (isCompact) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 bg-opacity-10 rounded-lg">
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Token Usage</p>
              <p className="text-sm font-bold text-gray-900">
                {formatNumber(tokenUsage.totalTokens)} tokens
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">Est. Cost</p>
            <p className="text-sm font-bold text-green-600">
              ${tokenUsage.estimatedCost.toFixed(4)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Full view
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Token Usage</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Total Tokens */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700 font-medium mb-1">Total Tokens</p>
          <p className="text-2xl font-bold text-blue-900">
            {formatNumber(tokenUsage.totalTokens)}
          </p>
          <div className="flex gap-2 mt-2 text-xs text-blue-600">
            <span>In: {formatNumber(tokenUsage.promptTokens)}</span>
            <span>•</span>
            <span>Out: {formatNumber(tokenUsage.completionTokens)}</span>
          </div>
        </div>

        {/* Estimated Cost */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-700 font-medium mb-1">Est. Cost</p>
          <p className="text-2xl font-bold text-green-900">
            ${tokenUsage.estimatedCost.toFixed(4)}
          </p>
          <p className="text-xs text-green-600 mt-2">
            {tokenUsage.llmCalls.length} LLM calls
          </p>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && tokenUsage.llmCalls.length > 0 && (
        <div className="space-y-3">
          {/* Call History */}
          <div className="border-t border-gray-200 pt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Recent Calls</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {tokenUsage.llmCalls.slice(-10).reverse().map((call, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{call.operation}</span>
                    <span className="text-gray-600">{formatNumber(call.tokensUsed)} tokens</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500">
                    <span>{call.model}</span>
                    <span>{new Date(call.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Session Info */}
          <div className="border-t border-gray-200 pt-3">
            <p className="text-xs text-gray-500">Session ID: {sessionId.slice(0, 16)}...</p>
          </div>

          {/* Export Button */}
          <button
            onClick={() => exportSessionData(sessionId, tokenUsage)}
            className="w-full py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Session Data</span>
          </button>
        </div>
      )}

      {/* Token Pricing Info */}
      {!isExpanded && (
        <div className="border-t border-gray-200 pt-2 mt-2">
          <p className="text-xs text-gray-500 text-center">
            Gemini 2.0 Flash: $0.00001875/1K in • $0.000075/1K out
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Format number with commas
 */
function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Export session data as JSON
 */
function exportSessionData(sessionId: string, tokenUsage: TokenUsage) {
  const data = {
    sessionId,
    tokenUsage,
    exportedAt: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `token-usage-${sessionId.slice(0, 8)}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
