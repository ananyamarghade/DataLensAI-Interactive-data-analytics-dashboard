import { useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Download } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  onDownload?: () => void;
}

export function ChartModal({ open, onClose, title, children, onDownload }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-md" />
          <motion.div
            className="relative w-full max-w-5xl max-h-[90vh] overflow-auto card p-6"
            initial={{ scale: 0.97, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.97, y: 12, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink-50">{title}</h3>
              <div className="flex items-center gap-1">
                {onDownload && (
                  <button onClick={onDownload} className="btn-ghost px-2.5 py-2" aria-label="Download chart">
                    <Download size={15} />
                  </button>
                )}
                <button onClick={onClose} className="btn-ghost px-2.5 py-2" aria-label="Close">
                  <X size={15} />
                </button>
              </div>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ChartFrame({
  title, subtitle, onExpand, onDownload, children, height = 280,
}: {
  title: string; subtitle?: string; onExpand?: () => void; onDownload?: () => void; children: ReactNode; height?: number;
}) {
  return (
    <div className="card card-hover group flex flex-col p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-ink-100">{title}</h4>
          {subtitle && <p className="text-2xs text-ink-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          {onDownload && (
            <button onClick={onDownload} className="rounded-md p-1.5 text-ink-500 transition hover:bg-white/5 hover:text-ink-100" aria-label="Download">
              <Download size={14} />
            </button>
          )}
          {onExpand && (
            <button onClick={onExpand} className="rounded-md p-1.5 text-ink-500 transition hover:bg-white/5 hover:text-ink-100" aria-label="Expand">
              <Maximize2 size={14} />
            </button>
          )}
        </div>
      </div>
      <div style={{ height }} className="w-full">
        {children}
      </div>
    </div>
  );
}
