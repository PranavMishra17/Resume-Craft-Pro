/**
 * Resume data structures with COMPLETE FORMAT PRESERVATION
 * Priority: Preserve original formatting at all costs
 */

/**
 * Complete resume structure with metadata, sections, and FORMAT-PRESERVING source
 */
export interface Resume {
  id: string;
  sourceFormat: 'latex' | 'docx';
  fileName: string;
  metadata: ResumeMetadata;
  sections: ResumeSection[];
  rawSource: string; // Original source (LaTeX or DOCX XML)

  // FORMAT PRESERVATION: LaTeX-specific
  latexFormatting?: LatexFormattingMetadata;

  // FORMAT PRESERVATION: DOCX-specific
  docxFormatting?: DocxFormattingMetadata;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Resume contact and personal information
 */
export interface ResumeMetadata {
  name: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

/**
 * CRITICAL: Complete LaTeX formatting preservation
 */
export interface LatexFormattingMetadata {
  // Document structure
  documentClass: string; // e.g., "article", "moderncv", "resume"
  documentClassOptions: string[]; // e.g., ["11pt", "a4paper", "sans"]

  // All packages with options
  packages: LatexPackage[];

  // Custom commands and environments
  customCommands: Record<string, string>; // \newcommand definitions
  customEnvironments: Record<string, string>; // \newenvironment definitions

  // Complete preamble (everything before \begin{document})
  preamble: string;

  // Formatting commands used in document
  fontCommands: string[]; // \textbf, \textit, \underline, etc.
  colorCommands: Record<string, string>; // \definecolor definitions
  spacingCommands: string[]; // \vspace, \hspace, etc.

  // Page layout
  geometry?: string; // \geometry{} settings
  margins?: { top?: string; bottom?: string; left?: string; right?: string };

  // Any other preamble commands
  otherPreambleCommands: string[];
}

export interface LatexPackage {
  name: string;
  options?: string[];
}

/**
 * CRITICAL: Complete DOCX formatting preservation
 */
export interface DocxFormattingMetadata {
  // Default document styles
  defaultFont: {
    family: string; // e.g., "Calibri", "Times New Roman"
    size: number; // in points
    color?: string; // hex color
  };

  // All custom styles used
  styles: DocxStyle[];

  // Hyperlink styling
  hyperlinkStyle?: {
    color: string;
    underline: boolean;
  };

  // Bullet and numbering styles
  bulletStyles: DocxBulletStyle[];

  // Page setup
  pageSetup: {
    width: number;
    height: number;
    margins: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    orientation: 'portrait' | 'landscape';
  };

  // Theme colors (if document uses theme)
  themeColors?: Record<string, string>;

  // Any embedded fonts
  embeddedFonts?: string[];
}

export interface DocxStyle {
  id: string;
  name: string;
  type: 'paragraph' | 'character' | 'table';
  basedOn?: string;
  font?: {
    family?: string;
    size?: number;
    color?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  };
  paragraph?: {
    alignment?: 'left' | 'center' | 'right' | 'justify';
    lineSpacing?: number;
    spaceBefore?: number;
    spaceAfter?: number;
    indent?: {
      left?: number;
      right?: number;
      firstLine?: number;
    };
  };
}

export interface DocxBulletStyle {
  id: string;
  level: number;
  symbol?: string; // bullet character
  font?: string;
  color?: string;
  indent: number;
}

/**
 * Resume section types
 */
export type ResumeSectionType =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'awards'
  | 'publications'
  | 'custom';

/**
 * Major resume section with title and FORMAT PRESERVATION
 */
export interface ResumeSection {
  id: string;
  type: ResumeSectionType;
  title: string;
  locked: boolean; // Lock headers/titles from AI editing

  // Source location
  startLine?: number;
  endLine?: number;

  // FORMAT PRESERVATION: Original formatting for this section
  formatting?: SectionFormatting;

  items: ResumeSectionItem[];
}

/**
 * Formatting for a specific section
 */
export interface SectionFormatting {
  // LaTeX: section commands used
  latexCommand?: string; // e.g., "\section", "\subsection"

  // DOCX: style applied
  docxStyleId?: string;

  // Visual formatting
  font?: {
    family?: string;
    size?: number;
    color?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  };

  alignment?: 'left' | 'center' | 'right' | 'justify';
  spaceBefore?: number;
  spaceAfter?: number;
}

/**
 * Individual entry within a section with FORMAT PRESERVATION
 */
export interface ResumeSectionItem {
  id: string;

  // Content
  title?: string; // Job title, degree, project name
  subtitle?: string; // Company, university
  date?: string; // Date range
  location?: string;
  bullets: ResumeBullet[];
  techStack?: string[]; // Detected keywords

  // Editing controls
  editable: boolean;

  // Source location
  startLine?: number;
  endLine?: number;

  // FORMAT PRESERVATION: Formatting for title/subtitle/date
  titleFormatting?: InlineFormatting;
  subtitleFormatting?: InlineFormatting;
  dateFormatting?: InlineFormatting;
  locationFormatting?: InlineFormatting;
}

/**
 * Inline text formatting
 */
export interface InlineFormatting {
  font?: {
    family?: string;
    size?: number;
    color?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  };

  // LaTeX commands used
  latexCommands?: string[]; // e.g., ["\textbf", "\textit"]

  // DOCX run properties
  docxRunProperties?: any; // DOCX run formatting XML

  // Hyperlink
  hyperlink?: {
    url: string;
    color?: string;
    underline?: boolean;
  };
}

/**
 * Individual bullet point with COMPLETE formatting
 */
export interface ResumeBullet {
  id: string;
  text: string;

  // Optimization metadata
  keywords?: string[];
  optimized: boolean;
  originalText?: string;

  // Source location
  lineNumber?: number;

  // FORMAT PRESERVATION: Bullet formatting
  formatting?: BulletFormatting;
}

/**
 * Complete bullet point formatting
 */
export interface BulletFormatting {
  // Bullet style
  bulletChar?: string; // e.g., "•", "-", "◦"
  bulletColor?: string;
  bulletFont?: string;

  // Indentation
  level: number; // nesting level (0 = top-level)
  indent: number; // in points or cm

  // Text formatting
  textFormatting?: InlineFormatting;

  // LaTeX: item command used
  latexItemCommand?: string; // e.g., "\item"

  // DOCX: numbering style
  docxNumberingId?: string;
  docxNumberingLevel?: number;
}

/**
 * Parse result from resume parsing
 */
export interface ResumeParseResult {
  success: boolean;
  resume?: Resume;
  error?: string;
  warnings?: string[];
}

/**
 * Export options for resume
 */
export interface ResumeExportOptions {
  format: 'latex' | 'docx' | 'pdf' | 'markdown';
  preserveFormatting: boolean; // MUST be true by default
  includeComments: boolean;
}

/**
 * LaTeX compilation result
 */
export interface LatexCompilationResult {
  success: boolean;
  pdfBlob?: Blob;
  pdfUrl?: string;
  error?: string;
  log?: string; // Full compilation log
}

/**
 * Resume reconstruction context (for export)
 * Contains all information needed to rebuild the original document
 */
export interface ResumeReconstructionContext {
  originalFormat: 'latex' | 'docx';

  // LaTeX reconstruction
  latexPreamble?: string;
  latexDocumentClass?: string;
  latexPackages?: LatexPackage[];

  // DOCX reconstruction
  docxTemplate?: ArrayBuffer; // Original DOCX as template
  docxStyles?: DocxStyle[];

  // Content mapping (line numbers to sections/items)
  lineMapping: Record<number, string>; // lineNumber -> sectionId/itemId
}
