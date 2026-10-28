import { injectable } from 'inversify';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import crypto from 'crypto';
import { ILeaseTemplate, ITemplateSection } from '../../models/LeaseTemplate.js';

export interface LeaseRenderInput {
  placeholders: Record<string, string>;
  template: ILeaseTemplate;
}

export interface LeaseRenderResult {
  pdf: Buffer;
  sha256: string;
}

@injectable()
export class PdfLibLeaseRenderer {
  async render(input: LeaseRenderInput): Promise<LeaseRenderResult> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = 11;
    const titleFontSize = 14;
    const margin = 50;
    const lineHeight = fontSize * 1.4;

    let page = doc.addPage([595.28, 841.89]); // A4
    let y = page.getHeight() - margin;

    // Title
    page.drawText(input.template.name, {
      x: margin,
      y,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    y -= 30;

    // Date line
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    page.drawText(`Date: ${dateStr}`, { x: margin, y, size: fontSize, font });
    y -= lineHeight * 2;

    // Sections
    const sorted = [...input.template.sections].sort((a, b) => a.order - b.order);
    for (const section of sorted) {
      // Section title
      if (y < margin + 60) {
        page = doc.addPage([595.28, 841.89]);
        y = page.getHeight() - margin;
      }
      page.drawText(section.title, { x: margin, y, size: titleFontSize, font: boldFont });
      y -= lineHeight * 1.5;

      // Replace placeholders in body
      let body = section.body;
      for (const [key, val] of Object.entries(input.placeholders)) {
        body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
      }

      // Word-wrap and draw
      const maxWidth = page.getWidth() - margin * 2;
      const lines = this.wordWrap(body, font, fontSize, maxWidth);
      for (const line of lines) {
        if (y < margin + 20) {
          page = doc.addPage([595.28, 841.89]);
          y = page.getHeight() - margin;
        }
        page.drawText(line, { x: margin, y, size: fontSize, font });
        y -= lineHeight;
      }
      y -= lineHeight;
    }

    // Signature block
    if (y < margin + 100) {
      page = doc.addPage([595.28, 841.89]);
      y = page.getHeight() - margin;
    }
    y -= lineHeight * 2;
    page.drawText('Owner Signature: ____________________________     Date: __________', {
      x: margin,
      y,
      size: fontSize,
      font,
    });
    y -= lineHeight * 2;
    page.drawText('Tenant Signature: ____________________________     Date: __________', {
      x: margin,
      y,
      size: fontSize,
      font,
    });

    const pdfBytes = await doc.save();
    const buffer = Buffer.from(pdfBytes);
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    return { pdf: buffer, sha256 };
  }

  private wordWrap(text: string, font: any, fontSize: number, maxWidth: number): string[] {
    const lines: string[] = [];
    const paragraphs = text.split('\n');
    for (const para of paragraphs) {
      if (para.trim() === '') {
        lines.push('');
        continue;
      }
      const words = para.split(' ');
      let current = '';
      for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        const width = font.widthOfTextAtSize(test, fontSize);
        if (width > maxWidth && current) {
          lines.push(current);
          current = word;
        } else {
          current = test;
        }
      }
      if (current) lines.push(current);
    }
    return lines;
  }
}
