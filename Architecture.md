AGENTIC DOCUMENT EDITOR - COMPACT ARCHITECTURE
================================================

CORE FLOW:
Upload → Parse → Line-Index → Display → Chat+Cite → Edit → Export

COMPONENTS:

1. PARSER (Multi-format → Unified JSON)
   ├─ detectFormat(file) → docx|pdf|md|latex
   ├─ parse_docx() → lines[]  // python-docx
   ├─ parse_pdf() → lines[]   // pdf-parse, split by \n
   ├─ parse_md() → lines[]    // just split("\n")
   └─ normalize() → {lines: [{num, text, page, locked}], pages: [...]}

2. LINE INDEXER (Core data structure)
   Line = {
     lineNumber: int,        // unique ID
     text: string,
     pageNumber: int,        // for @p3 citations
     isLocked: bool,         // lock feature
     isPlaceholder: bool     // detected via regex: {{.*}}, [A-Z_]+, ___
   }

3. CITATION PARSER (Convert @refs to context)
   parseCitations(msg) → finds @line10, @p3, @l5-10
   resolveCitations(refs, doc) → extracts actual text
   Example: "@line10" → "Line 10: This is the text"

4. AGENT (OpenAI function calling)
   Tools:
   ├─ doc_search(query) → keyword match on lines[], return top 5
   ├─ doc_read(lines=[]) → return text at line numbers
   └─ doc_edit(op, lines[], new_text) → 
       if any(line.isLocked): reject
       else: update line.text, log change

   Flow per message:
   1. Parse citations → inject context
   2. Call GPT-4 with tools + context
   3. Execute tool calls
   4. Return response + actions taken

5. UI LAYOUT (Split-pane)
   Left: Document Viewer
   ├─ Render lines with line numbers
   ├─ Click = select (highlight blue)
   ├─ Right-click = context menu [Lock/Unlock]
   └─ Yellow bg if isPlaceholder

   Right: Chat
   ├─ Input: "Edit @line10 to say..."
   ├─ Display: User msg, Agent response, Actions taken
   └─ Auto-scroll to bottom

6. EXPORT (Reverse transform)
   ├─ to_docx() → python-docx, rebuild paragraphs from lines[]
   ├─ to_pdf() → jsPDF, text per line with y-offset
   └─ to_md() → just join(lines, "\n")

WHY EACH PART:
- Parser: Handle 4 formats → single structure
- Line indexer: Makes @line10 citations possible, enables locks
- Citation parser: Auto-inject context without manual copy-paste
- Agent: Autonomous search/edit, respects locks, tool use for precision
- UI split: See doc + chat simultaneously, direct line manipulation
- Export: Deliver edited doc in requested format

TECH STACK:
- Next.js (React + API routes in one)
- mammoth.js (docx parse), pdf-parse (pdf), marked (md)
- OpenAI SDK (agent)
- docx lib (export), jsPDF (export)
- Tailwind (styling)

FILE STRUCTURE:
/lib/parser.ts      → all parsers + normalize
/lib/citations.ts   → parse/resolve @refs
/lib/agent.ts       → DocumentAgent class
/components/DocViewer.tsx
/components/Chat.tsx
/app/page.tsx       → main app