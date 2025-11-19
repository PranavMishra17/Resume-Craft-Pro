/**
 * LaTeX Resume Parser with COMPLETE FORMAT PRESERVATION
 * Simplified parser that preserves formatting without AST parsing
 */

import type {
  Resume,
  ResumeParseResult,
  LatexFormattingMetadata,
  LatexPackage,
  ResumeSection,
  ResumeSectionItem,
  ResumeBullet,
  SectionFormatting,
  InlineFormatting,
  BulletFormatting,
  ResumeMetadata,
} from '@/types/resume';

/**
 * Main parsing function: LaTeX source → Resume with complete formatting
 */
export async function parseLatexToResume(
  latexSource: string,
  fileName: string
): Promise<ResumeParseResult> {
  try {
    console.log('[LATEX-PARSER] Starting LaTeX parsing...');

    // Extract complete formatting metadata FIRST (priority)
    const latexFormatting = extractLatexFormattingSimple(latexSource);

    // Extract contact metadata
    const metadata = extractMetadataSimple(latexSource);

    // Extract sections with content and formatting
    const sections = await extractSectionsSimple(latexSource);

    const resume: Resume = {
      id: crypto.randomUUID(),
      sourceFormat: 'latex',
      fileName,
      metadata,
      sections,
      rawSource: latexSource,
      latexFormatting,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('[LATEX-PARSER] Parsing complete:', {
      sectionsFound: sections.length,
      packagesFound: latexFormatting.packages.length,
    });

    return {
      success: true,
      resume,
      warnings: [],
    };
  } catch (error) {
    console.error('[LATEX-PARSER] Parsing failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown parsing error',
    };
  }
}

/**
 * CRITICAL: Extract ALL LaTeX formatting metadata using regex (simplified)
 */
function extractLatexFormattingSimple(
  source: string
): LatexFormattingMetadata {
  const packages: LatexPackage[] = [];
  const customCommands: Record<string, string> = {};
  const customEnvironments: Record<string, string> = {};
  const fontCommands: string[] = [];
  const colorCommands: Record<string, string> = {};
  const spacingCommands: string[] = [];
  const otherPreambleCommands: string[] = [];

  let documentClass = 'article';
  let documentClassOptions: string[] = [];
  let geometry: string | undefined;
  let preamble = '';

  // Extract preamble (everything before \begin{document})
  const beginDocMatch = source.match(/\\begin\{document\}/);
  if (beginDocMatch) {
    preamble = source.substring(0, beginDocMatch.index);
  }

  // Traverse AST to extract formatting
  const traverse = (node: any) => {
    if (!node) return;

    if (node.kind === 'command') {
      const cmdName = node.name;

      // Document class
      if (cmdName === 'documentclass') {
        if (node.args && node.args.length > 0) {
          // Extract options if present
          if (node.args[0].kind === 'arg.optional') {
            const optionsText = latexNodeToText(node.args[0]);
            documentClassOptions = optionsText.split(',').map((s) => s.trim());
          }
          // Extract class name
          const classArg = node.args.find((arg: any) => arg.kind === 'arg.group');
          if (classArg) {
            documentClass = latexNodeToText(classArg);
          }
        }
      }

      // Packages
      if (cmdName === 'usepackage') {
        const pkg: LatexPackage = { name: '', options: [] };

        if (node.args && node.args.length > 0) {
          // Extract options
          const optArg = node.args.find((arg: any) => arg.kind === 'arg.optional');
          if (optArg) {
            const optionsText = latexNodeToText(optArg);
            pkg.options = optionsText.split(',').map((s) => s.trim());
          }

          // Extract package name
          const nameArg = node.args.find((arg: any) => arg.kind === 'arg.group');
          if (nameArg) {
            pkg.name = latexNodeToText(nameArg);
          }
        }

        if (pkg.name) {
          packages.push(pkg);
        }
      }

      // Custom commands
      if (cmdName === 'newcommand' || cmdName === 'renewcommand') {
        if (node.args && node.args.length >= 2) {
          const nameArg = latexNodeToText(node.args[0]);
          const defArg = latexNodeToText(node.args[1]);
          customCommands[nameArg] = defArg;
        }
      }

      // Custom environments
      if (cmdName === 'newenvironment' || cmdName === 'renewenvironment') {
        if (node.args && node.args.length >= 3) {
          const nameArg = latexNodeToText(node.args[0]);
          const beginArg = latexNodeToText(node.args[1]);
          customEnvironments[nameArg] = beginArg;
        }
      }

      // Geometry
      if (cmdName === 'geometry') {
        if (node.args && node.args.length > 0) {
          geometry = latexNodeToText(node.args[0]);
        }
      }

      // Color definitions
      if (cmdName === 'definecolor') {
        if (node.args && node.args.length >= 3) {
          const colorName = latexNodeToText(node.args[0]);
          const colorDef = latexNodeToText(node.args[2]);
          colorCommands[colorName] = colorDef;
        }
      }

      // Font commands
      if (
        [
          'textbf',
          'textit',
          'underline',
          'emph',
          'textsc',
          'texttt',
          'textsf',
          'textrm',
        ].includes(cmdName)
      ) {
        if (!fontCommands.includes(cmdName)) {
          fontCommands.push(cmdName);
        }
      }

      // Spacing commands
      if (['vspace', 'hspace', 'smallskip', 'medskip', 'bigskip'].includes(cmdName)) {
        if (!spacingCommands.includes(cmdName)) {
          spacingCommands.push(cmdName);
        }
      }
    }

    // Traverse children
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
    if (node.args && Array.isArray(node.args)) {
      node.args.forEach(traverse);
    }
  };

  traverse(ast.content);

  return {
    documentClass,
    documentClassOptions,
    packages,
    customCommands,
    customEnvironments,
    preamble,
    fontCommands,
    colorCommands,
    spacingCommands,
    geometry,
    otherPreambleCommands,
  };
}

/**
 * Extract contact metadata from LaTeX
 */
function extractMetadata(ast: latexParser.LatexAst, source: string): ResumeMetadata {
  const metadata: ResumeMetadata = {
    name: '',
  };

  // Common LaTeX resume commands for metadata
  const metadataPatterns = {
    name: /\\name\{([^}]+)\}/,
    email: /\\email\{([^}]+)\}|\\href\{mailto:([^}]+)\}/,
    phone: /\\phone\{([^}]+)\}|\\mobile\{([^}]+)\}/,
    linkedin: /\\linkedin\{([^}]+)\}|linkedin\.com\/in\/([^}\s]+)/,
    github: /\\github\{([^}]+)\}|github\.com\/([^}\s]+)/,
    website: /\\homepage\{([^}]+)\}|\\url\{([^}]+)\}/,
    address: /\\address\{([^}]+)\}/,
  };

  // Extract using regex patterns
  for (const [key, pattern] of Object.entries(metadataPatterns)) {
    const match = source.match(pattern);
    if (match) {
      // Get the first non-null capture group
      const value = match[1] || match[2];
      if (value) {
        (metadata as any)[key] = value.trim();
      }
    }
  }

  return metadata;
}

