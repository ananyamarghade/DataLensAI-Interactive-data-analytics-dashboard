import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { AnalysisResult } from '@/types';
import { analyze } from '@/lib/analyze';
import { parseFile, type ParsedFile } from '@/lib/parse';
import { sampleDataset } from '@/lib/sample';

interface DatasetContextValue {
  result: AnalysisResult | null;
  loading: boolean;
  stage: number;
  error: string | null;
  upload: (file: File) => Promise<void>;
  loadSample: () => Promise<void>;
  clear: () => void;
}

const DatasetContext = createContext<DatasetContextValue | null>(null);

export function DatasetProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function run(parsed: ParsedFile) {
    setLoading(true);
    setError(null);
    setStage(0);
    // step through pipeline stages for the animation
    const stages = 8;
    for (let i = 0; i < stages; i++) {
      setStage(i);
      await delay(280 + Math.random() * 220);
    }
    try {
      const res = analyze(parsed.rows, parsed.name, parsed.fileSize);
      setResult(res);
      setStage(stages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }

  const value = useMemo<DatasetContextValue>(() => ({
    result, loading, stage, error,
    upload: async (file: File) => {
      try {
        const parsed = await parseFile(file);
        if (!parsed.rows.length) throw new Error('The file appears to be empty.');
        await run(parsed);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not read this file.');
        setLoading(false);
      }
    },
    loadSample: async () => {
      const s = sampleDataset();
      await run(s);
    },
    clear: () => { setResult(null); setError(null); setStage(0); },
  }), [result, loading, stage, error]);

  return <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>;
}

export function useDataset() {
  const ctx = useContext(DatasetContext);
  if (!ctx) throw new Error('useDataset must be used within DatasetProvider');
  return ctx;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
