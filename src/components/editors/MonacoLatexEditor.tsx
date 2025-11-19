'use client';

/**
 * Monaco LaTeX Editor Component
 * Full-featured LaTeX editor with syntax highlighting
 */

import { useEffect, useRef } from 'react';
import Editor, { BeforeMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface MonacoLatexEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  height?: string;
  theme?: 'vs-dark' | 'light';
}

export default function MonacoLatexEditor({
  value,
  onChange,
  readOnly = false,
  height = '100%',
  theme = 'vs-dark',
}: MonacoLatexEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorWillMount: BeforeMount = (monaco) => {
    // Register LaTeX language
    monaco.languages.register({ id: 'latex' });

    // Define LaTeX tokenization rules
    monaco.languages.setMonarchTokensProvider('latex', {
      defaultToken: '',
      tokenPostfix: '.latex',

      // Special characters
      escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

      // LaTeX commands
      commands: /\\(?:[a-zA-Z@]+|.)/,

      tokenizer: {
        root: [
          // Comments
          [/%.*$/, 'comment'],

          // Math delimiters
          [/\$\$/, { token: 'keyword.math', next: '@displaymath' }],
          [/\$/, { token: 'keyword.math', next: '@math' }],
          [/\\\[/, { token: 'keyword.math', next: '@displaymath' }],
          [/\\\(/, { token: 'keyword.math', next: '@math' }],

          // Environments
          [/\\begin\{([^}]+)\}/, { token: 'keyword.environment', next: '@environment.$1' }],
          [/\\end\{([^}]+)\}/, 'keyword.environment'],

          // Commands with arguments
          [/\\(documentclass|usepackage|newcommand|renewcommand|title|author|date|section|subsection|subsubsection|chapter|part|paragraph|subparagraph)/, 'keyword.command'],
          [/\\(textbf|textit|texttt|emph|underline|textsc|textrm|textsf)/, 'keyword.formatting'],
          [/\\(href|url|label|ref|cite|footnote|item|caption)/, 'keyword.reference'],
          [/\\(color|textcolor|colorbox|definecolor)/, 'keyword.color'],
          [/\\(includegraphics|figure|table|tabular|minipage)/, 'keyword.structure'],

          // Generic commands
          [/@commands/, 'keyword'],

          // Curly braces (arguments)
          [/\{/, { token: 'delimiter.curly', next: '@braces' }],
          [/\}/, 'delimiter.curly'],

          // Square brackets (optional arguments)
          [/\[/, { token: 'delimiter.square', next: '@brackets' }],
          [/\]/, 'delimiter.square'],

          // Special characters
          [/[{}[\]()\\]/, 'delimiter'],

          // Numbers
          [/\d+/, 'number'],

          // Whitespace
          [/\s+/, 'white'],
        ],

        // Math mode
        math: [
          [/\$/, { token: 'keyword.math', next: '@pop' }],
          [/\\\)/, { token: 'keyword.math', next: '@pop' }],
          [/@commands/, 'keyword.math'],
          [/[^$\\]+/, 'variable.math'],
        ],

        displaymath: [
          [/\$\$/, { token: 'keyword.math', next: '@pop' }],
          [/\\\]/, { token: 'keyword.math', next: '@pop' }],
          [/@commands/, 'keyword.math'],
          [/[^$\\]+/, 'variable.math'],
        ],

        // Environment content
        environment: [
          [/\\end\{([^}]+)\}/, { token: 'keyword.environment', next: '@pop' }],
          { include: 'root' },
        ],

        // Curly braces content
        braces: [
          [/\{/, { token: 'delimiter.curly', next: '@braces' }],
          [/\}/, { token: 'delimiter.curly', next: '@pop' }],
          [/@commands/, 'keyword'],
          [/[^{}\\]+/, 'string'],
        ],

        // Square brackets content
        brackets: [
          [/\[/, { token: 'delimiter.square', next: '@brackets' }],
          [/\]/, { token: 'delimiter.square', next: '@pop' }],
          [/@commands/, 'keyword'],
          [/[^\]\\]+/, 'attribute'],
        ],
      },
    });

    // Define theme colors for LaTeX
    monaco.editor.defineTheme('latex-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'keyword.command', foreground: '569CD6' },
        { token: 'keyword.formatting', foreground: 'DCDCAA' },
        { token: 'keyword.reference', foreground: '4EC9B0' },
        { token: 'keyword.color', foreground: 'CE9178' },
        { token: 'keyword.structure', foreground: '9CDCFE' },
        { token: 'keyword.environment', foreground: 'C586C0', fontStyle: 'bold' },
        { token: 'keyword.math', foreground: '569CD6', fontStyle: 'bold' },
        { token: 'variable.math', foreground: '4FC1FF' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'attribute', foreground: '9CDCFE' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'delimiter', foreground: 'D4D4D4' },
        { token: 'delimiter.curly', foreground: 'FFD700' },
        { token: 'delimiter.square', foreground: 'DA70D6' },
      ],
      colors: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#D4D4D4',
        'editorLineNumber.foreground': '#858585',
        'editor.selectionBackground': '#264F78',
        'editor.inactiveSelectionBackground': '#3A3D41',
      },
    });
  };

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    // Focus editor on mount
    editor.focus();
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  return (
    <Editor
      height={height}
      language="latex"
      theme="latex-dark"
      value={value}
      onChange={handleEditorChange}
      beforeMount={handleEditorWillMount}
      onMount={handleEditorDidMount}
      options={{
        readOnly,
        minimap: { enabled: true },
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
        wordWrap: 'on',
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        insertSpaces: true,
        formatOnPaste: true,
        formatOnType: true,
        renderWhitespace: 'selection',
        bracketPairColorization: {
          enabled: true,
        },
        // LaTeX-specific features
        quickSuggestions: {
          other: true,
          comments: false,
          strings: false,
        },
        acceptSuggestionOnCommitCharacter: true,
        acceptSuggestionOnEnter: 'on',
        snippetSuggestions: 'top',
      }}
      loading={
        <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p>Loading editor...</p>
          </div>
        </div>
      }
    />
  );
}

/**
 * Toolbar component for editor actions
 */
interface EditorToolbarProps {
  onPreview: () => void;
  onSave: () => void;
  onExport: () => void;
  isCompiling: boolean;
  isSaving: boolean;
}

export function EditorToolbar({
  onPreview,
  onSave,
  onExport,
  isCompiling,
  isSaving,
}: EditorToolbarProps) {
  return (
    <div className="flex items-center gap-2 p-3 border-b bg-gray-50 dark:bg-gray-800">
      <button
        onClick={onPreview}
        disabled={isCompiling}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
      >
        {isCompiling ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Compiling...</span>
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span>Preview PDF</span>
          </>
        )}
      </button>

      <button
        onClick={onSave}
        disabled={isSaving}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
      >
        {isSaving ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Saving...</span>
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
            <span>Save</span>
          </>
        )}
      </button>

      <button
        onClick={onExport}
        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        <span>Export</span>
      </button>

      <div className="flex-1"></div>

      <div className="text-sm text-gray-600 dark:text-gray-400">
        <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">
          Ctrl/Cmd + S
        </kbd>{' '}
        to save
      </div>
    </div>
  );
}
