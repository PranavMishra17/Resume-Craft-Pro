/**
 * Parallel Bullet Optimizer
 *
 * Optimize multiple resume bullet points in parallel
 * - Use keyword mappings to assign keywords to bullets
 * - Optimize each bullet with assigned keywords
 * - Run multiple LLM calls concurrently (max 5)
 * - Preserve bullet length and tone
 * - Track all tokens used
 */

import { GoogleGenAI } from '@google/genai';
import pLimit from 'p-limit';
import {
  Resume,
  ResumeLine,
  BulletOptimization,
  OptimizationContext,
  OptimizationConfig,
  KeywordMapping
} from '@/lib/parsers/types';
import { getTokenTracker } from '@/lib/tracking/token-tracker';

const MODEL_NAME = 'gemini-2.0-flash-exp';

/**
 * Parallel Optimizer class
 */
export class ParallelOptimizer {
  private client: GoogleGenAI;
  private sessionId: string;
  private config: OptimizationConfig;

  constructor(
    apiKey: string,
    sessionId: string,
    config: OptimizationConfig
  ) {
    this.client = new GoogleGenAI({ apiKey });
    this.sessionId = sessionId;
    this.config = config;
  }

  /**
   * Optimize multiple bullets in parallel
   */
  async optimizeBulletsParallel(
    bullets: Array<{ line: ResumeLine; keywords: string[] }>,
    context: OptimizationContext
  ): Promise<BulletOptimization[]> {
    console.info(`[PARALLEL_OPTIMIZER] Optimizing ${bullets.length} bullets in parallel`);
    console.info(`[PARALLEL_OPTIMIZER] Max concurrency: ${this.config.maxConcurrentCalls}`);

    // Create concurrency limiter
    const limit = pLimit(this.config.maxConcurrentCalls);

    // Create optimization tasks
    const tasks = bullets.map(({ line, keywords }) =>
      limit(() => this.optimizeSingleBullet(line, keywords, context))
    );

    // Execute all tasks in parallel (with concurrency limit)
    const startTime = Date.now();
    const results = await Promise.all(tasks);
    const durationMs = Date.now() - startTime;

    // Filter out failed optimizations
    const successful = results.filter(r => r !== null) as BulletOptimization[];

    console.info(`[PARALLEL_OPTIMIZER] Completed in ${durationMs}ms`);
    console.info(`[PARALLEL_OPTIMIZER] Successful: ${successful.length}/${bullets.length}`);

    return successful;
  }

  /**
   * Optimize a single bullet point
   */
  async optimizeSingleBullet(
    line: ResumeLine,
    targetKeywords: string[],
    context: OptimizationContext
  ): Promise<BulletOptimization | null> {
    if (targetKeywords.length === 0) {
      return null;
    }

    console.info(`[PARALLEL_OPTIMIZER] Optimizing line ${line.lineNumber} with keywords: ${targetKeywords.join(', ')}`);

    const startTime = Date.now();
    const tracker = getTokenTracker();

    // Count words in original
    const originalWords = this.countWords(line.text);
    const maxWords = this.config.preserveLength
      ? originalWords + 5
      : originalWords + 10;

    // Build context from portfolio/projects if available
    const additionalContext = [];
    if (context.portfolio) {
      additionalContext.push(`Portfolio excerpt:\n${context.portfolio.content.substring(0, 1000)}`);
    }
    if (context.projects) {
      additionalContext.push(`Projects excerpt:\n${context.projects.content.substring(0, 1000)}`);
    }

    const prompt = `You are an expert resume writer specializing in ATS optimization.

TASK: Rewrite this resume bullet point to naturally integrate the specified keywords while maintaining professional tone and impact.

ORIGINAL BULLET:
${line.text}

KEYWORDS TO INTEGRATE:
${targetKeywords.join(', ')}

SECTION: ${line.sectionType || 'experience'}

${additionalContext.length > 0 ? `ADDITIONAL CONTEXT:\n${additionalContext.join('\n\n')}` : ''}

${context.customInstructions ? `CUSTOM INSTRUCTIONS:\n${context.customInstructions}\n` : ''}

REQUIREMENTS:
1. Integrate ALL ${targetKeywords.length} keywords naturally
2. Maintain the core achievement and impact
3. Keep it under ${maxWords} words (original: ${originalWords} words)
4. Use strong action verbs
5. Maintain professional tone
6. Ensure ATS-friendly formatting (no special characters)
7. Focus on quantifiable results if possible
8. The keywords should flow naturally, not feel forced

EXAMPLES OF GOOD INTEGRATION:
- "Built web application" → "Built scalable web application using React and Node.js"
- "Deployed system" → "Deployed containerized system using Docker and AWS"
- "Developed models" → "Developed machine learning models with PyTorch achieving 95% accuracy"

Return ONLY the optimized bullet point text. No explanations, no markdown, no extra formatting.

OPTIMIZED BULLET:`;

    try {
      const estimatedPromptTokens = tracker.estimateTokens(prompt);

      const response = await this.client.models.generateContent({
        model: MODEL_NAME,
        contents: prompt
      });

      let optimizedText = response.text.trim();
      const estimatedCompletionTokens = tracker.estimateTokens(optimizedText);
      const durationMs = Date.now() - startTime;

      // Clean up response
      optimizedText = this.cleanOptimizedText(optimizedText, line.text);

      // Validate optimization
      const validation = this.validateOptimization(
        line.text,
        optimizedText,
        targetKeywords,
        maxWords
      );

      if (!validation.isValid) {
        console.warn(`[PARALLEL_OPTIMIZER] Validation failed for line ${line.lineNumber}: ${validation.reason}`);

        // Track failed attempt
        tracker.recordLLMCall(
          this.sessionId,
          `optimize_bullet_line_${line.lineNumber}`,
          MODEL_NAME,
          estimatedPromptTokens,
          estimatedCompletionTokens,
          durationMs,
          false,
          validation.reason
        );

        return null;
      }

      // Track successful optimization
      tracker.recordLLMCall(
        this.sessionId,
        `optimize_bullet_line_${line.lineNumber}`,
        MODEL_NAME,
        estimatedPromptTokens,
        estimatedCompletionTokens,
        durationMs,
        true
      );

      const optimization: BulletOptimization = {
        lineNumber: line.lineNumber,
        originalText: line.text,
        optimizedText,
        addedKeywords: targetKeywords,
        tokensUsed: estimatedPromptTokens + estimatedCompletionTokens,
        confidence: validation.confidence,
        timestamp: new Date()
      };

      console.info(`[PARALLEL_OPTIMIZER] ✓ Line ${line.lineNumber} optimized successfully`);

      return optimization;

    } catch (error) {
      console.error(`[PARALLEL_OPTIMIZER] Error optimizing line ${line.lineNumber}:`, error);

      tracker.recordLLMCall(
        this.sessionId,
        `optimize_bullet_line_${line.lineNumber}`,
        MODEL_NAME,
        0,
        0,
        Date.now() - startTime,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );

      return null;
    }
  }

