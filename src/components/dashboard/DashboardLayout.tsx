import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, HeartPulse, Sparkles, BarChart3, GitCompare,
  Lightbulb, ListChecks, FileText, Settings, Search, Menu, X, Plus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useDataset } from '@/context/DatasetContext';

export type PageKey =
  | 'overview' | 'health' | 'cleaning' | 'statistics' | 'visualizations'
  | 'relationships' | 'insights' | 'recommendations' | 'reports' | 'settings';

const NAV: { key: PageKey; label: string; icon: LucideIcon }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'health', label: 'Dataset Health', icon: HeartPulse },
  { key: 'cleaning', label: 'Cleaning', icon: Sparkles },
  { key: 'statistics', label: 'Statistics', icon: BarChart3 },
  { key: 'visualizations', label: 'Visualizations', icon: BarChart3 },
  { key: 'relationships', label: 'Relationships', icon: GitCompare },
  { key: 'insights', label: 'Insights', icon: Lightbulb },
  { key: 'recommendations', label: 'Recommendations', icon: ListChecks },
  { key: 'reports', label: 'Reports', icon: FileText },
  { key: 'settings', label: 'Settings', icon: Settings },
];

interface Props {
  page: PageKey;
  setPage: (p: PageKey) => void;
  children: ReactNode;
  onNewUpload: () => void;
  onClear: () => void;
}

export function DashboardLayout({ page, setPage, children, onNewUpload, onClear }: Props) {
  const { result } = useDataset();
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const searchResults = (() => {
    if (!result || search.length < 2) return [];
    const q = search.toLowerCase();
    const cols = result.columns.filter((c) => c.name.toLowerCase().includes(q)).map((c) => ({ type: 'Column', label: c.name, page: 'statistics' as PageKey }));
    const ins = result.insights.filter((i) => i.title.toLowerCase().includes(q) || i.text.toLowerCase().includes(q)).map((i) => ({ type: 'Insight', label: i.title, page: 'insights' as PageKey }));
    return [...cols, ...ins].slice(0, 8);
  })();

  return (
    <div className="min-h-screen bg-ink-950">
      {/* sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-white/5 bg-ink-950/80 backdrop-blur-xl lg:flex">
        <SidebarContent page={page} setPage={setPage} onNewUpload={onNewUpload} onClear={onClear} />
      </aside>

      {/* mobile nav */}
      <AnimatePresence>
        {mobileNav && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" onClick={() => setMobileNav(false)} />
            <motion.aside
              className="absolute inset-y-0 left-0 w-64 border-r border-white/5 bg-ink-950"
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              <button className="absolute right-3 top-3 rounded-md p-1.5 text-ink-500 hover:bg-white/5" onClick={() => setMobileNav(false)}>
                <X size={16} />
              </button>
              <SidebarContent page={page} setPage={(p) => { setPage(p); setMobileNav(false); }} onNewUpload={onNewUpload} onClear={onClear} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* main */}
      <div className="lg:pl-60">
        {/* topbar */}
        <header className="sticky top-0 z-20 border-b border-white/5 bg-ink-950/70 backdrop-blur-xl">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <button className="rounded-md p-2 text-ink-400 hover:bg-white/5 lg:hidden" onClick={() => setMobileNav(true)}>
              <Menu size={18} />
            </button>
            <div className="relative flex-1 max-w-md">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-600">
                <Search size={15} />
              </div>
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                placeholder="Search columns, insights, charts…"
                className="w-full rounded-lg border border-white/5 bg-white/[0.03] py-2 pl-9 pr-3 text-sm text-ink-100 placeholder:text-ink-600 outline-none transition focus:border-primary-500/30"
              />
              <AnimatePresence>
                {searchOpen && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                    className="absolute left-0 right-0 top-full mt-1.5 card overflow-hidden p-1.5"
                  >
                    {searchResults.map((r, i) => (
                      <button
                        key={i}
                        onClick={() => { setPage(r.page); setSearch(''); setSearchOpen(false); }}
                        className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm hover:bg-white/5"
                      >
                        <span className="chip bg-white/5 text-ink-400">{r.type}</span>
                        <span className="text-ink-200">{r.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="ml-auto hidden items-center gap-2 sm:flex">
              <span className="chip bg-white/5 text-ink-400">{result?.meta.rows.toLocaleString()} rows</span>
              <span className="chip bg-white/5 text-ink-400">{result?.meta.columns} cols</span>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ page, setPage, onNewUpload, onClear }: { page: PageKey; setPage: (p: PageKey) => void; onNewUpload: () => void; onClear: () => void }) {
  const { result } = useDataset();
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary-400 to-primary-600">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-ink-950">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
          </svg>
        </div>
        <span className="text-sm font-semibold tracking-tight">DataLens</span>
      </div>

      <div className="px-3 space-y-2">
        <button onClick={onNewUpload} className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/8 bg-white/[0.03] py-2 text-sm font-medium text-ink-200 transition hover:bg-white/5">
          <Plus size={15} /> New upload
        </button>
        <button onClick={onClear} className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-2xs font-medium text-ink-500 transition hover:text-ink-300">
          Clear analysis
        </button>
      </div>

      <nav className="mt-4 flex-1 space-y-0.5 px-3">
        {NAV.map((item) => (
          <button
            key={item.key}
            onClick={() => setPage(item.key)}
            className={`nav-link w-full ${page === item.key ? 'nav-link-active' : ''}`}
          >
            <item.icon size={16} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="border-t border-white/5 p-3">
        <div className="rounded-lg bg-white/[0.03] p-3">
          <div className="truncate text-2xs font-medium text-ink-300">{result?.meta.name}</div>
          <div className="mt-1 text-2xs text-ink-500">{result ? `${(result.meta.fileSize / 1024).toFixed(1)} KB` : ''}</div>
        </div>
      </div>
    </div>
  );
}
