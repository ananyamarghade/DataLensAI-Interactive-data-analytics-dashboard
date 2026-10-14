import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useDataset } from '@/context/DatasetContext';
import { Card, SectionHeader, Pill, InfoTip } from '@/components/ui/InfoTip';
import { CorrelationHeatmap } from '@/components/charts/Charts';
import type { CorrelationPair } from '@/types';

export function RelationshipsPage() {
  const { result } = useDataset();
  if (!result) return null;
  const { correlations, correlationMatrix } = result;

  const strong = correlations.filter((c) => c.strength === 'strong');
  const moderate = correlations.filter((c) => c.strength === 'moderate');
  const weak = correlations.filter((c) => c.strength === 'weak');
  const negligible = correlations.filter((c) => c.strength === 'negligible');

  return (
    <div>
      <SectionHeader title="Relationships" subtitle="How your numeric columns move together." />

      {correlationMatrix.length > 1 ? (
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CorrelationHeatmap matrix={correlationMatrix} />
          </div>
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-ink-100">Summary</h3>
            <div className="space-y-3">
              <SummaryRow label="Strong" count={strong.length} tone="success" />
              <SummaryRow label="Moderate" count={moderate.length} tone="primary" />
              <SummaryRow label="Weak" count={weak.length} tone="warning" />
              <SummaryRow label="Negligible" count={negligible.length} tone="neutral" />
            </div>
            <div className="mt-5 rounded-lg bg-white/[0.03] p-3 text-sm text-ink-400">
              <InfoTipInline />
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-12 text-center text-sm text-ink-400">Need at least two numeric columns.</Card>
      )}

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-ink-100">Relationship Ranking</h3>
        <div className="space-y-2">
          {correlations.slice(0, 12).map((pair, i) => (
            <motion.div key={`${pair.a}-${pair.b}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
              <CorrelationRow pair={pair} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CorrelationRow({ pair }: { pair: CorrelationPair }) {
  const Icon = pair.direction === 'positive' ? TrendingUp : pair.direction === 'negative' ? TrendingDown : Minus;
  const abs = Math.abs(pair.r);
  const tone = pair.strength === 'strong' ? 'success' : pair.strength === 'moderate' ? 'primary' : pair.strength === 'weak' ? 'warning' : 'neutral';
  return (
    <Card className="p-4" hover>
      <div className="flex items-center gap-4">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${pair.direction === 'positive' ? 'bg-primary-500/15 text-primary-300' : 'bg-red-500/15 text-red-300'}`}>
          <Icon size={16} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-ink-100">{pair.a} ↔ {pair.b}</span>
            <Pill tone={tone}>{pair.strength}</Pill>
          </div>
          <p className="mt-1 text-sm text-ink-400">{pair.explanation}</p>
        </div>
        <div className="text-right">
          <div className={`text-lg font-semibold ${pair.r >= 0 ? 'text-primary-400' : 'text-red-400'}`}>{pair.r.toFixed(2)}</div>
          <div className="text-2xs text-ink-500">r value</div>
        </div>
        <div className="hidden w-24 sm:block">
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <div className={`h-full rounded-full ${pair.r >= 0 ? 'bg-primary-500' : 'bg-red-500'}`} style={{ width: `${abs * 100}%` }} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function SummaryRow({ label, count, tone }: { label: string; count: number; tone: 'success' | 'primary' | 'warning' | 'neutral' }) {
  return (
    <div className="flex items-center justify-between">
      <Pill tone={tone}>{label}</Pill>
      <span className="text-sm font-semibold text-ink-100">{count}</span>
    </div>
  );
}

function InfoTipInline() {
  return (
    <div className="flex items-start gap-2">
      <InfoTip
        title="Pearson Correlation"
        definition="A measure of linear association between two numeric columns, from −1 to +1."
        formula="r = Σ(xᵢ−x̄)(yᵢ−ȳ) / √(Σ(xᵢ−x̄)² · Σ(yᵢ−ȳ)²)"
        why="Strong correlations reveal redundant features or causal hypotheses. Near-zero means no linear relationship."
        example="Height and weight are positively correlated; price and demand often negatively correlated."
      />
      <p className="text-2xs text-ink-500">|r| &gt; 0.7 strong, 0.4–0.7 moderate, 0.2–0.4 weak, &lt; 0.2 negligible.</p>
    </div>
  );
}
