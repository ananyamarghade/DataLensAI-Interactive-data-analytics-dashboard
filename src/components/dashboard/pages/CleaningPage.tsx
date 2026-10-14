import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Download, Check } from 'lucide-react';
import { useDataset } from '@/context/DatasetContext';
import { Card, SectionHeader, Pill, InfoTip } from '@/components/ui/InfoTip';
import { toCsv } from '@/lib/parse';
import { saveAs } from 'file-saver';

const SEVERITY_TONE: Record<string, 'error' | 'warning' | 'neutral'> = {
  high: 'error', medium: 'warning', low: 'neutral',
};

export function CleaningPage() {
  const { result } = useDataset();
  const [applied, setApplied] = useState<Set<string>>(new Set());
  if (!result) return null;
  const { cleaning, rows, columns } = result;

  const applyFix = (id: string) => setApplied((s) => new Set(s).add(id));

  const downloadCleaned = () => {
    const seen = new Set<string>();
    const cleaned = rows.filter((r) => {
      const k = JSON.stringify(r);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).map((r) => {
      const out = { ...r };
      for (const c of columns) {
        if (typeof out[c.name] === 'string') out[c.name] = (out[c.name] as string).trim();
      }
      return out;
    });
    saveAs(new Blob([toCsv(cleaned)], { type: 'text/csv' }), `cleaned_${result.meta.name.replace(/\.[^.]+$/, '')}.csv`);
  };

  return (
    <div>
      <SectionHeader
        title="Data Cleaning"
        subtitle={`${cleaning.issues.length} issues detected across ${columns.length} columns.`}
        action={
          <button onClick={downloadCleaned} className="btn-primary">
            <Download size={15} /> Download cleaned CSV
          </button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <BeforeAfter label="Rows" before={cleaning.before.rows} after={cleaning.after.rows} />
        <BeforeAfter label="Missing values" before={cleaning.before.missing} after={cleaning.after.missing} />
        <BeforeAfter label="Duplicate rows" before={cleaning.before.duplicates} after={cleaning.after.duplicates} />
      </div>

      <div className="space-y-2">
        {cleaning.issues.map((issue, i) => {
          const done = applied.has(issue.id);
          return (
            <motion.div key={issue.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className={`p-4 transition ${done ? 'opacity-60' : ''}`} hover>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${done ? 'bg-primary-500 text-ink-950' : 'bg-white/5 text-ink-400'}`}>
                    {done ? <Check size={14} /> : <Sparkles size={14} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-ink-100">{issue.title}</h4>
                      <Pill tone={SEVERITY_TONE[issue.severity]}>{issue.severity}</Pill>
                      <span className="chip bg-white/5 text-ink-400">{issue.category}</span>
                      <InfoTip
                        title={issue.category}
                        definition={issue.description}
                        why={issue.suggestion}
                        example={`Affected: ${issue.affected} rows in column "${issue.column}".`}
                      />
                    </div>
                    <p className="mt-1 text-sm text-ink-400">{issue.description}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-2xs text-ink-500">Suggestion: {issue.suggestion}</span>
                      {!done && (
                        <button onClick={() => applyFix(issue.id)} className="ml-auto rounded-md border border-white/8 px-2.5 py-1 text-2xs font-medium text-ink-200 transition hover:bg-white/5">
                          Apply fix
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function BeforeAfter({ label, before, after }: { label: string; before: number; after: number }) {
  const reduced = before - after;
  return (
    <Card className="p-4">
      <div className="section-title mb-2">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-semibold text-ink-500 line-through decoration-red-500/40">{before.toLocaleString()}</span>
        <span className="text-ink-600">→</span>
        <span className="text-xl font-semibold text-primary-400">{after.toLocaleString()}</span>
      </div>
      {reduced > 0 && <div className="mt-1 text-2xs text-primary-400">{reduced.toLocaleString()} removed</div>}
    </Card>
  );
}
