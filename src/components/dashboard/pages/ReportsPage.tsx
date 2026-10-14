import { useState } from 'react';
import { FileText, Download, FileCode, FileType } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useDataset } from '@/context/DatasetContext';
import { Card, SectionHeader, Pill } from '@/components/ui/InfoTip';
import { saveAs } from 'file-saver';

export function ReportsPage() {
  const { result } = useDataset();
  const [generating, setGenerating] = useState(false);
  if (!result) return null;

  const buildReport = () => {
    const r = result;
    const sections: { title: string; body: string }[] = [
      { title: 'Executive Summary', body: `This report covers "${r.meta.name}" containing ${r.meta.rows.toLocaleString()} rows and ${r.meta.columns} columns. Overall data health is ${r.health.score}/100 (${r.health.grade}). ${r.cleaning.issues.length} data quality issues were detected, and ${r.insights.length} insights were generated.` },
      { title: 'Dataset Health', body: r.health.issues.map((i) => `${i.area}: ${i.score}/100 — ${i.detail}`).join('\n') },
      { title: 'Cleaning Summary', body: `${r.cleaning.issues.length} issues found.\nBefore: ${r.cleaning.before.rows} rows, ${r.cleaning.before.missing} missing, ${r.cleaning.before.duplicates} duplicates.\nAfter cleaning: ${r.cleaning.after.rows} rows, ${r.cleaning.after.missing} missing, ${r.cleaning.after.duplicates} duplicates.\n\nTop issues:\n${r.cleaning.issues.slice(0, 8).map((i) => `• ${i.title} — ${i.suggestion}`).join('\n')}` },
      { title: 'Statistics', body: r.stats.map((s) => {
        if (s.numeric) return `${s.name} (numeric): mean=${s.numeric.mean.toFixed(2)}, median=${s.numeric.median.toFixed(2)}, std=${s.numeric.std.toFixed(2)}, min=${s.numeric.min}, max=${s.numeric.max}, skew=${s.numeric.skewness.toFixed(2)}`;
        if (s.categorical) return `${s.name} (categorical): ${s.categorical.unique} unique, top="${s.categorical.top}" (${s.categorical.topPct.toFixed(1)}%)`;
        return `${s.name}: ${s.type}`;
      }).join('\n') },
      { title: 'Insights', body: r.insights.map((i, n) => `${n + 1}. ${i.title}\n   ${i.text}`).join('\n\n') },
      { title: 'Recommendations', body: r.recommendations.map((i, n) => `${n + 1}. ${i.title}\n   ${i.text}`).join('\n\n') },
      { title: 'Relationships', body: r.correlations.slice(0, 10).map((c) => `${c.a} ↔ ${c.b}: r=${c.r} (${c.strength} ${c.direction})`).join('\n') },
      { title: 'Appendix', body: `Columns:\n${r.columns.map((c) => `• ${c.name} — ${c.type}, ${c.missing} missing, ${c.unique} unique`).join('\n')}` },
    ];
    return sections;
  };

  const downloadHtml = () => {
    const sections = buildReport();
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>DataLens Report — ${result.meta.name}</title>
<style>
body{font-family:-apple-system,system-ui,sans-serif;max-width:780px;margin:40px auto;padding:0 24px;color:#1a1a1a;line-height:1.6}
h1{font-size:28px;border-bottom:3px solid #1ba87f;padding-bottom:8px}
h2{font-size:18px;margin-top:32px;color:#105544}
.meta{color:#666;font-size:14px;margin-bottom:24px}
pre{white-space:pre-wrap;font-family:inherit;font-size:14px;background:#f7f8fa;padding:16px;border-radius:8px;border:1px solid #eee}
</style></head><body>
<h1>DataLens Report</h1>
<div class="meta">${result.meta.name} · ${result.meta.rows.toLocaleString()} rows × ${result.meta.columns} columns · ${new Date().toLocaleString()}</div>
${sections.map((s) => `<h2>${s.title}</h2><pre>${escapeHtml(s.body)}</pre>`).join('')}
</body></html>`;
    saveAs(new Blob([html], { type: 'text/html' }), `datalens_report_${result.meta.name.replace(/\.[^.]+$/, '')}.html`);
  };

  const downloadPdf = async () => {
    setGenerating(true);
    // Use browser print to PDF via a new window
    const sections = buildReport();
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>DataLens Report — ${result.meta.name}</title>
<style>
body{font-family:-apple-system,system-ui,sans-serif;max-width:780px;margin:40px auto;padding:0 24px;color:#1a1a1a;line-height:1.6}
h1{font-size:28px;border-bottom:3px solid #1ba87f;padding-bottom:8px}
h2{font-size:18px;margin-top:32px;color:#105544}
pre{white-space:pre-wrap;font-family:inherit;font-size:13px;background:#f7f8fa;padding:16px;border-radius:8px;border:1px solid #eee}
</style></head><body>
<h1>DataLens Report</h1>
<div style="color:#666;font-size:14px;margin-bottom:24px">${result.meta.name} · ${result.meta.rows.toLocaleString()} rows × ${result.meta.columns} columns · ${new Date().toLocaleString()}</div>
${sections.map((s) => `<h2>${s.title}</h2><pre>${escapeHtml(s.body)}</pre>`).join('')}
<script>window.onload=()=>{setTimeout(()=>window.print(),300)}</script>
</body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
    setGenerating(false);
  };

  const downloadDocx = () => {
    // Minimal Word-compatible HTML document
    const sections = buildReport();
    const body = sections.map((s) => `<h2>${s.title}</h2><p style="white-space:pre-wrap">${escapeHtml(s.body)}</p>`).join('');
    const docx = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset="utf-8"><title>DataLens Report</title></head><body style="font-family:Calibri,sans-serif"><h1>DataLens Report — ${result.meta.name}</h1>${body}</body></html>`;
    saveAs(new Blob(['\ufeff', docx], { type: 'application/msword' }), `datalens_report_${result.meta.name.replace(/\.[^.]+$/, '')}.doc`);
  };

  return (
    <div>
      <SectionHeader title="Reports" subtitle="Generate and download a professional report of your analysis." />

      <div className="grid gap-3 sm:grid-cols-3">
        <ReportCard icon={FileType} title="PDF" desc="Print-ready document" onClick={downloadPdf} loading={generating} />
        <ReportCard icon={FileText} title="DOCX" desc="Editable Word document" onClick={downloadDocx} />
        <ReportCard icon={FileCode} title="HTML" desc="Self-contained web page" onClick={downloadHtml} />
      </div>

      <Card className="mt-6 p-6">
        <h3 className="mb-4 text-sm font-semibold text-ink-100">Report Preview</h3>
        <div className="space-y-5 text-sm">
          <div>
            <div className="section-title mb-1">Executive Summary</div>
            <p className="text-ink-300 leading-relaxed">
              This report covers "{result.meta.name}" containing {result.meta.rows.toLocaleString()} rows and {result.meta.columns} columns.
              Overall data health is <span className="text-primary-400">{result.health.score}/100 ({result.health.grade})</span>.
              {result.cleaning.issues.length} data quality issues were detected, and {result.insights.length} insights were generated.
            </p>
          </div>
          <div>
            <div className="section-title mb-1">Key Insights</div>
            <ul className="space-y-1.5 text-ink-300">
              {result.insights.slice(0, 4).map((i) => (
                <li key={i.id} className="flex gap-2">
                  <span className="text-primary-400">•</span> {i.text}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="section-title mb-1">Top Recommendations</div>
            <ul className="space-y-1.5 text-ink-300">
              {result.recommendations.slice(0, 4).map((i) => (
                <li key={i.id} className="flex gap-2">
                  <span className="text-primary-400">•</span> {i.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Pill tone="primary">{result.meta.rows.toLocaleString()} rows</Pill>
          <Pill>{result.meta.columns} columns</Pill>
          <Pill tone="success">{result.health.score} health</Pill>
          <Pill tone="warning">{result.cleaning.issues.length} issues</Pill>
          <Pill tone="info">{result.insights.length} insights</Pill>
        </div>
      </Card>
    </div>
  );
}

function ReportCard({ icon: Icon, title, desc, onClick, loading }: { icon: LucideIcon; title: string; desc: string; onClick: () => void; loading?: boolean }) {
  return (
    <button onClick={onClick} disabled={loading} className="card card-hover flex flex-col items-start p-5 text-left transition disabled:opacity-50">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/12 text-primary-300">
        <Icon size={18} />
      </div>
      <h3 className="text-sm font-semibold text-ink-100">{title}</h3>
      <p className="mt-0.5 text-2xs text-ink-400">{desc}</p>
      <div className="mt-3 flex items-center gap-1 text-2xs text-primary-400">
        <Download size={12} /> {loading ? 'Preparing…' : 'Download'}
      </div>
    </button>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
