# File Preview and Download Libraries

This document outlines various libraries and APIs that can be used for previewing and downloading different file formats in the ClauseCraft application.

## Export Libraries (Already Integrated)

### 1. docx - DOCX Generation
**Package**: `docx` (v8.5.0)
**Purpose**: Create and export DOCX files
**Usage**: Convert edited document lines back to DOCX format

```typescript
import { Document, Packer, Paragraph, TextRun } from 'docx';

const doc = new Document({
  sections: [{
    properties: {},
    children: lines.map(line => new Paragraph({
      children: [new TextRun(line.text)]
    }))
  }]
});

const blob = await Packer.toBlob(doc);
```

**Pros**:
- Full DOCX formatting support
- Preserves styles, headers, footers
- Widely compatible

**Cons**:
- Large bundle size (~500KB)
- Complex API for advanced features

### 2. jsPDF - PDF Generation
**Package**: `jspdf` (v2.5.2)
**Purpose**: Create and export PDF files
**Usage**: Convert edited document lines to PDF

```typescript
import { jsPDF } from 'jspdf';

const doc = new jsPDF();
let y = 10;

lines.forEach(line => {
  doc.text(line.text, 10, y);
  y += 7;
});

doc.save('document.pdf');
```

**Pros**:
- Simple API
- Client-side generation
- No server required

**Cons**:
- Limited formatting options
- Manual text positioning
- Basic styling only

### 3. marked - Markdown Rendering
**Package**: `marked` (v14.1.2)
**Purpose**: Parse and render Markdown
**Usage**: Convert Markdown to HTML for preview

```typescript
import { marked } from 'marked';

const html = marked.parse(markdownText);
```

**Pros**:
- Fast and lightweight
- Standard Markdown support
- Extensible with plugins

**Cons**:
- Output is HTML, not Markdown
- Requires additional library for Markdown export

## Additional Preview Libraries (Recommended)

### 4. react-pdf - PDF Viewer
**Package**: `@react-pdf/renderer` or `react-pdf`
**Purpose**: Preview PDF files in React
**Installation**: `npm install react-pdf`

```typescript
import { Document, Page } from 'react-pdf';

<Document file={pdfUrl}>
  <Page pageNumber={1} />
</Document>
```

**Use Case**: Preview uploaded PDF files before editing

### 5. react-docx-preview
**Package**: `@cyntler/react-doc-viewer`
**Purpose**: Preview DOCX files in browser
**Installation**: `npm install @cyntler/react-doc-viewer`

```typescript
import DocViewer from '@cyntler/react-doc-viewer';

<DocViewer documents={[{ uri: docxUrl }]} />
```

**Use Case**: Preview uploaded DOCX files

### 6. file-saver - Download Helper
**Package**: `file-saver`
**Purpose**: Simplify file downloads
**Installation**: `npm install file-saver`

```typescript
import { saveAs } from 'file-saver';

saveAs(blob, 'document.docx');
```

**Use Case**: Handle all file downloads consistently

## Export Format Options

### DOCX Export Features
- Preserve paragraph structure
- Maintain line breaks
- Support basic formatting (bold, italic)
- Include page breaks
- Support headers/footers

### PDF Export Features
- Text positioning
- Page numbering
- Basic styling (fonts, colors)
- Auto page breaks
- Watermarks (optional)

### Markdown Export Features
- Preserve headers (#, ##, ###)
- Maintain lists and code blocks
- Keep links and formatting
- Simple text download

## API Integration Options

### 1. Google Docs API
**Purpose**: Advanced DOCX manipulation
**Requirements**: Google Cloud API key

```typescript
// Convert to Google Docs format
// Requires OAuth and API setup
```

**Pros**: Professional formatting, collaborative features
**Cons**: Requires authentication, API quotas

### 2. CloudConvert API
**Purpose**: Format conversion service
**Website**: cloudconvert.com
**Requirements**: API key

```typescript
// Convert between any formats
fetch('https://api.cloudconvert.com/v2/convert', {
  method: 'POST',
  body: JSON.stringify({
    inputformat: 'md',
    outputformat: 'docx',
    file: base64File
  })
});
```

**Pros**: Supports 200+ formats, server-side
**Cons**: Costs money, requires API calls

### 3. Pandoc (Server-Side)
**Purpose**: Universal document converter
**Requirements**: Pandoc installed on server

```bash
pandoc input.md -o output.docx
```

**Pros**: Best format conversion, free
**Cons**: Server-side only, requires installation

## Client-Side Rendering Libraries

### 1. Monaco Editor
**Package**: `@monaco-editor/react`
**Purpose**: Code/text editor with syntax highlighting
**Use Case**: Edit document with advanced features

### 2. Draft.js
**Package**: `draft-js`
**Purpose**: Rich text editor framework
**Use Case**: WYSIWYG document editing

### 3. Quill
**Package**: `quill`
**Purpose**: Modern rich text editor
**Use Case**: Formatted document editing

## File Upload/Preview Libraries

### 1. React Dropzone
**Package**: `react-dropzone`
**Purpose**: Drag-and-drop file upload
**Installation**: `npm install react-dropzone`

```typescript
import { useDropzone } from 'react-dropzone';

const { getRootProps, getInputProps } = useDropzone({
  accept: {
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/pdf': ['.pdf'],
    'text/markdown': ['.md']
  },
  onDrop: (files) => handleFiles(files)
});
```

### 2. Filepond
**Package**: `react-filepond`
**Purpose**: Beautiful file uploader
**Installation**: `npm install react-filepond filepond`

## Recommended Implementation Plan

### Phase 1: Basic Export (Current)
- [x] Markdown export (simple join)
- [ ] DOCX export with `docx` library
- [ ] PDF export with `jsPDF`

### Phase 2: Enhanced Export
- [ ] Preserve formatting in DOCX
- [ ] Better PDF layout with auto-pagination
- [ ] Support for images in export

### Phase 3: Preview Features
- [ ] PDF preview with `react-pdf`
- [ ] DOCX preview with `react-doc-viewer`
- [ ] Markdown preview with `marked` + custom renderer

### Phase 4: Advanced Features
- [ ] File conversion API integration
- [ ] Template support
- [ ] Batch export

## Implementation Notes

### Current Setup
The application already includes:
- `docx` - DOCX generation
- `jspdf` - PDF generation
- `marked` - Markdown parsing

### To Add
Recommended additions for better UX:
```bash
npm install file-saver react-dropzone @react-pdf/renderer
```

### Export Implementation Location
- `/src/lib/export/docx.ts` - DOCX export logic
- `/src/lib/export/pdf.ts` - PDF export logic
- `/src/lib/export/markdown.ts` - Markdown export logic
- `/src/lib/export/index.ts` - Main export router

## Browser Compatibility

All recommended libraries support:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Considerations

- **DOCX Export**: ~1-2s for 1000 lines
- **PDF Export**: ~500ms for 1000 lines
- **Markdown Export**: Instant (string join)

## Security Notes

- Sanitize file names before download
- Validate file sizes (max 10MB)
- Check MIME types on upload
- Scan for malicious content
- Use CSP headers for preview iframes
