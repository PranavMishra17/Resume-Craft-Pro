/**
 * Gemini Tools - Function definitions for document operations
 */

import { Type } from '@google/genai';
import { Document, SearchResult, Line, EditParams, EditResult } from '../parsers/types';

/**
 * Tool definitions for Gemini function calling
 * Using proper Type enums from @google/genai
 */
export const toolDefinitions = {
  functionDeclarations: [
    {
      name: 'doc_analyze',
      description: 'Get the FULL document content to analyze and identify which lines to edit. Use this when: 1) doc_search returns 0 results, 2) user requests multiple changes at once, 3) you need to understand document structure. This returns the entire document with line numbers so you can see everything and decide what to edit.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          reason: {
            type: Type.STRING,
            description: 'Why you need to analyze the full document (e.g., "search returned no results", "need to understand document structure")'
          }
        },
        required: ['reason']
      }
    },
    {
      name: 'doc_search',
      description: 'Search for WHERE to edit by finding lines with specific field names. Use 1-2 WORD keywords ONLY - just the field name you\'re looking for (e.g., "investor", "purchase", "date", "company"). Do NOT include values (NOT "investor Sebastian Grol", NOT "date Oct 30"). You\'re searching for the LOCATION to edit, not the VALUE to set. Returns up to 5 most relevant lines with their line numbers.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          query: {
            type: Type.STRING,
            description: 'Single FIELD NAME to search for (e.g., "investor" or "purchase" or "date"). NEVER include values like names, amounts, or dates. Just the field name!'
          },
          limit: {
            type: Type.NUMBER,
            description: 'Maximum number of results to return (default: 5, max: 20)'
          }
        },
        required: ['query']
      }
    },
    {
      name: 'doc_read',
      description: 'Read specific lines from the document by their line numbers. Use this to verify the current content of lines before editing them, or when the user references specific lines with @line notation.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          lines: {
            type: Type.ARRAY,
            items: { type: Type.NUMBER },
            description: 'Array of line numbers to read (e.g., [5, 10, 15])'
          }
        },
        required: ['lines']
      }
    },
    {
      name: 'doc_edit',
      description: 'ACTUALLY edit and modify lines in the document. Use this whenever the user asks to change, update, add, or delete content. Operations: replace (change existing line text), insert (add new lines), delete (remove lines). This tool makes real changes to the document that will be saved and visible to the user. Cannot edit locked lines.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          operation: {
            type: Type.STRING,
            enum: ['replace', 'insert', 'delete'],
            description: 'The edit operation: "replace" to change line text, "insert" to add new lines after specified line numbers, "delete" to remove lines'
          },
          lines: {
            type: Type.ARRAY,
            items: { type: Type.NUMBER },
            description: 'Line numbers to edit. For replace: lines to change. For insert: lines after which to insert. For delete: lines to remove.'
          },
          newText: {
            type: Type.STRING,
            description: 'New text content (required for replace and insert operations). For replace, this replaces the entire line. For insert, this creates a new line.'
          }
        },
        required: ['operation', 'lines']
      }
    }
  ]
};

/**
 * Execute doc_analyze tool - returns full document content
 */
export function executeDocAnalyze(
  reason: string,
  document: Document
): { success: boolean; content: string; totalLines: number } {
  try {
    console.info(`[TOOLS] Executing doc_analyze: ${reason}`);

    if (!document || !document.lines || document.lines.length === 0) {
      return {
        success: false,
        content: 'Document is empty',
        totalLines: 0
      };
    }

    // Filter out locked lines - they should never be passed to LLM
    const unlockedLines = document.lines.filter(line => !line.isLocked);
    const lockedCount = document.lines.length - unlockedLines.length;

    // Format unlocked lines with line numbers
    const formattedContent = unlockedLines
      .map(line => `Line ${line.lineNumber}: ${line.text}`)
      .join('\n');

    if (lockedCount > 0) {
      console.info(`[TOOLS] Filtered out ${lockedCount} locked lines from analysis`);
    }

    console.info(`[TOOLS] Returning ${unlockedLines.length} unlocked lines (${lockedCount} locked lines excluded)`);

    return {
      success: true,
      content: formattedContent,
      totalLines: unlockedLines.length
    };

  } catch (error) {
    console.error('[TOOLS] Error in doc_analyze:', error);
    return {
      success: false,
      content: 'Error analyzing document',
      totalLines: 0
    };
  }
}

/**
 * Execute doc_search tool
 */
export function executeDocSearch(
  query: string,
  document: Document,
  limit: number = 5
): SearchResult[] {
  try {
    console.info(`[TOOLS] Executing doc_search: "${query}"`);

    if (!query || query.trim().length === 0) {
      console.warn('[TOOLS] Empty search query');
      return [];
    }

    const queryLower = query.toLowerCase();
    const results: SearchResult[] = [];

    // Search through all lines
    for (const line of document.lines) {
      if (line.text.toLowerCase().includes(queryLower)) {
        // Simple scoring based on exact match vs partial
        const exactMatch = line.text.toLowerCase() === queryLower;
        const score = exactMatch ? 1.0 : 0.5;

        results.push({
          lineNumber: line.lineNumber,
          text: line.text,
          score
        });
      }
    }

    // Sort by score and limit results
    results.sort((a, b) => b.score - a.score);
    const limitedResults = results.slice(0, Math.min(limit, 20));

    console.info(`[TOOLS] Found ${results.length} results, returning top ${limitedResults.length}`);

    return limitedResults;

  } catch (error) {
    console.error('[TOOLS] Error in doc_search:', error);
    return [];
  }
}

