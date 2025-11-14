# ClauseCraft - Agentic Document Editor -  [![Website](https://img.shields.io/badge/-Live%20App-228B22?style=for-the-badge&logo=vercel&logoColor=white)](https://clause-craft-bay.vercel.app)

<p align="center">
  <img src="/public/images/1.png" alt="ClauseCraft" width="70%">
</p>

An agentic document editor powered by AI that enables intelligent document editing through conversational commands and line-based citations.



## Documentation

- **[Quick Start Guide](QUICKSTART.md)** - Get up and running in 5 minutes
- **[Project Summary](PROJECT_SUMMARY.md)** - Complete feature overview and implementation details
- **[Architecture](Architecture.md)** - System design and technical architecture
- **[Libraries Guide](LIBRARIES.md)** - Export and preview library documentation

## Features

- **Multi-Format Support**: Upload and parse DOCX, PDF, and Markdown files
- **AI-Powered Editing**: Use Google Gemini Flash to search, read, and edit documents
- **Line-Based Citations**: Reference specific lines with @line10, @l5-10, or @p3 for page 3, type of syntax
- **Document Locking**: Lock lines to prevent AI modifications
- **Placeholder Detection**: Automatically highlights {{PLACEHOLDERS}}, [CONSTANTS], and _____ patterns
- **Chat History**: Persistent chat history with localStorage (for now, will switch to Supabase)
- **Real-Time Editing**: See document changes instantly as AI makes edits

![ClauseCraft Screenshot](/public/images/2.png)

## Architecture

Built with a modular, clean architecture:

```
/src
  /app
    page.tsx              # Main UI with state management
    layout.tsx
    /api
      /parse              # Document parsing endpoint
      /chat               # Gemini chat endpoint
  /lib
    /parsers              # DOCX, PDF, Markdown parsers
    /citations            # Citation parsing and resolution
    /gemini               # Gemini API client and tools
    /storage              # LocalStorage wrapper
  /components
    /document             # Document viewer and line components
    /chat                 # Chat interface
    /sidebar              # Chat history
```

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **AI**: Google Gemini 1.5 Flash with function calling
- **Parsing**: mammoth (DOCX), pdf-parse (PDF), marked (Markdown)
- **Export**: docx, jsPDF
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/clausecraft.git
cd clausecraft
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

Get your API key from: https://makersuite.google.com/app/apikey

4. Run the development server:
```bash
npm run dev
```

5. Open http://localhost:3000 in your browser

## Usage

### Upload a Document

Click "Upload Document" and select a DOCX, PDF, or Markdown file.

### Chat with Your Document

Use natural language to interact with your document:

- "Search for all mentions of 'payment terms'"
- "Read lines 10-20"
- "Replace line 15 with 'New content here'"
- "What does line 25 say?"

### Use Citations

Reference specific parts of the document:

- `@line10` or `@l10` - Reference line 10
- `@l5-10` - Reference lines 5 through 10
- `@page3` or `@p3` - Reference all lines on page 3

Example: "Replace @line10 with 'Updated text'"

### Lock Lines

Click the lock icon next to any line to prevent AI modifications.

### Export

Click the "Export" button to download your edited document in DOCX, PDF, or Markdown format.

## AI Tools

The AI assistant has access to three tools:

1. **doc_search(query)** - Search for keywords in the document
2. **doc_read(lines)** - Read specific line numbers
3. **doc_edit(operation, lines, newText)** - Edit lines (replace, insert, delete)

All tools respect line locks and provide detailed error handling.

## Development

### Project Structure

- `/src/lib/parsers` - Document parsing logic
- `/src/lib/citations` - Citation system
- `/src/lib/gemini` - AI integration
- `/src/lib/storage` - Data persistence
- `/src/components` - React components
- `/src/app/api` - API routes

## Deployment

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add `GEMINI_API_KEY` environment variable
4. Deploy

## Limitations

- PDF parsing may vary based on PDF structure
- Image content is not extracted
- Complex formatting may be simplified
- Maximum file size: 10MB

## License

MIT License - see LICENSE file


## Connect with me

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
