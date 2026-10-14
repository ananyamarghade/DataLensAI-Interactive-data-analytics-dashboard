import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';

interface InfoTipProps {
  title: string;
  definition: string;
  formula?: string;
  why: string;
  example?: string;
}

export function InfoTip({ title, definition, formula, why, example }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-full p-1 text-ink-500 transition hover:bg-white/5 hover:text-primary-300"
        aria-label={`Learn about ${title}`}
      >
        <Info size={13} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" />
            <motion.div
              className="relative w-full max-w-lg card p-6"
              initial={{ scale: 0.96, y: 8, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 8, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500/15 text-primary-300">
                  <Info size={16} />
                </div>
                <h3 className="text-base font-semibold text-ink-50">{title}</h3>
              </div>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="section-title mb-1">Definition</dt>
                  <dd className="text-ink-300 leading-relaxed">{definition}</dd>
                </div>
                {formula && (
                  <div>
                    <dt className="section-title mb-1">Formula</dt>
                    <dd className="font-mono text-primary-300 bg-primary-500/10 rounded-lg px-3 py-2 inline-block">{formula}</dd>
                  </div>
                )}
                <div>
                  <dt className="section-title mb-1">Why it matters</dt>
                  <dd className="text-ink-300 leading-relaxed">{why}</dd>
                </div>
                {example && (
                  <div>
                    <dt className="section-title mb-1">Real-world example</dt>
                    <dd className="text-ink-300 leading-relaxed">{example}</dd>
                  </div>
                )}
              </dl>
              <button onClick={() => setOpen(false)} className="btn-ghost mt-5 w-full justify-center border border-white/5">
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function Card({ children, className = '', hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return <div className={`card ${hover ? 'card-hover' : ''} ${className}`}>{children}</div>;
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink-50">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Pill({ tone = 'neutral', children }: { tone?: 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'primary'; children: ReactNode }) {
  const tones: Record<string, string> = {
    neutral: 'bg-white/5 text-ink-300',
    success: 'bg-primary-500/15 text-primary-300',
    warning: 'bg-accent-500/15 text-accent-300',
    error: 'bg-red-500/15 text-red-300',
    info: 'bg-blue-500/15 text-blue-300',
    primary: 'bg-primary-500/15 text-primary-300',
  };
  return <span className={`chip ${tones[tone]}`}>{children}</span>;
}
