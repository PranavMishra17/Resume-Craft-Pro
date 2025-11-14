/**
 * Token Tracker - Track LLM token usage per session
 *
 * Features:
 * - Track tokens for all LLM calls
 * - Calculate costs (Gemini 2.0 Flash pricing)
 * - Session-based aggregation
 * - localStorage persistence
 */

import { TokenUsage, LLMCallRecord } from '@/lib/parsers/types';
import { encode } from 'gpt-tokenizer';

// Gemini 2.0 Flash pricing (as of 2025)
const GEMINI_FLASH_PRICING = {
  INPUT_PER_1K: 0.00001875,   // $0.00001875 per 1K input tokens
  OUTPUT_PER_1K: 0.000075,    // $0.000075 per 1K output tokens
};

/**
 * Token Tracker class for managing LLM token usage
 */
export class TokenTracker {
  private sessions: Map<string, TokenUsage> = new Map();
  private callRecords: Map<string, LLMCallRecord[]> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Initialize a new session
   */
  initSession(sessionId: string): void {
    if (!this.sessions.has(sessionId)) {
      const usage: TokenUsage = {
        sessionId,
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        estimatedCost: 0,
        llmCalls: []
      };
      this.sessions.set(sessionId, usage);
      this.callRecords.set(sessionId, []);
      this.saveToStorage();
    }
  }

