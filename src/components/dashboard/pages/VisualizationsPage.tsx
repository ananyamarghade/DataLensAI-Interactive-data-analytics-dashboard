import { useMemo, useState } from 'react';
import { useDataset } from '@/context/DatasetContext';
import { Card, SectionHeader, Pill } from '@/components/ui/InfoTip';
import {
  HistogramChart, DensityChart, BoxPlotChart, CategoricalBarChart, DonutChart,
  ScatterPlotChart, CorrelationHeatmap, GroupBarChart, TimeSeriesChart, MissingMatrix,
} from '@/components/charts/Charts';
import { toNumbers } from '@/lib/stats';
import type { CellValue } from '@/types';

type Tab = 'numeric' | 'categorical' | 'time' | 'correlation' | 'missing' | 'groups';

const TABS: { key: Tab; label: string }[] = [
  { key: 'numeric', label: 'Numerical' },
  { key: 'categorical', label: 'Categorical' },
  { key: 'time', label: 'Time Series' },
  { key: 'correlation', label: 'Correlation' },
  { key: 'groups', label: 'Groups' },
  { key: 'missing', label: 'Missing' },
];

export function VisualizationsPage() {
  const { result } = useDataset();
  const [tab, setTab] = useState<Tab>('numeric');
  const [selectedNum, setSelectedNum] = useState<string>('');
  const [selectedCat, setSelectedCat] = useState<string>('');
  if (!result) return null;

  const numericCols = result.numericColumns;
  const categoricalCols = result.categoricalColumns;
  const datetimeCols = result.datetimeColumns;

  const activeNum = selectedNum || numericCols[0] || '';
  const activeCat = selectedCat || categoricalCols[0] || '';

  return (
    <div>
      <SectionHeader title="Visualizations" subtitle="Charts generated automatically based on your data's shape." />

      <div className="mb-5 flex flex-wrap gap-1 rounded-lg bg-white/[0.03] p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${tab === t.key ? 'bg-primary-500/15 text-primary-300' : 'text-ink-400 hover:text-ink-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'numeric' && numericCols.length > 0 && (
        <div>
          <ColumnPicker columns={numericCols} active={activeNum} onSelect={setSelectedNum} />
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <HistogramChart values={result.rows.map((r) => r[activeNum])} name={activeNum} />
            <DensityChart values={result.rows.map((r) => r[activeNum])} name={activeNum} />
            <BoxPlotChart values={result.rows.map((r) => r[activeNum])} name={activeNum} />
            {numericCols.length >= 2 && (
              <ScatterPlotChart rows={result.rows} x={numericCols[0]} y={numericCols[1]} />
            )}
          </div>
        </div>
      )}

      {tab === 'categorical' && categoricalCols.length > 0 && (
        <div>
          <ColumnPicker columns={categoricalCols} active={activeCat} onSelect={setSelectedCat} />
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <CategoricalBarChart values={result.rows.map((r) => r[activeCat])} name={activeCat} />
            <CategoricalBarChart values={result.rows.map((r) => r[activeCat])} name={activeCat} horizontal />
            <DonutChart values={result.rows.map((r) => r[activeCat])} name={activeCat} />
            <DonutChart values={result.rows.map((r) => r[activeCat])} name={activeCat} donut={false} />
          </div>
        </div>
      )}

      {tab === 'time' && (
        <TimeTab datetimeCols={datetimeCols} numericCols={numericCols} rows={result.rows} />
      )}

      {tab === 'correlation' && (
        <div>
          {result.correlationMatrix.length > 1 ? (
            <div className="grid gap-3">
              <CorrelationHeatmap matrix={result.correlationMatrix} />
              <div className="grid gap-3 lg:grid-cols-2">
                {result.numericColumns.slice(0, 4).map((x, i) => {
                  const y = result.numericColumns.find((c) => c !== x);
                  return y ? <ScatterPlotChart key={i} rows={result.rows} x={x} y={y} /> : null;
                })}
              </div>
            </div>
          ) : (
            <EmptyState text="Need at least two numeric columns for correlation charts." />
          )}
        </div>
      )}

      {tab === 'groups' && (
        <div>
          {result.groups.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {result.groups.map((g) => (
                <GroupBarChart key={`${g.groupBy}-${g.aggregate}`} data={g.results} groupBy={g.groupBy} aggregate={g.aggregate} />
              ))}
            </div>
          ) : (
            <EmptyState text="No useful groupings were detected in this dataset." />
          )}
        </div>
      )}

      {tab === 'missing' && (
        <div className="grid gap-3 lg:grid-cols-2">
          <MissingMatrix columns={result.columns} rows={result.meta.rows} />
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-ink-100">Missing Percentage by Column</h3>
            <div className="space-y-2">
              {result.columns.filter((c) => c.missing > 0).map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-sm text-ink-300" title={c.name}>{c.name}</span>
                  <div className="h-4 flex-1 overflow-hidden rounded bg-white/5">
                    <div className="h-full rounded bg-accent-500/60" style={{ width: `${Math.min(100, c.missingPct)}%` }} />
                  </div>
                  <span className="w-12 shrink-0 text-right text-2xs text-ink-500">{c.missingPct.toFixed(1)}%</span>
                </div>
              ))}
              {result.columns.every((c) => c.missing === 0) && <p className="text-sm text-ink-400">No missing values detected.</p>}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function ColumnPicker({ columns, active, onSelect }: { columns: string[]; active: string; onSelect: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {columns.map((c) => (
        <button
          key={c}
          onClick={() => onSelect(c)}
          className={`rounded-full px-3 py-1.5 text-sm transition ${active === c ? 'bg-primary-500/15 text-primary-300' : 'bg-white/5 text-ink-400 hover:bg-white/10 hover:text-ink-200'}`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

function TimeTab({ datetimeCols, numericCols, rows }: { datetimeCols: string[]; numericCols: string[]; rows: Record<string, CellValue>[] }) {
  const [dateCol, setDateCol] = useState(datetimeCols[0] ?? '');
  const [valueCol, setValueCol] = useState(numericCols[0] ?? '');

  const data = useMemo(() => {
    if (!dateCol || !valueCol) return [];
    const pts = rows
      .map((r) => ({ date: String(r[dateCol] ?? ''), value: toNumbers([r[valueCol]])[0] }))
      .filter((p) => p.date && p.value !== undefined)
      .sort((a, b) => a.date.localeCompare(b.date));
    // aggregate by date
    const map = new Map<string, number[]>();
    for (const p of pts) {
      if (!map.has(p.date)) map.set(p.date, []);
      map.get(p.date)!.push(p.value);
    }
    return [...map.entries()].map(([date, vals]) => ({ date, value: Math.round(vals.reduce((s, x) => s + x, 0) / vals.length) }));
  }, [rows, dateCol, valueCol]);

  if (!datetimeCols.length) return <EmptyState text="No datetime columns detected. Add a date column to enable time-series analysis." />;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <label className="section-title block mb-1">Date column</label>
          <select value={dateCol} onChange={(e) => setDateCol(e.target.value)} className="input-clean w-auto">
            {datetimeCols.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="section-title block mb-1">Value column</label>
          <select value={valueCol} onChange={(e) => setValueCol(e.target.value)} className="input-clean w-auto">
            {numericCols.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <Pill tone="info">{data.length} time points</Pill>
      </div>
      {data.length > 0 ? (
        <div className="grid gap-3">
          <TimeSeriesChart data={data} name={valueCol} />
        </div>
      ) : (
        <EmptyState text="No valid time-series data for this combination." />
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card className="flex items-center justify-center p-12 text-center">
      <p className="text-sm text-ink-400">{text}</p>
    </Card>
  );
}
