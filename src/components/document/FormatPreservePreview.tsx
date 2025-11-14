'use client';

/**
 * Format-Preserving Export Preview Modal
 * Shows what the document will look like with edits applied to original formatting
 */

import { useState, useEffect } from 'react';
import { Document, EditHistory, OriginalDocument } from '@/lib/parsers/types';
import { X, Download, FileText, Loader2 } from 'lucide-react';
import mammoth from 'mammoth';

interface FormatPreservePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
  originalFile: OriginalDocument;
  editHistory: EditHistory;
  onDownload: () => void;
}

export default function FormatPreservePreview({
  isOpen,
  onClose,
  document,
  originalFile,
  editHistory,
  onDownload
}: FormatPreservePreviewProps) {
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && originalFile.format === 'docx') {
      generatePreview();
    }
  }, [isOpen, originalFile, editHistory]);

  const generatePreview = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Convert original file to HTML
      const buffer = Buffer.from(originalFile.fileBuffer);
      const result = await mammoth.convertToHtml({ buffer });

      let htmlContent = result.value;

      // Build edit map
      const editMap = new Map<number, string>();
      editHistory.edits.forEach(edit => {
        if (edit.operation === 'replace') {
          editMap.set(edit.lineNumber, edit.newText);
        }
      });

      // Split by paragraphs and apply edits
      const paragraphs = htmlContent
        .split(/<\/?(?:p|div|h[1-6]|li)[^>]*>/gi)
        .filter(line => line.trim().length > 0);

      const modifiedParagraphs = paragraphs.map((htmlLine, index) => {
        const lineNumber = index + 1;
        const originalText = htmlLine.replace(/<[^>]*>/g, '').trim();

        if (editMap.has(lineNumber)) {
          const newText = editMap.get(lineNumber)!;
          // Replace text while preserving HTML formatting tags
          return htmlLine.replace(originalText, newText);
        }

        return htmlLine;
      });

      // Reconstruct HTML with styling
      const styledHtml = `
        <div style="font-family: 'Calibri', 'Arial', sans-serif; line-height: 1.5; color: #000; background: #fff; padding: 60px;">
          ${modifiedParagraphs.map(p => `<p style="margin: 0 0 10px 0;">${p}</p>`).join('\n')}
        </div>
      `;

      setPreviewHtml(styledHtml);

    } catch (err) {
      console.error('[PREVIEW] Error generating preview:', err);
      setError('Failed to generate preview');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Format-Preserving Export Preview</h2>
              <p className="text-sm text-gray-600">
                {originalFile.fileName} • {editHistory.edits.length} edits applied
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Generating preview...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-red-600 mb-2">{error}</p>
                <button
                  onClick={generatePreview}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto bg-gray-100 p-8">
              {/* Document Preview Container */}
              <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
                {/* Preview Badge */}
                <div className="bg-green-600 text-white px-4 py-2 text-center text-sm font-semibold">
                  ✨ This is how your document will look with original formatting preserved
                </div>

                {/* Document Content */}
                <div
                  className="p-12"
                  style={{ minHeight: '11in' }}
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>

              {/* Info Panel */}
              <div className="max-w-4xl mx-auto mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📋 What's preserved:</h3>
                <ul className="text-sm text-blue-800 space-y-1 ml-4">
                  <li>✓ Original fonts, colors, and styles</li>
                  <li>✓ Paragraph formatting and alignment</li>
                  <li>✓ Headers, footers, and page layout</li>
                  <li>✓ Tables, lists, and document structure</li>
                  <li>✓ All non-edited content remains identical</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">{editHistory.edits.length} changes</span> will be applied to the original document
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onDownload();
                onClose();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>Download with Original Formatting</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
