# Resume-Craft-Pro - AI-Powered Resume Optimization

<p align="center">
  <img src="/public/images/1.png" alt="Resume-Craft-Pro" width="70%">
</p>

An AI-powered resume optimization platform that intelligently tailors your resume to any job description using advanced keyword analysis, format-preserving editing, and parallel AI processing.

## Documentation

- **[Quick Start Guide](QUICKSTART.md)** - Get up and running in 5 minutes
- **[Architecture Guide](Architecture.md)** - Complete system architecture and optimization workflow
- **[Project Summary](PROJECT_SUMMARY.md)** - Feature overview and implementation details
- **[Libraries Guide](LIBRARIES.md)** - Export and parsing library documentation

## Key Features

### 🎯 Intelligent Resume Optimization
- **AI-Powered Analysis**: Extract 15-20 key technical keywords from job descriptions
- **Gap Analysis**: Identify missing keywords with coverage percentage
- **Smart Mapping**: Intelligently assign keywords to relevant bullet points using portfolio/projects context
- **Parallel Processing**: Optimize multiple bullets concurrently (up to 5 parallel LLM calls)
- **Confidence Scoring**: Only accept high-quality optimizations above configurable thresholds

### 📝 Format Preservation
- **LaTeX Support**: Parse, edit, and export LaTeX resumes with full formatting preservation
- **DOCX Support**: Maintain original formatting for Word documents
- **PDF Support**: Extract and analyze PDF resumes
- **Markdown Support**: Simple text-based resume editing

### 🔍 Smart Content Classification
- **Editable Detection**: Automatically identifies bullet points and descriptions
- **Structural Preservation**: Never modifies titles, positions, dates, or section headers
- **Section Recognition**: Detects Experience, Education, Skills, Projects sections

### 📊 Token Tracking & Cost Management
- **Real-Time Tracking**: Monitor all LLM API calls with token counts
- **Cost Estimation**: Calculate costs based on Gemini 2.0 Flash pricing
- **Session History**: Track all operations with detailed metadata
- **Export Reports**: Download token usage data as JSON

### 🎨 Advanced Optimization Controls
- **Targeted Mode**: Only optimize bullets missing keywords (faster, cheaper)
- **Full Mode**: Comprehensive optimization of all bullet points
- **Custom Instructions**: Add specific guidelines for optimization style
- **Preserve Length**: Maintain bullet point word count (±5 words)
- **Maintain Tone**: Keep professional voice consistent

### 📁 Context-Aware Optimization (NEW)
- **Resume Upload**: Main resume file (LaTeX, DOCX, PDF, MD)
- **Add Context Modal**: Optional drag-drop interface for projects/portfolio
- **Projects Context**: Multiple project descriptions for better keyword mapping
- **Portfolio Context**: Showcase work and achievements not in resume
- **Job Description**: Target role requirements with industry selector
- **Visual Feedback**: Dashed golden border (empty) → Solid gold gradient (active)
- **Persistent Storage**: Context files saved with each chat session
- **Individual Management**: Save, edit, and delete entries independently

## Tech Stack

- **Framework**: Next.js 14 with TypeScript and App Router
- **AI**: Google Gemini 2.0 Flash with parallel processing
- **LaTeX**: CodeMirror 6, KaTeX rendering, @codemirror/language
- **DOCX**: mammoth, docx, docx-preview
- **PDF**: pdf-parse, jsPDF, pdf-lib
- **Concurrency**: p-limit for parallel LLM calls
- **Token Estimation**: gpt-tokenizer
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Architecture

