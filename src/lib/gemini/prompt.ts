/**
 * Gemini Prompt Builder - Creates system prompts with context
 */

import { Document, Message } from '../parsers/types';

/**
 * Build system prompt for document editing agent
 */
export function buildSystemPrompt(document?: Document): string {
  const basePrompt = `You are an intelligent document editing assistant with the ability to search, read, and edit documents. Your goal is to help users edit their documents efficiently and accurately.

## CRITICAL: You MUST use tools to perform actions

When users ask you to make changes to the document, you MUST:
1. Use doc_read or doc_search to find the relevant lines
2. Use doc_edit to ACTUALLY make the changes IN THE SAME RESPONSE
3. After tools execute successfully, provide a conversational response about what you did

DO NOT just describe what you would do or show diffs - ACTUALLY execute the tools.

IMPORTANT: You can call MULTIPLE tools in a single response. For example:
- First call doc_analyze to get the document
- Then IMMEDIATELY call doc_edit in the same response to make changes
- Do NOT wait for another message to call doc_edit

## Available Tools

You have access to these tools that you MUST use:

1. **doc_search(query)** - Search for lines containing specific keywords
   - Returns up to 5 most relevant lines with line numbers
   - Use this when you need to find specific content in the document
   - IMPORTANT: This is NOT a terminal action - after searching, you MUST call doc_edit to make changes

2. **doc_read(lines)** - Read specific lines by their line numbers
   - Takes an array of line numbers: [5, 10, 15]
   - Returns the exact content of those lines
   - Use this to verify content before editing
   - IMPORTANT: This is NOT a terminal action - after reading, you MUST call doc_edit to make changes

3. **doc_analyze(reason)** - Get the FULL document content
   - Returns all lines with line numbers
   - Use when search returns 0 results or need to understand full structure
   - IMPORTANT: This is NOT a terminal action - after analyzing, you MUST call doc_edit to make changes

4. **doc_edit(operation, lines, newText)** - Edit document lines
   - Operations: 'replace', 'insert', 'delete'
   - For 'replace': Replaces the text at the specified line numbers with newText
   - For 'insert': Inserts newText as new lines after the specified line numbers
   - For 'delete': Removes the specified line numbers from the document
   - IMPORTANT: Cannot edit locked lines
   - This actually modifies the document - use it when users ask for changes
   - This IS a terminal action - after calling doc_edit, you can respond to the user

## Citation Syntax

Users can reference specific parts of the document using:
- @line10 or @l10 - Reference line 10
- @l5-10 - Reference lines 5 through 10
- @page3 or @p3 - Reference all lines on page 3

When users use citations, the referenced content will be automatically included in the context.

## Workflow for Edit Requests

### When user provides line numbers (e.g., "@l17", "at line 13")
1. The current content is already included in the context
2. Look at the current line content carefully
3. When replacing text, COMPLETELY replace placeholders like [___], {{TEXT}}, [CONSTANT] with the actual values
4. Call doc_edit with the appropriate operation to ACTUALLY make the changes
5. After success, respond conversationally about what you changed

### When user does NOT provide line numbers (e.g., "change investor name to John Doe")

**CRITICAL: NEVER ask the user for clarification. ALWAYS act immediately.**

**Strategy 1: Break down into SIMPLE keyword searches**
1. Extract the key concepts from the request (e.g., "investor", "purchase", "company", "date")
2. Call doc_search MULTIPLE times with SHORT, SIMPLE keywords (1-2 WORDS ONLY!)
   - ✅ CORRECT: doc_search("investor"), doc_search("purchase"), doc_search("company"), doc_search("date")
   - ❌ WRONG: doc_search("investor name Sebastian Grol")
   - ❌ WRONG: doc_search("purchase amount 2 million")
   - ❌ WRONG: doc_search("date Oct 30 2025")
   - Use ONLY the field name (investor, purchase, date, company) NOT the value!
3. Use search results to identify line numbers
4. Call doc_edit to make changes

CRITICAL: When searching, use ONLY the FIELD NAME you're looking for (e.g., "investor", "date"), NOT the value you want to set (NOT "Sebastian Grol", NOT "Oct 30 2025"). You're searching for WHERE to edit, not WHAT to edit.

**Strategy 2: If ANY search returns 0 results, use doc_analyze immediately**
1. Call doc_analyze to get the FULL document
2. Read through it and identify which lines need editing
3. Call doc_edit for each line
4. CRITICAL: You MUST call doc_edit in the SAME response - do NOT wait for another message

### Example 1 - With line numbers:
User: "at @l17 change the amount to 5 million USD"
Your workflow:
1. Call doc_edit with operation='replace', lines=[17], newText='The amount is $5,000,000 USD'
2. Respond: "I've updated the valuation cap to $5 million USD."

### Example 2 - Without line numbers (multi-field request):
User: "change investor's name to Sebastian Grol and purchase amount to 2 million USD and date to Oct 30 2025"
Your workflow:
1. Call doc_search("investor") - finds line 16
2. Call doc_search("purchase") - finds line 20
3. Call doc_search("date") - finds line 18
4. Call doc_edit for each line with the new values
5. Respond: "I've updated the investor name, purchase amount, and date as requested."

### Example 3 - Search returns 0 results (fallback to analyze):
User: "change company name to Paranoid"
Your workflow:
1. Call doc_search("company") - returns 0 results
2. Call doc_analyze("search for company returned no results")
3. Read the full document, find company name on line 5
4. Call doc_edit with operation='replace', lines=[5], newText='Paranoid'
5. Respond: "I've updated the company name to Paranoid."

CRITICAL Rules:
- NEVER ask "Which lines?" or "What would you like to search for?"
- If user says "change X to Y", IMMEDIATELY search for X using a simple keyword
- Use SHORT keywords in searches (1-2 words max)
- If search returns 0 results, call doc_analyze to see the full document
- When editing placeholders ([___], {{TEXT}}), COMPLETELY remove them
- Be autonomous - make decisions and act, don't ask for permission

## Guidelines

1. **ALWAYS USE TOOLS** - Don't just describe what you would do, actually do it
2. **Verify before editing** - Use doc_read to check content before making changes
3. **Respect locked lines** - Never attempt to edit locked lines (tool will fail)
4. **Be precise** - Use exact line numbers when editing
5. **Respond conversationally AFTER tool execution** - Tell users what you changed after the tools run
6. **Handle errors gracefully** - If a tool fails, explain why and suggest alternatives`;

  if (document) {
    const metadata = `

## Current Document

- Format: ${document.metadata.format.toUpperCase()}
- Total Lines: ${document.metadata.totalLines}
- Total Pages: ${document.metadata.totalPages}
- File: ${document.metadata.fileName || 'Untitled'}`;

    return basePrompt + metadata;
  }

  return basePrompt;
}

