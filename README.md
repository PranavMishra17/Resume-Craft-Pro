# Resume-Craft-Pro - AI-Powered Resume Optimization

<p align="center">
  <img src="/public/images/1.png" alt="Resume-Craft-Pro" width="70%">
</p>

An AI-powered resume optimization platform that intelligently tailors your resume to any job description using advanced keyword analysis, format-preserving editing, and parallel AI processing.

## Documentation

- **[Quick Start Guide](QUICKSTART.md)** - Get up and running in 5 minutes
- **[Project Summary](PROJECT_SUMMARY.md)** - Complete feature overview and implementation details
- **[Architecture](RESUME_OPTIMIZATION_ARCHITECTURE.md)** - System design and optimization workflow
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

### 📁 Context-Aware Optimization
- **Resume Upload**: Main resume file (LaTeX, DOCX, PDF, MD)
- **Projects File**: Additional context for technical projects
- **Portfolio File**: Showcase work and achievements
- **Job Description**: Target role requirements
- **File Size Limits**: 5MB per file, 20MB total session

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
    page.tsx                    # Main UI with integrated optimization workflow
    layout.tsx                  # App layout and metadata
    /api
      /upload-context           # File upload endpoint (resume, projects, portfolio, JD)
      /analyze-keywords         # Quick keyword analysis without optimization
      /optimize-resume          # Full 9-step optimization workflow
  /lib
    /parsers
      types.ts                  # TypeScript interfaces (15+ types)
      latex.ts                  # LaTeX parsing with line classification
      docx.ts                   # DOCX parsing
      pdf.ts                    # PDF parsing
      markdown.ts               # Markdown parsing
    /optimization
      keyword-analyzer.ts       # Keyword extraction and gap analysis
      parallel-optimizer.ts     # Concurrent bullet optimization
    /tracking
      token-tracker.ts          # Token usage tracking and cost calculation
    /export
      latex.ts                  # LaTeX export with format preservation
      docx.ts                   # DOCX export
      docx-preserve.ts          # Format-preserving DOCX export
      pdf.ts                    # PDF export
      markdown.ts               # Markdown export
  /components
    /resume
      ContextFileManager.tsx    # File upload and management
      KeywordAnalysisPanel.tsx  # Keyword gap visualization
      TokenCounter.tsx          # Real-time token tracking display
      OptimizationControls.tsx  # Optimization settings and controls
      LaTeXViewer.tsx           # CodeMirror LaTeX editor
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

### 1. Upload Your Resume

Click "Upload Resume" and select your resume file (LaTeX .tex, DOCX, PDF, or Markdown). The system will:
- Parse the document structure
- Classify lines as editable (bullets) vs structural (titles, dates)
- Detect sections (Experience, Education, Skills, Projects)
- Extract existing keywords

### 2. Add Context Files (Optional but Recommended)

- **Projects File**: Upload a document with detailed project descriptions
- **Portfolio File**: Upload a file showcasing your work and achievements

These provide additional context for smarter keyword mapping.

### 3. Paste Job Description

Copy the target job description and paste it into the Job Description field. You can also upload a .txt file.

### 4. Configure Optimization Settings

**Optimization Mode:**
- **Targeted**: Only optimize bullets missing keywords (faster, cost-effective)
- **Full**: Optimize all bullet points (thorough, higher token usage)

**Advanced Settings:**
- Max Concurrent Calls: 1-10 (default: 5)
- Preserve Length: Keep bullet word count similar
- Maintain Tone: Keep professional voice
- Max Keywords Per Bullet: 1-5 (default: 2)
- Min Confidence Score: 0-100% (default: 70%)

### 5. Analyze Keywords (Optional)

Click "Analyze Keywords" to see:
- Keywords extracted from job description (15-20 keywords)
- Keywords present in your resume
- Missing keywords with coverage percentage
- Actionable suggestions

### 6. Optimize Resume

Click "Start Optimization" to begin the 9-step workflow:

1. **Parse Resume**: Extract structure and content
2. **Extract JD Keywords**: AI identifies 15-20 key technical keywords
3. **Extract Resume Keywords**: AI analyzes current resume keywords
4. **Analyze Gap**: Calculate keyword coverage percentage
5. **Map Keywords**: Intelligently assign keywords to relevant bullets using context
6. **Build Plan**: Create optimization strategy (targeted or full)
7. **Optimize Parallel**: Process multiple bullets concurrently (max 5 parallel calls)
8. **Apply Changes**: Update resume with optimized content
9. **Re-analyze**: Calculate final keyword coverage

### 7. Review Changes

- View original vs optimized content side-by-side
- See keyword coverage improvement
- Track token usage and estimated cost
- Accept or reject individual changes

### 8. Export

Download your optimized resume in:
- **LaTeX (.tex)**: Format-preserving export
- **DOCX (.docx)**: Format-preserving export
- **PDF (.pdf)**: Standard PDF export
- **Markdown (.md)**: Plain text export

## Optimization Workflow Details

### Keyword Extraction

The AI extracts keywords focusing on:
- Programming languages (Python, JavaScript, Java, etc.)
- Frameworks & libraries (React, Django, TensorFlow, etc.)
- Tools & platforms (Docker, AWS, Git, etc.)
- Technical skills (Machine Learning, REST APIs, etc.)
- Methodologies (Agile, CI/CD, etc.)

### Keyword Mapping Algorithm

1. **Context Building**: Combines resume + projects + portfolio
2. **Relevance Scoring**: AI assigns keywords to most relevant bullets
3. **Balance Constraints**:
   - Each keyword → max 1-2 bullets
   - Each bullet → max 2-3 new keywords
4. **Validation**: Ensures no keyword stuffing or awkward placement

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

### POST /api/upload-context

Upload context files (resume, projects, portfolio, job description).

**Request:**
```typescript
FormData {
  resume?: File
  projects?: File
  portfolio?: File
  jobDescription?: File
}
```

**Response:**
```typescript
{
  success: boolean
  files: {
    resume?: { fileName, content, format, size }
    projects?: { fileName, content, size }
    portfolio?: { fileName, content, size }
    jobDescription?: { content, size }
  }
}
```

### POST /api/analyze-keywords

Quick keyword analysis without optimization.

**Request:**
```typescript
{
  resumeContent: string
  resumeFormat: 'latex' | 'docx' | 'pdf' | 'markdown'
  jobDescription: string
  sessionId: string
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
    suggestions: string[]
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
  projects?: string
  portfolio?: string
  customInstructions?: string
  config: OptimizationConfig
  sessionId: string
  customApiKey?: string
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

## File Size Limits

- Resume: 5MB
- Projects: 5MB
- Portfolio: 5MB
- Job Description: 5MB
- Total session: 20MB

## Limitations

- LaTeX parsing optimized for standard resume templates
- PDF parsing may vary based on PDF structure
- Image content is not extracted from PDFs
- Complex LaTeX macros may not be fully preserved
- Maximum concurrent LLM calls: 10

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

- [ ] Support for more LaTeX templates
- [ ] PDF format-preserving export
- [ ] Multi-language support
- [ ] A/B testing of multiple optimizations
- [ ] Resume templates library
- [ ] Chrome extension for one-click optimization
- [ ] Integration with job boards (LinkedIn, Indeed)
- [ ] Analytics dashboard for application tracking

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
