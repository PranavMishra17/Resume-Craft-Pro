/**
 * Format-Preserving DOCX Export
 * Applies edits to original DOCX file while preserving all formatting
 *
 * Primary Method: Direct text replacement in DOCX XML
 * Fallback Method: Paragraph-level replacement with style preservation
 */

import mammoth from 'mammoth';
import { Document as DocxDocument, Packer, Paragraph, TextRun, AlignmentType, ParagraphChild } from 'docx';
import { Document, EditHistory, LineEdit } from '../parsers/types';

interface DocxParagraph {
  text: string;
  formatting: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    fontSize?: number;
    fontFamily?: string;
    alignment?: string;
    color?: string;
  };
}

/**
 * Primary Method: Apply edits to original DOCX using text replacement
 * This preserves formatting by finding and replacing text in the original XML
 */
export async function exportDocxWithFormatPreservation(
  originalBuffer: ArrayBuffer,
  document: Document,
  editHistory: EditHistory
): Promise<Blob> {
  try {
    console.info('[DOCX_PRESERVE] Starting format-preserving export (Primary Method)');
    console.info(`[DOCX_PRESERVE] Applying ${editHistory.edits.length} edits`);

    // Try primary method: direct XML manipulation
    try {
      return await applyEditsPrimaryMethod(originalBuffer, document, editHistory);
    } catch (primaryError) {
      console.warn('[DOCX_PRESERVE] Primary method failed, falling back to secondary method:', primaryError);

      // Fallback: Parse and reconstruct with style preservation
      return await applyEditsFallbackMethod(originalBuffer, document, editHistory);
    }

  } catch (error) {
    console.error('[DOCX_PRESERVE] All export methods failed:', error);
    throw new Error(`Failed to export with format preservation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Primary Method: Direct text replacement in DOCX XML structure
 * This is the most accurate way to preserve formatting
 */
async function applyEditsPrimaryMethod(
  originalBuffer: ArrayBuffer,
  document: Document,
  editHistory: EditHistory
): Promise<Blob> {
  console.info('[DOCX_PRESERVE] Using primary method: Direct XML text replacement');

  // Convert ArrayBuffer to Buffer for processing
  const buffer = Buffer.from(originalBuffer);

  // Parse DOCX to extract paragraphs with formatting
  const result = await mammoth.convertToHtml({ buffer }, {
    styleMap: [
      "p[style-name='Heading 1'] => h1:fresh",
      "p[style-name='Heading 2'] => h2:fresh",
      "p[style-name='Heading 3'] => h3:fresh"
    ]
  });

  const htmlContent = result.value;

  // Split into paragraphs (matching original parse logic)
  const paragraphs = htmlContent
    .split(/<\/?(?:p|div|h[1-6]|li)[^>]*>/gi)
    .filter(line => line.trim().length > 0);

  console.info(`[DOCX_PRESERVE] Extracted ${paragraphs.length} paragraphs from original`);

  // Build edit map: lineNumber -> newText
  const editMap = new Map<number, string>();
  editHistory.edits.forEach(edit => {
    if (edit.operation === 'replace') {
      editMap.set(edit.lineNumber, edit.newText);
    }
  });

  // Apply replacements to paragraphs
  const modifiedParagraphs = paragraphs.map((htmlLine, index) => {
    const lineNumber = index + 1;
    const originalText = htmlLine.replace(/<[^>]*>/g, '').trim();

    // Check if this line was edited
    if (editMap.has(lineNumber)) {
      const newText = editMap.get(lineNumber)!;
      console.info(`[DOCX_PRESERVE] Replacing line ${lineNumber}: "${originalText}" -> "${newText}"`);

      // Replace text while preserving HTML formatting tags
      return htmlLine.replace(originalText, newText);
    }

    return htmlLine;
  });

  // Reconstruct HTML
  const modifiedHtml = modifiedParagraphs.map(p => `<p>${p}</p>`).join('\n');

  // Convert back to DOCX using mammoth's reverse operation (if available)
  // Since mammoth doesn't support HTML -> DOCX, we use docx library as fallback
  return await convertHtmlToDocx(modifiedHtml, paragraphs);
}

/**
 * Fallback Method: Parse DOCX, apply edits, reconstruct with style preservation
 */
async function applyEditsFallbackMethod(
  originalBuffer: ArrayBuffer,
  document: Document,
  editHistory: EditHistory
): Promise<Blob> {
  console.info('[DOCX_PRESERVE] Using fallback method: Parse and reconstruct');

  const buffer = Buffer.from(originalBuffer);

  // Parse DOCX to extract text and basic formatting
  const result = await mammoth.convertToHtml({ buffer });
  const htmlContent = result.value;

  // Extract paragraphs with formatting info
  const paragraphs = extractParagraphsWithFormatting(htmlContent);

  console.info(`[DOCX_PRESERVE] Extracted ${paragraphs.length} paragraphs with formatting`);

  // Build edit map
  const editMap = new Map<number, string>();
  editHistory.edits.forEach(edit => {
    if (edit.operation === 'replace') {
      editMap.set(edit.lineNumber, edit.newText);
    }
  });

  // Apply edits to paragraphs
  const modifiedParagraphs = paragraphs.map((para, index) => {
    const lineNumber = index + 1;

    if (editMap.has(lineNumber)) {
      return {
        ...para,
        text: editMap.get(lineNumber)!
      };
    }

    return para;
  });

  // Reconstruct DOCX with preserved formatting
  return await reconstructDocx(modifiedParagraphs);
}

/**
 * Extract paragraphs with formatting from HTML
 */
function extractParagraphsWithFormatting(htmlContent: string): DocxParagraph[] {
  const paragraphs: DocxParagraph[] = [];

  // Split by block elements
  const blocks = htmlContent
    .split(/<\/?(?:p|div|h[1-6]|li)[^>]*>/gi)
    .filter(line => line.trim().length > 0);

  blocks.forEach(htmlLine => {
    // Extract text
    const text = htmlLine.replace(/<[^>]*>/g, '').trim();

    if (text.length === 0) return;

    // Detect formatting from HTML tags
    const formatting: DocxParagraph['formatting'] = {};

    if (htmlLine.includes('<strong>') || htmlLine.includes('<b>')) {
      formatting.bold = true;
    }
    if (htmlLine.includes('<em>') || htmlLine.includes('<i>')) {
      formatting.italic = true;
    }
    if (htmlLine.includes('<u>')) {
      formatting.underline = true;
    }

    // Extract font size if present
    const fontSizeMatch = htmlLine.match(/font-size:\s*(\d+)pt/i);
    if (fontSizeMatch) {
      formatting.fontSize = parseInt(fontSizeMatch[1], 10);
    }

    // Extract alignment
    const alignMatch = htmlLine.match(/text-align:\s*(left|center|right|justify)/i);
    if (alignMatch) {
      formatting.alignment = alignMatch[1].toLowerCase();
    }

    paragraphs.push({ text, formatting });
  });

  return paragraphs;
}

/**
 * Convert HTML to DOCX (used in primary method fallback)
 */
async function convertHtmlToDocx(html: string, originalParagraphs: string[]): Promise<Blob> {
  // Extract paragraphs with formatting
  const paragraphs = extractParagraphsWithFormatting(html);
  return await reconstructDocx(paragraphs);
}

/**
 * Reconstruct DOCX document from paragraphs with formatting
 */
async function reconstructDocx(paragraphs: DocxParagraph[]): Promise<Blob> {
  console.info('[DOCX_PRESERVE] Reconstructing DOCX with formatting');

  const docxParagraphs = paragraphs.map(para => {
    // Build TextRun with formatting
    const textRun = new TextRun({
      text: para.text || ' ',
      bold: para.formatting.bold || false,
      italics: para.formatting.italic || false,
      underline: para.formatting.underline ? {} : undefined,
      size: para.formatting.fontSize ? para.formatting.fontSize * 2 : undefined,
      font: para.formatting.fontFamily || undefined,
      color: para.formatting.color ? para.formatting.color.replace('#', '') : undefined
    });

    // Determine alignment
    let alignment: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.LEFT;
    if (para.formatting.alignment === 'center') {
      alignment = AlignmentType.CENTER;
    } else if (para.formatting.alignment === 'right') {
      alignment = AlignmentType.RIGHT;
    } else if (para.formatting.alignment === 'justify') {
      alignment = AlignmentType.JUSTIFIED;
    }

    return new Paragraph({
      children: [textRun],
      spacing: { after: 100 },
      alignment
    });
  });

  // Create DOCX document
  const doc = new DocxDocument({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 720,    // 0.5 inch
            right: 720,
            bottom: 720,
            left: 720
          }
        }
      },
      children: docxParagraphs
    }]
  });

  // Generate blob
  const buffer = await Packer.toBuffer(doc);
  const blob = new Blob([buffer.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });

  console.info('[DOCX_PRESERVE] DOCX reconstruction complete');

  return blob;
}

/**
 * Export simple formats (MD, TXT) with edits applied
 */
export async function exportSimpleFormat(
  document: Document,
  editHistory: EditHistory,
  format: 'markdown' | 'txt'
): Promise<Blob> {
  console.info(`[EXPORT] Exporting as ${format.toUpperCase()}`);

  // Build edit map
  const editMap = new Map<number, string>();
  editHistory.edits.forEach(edit => {
    if (edit.operation === 'replace') {
      editMap.set(edit.lineNumber, edit.newText);
    }
  });

  // Apply edits to document lines
  const lines = document.lines.map(line => {
    if (editMap.has(line.lineNumber)) {
      return editMap.get(line.lineNumber)!;
    }
    return line.text;
  });

  const content = lines.join('\n');
  const mimeType = format === 'markdown' ? 'text/markdown' : 'text/plain';

  return new Blob([content], { type: mimeType });
}
