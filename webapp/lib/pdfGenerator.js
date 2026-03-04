/**
 * Generate a PDF buffer from course data (title, description, sections).
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const PDFDocument = require('pdfkit');

// ─── Color palette (professional) ───
const COLORS = {
  title: '#1E3A5F',
  subtitle: '#64748B',
  sectionTitle: '#1E40AF',
  sectionSub: '#4338CA',
  sectionH3: '#4F46E5',
  body: '#334155',
  objectivesTitle: '#1E3A8A',
  objectivesText: '#1E293B',
  keyTakeawaysTitle: '#B45309',
  keyTakeawaysText: '#78350F',
  accent: '#4F46E5',
  lightBg: '#F8FAFC',
  border: '#E2E8F0',
};

const PAGE_HEIGHT = 842;
const PAGE_WIDTH = 595;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2; // 495
const FOOTER_HEIGHT = 30; // space reserved for footer at bottom
const USABLE_BOTTOM = PAGE_HEIGHT - FOOTER_HEIGHT; // 812

/** Strip markdown except ** and * (we render bold/italic in PDF) */
const stripMarkdown = (text) => {
  if (typeof text !== 'string') return '';
  return text
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
};

/** Parse inline **bold** and *italic* into segments for PDFKit rich text */
function parseBoldItalic(text) {
  if (typeof text !== 'string') return [{ type: 'normal', text: '' }];
  const segments = [];
  let s = text;

  while (s.length > 0) {
    const boldOpen = s.indexOf('**');
    const italicOpen = s.indexOf('*');

    if (boldOpen === -1 && italicOpen === -1) {
      segments.push({ type: 'normal', text: s });
      break;
    }

    const nextBold = boldOpen >= 0 ? boldOpen : 1e9;
    const nextItalic = italicOpen >= 0 ? italicOpen : 1e9;

    if (nextBold <= nextItalic) {
      if (boldOpen > 0) segments.push({ type: 'normal', text: s.slice(0, boldOpen) });
      const boldClose = s.indexOf('**', boldOpen + 2);
      if (boldClose >= 0) {
        segments.push({ type: 'bold', text: s.slice(boldOpen + 2, boldClose) });
        s = s.slice(boldClose + 2);
      } else {
        segments.push({ type: 'normal', text: s.slice(boldOpen) });
        break;
      }
    } else {
      if (italicOpen > 0) segments.push({ type: 'normal', text: s.slice(0, italicOpen) });
      const italicClose = s.indexOf('*', italicOpen + 1);
      if (italicClose >= 0 && italicClose !== italicOpen + 1) {
        segments.push({ type: 'italic', text: s.slice(italicOpen + 1, italicClose) });
        s = s.slice(italicClose + 1);
      } else {
        segments.push({ type: 'normal', text: s.slice(italicOpen) });
        break;
      }
    }
  }
  return segments;
}

/** Render text with **bold** and *italic* using PDFKit continued */
function renderRichText(doc, text, opts = {}, baseBold = false) {
  const segments = parseBoldItalic(stripMarkdown(text));
  const baseOpts = { ...opts, continued: false };
  const normalFont = baseBold ? 'Helvetica-Bold' : 'Helvetica';
  const italicFont = baseBold ? 'Helvetica-BoldOblique' : 'Helvetica-Oblique';

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const isLast = i === segments.length - 1;
    const segOpts = { ...baseOpts, continued: !isLast };

    if (seg.type === 'bold') doc.font('Helvetica-Bold').text(seg.text, segOpts);
    else if (seg.type === 'italic') doc.font(italicFont).text(seg.text, segOpts);
    else doc.font(normalFont).text(seg.text, segOpts);
  }
  doc.font('Helvetica');
}

const normalizeForPdf = (text) => {
  if (typeof text !== 'string') return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n+$/g, '')
    .trim();
};

/**
 * Check if we need a new page and add one if so.
 * @param {object} doc - PDFKit doc
 * @param {number} neededHeight - estimated height of upcoming block
 */
function ensureSpace(doc, neededHeight = 60) {
  if (doc.y + neededHeight > USABLE_BOTTOM) {
    doc.addPage();
  }
}

