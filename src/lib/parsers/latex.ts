/**
 * LaTeX Resume Parser
 *
 * Parse LaTeX resumes with structure detection and format preservation
 * - Identify sections (Experience, Education, Skills, Projects)
 * - Classify lines as editable (bullets) vs structural (titles, dates)
 * - Preserve LaTeX commands and formatting
 * - Extract preamble, document class, and body
 */

import { ParsedLaTeX, ResumeLine, ResumeSection, Resume, ResumeMetadata } from './types';

/**
 * Parse LaTeX resume
 */
export async function parseLatexResume(
  latexContent: string,
  fileName: string = 'resume.tex'
): Promise<Resume> {
  console.info('[LATEX_PARSER] Starting LaTeX resume parsing');

  // Extract LaTeX structure
  const parsed = parseLatexStructure(latexContent);

  // Detect resume sections
  const sections = detectResumeSections(parsed.lines);

  // Classify lines as editable vs structural
  const classifiedLines = classifyResumeLines(parsed.lines, sections);

  // Extract keywords from all lines
  const detectedKeywords = extractKeywordsFromLines(classifiedLines);

  // Build metadata
  const metadata: ResumeMetadata = {
    totalLines: classifiedLines.length,
    totalPages: Math.max(...classifiedLines.map(l => l.pageNumber), 1),
    format: 'latex' as const,
    fileName,
    fileSize: latexContent.length,
    uploadedAt: new Date(),
    sectionsDetected: sections.length,
    bulletPointsCount: classifiedLines.filter(l => l.bulletLevel && l.bulletLevel > 0).length,
    editableLinesCount: classifiedLines.filter(l => l.isEditable).length,
    structuralLinesCount: classifiedLines.filter(l => l.isStructural).length,
    keywordDensity: calculateKeywordDensity(detectedKeywords, classifiedLines)
  };

  const resume: Resume = {
    id: `resume-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    lines: classifiedLines,
    metadata,
    sections,
    detectedKeywords,
    format: 'latex',
    latexSource: latexContent
  };

  console.info(`[LATEX_PARSER] Parsed resume: ${sections.length} sections, ${classifiedLines.length} lines`);
  console.info(`[LATEX_PARSER] Editable: ${metadata.editableLinesCount}, Structural: ${metadata.structuralLinesCount}`);

  return resume;
}

/**
 * Parse LaTeX structure
 */
function parseLatexStructure(latexContent: string): ParsedLaTeX {
  // Extract preamble (everything before \begin{document})
  const beginDocMatch = latexContent.match(/\\begin\{document\}/);
  const beginDocIndex = beginDocMatch ? beginDocMatch.index : 0;

  const preamble = latexContent.substring(0, beginDocIndex!);
  const afterBegin = latexContent.substring(beginDocIndex! + '\\begin{document}'.length);

  // Extract body (between \begin{document} and \end{document})
  const endDocMatch = afterBegin.match(/\\end\{document\}/);
  const body = endDocMatch ? afterBegin.substring(0, endDocMatch.index) : afterBegin;

  // Extract document class
  const documentClassMatch = preamble.match(/\\documentclass(?:\[([^\]]*)\])?\{([^}]+)\}/);
  const documentClass = documentClassMatch ? documentClassMatch[2] : 'unknown';

  // Split into lines
  const bodyLines = body.split('\n');
  const lines: ResumeLine[] = [];
  let currentPage = 1;
  let lineNumber = 0;

  for (const rawLine of bodyLines) {
    const trimmed = rawLine.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('%')) {
      continue;
    }

    // Detect page breaks
    if (trimmed.includes('\\newpage') || trimmed.includes('\\clearpage')) {
      currentPage++;
      continue;
    }

    // Create line
    lineNumber++;
    const line: ResumeLine = {
      lineNumber,
      text: trimmed,
      pageNumber: currentPage,
      isLocked: false,
      isPlaceholder: false,
      isEditable: false,      // Will be set by classifier
      isStructural: false,    // Will be set by classifier
      formatting: extractFormatting(trimmed)
    };

    lines.push(line);
  }

  // Extract commands
  const commands = extractLatexCommands(latexContent);

  return {
    source: latexContent,
    lines,
    sections: [], // Will be populated by section detector
    commands,
    preamble,
    body,
    documentClass
  };
}

/**
 * Detect resume sections from lines
 */
function detectResumeSections(lines: ResumeLine[]): ResumeSection[] {
  const sections: ResumeSection[] = [];
  let currentSection: ResumeSection | null = null;

  // Common resume section headers (case-insensitive)
  const sectionPatterns = [
    { pattern: /\\section\*?\{.*?(experience|work).*?\}/i, type: 'experience' as const },
    { pattern: /\\section\*?\{.*?education.*?\}/i, type: 'education' as const },
    { pattern: /\\section\*?\{.*?skills?.*?\}/i, type: 'skills' as const },
    { pattern: /\\section\*?\{.*?(projects?|portfolio).*?\}/i, type: 'projects' as const },
    { pattern: /\\section\*?\{.*?(summary|objective|profile).*?\}/i, type: 'summary' as const },
  ];

  lines.forEach((line, idx) => {
    // Check if this line is a section header
    let isSectionHeader = false;
    let sectionType: ResumeSection['type'] = 'other';

    for (const { pattern, type } of sectionPatterns) {
      if (pattern.test(line.text)) {
        isSectionHeader = true;
        sectionType = type;
        break;
      }
    }

    // Generic \section detection
    if (!isSectionHeader && /\\section\*?\{/.test(line.text)) {
      isSectionHeader = true;
      sectionType = 'other';
    }

    if (isSectionHeader) {
      // Save previous section
      if (currentSection) {
        currentSection.endLine = idx;
        sections.push(currentSection);
      }

      // Extract section title
      const titleMatch = line.text.match(/\\section\*?\{([^}]+)\}/);
      const title = titleMatch ? titleMatch[1] : 'Unknown Section';

      // Create new section
      currentSection = {
        type: sectionType,
        title,
        startLine: idx + 1,
        endLine: lines.length,
        content: []
      };
    }
  });

  // Add last section
  if (currentSection) {
    sections.push(currentSection);
  }

  // Assign lines to sections
  sections.forEach(section => {
    section.content = lines.slice(section.startLine, section.endLine + 1) as ResumeLine[];
  });

  return sections;
}

/**
 * Classify lines as editable vs structural
 */
function classifyResumeLines(
  lines: ResumeLine[],
  sections: ResumeSection[]
): ResumeLine[] {
  return lines.map(line => {
    const text = line.text;

    // Detect bullet points (\item, \bull, etc.)
    const isBullet = /^\\item\s+/.test(text) || /^\\bull\s+/.test(text) || /^•/.test(text);

    // Detect structural elements
    const isTitle = /^\\textbf\{[^}]*\}/.test(text) && text.length < 100;
    const isDate = /\d{4}/.test(text) && text.length < 50; // Contains year and is short
    const isPosition = /\\textit\{[^}]*\}/.test(text) && !isBullet;
    const isCompany = /\\textbf\{[^}]*Company[^}]*\}/i.test(text);
    const isSectionHeader = /\\section\*?\{/.test(text);
    const isStructural = isTitle || isDate || isPosition || isCompany || isSectionHeader;

    // Determine bullet level
    let bulletLevel = 0;
    if (isBullet) {
      // Count indentation or nesting
      const indent = text.match(/^\s*/)?.[0].length || 0;
      bulletLevel = Math.floor(indent / 4) + 1; // 4 spaces = 1 level
    }

    // Get section type
    const sectionType = sections.find(
      s => line.lineNumber >= s.startLine && line.lineNumber <= s.endLine
    )?.type;

    // Classify as editable or structural
    const isEditable = isBullet && !isStructural;
    const isStructuralLine = isStructural || isSectionHeader;

    return {
      ...line,
      isEditable,
      isStructural: isStructuralLine,
      sectionType,
      bulletLevel
    };
  });
}

/**
 * Extract formatting from LaTeX
 */
function extractFormatting(text: string): ResumeLine['formatting'] {
  const formatting: ResumeLine['formatting'] = {};

  // Detect bold (\textbf, \bf)
  if (/\\textbf\{|\\bf\s+/.test(text)) {
    formatting.bold = true;
  }

  // Detect italic (\textit, \it, \emph)
  if (/\\textit\{|\\it\s+|\\emph\{/.test(text)) {
    formatting.italic = true;
  }

  // Detect underline (\underline)
  if (/\\underline\{/.test(text)) {
    formatting.underline = true;
  }

  // Detect font size commands
  const fontSizeMatch = text.match(/\\(tiny|small|normalsize|large|Large|LARGE|huge|Huge)/);
  if (fontSizeMatch) {
    const sizes: Record<string, number> = {
      tiny: 8, small: 10, normalsize: 12, large: 14,
      Large: 16, LARGE: 18, huge: 20, Huge: 24
    };
    formatting.fontSize = sizes[fontSizeMatch[1]] || 12;
  }

  return formatting;
}

/**
 * Extract LaTeX commands
 */
function extractLatexCommands(latexContent: string): Array<{
  command: string;
  lineNumber: number;
  args: string[];
}> {
  const commands: Array<{ command: string; lineNumber: number; args: string[] }> = [];
  const lines = latexContent.split('\n');

  lines.forEach((line, idx) => {
    // Match LaTeX commands
    const commandRegex = /\\([a-zA-Z]+)(?:\[([^\]]*)\])?\{([^}]*)\}/g;
    let match;

    while ((match = commandRegex.exec(line)) !== null) {
      commands.push({
        command: match[1],
        lineNumber: idx + 1,
        args: [match[2], match[3]].filter(Boolean)
      });
    }
  });

  return commands;
}

/**
 * Extract keywords from lines
 */
function extractKeywordsFromLines(lines: ResumeLine[]): string[] {
  const keywords = new Set<string>();

  lines.forEach(line => {
    // Extract technical keywords (all caps, tech terms)
    const words = line.text
      .replace(/\\[a-zA-Z]+\{?/g, '') // Remove LaTeX commands
      .split(/\s+/);

    words.forEach(word => {
      // All caps words (3+ letters)
      if (/^[A-Z]{3,}$/.test(word)) {
        keywords.add(word);
      }

      // Common tech terms (camelCase, kebab-case)
      if (/^[A-Z][a-z]+(?:[A-Z][a-z]+)+$/.test(word) || /[a-z]+-[a-z]+/i.test(word)) {
        keywords.add(word);
      }
    });
  });

  return Array.from(keywords);
}

/**
 * Calculate keyword density
 */
function calculateKeywordDensity(keywords: string[], lines: ResumeLine[]): number {
  const totalWords = lines.reduce((sum, line) => {
    const words = line.text.replace(/\\[a-zA-Z]+\{?/g, '').split(/\s+/).length;
    return sum + words;
  }, 0);

  return totalWords > 0 ? (keywords.length / totalWords) * 100 : 0;
}

/**
 * Apply edits to LaTeX source while preserving format
 */
export function applyEditsToLatex(
  originalLatex: string,
  edits: Array<{ lineNumber: number; newText: string }>
): string {
  const lines = originalLatex.split('\n');
  let bodyStartIndex = -1;
  let bodyEndIndex = -1;

  // Find document body boundaries
  lines.forEach((line, idx) => {
    if (line.includes('\\begin{document}')) {
      bodyStartIndex = idx + 1;
    }
    if (line.includes('\\end{document}')) {
      bodyEndIndex = idx;
    }
  });

  // Map line numbers to array indices (skip empty lines and comments)
  const lineNumberToIndex: Record<number, number> = {};
  let lineNumber = 0;

  for (let i = bodyStartIndex; i < bodyEndIndex; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed || trimmed.startsWith('%')) {
      continue;
    }
    lineNumber++;
    lineNumberToIndex[lineNumber] = i;
  }

  // Apply edits
  edits.forEach(edit => {
    const arrayIndex = lineNumberToIndex[edit.lineNumber];
    if (arrayIndex !== undefined) {
      lines[arrayIndex] = edit.newText;
    }
  });

  return lines.join('\n');
}

/**
 * Export resume to LaTeX
 */
export function exportToLatex(resume: Resume): string {
  if (resume.latexSource) {
    // Apply any edits to original source
    const edits = resume.lines.map(line => ({
      lineNumber: line.lineNumber,
      newText: line.text
    }));

    return applyEditsToLatex(resume.latexSource, edits);
  }

  // Generate new LaTeX document from scratch
  return generateLatexFromResume(resume);
}

/**
 * Generate LaTeX from resume structure
 */
function generateLatexFromResume(resume: Resume): string {
  let latex = `\\documentclass{article}
\\usepackage{geometry}
\\geometry{letterpaper, margin=0.75in}
\\usepackage{enumitem}
\\usepackage{hyperref}

\\begin{document}

`;

  // Generate sections
  resume.sections.forEach(section => {
    latex += `\\section{${section.title}}\n\n`;

    section.content.forEach(line => {
      if (line.bulletLevel && line.bulletLevel > 0) {
        latex += `\\item ${line.text}\n`;
      } else {
        latex += `${line.text}\n`;
      }
    });

    latex += '\n';
  });

  latex += '\\end{document}\n';

  return latex;
}
