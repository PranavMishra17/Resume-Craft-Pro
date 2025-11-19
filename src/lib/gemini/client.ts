/**
 * Gemini Client - Handles communication with Google Generative AI (Gemini 2.0 Flash)
 * Uses the @google/generative-ai library
 */

import { GoogleGenerativeAI, FunctionDeclarationSchemaType } from '@google/generative-ai';

// Export Type for use in tool definitions
export { FunctionDeclarationSchemaType as Type };

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms
const DEFAULT_MODEL = 'gemini-2.0-flash-exp';

/**
 * Initialize Gemini client with API key
 */
export function initializeGemini(apiKey: string): GoogleGenerativeAI {
  try {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }

    console.info('[GEMINI_CLIENT] Initializing Gemini client');
    const genAI = new GoogleGenerativeAI(apiKey);

    return genAI;

  } catch (error) {
    console.error('[GEMINI_CLIENT] Error initializing Gemini:', error);
    throw new Error(`Failed to initialize Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate content with retry logic
 */
export async function generateWithRetry(
  client: GoogleGenerativeAI,
  prompt: string,
  modelName: string = DEFAULT_MODEL
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.info(`[GEMINI_CLIENT] Generating content (attempt ${attempt}/${MAX_RETRIES})`);

      // Get the generative model
      const model = client.getGenerativeModel({ model: modelName });

      // Generate content
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      console.info('[GEMINI_CLIENT] Content generated successfully');
      return text;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`[GEMINI_CLIENT] Attempt ${attempt} failed:`, error);

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY * attempt;
        console.info(`[GEMINI_CLIENT] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error(`[GEMINI_CLIENT] All ${MAX_RETRIES} attempts failed`);
  throw new Error(`Failed to generate content after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

/**
 * Chat with conversation history and function calling support
 */
export async function chatWithHistory(
  client: GoogleGenerativeAI,
  prompt: string,
  tools?: any[],
  modelName: string = DEFAULT_MODEL
): Promise<{ text?: string; functionCalls?: any[] }> {
  try {
    console.info('[GEMINI_CLIENT] Starting chat with tools');
    console.info('[GEMINI_CLIENT] Tools provided:', tools ? 'YES' : 'NO');
    console.info('[GEMINI_CLIENT] Number of tools:', tools?.length || 0);

    // Configure model with tools if provided
    const modelConfig: any = { model: modelName };
    if (tools && tools.length > 0) {
      modelConfig.tools = tools;
      console.info('[GEMINI_CLIENT] Model configured with tools');
      console.info('[GEMINI_CLIENT] Tools structure:', JSON.stringify(tools, null, 2));
    }

    // Get the generative model
    const model = client.getGenerativeModel(modelConfig);

    console.info('[GEMINI_CLIENT] Sending request to Gemini...');
    const result = await model.generateContent(prompt);
    const response = result.response;

    // Debug: Log the full response structure
    console.info('[GEMINI_CLIENT] ===== RAW RESPONSE =====');
    console.info('[GEMINI_CLIENT] Response received');
    console.info('[GEMINI_CLIENT] =======================');

    // Check for function calls in the response candidates
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const firstCandidate = candidates[0];
      if (firstCandidate.content && firstCandidate.content.parts) {
        const functionCalls = firstCandidate.content.parts
          .filter((part: any) => part.functionCall)
          .map((part: any) => part.functionCall);

        if (functionCalls.length > 0) {
          console.info(`[GEMINI_CLIENT] ✓ Received ${functionCalls.length} function calls`);
          functionCalls.forEach((call, idx) => {
            console.info(`[GEMINI_CLIENT] Function call ${idx + 1}:`, JSON.stringify(call, null, 2));
          });
          return { functionCalls };
        }
      }
    }

    // Otherwise return text response
    const text = response.text();
    console.info('[GEMINI_CLIENT] ✓ Received text response (length:', text?.length || 0, ')');
    console.info('[GEMINI_CLIENT] Text preview:', text?.substring(0, 200));

    return { text };

  } catch (error) {
    console.error('[GEMINI_CLIENT] ✗ Error in chat:', error);
    throw new Error(`Chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate API key by making a test request
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    console.info('[GEMINI_CLIENT] Validating API key');

    const genAI = initializeGemini(apiKey);
    await generateWithRetry(genAI, 'Hello');

    console.info('[GEMINI_CLIENT] API key is valid');
    return true;

  } catch (error) {
    console.error('[GEMINI_CLIENT] API key validation failed:', error);
    return false;
  }
}