  /**
   * Record an LLM call
   */
  recordLLMCall(
    sessionId: string,
    operation: string,
    model: string,
    promptTokens: number,
    completionTokens: number,
    durationMs: number,
    success: boolean = true,
    error?: string
  ): string {
    this.initSession(sessionId);

    const totalTokens = promptTokens + completionTokens;
    const cost = this.calculateCost(promptTokens, completionTokens);

    // Create call record
    const callRecord: LLMCallRecord = {
      id: `call-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date(),
      operation,
      model,
      promptTokens,
      completionTokens,
      totalTokens,
      cost,
      durationMs,
      success,
      error
    };

    // Add to call records
    const records = this.callRecords.get(sessionId)!;
    records.push(callRecord);

    // Update session totals
    const session = this.sessions.get(sessionId)!;
    session.totalTokens += totalTokens;
    session.promptTokens += promptTokens;
    session.completionTokens += completionTokens;
    session.estimatedCost += cost;
    session.llmCalls.push({
      timestamp: new Date(),
      operation,
      model,
      tokensUsed: totalTokens,
      promptTokens,
      completionTokens
    });

    this.saveToStorage();

    console.info(
      `[TOKEN_TRACKER] Recorded LLM call: ${operation} | ` +
      `Tokens: ${totalTokens} (${promptTokens} prompt + ${completionTokens} completion) | ` +
      `Cost: $${cost.toFixed(6)} | Duration: ${durationMs}ms`
    );

    return callRecord.id;
  }

  /**
   * Get session usage
   */
  getSessionUsage(sessionId: string): TokenUsage | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get all call records for a session
   */
  getSessionCallRecords(sessionId: string): LLMCallRecord[] {
    return this.callRecords.get(sessionId) || [];
  }

  /**
   * Calculate cost based on Gemini 2.0 Flash pricing
   */
  calculateCost(promptTokens: number, completionTokens: number): number {
    const promptCost = (promptTokens / 1000) * GEMINI_FLASH_PRICING.INPUT_PER_1K;
    const completionCost = (completionTokens / 1000) * GEMINI_FLASH_PRICING.OUTPUT_PER_1K;
    return promptCost + completionCost;
  }

  /**
   * Estimate tokens from text (uses gpt-tokenizer as approximation)
   * Note: This is an approximation for Gemini, actual tokens may vary
   */
  estimateTokens(text: string): number {
    try {
      const tokens = encode(text);
      return tokens.length;
    } catch (error) {
      // Fallback: rough approximation (1 token ≈ 4 characters)
      return Math.ceil(text.length / 4);
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string): {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    estimatedCost: number;
    callCount: number;
    averageTokensPerCall: number;
    totalDurationMs: number;
    successRate: number;
  } | null {
    const usage = this.sessions.get(sessionId);
    const records = this.callRecords.get(sessionId);

    if (!usage || !records) {
      return null;
    }

    const totalDurationMs = records.reduce((sum, r) => sum + r.durationMs, 0);
    const successCount = records.filter(r => r.success).length;

    return {
      totalTokens: usage.totalTokens,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      estimatedCost: usage.estimatedCost,
      callCount: records.length,
      averageTokensPerCall: records.length > 0 ? usage.totalTokens / records.length : 0,
      totalDurationMs,
      successRate: records.length > 0 ? successCount / records.length : 0
    };
  }

  /**
   * Get breakdown by operation type
   */
  getOperationBreakdown(sessionId: string): Array<{
    operation: string;
    calls: number;
    totalTokens: number;
    totalCost: number;
  }> {
    const records = this.callRecords.get(sessionId);
    if (!records) return [];

    const breakdown = new Map<string, {
      calls: number;
      totalTokens: number;
      totalCost: number;
    }>();

    records.forEach(record => {
      if (!breakdown.has(record.operation)) {
        breakdown.set(record.operation, {
          calls: 0,
          totalTokens: 0,
          totalCost: 0
        });
      }

      const stats = breakdown.get(record.operation)!;
      stats.calls++;
      stats.totalTokens += record.totalTokens;
      stats.totalCost += record.cost;
    });

    return Array.from(breakdown.entries()).map(([operation, stats]) => ({
      operation,
      ...stats
    }));
  }

  /**
   * Clear session data
   */
  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.callRecords.delete(sessionId);
    this.saveToStorage();
    console.info(`[TOKEN_TRACKER] Cleared session: ${sessionId}`);
  }

  /**
   * Clear all sessions
   */
  clearAll(): void {
    this.sessions.clear();
    this.callRecords.clear();
    this.saveToStorage();
    console.info('[TOKEN_TRACKER] Cleared all sessions');
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    try {
      // Convert Map to object for JSON serialization
      const sessionsObj = Object.fromEntries(
        Array.from(this.sessions.entries()).map(([key, value]) => [
          key,
          {
            ...value,
            llmCalls: value.llmCalls.map(call => ({
              ...call,
              timestamp: call.timestamp.toISOString()
            }))
          }
        ])
      );

      const recordsObj = Object.fromEntries(
        Array.from(this.callRecords.entries()).map(([key, value]) => [
          key,
          value.map(record => ({
            ...record,
            timestamp: record.timestamp.toISOString()
          }))
        ])
      );

      localStorage.setItem('resume-craft-pro-token-sessions', JSON.stringify(sessionsObj));
      localStorage.setItem('resume-craft-pro-token-records', JSON.stringify(recordsObj));
    } catch (error) {
      console.error('[TOKEN_TRACKER] Failed to save to localStorage:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const sessionsStr = localStorage.getItem('resume-craft-pro-token-sessions');
      const recordsStr = localStorage.getItem('resume-craft-pro-token-records');

      if (sessionsStr) {
        const sessionsObj = JSON.parse(sessionsStr);
        this.sessions = new Map(
          Object.entries(sessionsObj).map(([key, value]: [string, any]) => [
            key,
            {
              ...value,
              llmCalls: value.llmCalls.map((call: any) => ({
                ...call,
                timestamp: new Date(call.timestamp)
              }))
            }
          ])
        );
      }

      if (recordsStr) {
        const recordsObj = JSON.parse(recordsStr);
        this.callRecords = new Map(
          Object.entries(recordsObj).map(([key, value]) => [
            key,
            (value as any[]).map(record => ({
              ...record,
              timestamp: new Date(record.timestamp)
            }))
          ])
        );
      }

      console.info(`[TOKEN_TRACKER] Loaded ${this.sessions.size} sessions from localStorage`);
    } catch (error) {
      console.error('[TOKEN_TRACKER] Failed to load from localStorage:', error);
    }
  }

  /**
   * Export session data as JSON
   */
  exportSessionData(sessionId: string): string | null {
    const usage = this.sessions.get(sessionId);
    const records = this.callRecords.get(sessionId);

    if (!usage || !records) {
      return null;
    }

    return JSON.stringify({
      usage,
      records,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Get total cost across all sessions
   */
  getTotalCost(): number {
    let total = 0;
    this.sessions.forEach(session => {
      total += session.estimatedCost;
    });
    return total;
  }

  /**
   * Get active sessions
   */
  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }
}

// Global singleton instance
let trackerInstance: TokenTracker | null = null;

/**
 * Get or create global token tracker instance
 */
export function getTokenTracker(): TokenTracker {
  if (!trackerInstance) {
    trackerInstance = new TokenTracker();
  }
  return trackerInstance;
}

/**
 * Reset global token tracker instance (for testing)
 */
export function resetTokenTracker(): void {
  trackerInstance = null;
}
