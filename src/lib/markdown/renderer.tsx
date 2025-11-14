/**
 * Markdown Renderer - Converts markdown to HTML
 */

import { marked } from 'marked';

/**
 * Configure marked options
 */
marked.setOptions({
  breaks: true, // Convert \n to <br>
  gfm: true, // GitHub Flavored Markdown
});

/**
 * Render markdown string to HTML
 */
export function renderMarkdown(markdown: string): string {
  try {
    return marked.parse(markdown) as string;
  } catch (error) {
    console.error('[MARKDOWN] Error rendering markdown:', error);
    return markdown;
  }
}

/**
 * Sanitize HTML to prevent XSS attacks
 * Simple implementation - removes script tags and event handlers
 */
export function sanitizeHtml(html: string): string {
  // Remove script tags
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  return sanitized;
}

/**
 * Render markdown safely
 */
export function renderMarkdownSafe(markdown: string): string {
  const html = renderMarkdown(markdown);
  return sanitizeHtml(html);
}
