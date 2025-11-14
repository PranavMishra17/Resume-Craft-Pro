/**
 * Keyword Analysis API
 *
 * Analyze keyword gap between job description and resume
 * WITHOUT running full optimization (faster, cheaper)
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resume, KeywordAnalysis } from '@/lib/parsers/types';
import { parseLatexResume } from '@/lib/parsers/latex';
import { createKeywordAnalyzer } from '@/lib/optimization/keyword-analyzer';
import { getTokenTracker } from '@/lib/tracking/token-tracker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/analyze-keywords
 *
 * Quick keyword analysis without optimization
 */
export async function POST(request: NextRequest) {
  try {
    console.info('[ANALYZE_API] Starting keyword analysis');

    // Parse request body
    const body = await request.json();
    const {
      resumeContent,
      resumeFormat,
      fileName,
      jobDescription,
      sessionId,
      customApiKey
    } = body;

    // Validate required fields
    if (!resumeContent) {
      return NextResponse.json(
        { error: 'Resume content is required' },
        { status: 400 }
      );
    }

    if (!jobDescription) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get API key
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Initialize token tracker session
    const tracker = getTokenTracker();
    tracker.initSession(sessionId);

    // Parse resume
    console.info('[ANALYZE_API] Parsing resume');
    let resume: Resume;

    try {
      if (resumeFormat === 'latex') {
        resume = await parseLatexResume(resumeContent, fileName);
      } else {
        return NextResponse.json(
          { error: 'Only LaTeX format is currently supported' },
          { status: 400 }
        );
      }

      console.info(`[ANALYZE_API] Resume parsed: ${resume.lines.length} lines`);
    } catch (error) {
      console.error('[ANALYZE_API] Resume parsing failed:', error);
      return NextResponse.json(
        {
          error: 'Failed to parse resume',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 400 }
      );
    }

    // Extract keywords
    console.info('[ANALYZE_API] Extracting keywords');
    const keywordAnalyzer = createKeywordAnalyzer(apiKey, sessionId);

    let jdKeywords: string[];
    let resumeKeywords: string[];

    try {
      // Extract in parallel for speed
      [jdKeywords, resumeKeywords] = await Promise.all([
        keywordAnalyzer.extractJDKeywords(jobDescription),
        keywordAnalyzer.extractResumeKeywords(resume)
      ]);

      console.info(`[ANALYZE_API] JD keywords: ${jdKeywords.length}`);
      console.info(`[ANALYZE_API] Resume keywords: ${resumeKeywords.length}`);
    } catch (error) {
      console.error('[ANALYZE_API] Keyword extraction failed:', error);
      return NextResponse.json(
        {
          error: 'Failed to extract keywords',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Analyze gap
    const keywordAnalysis = keywordAnalyzer.analyzeKeywordGap(jdKeywords, resumeKeywords);

    console.info(`[ANALYZE_API] Coverage: ${keywordAnalysis.coverage}%`);
    console.info(`[ANALYZE_API] Missing keywords: ${keywordAnalysis.missingKeywords.length}`);

    // Get token usage
    const tokenUsage = tracker.getSessionUsage(sessionId);

    // Build response - convert Map to object for JSON serialization
    const response = {
      analysis: {
        jdKeywords: keywordAnalysis.jdKeywords,
        resumeKeywords: keywordAnalysis.resumeKeywords,
        missingKeywords: keywordAnalysis.missingKeywords,
        keywordFrequency: Object.fromEntries(keywordAnalysis.keywordFrequency),
        coverage: keywordAnalysis.coverage
      },
      suggestions: generateSuggestions(keywordAnalysis),
      tokensUsed: tokenUsage?.totalTokens || 0,
      estimatedCost: tokenUsage?.estimatedCost || 0
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[ANALYZE_API] Unexpected error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Generate actionable suggestions based on keyword analysis
 */
function generateSuggestions(analysis: KeywordAnalysis): string[] {
  const suggestions: string[] = [];

  if (analysis.coverage >= 90) {
    suggestions.push('✅ Excellent keyword coverage! Your resume matches the job description well.');
  } else if (analysis.coverage >= 70) {
    suggestions.push('⚠️ Good keyword coverage, but there\'s room for improvement.');
    suggestions.push(`Add ${analysis.missingKeywords.length} missing keywords to increase ATS match score.`);
  } else if (analysis.coverage >= 50) {
    suggestions.push('⚠️ Moderate keyword coverage. Consider adding more relevant keywords.');
    suggestions.push(`Focus on integrating these high-priority keywords: ${analysis.missingKeywords.slice(0, 5).join(', ')}`);
  } else {
    suggestions.push('❌ Low keyword coverage. Your resume may not pass ATS screening.');
    suggestions.push('Run full optimization to integrate missing keywords into your bullet points.');
  }

  // Specific keyword suggestions
  if (analysis.missingKeywords.length > 0) {
    const topMissing = analysis.missingKeywords.slice(0, 3);
    suggestions.push(`Top missing keywords: ${topMissing.join(', ')}`);
  }

  // Overused keywords warning
  const overusedKeywords = Array.from(analysis.keywordFrequency.entries())
    .filter(([_, count]) => count > 5)
    .map(([keyword]) => keyword);

  if (overusedKeywords.length > 0) {
    suggestions.push(`Consider varying your language - these keywords appear frequently: ${overusedKeywords.join(', ')}`);
  }

  return suggestions;
}

/**
 * GET /api/analyze-keywords
 * Health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'keyword-analysis'
  });
}
