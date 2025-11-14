/**
 * PDF Export - Convert document lines to PDF format with formatting preservation
 */

import { jsPDF } from 'jspdf';
import { Document, Line } from '../parsers/types';

const PAGE_WIDTH = 210; // A4 width in mm
const PAGE_HEIGHT = 297; // A4 height in mm
const MARGIN = 20;
const LINE_HEIGHT = 7;
const MAX_WIDTH = PAGE_WIDTH - (MARGIN * 2);

/**
 * Apply line formatting to PDF document
 */
function applyLineFormatting(doc: jsPDF, line: Line): void {
  const formatting = line.formatting;

  // Set font size
  const fontSize = formatting?.fontSize || 11;
  doc.setFontSize(fontSize);

  // Set font style (bold/italic)
  let fontStyle: string = 'normal';
  if (formatting?.bold && formatting?.italic) {
    fontStyle = 'bolditalic';
  } else if (formatting?.bold) {
    fontStyle = 'bold';
  } else if (formatting?.italic) {
    fontStyle = 'italic';
  }

  // Set font with style
  const fontFamily = formatting?.fontFamily || 'helvetica';
  doc.setFont(fontFamily, fontStyle);

  // Set text color if specified
  if (formatting?.color) {
    const color = formatting.color.replace('#', '');
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    doc.setTextColor(r, g, b);
  } else {
    doc.setTextColor(0, 0, 0); // Default black
  }
}

/**
 * Export document to PDF format
 */
export function exportToPdf(document: Document): Blob {
  try {
    console.info('[PDF_EXPORT] Starting PDF export');

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let y = MARGIN;
    let pageNumber = 1;

    // Process each line with formatting
    document.lines.forEach((line) => {
      // Check if we need a new page
      if (y > PAGE_HEIGHT - MARGIN) {
        doc.addPage();
        y = MARGIN;
        pageNumber++;
      }

      // Apply line formatting
      applyLineFormatting(doc, line);

      // Handle long lines (wrap text)
      const text = line.text || ' ';

      // Calculate alignment X position
      const formatting = line.formatting;
      let xPos = MARGIN;
      let textAlign: 'left' | 'center' | 'right' | 'justify' = 'left';

      if (formatting?.alignment === 'center') {
        xPos = PAGE_WIDTH / 2;
        textAlign = 'center';
      } else if (formatting?.alignment === 'right') {
        xPos = PAGE_WIDTH - MARGIN;
        textAlign = 'right';
      }

      const wrappedLines = doc.splitTextToSize(text, MAX_WIDTH);

      // Add each split line
      wrappedLines.forEach((textLine: string) => {
        if (y > PAGE_HEIGHT - MARGIN) {
          doc.addPage();
          y = MARGIN;
          pageNumber++;
          // Reapply formatting after page break
          applyLineFormatting(doc, line);
        }

        doc.text(textLine, xPos, y, { align: textAlign });
        y += LINE_HEIGHT;
      });
    });

    // Add page numbers
    const totalPages = pageNumber;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${totalPages}`,
        PAGE_WIDTH / 2,
        PAGE_HEIGHT - 10,
        { align: 'center' }
      );
    }

    // Generate blob
    const blob = doc.output('blob');

    console.info(`[PDF_EXPORT] Successfully exported ${document.lines.length} lines to PDF (${totalPages} pages)`);

    return blob;

  } catch (error) {
    console.error('[PDF_EXPORT] Error exporting to PDF:', error);
    throw new Error(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download PDF file
 */
export function downloadPdf(blob: Blob, fileName: string): void {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.info(`[PDF_EXPORT] Downloaded file: ${link.download}`);

  } catch (error) {
    console.error('[PDF_EXPORT] Error downloading PDF:', error);
    throw new Error(`Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