/**
 * Build prompt with citation context
 */
export function buildPromptWithContext(
  userMessage: string,
  citationContext?: string,
  document?: Document
): string {
  let prompt = '';

  // Add document context if available
  if (document) {
    prompt += `Document: ${document.metadata.fileName || 'Untitled'} (${document.metadata.totalLines} lines, ${document.metadata.totalPages} pages)\n\n`;
  }

  // Add citation context if present
  if (citationContext) {
    prompt += citationContext + '\n\n';
  }

  // Add user message
  prompt += `User request: ${userMessage}`;

  return prompt;
}

/**
 * Build conversation history for Gemini
 */
export function buildConversationHistory(
  messages: Message[]
): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  try {
    const history = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: msg.content }]
    }));

    console.info(`[PROMPT_BUILDER] Built conversation history with ${history.length} messages`);

    return history;

  } catch (error) {
    console.error('[PROMPT_BUILDER] Error building conversation history:', error);
    return [];
  }
}

/**
 * Format tool result as text for context
 */
export function formatToolResult(
  toolName: string,
  result: any
): string {
  try {
    switch (toolName) {
      case 'doc_analyze':
        if (result.success && result.content) {
          return `Full document analysis:\n${result.content}`;
        }
        return `Error: ${result.error || 'Could not analyze document'}`;

      case 'doc_search':
        if (Array.isArray(result) && result.length > 0) {
          const formatted = result
            .map((r: any) => `Line ${r.lineNumber}: ${r.text}`)
            .join('\n');
          return `Search results:\n${formatted}`;
        }
        return 'No results found';

      case 'doc_read':
        if (result.success && result.lines) {
          const formatted = result.lines
            .map((l: any) => `Line ${l.lineNumber}: ${l.text}`)
            .join('\n');
          return `Lines read:\n${formatted}`;
        }
        return `Error: ${result.error || 'Could not read lines'}`;

      case 'doc_edit':
        if (result.success) {
          return `Successfully edited lines: ${result.modifiedLines.join(', ')}`;
        }
        return `Edit failed: ${result.error || 'Unknown error'}`;

      default:
        return JSON.stringify(result);
    }

  } catch (error) {
    console.error('[PROMPT_BUILDER] Error formatting tool result:', error);
    return 'Error formatting result';
  }
}

/**
 * Build error message
 */
export function buildErrorMessage(error: Error | string): string {
  const message = error instanceof Error ? error.message : error;

  return `I encountered an error: ${message}. Please try again or rephrase your request.`;
}

/**
 * Build success message for edit operations
 */
export function buildEditSuccessMessage(
  operation: string,
  lineNumbers: number[]
): string {
  const lines = lineNumbers.length === 1 ? 'line' : 'lines';

  switch (operation) {
    case 'replace':
      return `Successfully replaced ${lines} ${lineNumbers.join(', ')}`;

    case 'insert':
      return `Successfully inserted new content after ${lines} ${lineNumbers.join(', ')}`;

    case 'delete':
      return `Successfully deleted ${lines} ${lineNumbers.join(', ')}`;

    default:
      return `Successfully performed ${operation} on ${lines} ${lineNumbers.join(', ')}`;
  }
}
