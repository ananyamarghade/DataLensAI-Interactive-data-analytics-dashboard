import { motion } from 'framer-motion';
import {
  Lightbulb, TrendingUp, AlertTriangle, GitCompare, BarChart3, Clock, Sparkles, Database,
} from 'lucide-react';
import { useDataset } from '@/context/DatasetContext';
import { Card, SectionHeader, Pill } from '@/components/ui/InfoTip';
import type { Insight } from '@/types';

const CATEGORY_ICON: Record<Insight['category'], React.ComponentType<{ size?: number }>> = {
  distribution: BarChart3,
  correlation: GitCompare,
  missing: AlertTriangle,
  category: Sparkles,
  time: Clock,
  outlier: TrendingUp,
  quality: Database,
  group: Lightbulb,
};

const IMPORTANCE_TONE: Record<Insight['importance'], 'error' | 'warning' | 'neutral'> = {
  high: 'error', medium: 'warning', low: 'neutral',
};

export function InsightsPage() {
  const { result } = useDataset();
  if (!result) return null;
  const { insights } = result;

  return (
    <div>
      <SectionHeader title="Insights" subtitle="Plain-language findings DataLens discovered in your data." />

      {insights.length === 0 ? (
        <Card className="p-12 text-center text-sm text-ink-400">No notable insights were detected.</Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {insights.map((ins, i) => {
            const Icon = CATEGORY_ICON[ins.category];
            return (
              <motion.div key={ins.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="flex h-full flex-col p-5" hover>
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500/12 text-primary-300">
                      <Icon size={15} />
                    </div>
                    <h3 className="text-sm font-semibold text-ink-100">{ins.title}</h3>
                    <Pill tone={IMPORTANCE_TONE[ins.importance]}>{ins.importance}</Pill>
                  </div>
                  <p className="text-sm leading-relaxed text-ink-300">{ins.text}</p>
                  <div className="mt-auto pt-3">
                    <span className="chip bg-white/5 capitalize text-ink-500">{ins.category}</span>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