/**
 * Extract sections with complete formatting preservation
 */
async function extractSections(
  ast: latexParser.LatexAst,
  source: string
): Promise<ResumeSection[]> {
  const sections: ResumeSection[] = [];
  const lines = source.split('\n');

  // Find section commands in AST
  const findSections = (node: any, depth: number = 0): void => {
    if (!node) return;

    if (node.kind === 'command') {
      const cmdName = node.name;

      // Section commands
      if (['section', 'subsection', 'subsubsection'].includes(cmdName)) {
        if (node.args && node.args.length > 0) {
          const titleArg = node.args.find((arg: any) => arg.kind === 'arg.group');
          if (titleArg) {
            const title = latexNodeToText(titleArg);

            const section: ResumeSection = {
              id: crypto.randomUUID(),
              type: classifySectionType(title), // Will implement classification
              title,
              locked: false,
              formatting: {
                latexCommand: `\\${cmdName}`,
              },
              items: [],
            };

            sections.push(section);
          }
        }
      }
    }

    // Traverse children
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach((child: any) => findSections(child, depth + 1));
    }
    if (node.args && Array.isArray(node.args)) {
      node.args.forEach((child: any) => findSections(child, depth + 1));
    }
  };

  findSections(ast.content);

  // Extract items and bullets for each section
  for (const section of sections) {
    section.items = await extractSectionItems(ast, source, section.title);
  }

  return sections;
}

/**
 * Extract items (jobs, education entries) from a section
 */
async function extractSectionItems(
  ast: latexParser.LatexAst,
  source: string,
  sectionTitle: string
): Promise<ResumeSectionItem[]> {
  const items: ResumeSectionItem[] = [];

  // Find itemize/enumerate environments after this section
  const findItems = (node: any): void => {
    if (!node) return;

    if (node.kind === 'env') {
      if (node.name === 'itemize' || node.name === 'enumerate') {
        // Extract bullets from this environment
        const bullets = extractBullets(node);

        if (bullets.length > 0) {
          const item: ResumeSectionItem = {
            id: crypto.randomUUID(),
            bullets,
            editable: true,
          };
          items.push(item);
        }
      }
    }

    // Traverse children
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(findItems);
    }
  };

  findItems(ast.content);

  return items;
}