```
/src
  /app
    page.tsx                    # Homepage (/ route)
    /chat
      page.tsx                  # Main chat interface (/chat route)
    layout.tsx                  # App layout and metadata
    /api
      /parse                    # Document parsing endpoint
      /analyze-keywords         # Quick keyword analysis without optimization
      /optimize-resume          # Full 9-step optimization workflow
  /lib
    /parsers
      types.ts                  # TypeScript interfaces (30+ types)
      latex.ts                  # LaTeX parsing with structure detection
      docx.ts                   # DOCX parsing with mammoth
      pdf.ts                    # PDF text extraction
      markdown.ts               # Markdown parsing
    /optimization
      keyword-analyzer.ts       # Keyword extraction and gap analysis
      parallel-optimizer.ts     # Concurrent bullet optimization with p-limit
    /tracking
      token-tracker.ts          # Token usage tracking and cost calculation
    /storage
      chats.ts                  # localStorage wrapper for chats & context
    /export
      latex.ts                  # LaTeX export with format preservation
      docx.ts                   # DOCX generation
      docx-preserve.ts          # Format-preserving DOCX export
      pdf.ts                    # PDF generation with jsPDF
      markdown.ts               # Markdown export
  /components
    HomePage.tsx                # Landing page component
    /sidebar
      TabbedLeftPanel.tsx       # Collapsible chat history sidebar
      ChatHistory.tsx           # Chat list component
    /resume
      ResumeUploadModal.tsx     # Upload interface for new chats
      JobDescriptionPanel.tsx   # JD input with industry selector
      EnhancedKeywordAnalysis.tsx # Keyword visualization
      SimplifiedOptimizationControls.tsx # Analyze/Craft buttons
      TokenCounter.tsx          # Real-time token tracking display
    /modals
      ContextFilesModal.tsx     # Add context files (projects/portfolio) - NEW
      SettingsModal.tsx         # API key configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- Google Gemini API key (Gemini 2.0 Flash)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/PranavMishra17/Resume-Craft-Pro.git
cd Resume-Craft-Pro
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:
```
GEMINI_API_KEY=your_api_key_here
```

Get your API key from: https://aistudio.google.com/apikey

4. Run the development server:
```bash
npm run dev
```

5. Open http://localhost:3000 in your browser

## Usage

### 1. Start from Homepage

Visit http://localhost:3000 and choose:
- **Start New Chat**: Begin fresh optimization session
- **Load Previous Chat**: Continue existing work
- **Settings**: Configure your Gemini API key

### 2. Upload Your Resume

On the `/chat` page, click "Upload Resume" and select your file (LaTeX .tex, DOCX, PDF, or Markdown). The system will:
- Parse the document structure
- Classify lines as editable (bullets) vs structural (titles, dates)
- Detect sections (Experience, Education, Skills, Projects)
- Extract existing keywords

### 3. Add Context Files (Optional but Recommended)

Click the **"Add Context"** button in the header (next to "Re-upload Resume"):
- **Drag & drop** or **browse** files (.txt, .md, .docx, .pdf)
- Add **Projects**: Multiple project descriptions with technologies used
- Add **Portfolio**: Work samples, achievements, side projects
- **Individual save**: Each entry can be saved, edited, or deleted separately
- **Visual feedback**: Button changes from dashed golden border to solid gold gradient when active
- **Persistent**: Context files are saved with your chat session

These provide additional context for smarter keyword mapping and better optimization results.

### 4. Paste Job Description

Copy the target job description and paste it into the Job Description field:
- Select **Industry** from dropdown (optional but recommended - shows golden border when selected)
- Auto keyword extraction starts after 1 second of inactivity
- Or click "Analyze Keywords" for immediate analysis

### 5. Configure Optimization Settings (Advanced)

Click **"Advanced Settings"** to customize optimization:

**Keyword Management:**
- Toggle keywords on/off with checkboxes
- Add custom keywords manually
- View coverage percentage

**Optimization Mode:**
- **Targeted**: Only optimize bullets missing keywords (faster, cost-effective)
- **Full**: Optimize all bullet points (thorough, higher token usage)

**Advanced Settings:**
- Max Concurrent Calls: 1-10 (default: 5)
- Preserve Length: Keep bullet word count similar
- Maintain Tone: Keep professional voice
- Max Keywords Per Bullet: 1-5 (default: 2)
- Min Confidence Score: 0-100% (default: 70%)
- Custom Instructions: Add specific guidelines for AI

### 6. Analyze Keywords (Optional)

Click **"Analyze Keywords"** to see:
- Keywords extracted from job description (15-20 keywords)
- Keywords present in your resume
- Missing keywords with coverage percentage
- Actionable suggestions

### 7. Optimize Resume

Click **"Craft Resume"** to begin the 9-step workflow:

1. **Parse Resume**: Extract structure and content
2. **Extract JD Keywords**: AI identifies 15-20 key technical keywords
3. **Extract Resume Keywords**: AI analyzes current resume keywords
4. **Analyze Gap**: Calculate keyword coverage percentage
5. **Map Keywords**: Intelligently assign keywords to relevant bullets using context
6. **Build Plan**: Create optimization strategy (targeted or full)
7. **Optimize Parallel**: Process multiple bullets concurrently (max 5 parallel calls)
8. **Apply Changes**: Update resume with optimized content
9. **Re-analyze**: Calculate final keyword coverage

### 8. Review Changes

- View keyword coverage improvement
- Track token usage and estimated cost in real-time
- Review optimization results in the chat interface
- Download optimized resume

### 9. Export

Download your optimized resume in:
- **LaTeX (.tex)**: Format-preserving export
- **DOCX (.docx)**: Format-preserving export
- **PDF (.pdf)**: Standard PDF export
- **Markdown (.md)**: Plain text export

### 10. Manage Chats

Use the **collapsible left sidebar** to:
- View all chat history
- Switch between optimization sessions
- Create new chats
- Delete old chats
- Context files persist with each chat

## Optimization Workflow Details

### Keyword Extraction

The AI extracts keywords focusing on:
- Programming languages (Python, JavaScript, Java, etc.)
- Frameworks & libraries (React, Django, TensorFlow, etc.)
- Tools & platforms (Docker, AWS, Git, etc.)
- Technical skills (Machine Learning, REST APIs, etc.)
- Methodologies (Agile, CI/CD, etc.)

### Keyword Mapping Algorithm

1. **Context Building**: Combines resume + projects + portfolio (from Add Context modal)
2. **Relevance Scoring**: AI assigns keywords to most relevant bullets using context
3. **Balance Constraints**:
   - Each keyword → max 1-2 bullets
   - Each bullet → max 2-3 new keywords (configurable)
4. **Validation**: Ensures no keyword stuffing or awkward placement
5. **Context-Aware**: Uses optional projects/portfolio context for smarter mapping

### Parallel Optimization

Uses `p-limit` for concurrency control:
- Max 5 concurrent LLM calls (configurable)
- Prevents rate limiting
- Reduces optimization time from 5+ minutes to ~30 seconds
- Each call tracked independently

### Validation

Every optimization is validated:
- ✅ All assigned keywords present in optimized text
- ✅ Word count within ±5 words (if preserve length enabled)
- ✅ Confidence score above threshold
- ✅ Professional tone maintained
- ❌ Rejected if validation fails

## Token Tracking

All LLM calls are tracked with:
- Timestamp
- Operation type (extract_jd_keywords, optimize_bullet, etc.)
- Model name (gemini-2.0-flash-exp)
- Prompt tokens
- Completion tokens
- Total tokens
- Estimated cost

**Pricing (Gemini 2.0 Flash):**
- Input: $0.00001875 per 1K tokens
- Output: $0.000075 per 1K tokens

Example session cost for 20 bullets: ~$0.05-0.15

## API Endpoints

### POST /api/parse

Parse uploaded resume file.

**Request:**
```typescript
FormData {
  file: File  // .tex, .docx, .pdf, .md
}
```

**Response:**
```typescript
{
  document: Document  // Parsed lines with classification
}
```

### POST /api/analyze-keywords

Quick keyword analysis without optimization.

**Request:**
```typescript
{
  resumeContent: string
  resumeFormat: 'latex' | 'docx' | 'pdf' | 'markdown'
  fileName: string
  jobDescription: string
  sessionId: string
  customApiKey?: string
}
```

**Response:**
```typescript
{
  analysis: {
    jdKeywords: string[]
    resumeKeywords: string[]
    missingKeywords: string[]
    coverage: number
  }
  tokenUsage: TokenUsage
}
```

### POST /api/optimize-resume

Full 9-step resume optimization workflow.

**Request:**
```typescript
{
  resumeContent: string
  resumeFormat: 'latex' | 'docx' | 'pdf' | 'markdown'
  jobDescription: string
  jobField: string
  keywords: string[]  // Active keywords (not disabled)
  sessionId: string
  customApiKey?: string
  config: {
    mode: 'targeted' | 'full'
    maxConcurrentCalls: number  // 1-10, default: 5
    preserveLength: boolean
    maintainTone: boolean
    maxKeywordsPerBullet: number
    minConfidenceScore: number
  }
}
```

**Response:**
```typescript
{
  optimizedResume: Resume
  changes: BulletOptimization[]
  keywordAnalysis: KeywordAnalysis
  tokenUsage: TokenUsage
  summary: {
    bulletsOptimized: number
    coverageImprovement: number
    totalTokens: number
    estimatedCost: number
  }
}
```

## UI/UX Features

### Homepage
- Clean landing page with branding
- Three action buttons: Start New Chat, Load Previous Chat, Settings
- Direct routing to `/chat` interface

### Chat Interface
- **Three-panel layout**:
  - Left: Collapsible chat history sidebar
  - Center: Document viewer (when resume uploaded)
  - Right: Job description, keywords, controls, chat
- **Header controls**: Settings, Re-upload Resume, Add Context, Export
- **Real-time feedback**: Token counter, loading states
- **Visual indicators**: Golden borders for active features
- **Responsive collapse**: Left sidebar can be hidden for more space

### Context Files Modal
- **Drag & drop** file upload area
- **Manual entry** with type selector (Project/Portfolio)
- **Individual management**: Save, edit, delete entries
- **Visual feedback**: Collapsed view shows file summary
- **PDF support**: All common text formats (.txt, .md, .docx, .pdf)
- **Optional**: Clear messaging that all fields are optional

## Storage & Persistence

### Current Implementation: localStorage
- **Browser-based**: All data stored locally in your browser
- **Fast performance**: Instant read/write operations
- **No backend required**: Works completely offline
- **Privacy-focused**: Your data never leaves your device
- **Persistent across sessions**: Chats and context files saved automatically

### What's Stored
- Chat history and messages
- Uploaded resume content
- Context files (projects/portfolio)
- Job descriptions
- Keyword preferences (disabled/custom keywords)
- Industry selection
- Optimization settings

### Limitations
- Browser-specific (not shared across devices)
- ~5-10MB storage limit per domain
- Cleared when browser cache is cleared
- Not suitable for team collaboration

### For Production (Future)
To enable cloud storage and sharing:
- Add database (PostgreSQL/MongoDB/Supabase)
- Implement user authentication (NextAuth.js)
- Create API routes for data persistence
- Enable cross-device access

## Limitations

- LaTeX parsing optimized for standard resume templates
- PDF parsing may vary based on PDF structure
- Image content is not extracted from PDFs
- Complex LaTeX macros may not be fully preserved
- Maximum concurrent LLM calls: 10
- localStorage storage limit (5-10MB per domain)

## Development

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add `GEMINI_API_KEY` environment variable
4. Deploy

### Environment Variables

```env
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Roadmap

