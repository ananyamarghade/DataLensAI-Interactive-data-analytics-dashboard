import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter, PieChart, Pie, Cell,
  RadialBarChart, RadialBar, ComposedChart, ZAxis, Legend,
} from 'recharts';
import { toNumbers, histogram, kde, boxplotStats, linearRegression, correlation } from '@/lib/stats';
import type { CellValue } from '@/types';
import { ChartFrame, ChartModal } from '@/components/ui/ChartModal';
import { saveAs } from 'file-saver';

const PALETTE = ['#1ba87f', '#3cc49b', '#f59e0b', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#06b6d4'];

const axisStyle = { fontSize: 11, fill: '#6b7283' };
const gridColor = 'rgba(255,255,255,0.05)';

const tooltipStyle = {
  backgroundColor: '#16181d',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  fontSize: 12,
  color: '#eef0f4',
};

function downloadCsv(data: Record<string, unknown>[], name: string) {
  if (!data.length) return;
  const cols = Object.keys(data[0]);
  const header = cols.join(',');
  const lines = data.map((r) => cols.map((c) => String(r[c] ?? '')).join(','));
  const csv = [header, ...lines].join('\n');
  saveAs(new Blob([csv], { type: 'text/csv' }), `${name}.csv`);
}

/* ---------- Histogram ---------- */
export function HistogramChart({ values, name }: { values: CellValue[]; name: string }) {
  const [open, setOpen] = useState(false);
  const data = useMemo(() => histogram(toNumbers(values), 20), [values]);
  const full = useMemo(() => histogram(toNumbers(values), 40), [values]);
  return (
    <>
      <ChartFrame title={`${name} — Histogram`} subtitle="Distribution frequency" onExpand={() => setOpen(true)} onDownload={() => downloadCsv(data, `histogram_${name}`)}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
            <CartesianGrid stroke={gridColor} vertical={false} />
            <XAxis dataKey="label" tick={axisStyle} angle={-30} textAnchor="end" height={50} interval={3} />
            <YAxis tick={axisStyle} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="y" fill="#1ba87f" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
      <ChartModal open={open} onClose={() => setOpen(false)} title={`${name} — Histogram`} onDownload={() => downloadCsv(full, `histogram_${name}`)}>
        <div className="h-[60vh]">
          <ResponsiveContainer>
            <BarChart data={full} margin={{ top: 8, right: 8, bottom: 24, left: 0 }}>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis dataKey="label" tick={axisStyle} angle={-30} textAnchor="end" height={60} interval={2} />
              <YAxis tick={axisStyle} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="y" fill="#1ba87f" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartModal>
    </>
  );
}

/* ---------- Density (KDE) ---------- */
export function DensityChart({ values, name }: { values: CellValue[]; name: string }) {
  const [open, setOpen] = useState(false);
  const data = useMemo(() => kde(toNumbers(values), 80), [values]);
  return (
    <>
      <ChartFrame title={`${name} — Density`} subtitle="Kernel density estimate" onExpand={() => setOpen(true)} onDownload={() => downloadCsv(data, `density_${name}`)}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
            <defs>
              <linearGradient id={`dens-${name}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1ba87f" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#1ba87f" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={gridColor} vertical={false} />
            <XAxis dataKey="x" tick={axisStyle} tickFormatter={(v) => v.toFixed(1)} />
            <YAxis tick={axisStyle} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="y" stroke="#1ba87f" strokeWidth={2} fill={`url(#dens-${name})`} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartFrame>
      <ChartModal open={open} onClose={() => setOpen(false)} title={`${name} — Density`} onDownload={() => downloadCsv(data, `density_${name}`)}>
        <div className="h-[60vh]">
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
              <defs>
                <linearGradient id={`dens-${name}-full`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1ba87f" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#1ba87f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis dataKey="x" tick={axisStyle} tickFormatter={(v) => v.toFixed(1)} />
              <YAxis tick={axisStyle} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="y" stroke="#1ba87f" strokeWidth={2} fill={`url(#dens-${name}-full)`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartModal>
    </>
  );
}

/* ---------- Box Plot (simulated via composed) ---------- */
export function BoxPlotChart({ values, name }: { values: CellValue[]; name: string }) {
  const [open, setOpen] = useState(false);
  const stats = useMemo(() => boxplotStats(toNumbers(values)), [values]);
  const data = [{ name, ...stats, box: [stats.q1, stats.q3] as number[] }];
  return (
    <>
      <ChartFrame title={`${name} — Box Plot`} subtitle="Quartiles & outliers" onExpand={() => setOpen(true)}>
        <ResponsiveContainer>
          <ComposedChart data={data} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 16 }}>
            <CartesianGrid stroke={gridColor} horizontal={false} />
            <XAxis type="number" tick={axisStyle} />
            <YAxis type="category" dataKey="name" tick={axisStyle} width={60} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="box" barSize={28} fill="rgba(28,168,127,0.25)" radius={4} />
            <Line dataKey="median" stroke="#1ba87f" strokeWidth={2} dot={{ r: 4 }} />
            <Line dataKey="min" stroke="#6b7283" strokeWidth={1} dot={{ r: 3 }} />
            <Line dataKey="max" stroke="#6b7283" strokeWidth={1} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartFrame>
      <ChartModal open={open} onClose={() => setOpen(false)} title={`${name} — Box Plot`}>
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          {[
            ['Min', stats.min], ['Q1', stats.q1], ['Median', stats.median], ['Q3', stats.q3],
            ['Max', stats.max], ['IQR', stats.q3 - stats.q1], ['Outliers', stats.outliers.length], ['Range', stats.max - stats.min],
          ].map(([k, v]) => (
            <div key={k as string} className="card p-3">
              <div className="section-title">{k}</div>
              <div className="mt-1 text-lg font-semibold text-ink-50">{Number(v).toFixed(2)}</div>
            </div>
          ))}
        </div>
      </ChartModal>
    </>
  );
}

/* ---------- Bar Chart (categorical) ---------- */
export function CategoricalBarChart({ values, name, horizontal = false }: { values: CellValue[]; name: string; horizontal?: boolean }) {
  const [open, setOpen] = useState(false);
  const data = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of values) {
      if (v === null || v === '') continue;
      const k = String(v);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 15);
  }, [values]);
  return (
    <>
      <ChartFrame title={`${name} — ${horizontal ? 'Horizontal ' : ''}Bar`} subtitle="Category frequency" onExpand={() => setOpen(true)} onDownload={() => downloadCsv(data, `bar_${name}`)}>
        <ResponsiveContainer>
          <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 8, right: 8, bottom: 8, left: horizontal ? 20 : -16 }}>
            <CartesianGrid stroke={gridColor} vertical={!horizontal} horizontal={horizontal} />
            {horizontal ? (
              <>
                <XAxis type="number" tick={axisStyle} />
                <YAxis type="category" dataKey="label" tick={axisStyle} width={80} />
              </>
            ) : (
              <>
                <XAxis dataKey="label" tick={axisStyle} angle={-25} textAnchor="end" height={50} interval={0} />
                <YAxis tick={axisStyle} />
              </>
            )}
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="count" radius={horizontal ? [0, 3, 3, 0] : [3, 3, 0, 0]}>
              {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
      <ChartModal open={open} onClose={() => setOpen(false)} title={`${name} — Bar Chart`} onDownload={() => downloadCsv(data, `bar_${name}`)}>
        <div className="h-[60vh]">
          <ResponsiveContainer>
            <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 8, right: 8, bottom: 24, left: horizontal ? 24 : 0 }}>
              <CartesianGrid stroke={gridColor} vertical={!horizontal} horizontal={horizontal} />
              {horizontal ? (
                <>
                  <XAxis type="number" tick={axisStyle} />
                  <YAxis type="category" dataKey="label" tick={axisStyle} width={100} />
                </>
              ) : (
                <>
                  <XAxis dataKey="label" tick={axisStyle} angle={-25} textAnchor="end" height={60} interval={0} />
                  <YAxis tick={axisStyle} />
                </>
              )}
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="count" radius={horizontal ? [0, 3, 3, 0] : [3, 3, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartModal>
    </>
  );
}

