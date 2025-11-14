/**
 * Markdown Parser - Extracts lines from Markdown files
 * Line-by-line parsing with header detection and formatting preservation
 */

import { marked } from 'marked';
import { Line, LineFormatting } from './types';
import { isPlaceholderLine, detectPlaceholders } from './placeholder-detector';

const LINES_PER_PAGE = 50; // Configurable estimate for markdown

/**
 * Detects markdown formatting in a line
 */
function detectMarkdownFormatting(text: string): LineFormatting | undefined {
  const formatting: LineFormatting = {};

  // Check for bold (**text** or __text__)
  if (/\*\*.+?\*\*/.test(text) || /__.+?__/.test(text)) {
    formatting.bold = true;
  }

  // Check for italic (*text* or _text_)
  if (/\*.+?\*/.test(text) || /_.+?_/.test(text)) {
    formatting.italic = true;
  }

  // Check for headers (alignment center is common for headers)
  const headerMatch = text.match(/^(#{1,6})\s+(.+)$/);
  if (headerMatch) {
    const level = headerMatch[1].length;
    // H1 and H2 are often centered in documents
    if (level <= 2) {
      formatting.alignment = 'center';
    }
    // Headers are typically bold
    formatting.bold = true;
    // Size based on header level
    formatting.fontSize = 24 - (level * 2);
  }

  return Object.keys(formatting).length > 0 ? formatting : undefined;
}

/**
 * Extracts metadata from markdown content (title, headers)
 */
function extractMetadata(content: string): { title?: string; headers: string[] } {
  const headers: string[] = [];
  let title: string | undefined;

  try {
    const lines = content.split('\n');

    for (const line of lines) {
      // Check for headers
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        const headerText = headerMatch[2].trim();
        headers.push(headerText);

        // Use first H1 as title if not set
        if (!title && headerMatch[1] === '#') {
          title = headerText;
        }
      }
    }
  } catch (error) {
    console.error('[MD_PARSER] Error extracting metadata:', error);
  }

  return { title, headers };
}

/**
 * Parses Markdown content and extracts lines
 */
export async function parseMarkdown(content: string): Promise<Line[]> {
  const lines: Line[] = [];

  try {
    console.info('[MD_PARSER] Starting Markdown parsing');

    if (!content || content.trim().length === 0) {
      console.warn('[MD_PARSER] No content found in Markdown file');
      return lines;
    }

    // Extract metadata for logging
    const metadata = extractMetadata(content);
    if (metadata.title) {
      console.info(`[MD_PARSER] Document title: ${metadata.title}`);
    }
    if (metadata.headers.length > 0) {
      console.info(`[MD_PARSER] Found ${metadata.headers.length} headers`);
    }

    // Split into lines
    const rawLines = content.split('\n');

    rawLines.forEach((text, index) => {
      const lineNumber = index + 1;
      const pageNumber = Math.ceil(lineNumber / LINES_PER_PAGE);

      // Detect placeholders using comprehensive detector
      const placeholderDetection = detectPlaceholders(text);
      const isPlaceholder = isPlaceholderLine(text);
      const placeholderNames = placeholderDetection.placeholders.map(ph => ph.name);

      // Detect markdown formatting
      const formatting = detectMarkdownFormatting(text);

      lines.push({
        lineNumber,
        text: text, // Keep original formatting including whitespace
        pageNumber,
        isLocked: false,
        isPlaceholder,
        formatting,
        placeholderNames: placeholderNames.length > 0 ? placeholderNames : undefined
      });
    });

    console.info(`[MD_PARSER] Successfully parsed ${lines.length} lines from ${Math.ceil(lines.length / LINES_PER_PAGE)} estimated pages`);

    // Count placeholder lines
    const placeholderLineCount = lines.filter(line => line.isPlaceholder).length;
    console.info(`[MD_PARSER] Detected ${placeholderLineCount} placeholder lines`);

    return lines;

  } catch (error) {
    console.error('[MD_PARSER] Error parsing Markdown:', error);
    throw new Error(`Failed to parse Markdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parses Markdown from Buffer
 */
export async function parseMarkdownBuffer(buffer: Buffer): Promise<Line[]> {
  try {
    const content = buffer.toString('utf-8');
    return await parseMarkdown(content);
  } catch (error) {
    console.error('[MD_PARSER] Error parsing Markdown buffer:', error);
    throw new Error(`Failed to parse Markdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validates if content is valid Markdown
 */
export function isValidMarkdown(content: string): boolean {
  try {
    // Basic validation - check if it's valid text
    // Markdown is quite permissive, so we just check for common patterns
    if (!content || content.trim().length === 0) {
      return false;
    }

    // Try to parse with marked to validate
    marked.parse(content);
    return true;
  } catch (error) {
    console.error('[MD_PARSER] Error validating Markdown:', error);
    return false;
  }
}

/**
 * Converts parsed lines back to Markdown
 */
export function linesToMarkdown(lines: Line[]): string {
  try {
    return lines.map(line => line.text).join('\n');
  } catch (error) {
    console.error('[MD_PARSER] Error converting lines to Markdown:', error);
    throw new Error(`Failed to convert lines to Markdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
