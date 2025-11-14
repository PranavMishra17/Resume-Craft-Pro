'use client';

/**
 * LineItem Component - Displays a single line with line number and lock button
 */

import { useState } from 'react';
import { Line } from '@/lib/parsers/types';
import { Lock, Unlock } from 'lucide-react';

interface LineItemProps {
  line: Line;
  isSelected?: boolean;
  onSelect?: (line: Line) => void;
  onToggleLock?: (line: Line) => void;
  onCopyLine?: (lineNumber: number) => void;
}

export default function LineItem({
  line,
  isSelected = false,
  onSelect,
  onToggleLock,
  onCopyLine
}: LineItemProps) {
  const [isFlashing, setIsFlashing] = useState(false);

  const handleClick = () => {
    if (onSelect) {
      onSelect(line);
    }
  };

  const handleLockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleLock) {
      onToggleLock(line);
    }
  };

  const handleLineNumberClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Copy line number to clipboard
    try {
      await navigator.clipboard.writeText(line.lineNumber.toString());

      // Trigger flash animation
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 500);

      // Notify parent component
      if (onCopyLine) {
        onCopyLine(line.lineNumber);
      }
    } catch (err) {
      console.error('Failed to copy line number:', err);
    }
  };

  return (
    <div
      className={`flex items-start gap-2 px-2 py-1 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-all ${
        isSelected ? 'bg-blue-50 border-blue-300' : ''
      } ${line.isPlaceholder ? 'bg-yellow-50 hover:border-yellow-400 hover:border-2 hover:border-dotted' : ''} ${
        line.isLocked ? 'bg-red-50 border-l-[3px] border-l-red-500' : ''
      }`}
      onClick={handleClick}
    >
      {/* Line Number */}
      <div className="flex-shrink-0 w-12 text-right">
        <button
          onClick={handleLineNumberClick}
          className={`text-xs text-gray-500 font-mono hover:text-blue-600 hover:font-semibold cursor-pointer px-1 py-0.5 rounded transition-colors ${
            isFlashing ? 'animate-flash' : ''
          }`}
          title="Click to copy line number"
        >
          {line.lineNumber}
        </button>
      </div>

      {/* Text Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-mono whitespace-pre-wrap break-words text-gray-900 ${
            line.isLocked ? 'opacity-70' : ''
          }`}
          style={{
            fontWeight: line.formatting?.bold ? 'bold' : 'normal',
            fontStyle: line.formatting?.italic ? 'italic' : 'normal',
            textDecoration: line.formatting?.underline ? 'underline' : 'none'
          }}
        >
          {line.text || ' '}
          {line.isPlaceholder && line.placeholderNames && line.placeholderNames.length > 0 && (
            <span className="ml-2 text-xs text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded">
              {line.placeholderNames.join(', ')}
            </span>
          )}
        </p>
      </div>

      {/* Lock Button */}
      <div className="flex-shrink-0">
        <button
          onClick={handleLockClick}
          className="p-1 rounded hover:bg-gray-200 transition-colors"
          title={line.isLocked ? 'Unlock line' : 'Lock line'}
          aria-label={line.isLocked ? 'Unlock line' : 'Lock line'}
        >
          {line.isLocked ? (
            <Lock className="w-4 h-4 text-red-600" />
          ) : (
            <Unlock className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );
}
