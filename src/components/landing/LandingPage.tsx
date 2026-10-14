import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, FileSpreadsheet, FileJson, FileText, Sparkles, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ParticleBackground } from './ParticleBackground';
import { useDataset } from '@/context/DatasetContext';

const FEATURES = [
  { icon: Sparkles, title: 'Smart Analysis', text: 'Automatic column typing, statistical profiling and pattern detection across every field.' },
  { icon: FileText, title: 'Automatic Cleaning', text: 'Detect missing values, duplicates, mixed types and stray whitespace — with one-click fixes.' },
  { icon: FileSpreadsheet, title: 'Interactive Charts', text: 'Histograms, box plots, scatter matrices and heatmaps, generated and tuned for your data.' },
  { icon: Sparkles, title: 'Explainable Insights', text: 'Plain-language findings: skewness, concentration, correlations and outliers explained.' },
  { icon: FileJson, title: 'Professional Reports', text: 'Export a polished executive report as PDF, DOCX or HTML in a single click.' },
];

export function LandingPage() {
  const { upload, loadSample, loading } = useDataset();
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file?: File | null) => {
    if (file) upload(file);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950">
      {/* ambient glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-primary-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-accent-500/5 blur-[120px]" />

      {/* nav */}
      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="text-base font-semibold tracking-tight">DataLens</span>
        </div>
        <div className="hidden items-center gap-7 text-sm text-ink-400 sm:flex">
          <a className="transition hover:text-ink-100" href="#features">Features</a>
          <a className="transition hover:text-ink-100" href="#how">How it works</a>
          <button onClick={loadSample} className="btn-ghost">Try a sample</button>
        </div>
      </nav>

      {/* hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-16 pb-24 text-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-2xs text-ink-300">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-pulse-soft" />
            See Beyond the Spreadsheet
          </div>
          <h1 className="text-balance text-5xl font-semibold tracking-tight text-ink-50 sm:text-6xl md:text-7xl">
            Every Dataset<br />Has A Story.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-lg text-ink-400">
            Upload any dataset and discover insights, patterns and hidden relationships within seconds.
          </p>
        </motion.div>

        {/* upload */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
          className="relative mx-auto mt-12 max-w-2xl"
        >
          <div className="absolute inset-0 -z-10 rounded-xl3 bg-grid-faint bg-[size:32px_32px] opacity-40" />
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => inputRef.current?.click()}
            className={`group relative cursor-pointer rounded-xl3 border-2 border-dashed bg-ink-900/40 px-8 py-14 backdrop-blur-sm transition-all duration-300 ${
              drag ? 'border-primary-400 bg-primary-500/5 scale-[1.01]' : 'border-white/10 hover:border-white/20 hover:bg-ink-900/60'
            }`}
          >
            <input
              ref={inputRef} type="file" accept=".csv,.xlsx,.xls,.json" className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-300 transition group-hover:scale-105 group-hover:bg-primary-500/20">
                <UploadCloud size={28} />
              </div>
              <div>
                <p className="text-lg font-medium text-ink-100">Drop your dataset here</p>
                <p className="mt-1 text-sm text-ink-500">or click to browse</p>
              </div>
              <div className="mt-1 flex items-center gap-2 text-2xs text-ink-500">
                <Chip icon={FileText}>CSV</Chip>
                <Chip icon={FileSpreadsheet}>Excel</Chip>
                <Chip icon={FileJson}>JSON</Chip>
              </div>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button onClick={loadSample} disabled={loading} className="btn-primary">
              <Sparkles size={15} /> Analyze sample dataset
              <ArrowRight size={15} />
            </button>
          </div>
          <p className="mt-3 text-2xs text-ink-600">Everything runs locally in your browser. Your data never leaves your device.</p>
        </motion.div>
      </section>

      {/* features */}
      <section id="features" className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-ink-50">One upload. A complete intelligence report.</h2>
          <p className="mt-2 text-sm text-ink-400">DataLens does the work of a data scientist in seconds.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.06 }}
              className="card card-hover p-5"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/12 text-primary-300">
                <f.icon size={18} />
              </div>
              <h3 className="text-sm font-semibold text-ink-100">{f.title}</h3>
              <p className="mt-1.5 text-2xs leading-relaxed text-ink-400">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section id="how" className="relative z-10 mx-auto max-w-6xl px-6 pb-32">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { n: '01', t: 'Upload', d: 'Drop a CSV, Excel or JSON file. No setup, no accounts.' },
            { n: '02', t: 'Analyze', d: 'DataLens profiles, cleans and models your data automatically.' },
            { n: '03', t: 'Explore', d: 'Browse interactive charts, insights and a downloadable report.' },
          ].map((s) => (
            <div key={s.n} className="card p-6">
              <div className="font-mono text-2xs text-primary-400">{s.n}</div>
              <h3 className="mt-2 text-base font-semibold text-ink-100">{s.t}</h3>
              <p className="mt-1.5 text-sm text-ink-400">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-2xs text-ink-600">
        DataLens — See Beyond the Spreadsheet
      </footer>
    </div>
  );
}

function Chip({ children, icon: Icon }: { children: React.ReactNode; icon: React.ComponentType<{ size?: number }> }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/5 px-2.5 py-1">
      <Icon size={11} /> {children}
    </span>
  );
}

function Logo() {
  return (
    <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 shadow-glow">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-ink-950">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
      </svg>
    </div>
  );
}
