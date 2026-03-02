/**
 * Generate a PDF buffer from course data (title, description, sections).
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const PDFDocument = require('pdfkit');

// ─── Color palette (professional) ───
const COLORS = {
  title: '#1E3A5F',        // Navy – main course title
  subtitle: '#64748B',     // Slate – description
  sectionTitle: '#1E40AF', // Indigo-800 – section titles
  sectionSub: '#4338CA',   // Indigo-700 – ## headings in content
  sectionH3: '#4F46E5',    // Indigo-600 – ### headings
  body: '#334155',         // Slate-700 – body text
  objectivesTitle: '#1E3A8A',
  objectivesText: '#1E293B',
  keyTakeawaysTitle: '#B45309',
  keyTakeawaysText: '#78350F',
  accent: '#4F46E5',
  lightBg: '#F8FAFC',
  border: '#E2E8F0',
};

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

/** Render content with heading hierarchy: # title, ## subtitle, ### h3, body text */
function renderContentWithHeadings(doc, content, width = 495) {
  const lines = content.split('\n');
  const opts = { width, lineGap: 2, paragraphGap: 3 };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      doc.moveDown(0.3);
      continue;
    }

    if (trimmed.startsWith('### ')) {
      doc.fontSize(10).fillColor(COLORS.sectionH3);
      renderRichText(doc, trimmed.slice(4), { ...opts, indent: 0 }, true);
      doc.moveDown(0.2);
    } else if (trimmed.startsWith('## ')) {
      doc.fontSize(11).fillColor(COLORS.sectionSub);
      renderRichText(doc, trimmed.slice(3), { ...opts, indent: 0 }, true);
      doc.moveDown(0.3);
    } else if (trimmed.startsWith('# ')) {
      doc.fontSize(12).fillColor(COLORS.sectionTitle);
      renderRichText(doc, trimmed.slice(2), { ...opts, indent: 0 }, true);
      doc.moveDown(0.3);
    } else {
      doc.fontSize(10).fillColor(COLORS.body);
      renderRichText(doc, trimmed, opts);
    }
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
      margin: 50,
      size: 'A4',
      bufferPages: true,
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

    const pageHeight = 842;
    const bottomMargin = 70;
    const contentWidth = 495;

    // ─── Cover / Header ───
    doc.rect(0, 0, 595, 90).fill('#1E3A5F');
    doc.rect(0, 0, 595, 86).fill('#1E40AF');
    doc.y = 28;
    doc.fontSize(26).font('Helvetica-Bold').fillColor('#FFFFFF').text(title, { align: 'center', width: contentWidth });
    doc.moveDown(0.2);
    if (description) {
      const shortDesc = stripMarkdown(description);
      doc.fontSize(11).font('Helvetica').fillColor('#93C5FD').text(shortDesc.length > 100 ? shortDesc.slice(0, 100) + '…' : shortDesc, { align: 'center', width: contentWidth });
    }
    doc.fillColor(COLORS.body);
    doc.y = 105;
    doc.moveDown(0.5);

    // ─── Description (full) ───
    if (description) {
      doc.fontSize(10).font('Helvetica').fillColor(COLORS.subtitle);
      renderRichText(doc, normalizeForPdf(description), { width: contentWidth, lineGap: 2 });
      doc.moveDown(1);
    }

    // ─── Learning objectives ───
    if (objectives.length) {
      const objLines = objectives.map((o) => '• ' + stripMarkdown(o));
      const objTitleH = 14;
      let objContentH = 6;
      doc.fontSize(10);
      objLines.forEach((line) => { objContentH += doc.heightOfString(line, { width: contentWidth - 24 }) + 3; });
      const objH = Math.max(44, objTitleH + objContentH + 16);
      const objY = doc.y;

      doc.roundedRect(50, objY, contentWidth, objH, 8).fill('#EEF2FF').stroke('#C7D2FE');
      doc.y = objY + 14;
      doc.fontSize(12).font('Helvetica-Bold').fillColor(COLORS.objectivesTitle).text('Objectifs d\'apprentissage', { width: contentWidth });
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.objectivesText);
      objectives.forEach((o) => renderRichText(doc, '• ' + o, { width: contentWidth - 12, indent: 12, lineGap: 2 }));
      doc.y = objY + objH + 12;
    }

    // ─── Sections ───
    sections.forEach((sec, i) => {
      if (doc.y > pageHeight - bottomMargin - 100) {
        doc.addPage();
        doc.y = 50;
      }

      const secTitle = `${i + 1}. ${sec.title || 'Section'}`;

      // Section header block
      const headerH = 32;
      const headerY = doc.y;
      doc.rect(50, headerY, 6, headerH).fill(COLORS.accent);
      doc.roundedRect(56, headerY, contentWidth - 6, headerH, 6).fill('#F1F5F9').stroke(COLORS.border);
      doc.y = headerY + 10;
      doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.sectionTitle).text(secTitle, { indent: 20, width: contentWidth - 20 });
      doc.y = headerY + headerH + 10;

      // Section content (with heading colors: # ## ###)
      const content = normalizeForPdf(sec.content || '');
      if (content) {
        renderContentWithHeadings(doc, content, contentWidth);
      }

      // Key takeaways
      if (sec.key_takeaways?.length) {
        doc.moveDown(0.6);
        const ktLines = sec.key_takeaways.map((t) => '• ' + stripMarkdown(t));
        let ktH = 20;
        doc.fontSize(9);
        ktLines.forEach((line) => { ktH += doc.heightOfString(line, { width: contentWidth - 24 }) + 2; });
        ktH = Math.max(36, ktH);
        const ktY = doc.y;

        doc.roundedRect(50, ktY, contentWidth, ktH, 6).fill('#FFFBEB').stroke('#FDE68A');
        doc.y = ktY + 10;
        doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.keyTakeawaysTitle).text('Points clés', { width: contentWidth });
        doc.font('Helvetica').fontSize(9).fillColor(COLORS.keyTakeawaysText);
        sec.key_takeaways.forEach((t) => renderRichText(doc, '• ' + t, { width: contentWidth - 12, indent: 12, lineGap: 2 }));
        doc.y = ktY + ktH + 10;
      }

      if (i < sections.length - 1) doc.moveDown(0.8);
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
 * Add footer with page numbers to buffered PDF pages.
 */
