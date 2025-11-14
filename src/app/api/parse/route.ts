/**
 * Parse API Route - Handles document upload and parsing
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseDocument } from '@/lib/parsers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/parse - Upload and parse a document
 */
export async function POST(request: NextRequest) {
  try {
    console.info('[PARSE_API] Received parse request');

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('[PARSE_API] No file provided');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.info(`[PARSE_API] Processing file: ${file.name} (${file.size} bytes, ${file.type})`);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse the document
    const result = await parseDocument(buffer, file.name, file.type);

    if (result.error) {
      console.error('[PARSE_API] Parse error:', result.error);
      return NextResponse.json(
        {
          error: result.error,
          document: result.document
        },
        { status: 422 }
      );
    }

    console.info(
      `[PARSE_API] Successfully parsed: ${result.document.metadata.totalLines} lines, ${result.document.metadata.totalPages} pages`
    );

    return NextResponse.json({
      success: true,
      document: result.document
    });

  } catch (error) {
    console.error('[PARSE_API] Unexpected error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to parse document',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/parse - Health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'parse',
    supported_formats: ['docx', 'pdf', 'markdown', 'txt']
  });
}
