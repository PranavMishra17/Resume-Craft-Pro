/**
 * Core type definitions for the document editor
 */

export interface LineFormatting {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  fontFamily?: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  color?: string;
  backgroundColor?: string;
}

export interface Line {
  lineNumber: number;
  text: string;
  pageNumber: number;
  isLocked: boolean;
  isPlaceholder: boolean;
  formatting?: LineFormatting;
  placeholderNames?: string[]; // Names of detected placeholders in this line
}

export interface DocumentMetadata {
  totalLines: number;
  totalPages: number;
  format: 'docx' | 'pdf' | 'markdown';
  fileName?: string;
  fileSize?: number;
  uploadedAt?: Date;
}

export interface Document {
  id: string;
  lines: Line[];
  metadata: DocumentMetadata;
}

export interface Citation {
  type: 'line' | 'page' | 'range';
  reference: string;
  lineNumbers: number[];
  resolvedContent: string;
}

export interface Action {
  type: 'search' | 'read' | 'edit';
  success: boolean;
  details: any;
  timestamp?: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  citations?: Citation[];
  actions?: Action[];
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  documentId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export type DocumentFormat = 'docx' | 'pdf' | 'markdown';

export interface ParseResult {
  document: Document;
  error?: string;
}

export interface ToolCall {
  name: string;
  parameters: any;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Tool-specific types
export interface SearchParams {
  query: string;
  limit?: number;
}

export interface SearchResult {
  lineNumber: number;
  text: string;
  score: number;
}

export interface ReadParams {
  lines: number[];
}

export interface ReadResult {
  lines: Line[];
}

export interface EditParams {
  operation: 'replace' | 'insert' | 'delete';
  lines: number[];
  newText?: string;
}

export interface EditResult {
  success: boolean;
  modifiedLines: number[];
  error?: string;
}

// Edit tracking for format-preserving export
export interface LineEdit {
  lineNumber: number;
  originalText: string;
  newText: string;
  timestamp: Date;
  operation: 'replace' | 'insert' | 'delete';
}

export interface EditHistory {
  edits: LineEdit[];
  documentId: string;
}

// Original document storage
export interface OriginalDocument {
  documentId: string;
  fileBuffer: ArrayBuffer;
  fileName: string;
  format: 'docx' | 'pdf' | 'markdown';
  uploadedAt: Date;
}

// Extended document with edit tracking
export interface DocumentWithHistory extends Document {
  editHistory: EditHistory;
  originalFileId?: string;
}

// ============================================
// RESUME OPTIMIZATION TYPES
// ============================================

/**
 * Resume-specific line extension
 * Extends the base Line interface with resume-specific properties
 */
export interface ResumeLine extends Line {
  isEditable: boolean;        // Can be optimized (bullet points, descriptions)
  isStructural: boolean;      // Titles, positions, dates - DO NOT edit
  sectionType?: 'experience' | 'education' | 'skills' | 'projects' | 'summary' | 'other';
  bulletLevel?: number;       // Indentation level for nested bullets (0 = no bullet, 1+ = nested)
  keywords?: string[];        // Detected keywords in this line
}

/**
 * Resume section structure
 */
export interface ResumeSection {
  type: 'experience' | 'education' | 'skills' | 'projects' | 'summary' | 'other';
  title: string;              // Section header text
  startLine: number;
  endLine: number;
  content: ResumeLine[];
  keywords?: string[];        // Aggregated keywords from all lines in section
}

/**
 * Resume document with structure detection
 */
export interface Resume extends Document {
  sections: ResumeSection[];
  detectedKeywords: string[];
  format: 'latex' | 'docx' | 'pdf' | 'markdown';
  latexSource?: string;       // Original LaTeX source if applicable
  lines: ResumeLine[];        // Override to use ResumeLine instead of Line
}

/**
 * Context file for resume optimization
 */
export interface ContextFile {
  id: string;
  type: 'resume' | 'projects' | 'portfolio' | 'job_description';
  fileName: string;
  fileSize: number;
  content: string;            // Parsed text content
  uploadedAt: Date;
}

/**
 * Complete optimization context
 */
export interface OptimizationContext {
  resume: Resume;
  projects?: ContextFile;
  portfolio?: ContextFile;
  jobDescription?: ContextFile;
  customInstructions?: string;
}

/**
 * Keyword analysis results
 */
export interface KeywordAnalysis {
  jdKeywords: string[];                    // From job description
  resumeKeywords: string[];                // Currently in resume
  missingKeywords: string[];               // Need to add
  keywordFrequency: Map<string, number>;   // keyword -> count in resume
  coverage: number;                        // Percentage (0-100)
}

/**
 * Keyword mapping to specific lines
 */
export interface KeywordMapping {
  keyword: string;
  targetLines: number[];      // Line numbers where keyword should be added
  contextScore: number;       // Relevance score (0-1)
}

/**
 * Single bullet optimization result
 */
export interface BulletOptimization {
  lineNumber: number;
  originalText: string;
  optimizedText: string;
  addedKeywords: string[];
  removedKeywords?: string[];
  tokensUsed: number;
  confidence: number;         // 0-1, how confident the optimization is
  timestamp: Date;
}

/**
 * Full resume optimization result
 */
export interface ResumeOptimizationResult {
  optimizedResume: Resume;
  changes: BulletOptimization[];
  keywordAnalysis: KeywordAnalysis;
  totalTokensUsed: number;
  processingTimeMs: number;
  success: boolean;
  error?: string;
}

/**
 * Token usage tracking per session
 */
export interface TokenUsage {
  sessionId: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  estimatedCost: number;      // In USD
  llmCalls: Array<{
    timestamp: Date;
    operation: string;
    model: string;
    tokensUsed: number;
    promptTokens: number;
    completionTokens: number;
  }>;
}

/**
 * LLM call record for tracking
 */
export interface LLMCallRecord {
  id: string;
  timestamp: Date;
  operation: string;          // 'keyword_extraction', 'bullet_optimization', etc.
  model: string;              // 'gemini-2.0-flash-exp'
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  durationMs: number;
  success: boolean;
  error?: string;
}

/**
 * Optimization configuration
 */
export interface OptimizationConfig {
  mode: 'full' | 'targeted';  // full = all bullets, targeted = gaps only
  maxConcurrentCalls: number; // For parallel optimization (default: 5)
  preserveLength: boolean;    // Keep bullet length approximately same
  maintainTone: boolean;      // Maintain professional tone
  maxKeywordsPerBullet: number; // Default: 2-3
  minConfidenceScore: number; // Minimum confidence to accept optimization (0-1)
}

/**
 * Resume optimization request
 */
export interface OptimizeResumeRequest {
  resume: Resume;
  jobDescription: string;
  projects?: string;
  portfolio?: string;
  customInstructions?: string;
  config: OptimizationConfig;
  sessionId: string;
}

/**
 * LaTeX parsing result with structure
 */
export interface ParsedLaTeX {
  source: string;             // Original LaTeX source
  lines: ResumeLine[];
  sections: ResumeSection[];
  commands: Array<{           // LaTeX commands found
    command: string;
    lineNumber: number;
    args: string[];
  }>;
  preamble: string;           // Everything before \begin{document}
  body: string;               // Content between \begin{document} and \end{document}
  documentClass: string;      // e.g., 'article', 'resume', etc.
}

/**
 * File size limits and validation
 */
export interface FileSizeConfig {
  maxResumeSize: number;      // In bytes (default: 5MB)
  maxProjectsSize: number;    // In bytes (default: 5MB)
  maxPortfolioSize: number;   // In bytes (default: 5MB)
  maxJDSize: number;          // In bytes (default: 1MB)
  totalMaxSize: number;       // In bytes (default: 20MB)
}

/**
 * Resume metadata extended
 */
export interface ResumeMetadata extends DocumentMetadata {
  format: 'latex' | 'docx' | 'pdf' | 'markdown';
  sectionsDetected: number;
  bulletPointsCount: number;
  editableLinesCount: number;
  structuralLinesCount: number;
  keywordDensity: number;     // Keywords per 100 words
}

/**
 * Portfolio/Projects document
 */
export interface PortfolioDocument {
  id: string;
  content: string;
  projects: Array<{
    title: string;
    description: string;
    technologies: string[];
    keywords: string[];
    relevanceScore?: number;  // Calculated relevance to JD
  }>;
}
