# ClauseCraft - Quick Start Guide

Get up and running with ClauseCraft in 5 minutes.

## Prerequisites

- Node.js 18 or higher
- A Google Gemini API key (free tier available)

## Step 1: Get Your Gemini API Key

1. Visit https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

## Step 2: Configure Environment

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Edit `.env` and add your API key:
```
GEMINI_API_KEY=your_actual_api_key_here
```

## Step 3: Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

## Step 4: Start Development Server

```bash
npm run dev
```

The application will be available at http://localhost:3000

## Step 5: Upload a Document

1. Click "Upload Document" in the top right
2. Select a DOCX, PDF, or Markdown file
3. Wait for the document to be parsed

## Step 6: Start Chatting

Try these example commands:

- "Search for 'payment terms'"
- "Read lines 10-20"
- "What does @line15 say?"
- "Replace @line10 with 'Updated content'"
- "Find all placeholders"

## Features to Try

### Line Locking
- Click the lock icon next to any line to prevent AI edits
- Locked lines will show with a red background
- AI cannot modify locked lines

### Citations
- Reference specific lines: `@line10` or `@l10`
- Reference ranges: `@l5-10`
- Reference pages: `@page3` or `@p3`

### Placeholders
- Lines with {{PLACEHOLDERS}}, [CONSTANTS], or _____ are highlighted in yellow
- Ask the AI: "Show me all placeholders"

### Export
- Click "Export" in the document viewer
- Choose format: DOCX, PDF, or Markdown
- File downloads automatically

## Troubleshooting

### "Gemini API key not configured"
- Make sure `.env` file exists
- Check that `GEMINI_API_KEY` is set correctly
- Restart the development server after changing `.env`

### "Failed to parse document"
- Check file format is supported (DOCX, PDF, MD, TXT)
- Verify file is not corrupted
- Try a simpler test document first

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run dev
```

### Port Already in Use
```bash
# Use a different port
npm run dev -- -p 3001
```

## Project Structure

```
ClauseCraft/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── page.tsx        # Main application page
│   │   └── api/            # API endpoints
│   ├── lib/                # Core functionality
│   │   ├── parsers/        # Document parsers
│   │   ├── citations/      # Citation system
│   │   ├── gemini/         # AI integration
│   │   ├── storage/        # Data persistence
│   │   └── export/         # Export functionality
│   └── components/         # React components
├── public/                 # Static files
└── .env                    # Environment configuration
```

## Next Steps

1. **Read the Architecture**: Check [Architecture.md](Architecture.md) for system design
2. **Review Code Standards**: See [.claude/rules.md](.claude/rules.md)
3. **Explore Libraries**: Read [LIBRARIES.md](LIBRARIES.md) for export options
4. **Check README**: Full documentation in [README.md](README.md)

## Common Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Tips for Best Results

1. **Be Specific**: "Replace line 10 with X" works better than "Change that line"
2. **Use Citations**: Reference exact lines with @line10 syntax
3. **Lock Important Lines**: Protect critical content from accidental edits
4. **Test on Small Documents First**: Start with 50-100 lines
5. **Save Regularly**: Export your work frequently

## Example Workflow

1. Upload a contract template with placeholders
2. Ask: "Show me all placeholders"
3. Lock any standard clauses you don't want changed
4. For each placeholder:
   - "Replace @line15 with 'John Smith'"
   - "Update @l20-25 with the new payment terms"
5. Review changes in the document viewer
6. Export final document as DOCX

## Getting Help

- **Issues**: Check the browser console (F12) for errors
- **Logs**: Server logs appear in your terminal
- **Documentation**: All modules have inline comments
- **GitHub**: Report bugs at your repository

## Performance Notes

- **Small Documents** (<100 lines): Instant parsing
- **Medium Documents** (100-1000 lines): 1-2 seconds
- **Large Documents** (1000+ lines): 3-5 seconds
- **AI Response Time**: 2-5 seconds per message

## Security Notes

- Never commit `.env` file to Git
- API key is used server-side only
- Documents stored in browser localStorage
- No data sent to third parties except Gemini API

## What's Next?

Now you're ready to use ClauseCraft! Start with a simple document and explore the features.

Happy editing!
