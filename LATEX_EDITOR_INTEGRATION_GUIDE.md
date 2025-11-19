# LaTeX Editor Integration Guide

This guide explains how to integrate the LaTeX Resume Editor into the existing chat page.

## Files Created

✅ All foundational files have been created:

### Type Definitions
- `src/types/resume.ts` - Complete Resume types with format preservation

### Parser & API
- `src/lib/parsers/latex-parser.ts` - LaTeX parser with latex-utensils
- `src/lib/parsers/resume-classifier.ts` - LLM-based section classifier
- `src/lib/api-clients/latex-online-client.ts` - LaTeX compilation client
- `src/app/api/parse-resume/route.ts` - Resume parsing endpoint
- `src/app/api/compile-latex/route.ts` - LaTeX compilation endpoint

### UI Components
- `src/components/editors/MonacoLatexEditor.tsx` - Monaco editor for LaTeX
- `src/components/editors/PdfPreview.tsx` - PDF preview with react-pdf
- `src/components/editors/ResumeEditorLayout.tsx` - Split view layout
- `src/components/editors/ResumeViewEditToggle.tsx` - Toggle between optimize/edit modes

---

## Integration Steps

### Step 1: Update `src/app/chat/page.tsx`

#### 1.1 Add Import Statements

Add these imports at the top of the file (around line 12):

```typescript
// NEW: Resume editor imports
import { Resume } from '@/types/resume';
import ResumeViewEditToggle from '@/components/editors/ResumeViewEditToggle';
```

#### 1.2 Add State Variables

Add these state variables (around line 42, after existing state declarations):

```typescript
// NEW: Resume editor state
const [parsedResume, setParsedResume] = useState<Resume | null>(null);
const [isParsingResume, setIsParsingResume] = useState(false);
```

#### 1.3 Modify File Upload Handler

Update the `handleFileUpload` function to also parse LaTeX files. Find the function (around line 200) and add this after successful document upload:

```typescript
// Inside handleFileUpload function, after setDocument(data.document)

// NEW: If it's a LaTeX file, also parse it for the editor
if (file.name.endsWith('.tex')) {
  console.log('[CHAT] Parsing LaTeX resume for editor...');
  setIsParsingResume(true);

  const parseFormData = new FormData();
  parseFormData.append('file', file);

  try {
    const parseResponse = await fetch('/api/parse-resume', {
      method: 'POST',
      body: parseFormData,
    });

    if (parseResponse.ok) {
      const parseData = await parseResponse.json();
      if (parseData.success && parseData.resume) {
        setParsedResume(parseData.resume);
        console.log('[CHAT] LaTeX resume parsed successfully');
      }
    } else {
      console.warn('[CHAT] Failed to parse LaTeX resume');
    }
  } catch (error) {
    console.error('[CHAT] Error parsing LaTeX:', error);
  } finally {
    setIsParsingResume(false);
  }
}
```

#### 1.4 Add Resume Save Handler

Add this new function (around line 700, near other handlers):

```typescript
// Handle resume source updates from editor
const handleResumeSave = async (updatedSource: string) => {
  if (!parsedResume) return;

  // Update the parsed resume
  const updatedResume = {
    ...parsedResume,
    rawSource: updatedSource,
    updatedAt: new Date(),
  };

  setParsedResume(updatedResume);

  // Also update the document lines if needed
  // (Optional: Re-parse to sync with optimization view)

  console.log('[CHAT] Resume source updated');
};
```

#### 1.5 Replace DocumentViewer with ResumeViewEditToggle

Find the DocumentViewer component in the render section (around line 993-1007) and replace it with:

```typescript
{/* Center - Document Viewer / Resume Editor */}
<div className="flex-1">
  <ResumeViewEditToggle
    // Document viewer props
    document={document}
    onLineToggleLock={handleLineToggleLock}
    onExport={handleExport}
    onFormatPreservingExport={handleFormatPreservingExport}
    hasEdits={editHistory ? editHistory.edits.length > 0 : false}
    onUpload={handleFileUpload}
    isUploading={isUploading}
    selectedLine={selectedLine}
    onLineSelect={setSelectedLine}
    onRunLLMDetection={handleRunLLMDetection}
    isRunningLLMDetection={isRunningLLMDetection}

    // Resume editor props
    resume={parsedResume}
    onResumeSave={handleResumeSave}
  />
</div>
```

---

## Step 2: Update Dependencies

Ensure all required packages are installed:

```bash
npm install @monaco-editor/react react-pdf pdfjs-dist latex-utensils
```

---

## Step 3: Configure PDF.js Worker (if not already done)

Create or update `public/pdf.worker.mjs` with the PDF.js worker file, or rely on the CDN configuration in `PdfPreview.tsx`.

---

## Usage Flow

### For End Users:

