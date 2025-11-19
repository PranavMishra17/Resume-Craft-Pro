# Resume-Craft-Pro - System Architecture

## Overview

Resume-Craft-Pro is an AI-powered resume optimization platform built with Next.js 14, TypeScript, and Google Gemini 2.0 Flash. It intelligently tailors resumes to job descriptions through advanced keyword analysis, format-preserving editing, and parallel AI processing.

---

## Core Architecture

### System Flow

```
Upload Resume → Parse & Classify → Add Context → Extract Keywords
    ↓
Job Description → AI Analysis → Gap Analysis → Keyword Mapping
    ↓
Parallel Optimization → Validation → Apply Changes → Export
```

---

## Component Architecture

### 1. Document Parsing Layer

**Purpose**: Multi-format document ingestion and line-by-line classification

**Files**:
- `src/lib/parsers/latex.ts` - LaTeX parsing with structure detection
- `src/lib/parsers/docx.ts` - DOCX parsing with mammoth
- `src/lib/parsers/pdf.ts` - PDF text extraction
- `src/lib/parsers/markdown.ts` - Markdown parsing
- `src/lib/parsers/types.ts` - TypeScript interfaces (15+ types)

**Line Classification System**:
```typescript
ResumeLine {
  lineNumber: int           // Unique identifier
  text: string             // Content
  pageNumber: int          // For citations
  isEditable: boolean      // Can be optimized (bullets)
  isStructural: boolean    // Titles, dates (DO NOT edit)
  sectionType: string      // experience | education | skills | projects
  bulletLevel: number      // Nested bullet depth
  keywords: string[]       // Detected keywords
}
```

**Section Detection**: Automatically identifies Experience, Education, Skills, Projects, Summary sections.

---

### 2. Keyword Analysis Engine

**Purpose**: AI-powered keyword extraction and gap analysis

**File**: `src/lib/optimization/keyword-analyzer.ts`

**Process**:
1. **JD Keyword Extraction** (Gemini AI)
   - Extracts 15-20 technical keywords
   - Focus: languages, frameworks, tools, methodologies
   - Output: Ranked list of critical skills

2. **Resume Keyword Extraction** (Gemini AI)
   - Analyzes current resume content
   - Identifies existing keywords
   - Maps to JD keywords

3. **Gap Analysis**
   - Missing keywords calculation
   - Coverage percentage (0-100%)
   - Actionable suggestions

**Example Output**:
```typescript
{
  jdKeywords: ['React', 'TypeScript', 'AWS', 'Docker', ...],
  resumeKeywords: ['React', 'JavaScript', 'Git', ...],
  missingKeywords: ['TypeScript', 'AWS', 'Docker', ...],
  coverage: 45.2  // percentage
}
```

---

### 3. Keyword Mapping Algorithm

**Purpose**: Intelligently assign missing keywords to relevant bullet points

**File**: `src/lib/optimization/keyword-mapper.ts` (within optimizer)

**Algorithm**:
```
FOR each missing keyword:
  1. Build context = resume + projects + portfolio
  2. AI analyzes relevance to each bullet point
  3. Score bullets (0-1 relevance)
  4. Assign to most relevant bullets
  5. Constraints:
     - Max 2 keywords per bullet
     - Each keyword → max 2 bullets
     - Avoid keyword stuffing
```

**AI Prompt**:
- Analyzes semantic relevance
- Considers technical context
- Ensures natural placement

---

### 4. Parallel Optimization Engine

**Purpose**: Concurrent bullet point optimization with concurrency control

**File**: `src/lib/optimization/parallel-optimizer.ts`

**Architecture**:
```typescript
import pLimit from 'p-limit';

const limit = pLimit(config.maxConcurrentCalls); // Default: 5

// Parallel execution with rate limiting
const promises = bullets.map(bullet =>
  limit(() => optimizeBullet(bullet, keywords, context))
);

const results = await Promise.all(promises);
```

**Benefits**:
- 5+ minutes → ~30 seconds optimization time
- Prevents API rate limiting
- Independent bullet processing
- Automatic retry logic

**Per-Bullet Optimization**:
1. Original bullet + assigned keywords
2. Context (projects/portfolio)
3. AI generates optimized version
4. Validation checks
5. Accept or reject based on confidence

---

### 5. Validation System

**Purpose**: Quality control for AI-generated content

