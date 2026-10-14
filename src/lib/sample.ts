import type { CellValue } from '@/types';

// Generate a realistic sales dataset so the demo experience is rich out of the box.
export function sampleDataset(): { rows: Record<string, CellValue>[]; name: string; fileSize: number } {
  const regions = ['North', 'South', 'East', 'West', 'Central'];
  const categories = ['Electronics', 'Clothing', 'Home', 'Sports', 'Books', 'Toys'];
  const channels = ['Online', 'Retail', 'Wholesale'];
  const reps = ['Ava Chen', 'Liam Park', 'Noah Singh', 'Emma Lopez', 'Mia Tanaka'];
  const rows: Record<string, CellValue>[] = [];

  const start = new Date('2023-01-01').getTime();
  const span = 365 * 24 * 3600 * 1000;

  for (let i = 0; i < 240; i++) {
    const date = new Date(start + Math.floor(Math.random() * span));
    const month = date.getMonth();
    const seasonal = 1 + 0.4 * Math.sin((month / 12) * Math.PI * 2) + (month >= 10 ? 0.5 : 0);
    const region = pick(regions);
    const category = pick(categories);
    const units = Math.max(1, Math.round(randn(40, 25) * seasonal));
    const unitPrice = Math.round(20 + Math.random() * 180);
    const revenue = Math.round(units * unitPrice * (0.85 + Math.random() * 0.3));
    const profit = Math.round(revenue * (0.15 + Math.random() * 0.2));
    const discount = Math.random() < 0.3 ? Math.round(Math.random() * 25) : 0;
    const csat = Math.min(5, Math.max(1, randn(4.1, 0.7)));

    const row: Record<string, CellValue> = {
      OrderID: 1000 + i,
      Date: date.toISOString().slice(0, 10),
      Region: region,
      Category: category,
      Channel: pick(channels),
      SalesRep: pick(reps),
      Units: units,
      UnitPrice: unitPrice,
      Revenue: revenue,
      Profit: profit,
      Discount: discount,
      CSAT: Number(csat.toFixed(1)),
    };
    // inject some realistic issues
    if (Math.random() < 0.08) row.CSAT = null;
    if (Math.random() < 0.05) row.Profit = -Math.abs(profit) * 0.2;
    if (Math.random() < 0.04) row.Region = ` ${region}`; // stray whitespace
    rows.push(row);
  }
  // a few duplicates
  rows.push({ ...rows[3] });
  rows.push({ ...rows[17] });

  const csv = rowsToCsv(rows);
  return { rows, name: 'sample_sales_2023.csv', fileSize: new Blob([csv]).size };
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randn(mean: number, sd: number): number {
  return mean + sd * (Math.random() + Math.random() + Math.random() - 1.5) * 1.4;
}

function rowsToCsv(rows: Record<string, CellValue>[]): string {
  const cols = Object.keys(rows[0]);
  const header = cols.join(',');
  const lines = rows.map((r) => cols.map((c) => (r[c] === null ? '' : String(r[c]))).join(','));
  return [header, ...lines].join('\n');
}
