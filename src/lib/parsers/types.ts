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
