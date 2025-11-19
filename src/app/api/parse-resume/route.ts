/**
 * API Route: Parse Resume
 * Handles LaTeX (.tex) and DOCX (.docx) file uploads
 * Returns structured Resume JSON with complete formatting preservation
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseLatexToResume } from '@/lib/parsers/latex-parser-simple';
import type { ResumeParseResult } from '@/types/resume';

export async function POST(request: NextRequest) {
  try {
    console.log('[API/PARSE-RESUME] Received parse request');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const customApiKey = formData.get('apiKey') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('[API/PARSE-RESUME] File:', file.name, 'Size:', file.size, 'bytes');

    const fileExt = file.name.split('.').pop()?.toLowerCase();

    // Validate file type
    if (!['tex', 'docx'].includes(fileExt || '')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unsupported file format. Please upload .tex or .docx files.',
        },
        { status: 400 }
      );
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: 'File too large. Maximum size is 5MB.',
        },
        { status: 400 }
      );
    }

    let parseResult: ResumeParseResult;

    // Parse LaTeX
    if (fileExt === 'tex') {
      console.log('[API/PARSE-RESUME] Parsing LaTeX file...');
      const latexContent = await file.text();
      parseResult = await parseLatexToResume(latexContent, file.name);
    }
    // Parse DOCX (Phase 2 - TODO)
    else if (fileExt === 'docx') {
      console.log('[API/PARSE-RESUME] DOCX parsing not yet implemented');
      return NextResponse.json(
        {
          success: false,
          error: 'DOCX support coming soon. Please use LaTeX (.tex) files for now.',
        },
        { status: 501 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file format',
        },
        { status: 400 }
      );
    }

    // Return parse result
    if (parseResult.success && parseResult.resume) {
      console.log('[API/PARSE-RESUME] Parsing successful');
      console.log('[API/PARSE-RESUME] Sections:', parseResult.resume.sections.length);
      console.log(
        '[API/PARSE-RESUME] Packages:',
        parseResult.resume.latexFormatting?.packages.length || 0
      );

      return NextResponse.json(parseResult);
    } else {
      console.error('[API/PARSE-RESUME] Parsing failed:', parseResult.error);
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error || 'Failed to parse resume',
          warnings: parseResult.warnings,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API/PARSE-RESUME] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected parsing error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Check API health
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/parse-resume',
    supportedFormats: ['tex', 'docx (coming soon)'],
    maxFileSize: '5MB',
  });
}
