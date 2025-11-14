/**
 * DOCX Parser - Extracts text from DOCX files line by line
 * Uses mammoth library for parsing with formatting preservation
 */

import mammoth from 'mammoth';
import { Line, LineFormatting } from './types';
import { isPlaceholderLine, detectPlaceholders } from './placeholder-detector';

const LINES_PER_PAGE = 40; // Configurable estimate

/**
 * Parses DOCX file buffer and extracts lines with formatting
 */
export async function parseDocx(buffer: Buffer): Promise<Line[]> {
  const lines: Line[] = [];

  try {
    console.info('[DOCX_PARSER] Starting DOCX parsing');

    // Extract text with basic HTML to preserve some formatting
    const result = await mammoth.convertToHtml({ buffer });

    if (!result.value) {
      console.warn('[DOCX_PARSER] No text content found in DOCX');
      return lines;
    }

    console.info('[DOCX_PARSER] HTML extracted successfully, processing lines');

    // Parse HTML to extract text and formatting
    // For now, we'll extract raw text and detect formatting markers
    // In the future, we can use a proper HTML parser for better formatting extraction
    const htmlContent = result.value;

    // Split by common block elements to get lines
    // IMPORTANT: Use non-capturing group (?:...) to avoid capturing tag names as separate elements
    const blockElements = htmlContent
      .split(/<\/?(?:p|div|h[1-6]|li)[^>]*>/gi)
      .filter(line => line.trim().length > 0);

    blockElements.forEach((htmlLine) => {
      // Strip HTML tags to get plain text
      const text = htmlLine.replace(/<[^>]*>/g, '').trim();

      if (text.length === 0) return;

      const lineNumber = lines.length + 1;
      const pageNumber = Math.ceil(lineNumber / LINES_PER_PAGE);

      // Detect placeholders using comprehensive detector
      const placeholderDetection = detectPlaceholders(text);
      const isPlaceholder = isPlaceholderLine(text);
      const placeholderNames = placeholderDetection.placeholders.map(ph => ph.name);

      // Extract basic formatting from HTML
      const formatting: LineFormatting = {};

      if (htmlLine.includes('<strong>') || htmlLine.includes('<b>')) {
        formatting.bold = true;
      }
      if (htmlLine.includes('<em>') || htmlLine.includes('<i>')) {
        formatting.italic = true;
      }
      if (htmlLine.includes('<u>')) {
        formatting.underline = true;
      }

      lines.push({
        lineNumber,
        text,
        pageNumber,
        isLocked: false,
        isPlaceholder,
        formatting: Object.keys(formatting).length > 0 ? formatting : undefined,
        placeholderNames: placeholderNames.length > 0 ? placeholderNames : undefined
      });
    });

    console.info(`[DOCX_PARSER] Successfully parsed ${lines.length} lines from ${Math.ceil(lines.length / LINES_PER_PAGE)} estimated pages`);

    // Count placeholder lines
    const placeholderLineCount = lines.filter(line => line.isPlaceholder).length;
    console.info(`[DOCX_PARSER] Detected ${placeholderLineCount} placeholder lines`);

    // Log warnings if any
    if (result.messages && result.messages.length > 0) {
      console.warn('[DOCX_PARSER] Parsing warnings:', result.messages);
    }

    return lines;

  } catch (error) {
    console.error('[DOCX_PARSER] Error parsing DOCX:', error);
    throw new Error(`Failed to parse DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validates if buffer is a valid DOCX file
 */
export function isValidDocx(buffer: Buffer): boolean {
  try {
    // DOCX files are ZIP archives, check for PK signature
    const signature = buffer.toString('hex', 0, 4);
    return signature === '504b0304'; // PK.. signature
  } catch (error) {
    console.error('[DOCX_PARSER] Error validating DOCX:', error);
    return false;
  }
}