/** Render content with heading hierarchy: # title, ## subtitle, ### h3, body text */
function renderContentWithHeadings(doc, content, width = CONTENT_WIDTH) {
  const lines = content.split('\n');
  const opts = { width, lineGap: 2, paragraphGap: 3 };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      // Only move down if we're not near the bottom
      if (doc.y + 12 < USABLE_BOTTOM) doc.moveDown(0.3);
      continue;
    }

    if (trimmed.startsWith('### ')) {
      ensureSpace(doc, 24);
      doc.fontSize(10).fillColor(COLORS.sectionH3);
      renderRichText(doc, trimmed.slice(4), { ...opts, indent: 0 }, true);
      if (doc.y + 8 < USABLE_BOTTOM) doc.moveDown(0.2);
    } else if (trimmed.startsWith('## ')) {
      ensureSpace(doc, 28);
      doc.fontSize(11).fillColor(COLORS.sectionSub);
      renderRichText(doc, trimmed.slice(3), { ...opts, indent: 0 }, true);
      if (doc.y + 10 < USABLE_BOTTOM) doc.moveDown(0.3);
    } else if (trimmed.startsWith('# ')) {
      ensureSpace(doc, 32);
      doc.fontSize(12).fillColor(COLORS.sectionTitle);
      renderRichText(doc, trimmed.slice(2), { ...opts, indent: 0 }, true);
      if (doc.y + 10 < USABLE_BOTTOM) doc.moveDown(0.3);
    } else {
      ensureSpace(doc, 16);
      doc.fontSize(10).fillColor(COLORS.body);
      renderRichText(doc, trimmed, opts);
    }
  }
}

/**
 * Add footer with page numbers to all buffered pages.
 * Uses raw PDF content stream (page.write) to avoid triggering new page creation.
 * Must be called after all content is written, before doc.end().
 */
function addPageFooters(doc) {
  const range = doc.bufferedPageRange();
  const total = range.count;
  for (let i = 0; i < total; i++) {
    doc.switchToPage(range.start + i);
    const label = `DigitAI   \u00B7   Page ${i + 1} / ${total}`;
    // Write directly to the page's PDF content stream — bypasses PDFKit's text engine
    // so it NEVER creates an extra page. PDF y-axis is bottom-up: 842 - pdfkit_y = pdf_y.
    const pdfY = 20; // 842 - 822 = 20 from bottom of A4
    const pdfX = 50;
    const safe = label.replace(/[()\\]/g, '\\$&');
    doc.page.write(
      `q\nBT\n/Helvetica 9 Tf\n0.6 0.6 0.6 rg\n${pdfX} ${pdfY} Td\n(${safe}) Tj\nET\nQ\n`
    );
  }
}

/**
 * Build a professional course PDF with clear hierarchy and colors.
 * @param {object} course - { topic, content_json }
 * @returns {Promise<Buffer>}
 */
