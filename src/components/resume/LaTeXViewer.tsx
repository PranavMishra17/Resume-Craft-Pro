/**
 * LaTeX Viewer Component
 *
 * Display and edit LaTeX resumes:
 * - CodeMirror editor for LaTeX editing
 * - Syntax highlighting
 * - Line numbers
 * - Read-only or editable mode
 */

'use client';

import { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { StreamLanguage } from '@codemirror/language';
import { stex } from '@codemirror/legacy-modes/mode/stex';

interface LaTeXViewerProps {
  content: string;
  onChange?: (content: string) => void;
  readOnly?: boolean;
  height?: string;
}

export default function LaTeXViewer({
  content,
  onChange,
  readOnly = false,
  height = '600px'
}: LaTeXViewerProps) {
  const [localContent, setLocalContent] = useState(content);

  const handleChange = (value: string) => {
    setLocalContent(value);
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-100 border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">LaTeX Source</span>
          {readOnly && (
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
              Read Only
            </span>
          )}
        </div>
      </div>

      <CodeMirror
        value={localContent}
        height={height}
        extensions={[
          StreamLanguage.define(stex),
          EditorView.lineWrapping,
          EditorView.theme({
            '&': {
              fontSize: '13px',
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace'
            },
            '.cm-content': {
              padding: '10px 0'
            }
          })
        ]}
        onChange={handleChange}
        readOnly={readOnly}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightActiveLine: true,
          foldGutter: true,
          dropCursor: true,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          highlightSelectionMatches: true
        }}
        className="text-sm"
      />
    </div>
  );
}