/* ---------- Pie / Donut ---------- */
export function DonutChart({ values, name, donut = true }: { values: CellValue[]; name: string; donut?: boolean }) {
  const [open, setOpen] = useState(false);
  const data = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of values) {
      if (v === null || v === '') continue;
      const k = String(v);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [values]);
  return (
    <>
      <ChartFrame title={`${name} — ${donut ? 'Donut' : 'Pie'}`} subtitle="Share of categories" onExpand={() => setOpen(true)} onDownload={() => downloadCsv(data, `pie_${name}`)}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="label" innerRadius={donut ? 45 : 0} outerRadius={80} paddingAngle={donut ? 2 : 0}>
              {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="none" />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 10, color: '#6b7283' }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartFrame>
      <ChartModal open={open} onClose={() => setOpen(false)} title={`${name} — ${donut ? 'Donut' : 'Pie'}`} onDownload={() => downloadCsv(data, `pie_${name}`)}>
        <div className="h-[60vh]">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="count" nameKey="label" innerRadius={donut ? 90 : 0} outerRadius={160} paddingAngle={donut ? 2 : 0}>
                {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#6b7283' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ChartModal>
    </>
  );
}

/* ---------- Scatter ---------- */
export function ScatterPlotChart({ rows, x, y }: { rows: Record<string, CellValue>[]; x: string; y: string }) {
  const [open, setOpen] = useState(false);
  const data = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    for (const r of rows) {
      const xv = toNumbers([r[x]])[0];
      const yv = toNumbers([r[y]])[0];
      if (xv !== undefined && yv !== undefined) out.push({ x: xv, y: yv });
    }
    return out;
  }, [rows, x, y]);
  const reg = useMemo(() => linearRegression(data.map((d) => d.x), data.map((d) => d.y)), [data]);
  const r = useMemo(() => correlation(data.map((d) => d.x), data.map((d) => d.y)), [data]);
  return (
    <>
      <ChartFrame title={`${x} vs ${y}`} subtitle={`Scatter · r=${r.toFixed(2)}`} onExpand={() => setOpen(true)} onDownload={() => downloadCsv(data, `scatter_${x}_${y}`)}>
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
            <CartesianGrid stroke={gridColor} />
            <XAxis type="number" dataKey="x" name={x} tick={axisStyle} />
            <YAxis type="number" dataKey="y" name={y} tick={axisStyle} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#3cc49b', strokeDasharray: '3 3' }} />
            <Scatter data={data} fill="#1ba87f" fillOpacity={0.6} />
            <Line data={reg.points} dataKey="yhat" stroke="#f59e0b" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartFrame>
      <ChartModal open={open} onClose={() => setOpen(false)} title={`${x} vs ${y}`} onDownload={() => downloadCsv(data, `scatter_${x}_${y}`)}>
        <div className="h-[60vh]">
          <ResponsiveContainer>
            <ScatterChart margin={{ top: 8, right: 8, bottom: 24, left: 0 }}>
              <CartesianGrid stroke={gridColor} />
              <XAxis type="number" dataKey="x" name={x} tick={axisStyle} />
              <YAxis type="number" dataKey="y" name={y} tick={axisStyle} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#3cc49b', strokeDasharray: '3 3' }} />
              <Scatter data={data} fill="#1ba87f" fillOpacity={0.5} />
              <Line data={reg.points} dataKey="yhat" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </ChartModal>
    </>
  );
}

