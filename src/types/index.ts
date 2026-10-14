// Core domain types shared across the analysis engine and UI.

export type ColumnType = 'numeric' | 'categorical' | 'datetime' | 'boolean' | 'unknown';

export type CellValue = string | number | boolean | null;

export interface DatasetMeta {
  name: string;
  rows: number;
  columns: number;
  fileSize: number; // bytes
  memoryUsage: number; // bytes (estimated)
  uploadTime: string; // ISO
  duplicateRows: number;
  missingTotal: number;
  missingPct: number;
}

export interface ColumnInfo {
  name: string;
  type: ColumnType;
  dtype: string; // pandas-like dtype label
  missing: number;
  missingPct: number;
  unique: number;
  uniquePct: number;
  sample: CellValue[];
}

export interface NumericStats {
  count: number;
  mean: number;
  median: number;
  mode: number;
  min: number;
  max: number;
  range: number;
  variance: number;
  std: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  iqr: number;
  cv: number; // coefficient of variation
  mad: number; // median absolute deviation
  skewness: number;
  kurtosis: number;
  outliers: number;
  zscoreOutliers: number;
}

export interface CategoricalStats {
  count: number;
  unique: number;
  top: string;
  topFreq: number;
  topPct: number;
  frequency: { value: string; count: number; pct: number }[];
}

export interface ColumnStats {
  name: string;
  type: ColumnType;
  numeric?: NumericStats;
  categorical?: CategoricalStats;
  nullPct: number;
}

export interface HealthBreakdown {
  completeness: number;
  consistency: number;
  accuracy: number;
  duplicates: number;
  missing: number;
  dataTypes: number;
}

export interface HealthReport {
  score: number;
  grade: string;
  breakdown: HealthBreakdown;
  issues: { area: string; score: number; detail: string; impact: 'low' | 'medium' | 'high' }[];
}

export interface CleaningIssue {
  id: string;
  column: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  affected: number;
  suggestion: string;
}

export interface CleaningResult {
  issues: CleaningIssue[];
  before: { rows: number; missing: number; duplicates: number };
  after: { rows: number; missing: number; duplicates: number };
  cleanedRows: number;
}

export interface CorrelationPair {
  a: string;
  b: string;
  r: number;
  strength: 'strong' | 'moderate' | 'weak' | 'negligible';
  direction: 'positive' | 'negative';
  explanation: string;
}

export interface Insight {
  id: string;
  category: 'distribution' | 'correlation' | 'missing' | 'category' | 'time' | 'outlier' | 'quality' | 'group';
  title: string;
  text: string;
  chart?: string;
  importance: 'high' | 'medium' | 'low';
}

export interface Recommendation {
  id: string;
  title: string;
  text: string;
  category: 'cleaning' | 'modeling' | 'visualization' | 'quality' | 'feature';
  impact: 'high' | 'medium' | 'low';
}

export interface GroupAnalysis {
  groupBy: string;
  aggregate: string;
  aggFunc: 'mean' | 'sum' | 'count' | 'median';
  results: { label: string; value: number }[];
  insight: string;
}

export interface AnalysisResult {
  meta: DatasetMeta;
  columns: ColumnInfo[];
  stats: ColumnStats[];
  health: HealthReport;
  cleaning: CleaningResult;
  correlations: CorrelationPair[];
  correlationMatrix: { name: string; values: number[] }[];
  insights: Insight[];
  recommendations: Recommendation[];
  groups: GroupAnalysis[];
  rows: Record<string, CellValue>[];
  numericColumns: string[];
  categoricalColumns: string[];
  datetimeColumns: string[];
}