  /**
   * Clean optimized text
   */
  private cleanOptimizedText(text: string, original: string): string {
    // Remove markdown formatting
    let cleaned = text
      .replace(/^```.*$/gm, '')
      .replace(/^\*\*|^-\s+/gm, '')
      .trim();

    // Remove bullet point markers if present
    cleaned = cleaned.replace(/^[•\-\*]\s*/, '');

    // Preserve LaTeX commands from original if present
    if (original.includes('\\item')) {
      cleaned = `\\item ${cleaned}`;
    }

    return cleaned;
  }

  /**
   * Validate optimization
   */
  private validateOptimization(
    original: string,
    optimized: string,
    targetKeywords: string[],
    maxWords: number
  ): { isValid: boolean; reason?: string; confidence: number } {
    // Check if optimized text is too similar to original
    if (optimized.toLowerCase() === original.toLowerCase()) {
      return { isValid: false, reason: 'No changes made', confidence: 0 };
    }

    // Check word count
    const wordCount = this.countWords(optimized);
    if (wordCount > maxWords) {
      return { isValid: false, reason: `Exceeds word limit (${wordCount} > ${maxWords})`, confidence: 0 };
    }

    // Check if keywords are present
    const optimizedLower = optimized.toLowerCase();
    const missingKeywords = targetKeywords.filter(
      keyword => !optimizedLower.includes(keyword.toLowerCase())
    );

    if (missingKeywords.length > 0) {
      return {
        isValid: false,
        reason: `Missing keywords: ${missingKeywords.join(', ')}`,
        confidence: 0
      };
    }

    // Check if too short (probably incomplete)
    if (wordCount < 5) {
      return { isValid: false, reason: 'Optimized text too short', confidence: 0 };
    }

    // Calculate confidence based on keyword integration
    const allKeywordsPresent = missingKeywords.length === 0;
    const lengthAppropriate = wordCount <= maxWords;
    const notTooShort = wordCount >= this.countWords(original) - 3;

    let confidence = 0.6; // Base confidence
    if (allKeywordsPresent) confidence += 0.2;
    if (lengthAppropriate) confidence += 0.1;
    if (notTooShort) confidence += 0.1;

    return {
      isValid: confidence >= this.config.minConfidenceScore,
      confidence
    };
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    // Remove LaTeX commands
    const cleaned = text
      .replace(/\\[a-zA-Z]+\{?/g, '')
      .replace(/[{}]/g, '');

    // Count words
    return cleaned.split(/\s+/).filter(w => w.length > 0).length;
  }

  /**
   * Build bullet optimization plan from keyword mappings
   */
  static buildOptimizationPlan(
    resume: Resume,
    keywordMappings: KeywordMapping[]
  ): Array<{ line: ResumeLine; keywords: string[] }> {
    const plan = new Map<number, string[]>();

    // Group keywords by line number
    keywordMappings.forEach(mapping => {
      mapping.targetLines.forEach(lineNum => {
        if (!plan.has(lineNum)) {
          plan.set(lineNum, []);
        }
        plan.get(lineNum)!.push(mapping.keyword);
      });
    });

    // Build final plan with line objects
    const optimizationPlan: Array<{ line: ResumeLine; keywords: string[] }> = [];

    plan.forEach((keywords, lineNum) => {
      const line = resume.lines.find(l => l.lineNumber === lineNum);
      if (line && line.isEditable) {
        optimizationPlan.push({ line, keywords });
      }
    });

    return optimizationPlan;
  }
}

/**
 * Create parallel optimizer instance
 */
export function createParallelOptimizer(
  apiKey: string,
  sessionId: string,
  config: OptimizationConfig
): ParallelOptimizer {
  return new ParallelOptimizer(apiKey, sessionId, config);
}
