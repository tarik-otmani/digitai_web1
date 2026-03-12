/**
 * Extract text from uploaded files (PDF, DOCX, TXT, MD).
 */
import fs from 'fs/promises';
import path from 'path';
import { createRequire } from 'module';
import mammoth from 'mammoth';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const SUPPORTED_EXT = ['txt', 'md', 'pdf', 'docx'];

export function isSupported(filename) {
  const ext = path.extname(filename || '').slice(1).toLowerCase();
  return SUPPORTED_EXT.includes(ext);
}

export async function extractText(filePath, filename) {
  const ext = path.extname(filename || filePath || '').slice(1).toLowerCase();
  const buffer = await fs.readFile(filePath);

  switch (ext) {
    case 'txt':
    case 'md':
      return buffer.toString('utf8');
    case 'pdf': {
      const data = await pdf(buffer);
      return data.text || '';
    }
    case 'docx': {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    }
    default:
      throw new Error(`Unsupported format: ${ext}`);
  }
}