export function buildCoursePdf(course) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: MARGIN,
      size: 'A4',
      bufferPages: true,
      autoFirstPage: true,
      info: { Title: '', Author: '', Subject: '', Creator: 'DigitAI' },
    });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    let data = { outline: {}, sections: [] };
    try {
      data = typeof course.content_json === 'string' ? JSON.parse(course.content_json) : course.content_json;
    } catch {}

    const title = data.outline?.title || course.topic || 'Course';
    const description = data.outline?.description || '';
    const objectives = data.outline?.learning_objectives || [];
    const sections = data.sections || [];

    // ─── Cover / Header band ───
    doc.rect(0, 0, PAGE_WIDTH, 90).fill('#1E3A5F');
    doc.rect(0, 0, PAGE_WIDTH, 86).fill('#1E40AF');
    doc.y = 28;
    doc.fontSize(26).font('Helvetica-Bold').fillColor('#FFFFFF')
      .text(title, { align: 'center', width: CONTENT_WIDTH });
    doc.moveDown(0.2);
    if (description) {
      const shortDesc = stripMarkdown(description);
      doc.fontSize(11).font('Helvetica').fillColor('#93C5FD')
        .text(
          shortDesc.length > 100 ? shortDesc.slice(0, 100) + '…' : shortDesc,
          { align: 'center', width: CONTENT_WIDTH }
        );
    }
    doc.fillColor(COLORS.body);
    doc.y = 105;
    doc.moveDown(0.5);

    // ─── Description (full) ───
    if (description) {
      ensureSpace(doc, 30);
      doc.fontSize(10).font('Helvetica').fillColor(COLORS.subtitle);
      renderRichText(doc, normalizeForPdf(description), { width: CONTENT_WIDTH, lineGap: 2 });
      doc.moveDown(1);
    }

    // ─── Learning objectives ───
    if (objectives.length) {
      doc.fontSize(10);
      const objLines = objectives.map((o) => '• ' + stripMarkdown(o));
      let objContentH = 6;
      objLines.forEach((line) => {
        objContentH += doc.heightOfString(line, { width: CONTENT_WIDTH - 24 }) + 3;
      });
      const objH = Math.max(44, 14 + objContentH + 16);

      ensureSpace(doc, objH + 16);
      const objY = doc.y;

      doc.roundedRect(MARGIN, objY, CONTENT_WIDTH, objH, 8).fill('#EEF2FF').stroke('#C7D2FE');
      doc.y = objY + 14;
      doc.fontSize(12).font('Helvetica-Bold').fillColor(COLORS.objectivesTitle)
        .text('Objectifs d\'apprentissage', { width: CONTENT_WIDTH });
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.objectivesText);
      objectives.forEach((o) =>
        renderRichText(doc, '• ' + o, { width: CONTENT_WIDTH - 12, indent: 12, lineGap: 2 })
      );
      doc.y = objY + objH + 12;
    }

    // ─── Sections ───
    sections.forEach((sec, i) => {
      // Always start a section with enough room for the header
      ensureSpace(doc, 80);

      const secTitle = `${i + 1}. ${sec.title || 'Section'}`;

      // Section header block
      const headerH = 32;
      const headerY = doc.y;
      doc.rect(MARGIN, headerY, 6, headerH).fill(COLORS.accent);
      doc.roundedRect(MARGIN + 6, headerY, CONTENT_WIDTH - 6, headerH, 6)
        .fill('#F1F5F9').stroke(COLORS.border);
      doc.y = headerY + 10;
      doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.sectionTitle)
        .text(secTitle, { indent: 20, width: CONTENT_WIDTH - 20 });
      doc.y = headerY + headerH + 10;

      // Section content
      const content = normalizeForPdf(sec.content || '');
      if (content) {
        renderContentWithHeadings(doc, content, CONTENT_WIDTH);
      }

      // Key takeaways
      if (sec.key_takeaways?.length) {
        doc.fontSize(9);
        const ktLines = sec.key_takeaways.map((t) => '• ' + stripMarkdown(t));
        let ktH = 20;
        ktLines.forEach((line) => { ktH += doc.heightOfString(line, { width: CONTENT_WIDTH - 24 }) + 2; });
        ktH = Math.max(36, ktH);

        ensureSpace(doc, ktH + 16);
        if (doc.y + 8 < USABLE_BOTTOM) doc.moveDown(0.6);
        const ktY = doc.y;

        doc.roundedRect(MARGIN, ktY, CONTENT_WIDTH, ktH, 6).fill('#FFFBEB').stroke('#FDE68A');
        doc.y = ktY + 10;
        doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.keyTakeawaysTitle)
          .text('Points clés', { width: CONTENT_WIDTH });
        doc.font('Helvetica').fontSize(9).fillColor(COLORS.keyTakeawaysText);
        sec.key_takeaways.forEach((t) =>
          renderRichText(doc, '• ' + t, { width: CONTENT_WIDTH - 12, indent: 12, lineGap: 2 })
        );
        doc.y = ktY + ktH + 10;
      }

      if (i < sections.length - 1 && doc.y + 20 < USABLE_BOTTOM) doc.moveDown(0.8);
    });

    addPageFooters(doc);
    doc.end();
  });
}

/**
 * Remove leading "A. ", "B. ", etc. from option text to avoid "A. A. Answer".
 */
function stripLeadingLetterPrefix(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/^[A-Za-z]\)\s*/, '').replace(/^[A-Za-z]\.\s*/, '').trim();
}

/**
 * Build a printable exam PDF for students (questions only, no answers).
 * @param {object} exam - { course_topic, difficulty, questions_json }
 * @param {string} [courseTopic] - optional display title
 * @returns {Promise<Buffer>}
 */
