import { Download, Trash2, Database, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useDataset } from '@/context/DatasetContext';
import { Card, SectionHeader, Pill } from '@/components/ui/InfoTip';
import { toCsv } from '@/lib/parse';
import { saveAs } from 'file-saver';

export function SettingsPage({ onNewUpload }: { onNewUpload: () => void }) {
  const { result, clear } = useDataset();
  if (!result) return null;

  const downloadFull = () => {
    saveAs(new Blob([toCsv(result.rows)], { type: 'text/csv' }), result.meta.name.replace(/\.[^.]+$/, '') + '_full.csv');
  };

  const downloadStats = () => {
    const lines = ['column,type,mean,median,std,min,max,missing,unique,skewness'];
    for (const s of result.stats) {
      if (s.numeric) {
        const n = s.numeric;
        lines.push([s.name, s.type, n.mean, n.median, n.std, n.min, n.max, s.nullPct, n.count, n.skewness].join(','));
      } else if (s.categorical) {
        lines.push([s.name, s.type, '', '', '', '', '', s.nullPct, s.categorical.unique, ''].join(','));
      }
    }
    saveAs(new Blob([lines.join('\n')], { type: 'text/csv' }), 'datalens_statistics.csv');
  };

  return (
    <div>
      <SectionHeader title="Settings" subtitle="Export data and manage your session." />

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-1 text-sm font-semibold text-ink-100">Export</h3>
          <p className="mb-4 text-2xs text-ink-500">Download your data and analysis results.</p>
          <div className="space-y-2">
            <ExportRow icon={Database} label="Full dataset (CSV)" onClick={downloadFull} />
            <ExportRow icon={Download} label="Statistics summary (CSV)" onClick={downloadStats} />
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-1 text-sm font-semibold text-ink-100">Session</h3>
          <p className="mb-4 text-2xs text-ink-500">Manage the current dataset.</p>
          <div className="space-y-2">
            <button onClick={onNewUpload} className="flex w-full items-center gap-3 rounded-lg border border-white/8 bg-white/[0.03] p-3 text-sm text-ink-200 transition hover:bg-white/5">
              <Download size={15} className="text-primary-400" /> Upload a new dataset
            </button>
            <button onClick={clear} className="flex w-full items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-300 transition hover:bg-red-500/10">
              <Trash2 size={15} /> Clear current analysis
            </button>
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/12 text-primary-300">
            <Info size={15} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink-100">About DataLens</h3>
            <p className="mt-1 text-sm text-ink-400">
              DataLens analyzes your dataset entirely in your browser — no data is uploaded to any server.
              Statistical analysis, cleaning and visualization run on a local engine inspired by NumPy, Pandas and Seaborn.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill tone="primary">Local & private</Pill>
              <Pill>CSV · Excel · JSON</Pill>
              <Pill tone="info">No account needed</Pill>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ExportRow({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-lg border border-white/8 bg-white/[0.03] p-3 text-sm text-ink-200 transition hover:bg-white/5">
      <Icon size={15} className="text-primary-400" /> {label}
      <Download size={13} className="ml-auto text-ink-500" />
    </button>
  );
}
