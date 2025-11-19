/**
 * LLM-Based Placeholder Detection Service
 * Uses Gemini Flash to intelligently detect placeholders in document lines
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface LLMPlaceholderResult {
  lineNumber: number;
  isPlaceholder: boolean;
  placeholderNames: string[];
  confidence: number;
}

/**
 * Detect placeholders in a batch of lines using Gemini
 * @param lines - Array of text lines with their line numbers
 * @param apiKey - Gemini API key
 * @returns Array of detection results
 */
export async function detectPlaceholdersWithLLM(
  lines: Array<{ lineNumber: number; text: string }>,
  apiKey: string
): Promise<LLMPlaceholderResult[]> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Build prompt with all lines
    const linesText = lines
      .map(l => `Line ${l.lineNumber}: ${l.text}`)
      .join('\n');

    const prompt = `You are a legal document analyzer. Analyze the following lines from a legal document template and identify which lines contain DYNAMIC PLACEHOLDERS that need to be filled in by the user.

IMPORTANT RULES:
1. A line is a placeholder line if it contains brackets [], braces {}, or underscores that represent fields to be filled
2. Examples of placeholders:
   - [Investor Name], [Company Name], [Date of Safe]
   - [name], [title], [address] (even if lowercase)
   - $[_____________] (blank amount fields)
   - {Company Name}, {{Variable}}
   - [State of Incorporation]
3. Static legal text, headers, and boilerplate are NOT placeholders
4. Even if a line has only one small placeholder in a long sentence, it's still a placeholder line
5. Look for contextual clues (e.g., "the payment by [Investor Name]" - this is a placeholder)

DOCUMENT LINES:
${linesText}

Respond with ONLY a JSON array, no other text. Format:
[
  {"lineNumber": 1, "isPlaceholder": true, "placeholderNames": ["Investor Name", "Date of Safe"], "confidence": 0.95},
  {"lineNumber": 2, "isPlaceholder": false, "placeholderNames": [], "confidence": 1.0}
]

JSON response:`;

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const responseText = response.text().trim();

    // Extract JSON from response (handle cases where LLM adds explanation)
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    const jsonText = jsonMatch ? jsonMatch[0] : '[]';

    const results: LLMPlaceholderResult[] = JSON.parse(jsonText);

    console.info(`[LLM_DETECTOR] Analyzed ${lines.length} lines, detected ${results.filter(r => r.isPlaceholder).length} placeholder lines`);

    return results;

  } catch (error) {
    console.error('[LLM_DETECTOR] Error detecting placeholders:', error);
    // Return conservative fallback - mark all lines as non-placeholders
    return lines.map(l => ({
      lineNumber: l.lineNumber,
      isPlaceholder: false,
      placeholderNames: [],
      confidence: 0
    }));
  }
}

/**
 * Batch process lines in parallel with LLM detection
 * @param lines - All document lines with line numbers
 * @param apiKey - Gemini API key
 * @param batchSize - Lines per batch (default 15)
 * @param maxParallel - Max parallel calls (default 5)
 */
export async function batchDetectPlaceholders(
  lines: Array<{ lineNumber: number; text: string }>,
  apiKey: string,
  batchSize: number = 15,
  maxParallel: number = 5
): Promise<Map<number, LLMPlaceholderResult>> {
  console.info(`[LLM_DETECTOR] Starting batch detection for ${lines.length} lines (batch size: ${batchSize}, parallel: ${maxParallel})`);

  // Split into batches
  const batches: Array<Array<{ lineNumber: number; text: string }>> = [];
  for (let i = 0; i < lines.length; i += batchSize) {
    batches.push(lines.slice(i, i + batchSize));
  }

  console.info(`[LLM_DETECTOR] Created ${batches.length} batches`);

  // Process batches in parallel (with concurrency limit)
  const results = new Map<number, LLMPlaceholderResult>();

  for (let i = 0; i < batches.length; i += maxParallel) {
    const batchGroup = batches.slice(i, i + maxParallel);

    console.info(`[LLM_DETECTOR] Processing batches ${i + 1}-${Math.min(i + maxParallel, batches.length)} of ${batches.length}`);

    const promises = batchGroup.map(batch => detectPlaceholdersWithLLM(batch, apiKey));
    const batchResults = await Promise.all(promises);

    // Merge results
    batchResults.forEach(batchResult => {
      batchResult.forEach(result => {
        results.set(result.lineNumber, result);
      });
    });
  }

  console.info(`[LLM_DETECTOR] Batch detection complete. Total results: ${results.size}`);

  return results;
}
