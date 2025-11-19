/**
 * LaTeX.Online API Client
 * Compiles LaTeX source to PDF using the free LaTeX.Online service
 * API Docs: https://latexonline.cc/
 */

import type { LatexCompilationResult } from '@/types/resume';

/**
 * Compile LaTeX source to PDF using LaTeX.Online
 */
export async function compileLatexToPdf(latexSource: string): Promise<LatexCompilationResult> {
  try {
    console.log('[LATEX-ONLINE] Starting LaTeX compilation...');
    console.log('[LATEX-ONLINE] Source length:', latexSource.length, 'characters');

    // LaTeX.Online API endpoint
    // Method 1: Direct GET request with encoded text
    const encodedLatex = encodeURIComponent(latexSource);
    const url = `https://latexonline.cc/compile?text=${encodedLatex}`;

    console.log('[LATEX-ONLINE] Sending request to LaTeX.Online...');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/pdf',
      },
    });

    if (!response.ok) {
      // Try to get error log
      const errorText = await response.text();
      console.error('[LATEX-ONLINE] Compilation failed:', errorText);

      return {
        success: false,
        error: 'LaTeX compilation failed. Check your LaTeX syntax.',
        log: errorText,
      };
    }

    // Get PDF blob
    const pdfBlob = await response.blob();
    console.log('[LATEX-ONLINE] PDF generated successfully, size:', pdfBlob.size, 'bytes');

    // Create URL for preview
    const pdfUrl = URL.createObjectURL(pdfBlob);

    return {
      success: true,
      pdfBlob,
      pdfUrl,
    };
  } catch (error) {
    console.error('[LATEX-ONLINE] Compilation error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown compilation error',
    };
  }
}

/**
 * Alternative: Compile using POST method with file upload
 * Useful for very large documents or when GET URL is too long
 */
export async function compileLatexToPdfPost(latexSource: string): Promise<LatexCompilationResult> {
  try {
    console.log('[LATEX-ONLINE] Starting LaTeX compilation (POST method)...');

    // Create form data with .tex file
    const formData = new FormData();
    const texBlob = new Blob([latexSource], { type: 'text/plain' });
    formData.append('file', texBlob, 'resume.tex');

    const response = await fetch('https://latexonline.cc/compile', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LATEX-ONLINE] Compilation failed:', errorText);

      return {
        success: false,
        error: 'LaTeX compilation failed',
        log: errorText,
      };
    }

    const pdfBlob = await response.blob();
    const pdfUrl = URL.createObjectURL(pdfBlob);

    console.log('[LATEX-ONLINE] PDF generated successfully');

    return {
      success: true,
      pdfBlob,
      pdfUrl,
    };
  } catch (error) {
    console.error('[LATEX-ONLINE] Compilation error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown compilation error',
    };
  }
}

/**
 * Validate LaTeX source before compilation
 * Checks for common errors that would prevent compilation
 */
export function validateLatexSource(latexSource: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for \documentclass
  if (!latexSource.includes('\\documentclass')) {
    errors.push('Missing \\documentclass command');
  }

  // Check for \begin{document}
  if (!latexSource.includes('\\begin{document}')) {
    errors.push('Missing \\begin{document}');
  }

  // Check for \end{document}
  if (!latexSource.includes('\\end{document}')) {
    errors.push('Missing \\end{document}');
  }

  // Check for balanced braces (basic check)
  const openBraces = (latexSource.match(/\{/g) || []).length;
  const closeBraces = (latexSource.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push(`Unbalanced braces: ${openBraces} open, ${closeBraces} closed`);
  }

  // Check for balanced environments (basic check)
  const beginEnvs = (latexSource.match(/\\begin\{/g) || []).length;
  const endEnvs = (latexSource.match(/\\end\{/g) || []).length;
  if (beginEnvs !== endEnvs) {
    errors.push(`Unbalanced environments: ${beginEnvs} \\begin, ${endEnvs} \\end`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Smart compilation: Validates first, then compiles
 * Falls back to POST method if GET fails (URL too long)
 */
export async function smartCompileLatex(
  latexSource: string
): Promise<LatexCompilationResult> {
  // Validate first
  const validation = validateLatexSource(latexSource);
  if (!validation.valid) {
    console.warn('[LATEX-ONLINE] Validation failed:', validation.errors);
    return {
      success: false,
      error: 'LaTeX validation failed: ' + validation.errors.join(', '),
    };
  }

  // Try GET method first (faster)
  if (latexSource.length < 8000) {
    // URL length limit consideration
    const result = await compileLatexToPdf(latexSource);
    if (result.success) {
      return result;
    }
    console.warn('[LATEX-ONLINE] GET method failed, trying POST...');
  }

  // Fallback to POST method
  return compileLatexToPdfPost(latexSource);
}

/**
 * Extract compilation errors from LaTeX log
 */
export function parseLatexLog(log: string): {
  errors: string[];
  warnings: string[];
  lineNumbers: number[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const lineNumbers: number[] = [];

  const lines = log.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect errors
    if (line.startsWith('!')) {
      errors.push(line.substring(1).trim());

      // Try to extract line number
      const lineMatch = line.match(/l\.(\d+)/);
      if (lineMatch) {
        lineNumbers.push(parseInt(lineMatch[1]));
      }
    }

    // Detect warnings
    if (line.toLowerCase().includes('warning')) {
      warnings.push(line.trim());
    }
  }

  return { errors, warnings, lineNumbers };
}
