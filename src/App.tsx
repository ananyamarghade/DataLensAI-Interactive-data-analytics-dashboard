import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { DatasetProvider, useDataset } from '@/context/DatasetContext';
import { LandingPage } from '@/components/landing/LandingPage';
import { AnalysisPipeline } from '@/components/landing/AnalysisPipeline';
import { DashboardLayout, type PageKey } from '@/components/dashboard/DashboardLayout';
import { OverviewPage } from '@/components/dashboard/pages/OverviewPage';
import { HealthPage } from '@/components/dashboard/pages/HealthPage';
import { CleaningPage } from '@/components/dashboard/pages/CleaningPage';
import { StatisticsPage } from '@/components/dashboard/pages/StatisticsPage';
import { VisualizationsPage } from '@/components/dashboard/pages/VisualizationsPage';
import { RelationshipsPage } from '@/components/dashboard/pages/RelationshipsPage';
import { InsightsPage } from '@/components/dashboard/pages/InsightsPage';
import { RecommendationsPage } from '@/components/dashboard/pages/RecommendationsPage';
import { ReportsPage } from '@/components/dashboard/pages/ReportsPage';
import { SettingsPage } from '@/components/dashboard/pages/SettingsPage';

function AppInner() {
  const { result, loading, error, clear } = useDataset();
  const [page, setPage] = useState<PageKey>('overview');

  if (loading) return <AnalysisPipeline />;
  if (!result) {
    return (
      <>
        <LandingPage />
        {error && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300 backdrop-blur-xl">
            {error}
          </div>
        )}
      </>
    );
  }

  return (
    <DashboardLayout page={page} setPage={setPage} onNewUpload={clear} onClear={clear}>
      <AnimatePresence mode="wait">
        {page === 'overview' && <OverviewPage />}
        {page === 'health' && <HealthPage />}
        {page === 'cleaning' && <CleaningPage />}
        {page === 'statistics' && <StatisticsPage />}
        {page === 'visualizations' && <VisualizationsPage />}
        {page === 'relationships' && <RelationshipsPage />}
        {page === 'insights' && <InsightsPage />}
        {page === 'recommendations' && <RecommendationsPage />}
        {page === 'reports' && <ReportsPage />}
        {page === 'settings' && <SettingsPage onNewUpload={clear} />}
      </AnimatePresence>
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <DatasetProvider>
      <AppInner />
    </DatasetProvider>
  );
}