function addPageFooters(doc) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(9).font('Helvetica').fillColor('#9CA3AF');
    doc.text(`DigitAI · Page ${i + 1}/${range.count}`, 50, 842 - 25, { align: 'center', width: 495 });
    doc.fillColor('#000000');
  }
}

/**
 * Build a printable exam PDF for students (questions only, no answers).
 * @param {object} exam - { course_topic, difficulty, questions_json }
 * @param {object} [courseTopic] - optional display title
 * @returns {Promise<Buffer>}
 */
export function buildExamPdf(exam, courseTopic = '') {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      bufferPages: true,
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

    // —— Header: gradient-like layered bands ——
    doc.rect(0, 0, 595, 80).fill('#4338CA');
    doc.rect(0, 0, 595, 76).fill('#4F46E5');
    doc.y = 28;
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#FFFFFF').text(title, { align: 'center', width: 495 });
    doc.moveDown(0.25);
    doc.fontSize(11).font('Helvetica').fillColor('#C7D2FE').text(`${questions.length} question(s) · Difficulté: ${difficulty}`, { align: 'center' });
    doc.fillColor('#000000');
    doc.y = 95;
    doc.moveDown(0.5);

    // Student info box
    const boxY = doc.y;
    doc.roundedRect(50, boxY, 495, 42, 6).fill('#EEF2FF').stroke('#C7D2FE');
    doc.fillColor('#3730A3');
    doc.fontSize(10).font('Helvetica-Bold').text('Nom et prénom: _________________________________________', 60, boxY + 10, { width: 480 });
    doc.text('Date: _________________________', 60, boxY + 26, { width: 480 });
    doc.fillColor('#000000');
    doc.y = boxY + 42;
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor('#64748B').text("Répondez à toutes les questions. Cochez la case ou écrivez votre réponse dans l'espace prévu.", { align: 'left' });
    doc.fillColor('#000000');
    doc.moveDown(1.2);

    questions.forEach((q, i) => {
      const qTop = doc.y;
      const qNum = i + 1;

      // Separator line
      doc.rect(50, qTop - 4, 495, 1).fill('#E0E7FF');
      doc.y = qTop;

      // Question: indigo bar + number + text
      doc.rect(50, qTop - 2, 5, 24).fill('#4F46E5');
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1E293B').text(`${qNum}. ${stripMarkdown(q.question || '')}`, { align: 'left', lineGap: 3, indent: 12 });
      doc.moveDown(0.5);

      if (q.options && q.options.length > 0) {
        doc.font('Helvetica').fontSize(11).fillColor('#334155');
        q.options.forEach((opt, j) => {
          const letter = String.fromCharCode(65 + j);
          const optLabel = stripLeadingLetterPrefix(stripMarkdown(opt));
          const optY = doc.y + 6;
          doc.circle(58, optY, 4).stroke('#94A3B8');
          doc.text(`  ${letter}.  ${optLabel}`, { continued: false, lineGap: 2, indent: 12 });
        });
        doc.moveDown(0.6);
      } else {
        const answerBoxTop = doc.y + 4;
        const lineHeight = 16;
        const numLines = 5;
        doc.roundedRect(60, answerBoxTop, 475, lineHeight * numLines, 4).fill('#F8FAFC').stroke('#E2E8F0');
        for (let L = 0; L < numLines - 1; L++) {
          doc.moveTo(65, answerBoxTop + lineHeight * (L + 1)).lineTo(528, answerBoxTop + lineHeight * (L + 1)).stroke('#E2E8F0');
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