1. **Upload LaTeX Resume** (.tex file)
   - The file is parsed into structured Resume JSON
   - Both optimization view and editor become available

2. **Toggle Between Modes**
   - **Optimize View**: Use AI keyword optimization (existing functionality)
   - **LaTeX Editor**: Edit source directly with live PDF preview

3. **In LaTeX Editor Mode**:
   - Edit LaTeX source in Monaco editor (left panel)
   - Click "Preview PDF" to compile and see results (right panel)
   - Click "Save" to save changes
   - Click "Export" to download .tex or .pdf

4. **Workflow**:
   ```
   Upload .tex → Parse → Optimize keywords → Switch to Editor →
   Fine-tune manually → Preview PDF → Export
   ```

---

## Features Enabled

### Optimization View (Existing)
- ✅ Keyword analysis and optimization
- ✅ AI-powered bullet point enhancement
- ✅ Line-by-line editing with LLM
- ✅ Token tracking

### LaTeX Editor View (NEW)
- ✅ Full LaTeX source editing with syntax highlighting
- ✅ On-demand PDF compilation (LaTeX.Online API)
- ✅ Live PDF preview with zoom, rotation, download
- ✅ Format preservation (all packages, preamble, commands)
- ✅ Keyboard shortcuts (Ctrl+S to save, Ctrl+P to preview)
- ✅ Unsaved changes indicator
- ✅ Compilation error display

---

## API Endpoints

### POST /api/parse-resume
Parses uploaded .tex or .docx files into structured Resume JSON.

**Request:**
```typescript
FormData {
  file: File (.tex or .docx)
  apiKey?: string (optional custom API key)
}
```

**Response:**
```typescript
{
  success: boolean
  resume?: Resume
  error?: string
  warnings?: string[]
}
```

### POST /api/compile-latex
Compiles LaTeX source to PDF using LaTeX.Online.

**Request:**
```typescript
{
  latexSource: string
  validate?: boolean (default: true)
}
```

**Response:**
- Binary PDF data (Content-Type: application/pdf)
- Or JSON error response

---

## Error Handling

The integration includes comprehensive error handling:

1. **Parse Errors**: LaTeX syntax errors during parsing
2. **Compilation Errors**: LaTeX compilation failures with log display
3. **API Errors**: Network or API key issues
4. **Format Validation**: Checks for balanced braces, document structure

All errors are displayed with user-friendly messages and actionable suggestions.

---

## Testing Checklist

Test these scenarios after integration:

- [ ] Upload a simple LaTeX resume (.tex)
- [ ] Verify parsing succeeds and Resume object is created
- [ ] Switch to "LaTeX Editor" mode
- [ ] Edit LaTeX source in Monaco editor
- [ ] Click "Preview PDF" and verify compilation
- [ ] Verify PDF displays correctly with zoom/rotate controls
- [ ] Click "Save" and verify changes persist
- [ ] Export as .tex and .pdf
- [ ] Switch back to "Optimize View" and verify it still works
- [ ] Test keyboard shortcuts (Ctrl+S, Ctrl+P)
- [ ] Test with complex LaTeX (multiple packages, custom commands)
- [ ] Test compilation error handling (introduce syntax error)
- [ ] Test unsaved changes indicator

---

## Troubleshooting

### PDF Compilation Fails
- Check LaTeX syntax with validation
- Ensure LaTeX.Online API is accessible
- Verify no special packages are required (LaTeX.Online has limited package support)

### Monaco Editor Not Loading
- Check console for webpack errors
- Verify `@monaco-editor/react` is installed correctly
- Ensure proper dynamic imports for client-side rendering

### PDF Preview Shows Blank
- Verify PDF.js worker is configured correctly
- Check browser console for worker errors
- Try using CDN worker URL (already configured in PdfPreview.tsx)

---

## Next Steps (Optional Enhancements)

- [ ] Add DOCX support (Phase 2)
- [ ] Implement collaborative editing (WebSockets)
- [ ] Add LaTeX template library
- [ ] Add version history with diff view
- [ ] Add inline compilation errors in editor
- [ ] Add auto-save functionality
- [ ] Add export to Overleaf
- [ ] Add custom LaTeX snippets

---

## Architecture Summary

```
User uploads .tex file
       ↓
Parse with latex-utensils → Extract formatting metadata
       ↓
Create Resume JSON (with complete format preservation)
       ↓
Display in two modes:
  1. Optimize View → AI keyword optimization
  2. Editor View → Monaco editor + PDF preview
       ↓
User edits source → Click "Preview" → Compile via LaTeX.Online
       ↓
Display PDF with react-pdf → Download or export
```

---

**Status**: All core components implemented ✅
**Ready for**: Integration testing and user feedback
**Estimated Integration Time**: 30-45 minutes
