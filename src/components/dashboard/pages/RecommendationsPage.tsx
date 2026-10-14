import { motion } from 'framer-motion';
import { Check, ListChecks } from 'lucide-react';
import { useDataset } from '@/context/DatasetContext';
import { Card, SectionHeader, Pill } from '@/components/ui/InfoTip';
import type { Recommendation } from '@/types';

const IMPACT_TONE: Record<Recommendation['impact'], 'error' | 'warning' | 'neutral'> = {
  high: 'error', medium: 'warning', low: 'neutral',
};

const CATEGORY_LABEL: Record<Recommendation['category'], string> = {
  cleaning: 'Cleaning', modeling: 'Modeling', visualization: 'Visualization', quality: 'Quality', feature: 'Feature',
};

export function RecommendationsPage() {
  const { result } = useDataset();
  if (!result) return null;
  const { recommendations } = result;

  return (
    <div>
      <SectionHeader title="Recommendations" subtitle="Suggested actions to improve your dataset and analysis." />

      {recommendations.length === 0 ? (
        <Card className="p-12 text-center text-sm text-ink-400">No recommendations — your dataset looks clean.</Card>
      ) : (
        <div className="space-y-2">
          {recommendations.map((rec, i) => (
            <motion.div key={rec.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="flex items-start gap-3 p-4" hover>
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-500/12 text-primary-300">
                  <Check size={14} />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-semibold text-ink-100">{rec.title}</h4>
                    <Pill tone={IMPACT_TONE[rec.impact]}>{rec.impact} impact</Pill>
                    <span className="chip bg-white/5 text-ink-400">{CATEGORY_LABEL[rec.category]}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-400">{rec.text}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