export function buildExamPdf(exam, courseTopic = '') {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: MARGIN,
      size: 'A4',
      bufferPages: true,
      autoFirstPage: true,
      info: { Title: '', Author: '', Subject: '', Creator: 'DigitAI' },
    });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    let questions = [];
    try {
      const q = typeof exam.questions_json === 'string' ? JSON.parse(exam.questions_json) : exam.questions_json;
      questions = Array.isArray(q) ? q : [];
    } catch {}

    const title = courseTopic || exam.course_topic || 'Exam';
    const difficulty = exam.difficulty || 'mixed';

    // —— Header ——
    doc.rect(0, 0, PAGE_WIDTH, 80).fill('#4338CA');
    doc.rect(0, 0, PAGE_WIDTH, 76).fill('#4F46E5');
    doc.y = 28;
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#FFFFFF')
      .text(title, { align: 'center', width: CONTENT_WIDTH });
    doc.moveDown(0.25);
    doc.fontSize(11).font('Helvetica').fillColor('#C7D2FE')
      .text(`${questions.length} question(s) · Difficulté: ${difficulty}`, { align: 'center' });
    doc.fillColor('#000000');
    doc.y = 95;
    doc.moveDown(0.5);

    // Student info box
    ensureSpace(doc, 60);
    const boxY = doc.y;
    doc.roundedRect(MARGIN, boxY, CONTENT_WIDTH, 42, 6).fill('#EEF2FF').stroke('#C7D2FE');
    doc.fillColor('#3730A3');
    doc.fontSize(10).font('Helvetica-Bold')
      .text('Nom et prénom: _________________________________________', 60, boxY + 10, { width: 480 });
    doc.text('Date: _________________________', 60, boxY + 26, { width: 480 });
    doc.fillColor('#000000');
    doc.y = boxY + 42;
    doc.moveDown(0.5);

    ensureSpace(doc, 24);
    doc.fontSize(9).fillColor('#64748B')
      .text("Répondez à toutes les questions. Cochez la case ou écrivez votre réponse dans l'espace prévu.", { align: 'left' });
    doc.fillColor('#000000');
    doc.moveDown(1.2);

    questions.forEach((q, i) => {
      // Estimate how much space this question needs
      const isOpenEnded = !q.options || q.options.length === 0;
      const estimatedH = isOpenEnded ? 140 : 60 + (q.options?.length || 0) * 22;
      ensureSpace(doc, estimatedH);

      const qTop = doc.y;
      const qNum = i + 1;

      // Separator line
      doc.rect(MARGIN, qTop - 4, CONTENT_WIDTH, 1).fill('#E0E7FF');
      doc.y = qTop;

      // Question bar + text
      doc.rect(MARGIN, qTop - 2, 5, 24).fill('#4F46E5');
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1E293B')
        .text(`${qNum}. ${stripMarkdown(q.question || '')}`, { align: 'left', lineGap: 3, indent: 12 });
      doc.moveDown(0.5);

      if (q.options && q.options.length > 0) {
        doc.font('Helvetica').fontSize(11).fillColor('#334155');
        q.options.forEach((opt, j) => {
          const letter = String.fromCharCode(65 + j);
          const optLabel = stripLeadingLetterPrefix(stripMarkdown(opt));
          const optY = doc.y + 6;
          ensureSpace(doc, 22);
          doc.circle(58, optY, 4).stroke('#94A3B8');
          doc.text(`  ${letter}.  ${optLabel}`, { continued: false, lineGap: 2, indent: 12 });
        });
        doc.moveDown(0.6);
      } else {
        ensureSpace(doc, 90);
        const answerBoxTop = doc.y + 4;
        const lineHeight = 16;
        const numLines = 5;
        doc.roundedRect(60, answerBoxTop, 475, lineHeight * numLines, 4).fill('#F8FAFC').stroke('#E2E8F0');
        for (let L = 0; L < numLines - 1; L++) {
          doc.moveTo(65, answerBoxTop + lineHeight * (L + 1))
            .lineTo(528, answerBoxTop + lineHeight * (L + 1))
            .stroke('#E2E8F0');
        }
        doc.y = answerBoxTop + lineHeight * numLines;
        doc.moveDown(0.5);
        doc.fillColor('#000000');
      }
      doc.moveDown(0.8);
    });

    addPageFooters(doc);
    doc.end();
  });
}

// ─── Color palette (professional) ───
