import { motion } from 'framer-motion';
import { useDataset } from '@/context/DatasetContext';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Card, SectionHeader, Pill, InfoTip } from '@/components/ui/InfoTip';
import { RadialStat } from '@/components/charts/Charts';
import type { HealthBreakdown } from '@/types';

const TIPS: Record<keyof HealthBreakdown, { title: string; definition: string; why: string; example: string }> = {
  completeness: { title: 'Completeness', definition: 'Percentage of non-missing cells across the dataset.', why: 'Missing data reduces statistical power and can bias results if missingness is not random.', example: 'A survey with 20% of ages blank has 80% completeness in that column.' },
  consistency: { title: 'Consistency', definition: 'How uniformly typed and formatted each column is.', why: 'Mixed types and stray whitespace break joins, grouping and type-based operations.', example: 'A "price" column mixing "$10" and "10" strings is inconsistent.' },
  accuracy: { title: 'Accuracy', definition: 'Absence of high-severity data quality issues like invalid negatives or impossible values.', why: 'Inaccurate values propagate into every downstream metric and model.', example: 'Negative age or a temperature of 9999 are accuracy errors.' },
  duplicates: { title: 'Duplicates', definition: 'Share of rows that are not exact duplicates of another row.', why: 'Duplicate rows double-count observations and inflate aggregates.', example: 'The same order logged twice inflates total revenue.' },
  missing: { title: 'Missing Data', definition: 'Inverse of the overall missing-value percentage.', why: 'High missingness signals collection problems or irrelevant fields.', example: 'A column 40% empty may need to be dropped.' },
  dataTypes: { title: 'Data Types', definition: 'Share of columns successfully classified into a known type.', why: 'Unclassified columns cannot be analyzed numerically or temporally.', example: 'A free-text notes column may remain unclassified.' },
};

export function HealthPage() {
  const { result } = useDataset();
  if (!result) return null;
  const { health } = result;

  return (
    <div>
      <SectionHeader title="Dataset Health" subtitle="A composite quality score across six dimensions." />

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center p-6">
          <ProgressRing value={health.score} size={160} stroke={12} label="Health Score" sublabel={health.grade} />
          <p className="mt-4 text-center text-sm text-ink-400">
            {health.score >= 80 ? 'Your dataset is in great shape.' : health.score >= 60 ? 'Some issues need attention.' : 'Significant cleaning recommended.'}
          </p>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-ink-100">Breakdown</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {(Object.keys(health.breakdown) as (keyof HealthBreakdown)[]).map((key) => (
              <div key={key}>
                <RadialStat value={health.breakdown[key]} label={key} color={colorFor(health.breakdown[key])} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 space-y-2">
        {health.issues.map((issue, i) => {
          const tip = TIPS[issue.area.toLowerCase() as keyof HealthBreakdown];
          return (
            <motion.div key={issue.area} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="flex items-center gap-4 p-4" hover>
                <div className="flex w-12 shrink-0 justify-center">
                  <ProgressRing value={issue.score} size={52} stroke={5} gradient={false} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-ink-100">{issue.area}</h4>
                    {tip && <InfoTip {...tip} />}
                    <Pill tone={issue.impact === 'high' ? 'error' : issue.impact === 'medium' ? 'warning' : 'neutral'}>{issue.impact} impact</Pill>
                  </div>
                  <p className="mt-1 text-sm text-ink-400">{issue.detail}</p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function colorFor(score: number): string {
  if (score >= 85) return '#1ba87f';
  if (score >= 70) return '#3cc49b';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}
