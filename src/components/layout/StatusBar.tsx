'use client';

/**
 * Status Bar Component - Shows document stats and quick actions
 */

import { Lock, FileSearch, MousePointer } from 'lucide-react';
import { Document, Line } from '@/lib/parsers/types';

interface StatusBarProps {
  document: Document | null;
  selectedLine: Line | null;
  onRunLLMDetection?: () => void;
  isRunningLLMDetection?: boolean;
}

export default function StatusBar({
  document,
  selectedLine,
  onRunLLMDetection,
  isRunningLLMDetection = false
}: StatusBarProps) {
  if (!document) return null;

  const lockedCount = document.lines.filter(l => l.isLocked).length;
  const placeholderCount = document.lines.filter(l => l.isPlaceholder).length;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-300 px-4 py-2 flex items-center justify-between text-xs text-gray-600 z-10">
      {/* Left side - Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Lock className="w-3 h-3" />
          <span>{lockedCount} locked</span>
        </div>
        <div className="text-gray-400">|</div>
        <div className="flex items-center gap-1">
          <FileSearch className="w-3 h-3" />
          <span>{placeholderCount} placeholders</span>
        </div>
        {selectedLine && (
          <>
            <div className="text-gray-400">|</div>
            <div className="flex items-center gap-1">
              <MousePointer className="w-3 h-3" />
              <span>Line {selectedLine.lineNumber} selected</span>
            </div>
          </>
        )}
      </div>

      {/* Right side - Actions */}
      {onRunLLMDetection && (
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Not satisfied?</span>
          <button
            onClick={onRunLLMDetection}
            disabled={isRunningLLMDetection}
            className="text-purple-600 hover:text-purple-700 font-medium underline disabled:text-gray-400 disabled:no-underline"
          >
            {isRunningLLMDetection ? 'Running LLM detection...' : 'LLM-powered placeholder detection'}
          </button>
        </div>
      )}
    </div>
  );
}