/**
 * Extract bullets from itemize/enumerate environment
 */
function extractBullets(envNode: any): ResumeBullet[] {
  const bullets: ResumeBullet[] = [];

  const traverse = (node: any, level: number = 0): void => {
    if (!node) return;

    if (node.kind === 'command' && node.name === 'item') {
      // Extract bullet text
      let text = '';
      if (node.args && node.args.length > 0) {
        text = node.args.map((arg: any) => latexNodeToText(arg)).join(' ');
      }

      // Get text after \item
      if (node.content && Array.isArray(node.content)) {
        text += ' ' + node.content.map((n: any) => latexNodeToText(n)).join(' ');
      }

      text = text.trim();

      if (text) {
        const bullet: ResumeBullet = {
          id: crypto.randomUUID(),
          text,
          optimized: false,
          formatting: {
            level,
            indent: level * 20,
            latexItemCommand: '\\item',
          },
        };
        bullets.push(bullet);
      }
    }

    // Handle nested itemize
    if (node.kind === 'env' && (node.name === 'itemize' || node.name === 'enumerate')) {
      if (node.content && Array.isArray(node.content)) {
        node.content.forEach((child: any) => traverse(child, level + 1));
      }
    }

    // Traverse other children
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach((child: any) => traverse(child, level));
    }
  };

  if (envNode.content && Array.isArray(envNode.content)) {
    envNode.content.forEach((child: any) => traverse(child, 0));
  }

  return bullets;
}

/**
 * Convert LaTeX AST node to plain text
 */
function latexNodeToText(node: any): string {
  if (!node) return '';

  if (typeof node === 'string') return node;

  if (node.kind === 'text.string') {
    return node.content || '';
  }

  if (node.kind === 'arg.group' || node.kind === 'arg.optional') {
    if (node.content && Array.isArray(node.content)) {
      return node.content.map(latexNodeToText).join('');
    }
  }

  if (node.kind === 'command') {
    // For commands, return their arguments
    if (node.args && Array.isArray(node.args)) {
      return node.args.map(latexNodeToText).join(' ');
    }
  }

  if (node.content) {
    if (Array.isArray(node.content)) {
      return node.content.map(latexNodeToText).join('');
    }
    if (typeof node.content === 'string') {
      return node.content;
    }
  }

  return '';
}

/**
 * Basic section type classification (will be enhanced with LLM)
 */
function classifySectionType(title: string): any {
  const titleLower = title.toLowerCase();

  if (titleLower.includes('experience') || titleLower.includes('work')) {
    return 'experience';
  }
  if (titleLower.includes('education')) {
    return 'education';
  }
  if (titleLower.includes('skill')) {
    return 'skills';
  }
  if (titleLower.includes('project')) {
    return 'projects';
  }
  if (titleLower.includes('certification')) {
    return 'certifications';
  }
  if (titleLower.includes('award') || titleLower.includes('honor')) {
    return 'awards';
  }
  if (titleLower.includes('publication')) {
    return 'publications';
  }
  if (titleLower.includes('summary') || titleLower.includes('objective')) {
    return 'summary';
  }

  return 'custom';
}

/**
 * Reconstruct LaTeX source from Resume object (for export)
 */
export function reconstructLatex(resume: Resume): string {
  if (!resume.latexFormatting) {
    throw new Error('Cannot reconstruct LaTeX: missing formatting metadata');
  }

  const { latexFormatting } = resume;
  let latex = '';

  // Reconstruct preamble
  latex += latexFormatting.preamble + '\n\n';

  // Begin document
  latex += '\\begin{document}\n\n';

  // Add metadata if present
  if (resume.metadata.name) {
    latex += `\\name{${resume.metadata.name}}\n`;
  }
  if (resume.metadata.email) {
    latex += `\\email{${resume.metadata.email}}\n`;
  }
  if (resume.metadata.phone) {
    latex += `\\phone{${resume.metadata.phone}}\n`;
  }

  latex += '\n';

  // Reconstruct sections
  for (const section of resume.sections) {
    const cmd = section.formatting?.latexCommand || '\\section';
    latex += `${cmd}{${section.title}}\n\n`;

    for (const item of section.items) {
      if (item.bullets.length > 0) {
        latex += '\\begin{itemize}\n';
        for (const bullet of item.bullets) {
          const itemCmd = bullet.formatting?.latexItemCommand || '\\item';
          latex += `  ${itemCmd} ${bullet.text}\n`;
        }
        latex += '\\end{itemize}\n\n';
      }
    }
  }

  // End document
  latex += '\\end{document}\n';

  return latex;
}
