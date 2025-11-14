/**
 * Placeholder Detection API - LLM-powered placeholder detection
 */

import { NextRequest, NextResponse } from 'next/server';
import { batchDetectPlaceholders } from '@/lib/parsers/llm-placeholder-detector';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for LLM processing

/**
 * POST /api/detect-placeholders - Run LLM detection on document lines
 */
export async function POST(request: NextRequest) {
  try {
    console.info('[DETECT_API] Received LLM detection request');

    const body = await request.json();
    const { lines, customApiKey } = body;

    if (!lines || !Array.isArray(lines)) {
      return NextResponse.json(
        { error: 'Lines array is required' },
        { status: 400 }
      );
    }

    // Get API key - use custom key if provided, otherwise use environment variable
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('[DETECT_API] GEMINI_API_KEY not configured');
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    if (customApiKey) {
      console.info('[DETECT_API] Using custom API key');
    } else {
      console.info('[DETECT_API] Using default API key from environment');
    }

    console.info(`[DETECT_API] Processing ${lines.length} lines with LLM detection`);

    // Run batch detection
    const results = await batchDetectPlaceholders(lines, apiKey);

    // Convert Map to object for JSON response
    const resultsObject: Record<number, any> = {};
    results.forEach((value, key) => {
      resultsObject[key] = value;
    });

    console.info(`[DETECT_API] Detection complete. Found ${Array.from(results.values()).filter(r => r.isPlaceholder).length} placeholder lines`);

    return NextResponse.json({
      success: true,
      results: resultsObject,
      totalLines: lines.length,
      placeholderCount: Array.from(results.values()).filter(r => r.isPlaceholder).length
    });

  } catch (error) {
    console.error('[DETECT_API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to detect placeholders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
