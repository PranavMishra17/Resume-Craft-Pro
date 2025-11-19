/**
 * Resume Optimization API
 *
 * Full workflow:
 * 1. Parse resume (LaTeX/DOCX)
 * 2. Extract keywords from job description
 * 3. Extract keywords from resume
 * 4. Analyze keyword gap
 * 5. Map keywords to bullet points
 * 6. Optimize bullets in parallel
 * 7. Apply changes
 * 8. Return optimized resume with analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  Resume,
  ResumeOptimizationResult,
  OptimizationConfig,
  BulletOptimization,
  KeywordMapping
} from '@/lib/parsers/types';
import { parseLatexResume } from '@/lib/parsers/latex';
import { createKeywordAnalyzer } from '@/lib/optimization/keyword-analyzer';
import { createParallelOptimizer, ParallelOptimizer } from '@/lib/optimization/parallel-optimizer';
import { getTokenTracker } from '@/lib/tracking/token-tracker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for long optimizations

/**
 * POST /api/optimize-resume
 *
 * Full resume optimization with job description
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.info('[OPTIMIZE_API] Starting resume optimization');

    // Parse request body
    const body = await request.json();
    const {
      resumeContent,
      resumeFormat,
      fileName,
      jobDescription,
      jobField,
      projects,
      portfolio,
      customInstructions,
      config,
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

    console.info('[OPTIMIZE_API] Session initialized:', sessionId);

    // Default config if not provided
    const optimizationConfig: OptimizationConfig = config || {
      mode: 'targeted',
      maxConcurrentCalls: 5,
      preserveLength: true,
      maintainTone: true,
      maxKeywordsPerBullet: 2,
      minConfidenceScore: 0.6
    };

    // Step 1: Parse resume based on format
    console.info('[OPTIMIZE_API] Step 1: Parsing resume');
    let resume: Resume;

    try {
      if (resumeFormat === 'latex') {
        resume = await parseLatexResume(resumeContent, fileName);
      } else {
        // For now, treat DOCX/PDF as text-based parsing
        // TODO: Implement proper DOCX parser integration
        return NextResponse.json(
          { error: 'Only LaTeX format is currently supported' },
          { status: 400 }
        );
      }

      console.info(`[OPTIMIZE_API] Resume parsed: ${resume.lines.length} lines, ${resume.sections.length} sections`);
    } catch (error) {
      console.error('[OPTIMIZE_API] Resume parsing failed:', error);
      return NextResponse.json(
        {
          error: 'Failed to parse resume',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 400 }
      );
    }

    // Step 2: Extract keywords from job description
    console.info('[OPTIMIZE_API] Step 2: Extracting JD keywords');
    const keywordAnalyzer = createKeywordAnalyzer(apiKey, sessionId);

    let jdKeywords: string[];
    try {
      jdKeywords = await keywordAnalyzer.extractJDKeywords(jobDescription, jobField);
      console.info(`[OPTIMIZE_API] Extracted ${jdKeywords.length} keywords from JD`);
    } catch (error) {
      console.error('[OPTIMIZE_API] JD keyword extraction failed:', error);
      return NextResponse.json(
        {
          error: 'Failed to extract keywords from job description',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Step 3: Extract keywords from resume
    console.info('[OPTIMIZE_API] Step 3: Extracting resume keywords');
    let resumeKeywords: string[];
    try {
      resumeKeywords = await keywordAnalyzer.extractResumeKeywords(resume);
      console.info(`[OPTIMIZE_API] Extracted ${resumeKeywords.length} keywords from resume`);
    } catch (error) {
      console.error('[OPTIMIZE_API] Resume keyword extraction failed:', error);
      return NextResponse.json(
        {
          error: 'Failed to extract keywords from resume',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Step 4: Analyze keyword gap
    console.info('[OPTIMIZE_API] Step 4: Analyzing keyword gap');
    const keywordAnalysis = keywordAnalyzer.analyzeKeywordGap(jdKeywords, resumeKeywords);
    console.info(`[OPTIMIZE_API] Coverage: ${keywordAnalysis.coverage}%, Missing: ${keywordAnalysis.missingKeywords.length}`);

    // If coverage is already high, return early
    if (keywordAnalysis.coverage >= 95) {
      console.info('[OPTIMIZE_API] Coverage already excellent (>=95%), skipping optimization');

      const processingTime = Date.now() - startTime;
      const tokenUsage = tracker.getSessionUsage(sessionId);

      const result: ResumeOptimizationResult = {
        optimizedResume: resume,
        changes: [],
        keywordAnalysis,
        totalTokensUsed: tokenUsage?.totalTokens || 0,
        processingTimeMs: processingTime,
        success: true
      };

      return NextResponse.json(result);
    }

    // Step 5: Map keywords to bullet points
    console.info('[OPTIMIZE_API] Step 5: Mapping keywords to bullets');
    let keywordMappings: KeywordMapping[];
    try {
      keywordMappings = await keywordAnalyzer.mapKeywordsToBullets(
        keywordAnalysis.missingKeywords,
        resume,
        portfolio,
        projects
      );
      console.info(`[OPTIMIZE_API] Mapped ${keywordMappings.length} keywords to bullets`);
    } catch (error) {
      console.error('[OPTIMIZE_API] Keyword mapping failed:', error);
      return NextResponse.json(
        {
          error: 'Failed to map keywords to bullet points',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    if (keywordMappings.length === 0) {
      console.info('[OPTIMIZE_API] No keyword mappings generated, skipping optimization');

      const processingTime = Date.now() - startTime;
      const tokenUsage = tracker.getSessionUsage(sessionId);

      const result: ResumeOptimizationResult = {
        optimizedResume: resume,
        changes: [],
        keywordAnalysis,
        totalTokensUsed: tokenUsage?.totalTokens || 0,
        processingTimeMs: processingTime,
        success: true
      };

      return NextResponse.json(result);
    }

    // Step 6: Build optimization plan
    console.info('[OPTIMIZE_API] Step 6: Building optimization plan');
    const optimizationPlan = ParallelOptimizer.buildOptimizationPlan(resume, keywordMappings);
    console.info(`[OPTIMIZE_API] Plan includes ${optimizationPlan.length} bullets to optimize`);

    // Step 7: Optimize bullets in parallel
    console.info('[OPTIMIZE_API] Step 7: Optimizing bullets in parallel');
    const optimizer = createParallelOptimizer(apiKey, sessionId, optimizationConfig);

    let bulletOptimizations: BulletOptimization[];
    try {
      bulletOptimizations = await optimizer.optimizeBulletsParallel(
        optimizationPlan,
        {
          resume,
          projects: projects ? {
            id: 'projects',
            type: 'projects',
            fileName: 'projects.txt',
            fileSize: projects.length,
            content: projects,
            uploadedAt: new Date()
          } : undefined,
          portfolio: portfolio ? {
            id: 'portfolio',
            type: 'portfolio',
            fileName: 'portfolio.txt',
            fileSize: portfolio.length,
            content: portfolio,
            uploadedAt: new Date()
          } : undefined,
          jobDescription: {
            id: 'jd',
            type: 'job_description',
            fileName: 'job_description.txt',
            fileSize: jobDescription.length,
            content: jobDescription,
            uploadedAt: new Date()
          },
          customInstructions
        }
      );
      console.info(`[OPTIMIZE_API] Successfully optimized ${bulletOptimizations.length} bullets`);
    } catch (error) {
      console.error('[OPTIMIZE_API] Parallel optimization failed:', error);
      return NextResponse.json(
        {
          error: 'Failed to optimize bullet points',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Step 8: Apply optimizations to resume
    console.info('[OPTIMIZE_API] Step 8: Applying optimizations to resume');
    const optimizedResume = { ...resume };
    optimizedResume.lines = resume.lines.map(line => {
      const optimization = bulletOptimizations.find(opt => opt.lineNumber === line.lineNumber);
      if (optimization) {
        return {
          ...line,
          text: optimization.optimizedText,
          keywords: [...(line.keywords || []), ...optimization.addedKeywords]
        };
      }
      return line;
    });

    // Update sections with optimized lines
    optimizedResume.sections = resume.sections.map(section => ({
      ...section,
      content: section.content.map(line => {
        const optimization = bulletOptimizations.find(opt => opt.lineNumber === line.lineNumber);
        if (optimization) {
          return {
            ...line,
            text: optimization.optimizedText,
            keywords: [...(line.keywords || []), ...optimization.addedKeywords]
          };
        }
        return line;
      })
    }));

    // Step 9: Re-analyze keywords after optimization
    console.info('[OPTIMIZE_API] Step 9: Re-analyzing keywords after optimization');
    const optimizedResumeKeywords = await keywordAnalyzer.extractResumeKeywords(optimizedResume);
    const finalAnalysis = keywordAnalyzer.analyzeKeywordGap(jdKeywords, optimizedResumeKeywords);
    console.info(`[OPTIMIZE_API] Final coverage: ${finalAnalysis.coverage}%`);

    // Get final token usage
    const tokenUsage = tracker.getSessionUsage(sessionId);
    const processingTime = Date.now() - startTime;

    console.info(`[OPTIMIZE_API] Optimization complete in ${processingTime}ms`);
    console.info(`[OPTIMIZE_API] Total tokens used: ${tokenUsage?.totalTokens || 0}`);
    console.info(`[OPTIMIZE_API] Estimated cost: $${tokenUsage?.estimatedCost.toFixed(4) || 0}`);

    // Build result
    const result: ResumeOptimizationResult = {
      optimizedResume,
      changes: bulletOptimizations,
      keywordAnalysis: finalAnalysis,
      totalTokensUsed: tokenUsage?.totalTokens || 0,
      processingTimeMs: processingTime,
      success: true
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('[OPTIMIZE_API] Unexpected error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/optimize-resume
 * Health check
 */
export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;

  return NextResponse.json({
    status: 'ok',
    service: 'resume-optimization',
    gemini_configured: !!apiKey,
    features: [
      'latex_parsing',
      'keyword_extraction',
      'parallel_optimization',
      'token_tracking'
    ]
  });
}
