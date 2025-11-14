# Resume-Craft-Pro - Architecture & Implementation Plan

## Executive Summary
Transform ClauseCraft (document editor) into **Resume-Craft-Pro** - an AI-powered resume optimization webapp with job description matching, keyword extraction, and format-preserving editing (LaTeX, DOCX).

---

## Core Transformations

### 1. **From Generic Document to Resume-Specific**

#### Current State:
- Generic line-by-line document editing
- Placeholder detection for legal documents
- Simple document viewer

#### Target State:
- **Resume structure detection**: Identify sections (Experience, Education, Skills, Projects)
- **Content classification**: Distinguish editable (bullet points, descriptions) from static (titles, positions, dates)
- **Resume-specific parsers**: Enhanced LaTeX parser, DOCX parser with resume structure awareness

### 2. **From Simple Chat to Agentic Resume Optimization**

#### Current State:
- Basic chat with document editing
- Single custom prompt field
- No context files

#### Target State:
- **Multi-file context system**: Resume + Projects + Portfolio + Job Description
- **File size limits**: 5MB per file, visual indicators
- **Custom instructions**: Role-specific optimization guidelines
- **Token tracking**: Real-time display of LLM usage per session

### 3. **From Placeholder Detection to Keyword Optimization**

#### Current State:
- LLM-powered placeholder detection ({{NAME}}, [COMPANY])
- Simple regex matching

#### Target State:
- **Job Description Analysis**: Extract technical keywords, skills, tech stack
- **Resume Analysis**: Current keyword coverage
- **Gap Analysis**: Missing keywords mapping
- **Portfolio Mining**: Find relevant projects with missing keywords
- **Parallel Optimization**: Multiple concurrent LLM calls per bullet point

---

## System Architecture

### A. Data Models

```typescript
// Resume-specific types (NEW)
interface ResumeSection {
  type: 'experience' | 'education' | 'skills' | 'projects' | 'summary' | 'other';
  title: string;
  startLine: number;
  endLine: number;
  content: ResumeLine[];
}

interface ResumeLine extends Line {
  isEditable: boolean;        // Can be optimized (bullet points, descriptions)
  isStructural: boolean;      // Titles, positions, dates - DO NOT edit
  sectionType: string;        // Which section this belongs to
  bulletLevel?: number;       // Indentation level for nested bullets
  keywords?: string[];        // Detected keywords in this line
}

interface Resume extends Document {
  sections: ResumeSection[];
  detectedKeywords: string[];
  format: 'latex' | 'docx' | 'pdf' | 'markdown';
  latexSource?: string;       // Original LaTeX source if applicable
}

// Context files
interface ContextFile {
  id: string;
  type: 'resume' | 'projects' | 'portfolio' | 'job_description';
  fileName: string;
  fileSize: number;
  content: string;            // Parsed text content
  uploadedAt: Date;
}

interface OptimizationContext {
  resume: Resume;
  projects?: ContextFile;
  portfolio?: ContextFile;
  jobDescription?: ContextFile;
  customInstructions?: string;
}

// Keyword analysis
interface KeywordAnalysis {
  jdKeywords: string[];                    // From job description
  resumeKeywords: string[];                // Currently in resume
  missingKeywords: string[];               // Need to add
  keywordMap: Map<string, string[]>;       // keyword -> potential bullet lines
}

// Optimization result
interface BulletOptimization {
  lineNumber: number;
  originalText: string;
  optimizedText: string;
  addedKeywords: string[];
  tokensUsed: number;
  confidence: number;
}

// Token tracking
interface TokenUsage {
  sessionId: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  llmCalls: Array<{
    timestamp: Date;
    operation: string;
    tokensUsed: number;
  }>;
}
```

### B. Core Modules

#### 1. **Resume Parser (`/lib/parsers/resume.ts`)**
```typescript
// NEW module
export class ResumeParser {
  // Detect resume structure
  parseResumeStructure(lines: Line[]): ResumeSection[]

  // Identify editable vs structural lines
  classifyLines(lines: Line[]): ResumeLine[]

  // Extract existing keywords
  extractKeywords(resume: Resume): string[]

  // Parse LaTeX resume specifically
  parseLatexResume(latexContent: string): Resume
}
```

