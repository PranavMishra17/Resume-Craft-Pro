/**
 * Markdown Export - Convert document lines to Markdown format with formatting
 */

import { Document, Line } from '../parsers/types';

/**
 * Convert line to markdown with formatting
 */
function lineToMarkdown(line: Line): string {
  let text = line.text;
  const formatting = line.formatting;

  // Apply markdown formatting
  if (formatting?.bold && formatting?.italic) {
    text = `***${text}***`;
  } else if (formatting?.bold) {
    text = `**${text}**`;
  } else if (formatting?.italic) {
    text = `*${text}*`;
  }

  // Handle headers (check if fontSize indicates header level)
  if (formatting?.fontSize && formatting.fontSize > 16) {
    const level = Math.max(1, Math.min(6, Math.floor((24 - formatting.fontSize) / 2) + 1));
    text = `${'#'.repeat(level)} ${text}`;
  }

  // Handle alignment with HTML for non-left alignment
  if (formatting?.alignment === 'center') {
    text = `<div align="center">${text}</div>`;
  } else if (formatting?.alignment === 'right') {
    text = `<div align="right">${text}</div>`;
  }

  return text;
}

/**
 * Export document to Markdown format with formatting preservation
 */
export function exportToMarkdown(document: Document): Blob {
  try {
    console.info('[MD_EXPORT] Starting Markdown export');

    // Convert lines with formatting
    const markdown = document.lines
      .map(line => lineToMarkdown(line))
      .join('\n');

    // Create blob
    const blob = new Blob([markdown], { type: 'text/markdown' });

    console.info(`[MD_EXPORT] Successfully exported ${document.lines.length} lines to Markdown`);

    return blob;

  } catch (error) {
    console.error('[MD_EXPORT] Error exporting to Markdown:', error);
    throw new Error(`Failed to export Markdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download Markdown file
 */
export function downloadMarkdown(blob: Blob, fileName: string): void {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.md') ? fileName : `${fileName}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.info(`[MD_EXPORT] Downloaded file: ${link.download}`);

  } catch (error) {
    console.error('[MD_EXPORT] Error downloading Markdown:', error);
    throw new Error(`Failed to download Markdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
