// Lightweight NumPy-style numeric helpers — vectorized stats over number[].
// Mirrors numpy.mean / std / percentile / corrcoef so the engine reads like Python.

export const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);

export function toNumbers(values: unknown[]): number[] {
  const out: number[] = [];
  for (const v of values) {
    if (isNum(v)) out.push(v);
    else if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v.replace(/[, $%]/g, ''));
      if (Number.isFinite(n)) out.push(n);
    }
  }
  return out;
}

export const mean = (a: number[]): number => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

export function median(a: number[]): number {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function mode(a: number[]): number {
  if (!a.length) return 0;
  const counts = new Map<number, number>();
  for (const x of a) counts.set(x, (counts.get(x) ?? 0) + 1);
  let best = a[0];
  let bestC = 0;
  for (const [v, c] of counts) if (c > bestC) { best = v; bestC = c; }
  return best;
}

export function variance(a: number[], ddof = 1): number {
  if (a.length <= ddof) return 0;
  const m = mean(a);
  return a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - ddof);
}

export const std = (a: number[], ddof = 1): number => Math.sqrt(variance(a, ddof));

export function percentile(a: number[], p: number): number {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const idx = (p / 100) * (s.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return s[lo];
  return s[lo] + (s[hi] - s[lo]) * (idx - lo);
}

export const min = (a: number[]): number => (a.length ? Math.min(...a) : 0);
export const max = (a: number[]): number => (a.length ? Math.max(...a) : 0);
export const range = (a: number[]): number => max(a) - min(a);
export const iqr = (a: number[]): number => percentile(a, 75) - percentile(a, 25);

export const cv = (a: number[]): number => {
  const m = mean(a);
  return m !== 0 ? std(a) / Math.abs(m) : 0;
};

export function mad(a: number[]): number {
  if (!a.length) return 0;
  const m = median(a);
  return median(a.map((x) => Math.abs(x - m)));
}

// Excess kurtosis (Fisher), 0 = normal.
export function kurtosis(a: number[]): number {
  if (a.length < 4) return 0;
  const m = mean(a);
  const v = variance(a, 0);
  if (v === 0) return 0;
  const s4 = a.reduce((s, x) => s + ((x - m) / Math.sqrt(v)) ** 4, 0) / a.length;
  return s4 - 3;
}

// Sample skewness (Fisher-Pearson).
export function skewness(a: number[]): number {
  if (a.length < 3) return 0;
  const m = mean(a);
  const s = std(a, 0);
  if (s === 0) return 0;
  const n = a.length;
  return (n / ((n - 1) * (n - 2))) * a.reduce((acc, x) => acc + ((x - m) / s) ** 3, 0);
}

export function zscore(a: number[]): number[] {
  const m = mean(a);
  const s = std(a);
  if (s === 0) return a.map(() => 0);
  return a.map((x) => (x - m) / s);
}

// Pearson correlation — numpy.corrcoef style.
export function correlation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const ma = mean(a);
  const mb = mean(b);
  let cov = 0;
  let va = 0;
  let vb = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - ma;
    const db = b[i] - mb;
    cov += da * db;
    va += da * da;
    vb += db * db;
  }
  const denom = Math.sqrt(va * vb);
  return denom === 0 ? 0 : cov / denom;
}

// IQR-based outlier count.
export function countOutliers(a: number[]): number {
  if (a.length < 4) return 0;
  const q1 = percentile(a, 25);
  const q3 = percentile(a, 75);
  const i = q3 - q1;
  const lo = q1 - 1.5 * i;
  const hi = q3 + 1.5 * i;
  return a.filter((x) => x < lo || x > hi).length;
}

// z-score outliers (|z| > 3).
export function countZscoreOutliers(a: number[]): number {
  if (a.length < 4) return 0;
  const z = zscore(a);
  return z.filter((v) => Math.abs(v) > 3).length;
}

export function normalize(a: number[]): number[] {
  const lo = min(a);
  const hi = max(a);
  const span = hi - lo;
  return span === 0 ? a.map(() => 0) : a.map((x) => (x - lo) / span);
}

export function histogram(a: number[], bins = 20): { x: number; y: number; label: string }[] {
  if (!a.length) return [];
  const lo = min(a);
  const hi = max(a);
  const span = hi - lo || 1;
  const width = span / bins;
  const counts = new Array(bins).fill(0);
  for (const x of a) {
    let idx = Math.floor((x - lo) / width);
    if (idx >= bins) idx = bins - 1;
    if (idx < 0) idx = 0;
    counts[idx]++;
  }
  return counts.map((c, i) => ({
    x: lo + i * width + width / 2,
    y: c,
    label: `${(lo + i * width).toFixed(1)}–${(lo + (i + 1) * width).toFixed(1)}`,
  }));
}

export function kde(a: number[], points = 60, bandwidth?: number): { x: number; y: number }[] {
  if (a.length < 2) return [];
  const lo = min(a);
  const hi = max(a);
  const span = hi - lo || 1;
  const h = bandwidth ?? (1.06 * std(a) * Math.pow(a.length, -0.2) || span * 0.1);
  const xs: number[] = [];
  for (let i = 0; i < points; i++) xs.push(lo + (span * i) / (points - 1));
  return xs.map((x) => ({
    x,
    y: a.reduce((s, v) => s + gaussian((x - v) / h), 0) / (a.length * h),
  }));
}

function gaussian(u: number): number {
  return Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
}

export function boxplotStats(a: number[]) {
  return {
    min: min(a),
    q1: percentile(a, 25),
    median: median(a),
    q3: percentile(a, 75),
    max: max(a),
    outliers: a.filter((x) => {
      const i = percentile(a, 75) - percentile(a, 25);
      return x < percentile(a, 25) - 1.5 * i || x > percentile(a, 75) + 1.5 * i;
    }),
  };
}

export function linearRegression(x: number[], y: number[]) {
  const n = Math.min(x.length, y.length);
  if (n < 2) return { slope: 0, intercept: mean(y), r2: 0, points: [] as { x: number; y: number; yhat: number }[] };
  const mx = mean(x);
  const my = mean(y);
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    sxx += (x[i] - mx) ** 2;
    sxy += (x[i] - mx) * (y[i] - my);
  }
  const slope = sxx === 0 ? 0 : sxy / sxx;
  const intercept = my - slope * mx;
  const r = correlation(x, y);
  const points = x.map((xi, i) => ({ x: xi, y: y[i], yhat: slope * xi + intercept }));
  return { slope, intercept, r2: r * r, points };
}