/**
 * Execute doc_read tool
 */
export function executeDocRead(
  lineNumbers: number[],
  document: Document
): { success: boolean; lines: Line[]; error?: string } {
  try {
    console.info(`[TOOLS] Executing doc_read for lines: ${lineNumbers.join(', ')}`);

    if (!lineNumbers || lineNumbers.length === 0) {
      return {
        success: false,
        lines: [],
        error: 'No line numbers provided'
      };
    }

    const lines: Line[] = [];
    let lockedSkipped = 0;

    for (const lineNum of lineNumbers) {
      const line = document.lines.find(l => l.lineNumber === lineNum);

      if (line && !line.isLocked) {
        // Only include unlocked lines - locked lines should never be passed to LLM
        lines.push(line);
      } else if (line && line.isLocked) {
        console.warn(`[TOOLS] Line ${lineNum} is locked and cannot be read`);
        lockedSkipped++;
      } else {
        console.warn(`[TOOLS] Line ${lineNum} not found`);
      }
    }

    if (lockedSkipped > 0) {
      console.info(`[TOOLS] Skipped ${lockedSkipped} locked lines from reading`);
    }

    console.info(`[TOOLS] Read ${lines.length}/${lineNumbers.length} lines successfully (${lockedSkipped} locked lines excluded)`);

    return {
      success: true,
      lines
    };

  } catch (error) {
    console.error('[TOOLS] Error in doc_read:', error);
    return {
      success: false,
      lines: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Execute doc_edit tool
 */
export function executeDocEdit(
  params: EditParams,
  document: Document
): EditResult {
  try {
    console.info(`[TOOLS] Executing doc_edit: ${params.operation} on lines ${params.lines.join(', ')}`);

    // Validate parameters
    if (!params.lines || params.lines.length === 0) {
      return {
        success: false,
        modifiedLines: [],
        error: 'No line numbers provided'
      };
    }

    if ((params.operation === 'replace' || params.operation === 'insert') && !params.newText) {
      return {
        success: false,
        modifiedLines: [],
        error: `New text is required for ${params.operation} operation`
      };
    }

    // Check if any lines are locked
    const lockedLines = params.lines.filter(lineNum => {
      const line = document.lines.find(l => l.lineNumber === lineNum);
      return line?.isLocked;
    });

    if (lockedLines.length > 0) {
      console.warn(`[TOOLS] Cannot edit locked lines: ${lockedLines.join(', ')}`);
      return {
        success: false,
        modifiedLines: [],
        error: `Cannot edit locked lines: ${lockedLines.join(', ')}`
      };
    }

    // Perform the edit operation
    const modifiedLines: number[] = [];

    switch (params.operation) {
      case 'replace': {
        for (const lineNum of params.lines) {
          const lineIndex = document.lines.findIndex(l => l.lineNumber === lineNum);

          if (lineIndex !== -1) {
            document.lines[lineIndex].text = params.newText || '';
            modifiedLines.push(lineNum);
            console.info(`[TOOLS] Replaced line ${lineNum}`);
          }
        }
        break;
      }

      case 'delete': {
        // Filter out lines to delete
        const linesToDelete = new Set(params.lines);
        document.lines = document.lines.filter(line => {
          if (linesToDelete.has(line.lineNumber)) {
            modifiedLines.push(line.lineNumber);
            console.info(`[TOOLS] Deleted line ${line.lineNumber}`);
            return false;
          }
          return true;
        });

        // Renumber remaining lines
        document.lines.forEach((line, index) => {
          line.lineNumber = index + 1;
        });
        break;
      }

      case 'insert': {
        // Insert new lines
        for (const lineNum of params.lines) {
          const lineIndex = document.lines.findIndex(l => l.lineNumber === lineNum);

          if (lineIndex !== -1) {
            const newLine: Line = {
              lineNumber: lineNum + 0.5, // Temporary number for sorting
              text: params.newText || '',
              pageNumber: document.lines[lineIndex].pageNumber,
              isLocked: false,
              isPlaceholder: false
            };

            document.lines.splice(lineIndex + 1, 0, newLine);
            modifiedLines.push(lineNum);
            console.info(`[TOOLS] Inserted line after ${lineNum}`);
          }
        }

        // Renumber all lines
        document.lines.forEach((line, index) => {
          line.lineNumber = index + 1;
        });
        break;
      }

      default:
        return {
          success: false,
          modifiedLines: [],
          error: `Unknown operation: ${params.operation}`
        };
    }

    // Update document metadata
    document.metadata.totalLines = document.lines.length;

    console.info(`[TOOLS] Successfully modified ${modifiedLines.length} lines`);

    return {
      success: true,
      modifiedLines
    };

  } catch (error) {
    console.error('[TOOLS] Error in doc_edit:', error);
    return {
      success: false,
      modifiedLines: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
