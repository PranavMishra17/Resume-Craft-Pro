/**
 * Placeholder Detection System
 *
 * Detects placeholders across multiple document formats:
 * - PDF: <ClientName>, [DateOfSignature], {{#ItemName}}, [[EmployeeSignature]]
 * - DOCX: {PartyName}, ${LawyerName}, <<GoverningLaw>>, %{CompanyRep}%
 * - Markdown: <FirstName>, {{LastName}}, ${Address}}, [Date], [[CaseNumber]]
 *
 * IMPORTANT: These patterns can appear in ANY format, not just their "native" format
 */

export interface PlaceholderMatch {
  text: string;           // The full placeholder text including delimiters
  name: string;           // The placeholder name without delimiters
  startIndex: number;     // Start position in the line
  endIndex: number;       // End position in the line
  pattern: string;        // Which pattern matched (e.g., 'angle-brackets', 'double-curly')
}

export interface PlaceholderDetectionResult {
  hasPlaceholders: boolean;
  placeholders: PlaceholderMatch[];
  originalText: string;
}

/**
 * Comprehensive placeholder patterns
 * Each pattern has a regex and a name for tracking
 * IMPORTANT: Allow spaces, lowercase, and various placeholder formats found in real documents
 */
const PLACEHOLDER_PATTERNS = [
  // Blank placeholders with underscores: [_____________], $[_____________]
  {
    name: 'blank-underscore',
    regex: /\$?\[_{3,}\]/g,
    description: 'Blank placeholders with underscores (3 or more)'
  },

  // Lowercase single square brackets: [name], [title], [address]
  {
    name: 'lowercase-square',
    regex: /\[([a-z][a-z0-9\s]*)\]/g,
    description: 'Lowercase square brackets'
  },

  // Angle brackets: <Client Name>, <First Name>
  {
    name: 'angle-brackets',
    regex: /<([A-Z][a-zA-Z0-9_\s]+)>/g,
    description: 'Angle brackets with capitalized name (allows spaces)'
  },

  // Single square brackets: [Date of Signature], [Company Name], [Date]
  {
    name: 'single-square',
    regex: /\[([A-Z][a-zA-Z0-9_\s]+)\]/g,
    description: 'Single square brackets with capitalized name (allows spaces)'
  },

  // Double square brackets: [[Employee Signature]], [[Case Number]]
  {
    name: 'double-square',
    regex: /\[\[([A-Z][a-zA-Z0-9_\s]+)\]\]/g,
    description: 'Double square brackets with capitalized name (allows spaces)'
  },

  // Single curly braces: {Party Name}
  {
    name: 'single-curly',
    regex: /\{([A-Z][a-zA-Z0-9_\s]+)\}/g,
    description: 'Single curly braces with capitalized name (allows spaces)'
  },

  // Double curly braces: {{Last Name}}, {{#Item Name}}
  {
    name: 'double-curly',
    regex: /\{\{#?([A-Z][a-zA-Z0-9_\s]+)\}\}/g,
    description: 'Double curly braces with optional # prefix (allows spaces)'
  },

  // Dollar sign with curly braces: ${Lawyer Name}, ${Address}
  {
    name: 'dollar-curly',
    regex: /\$\{([A-Z][a-zA-Z0-9_\s]+)\}/g,
    description: 'Dollar sign with curly braces (allows spaces)'
  },

  // Double angle brackets: <<Governing Law>>
  {
    name: 'double-angle',
    regex: /<<([A-Z][a-zA-Z0-9_\s]+)>>/g,
    description: 'Double angle brackets (allows spaces)'
  },

  // Percent with curly braces: %{Company Rep}%
  {
    name: 'percent-curly',
    regex: /%\{([A-Z][a-zA-Z0-9_\s]+)\}%/g,
    description: 'Percent signs with curly braces (allows spaces)'
  }
];

/**
 * Detect placeholders in a single line of text
 *
 * @param text - The line text to analyze
 * @returns Detection result with all found placeholders
 */
export function detectPlaceholders(text: string): PlaceholderDetectionResult {
  const placeholders: PlaceholderMatch[] = [];
  const seenMatches = new Set<string>(); // Avoid duplicates from overlapping patterns

  // Try each pattern
  for (const pattern of PLACEHOLDER_PATTERNS) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let match;

    while ((match = regex.exec(text)) !== null) {
      const fullMatch = match[0];
      const name = match[1];
      const startIndex = match.index;
      const endIndex = match.index + fullMatch.length;

      // Create unique key to avoid duplicates
      const key = `${startIndex}-${endIndex}-${fullMatch}`;

      if (!seenMatches.has(key)) {
        seenMatches.add(key);

        placeholders.push({
          text: fullMatch,
          name: name,
          startIndex: startIndex,
          endIndex: endIndex,
          pattern: pattern.name
        });
      }
    }
  }

  // Sort by start index for consistent ordering
  placeholders.sort((a, b) => a.startIndex - b.startIndex);

  return {
    hasPlaceholders: placeholders.length > 0,
    placeholders: placeholders,
    originalText: text
  };
}

/**
 * Check if a line contains any placeholder patterns
 * Returns true if the line contains at least one detected placeholder
 *
 * @param text - The line text to analyze
 * @returns true if this line contains any placeholders
 */
export function isPlaceholderLine(text: string): boolean {
  const detection = detectPlaceholders(text);
  return detection.hasPlaceholders;
}

/**
 * Batch detect placeholders across multiple lines
 * Useful for analyzing entire documents
 *
 * @param lines - Array of line texts
 * @returns Array of detection results matching input order
 */
export function detectPlaceholdersInLines(lines: string[]): PlaceholderDetectionResult[] {
  return lines.map(line => detectPlaceholders(line));
}

/**
 * Get statistics about placeholders in a document
 *
 * @param lines - Array of line texts
 * @returns Statistics object
 */
export function getPlaceholderStats(lines: string[]): {
  totalLines: number;
  linesWithPlaceholders: number;
  totalPlaceholders: number;
  uniquePlaceholders: Set<string>;
  placeholdersByPattern: Record<string, number>;
} {
  const detections = detectPlaceholdersInLines(lines);
  const uniquePlaceholders = new Set<string>();
  const placeholdersByPattern: Record<string, number> = {};
  let totalPlaceholders = 0;
  let linesWithPlaceholders = 0;

  for (const detection of detections) {
    if (detection.hasPlaceholders) {
      linesWithPlaceholders++;

      for (const placeholder of detection.placeholders) {
        totalPlaceholders++;
        uniquePlaceholders.add(placeholder.name);

        placeholdersByPattern[placeholder.pattern] =
          (placeholdersByPattern[placeholder.pattern] || 0) + 1;
      }
    }
  }

  return {
    totalLines: lines.length,
    linesWithPlaceholders,
    totalPlaceholders,
    uniquePlaceholders,
    placeholdersByPattern
  };
}