**Validation Checks**:
```typescript
✓ All assigned keywords present in optimized text
✓ Word count within ±5 words (if preserve length enabled)
✓ Confidence score above threshold (default: 70%)
✓ Professional tone maintained
✓ No keyword stuffing detected
✗ Reject if any validation fails
```

**Confidence Scoring**: AI self-evaluates optimization quality (0-100%)

---

### 6. Export System

**Purpose**: Multi-format export with formatting preservation

**Files**:
- `src/lib/export/latex.ts` - LaTeX format preservation
- `src/lib/export/docx.ts` - DOCX generation
- `src/lib/export/docx-preserve.ts` - Format-preserving DOCX
- `src/lib/export/pdf.ts` - PDF generation
- `src/lib/export/markdown.ts` - Markdown export

**Preserved Formatting**:
- ✓ Bold, italic, underline
- ✓ Font family and size
- ✓ Text color
- ✓ Alignment (left, center, right, justify)
- ✓ Line spacing

---

## UI Architecture

### Layout Structure

```
┌────────────────────────────────────────────────────┐
│  Header (Logo, Settings, Re-upload, Add Context)  │
├───────────┬──────────────────────┬─────────────────┤
│           │                      │                 │
│  Chat     │   Document Viewer    │   Right Panel   │
│  History  │   (LaTeX/DOCX/PDF)   │   - Job Desc    │
│           │                      │   - Keywords    │
│  Sidebar  │   Resume Content     │   - Controls    │
│  (Collapses) │                   │   - Chat       │
│           │                      │                 │
└───────────┴──────────────────────┴─────────────────┘
```

### Component Hierarchy

```
src/app/
├── page.tsx                    # Homepage (/ route)
└── chat/page.tsx              # Main chat interface (/chat route)

src/components/
├── HomePage.tsx               # Landing page component
├── sidebar/
│   ├── TabbedLeftPanel.tsx   # Collapsible chat history
│   └── ChatHistory.tsx        # Chat list
├── resume/
│   ├── ResumeUploadModal.tsx # Upload interface
│   ├── JobDescriptionPanel.tsx # JD input with industry selector
│   ├── EnhancedKeywordAnalysis.tsx # Keyword visualization
│   ├── SimplifiedOptimizationControls.tsx # Analyze/Craft buttons
│   └── TokenCounter.tsx       # Real-time token tracking
└── modals/
    ├── ContextFilesModal.tsx  # Add context files (NEW)
    └── SettingsModal.tsx      # API key configuration
```

---

## State Management

### Core State (chat/page.tsx)

```typescript
// Document state
const [document, setDocument] = useState<Document | null>(null)
const [hasResumeUploaded, setHasResumeUploaded] = useState(false)

// Chat state
const [chats, setChats] = useState<Chat[]>([])
const [currentChat, setCurrentChat] = useState<Chat | null>(null)

// Context files state (NEW)
const [contextFiles, setContextFiles] = useState({
  projects?: ContextFile,
  portfolio?: ContextFile
})

// Keyword state
const [jdKeywords, setJdKeywords] = useState<string[]>([])
const [resumeKeywords, setResumeKeywords] = useState<string[]>([])
const [disabledKeywords, setDisabledKeywords] = useState<string[]>([])
const [customKeywords, setCustomKeywords] = useState<string[]>([])

// Optimization state
const [isAnalyzing, setIsAnalyzing] = useState(false)
const [isOptimizing, setIsOptimizing] = useState(false)
const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null)
```

### Persistence

**localStorage** (Browser-based):
- Chats and messages
- Document content
- Job field selection
- Disabled keywords
- Custom keywords
- Context files (NEW - stored with chat)

**Files**: `src/lib/storage/chats.ts`

---

## API Endpoints

### 1. POST /api/parse

**Purpose**: Parse uploaded resume file

**Request**:
```typescript
FormData {
  file: File  // .tex, .docx, .pdf, .md
}
```

**Response**:
```typescript
{
  document: Document  // Parsed lines with classification
}
```

---

### 2. POST /api/analyze-keywords

**Purpose**: Quick keyword analysis without optimization

**Request**:
```typescript
{
  resumeContent: string,
  resumeFormat: 'latex' | 'docx' | 'pdf' | 'markdown',
  fileName: string,
  jobDescription: string,
  sessionId: string,
  customApiKey?: string
}
```

