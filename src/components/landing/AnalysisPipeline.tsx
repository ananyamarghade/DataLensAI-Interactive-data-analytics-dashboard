import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useDataset } from '@/context/DatasetContext';

const STAGES = [
  'Reading Dataset',
  'Detecting Column Types',
  'Checking Missing Values',
  'Cleaning Data',
  'Calculating Statistics',
  'Generating Charts',
  'Finding Hidden Patterns',
  'Preparing Report',
];

export function AnalysisPipeline() {
  const { stage } = useDataset();
  const done = stage >= STAGES.length;

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-6">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary-500/10 blur-[120px]" />
      <div className="relative z-10 w-full max-w-xl">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-300">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </motion.div>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-ink-50">Analyzing your data</h2>
          <p className="mt-1.5 text-sm text-ink-400">DataLens is reading every column and finding patterns.</p>
        </motion.div>

        <div className="space-y-3">
          {STAGES.map((label, i) => {
            const active = i === stage && !done;
            const complete = i < stage || done;
            const pct = complete ? 100 : active ? 60 : 0;
            return (
              <div key={label} className="flex items-center gap-3">
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
                  complete ? 'border-primary-500 bg-primary-500 text-ink-950' : active ? 'border-primary-400 text-primary-300' : 'border-white/10 text-ink-600'
                }`}>
                  {complete ? <Check size={13} /> : active ? (
                    <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="h-1.5 w-1.5 rounded-full bg-primary-400" />
                  ) : <span className="h-1.5 w-1.5 rounded-full bg-ink-700" />}
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className={`text-sm ${complete ? 'text-ink-200' : active ? 'text-ink-100' : 'text-ink-500'}`}>{label}</span>
                    {active && <span className="text-2xs text-primary-400">processing…</span>}
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-300"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
