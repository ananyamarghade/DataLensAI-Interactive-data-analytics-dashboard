import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import type { CellValue } from '@/types';

export interface ParsedFile {
  rows: Record<string, CellValue>[];
  name: string;
  fileSize: number;
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'json') return parseJson(file);
  if (ext === 'xlsx' || ext === 'xls') return parseExcel(file);
  return parseCsv(file);
}

function parseCsv(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, CellValue>>(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (res) => resolve({ rows: coerceRows(res.data), name: file.name, fileSize: file.size }),
      error: reject,
    });
  });
}

async function parseExcel(file: File): Promise<ParsedFile> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, CellValue>>(sheet, { raw: true, defval: null });
  return { rows: coerceRows(rows), name: file.name, fileSize: file.size };
}

async function parseJson(file: File): Promise<ParsedFile> {
  const text = await file.text();
  const raw = JSON.parse(text);
  let rows: Record<string, CellValue>[] = [];
  if (Array.isArray(raw)) {
    rows = raw.map((r) => (typeof r === 'object' && r !== null ? r : { value: r as CellValue }));
  } else if (raw && typeof raw === 'object') {
    // object of arrays or single record
    const first = Object.values(raw)[0];
    if (Array.isArray(first)) {
      const keys = Object.keys(raw);
      const len = (first as unknown[]).length;
      rows = Array.from({ length: len }, (_, i) =>
        Object.fromEntries(keys.map((k) => [k, (raw as Record<string, unknown[]>)[k][i] as CellValue])),
      );
    } else {
      rows = [raw as Record<string, CellValue>];
    }
  }
  return { rows: coerceRows(rows), name: file.name, fileSize: file.size };
}

function coerceRows(rows: Record<string, unknown>[]): Record<string, CellValue>[] {
  return rows.map((r) => {
    const out: Record<string, CellValue> = {};
    for (const [k, v] of Object.entries(r)) {
      if (v === undefined || v === null || (typeof v === 'string' && v === '')) out[k] = null;
      else if (v instanceof Date) out[k] = v.toISOString();
      else if (typeof v === 'number' && !Number.isFinite(v)) out[k] = null;
      else out[k] = v as CellValue;
    }
    return out;
  });
}

export function toCsv(rows: Record<string, CellValue>[]): string {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const header = cols.join(',');
  const lines = rows.map((r) => cols.map((c) => csvCell(r[c])).join(','));
  return [header, ...lines].join('\n');
}

function csvCell(v: CellValue): string {
  if (v === null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
