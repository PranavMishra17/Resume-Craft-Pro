/**
 * DOCX Export - Convert document lines to DOCX format
 */

import { Document as DocxDocument, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { Document } from '../parsers/types';

/**
 * Export document to DOCX format with formatting preservation
 */
export async function exportToDocx(document: Document): Promise<Blob> {
  try {
    console.info('[DOCX_EXPORT] Starting DOCX export');

    // Create paragraphs from lines with formatting
    const paragraphs = document.lines.map(line => {
      const formatting = line.formatting;

      // Build TextRun with formatting
      const textRun = new TextRun({
        text: line.text || ' ', // Empty lines need at least a space
        bold: formatting?.bold || false,
        italics: formatting?.italic || false,
        underline: formatting?.underline ? {} : undefined,
        size: formatting?.fontSize ? formatting.fontSize * 2 : undefined, // docx uses half-points
        font: formatting?.fontFamily || undefined,
        color: formatting?.color ? formatting.color.replace('#', '') : undefined
      });

      // Build paragraph with alignment
      const paragraph = new Paragraph({
        children: [textRun],
        spacing: {
          after: 100 // Small spacing between lines
        },
        alignment: formatting?.alignment === 'center'
          ? AlignmentType.CENTER
          : formatting?.alignment === 'right'
          ? AlignmentType.RIGHT
          : formatting?.alignment === 'justify'
          ? AlignmentType.JUSTIFIED
          : AlignmentType.LEFT
      });

      return paragraph;
    });

    // Create document
    const doc = new DocxDocument({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720,    // 0.5 inch
                right: 720,
                bottom: 720,
                left: 720
              }
            }
          },
          children: paragraphs
        }
      ]
    });

    // Generate blob
    const blob = await Packer.toBlob(doc);

    console.info(`[DOCX_EXPORT] Successfully exported ${document.lines.length} lines to DOCX`);

    return blob;

  } catch (error) {
    console.error('[DOCX_EXPORT] Error exporting to DOCX:', error);
    throw new Error(`Failed to export DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download DOCX file
 */
export function downloadDocx(blob: Blob, fileName: string): void {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.docx') ? fileName : `${fileName}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.info(`[DOCX_EXPORT] Downloaded file: ${link.download}`);

  } catch (error) {
    console.error('[DOCX_EXPORT] Error downloading DOCX:', error);
    throw new Error(`Failed to download DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
