/**
 * Main Parser Router - Detects format and routes to appropriate parser
 */

import { parseDocx, isValidDocx } from './docx';
import { parsePdfSimple, isValidPdf } from './pdf';
import { parseMarkdownBuffer } from './markdown';
import { Document, DocumentFormat, Line, ParseResult } from './types';
import { randomUUID } from 'crypto';

/**
 * Detects document format from file extension and/or mime type
 */
export function detectFormat(
  fileName: string,
  mimeType?: string,
  buffer?: Buffer
): DocumentFormat | null {
  try {
    console.info(`[PARSER] Detecting format for file: ${fileName}, mime: ${mimeType}`);

    // First try by buffer signature
    if (buffer) {
      if (isValidDocx(buffer)) {
        console.info('[PARSER] Detected format: DOCX (by signature)');
        return 'docx';
      }
      if (isValidPdf(buffer)) {
        console.info('[PARSER] Detected format: PDF (by signature)');
        return 'pdf';
      }
    }

    // Try by mime type
    if (mimeType) {
      if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) {
        console.info('[PARSER] Detected format: DOCX (by mime type)');
        return 'docx';
      }
      if (mimeType.includes('pdf')) {
        console.info('[PARSER] Detected format: PDF (by mime type)');
        return 'pdf';
      }
      if (mimeType.includes('markdown') || mimeType.includes('text/plain')) {
        console.info('[PARSER] Detected format: Markdown (by mime type)');
        return 'markdown';
      }
    }

    // Fallback to file extension
    const ext = fileName.toLowerCase().split('.').pop();

    switch (ext) {
      case 'docx':
        console.info('[PARSER] Detected format: DOCX (by extension)');
        return 'docx';
      case 'pdf':
        console.info('[PARSER] Detected format: PDF (by extension)');
        return 'pdf';
      case 'md':
      case 'markdown':
      case 'txt':
        console.info('[PARSER] Detected format: Markdown (by extension)');
        return 'markdown';
      default:
        console.warn(`[PARSER] Unknown format for extension: ${ext}`);
        return null;
    }
  } catch (error) {
    console.error('[PARSER] Error detecting format:', error);
    return null;
  }
}

/**
 * Main parse function - routes to appropriate parser
 */
export async function parseDocument(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<ParseResult> {
  try {
    console.info(`[PARSER] Starting document parsing: ${fileName}`);

    // Detect format
    const format = detectFormat(fileName, mimeType, buffer);

    if (!format) {
      const error = `Unsupported file format: ${fileName}`;
      console.error(`[PARSER] ${error}`);
      return {
        document: {
          id: randomUUID(),
          lines: [],
          metadata: {
            totalLines: 0,
            totalPages: 0,
            format: 'markdown',
            fileName,
            fileSize: buffer.length
          }
        },
        error
      };
    }

    // Parse based on format
    let lines: Line[] = [];

    try {
      switch (format) {
        case 'docx':
          console.info('[PARSER] Routing to DOCX parser');
          lines = await parseDocx(buffer);
          break;

        case 'pdf':
          console.info('[PARSER] Routing to PDF parser');
          lines = await parsePdfSimple(buffer);
          break;

        case 'markdown':
          console.info('[PARSER] Routing to Markdown parser');
          lines = await parseMarkdownBuffer(buffer);
          break;

        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (parseError) {
      console.error(`[PARSER] Error parsing ${format}:`, parseError);
      throw parseError;
    }

    // Create document object
    const document: Document = {
      id: randomUUID(),
      lines,
      metadata: {
        totalLines: lines.length,
        totalPages: lines.length > 0 ? Math.max(...lines.map(l => l.pageNumber)) : 0,
        format,
        fileName,
        fileSize: buffer.length,
        uploadedAt: new Date()
      }
    };

    console.info(
      `[PARSER] Successfully parsed document: ${lines.length} lines, ${document.metadata.totalPages} pages`
    );

    return { document };

  } catch (error) {
    console.error('[PARSER] Error parsing document:', error);
    return {
      document: {
        id: randomUUID(),
        lines: [],
        metadata: {
          totalLines: 0,
          totalPages: 0,
          format: 'markdown',
          fileName,
          fileSize: buffer.length
        }
      },
      error: error instanceof Error ? error.message : 'Unknown parsing error'
    };
  }
}

/**
 * Validates if a file can be parsed
 */
export function canParseFile(fileName: string, mimeType?: string): boolean {
  const format = detectFormat(fileName, mimeType);
  return format !== null;
}

// Re-export types and parsers for external use
export * from './types';
export { parseDocx } from './docx';
export { parsePdfSimple as parsePdf } from './pdf';
export { parseMarkdown, parseMarkdownBuffer } from './markdown';