#### 2. **Keyword Analyzer (`/lib/optimization/keyword-analyzer.ts`)**
```typescript
// NEW module
export class KeywordAnalyzer {
  // Extract keywords from job description
  async extractJDKeywords(jdContent: string): Promise<string[]>

  // Extract keywords from resume
  async extractResumeKeywords(resume: Resume): Promise<string[]>

  // Map missing keywords to potential bullet points
  async mapKeywordsToBullets(
    missingKeywords: string[],
    resume: Resume,
    portfolio?: string,
    projects?: string
  ): Promise<Map<number, string[]>>  // lineNumber -> keywords[]

  // Analyze keyword gaps
  analyzeKeywordGap(jd: string[], resume: string[]): KeywordAnalysis
}
```

#### 3. **Parallel Optimizer (`/lib/optimization/parallel-optimizer.ts`)**
```typescript
// NEW module - replaces single LLM call with parallel calls
export class ParallelOptimizer {
  // Optimize multiple bullets in parallel
  async optimizeBulletsParallel(
    bullets: Array<{ lineNumber: number, text: string, keywords: string[] }>,
    context: OptimizationContext,
    maxConcurrency: number = 5
  ): Promise<BulletOptimization[]>

  // Optimize single bullet
  async optimizeSingleBullet(
    lineNumber: number,
    originalText: string,
    targetKeywords: string[],
    context: OptimizationContext
  ): Promise<BulletOptimization>

  // Track tokens for all calls
  getTokenUsage(): TokenUsage
}
```

#### 4. **Token Tracker (`/lib/tracking/token-tracker.ts`)**
```typescript
// NEW module
export class TokenTracker {
  private sessionTokens: Map<string, TokenUsage>

  trackLLMCall(sessionId: string, operation: string, tokens: number): void
  getSessionUsage(sessionId: string): TokenUsage
  estimateTokens(text: string): number  // Rough estimation
}
```

#### 5. **Format Preservers**

**LaTeX Format Preserver (`/lib/export/latex-preserve.ts`)**
```typescript
// NEW module
export class LaTeXPreserver {
  // Parse LaTeX and maintain structure
  parseWithStructure(latexSource: string): ParsedLaTeX

  // Apply edits while preserving LaTeX commands
  applyEditsToLaTeX(
    originalLaTeX: string,
    edits: LineEdit[]
  ): string

  // Export to LaTeX
  exportToLaTeX(resume: Resume, edits: EditHistory): string
}
```

**DOCX Format Preserver (enhance existing)**
- Already have `docx-preserve.ts`, need to enhance for resume structure

---

## API Endpoints

### 1. **POST /api/optimize-resume** (NEW)
Full resume optimization with job description

```typescript
Request: {
  resume: Resume,
  jobDescription: string,
  projects?: string,
  portfolio?: string,
  customInstructions?: string,
  optimizationMode: 'full' | 'targeted',  // full = all bullets, targeted = gaps only
  sessionId: string
}

Response: {
  optimizedResume: Resume,
  changes: BulletOptimization[],
  keywordAnalysis: KeywordAnalysis,
  tokensUsed: number
}
```

### 2. **POST /api/analyze-keywords** (NEW)
Analyze keywords without optimization

```typescript
Request: {
  resume: Resume,
  jobDescription: string
}

Response: {
  analysis: KeywordAnalysis,
  suggestions: string[],
  coverage: number  // percentage
}
```

### 3. **POST /api/upload-context** (NEW)
Upload context files (projects, portfolio)

```typescript
Request: FormData with files

Response: {
  files: ContextFile[],
  totalSize: number,
  warnings?: string[]  // if size limits exceeded
}
```

### 4. **Enhance /api/chat**
Add context files support
Add token tracking
Return token usage in response

---

## UI Components

### 1. **Context File Manager** (NEW)
```
┌─────────────────────────────────────┐
│ Context Files                       │
├─────────────────────────────────────┤
│ 📄 Resume.pdf         [2.1MB] [✓]  │
│ 📁 Projects.docx      [1.5MB] [✓]  │
│ 📂 Portfolio.pdf      [3.2MB] [✓]  │
│ 📋 Job_Description.txt [12KB] [✓]  │
├─────────────────────────────────────┤
│ Total: 6.8MB / 20MB limit          │
│ [+ Upload File]                     │
└─────────────────────────────────────┘
```

