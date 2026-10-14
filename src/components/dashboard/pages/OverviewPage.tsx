import { motion } from 'framer-motion';
import {
  Database, Rows3, Columns3, HardDrive, Copy, AlertTriangle, Clock, FileType2,
} from 'lucide-react';
import { useDataset } from '@/context/DatasetContext';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { Card, SectionHeader, Pill } from '@/components/ui/InfoTip';
import type { ReactNode } from 'react';

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

export function OverviewPage() {
  const { result } = useDataset();
  if (!result) return null;
  const { meta, columns } = result;

  const kpis = [
    { icon: Rows3, label: 'Rows', value: meta.rows, decimals: 0 },
    { icon: Columns3, label: 'Columns', value: meta.columns, decimals: 0 },
    { icon: HardDrive, label: 'Memory', value: meta.memoryUsage / 1024, decimals: 1, suffix: ' KB' },
    { icon: Copy, label: 'Duplicate Rows', value: meta.duplicateRows, decimals: 0 },
    { icon: AlertTriangle, label: 'Missing Values', value: meta.missingTotal, decimals: 0 },
    { icon: Database, label: 'File Size', raw: formatBytes(meta.fileSize) },
    { icon: Clock, label: 'Uploaded', raw: new Date(meta.uploadTime).toLocaleTimeString() },
    { icon: FileType2, label: 'Data Types', raw: `${columns.filter((c) => c.type === 'numeric').length} num · ${columns.filter((c) => c.type === 'categorical').length} cat` },
  ];

  const typeCounts = columns.reduce<Record<string, number>>((acc, c) => {
    acc[c.type] = (acc[c.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <SectionHeader
        title={meta.name}
        subtitle={`${meta.rows.toLocaleString()} rows × ${meta.columns} columns · uploaded ${new Date(meta.uploadTime).toLocaleString()}`}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="p-4" hover>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-2xs uppercase tracking-wider text-ink-500">{k.label}</span>
                <k.icon size={14} className="text-ink-500" />
              </div>
              <div className="text-2xl font-semibold tracking-tight text-ink-50">
                {'raw' in k ? k.raw : <AnimatedCounter value={k.value} decimals={k.decimals} suffix={k.suffix} />}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-ink-100">Column Overview</h3>
          <div className="space-y-1">
            <div className="grid grid-cols-12 gap-2 px-2 text-2xs uppercase tracking-wider text-ink-500">
              <div className="col-span-4">Column</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2 text-right">Missing</div>
              <div className="col-span-2 text-right">Unique</div>
              <div className="col-span-2 text-right">Sample</div>
            </div>
            <div className="max-h-80 space-y-0.5 overflow-auto no-scrollbar">
              {columns.map((c) => (
                <div key={c.name} className="grid grid-cols-12 gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-white/[0.03]">
                  <div className="col-span-4 truncate font-medium text-ink-200" title={c.name}>{c.name}</div>
                  <div className="col-span-2"><Pill tone={c.type === 'numeric' ? 'primary' : c.type === 'categorical' ? 'neutral' : c.type === 'datetime' ? 'info' : 'warning'}>{c.type}</Pill></div>
                  <div className={`col-span-2 text-right ${c.missing > 0 ? 'text-accent-400' : 'text-ink-400'}`}>{c.missing || '—'}</div>
                  <div className="col-span-2 text-right text-ink-400">{c.unique}</div>
                  <div className="col-span-2 truncate text-right text-ink-500" title={String(c.sample.find((s) => s !== null) ?? '')}>{String(c.sample.find((s) => s !== null) ?? '—')}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-ink-100">Data Type Distribution</h3>
          <div className="space-y-3">
            {Object.entries(typeCounts).map(([type, count]) => (
              <div key={type}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="capitalize text-ink-300">{type}</span>
                  <span className="text-ink-500">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    className="h-full rounded-full bg-primary-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / columns.length) * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-lg bg-white/[0.03] p-3 text-sm">
            <div className="section-title mb-1">Health at a glance</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold text-primary-400">{result.health.score}</span>
              <span className="text-ink-500">/ 100 · {result.health.grade}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
