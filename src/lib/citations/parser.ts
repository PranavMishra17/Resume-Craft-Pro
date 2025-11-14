/**
 * Citation Parser - Extracts @line, @page, and @range citations from text
 */

import { Citation } from '../parsers/types';

// Citation patterns
const CITATION_PATTERNS = {
  line: /@(?:line|l)(\d+)/gi,           // @line10 or @l10
  range: /@(?:line|l)(\d+)-(\d+)/gi,    // @l5-10 or @line5-10
  page: /@(?:page|p)(\d+)/gi            // @page3 or @p3
};

/**
 * Parses citations from a message
 */
export function parseCitations(message: string): Citation[] {
  const citations: Citation[] = [];

  try {
    console.info('[CITATION_PARSER] Parsing citations from message');

    // Track processed positions to avoid duplicates
    const processed = new Set<string>();

    // Parse line ranges first (to avoid conflicts with single lines)
    let match;
    const rangePattern = new RegExp(CITATION_PATTERNS.range);

    while ((match = rangePattern.exec(message)) !== null) {
      const startLine = parseInt(match[1], 10);
      const endLine = parseInt(match[2], 10);
      const reference = match[0];

      if (startLine > endLine) {
        console.warn(`[CITATION_PARSER] Invalid range: ${reference} (start > end)`);
        continue;
      }

      const lineNumbers = Array.from(
        { length: endLine - startLine + 1 },
        (_, i) => startLine + i
      );

      const key = `range:${startLine}-${endLine}`;
      if (!processed.has(key)) {
        citations.push({
          type: 'range',
          reference,
          lineNumbers,
          resolvedContent: '' // Will be filled by resolver
        });
        processed.add(key);
        console.info(`[CITATION_PARSER] Found range citation: ${reference} (lines ${startLine}-${endLine})`);
      }
    }

    // Parse single line citations
    const linePattern = new RegExp(CITATION_PATTERNS.line);

    while ((match = linePattern.exec(message)) !== null) {
      const lineNumber = parseInt(match[1], 10);
      const reference = match[0];

      // Check if this line is already part of a range
      const inRange = citations.some(
        c => c.type === 'range' && c.lineNumbers.includes(lineNumber)
      );

      const key = `line:${lineNumber}`;
      if (!inRange && !processed.has(key)) {
        citations.push({
          type: 'line',
          reference,
          lineNumbers: [lineNumber],
          resolvedContent: '' // Will be filled by resolver
        });
        processed.add(key);
        console.info(`[CITATION_PARSER] Found line citation: ${reference}`);
      }
    }

    // Parse page citations
    const pagePattern = new RegExp(CITATION_PATTERNS.page);

    while ((match = pagePattern.exec(message)) !== null) {
      const pageNumber = parseInt(match[1], 10);
      const reference = match[0];

      const key = `page:${pageNumber}`;
      if (!processed.has(key)) {
        citations.push({
          type: 'page',
          reference,
          lineNumbers: [], // Will be filled by resolver based on page
          resolvedContent: '' // Will be filled by resolver
        });
        processed.add(key);
        console.info(`[CITATION_PARSER] Found page citation: ${reference}`);
      }
    }

    console.info(`[CITATION_PARSER] Parsed ${citations.length} citations`);

    return citations;

  } catch (error) {
    console.error('[CITATION_PARSER] Error parsing citations:', error);
    return [];
  }
}

/**
 * Extracts all citation references from text without full parsing
 */
export function extractCitationReferences(message: string): string[] {
  try {
    const references: string[] = [];

    // Extract all citation patterns
    const allPatterns = Object.values(CITATION_PATTERNS);

    allPatterns.forEach(pattern => {
      const regex = new RegExp(pattern);
      let match;

      while ((match = regex.exec(message)) !== null) {
        references.push(match[0]);
      }
    });

    return [...new Set(references)]; // Remove duplicates

  } catch (error) {
    console.error('[CITATION_PARSER] Error extracting references:', error);
    return [];
  }
}

/**
 * Checks if a message contains any citations
 */
export function hasCitations(message: string): boolean {
  try {
    return Object.values(CITATION_PATTERNS).some(pattern =>
      new RegExp(pattern).test(message)
    );
  } catch (error) {
    console.error('[CITATION_PARSER] Error checking citations:', error);
    return false;
  }
}

/**
 * Highlights citations in text for display (wraps in special markers)
 */
export function highlightCitations(message: string): string {
  try {
    let highlighted = message;

    // Highlight ranges
    highlighted = highlighted.replace(
      CITATION_PATTERNS.range,
      '<cite>$&</cite>'
    );

    // Highlight single lines
    highlighted = highlighted.replace(
      CITATION_PATTERNS.line,
      '<cite>$&</cite>'
    );

    // Highlight pages
    highlighted = highlighted.replace(
      CITATION_PATTERNS.page,
      '<cite>$&</cite>'
    );

    return highlighted;

  } catch (error) {
    console.error('[CITATION_PARSER] Error highlighting citations:', error);
    return message;
  }
}
