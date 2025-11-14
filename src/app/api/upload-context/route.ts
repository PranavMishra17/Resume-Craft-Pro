/**
 * Context File Upload API
 *
 * Handle file uploads for:
 * - Resume (.tex, .docx, .pdf)
 * - Projects (.txt, .md, .pdf, .docx)
 * - Portfolio (.txt, .md, .pdf, .docx)
 * - Job Description (.txt)
 *
 * With file size validation and parsing
 */

import { NextRequest, NextResponse } from 'next/server';
import { ContextFile, FileSizeConfig } from '@/lib/parsers/types';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// File size limits (in bytes)
const FILE_SIZE_LIMITS: FileSizeConfig = {
  maxResumeSize: 2 * 1024 * 1024,      // 2MB
  maxProjectsSize: 2 * 1024 * 1024,    // 2MB
  maxPortfolioSize: 2 * 1024 * 1024,   // 2MB
  maxJDSize: 1 * 1024 * 1024,          // 1MB
  totalMaxSize: 8 * 1024 * 1024        // 8MB
};

/**
 * POST /api/upload-context
 *
 * Upload and parse context files
 */
export async function POST(request: NextRequest) {
  try {
    console.info('[UPLOAD_API] Processing file uploads');

    // Parse multipart form data
    const formData = await request.formData();

    const uploadedFiles: ContextFile[] = [];
    let totalSize = 0;
    const warnings: string[] = [];

    // Process each file
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        const file = value;
        const fileType = determineFileType(key);

        console.info(`[UPLOAD_API] Processing ${fileType} file: ${file.name} (${file.size} bytes)`);

        // Validate file size
        const sizeLimit = getSizeLimit(fileType);
        if (file.size > sizeLimit) {
          warnings.push(
            `${file.name} exceeds size limit (${formatBytes(file.size)} > ${formatBytes(sizeLimit)})`
          );
          continue;
        }

        totalSize += file.size;

        // Check total size
        if (totalSize > FILE_SIZE_LIMITS.totalMaxSize) {
          return NextResponse.json(
            {
              error: 'Total file size exceeds limit',
              details: `Total size: ${formatBytes(totalSize)}, Limit: ${formatBytes(FILE_SIZE_LIMITS.totalMaxSize)}`
            },
            { status: 400 }
          );
        }

        // Parse file content
        let content: string;
        try {
          content = await parseFile(file);
        } catch (error) {
          console.error(`[UPLOAD_API] Failed to parse ${file.name}:`, error);
          warnings.push(`Failed to parse ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          continue;
        }

        // Create context file
        const contextFile: ContextFile = {
          id: `${fileType}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          type: fileType,
          fileName: file.name,
          fileSize: file.size,
          content,
          uploadedAt: new Date()
        };

        uploadedFiles.push(contextFile);
        console.info(`[UPLOAD_API] Successfully processed ${file.name}`);
      }
    }

    console.info(`[UPLOAD_API] Uploaded ${uploadedFiles.length} files, total size: ${formatBytes(totalSize)}`);

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      totalSize,
      warnings: warnings.length > 0 ? warnings : undefined
    });

  } catch (error) {
    console.error('[UPLOAD_API] Unexpected error:', error);

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
 * Determine file type from form field name
 */
function determineFileType(fieldName: string): ContextFile['type'] {
  const name = fieldName.toLowerCase();

  if (name.includes('resume')) return 'resume';
  if (name.includes('project')) return 'projects';
  if (name.includes('portfolio')) return 'portfolio';
  if (name.includes('job') || name.includes('jd')) return 'job_description';

  // Default based on field name
  return 'portfolio';
}

/**
 * Get size limit for file type
 */
function getSizeLimit(fileType: ContextFile['type']): number {
  switch (fileType) {
    case 'resume':
      return FILE_SIZE_LIMITS.maxResumeSize;
    case 'projects':
      return FILE_SIZE_LIMITS.maxProjectsSize;
    case 'portfolio':
      return FILE_SIZE_LIMITS.maxPortfolioSize;
    case 'job_description':
      return FILE_SIZE_LIMITS.maxJDSize;
    default:
      return FILE_SIZE_LIMITS.maxPortfolioSize;
  }
}

/**
 * Parse file based on extension
 */
async function parseFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'txt':
    case 'tex':
    case 'md':
      return await file.text();

    case 'docx':
      return await parseDocx(file);

    case 'pdf':
      return await parsePdf(file);

    default:
      // Try parsing as text
      return await file.text();
  }
}

/**
 * Parse DOCX file
 */
async function parseDocx(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });

    if (result.messages.length > 0) {
      console.warn('[UPLOAD_API] DOCX parsing warnings:', result.messages);
    }

    return result.value;
  } catch (error) {
    console.error('[UPLOAD_API] DOCX parsing error:', error);
    throw new Error(`Failed to parse DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse PDF file
 */
async function parsePdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const data = await pdfParse(buffer);

    return data.text;
  } catch (error) {
    console.error('[UPLOAD_API] PDF parsing error:', error);
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * GET /api/upload-context
 * Return file size limits
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'context-file-upload',
    limits: {
      resume: formatBytes(FILE_SIZE_LIMITS.maxResumeSize),
      projects: formatBytes(FILE_SIZE_LIMITS.maxProjectsSize),
      portfolio: formatBytes(FILE_SIZE_LIMITS.maxPortfolioSize),
      jobDescription: formatBytes(FILE_SIZE_LIMITS.maxJDSize),
      total: formatBytes(FILE_SIZE_LIMITS.totalMaxSize)
    }
  });
}
