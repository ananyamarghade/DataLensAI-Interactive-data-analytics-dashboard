import { motion } from 'framer-motion';
import { useDataset } from '@/context/DatasetContext';
import { Card, SectionHeader, Pill, InfoTip } from '@/components/ui/InfoTip';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import type { NumericStats, CategoricalStats } from '@/types';

const STAT_TIPS: Record<string, { title: string; definition: string; formula?: string; why: string; example: string }> = {
  mean: { title: 'Mean', definition: 'The arithmetic average of all values.', formula: 'Σx / n', why: 'The most common measure of central tendency, but sensitive to outliers.', example: 'Mean of [2,4,6,8] is 5.' },
  median: { title: 'Median', definition: 'The middle value when data is sorted.', why: 'Robust to outliers — better than mean for skewed data.', example: 'Median of [1,2,1000] is 2, vs mean of 334.' },
  std: { title: 'Standard Deviation', definition: 'Average distance of values from the mean.', formula: '√(Σ(x-μ)²/(n-1))', why: 'Measures spread. Higher = more variable.', example: 'SD of test scores shows how consistent the class is.' },
  variance: { title: 'Variance', definition: 'Squared standard deviation.', formula: 'σ²', why: 'Used in many statistical tests, though in original squared units.', example: 'Variance of heights in cm².' },
  skewness: { title: 'Skewness', definition: 'Asymmetry of the distribution.', formula: 'E[(x-μ)³]/σ³', why: 'Positive = right tail, negative = left tail. Affects which average to trust.', example: 'Income is right-skewed — a few high earners pull the mean up.' },
  kurtosis: { title: 'Kurtosis', definition: 'Tailedness of the distribution.', why: 'High kurtosis means heavy tails — more outliers than a normal distribution.', example: 'Stock returns often have high kurtosis.' },
  iqr: { title: 'Interquartile Range', definition: 'Range of the middle 50% (Q3 − Q1).', formula: 'Q3 − Q1', why: 'Robust spread measure used to detect outliers.', example: 'IQR of house prices avoids distortion by mansions.' },
  cv: { title: 'Coefficient of Variation', definition: 'Standard deviation relative to the mean.', formula: 'σ / |μ|', why: 'Compares variability across columns with different units.', example: 'CV of 0.5 means spread is half the mean.' },
  mad: { title: 'Median Absolute Deviation', definition: 'Median of absolute deviations from the median.', why: 'A robust alternative to standard deviation.', example: 'Used in outlier detection for noisy sensors.' },
  range: { title: 'Range', definition: 'Difference between max and min.', formula: 'max − min', why: 'Simplest spread measure, but sensitive to extremes.', example: 'Temperature range from 10°C to 30°C is 20°C.' },
};

export function StatisticsPage() {
  const { result } = useDataset();
  if (!result) return null;
  const { stats } = result;

  return (
    <div>
      <SectionHeader title="Statistics" subtitle="Descriptive statistics for every column, numeric and categorical." />

      <div className="space-y-4">
        {stats.map((s, idx) => (
          <motion.div key={s.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
            <Card className="p-5" hover>
              <div className="mb-4 flex items-center gap-2">
                <h3 className="text-sm font-semibold text-ink-100">{s.name}</h3>
                <Pill tone={s.type === 'numeric' ? 'primary' : 'neutral'}>{s.type}</Pill>
                <span className="text-2xs text-ink-500">{s.nullPct.toFixed(1)}% null</span>
              </div>
              {s.numeric ? <NumericGrid stats={s.numeric} /> : <CategoricalGrid stats={s.categorical!} />}
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function NumericGrid({ stats }: { stats: NumericStats }) {
  const items: { key: string; label: string; value: number; decimals?: number }[] = [
    { key: 'mean', label: 'Mean', value: stats.mean, decimals: 2 },
    { key: 'median', label: 'Median', value: stats.median, decimals: 2 },
    { key: 'mode', label: 'Mode', value: stats.mode, decimals: 2 },
    { key: 'min', label: 'Minimum', value: stats.min, decimals: 2 },
    { key: 'max', label: 'Maximum', value: stats.max, decimals: 2 },
    { key: 'range', label: 'Range', value: stats.range, decimals: 2 },
    { key: 'std', label: 'Std Dev', value: stats.std, decimals: 2 },
    { key: 'variance', label: 'Variance', value: stats.variance, decimals: 2 },
    { key: 'p25', label: '25th %ile', value: stats.p25, decimals: 2 },
    { key: 'p50', label: '50th %ile', value: stats.p50, decimals: 2 },
    { key: 'p75', label: '75th %ile', value: stats.p75, decimals: 2 },
    { key: 'p90', label: '90th %ile', value: stats.p90, decimals: 2 },
    { key: 'p95', label: '95th %ile', value: stats.p95, decimals: 2 },
    { key: 'p99', label: '99th %ile', value: stats.p99, decimals: 2 },
    { key: 'iqr', label: 'IQR', value: stats.iqr, decimals: 2 },
    { key: 'cv', label: 'Coeff. Var', value: stats.cv, decimals: 3 },
    { key: 'mad', label: 'MAD', value: stats.mad, decimals: 2 },
    { key: 'skewness', label: 'Skewness', value: stats.skewness, decimals: 3 },
    { key: 'kurtosis', label: 'Kurtosis', value: stats.kurtosis, decimals: 3 },
    { key: 'outliers', label: 'Outliers', value: stats.outliers, decimals: 0 },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
      {items.map((it) => (
        <div key={it.key} className="rounded-lg bg-white/[0.03] p-2.5">
          <div className="flex items-center gap-1">
            <span className="text-2xs uppercase tracking-wider text-ink-500">{it.label}</span>
            {STAT_TIPS[it.key] && <InfoTip {...STAT_TIPS[it.key]} />}
          </div>
          <div className="mt-0.5 text-sm font-semibold text-ink-100">
            <AnimatedCounter value={it.value} decimals={it.decimals ?? 2} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoricalGrid({ stats }: { stats: CategoricalStats }) {
  return (
    <div>
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ['Unique', stats.unique],
          ['Top value', stats.top],
          ['Top freq', stats.topFreq],
          ['Top %', stats.topPct],
        ].map(([k, v]) => (
          <div key={k as string} className="rounded-lg bg-white/[0.03] p-2.5">
            <div className="text-2xs uppercase tracking-wider text-ink-500">{k}</div>
            <div className="mt-0.5 truncate text-sm font-semibold text-ink-100">{typeof v === 'number' ? (k === 'Top %' ? `${v.toFixed(1)}%` : v.toLocaleString()) : String(v)}</div>
          </div>
        ))}
      </div>
      <div className="section-title mb-2">Frequency Table</div>
      <div className="space-y-1">
        {stats.frequency.slice(0, 10).map((f) => (
          <div key={f.value} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-sm text-ink-300" title={f.value}>{f.value}</span>
            <div className="h-5 flex-1 overflow-hidden rounded bg-white/5">
              <motion.div
                className="h-full rounded bg-primary-500/60"
                initial={{ width: 0 }}
                animate={{ width: `${f.pct}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
            <span className="w-16 shrink-0 text-right text-2xs text-ink-500">{f.count} · {f.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
