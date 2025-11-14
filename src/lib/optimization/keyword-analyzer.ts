/**
 * Keyword Analyzer
 *
 * Extract and analyze keywords from job descriptions and resumes
 * - Extract technical keywords from JD
 * - Extract keywords from resume
 * - Perform gap analysis
 * - Map keywords to relevant bullet points
 */

import { GoogleGenAI } from '@google/genai';
import { Resume, ResumeLine, KeywordAnalysis, KeywordMapping } from '@/lib/parsers/types';
import { getTokenTracker } from '@/lib/tracking/token-tracker';

const MODEL_NAME = 'gemini-2.0-flash-exp';

/**
 * Keyword Analyzer class
 */
export class KeywordAnalyzer {
  private client: GoogleGenAI;
  private sessionId: string;

  constructor(apiKey: string, sessionId: string) {
    this.client = new GoogleGenAI({ apiKey });
    this.sessionId = sessionId;
  }

  /**
   * Extract keywords from job description
   */
  async extractJDKeywords(jdContent: string): Promise<string[]> {
    console.info('[KEYWORD_ANALYZER] Extracting keywords from job description');

    const startTime = Date.now();
    const tracker = getTokenTracker();

    const prompt = `You are a technical recruiter and keyword extraction expert.
Extract 15-20 most important technical keywords from this job description.

Focus on:
- Programming languages (Python, JavaScript, Java, C++, etc.)
- Frameworks and libraries (React, Django, TensorFlow, etc.)
- Tools and platforms (Docker, Kubernetes, AWS, etc.)
- Technical skills (Machine Learning, Computer Vision, API Development, etc.)
- Methodologies (Agile, CI/CD, TDD, etc.)

Return ONLY a comma-separated list of keywords. No explanations.

Example output: Python, React, AWS, Machine Learning, Docker, PostgreSQL, REST APIs

Job Description:
${jdContent}

Keywords:`;

    try {
      const estimatedPromptTokens = tracker.estimateTokens(prompt);

      const response = await this.client.models.generateContent({
        model: MODEL_NAME,
        contents: prompt
      });

      const text = response.text.trim();
      const estimatedCompletionTokens = tracker.estimateTokens(text);
      const durationMs = Date.now() - startTime;

      // Track tokens
      tracker.recordLLMCall(
        this.sessionId,
        'extract_jd_keywords',
        MODEL_NAME,
        estimatedPromptTokens,
        estimatedCompletionTokens,
        durationMs,
        true
      );

      // Parse keywords
      const keywords = text
        .split(/[,\n]/)
        .map(k => k.trim())
        .filter(k => k.length > 0 && k.length < 50); // Filter valid keywords

      console.info(`[KEYWORD_ANALYZER] Extracted ${keywords.length} keywords from JD`);

      return keywords;

    } catch (error) {
      console.error('[KEYWORD_ANALYZER] Error extracting JD keywords:', error);

      tracker.recordLLMCall(
        this.sessionId,
        'extract_jd_keywords',
        MODEL_NAME,
        0,
        0,
        Date.now() - startTime,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );

      throw new Error(`Failed to extract JD keywords: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract keywords from resume
   */
  async extractResumeKeywords(resume: Resume): Promise<string[]> {
    console.info('[KEYWORD_ANALYZER] Extracting keywords from resume');

    const startTime = Date.now();
    const tracker = getTokenTracker();

    // Build resume text (only editable lines)
    const resumeText = resume.lines
      .filter(line => line.isEditable || line.bulletLevel)
      .map(line => `Line ${line.lineNumber}: ${line.text}`)
      .join('\n');

    const prompt = `You are a technical resume analyst. Extract all technical keywords from this resume.

Focus on:
- Programming languages
- Frameworks and libraries
- Tools and platforms
- Technical skills
- Technologies mentioned

Return ONLY a comma-separated list of unique keywords found in the resume. No explanations.

Resume Content:
${resumeText}

Keywords:`;

    try {
      const estimatedPromptTokens = tracker.estimateTokens(prompt);

      const response = await this.client.models.generateContent({
        model: MODEL_NAME,
        contents: prompt
      });

      const text = response.text.trim();
      const estimatedCompletionTokens = tracker.estimateTokens(text);
      const durationMs = Date.now() - startTime;

      // Track tokens
      tracker.recordLLMCall(
        this.sessionId,
        'extract_resume_keywords',
        MODEL_NAME,
        estimatedPromptTokens,
        estimatedCompletionTokens,
        durationMs,
        true
      );

      // Parse keywords
      const keywords = text
        .split(/[,\n]/)
        .map(k => k.trim())
        .filter(k => k.length > 0 && k.length < 50);

      console.info(`[KEYWORD_ANALYZER] Extracted ${keywords.length} keywords from resume`);

      return keywords;

    } catch (error) {
      console.error('[KEYWORD_ANALYZER] Error extracting resume keywords:', error);

      tracker.recordLLMCall(
        this.sessionId,
        'extract_resume_keywords',
        MODEL_NAME,
        0,
        0,
        Date.now() - startTime,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );

      throw new Error(`Failed to extract resume keywords: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze keyword gap between JD and resume
   */
  analyzeKeywordGap(jdKeywords: string[], resumeKeywords: string[]): KeywordAnalysis {
    console.info('[KEYWORD_ANALYZER] Analyzing keyword gap');

    // Normalize keywords for comparison (case-insensitive)
    const jdNormalized = jdKeywords.map(k => k.toLowerCase());
    const resumeNormalized = resumeKeywords.map(k => k.toLowerCase());

    // Find missing keywords
    const missingKeywords = jdKeywords.filter(
      keyword => !resumeNormalized.includes(keyword.toLowerCase())
    );

    // Calculate keyword frequency
    const keywordFrequency = new Map<string, number>();
    resumeKeywords.forEach(keyword => {
      const count = keywordFrequency.get(keyword) || 0;
      keywordFrequency.set(keyword, count + 1);
    });

    // Calculate coverage
    const matchedCount = jdKeywords.filter(
      keyword => resumeNormalized.includes(keyword.toLowerCase())
    ).length;
    const coverage = (matchedCount / jdKeywords.length) * 100;

    const analysis: KeywordAnalysis = {
      jdKeywords,
      resumeKeywords,
      missingKeywords,
      keywordFrequency,
      coverage: Math.round(coverage * 10) / 10 // Round to 1 decimal
    };

    console.info(`[KEYWORD_ANALYZER] Keyword coverage: ${analysis.coverage}%`);
    console.info(`[KEYWORD_ANALYZER] Missing keywords: ${missingKeywords.length}`);

    return analysis;
  }

  /**
   * Map keywords to relevant bullet points
   * Uses LLM to intelligently assign keywords based on context
   */
  async mapKeywordsToBullets(
    missingKeywords: string[],
    resume: Resume,
    portfolioContent?: string,
    projectsContent?: string
  ): Promise<KeywordMapping[]> {
    console.info('[KEYWORD_ANALYZER] Mapping keywords to bullet points');

    if (missingKeywords.length === 0) {
      return [];
    }

    const startTime = Date.now();
    const tracker = getTokenTracker();

    // Get editable bullet points
    const bullets = resume.lines.filter(line => line.isEditable && line.bulletLevel);

    // Build context
    const bulletsText = bullets
      .map(line => `[Line ${line.lineNumber}] Section: ${line.sectionType || 'unknown'}\n${line.text}`)
      .join('\n\n');

    const additionalContext = [];
    if (portfolioContent) {
      additionalContext.push(`Portfolio:\n${portfolioContent.substring(0, 2000)}`);
    }
    if (projectsContent) {
      additionalContext.push(`Projects:\n${projectsContent.substring(0, 2000)}`);
    }

    const prompt = `You are a resume optimization expert. Your task is to map missing technical keywords to the most relevant bullet points in a resume.

MISSING KEYWORDS (need to add):
${missingKeywords.join(', ')}

RESUME BULLET POINTS:
${bulletsText}

${additionalContext.length > 0 ? `ADDITIONAL CONTEXT:\n${additionalContext.join('\n\n')}` : ''}

TASK:
For each missing keyword, identify which bullet point line numbers would be most appropriate to naturally integrate that keyword.

RULES:
1. Match keywords based on technical context and relevance
2. Each keyword can be mapped to multiple bullet points (max 2)
3. Each bullet should receive 1-2 new keywords maximum
4. Consider the section type (experience, projects, skills)
5. Prefer bullet points that already mention related technologies

Return ONLY a JSON array in this exact format:
[
  {
    "keyword": "React",
    "targetLines": [5, 12],
    "reason": "Web development context"
  },
  {
    "keyword": "Docker",
    "targetLines": [8],
    "reason": "Deployment and containerization context"
  }
]

JSON:`;

    try {
      const estimatedPromptTokens = tracker.estimateTokens(prompt);

      const response = await this.client.models.generateContent({
        model: MODEL_NAME,
        contents: prompt
      });

      const text = response.text.trim();
      const estimatedCompletionTokens = tracker.estimateTokens(text);
      const durationMs = Date.now() - startTime;

      // Track tokens
      tracker.recordLLMCall(
        this.sessionId,
        'map_keywords_to_bullets',
        MODEL_NAME,
        estimatedPromptTokens,
        estimatedCompletionTokens,
        durationMs,
        true
      );

      // Parse JSON response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from LLM');
      }

      const mappings: Array<{
        keyword: string;
        targetLines: number[];
        reason: string;
      }> = JSON.parse(jsonMatch[0]);

      // Convert to KeywordMapping format
      const keywordMappings: KeywordMapping[] = mappings.map(m => ({
        keyword: m.keyword,
        targetLines: m.targetLines,
        contextScore: 0.8 // Default high confidence from LLM
      }));

      console.info(`[KEYWORD_ANALYZER] Mapped ${keywordMappings.length} keywords to bullets`);

      return keywordMappings;

    } catch (error) {
      console.error('[KEYWORD_ANALYZER] Error mapping keywords:', error);

      tracker.recordLLMCall(
        this.sessionId,
        'map_keywords_to_bullets',
        MODEL_NAME,
        0,
        0,
        Date.now() - startTime,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );

      // Fallback: Simple distribution
      return this.fallbackKeywordMapping(missingKeywords, bullets);
    }
  }

  /**
   * Fallback keyword mapping (simple distribution)
   */
  private fallbackKeywordMapping(
    keywords: string[],
    bullets: ResumeLine[]
  ): KeywordMapping[] {
    console.warn('[KEYWORD_ANALYZER] Using fallback keyword mapping');

    const mappings: KeywordMapping[] = [];
    let bulletIndex = 0;

    keywords.forEach(keyword => {
      // Assign 1-2 bullets per keyword
      const targetLines = [bullets[bulletIndex % bullets.length].lineNumber];

      if (bullets.length > 1) {
        targetLines.push(bullets[(bulletIndex + 1) % bullets.length].lineNumber);
      }

      mappings.push({
        keyword,
        targetLines,
        contextScore: 0.5 // Lower confidence for fallback
      });

      bulletIndex += 2;
    });

    return mappings;
  }

  /**
   * Search portfolio/projects for keyword relevance
   */
  async findRelevantProjects(
    keyword: string,
    portfolioContent?: string,
    projectsContent?: string
  ): Promise<string[]> {
    const allContent = [portfolioContent, projectsContent]
      .filter(Boolean)
      .join('\n\n');

    if (!allContent) {
      return [];
    }

    const startTime = Date.now();
    const tracker = getTokenTracker();

    const prompt = `Find projects or experiences that mention or relate to "${keyword}".

Content:
${allContent.substring(0, 3000)}

Return a brief list (3-5 sentences max) of relevant projects or experiences that use ${keyword}.
If none found, return "None".`;

    try {
      const estimatedPromptTokens = tracker.estimateTokens(prompt);

      const response = await this.client.models.generateContent({
        model: MODEL_NAME,
        contents: prompt
      });

      const text = response.text.trim();
      const estimatedCompletionTokens = tracker.estimateTokens(text);
      const durationMs = Date.now() - startTime;

      tracker.recordLLMCall(
        this.sessionId,
        'find_relevant_projects',
        MODEL_NAME,
        estimatedPromptTokens,
        estimatedCompletionTokens,
        durationMs,
        true
      );

      if (text.toLowerCase() === 'none') {
        return [];
      }

      return [text];

    } catch (error) {
      console.error('[KEYWORD_ANALYZER] Error finding relevant projects:', error);
      return [];
    }
  }
}

/**
 * Create keyword analyzer instance
 */
export function createKeywordAnalyzer(apiKey: string, sessionId: string): KeywordAnalyzer {
  return new KeywordAnalyzer(apiKey, sessionId);
}
