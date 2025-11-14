/**
 * Citation Resolver - Resolves citations to actual document content
 */

import { Citation, Document, Line } from '../parsers/types';

/**
 * Resolves a single citation to document content
 */
function resolveSingleCitation(citation: Citation, document: Document): Citation {
  try {
    const resolvedCitation = { ...citation };

    switch (citation.type) {
      case 'line': {
        const lineNumber = citation.lineNumbers[0];
        const line = document.lines.find(l => l.lineNumber === lineNumber);

        if (line) {
          resolvedCitation.resolvedContent = `Line ${lineNumber}: ${line.text}`;
          console.info(`[CITATION_RESOLVER] Resolved line ${lineNumber}`);
        } else {
          resolvedCitation.resolvedContent = `Line ${lineNumber}: [Not found]`;
          console.warn(`[CITATION_RESOLVER] Line ${lineNumber} not found in document`);
        }
        break;
      }

      case 'range': {
        const startLine = citation.lineNumbers[0];
        const endLine = citation.lineNumbers[citation.lineNumbers.length - 1];

        const lines = document.lines.filter(
          l => l.lineNumber >= startLine && l.lineNumber <= endLine
        );

        if (lines.length > 0) {
          const content = lines
            .map(l => `Line ${l.lineNumber}: ${l.text}`)
            .join('\n');

          resolvedCitation.resolvedContent = content;
          console.info(`[CITATION_RESOLVER] Resolved range ${startLine}-${endLine} (${lines.length} lines)`);
        } else {
          resolvedCitation.resolvedContent = `Lines ${startLine}-${endLine}: [Not found]`;
          console.warn(`[CITATION_RESOLVER] Range ${startLine}-${endLine} not found in document`);
        }
        break;
      }

      case 'page': {
        // Extract page number from reference
        const pageMatch = citation.reference.match(/@(?:page|p)(\d+)/i);
        if (!pageMatch) {
          resolvedCitation.resolvedContent = '[Invalid page reference]';
          break;
        }

        const pageNumber = parseInt(pageMatch[1], 10);
        const pageLines = document.lines.filter(l => l.pageNumber === pageNumber);

        if (pageLines.length > 0) {
          // Update line numbers for page citation
          resolvedCitation.lineNumbers = pageLines.map(l => l.lineNumber);

          const content = pageLines
            .map(l => `Line ${l.lineNumber}: ${l.text}`)
            .join('\n');

          resolvedCitation.resolvedContent = `Page ${pageNumber}:\n${content}`;
          console.info(`[CITATION_RESOLVER] Resolved page ${pageNumber} (${pageLines.length} lines)`);
        } else {
          resolvedCitation.resolvedContent = `Page ${pageNumber}: [Not found]`;
          console.warn(`[CITATION_RESOLVER] Page ${pageNumber} not found in document`);
        }
        break;
      }

      default:
        resolvedCitation.resolvedContent = '[Unknown citation type]';
        console.error(`[CITATION_RESOLVER] Unknown citation type: ${citation.type}`);
    }

    return resolvedCitation;

  } catch (error) {
    console.error(`[CITATION_RESOLVER] Error resolving citation ${citation.reference}:`, error);
    return {
      ...citation,
      resolvedContent: `[Error resolving ${citation.reference}]`
    };
  }
}

/**
 * Resolves all citations in a list to document content
 */
export function resolveCitations(
  citations: Citation[],
  document: Document
): Citation[] {
  try {
    console.info(`[CITATION_RESOLVER] Resolving ${citations.length} citations`);

    if (!document || !document.lines || document.lines.length === 0) {
      console.warn('[CITATION_RESOLVER] Document is empty or invalid');
      return citations.map(c => ({
        ...c,
        resolvedContent: '[Document not available]'
      }));
    }

    const resolved = citations.map(citation =>
      resolveSingleCitation(citation, document)
    );

    console.info('[CITATION_RESOLVER] All citations resolved');

    return resolved;

  } catch (error) {
    console.error('[CITATION_RESOLVER] Error resolving citations:', error);
    return citations.map(c => ({
      ...c,
      resolvedContent: '[Error resolving citation]'
    }));
  }
}

/**
 * Formats resolved citations as context for LLM
 */
export function formatCitationsAsContext(citations: Citation[]): string {
  try {
    if (citations.length === 0) {
      return '';
    }

    console.info('[CITATION_RESOLVER] Formatting citations as context');

    const context = [
      '--- Referenced Content ---',
      ...citations.map(c => c.resolvedContent),
      '--- End Referenced Content ---'
    ].join('\n\n');

    return context;

  } catch (error) {
    console.error('[CITATION_RESOLVER] Error formatting citations:', error);
    return '';
  }
}

/**
 * Gets specific lines from document by line numbers
 */
export function getLinesByNumbers(
  lineNumbers: number[],
  document: Document
): Line[] {
  try {
    const lines = lineNumbers
      .map(num => document.lines.find(l => l.lineNumber === num))
      .filter((l): l is Line => l !== undefined);

    console.info(`[CITATION_RESOLVER] Retrieved ${lines.length}/${lineNumbers.length} lines`);

    return lines;

  } catch (error) {
    console.error('[CITATION_RESOLVER] Error getting lines:', error);
    return [];
  }
}

/**
 * Gets all lines from a specific page
 */
export function getLinesByPage(
  pageNumber: number,
  document: Document
): Line[] {
  try {
    const lines = document.lines.filter(l => l.pageNumber === pageNumber);

    console.info(`[CITATION_RESOLVER] Retrieved ${lines.length} lines from page ${pageNumber}`);

    return lines;

  } catch (error) {
    console.error('[CITATION_RESOLVER] Error getting lines by page:', error);
    return [];
  }
}

/**
 * Validates if line numbers exist in document
 */
export function validateLineNumbers(
  lineNumbers: number[],
  document: Document
): { valid: number[]; invalid: number[] } {
  try {
    const valid: number[] = [];
    const invalid: number[] = [];

    const existingLineNumbers = new Set(document.lines.map(l => l.lineNumber));

    lineNumbers.forEach(num => {
      if (existingLineNumbers.has(num)) {
        valid.push(num);
      } else {
        invalid.push(num);
      }
    });

    if (invalid.length > 0) {
      console.warn(`[CITATION_RESOLVER] Invalid line numbers: ${invalid.join(', ')}`);
    }

    return { valid, invalid };

  } catch (error) {
    console.error('[CITATION_RESOLVER] Error validating line numbers:', error);
    return { valid: [], invalid: lineNumbers };
  }
}