/* ---------- Correlation Heatmap (custom) ---------- */
export function CorrelationHeatmap({ matrix }: { matrix: { name: string; values: number[] }[] }) {
  const [open, setOpen] = useState(false);
  const max = matrix.length;
  const cellSize = Math.max(28, Math.min(56, 560 / max));
  const colorFor = (r: number) => {
    if (r > 0) return `rgba(28,168,127,${Math.min(0.9, Math.abs(r))})`;
    return `rgba(239,68,68,${Math.min(0.9, Math.abs(r))})`;
  };
  return (
    <>
      <ChartFrame title="Correlation Heatmap" subtitle="Pearson r between numeric columns" onExpand={() => setOpen(true)}>
        <div className="h-full overflow-auto">
          <div className="inline-block min-w-full">
            <div className="flex">
              <div style={{ width: cellSize }} />
              {matrix.map((c) => (
                <div key={c.name} style={{ width: cellSize }} className="text-center text-2xs text-ink-500 -rotate-45 origin-bottom-left whitespace-nowrap px-1">
                  {c.name}
                </div>
              ))}
            </div>
            {matrix.map((row, i) => (
              <div key={row.name} className="flex items-center">
                <div style={{ width: cellSize }} className="text-2xs text-ink-500 truncate text-right pr-1">{row.name}</div>
                {row.values.map((v, j) => (
                  <div
                    key={j}
                    style={{ width: cellSize, height: cellSize, backgroundColor: colorFor(v) }}
                    className="flex items-center justify-center text-2xs font-medium text-ink-950/80 hover:ring-1 hover:ring-white/40 cursor-default"
                    title={`${row.name} × ${matrix[j].name}: ${v.toFixed(2)}`}
                  >
                    {Math.abs(v) >= 0.05 ? v.toFixed(1) : ''}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </ChartFrame>
      <ChartModal open={open} onClose={() => setOpen(false)} title="Correlation Heatmap">
        <div className="overflow-auto max-h-[70vh]">
          <div className="inline-block">
            <div className="flex">
              <div style={{ width: cellSize * 1.4 }} />
              {matrix.map((c) => (
                <div key={c.name} style={{ width: cellSize * 1.4 }} className="text-center text-xs text-ink-400 -rotate-45 origin-bottom-left whitespace-nowrap px-1">
                  {c.name}
                </div>
              ))}
            </div>
            {matrix.map((row) => (
              <div key={row.name} className="flex items-center">
                <div style={{ width: cellSize * 1.4 }} className="text-xs text-ink-400 truncate text-right pr-2">{row.name}</div>
                {row.values.map((v, j) => (
                  <div
                    key={j}
                    style={{ width: cellSize * 1.4, height: cellSize * 1.4, backgroundColor: colorFor(v) }}
                    className="flex items-center justify-center text-xs font-medium text-ink-950/80 hover:ring-2 hover:ring-white/50 cursor-default"
                    title={`${row.name} × ${matrix[j].name}: ${v.toFixed(2)}`}
                  >
                    {v.toFixed(2)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </ChartModal>
    </>
  );
}

/* ---------- Group Bar ---------- */
export function GroupBarChart({ data, groupBy, aggregate }: { data: { label: string; value: number }[]; groupBy: string; aggregate: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ChartFrame title={`Average ${aggregate} by ${groupBy}`} subtitle="Grouped aggregation" onExpand={() => setOpen(true)} onDownload={() => downloadCsv(data, `group_${groupBy}_${aggregate}`)}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
            <CartesianGrid stroke={gridColor} vertical={false} />
            <XAxis dataKey="label" tick={axisStyle} angle={-25} textAnchor="end" height={50} interval={0} />
            <YAxis tick={axisStyle} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
      <ChartModal open={open} onClose={() => setOpen(false)} title={`Average ${aggregate} by ${groupBy}`} onDownload={() => downloadCsv(data, `group_${groupBy}_${aggregate}`)}>
        <div className="h-[60vh]">
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 24, left: 0 }}>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis dataKey="label" tick={axisStyle} angle={-25} textAnchor="end" height={60} interval={0} />
              <YAxis tick={axisStyle} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartModal>
    </>
  );
}

/* ---------- Time Series Line ---------- */
export function TimeSeriesChart({ data, name }: { data: { date: string; value: number }[]; name: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ChartFrame title={`${name} — Time Series`} subtitle="Trend over time" onExpand={() => setOpen(true)} onDownload={() => downloadCsv(data, `timeseries_${name}`)}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
            <defs>
              <linearGradient id={`ts-${name}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3cc49b" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#3cc49b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={gridColor} vertical={false} />
            <XAxis dataKey="date" tick={axisStyle} minTickGap={24} />
            <YAxis tick={axisStyle} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="value" stroke="#1ba87f" strokeWidth={2} fill={`url(#ts-${name})`} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartFrame>
      <ChartModal open={open} onClose={() => setOpen(false)} title={`${name} — Time Series`} onDownload={() => downloadCsv(data, `timeseries_${name}`)}>
        <div className="h-[60vh]">
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
              <defs>
                <linearGradient id={`ts-${name}-full`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3cc49b" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#3cc49b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis dataKey="date" tick={axisStyle} minTickGap={24} />
              <YAxis tick={axisStyle} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="value" stroke="#1ba87f" strokeWidth={2} fill={`url(#ts-${name}-full)`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartModal>
    </>
  );
}

/* ---------- Missing Matrix (custom) ---------- */
export function MissingMatrix({ columns, rows }: { columns: { name: string; missingPct: number }[]; rows: number }) {
  return (
    <ChartFrame title="Missing Data Matrix" subtitle="White = present, dark = missing (sampled)">
      <div className="h-full overflow-auto">
        <div className="flex gap-px">
          {columns.map((c) => (
            <div key={c.name} className="flex-1 min-w-[40px]">
              <div className="text-2xs text-ink-500 truncate text-center mb-1" title={c.name}>{c.name}</div>
              <div className="flex flex-col gap-px">
                {Array.from({ length: Math.min(rows, 40) }).map((_, i) => {
                  const miss = Math.random() * 100 < c.missingPct;
                  return <div key={i} className="h-1.5 rounded-sm" style={{ background: miss ? 'rgba(239,68,68,0.5)' : 'rgba(28,168,127,0.35)' }} />;
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ChartFrame>
  );
}

/* ---------- Radial Health (for health page) ---------- */
export function RadialStat({ value, label, color = '#1ba87f' }: { value: number; label: string; color?: string }) {
  const data = [{ name: label, value, fill: color }];
  return (
    <div className="flex flex-col items-center">
      <div className="h-28 w-28">
        <ResponsiveContainer>
          <RadialBarChart innerRadius="70%" outerRadius="100%" data={data} startAngle={90} endAngle={90 - (value / 100) * 360}>
            <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'rgba(255,255,255,0.05)' }} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div className="-mt-20 text-center">
        <div className="text-lg font-semibold text-ink-50">{Math.round(value)}</div>
        <div className="text-2xs text-ink-500">{label}</div>
      </div>
    </div>
  );
}