### Near Term
- [ ] Database backend (PostgreSQL/MongoDB)
- [ ] User authentication system
- [ ] Cloud storage for cross-device access
- [ ] Mobile responsive layout
- [ ] Dark mode theme

### Future Enhancements
- [ ] Support for more LaTeX templates
- [ ] PDF format-preserving export
- [ ] Multi-language support
- [ ] A/B testing of multiple optimizations
- [ ] Resume templates library
- [ ] Chrome extension for one-click optimization
- [ ] Integration with job boards (LinkedIn, Indeed)
- [ ] Analytics dashboard for application tracking
- [ ] Real-time collaboration
- [ ] Version history with diff view
- [ ] Keyboard shortcuts
- [ ] Undo/redo functionality

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT License - see LICENSE file

## Connect with the Creator

<table align="center">
<tr>
<td width="200px">
  <img src="public/images/me.jpg" alt="Pranav Mishra" width="180" style="border: 5px solid; border-image: linear-gradient(45deg, #9d4edd, #ff006e) 1;">
</td>
<td>

[![Portfolio](https://img.shields.io/badge/-Portfolio-000?style=for-the-badge&logo=vercel&logoColor=white)](https://portfolio-pranav-mishra-paranoid.vercel.app)
[![LinkedIn](https://img.shields.io/badge/-LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/pranavgamedev/)
[![Resume](https://img.shields.io/badge/-Resume-4B0082?style=for-the-badge&logo=read-the-docs&logoColor=white)](https://portfolio-pranav-mishra-paranoid.vercel.app/resume)
[![YouTube](https://img.shields.io/badge/-YouTube-8B0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/@parano1dgames/featured)
[![Hugging Face](https://img.shields.io/badge/-Hugging%20Face-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)](https://huggingface.co/Paranoiid)

</td>
</tr>
</table>

---

**Resume-Craft-Pro** - Craft the perfect resume for every opportunity with AI-powered optimization.
