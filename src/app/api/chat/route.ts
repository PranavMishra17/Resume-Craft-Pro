/**
 * Chat API Route - Handles chat with Gemini and tool execution
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeGemini, chatWithHistory } from '@/lib/gemini/client';
import { toolDefinitions, executeDocSearch, executeDocRead, executeDocEdit, executeDocAnalyze } from '@/lib/gemini/tools';
import { buildSystemPrompt, buildPromptWithContext, formatToolResult } from '@/lib/gemini/prompt';
import { parseCitations } from '@/lib/citations/parser';
import { resolveCitations, formatCitationsAsContext } from '@/lib/citations/resolver';
import { Action, Citation, Message } from '@/lib/parsers/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/chat - Send a message and get response from Gemini
 */
export async function POST(request: NextRequest) {
  try {
    console.info('[CHAT_API] Received chat request');

    // Get request body
    const body = await request.json();
    const { message, document, chatHistory = [], customPrompt, customApiKey } = body;

    // Validate inputs
    if (!message || message.trim().length === 0) {
      console.error('[CHAT_API] Empty message');
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!document) {
      console.error('[CHAT_API] No document provided');
      return NextResponse.json(
        { error: 'Document is required' },
        { status: 400 }
      );
    }

    // Get API key - use custom key if provided, otherwise use environment variable
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('[CHAT_API] GEMINI_API_KEY not configured');
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    if (customApiKey) {
      console.info('[CHAT_API] Using custom API key');
    } else {
      console.info('[CHAT_API] Using default API key from environment');
    }

    console.info('[CHAT_API] Processing message with citations');

    // Parse citations from message
    const citations = parseCitations(message);
    console.info(`[CHAT_API] Found ${citations.length} citations`);

    // Resolve citations to actual content
    const resolvedCitations = resolveCitations(citations, document);
    const citationContext = formatCitationsAsContext(resolvedCitations);

    // Build prompt with context
    const prompt = buildPromptWithContext(message, citationContext, document);
    console.info('[CHAT_API] Built prompt with context (length:', prompt.length, ')');

    // Initialize Gemini
    const genAI = initializeGemini(apiKey);

    // Build conversation context with history
    let conversationContext = '';

    // Add system prompt if first message
    if (chatHistory.length === 0) {
      conversationContext += `${buildSystemPrompt(document)}\n\n`;
    }

    // Add custom instructions if provided
    if (customPrompt && customPrompt.trim().length > 0) {
      conversationContext += `## User's Custom Instructions\n\n${customPrompt.trim()}\n\n`;
      console.info('[CHAT_API] Added custom instructions:', customPrompt);
    }

    // Add recent conversation history (last 5 messages for context)
    const recentHistory = chatHistory.slice(-5);
    if (recentHistory.length > 0) {
      conversationContext += 'Recent conversation:\n';
      recentHistory.forEach((msg: Message) => {
        conversationContext += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
      conversationContext += '\n';
    }

    // Add current prompt
    conversationContext += `Current user request: ${prompt}`;

    console.info('[CHAT_API] Conversation context length:', conversationContext.length);
    console.info('[CHAT_API] Is first message (includes system prompt):', chatHistory.length === 0);
    console.info('[CHAT_API] Recent history messages:', recentHistory.length);

    // Check if citations include locked lines - warn user before editing
    const lockedLinesInCitations: number[] = [];
    if (resolvedCitations.length > 0) {
      resolvedCitations.forEach((citation: Citation) => {
        // Get the actual Line objects for the cited line numbers
        const citedLineNumbers = citation.lineNumbers || [];
        citedLineNumbers.forEach((lineNum: number) => {
          const line = document.lines.find((l: any) => l.lineNumber === lineNum);
          if (line && line.isLocked) {
            lockedLinesInCitations.push(line.lineNumber);
          }
        });
      });
    }

    if (lockedLinesInCitations.length > 0) {
      console.warn('[CHAT_API] Warning: User referenced locked lines:', lockedLinesInCitations);
      conversationContext += `\n\nIMPORTANT: The user has referenced lines ${lockedLinesInCitations.join(', ')} which are LOCKED and cannot be edited. If the user is trying to edit these lines, politely inform them that these lines are immutable and locked by the user. Suggest that they unlock the lines first if they want to make changes.`;
    }

    // Execute chat with tools
    const actions: Action[] = [];
    let responseText = '';

    try {
      console.info('[CHAT_API] ===== CALLING GEMINI WITH TOOLS =====');
      const response = await chatWithHistory(
        genAI,
        conversationContext,
        [toolDefinitions]
      );
      console.info('[CHAT_API] ===== GEMINI RESPONSE RECEIVED =====');
      console.info('[CHAT_API] Response has functionCalls:', !!response.functionCalls);
      console.info('[CHAT_API] Response has text:', !!response.text);

      // Handle function calls with multi-turn execution
      if (response.functionCalls && response.functionCalls.length > 0) {
        console.info(`[CHAT_API] Processing ${response.functionCalls.length} function calls`);

        const toolResults: string[] = [];
        const detailedActions: Array<{ tool: string; args: any; result: any }> = [];
        let needsFollowUp = false;

        for (const functionCall of response.functionCalls) {
          const { name, args } = functionCall;

          console.info(`[CHAT_API] Executing tool: ${name}`);

          try {
            let result: any;

            switch (name) {
              case 'doc_analyze':
                result = executeDocAnalyze(args.reason, document);
                actions.push({
                  type: 'read',
                  success: result.success,
                  details: { reason: args.reason, lines: result.totalLines },
                  timestamp: new Date()
                });
                needsFollowUp = true; // Agent needs to continue with doc_edit
                break;

              case 'doc_search':
                result = executeDocSearch(args.query, document, args.limit);
                actions.push({
                  type: 'search',
                  success: true,
                  details: { query: args.query, results: result.length },
                  timestamp: new Date()
                });
                needsFollowUp = true; // Agent needs to continue with doc_edit
                break;

              case 'doc_read':
                result = executeDocRead(args.lines, document);
                actions.push({
                  type: 'read',
                  success: result.success,
                  details: { lines: args.lines, found: result.lines?.length || 0 },
                  timestamp: new Date()
                });
                needsFollowUp = true; // Agent might need to continue with doc_edit
                break;

              case 'doc_edit':
                result = executeDocEdit(args, document);
                actions.push({
                  type: 'edit',
                  success: result.success,
                  details: {
                    operation: args.operation,
                    lines: args.lines,
                    modified: result.modifiedLines?.length || 0,
                    newText: args.newText // Include the new text for context
                  },
                  timestamp: new Date()
                });
                // Edit is a terminal action - don't need follow-up
                break;

              default:
                console.warn(`[CHAT_API] Unknown tool: ${name}`);
                result = { error: `Unknown tool: ${name}` };
            }

            toolResults.push(formatToolResult(name, result));
            detailedActions.push({ tool: name, args, result });

          } catch (error) {
            console.error(`[CHAT_API] Error executing tool ${name}:`, error);
            actions.push({
              type: name.replace('doc_', '') as any,
              success: false,
              details: { error: error instanceof Error ? error.message : 'Unknown error' },
              timestamp: new Date()
            });
            toolResults.push(`Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        // SERVER-SIDE FALLBACK: If all searches returned 0 results and no doc_analyze was called, force it
        const allSearches = detailedActions.filter(a => a.tool === 'doc_search');
        const hasDocAnalyze = detailedActions.some(a => a.tool === 'doc_analyze');
        const hasDocEdit = detailedActions.some(a => a.tool === 'doc_edit');

        if (allSearches.length > 0 && !hasDocAnalyze && !hasDocEdit) {
          const allSearchesEmpty = allSearches.every(a => Array.isArray(a.result) && a.result.length === 0);

          if (allSearchesEmpty) {
            console.warn('[CHAT_API] All searches returned 0 results. Auto-calling doc_analyze as fallback...');

            // Automatically call doc_analyze
            const analyzeResult = executeDocAnalyze('All searches returned no results - analyzing full document', document);
            actions.push({
              type: 'read',
              success: analyzeResult.success,
              details: { reason: 'Fallback: all searches empty', lines: analyzeResult.totalLines },
              timestamp: new Date()
            });

            toolResults.push(formatToolResult('doc_analyze', analyzeResult));
            detailedActions.push({
              tool: 'doc_analyze',
              args: { reason: 'Fallback: all searches empty' },
              result: analyzeResult
            });

            needsFollowUp = true; // Force follow-up to make edits
            console.info('[CHAT_API] Forced doc_analyze executed. Will continue to doc_edit.');
          }
        }

        // If agent called doc_analyze/doc_search/doc_read but NOT doc_edit, continue the loop
        if (needsFollowUp && !detailedActions.some(a => a.tool === 'doc_edit')) {
          console.info('[CHAT_API] Agent used search/analyze tool but did not edit. Continuing tool loop...');

          // Send tool results back to agent WITH tools enabled so it can continue
          // Include system context to remind agent of its role
          let followUpPrompt = `${buildSystemPrompt(document)}\n\n`;

          // Add custom instructions in follow-up if provided
          if (customPrompt && customPrompt.trim().length > 0) {
            followUpPrompt += `## User's Custom Instructions\n\n${customPrompt.trim()}\n\n`;
          }

          followUpPrompt += `CRITICAL INSTRUCTION: You just executed tool calls and now you MUST complete the user's request by calling doc_edit.

Tool execution results:
${toolResults.join('\n\n')}

The user's original request was: "${message}"

You have the document content above from your tool calls. Now you MUST:
1. Identify which line numbers need to be edited based on the user's request
2. Call doc_edit with operation='replace', lines=[...], and newText='...'
3. DO NOT respond with text - You are a tool-using agent - ONLY make function calls

REMEMBER: You can only communicate through tool calls. Call doc_edit RIGHT NOW to make the changes the user requested. Do not provide text responses - ONLY tool calls.`;

          const followUpResponse = await chatWithHistory(
            genAI,
            followUpPrompt,
            [toolDefinitions] // Keep tools enabled!
          );

          // Process any additional function calls
          if (followUpResponse.functionCalls && followUpResponse.functionCalls.length > 0) {
            console.info(`[CHAT_API] Processing ${followUpResponse.functionCalls.length} follow-up function calls`);

            for (const functionCall of followUpResponse.functionCalls) {
              const { name, args } = functionCall;
              console.info(`[CHAT_API] Executing follow-up tool: ${name}`);

              try {
                let result: any;

                switch (name) {
                  case 'doc_edit':
                    result = executeDocEdit(args, document);
                    actions.push({
                      type: 'edit',
                      success: result.success,
                      details: {
                        operation: args.operation,
                        lines: args.lines,
                        modified: result.modifiedLines?.length || 0,
                        newText: args.newText
                      },
                      timestamp: new Date()
                    });
                    break;

                  default:
                    console.warn(`[CHAT_API] Unexpected follow-up tool: ${name}`);
                    result = { error: `Unexpected tool: ${name}` };
                }

                toolResults.push(formatToolResult(name, result));
                detailedActions.push({ tool: name, args, result });

              } catch (error) {
                console.error(`[CHAT_API] Error executing follow-up tool ${name}:`, error);
                toolResults.push(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }
          }
        }

        // Build detailed context for conversational response
        const successfulEdits: string[] = [];
        const failedEdits: string[] = [];
        const searches: string[] = [];

        detailedActions.forEach(action => {
          if (action.tool === 'doc_analyze') {
            searches.push(`Analyzed full document (${action.result.totalLines || 0} lines)`);
          } else if (action.tool === 'doc_search') {
            const query = action.args.query;
            const resultCount = action.result.length || 0;
            searches.push(`Searched for "${query}" - found ${resultCount} result(s)`);
          } else if (action.tool === 'doc_edit') {
            const lineNums = Array.isArray(action.args.lines) ? action.args.lines.join(', ') : action.args.lines;
            if (action.result.success) {
              // Don't include the full newText - just mention what type of change
              const operation = action.args.operation;
              if (operation === 'delete') {
                successfulEdits.push(`line ${lineNums} (deleted)`);
              } else {
                successfulEdits.push(`line ${lineNums}`);
              }
            } else {
              const error = action.result.error || 'unknown error';
              failedEdits.push(`line ${lineNums} (${error})`);
            }
          }
        });

        // Generate final response with tool results
        let responsePrompt = 'You just executed the following tool calls:\n\n';

        if (searches.length > 0) {
          responsePrompt += `Searches performed:\n${searches.map(s => `- ${s}`).join('\n')}\n\n`;
        }

        if (successfulEdits.length > 0) {
          responsePrompt += `Successfully edited: ${successfulEdits.join(', ')}\n`;
        }

        if (failedEdits.length > 0) {
          responsePrompt += `Failed to edit: ${failedEdits.join(', ')}\n`;
        }

        responsePrompt += `\nProvide a brief, natural, conversational response (1-2 sentences) summarizing what you did:

IMPORTANT:
- DO NOT repeat the exact text you wrote to each line (that's already shown in the edit details)
- Instead, describe WHAT you changed (e.g., "investor name", "valuation cap", "company name")
- If edits failed, acknowledge them and explain why
- Be concise and friendly

Example good responses:
- "I've updated the investor name and purchase amount as requested." (NOT "I've set line 16 to 'Sebastian Grol' and line 20 to '$2,000,000'")
- "I've filled in the valuation cap with $5 million USD." (NOT "I've updated line 17 to 'The Post-Money Valuation Cap is $5,000,000 USD'")
- "I found the investor section and updated it with Sebastian Grol. I also changed the purchase amount to $2 million USD."
- "I couldn't edit line 11 because it's locked by you. The other changes were made successfully."

BAD responses (don't do this):
- "I've updated line 17 to set the valuation cap to $5,000,000 USD and changed line 5 to 'Paranoid'." (Too repetitive of the edit itself)
- Repeating the exact full text that was written to the document`;

        const finalResponse = await chatWithHistory(
          genAI,
          responsePrompt
        );

        responseText = finalResponse.text || 'I\'ve completed the requested operations.';

      } else if (response.text) {
        responseText = response.text;
      } else {
        responseText = 'I received your message but could not generate a response.';
      }

    } catch (error) {
      console.error('[CHAT_API] Error in Gemini chat:', error);
      return NextResponse.json(
        {
          error: 'Failed to generate response',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    console.info('[CHAT_API] Successfully generated response');

    return NextResponse.json({
      success: true,
      message: responseText,
      citations: resolvedCitations.length > 0 ? resolvedCitations : undefined,
      actions: actions.length > 0 ? actions : undefined,
      document: actions.some(a => a.type === 'edit' && a.success) ? document : undefined
    });

  } catch (error) {
    console.error('[CHAT_API] Unexpected error:', error);

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
 * GET /api/chat - Health check
 */
export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;

  return NextResponse.json({
    status: 'ok',
    service: 'chat',
    gemini_configured: !!apiKey
  });
}
