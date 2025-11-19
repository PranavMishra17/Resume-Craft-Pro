/**
 * Simplified LaTeX Resume Parser (No AST parsing)
 * Just preserves the source and provides minimal structure for the editor
 */

import type {
  Resume,
  ResumeParseResult,
  LatexFormattingMetadata,
  LatexPackage,
} from '@/types/resume';

/**
 * Main parsing function: LaTeX source → Resume with source preservation
 */
export async function parseLatexToResume(
  latexSource: string,
  fileName: string
): Promise<ResumeParseResult> {
  try {
    console.log('[LATEX-PARSER-SIMPLE] Starting LaTeX parsing...');

    // Extract preamble
    const beginDocMatch = latexSource.match(/\\begin\{document\}/);
    const preamble = beginDocMatch ? latexSource.substring(0, beginDocMatch.index) : '';

    // Extract packages using regex
    const packages: LatexPackage[] = [];
    const packageRegex = /\\usepackage(?:\[([^\]]*)\])?\{([^}]+)\}/g;
    let match;
    while ((match = packageRegex.exec(preamble)) !== null) {
      packages.push({
        name: match[2],
        options: match[1] ? match[1].split(',').map(s => s.trim()) : [],
      });
    }

    // Extract document class
    const documentClassMatch = preamble.match(/\\documentclass(?:\[([^\]]*)\])?\{([^}]+)\}/);
    const documentClass = documentClassMatch ? documentClassMatch[2] : 'article';
    const documentClassOptions = documentClassMatch && documentClassMatch[1]
      ? documentClassMatch[1].split(',').map(s => s.trim())
      : [];

    const latexFormatting: LatexFormattingMetadata = {
      documentClass,
      documentClassOptions,
      packages,
      customCommands: {},
      customEnvironments: {},
      preamble,
      fontCommands: [],
      colorCommands: {},
      spacingCommands: [],
      otherPreambleCommands: [],
    };

    // Extract contact metadata (basic regex)
    const metadata = {
      name: extractLatexCommand(latexSource, 'name') || '',
      email: extractLatexCommand(latexSource, 'email'),
      phone: extractLatexCommand(latexSource, 'phone'),
      linkedin: extractLatexCommand(latexSource, 'linkedin'),
      github: extractLatexCommand(latexSource, 'github'),
      website: extractLatexCommand(latexSource, 'url') || extractLatexCommand(latexSource, 'homepage'),
    };

    const resume: Resume = {
      id: crypto.randomUUID(),
      sourceFormat: 'latex',
      fileName,
      metadata,
      sections: [], // Empty sections - editor will work with raw source
      rawSource: latexSource,
      latexFormatting,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('[LATEX-PARSER-SIMPLE] Parsing complete:', {
      packagesFound: packages.length,
      hasName: !!metadata.name,
    });

    return {
      success: true,
      resume,
      warnings: [],
    };
  } catch (error) {
    console.error('[LATEX-PARSER-SIMPLE] Parsing failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown parsing error',
    };
  }
}

/**
 * Helper: Extract LaTeX command content
 */
function extractLatexCommand(source: string, command: string): string | undefined {
  const regex = new RegExp(`\\\\${command}\\{([^}]+)\\}`, 'i');
  const match = source.match(regex);
  return match ? match[1] : undefined;
}
