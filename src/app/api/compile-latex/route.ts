/**
 * API Route: Compile LaTeX to PDF
 * Uses LaTeX.Online service to compile LaTeX source
 * Returns PDF as binary response
 */

import { NextRequest, NextResponse } from 'next/server';
import { smartCompileLatex, validateLatexSource } from '@/lib/api-clients/latex-online-client';

export async function POST(request: NextRequest) {
  try {
    console.log('[API/COMPILE-LATEX] Received compilation request');

    const body = await request.json();
    const { latexSource, validate = true } = body;

    if (!latexSource || typeof latexSource !== 'string') {
      return NextResponse.json(
        { success: false, error: 'No LaTeX source provided' },
        { status: 400 }
      );
    }

    console.log('[API/COMPILE-LATEX] Source length:', latexSource.length, 'characters');

    // Optional validation
    if (validate) {
      const validation = validateLatexSource(latexSource);
      if (!validation.valid) {
        console.warn('[API/COMPILE-LATEX] Validation failed:', validation.errors);
        return NextResponse.json(
          {
            success: false,
            error: 'LaTeX validation failed',
            errors: validation.errors,
          },
          { status: 400 }
        );
      }
    }

    // Compile LaTeX
    console.log('[API/COMPILE-LATEX] Compiling LaTeX...');
    const result = await smartCompileLatex(latexSource);

    if (!result.success) {
      console.error('[API/COMPILE-LATEX] Compilation failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          log: result.log,
        },
        { status: 500 }
      );
    }

    // Return PDF as binary response
    if (result.pdfBlob) {
      const buffer = await result.pdfBlob.arrayBuffer();

      console.log('[API/COMPILE-LATEX] Compilation successful, PDF size:', buffer.byteLength);

      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline; filename="resume.pdf"',
          'Content-Length': buffer.byteLength.toString(),
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Compilation succeeded but no PDF generated',
      },
      { status: 500 }
    );
  } catch (error) {
    console.error('[API/COMPILE-LATEX] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected compilation error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Check API health and test compilation
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/compile-latex',
    service: 'LaTeX.Online',
    maxSourceSize: '8KB (GET) / 5MB (POST)',
  });
}