### 2. **Keyword Analysis Panel** (NEW)
```
┌─────────────────────────────────────┐
│ Keyword Analysis                    │
├─────────────────────────────────────┤
│ JD Keywords: 25 identified          │
│ Resume Coverage: 18/25 (72%)       │
│                                     │
│ Missing Keywords:                   │
│ ❌ PyTorch  ❌ Docker  ❌ K8s       │
│ ❌ React    ❌ TypeScript           │
│                                     │
│ [Run Full Optimization]             │
└─────────────────────────────────────┘
```

### 3. **Token Counter Display** (NEW)
```
┌─────────────────────────────────────┐
│ 🔢 Token Usage (Session)           │
│ Total: 15,234 tokens                │
│ ~$0.23 cost (estimated)             │
│ [View Breakdown]                    │
└─────────────────────────────────────┘
```

### 4. **Optimization Controls** (NEW)
```
┌─────────────────────────────────────┐
│ Optimization Mode                   │
│ ○ Full Optimization (all bullets)  │
│ ● Targeted (missing keywords only) │
│                                     │
│ Custom Instructions:                │
│ ┌─────────────────────────────────┐│
│ │ Focus on quantifiable results,  ││
│ │ use action verbs...             ││
│ └─────────────────────────────────┘│
│                                     │
│ [🚀 Optimize Resume]                │
└─────────────────────────────────────┘
```

### 5. **LaTeX Viewer** (NEW)
- Use react-katex for LaTeX rendering
- CodeMirror 6 for LaTeX editing
- Live preview split view

### 6. **Enhanced Document Viewer**
- Color-code editable vs structural lines
- Show keywords inline
- Highlight optimized bullets

---

## Implementation Phases

### Phase 1: Foundation (Days 1-2)
✅ Install dependencies
✅ Update type definitions
✅ Create token tracking system
✅ Set up context file storage

### Phase 2: Resume Parsing (Days 3-4)
✅ Implement LaTeX parser
✅ Enhance DOCX parser for resumes
✅ Build resume structure detector
✅ Create line classifier (editable vs structural)

### Phase 3: Keyword Analysis (Days 5-6)
✅ Build keyword extractor (JD)
✅ Build keyword extractor (resume)
✅ Implement gap analysis
✅ Create keyword mapping algorithm

### Phase 4: Parallel Optimization (Days 7-9)
✅ Build parallel optimizer
✅ Implement per-bullet optimization
✅ Add token tracking to all LLM calls
✅ Create optimization API endpoint

### Phase 5: UI Overhaul (Days 10-12)
✅ Build context file manager
✅ Create keyword analysis panel
✅ Add token counter display
✅ Build optimization controls
✅ Implement LaTeX viewer

### Phase 6: Format Preservation (Days 13-14)
✅ Enhance LaTeX export
✅ Enhance DOCX export
✅ Test format preservation

### Phase 7: Integration & Testing (Days 15-16)
✅ End-to-end testing
✅ Performance optimization
✅ Documentation update
✅ Bug fixes

---

## Key Algorithms

### Algorithm 1: Resume Structure Detection
```python
def detect_resume_structure(lines):
    sections = []
    current_section = None

    for line in lines:
        # Detect section headers
        if is_section_header(line):
            if current_section:
                sections.append(current_section)
            current_section = create_section(line)

        # Classify line type
        elif current_section:
            if is_bullet_point(line):
                line.isEditable = True
                line.isStructural = False
            elif is_title_or_date(line):
                line.isEditable = False
                line.isStructural = True

            current_section.lines.append(line)

    return sections
```

### Algorithm 2: Parallel Bullet Optimization
```python
async def optimize_bullets_parallel(bullets, keywords_map, context):
    # Group bullets by assigned keywords
    optimization_tasks = []

    for bullet in bullets:
        target_keywords = keywords_map.get(bullet.lineNumber, [])
        if target_keywords:
            task = optimize_single_bullet(
                bullet.text,
                target_keywords,
                context
            )
            optimization_tasks.append(task)

    # Execute all optimizations in parallel (max 5 concurrent)
    results = await asyncio.gather(*optimization_tasks, max_concurrency=5)

    return results
```

