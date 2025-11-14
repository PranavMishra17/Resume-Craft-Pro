/**
 * LaTeX Export Module
 *
 * Export resumes to LaTeX format with format preservation
 */

import { Resume } from '../parsers/types';
import { exportToLatex, applyEditsToLatex } from '../parsers/latex';

/**
 * Export resume to LaTeX (.tex file)
 */
export function exportToLaTeX(resume: Resume): Blob {
  console.info('[LATEX_EXPORT] Exporting resume to LaTeX');

  // Use the LaTeX parser's export function
  const latexContent = exportToLatex(resume);

  // Create blob
  const blob = new Blob([latexContent], { type: 'application/x-latex' });

  console.info('[LATEX_EXPORT] LaTeX export complete');

  return blob;
}

/**
 * Download LaTeX file
 */
export function downloadLaTeX(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.replace(/\.[^.]+$/, '') + '.tex';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.info('[LATEX_EXPORT] LaTeX file downloaded');
}

/**
 * Export resume to LaTeX with format preservation
 * Applies edits to original LaTeX source
 */
export function exportToLaTeXPreserveFormat(
  originalLatex: string,
  resume: Resume
): Blob {
  console.info('[LATEX_EXPORT] Exporting with format preservation');

  // Build edit list from resume lines
  const edits = resume.lines.map(line => ({
    lineNumber: line.lineNumber,
    newText: line.text
  }));

  // Apply edits to original LaTeX
  const updatedLatex = applyEditsToLatex(originalLatex, edits);

  // Create blob
  const blob = new Blob([updatedLatex], { type: 'application/x-latex' });

  console.info('[LATEX_EXPORT] Format-preserving LaTeX export complete');

  return blob;
}
