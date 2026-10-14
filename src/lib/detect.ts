import type { CellValue, ColumnType } from '@/types';

const DATE_PATTERNS = [
  /^\d{4}-\d{1,2}-\d{1,2}([ T]\d{1,2}:\d{2}(:\d{2})?)?$/,
  /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,
  /^\d{1,2}-\d{1,2}-\d{2,4}$/,
  /^\d{4}\/\d{1,2}\/\d{1,2}$/,
];

const BOOL_TRUE = new Set(['true', 'false', 'yes', 'no', '0', '1', 'y', 'n']);

export function detectType(values: CellValue[]): ColumnType {
  const nonNull = values.filter((v) => v !== null && v !== '' && v !== undefined);
  if (!nonNull.length) return 'unknown';

  let numeric = 0;
  let datetime = 0;
  let bool = 0;
  const sample = nonNull.slice(0, 200);

  for (const v of sample) {
    const s = String(v).trim();
    if (s === '') continue;
    if (typeof v === 'number' || /^-?\d+(\.\d+)?$/.test(s.replace(/[, $%]/g, ''))) {
      numeric++;
      continue;
    }
    if (DATE_PATTERNS.some((p) => p.test(s)) && !isNaN(Date.parse(s))) {
      datetime++;
      continue;
    }
    if (BOOL_TRUE.has(s.toLowerCase())) bool++;
  }

  const n = sample.length;
  if (bool / n > 0.9) return 'boolean';
  if (datetime / n > 0.7) return 'datetime';
  if (numeric / n > 0.8) return 'numeric';
  return 'categorical';
}

export function uniqueCount(values: CellValue[]): number {
  return new Set(values.filter((v) => v !== null && v !== '' && v !== undefined).map((v) => String(v))).size;
}

export function isLikelyId(values: CellValue[]): boolean {
  const nonNull = values.filter((v) => v !== null && v !== '');
  if (nonNull.length === 0) return false;
  const uniq = uniqueCount(values);
  // unique integer-like column ~ row count → likely an id/index
  return uniq === nonNull.length && uniq > 20;
}