### Algorithm 3: Keyword Mapping (from provided Python code)
```python
def smart_keyword_matching(components, target_keywords):
    """
    Map keywords to resume components based on context
    - Track existing usage
    - Use LLM for intelligent assignment
    - Limit 2 uses per keyword
    - 1-2 keywords per component
    """
    # Implementation from provided resume_optimizer.py
```

---

## Libraries & Dependencies

### New Dependencies to Install
```json
{
  "dependencies": {
    // LaTeX
    "react-katex": "^3.0.1",
    "katex": "^0.16.9",
    "@codemirror/lang-latex": "^6.0.0",
    "codemirror": "^6.0.1",

    // Enhanced DOCX
    "docx-preview": "^0.3.0",

    // PDF
    "react-pdf": "^7.5.1",
    "pdf-lib": "^1.17.1",
    "pdfjs-dist": "^3.11.174",

    // Token estimation
    "gpt-tokenizer": "^2.1.2",

    // Utilities
    "p-limit": "^5.0.0"  // For concurrency control
  }
}
```

---

## Token Tracking Implementation

```typescript
// Track tokens for all LLM calls
class TokenTracker {
  private sessions = new Map<string, TokenUsage>();

  // Called before each LLM call
  startTracking(sessionId: string, operation: string) {
    // Initialize tracking
  }

  // Called after each LLM call
  recordTokens(sessionId: string, promptTokens: number, completionTokens: number) {
    const session = this.sessions.get(sessionId);
    session.totalTokens += promptTokens + completionTokens;
    session.llmCalls.push({
      timestamp: new Date(),
      operation: operation,
      tokensUsed: promptTokens + completionTokens
    });
  }

  // Display in UI
  getSessionStats(sessionId: string): {
    totalTokens: number,
    estimatedCost: number,
    callCount: number
  }
}
```

---

## Resume Optimization Flow

```
User Uploads Resume + JD + Projects
         ↓
Parse & Structure Detection
         ↓
Keyword Extraction (Parallel)
  - JD Keywords (LLM)
  - Resume Keywords (LLM)
         ↓
Gap Analysis
  - Missing Keywords
  - Keyword Coverage %
         ↓
Keyword Mapping
  - Match keywords to bullets
  - Find relevant projects
         ↓
Parallel Optimization
  - 5 concurrent LLM calls
  - Each bullet optimized independently
  - Track tokens per call
         ↓
Apply Changes
  - Preserve LaTeX/DOCX format
  - Update line-by-line
         ↓
Display Results
  - Show optimized resume
  - Keyword coverage improved
  - Total tokens used
```

---

## Cost Estimation

**Gemini 2.0 Flash Pricing:**
- Input: $0.00001875 per 1K tokens
- Output: $0.000075 per 1K tokens

**Typical Resume Optimization:**
- Resume parsing: ~2K tokens
- JD analysis: ~1K tokens
- Keyword extraction: ~3K tokens
- 20 bullet optimizations: ~40K tokens (2K each)
- **Total: ~46K tokens = $0.69 per optimization**

With parallel processing: Complete in ~30 seconds instead of 5+ minutes

---

## Migration Checklist

### Code Changes
- [ ] Rename ClauseCraft → Resume-Craft-Pro
- [ ] Update all imports and types
- [ ] Add resume-specific parsers
- [ ] Implement keyword analysis
- [ ] Build parallel optimizer
- [ ] Add token tracking
- [ ] Enhance UI components

### Database/Storage
- [ ] Extend localStorage schema for context files
- [ ] Add IndexedDB for large files
- [ ] Store token usage per session

### Testing
- [ ] Test LaTeX resume optimization
- [ ] Test DOCX resume optimization
- [ ] Verify format preservation
- [ ] Test parallel optimization performance
- [ ] Validate token tracking accuracy

---

## Success Metrics

1. **Format Preservation**: 100% LaTeX/DOCX structure maintained
2. **Keyword Coverage**: Improve from X% to Y% (measurable)
3. **Processing Speed**: Full optimization in <60 seconds
4. **Token Efficiency**: <50K tokens per optimization
5. **User Experience**: Simple 3-click workflow
   1. Upload resume + JD
   2. Review keyword analysis
   3. Click optimize

---

**Status**: Architecture complete, ready for implementation
**Next Step**: Phase 1 - Install dependencies and update types