**Response**:
```typescript
{
  analysis: {
    jdKeywords: string[],
    resumeKeywords: string[],
    missingKeywords: string[],
    coverage: number
  },
  tokenUsage: TokenUsage
}
```

---

### 3. POST /api/optimize-resume

**Purpose**: Full 9-step optimization workflow

**Request**:
```typescript
{
  resumeContent: string,
  resumeFormat: 'latex' | 'docx' | 'pdf' | 'markdown',
  jobDescription: string,
  jobField: string,
  keywords: string[],  // Active keywords (not disabled)
  sessionId: string,
  customApiKey?: string,
  config: {
    mode: 'targeted' | 'full',
    maxConcurrentCalls: number,  // 1-10, default: 5
    preserveLength: boolean,
    maintainTone: boolean,
    maxKeywordsPerBullet: number,
    minConfidenceScore: number
  }
}
```

**Response**:
```typescript
{
  optimizedResume: Resume,
  changes: BulletOptimization[],
  keywordAnalysis: KeywordAnalysis,
  tokenUsage: TokenUsage,
  summary: {
    bulletsOptimized: number,
    coverageImprovement: number,
    totalTokens: number,
    estimatedCost: number
  }
}
```

---

## 9-Step Optimization Workflow

```
Step 1: Parse Resume
  ↓ Extract structure, classify lines, detect sections

Step 2: Extract JD Keywords
  ↓ AI identifies 15-20 key technical keywords

Step 3: Extract Resume Keywords
  ↓ AI analyzes current resume keywords

Step 4: Analyze Gap
  ↓ Calculate keyword coverage percentage

Step 5: Map Keywords
  ↓ Intelligently assign keywords to bullets using context

Step 6: Build Plan
  ↓ Create optimization strategy (targeted or full)

Step 7: Optimize Parallel
  ↓ Process multiple bullets concurrently (max 5 parallel calls)

Step 8: Apply Changes
  ↓ Update resume with optimized content

Step 9: Re-analyze
  ↓ Calculate final keyword coverage
```

---

## Token Tracking System

**File**: `src/lib/tracking/token-tracker.ts`

**Tracked Data**:
```typescript
{
  sessionId: string,
  totalTokens: number,
  promptTokens: number,
  completionTokens: number,
  estimatedCost: number,  // USD
  llmCalls: [{
    timestamp: Date,
    operation: string,  // 'extract_jd_keywords', 'optimize_bullet', etc.
    model: string,      // 'gemini-2.0-flash-exp'
    tokensUsed: number,
    promptTokens: number,
    completionTokens: number
  }]
}
```

**Pricing** (Gemini 2.0 Flash):
- Input: $0.00001875 per 1K tokens
- Output: $0.000075 per 1K tokens
- Average session (20 bullets): ~$0.05-0.15

---

## Context Files System (NEW)

**Purpose**: Add optional project/portfolio context for smarter optimization

**Component**: `src/components/modals/ContextFilesModal.tsx`

**Features**:
- Drag-drop file upload
- Manual entry with type selector (Project/Portfolio)
- Multiple files support
- Individual save/collapse per entry
- PDF support (.txt, .md, .docx, .pdf)
- Persisted with chat data

**Storage**:
```typescript
Chat {
  contextFiles?: {
    projects?: {
      name: string,
      content: string,
      uploadedAt: Date
    },
    portfolio?: {
      name: string,
      content: string,
      uploadedAt: Date
    }
  }
}
```

**Visual Feedback**:
- Default: Dashed golden border (empty)
- With files: Solid gold gradient (active)

---

## Security & Performance

### Security Measures

1. **API Key Management**
   - Server-side only (`GEMINI_API_KEY` in .env)
   - Optional user-provided key support
   - Never exposed to client

2. **Input Validation**
   - File type validation
   - File size limits (5MB per file, 20MB total)
   - Content sanitization

3. **Error Handling**
   - Try-catch blocks throughout
   - Comprehensive logging with `[MODULE]` prefix
   - User-friendly error messages

### Performance Optimizations

1. **Parallel Processing**
   - p-limit for concurrency control
   - 5 concurrent LLM calls (default)
   - Reduces optimization time by 90%

2. **Token Estimation**
   - gpt-tokenizer for pre-estimation
   - Cost tracking in real-time
   - Session-based aggregation

3. **Efficient Parsing**
   - Streaming for large files
   - Line-by-line classification
   - Lazy rendering in UI

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5.6+
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State**: React hooks (useState, useEffect)

### Backend
- **Runtime**: Node.js 18+
- **API**: Next.js API routes
- **AI**: Google Gemini 2.0 Flash
- **Concurrency**: p-limit

### Document Processing
- **LaTeX**: Custom parser
- **DOCX**: mammoth, docx
- **PDF**: pdf-parse, jsPDF, pdf-lib
- **Markdown**: Custom parser

### Storage
- **Browser**: localStorage (current)
- **Future**: PostgreSQL/MongoDB (for production)

---

## Deployment

### Vercel (Recommended)

```bash
# 1. Push to GitHub
git push origin main

# 2. Import in Vercel
# 3. Add environment variable
GEMINI_API_KEY=your_api_key_here

# 4. Deploy
```

### Self-Hosted

```bash
# Build
npm run build

# Start
npm run start

# Or with PM2
pm2 start npm --name "resume-craft-pro" -- start
```

---

## File Structure

```
Resume-Craft-Pro/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Homepage (/)
│   │   ├── chat/page.tsx               # Chat interface (/chat)
│   │   └── api/
│   │       ├── parse/route.ts          # Document parsing
│   │       ├── analyze-keywords/route.ts # Keyword analysis
│   │       └── optimize-resume/route.ts # Full optimization
│   ├── lib/
│   │   ├── parsers/
│   │   │   ├── types.ts                # TypeScript interfaces
│   │   │   ├── latex.ts                # LaTeX parsing
│   │   │   ├── docx.ts                 # DOCX parsing
│   │   │   ├── pdf.ts                  # PDF parsing
│   │   │   └── markdown.ts             # Markdown parsing
│   │   ├── optimization/
│   │   │   ├── keyword-analyzer.ts     # Keyword extraction
│   │   │   └── parallel-optimizer.ts   # Concurrent optimization
│   │   ├── tracking/
│   │   │   └── token-tracker.ts        # Token usage tracking
│   │   ├── export/
│   │   │   ├── latex.ts                # LaTeX export
│   │   │   ├── docx.ts                 # DOCX export
│   │   │   ├── pdf.ts                  # PDF export
│   │   │   └── markdown.ts             # Markdown export
│   │   └── storage/
│   │       └── chats.ts                # localStorage wrapper
│   └── components/
│       ├── HomePage.tsx                # Landing page
│       ├── sidebar/
│       │   ├── TabbedLeftPanel.tsx     # Collapsible left panel
│       │   └── ChatHistory.tsx         # Chat list
│       ├── resume/
│       │   ├── ResumeUploadModal.tsx
│       │   ├── JobDescriptionPanel.tsx
│       │   ├── EnhancedKeywordAnalysis.tsx
│       │   ├── SimplifiedOptimizationControls.tsx
│       │   └── TokenCounter.tsx
│       └── modals/
│           ├── ContextFilesModal.tsx   # NEW
│           └── SettingsModal.tsx
├── public/
│   └── images/
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── README.md
```

---

## Key Design Decisions

### 1. Line-Based Architecture
**Rationale**: Enables precise bullet-level optimization without disturbing structural elements.

### 2. Parallel Processing
**Rationale**: Reduces optimization time from 5+ minutes to ~30 seconds for 20 bullets.

### 3. Validation Pipeline
**Rationale**: Ensures high-quality optimizations, rejects low-confidence changes.

### 4. localStorage Persistence
**Rationale**: Zero backend complexity, works offline, fast performance.

### 5. Context Files Modal (NEW)
**Rationale**: Optional context improves keyword mapping accuracy without cluttering UI.

---

## Future Enhancements

- [ ] Database backend (PostgreSQL/MongoDB)
- [ ] User authentication system
- [ ] Real-time collaboration
- [ ] Version history with diff view
- [ ] Mobile responsive layout
- [ ] Dark mode theme
- [ ] Keyboard shortcuts
- [ ] Undo/redo functionality
- [ ] A/B testing of optimizations
- [ ] Resume templates library
- [ ] Integration with job boards

---

**Built with**: Next.js 14 | TypeScript | Tailwind CSS | Google Gemini 2.0 Flash
**Status**: ✅ Production-ready
**Last Updated**: 2025-11-18
