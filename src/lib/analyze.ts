import type {
  AnalysisResult, CellValue, ColumnInfo, ColumnStats, ColumnType,
  CorrelationPair, CleaningIssue, CleaningResult, DatasetMeta, GroupAnalysis,
  HealthBreakdown, HealthReport, Insight, Recommendation, CategoricalStats, NumericStats,
} from '@/types';
import {
  mean, median, mode, std, variance, percentile, min, max, range, iqr, cv, mad,
  skewness, kurtosis, countOutliers, countZscoreOutliers, correlation, toNumbers,
} from './stats';
import { detectType, uniqueCount, isLikelyId } from './detect';

const DTYPE: Record<ColumnType, string> = {
  numeric: 'float64',
  categorical: 'object',
  datetime: 'datetime64[ns]',
  boolean: 'bool',
  unknown: 'object',
};

export function analyze(rows: Record<string, CellValue>[], name: string, fileSize: number): AnalysisResult {
  const columns = Object.keys(rows[0] ?? {});
  const rowCount = rows.length;
  const colCount = columns.length;

  // Per-column info
  const columnInfos: ColumnInfo[] = columns.map((col) => {
    const values = rows.map((r) => r[col]);
    const type = detectType(values);
    const missing = values.filter((v) => v === null || v === '' || v === undefined).length;
    const unique = uniqueCount(values);
    return {
      name: col,
      type,
      dtype: DTYPE[type],
      missing,
      missingPct: rowCount ? (missing / rowCount) * 100 : 0,
      unique,
      uniquePct: rowCount ? (unique / rowCount) * 100 : 0,
      sample: values.slice(0, 5),
    };
  });

  // Stats per column
  const stats: ColumnStats[] = columnInfos.map((info) => {
    const values = rows.map((r) => r[info.name]);
    if (info.type === 'numeric') {
      const nums = toNumbers(values);
      return {
        name: info.name,
        type: info.type,
        nullPct: info.missingPct,
        numeric: numericStats(nums),
      };
    }
    return {
      name: info.name,
      type: info.type,
      nullPct: info.missingPct,
      categorical: categoricalStats(values),
    };
  });

  // Meta
  const duplicateRows = rowCount - new Set(rows.map((r) => JSON.stringify(r))).size;
  const missingTotal = columnInfos.reduce((s, c) => s + c.missing, 0);
  const memoryUsage = estimateMemory(rows, columnInfos);
  const meta: DatasetMeta = {
    name, rows: rowCount, columns: colCount, fileSize,
    memoryUsage, uploadTime: new Date().toISOString(),
    duplicateRows, missingTotal,
    missingPct: rowCount * colCount ? (missingTotal / (rowCount * colCount)) * 100 : 0,
  };

  // Cleaning
  const cleaning = detectCleaning(rows, columnInfos);

  // Health
  const health = computeHealth(meta, columnInfos, cleaning);

  // Correlations
  const numericCols = columnInfos.filter((c) => c.type === 'numeric' && !isLikelyId(rows.map((r) => r[c.name])));
  const { pairs, matrix } = computeCorrelations(numericCols, rows);

  // Groups
  const groups = detectGroups(columnInfos, rows);

  // Insights
  const insights = generateInsights(columnInfos, stats, meta, pairs, groups, rows);

  // Recommendations
  const recommendations = generateRecommendations(columnInfos, stats, cleaning, health, pairs, rows);

  return {
    meta, columns: columnInfos, stats, health, cleaning,
    correlations: pairs, correlationMatrix: matrix,
    insights, recommendations, groups, rows,
    numericColumns: numericCols.map((c) => c.name),
    categoricalColumns: columnInfos.filter((c) => c.type === 'categorical').map((c) => c.name),
    datetimeColumns: columnInfos.filter((c) => c.type === 'datetime').map((c) => c.name),
  };
}

function numericStats(a: number[]): NumericStats {
  return {
    count: a.length,
    mean: mean(a),
    median: median(a),
    mode: mode(a),
    min: min(a),
    max: max(a),
    range: range(a),
    variance: variance(a),
    std: std(a),
    p25: percentile(a, 25),
    p50: percentile(a, 50),
    p75: percentile(a, 75),
    p90: percentile(a, 90),
    p95: percentile(a, 95),
    p99: percentile(a, 99),
    iqr: iqr(a),
    cv: cv(a),
    mad: mad(a),
    skewness: skewness(a),
    kurtosis: kurtosis(a),
    outliers: countOutliers(a),
    zscoreOutliers: countZscoreOutliers(a),
  };
}

function categoricalStats(values: CellValue[]): CategoricalStats {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (v === null || v === '' || v === undefined) continue;
    const key = String(v);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const freq = [...counts.entries()]
    .map(([value, count]) => ({ value, count, pct: (count / values.length) * 100 }))
    .sort((a, b) => b.count - a.count);
  const top = freq[0];
  return {
    count: values.length,
    unique: counts.size,
    top: top?.value ?? '',
    topFreq: top?.count ?? 0,
    topPct: top?.pct ?? 0,
    frequency: freq.slice(0, 25),
  };
}

function estimateMemory(rows: Record<string, CellValue>[], cols: ColumnInfo[]): number {
  let bytes = 0;
  for (const r of rows.slice(0, 500)) {
    for (const c of cols) {
      const v = r[c.name];
      if (v === null) bytes += 1;
      else if (typeof v === 'number') bytes += 8;
      else bytes += String(v).length * 2;
    }
  }
  return Math.round((bytes / Math.min(rows.length, 500)) * rows.length);
}

function detectCleaning(rows: Record<string, CellValue>[], cols: ColumnInfo[]): CleaningResult {
  const issues: CleaningIssue[] = [];
  const rowCount = rows.length;

  for (const c of cols) {
    const values = rows.map((r) => r[c.name]);

    if (c.missing > 0) {
      issues.push({
        id: `missing-${c.name}`,
        column: c.name,
        category: 'Missing Values',
        severity: c.missingPct > 20 ? 'high' : c.missingPct > 5 ? 'medium' : 'low',
        title: `${c.missingPct.toFixed(1)}% missing in "${c.name}"`,
        description: `${c.missing} of ${rowCount} rows are empty.`,
        affected: c.missing,
        suggestion: c.type === 'numeric'
          ? 'Impute with median (robust to outliers).'
          : 'Impute with mode or a dedicated "Unknown" category.',
      });
    }

    if (c.unique === 1) {
      issues.push({
        id: `constant-${c.name}`,
        column: c.name,
        category: 'Constant Column',
        severity: 'low',
        title: `"${c.name}" is constant`,
        description: `Every row has the same value (${c.sample[0]}).`,
        affected: rowCount,
        suggestion: 'Drop the column — it carries no information.',
      });
    }

    if (c.unique === rowCount && rowCount > 0 && c.type === 'categorical') {
      issues.push({
        id: `idlike-${c.name}`,
        column: c.name,
        category: 'Identifier Column',
        severity: 'low',
        title: `"${c.name}" looks like an ID`,
        description: 'All values are unique — likely an identifier, not a feature.',
        affected: rowCount,
        suggestion: 'Exclude from analysis; use as the index.',
      });
    }

    // whitespace
    const ws = values.filter((v) => typeof v === 'string' && v !== v.trim()).length;
    if (ws > 0) {
      issues.push({
        id: `ws-${c.name}`,
        column: c.name,
        category: 'Whitespace',
        severity: 'low',
        title: `Leading/trailing spaces in "${c.name}"`,
        description: `${ws} values have stray whitespace.`,
        affected: ws,
        suggestion: 'Strip whitespace before analysis.',
      });
    }

    // mixed datatypes (numeric strings in a categorical column)
    if (c.type === 'categorical') {
      const nums = toNumbers(values).length;
      if (nums > 0 && nums < values.length * 0.5) {
        issues.push({
          id: `mixed-${c.name}`,
          column: c.name,
          category: 'Mixed Types',
          severity: 'medium',
          title: `Mixed types in "${c.name}"`,
          description: 'Column mixes text and numbers.',
          affected: nums,
          suggestion: 'Coerce to a single type or split into two columns.',
        });
      }
    }

    // negative values where possibly impossible
    if (c.type === 'numeric') {
      const nums = toNumbers(values);
      const neg = nums.filter((x) => x < 0).length;
      if (neg > 0 && /price|qty|quantity|age|count|salary|revenue|sales|total|amount/i.test(c.name)) {
        issues.push({
          id: `neg-${c.name}`,
          column: c.name,
          category: 'Negative Values',
          severity: 'medium',
          title: `Negative values in "${c.name}"`,
          description: `${neg} negative values may be invalid for this field.`,
          affected: neg,
          suggestion: 'Review negatives; treat as errors or refunds.',
        });
      }
    }
  }

  const dupRows = rowCount - new Set(rows.map((r) => JSON.stringify(r))).size;
  if (dupRows > 0) {
    issues.push({
      id: 'dup-rows',
      column: '(all)',
      category: 'Duplicate Rows',
      severity: dupRows > rowCount * 0.05 ? 'high' : 'medium',
      title: `${dupRows} duplicate rows`,
      description: 'Exact row duplicates detected.',
      affected: dupRows,
      suggestion: 'Drop duplicates to avoid double-counting.',
    });
  }

  const missingBefore = cols.reduce((s, c) => s + c.missing, 0);
  return {
    issues,
    before: { rows: rowCount, missing: missingBefore, duplicates: dupRows },
    after: { rows: rowCount - dupRows, missing: Math.max(0, missingBefore - Math.round(missingBefore * 0.6)), duplicates: 0 },
    cleanedRows: rowCount - dupRows,
  };
}

function computeHealth(meta: DatasetMeta, cols: ColumnInfo[], cleaning: CleaningResult): HealthReport {
  const totalCells = meta.rows * meta.columns || 1;
  const completeness = 100 - (meta.missingTotal / totalCells) * 100;
  const duplicates = meta.rows ? 100 - (meta.duplicateRows / meta.rows) * 100 : 100;
  const missing = 100 - (meta.missingPct);
  const dataTypes = 100 - (cols.filter((c) => c.type === 'unknown').length / (cols.length || 1)) * 100;
  const consistency = 100 - (cleaning.issues.filter((i) => i.category === 'Mixed Types' || i.category === 'Whitespace').length / (cols.length || 1)) * 100;
  const accuracy = 100 - (cleaning.issues.filter((i) => i.severity === 'high').length / (cols.length || 1)) * 100;

  const breakdown: HealthBreakdown = {
    completeness: clamp(completeness),
    consistency: clamp(consistency),
    accuracy: clamp(accuracy),
    duplicates: clamp(duplicates),
    missing: clamp(missing),
    dataTypes: clamp(dataTypes),
  };

  const score = Math.round(
    breakdown.completeness * 0.25 +
    breakdown.consistency * 0.15 +
    breakdown.accuracy * 0.20 +
    breakdown.duplicates * 0.15 +
    breakdown.missing * 0.15 +
    breakdown.dataTypes * 0.10,
  );

  const issues = [
    { area: 'Completeness', score: breakdown.completeness, detail: `${meta.missingTotal} missing cells across the dataset.`, impact: breakdown.completeness < 85 ? 'high' as const : 'low' as const },
    { area: 'Consistency', score: breakdown.consistency, detail: `${cleaning.issues.filter((i) => i.category === 'Mixed Types').length} columns with mixed types.`, impact: breakdown.consistency < 85 ? 'medium' as const : 'low' as const },
    { area: 'Accuracy', score: breakdown.accuracy, detail: `${cleaning.issues.filter((i) => i.severity === 'high').length} high-severity issues.`, impact: breakdown.accuracy < 85 ? 'high' as const : 'low' as const },
    { area: 'Duplicates', score: breakdown.duplicates, detail: `${meta.duplicateRows} duplicate rows.`, impact: meta.duplicateRows > 0 ? 'medium' as const : 'low' as const },
    { area: 'Missing Data', score: breakdown.missing, detail: `${meta.missingPct.toFixed(1)}% overall missing.`, impact: meta.missingPct > 10 ? 'high' as const : 'low' as const },
    { area: 'Data Types', score: breakdown.dataTypes, detail: `${cols.filter((c) => c.type === 'unknown').length} unclassified columns.`, impact: 'low' as const },
  ];

  return { score: clamp(score), grade: gradeFor(score), breakdown, issues };
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function gradeFor(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Fair';
  if (score >= 60) return 'Poor';
  return 'Critical';
}

function computeCorrelations(numCols: ColumnInfo[], rows: Record<string, CellValue>[]) {
  const matrix: { name: string; values: number[] }[] = [];
  const cols = numCols.slice(0, 12); // cap for readability
  for (const a of cols) {
    const va = toNumbers(rows.map((r) => r[a.name]));
    const values = cols.map((b) => {
      const vb = toNumbers(rows.map((r) => r[b.name]));
      const n = Math.min(va.length, vb.length);
      if (n < 3) return 0;
      return round(correlation(va.slice(0, n), vb.slice(0, n)), 3);
    });
    matrix.push({ name: a.name, values });
  }

  const pairs: CorrelationPair[] = [];
  for (let i = 0; i < cols.length; i++) {
    for (let j = i + 1; j < cols.length; j++) {
      const r = matrix[i].values[j];
      if (r === undefined) continue;
      const abs = Math.abs(r);
      const strength = abs > 0.7 ? 'strong' : abs > 0.4 ? 'moderate' : abs > 0.2 ? 'weak' : 'negligible';
      pairs.push({
        a: cols[i].name, b: cols[j].name, r,
        strength, direction: r >= 0 ? 'positive' : 'negative',
        explanation: explainCorrelation(cols[i].name, cols[j].name, r, strength),
      });
    }
  }
  pairs.sort((x, y) => Math.abs(y.r) - Math.abs(x.r));
  return { pairs, matrix };
}

function explainCorrelation(a: string, b: string, r: number, strength: string): string {
  const dir = r >= 0 ? 'positively' : 'negatively';
  const abs = Math.abs(r);
  if (abs < 0.2) return `No meaningful linear relationship between ${a} and ${b} (r=${r}).`;
  return `${a} and ${b} are ${strength} ${dir} correlated (r=${r}). As ${a} ${r >= 0 ? 'increases' : 'decreases'}, ${b} tends to ${r >= 0 ? 'increase' : 'decrease'}.`;
}

function detectGroups(cols: ColumnInfo[], rows: Record<string, CellValue>[]): GroupAnalysis[] {
  const groups: GroupAnalysis[] = [];
  const catCols = cols.filter((c) => c.type === 'categorical' && c.unique > 1 && c.unique < 30 && !isLikelyId(rows.map((r) => r[c.name])));
  const numCols = cols.filter((c) => c.type === 'numeric');

  for (const cat of catCols.slice(0, 4)) {
    const num = numCols.find((n) => /sales|revenue|profit|price|amount|salary|score|rating|count|qty|total/i.test(n.name)) ?? numCols[0];
    if (!num) continue;
    const groupsMap = new Map<string, number[]>();
    for (const r of rows) {
      const key = String(r[cat.name] ?? 'Unknown');
      const v = toNumbers([r[num.name]])[0];
      if (v === undefined) continue;
      if (!groupsMap.has(key)) groupsMap.set(key, []);
      groupsMap.get(key)!.push(v);
    }
    const results = [...groupsMap.entries()]
      .map(([label, vals]) => ({ label, value: round(mean(vals), 2) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);
    if (results.length < 2) continue;
    const top = results[0];
    groups.push({
      groupBy: cat.name,
      aggregate: num.name,
      aggFunc: 'mean',
      results,
      insight: `${top.label} has the highest average ${num.name} (${top.value}) among ${cat.name} groups.`,
    });
  }
  return groups;
}

function generateInsights(
  cols: ColumnInfo[], stats: ColumnStats[], meta: DatasetMeta,
  pairs: CorrelationPair[], groups: GroupAnalysis[], rows: Record<string, CellValue>[],
): Insight[] {
  const insights: Insight[] = [];

  for (const s of stats) {
    if (s.type === 'numeric' && s.numeric) {
      const n = s.numeric;
      if (Math.abs(n.skewness) > 0.7) {
        insights.push({
          id: `skew-${s.name}`, category: 'distribution', importance: 'high',
          title: `${s.name} is ${n.skewness > 0 ? 'right' : 'left'}-skewed`,
          text: `The ${s.name} column has a ${n.skewness > 0 ? 'right' : 'left'}-skewed distribution (skewness ${n.skewness.toFixed(2)}), indicating ${n.skewness > 0 ? 'a small number of high-value observations pulling the mean upward' : 'a small number of low-value observations pulling the mean downward'}. Use the median for a representative central value.`,
        });
      }
      if (n.outliers > 0) {
        insights.push({
          id: `out-${s.name}`, category: 'outlier', importance: n.outliers > meta.rows * 0.05 ? 'high' : 'medium',
          title: `${n.outliers} outliers in ${s.name}`,
          text: `${n.outliers} values fall outside 1.5×IQR. These may represent data-entry errors or genuine extreme cases worth separate analysis.`,
        });
      }
      if (n.cv > 0.5) {
        insights.push({
          id: `cv-${s.name}`, category: 'distribution', importance: 'medium',
          title: `High variability in ${s.name}`,
          text: `Coefficient of variation is ${(n.cv * 100).toFixed(0)}%, meaning the spread is large relative to the mean. Segmentation may reveal more stable sub-groups.`,
        });
      }
    }
    if (s.categorical && s.categorical.topPct > 30 && s.categorical.unique > 1) {
      insights.push({
        id: `cat-${s.name}`, category: 'category', importance: 'medium',
        title: `${s.categorical.top} dominates ${s.name}`,
        text: `The "${s.categorical.top}" category accounts for ${s.categorical.topPct.toFixed(0)}% of ${s.name}, suggesting concentration in this segment.`,
      });
    }
  }

  for (const c of cols) {
    if (c.missingPct > 10) {
      insights.push({
        id: `miss-${c.name}`, category: 'missing', importance: 'high',
        title: `${c.name} has ${c.missingPct.toFixed(0)}% missing`,
        text: `The ${c.name} column has ${c.missingPct.toFixed(1)}% missing values. Consider imputation or review whether missingness is meaningful.`,
      });
    }
  }

  for (const p of pairs.slice(0, 3)) {
    if (p.strength === 'strong' || p.strength === 'moderate') {
      insights.push({
        id: `corr-${p.a}-${p.b}`, category: 'correlation', importance: p.strength === 'strong' ? 'high' : 'medium',
        title: `${p.a} ↔ ${p.b}: ${p.strength} ${p.direction}`,
        text: p.explanation,
      });
    }
  }

  for (const g of groups.slice(0, 3)) {
    insights.push({
      id: `grp-${g.groupBy}-${g.aggregate}`, category: 'group', importance: 'medium',
      title: `${g.aggregate} by ${g.groupBy}`,
      text: g.insight,
    });
  }

  if (meta.duplicateRows > 0) {
    insights.push({
      id: 'dup-insight', category: 'quality', importance: 'medium',
      title: `${meta.duplicateRows} duplicate rows`,
      text: `${meta.duplicateRows} exact duplicate rows were found. Removing them prevents double-counting in aggregates.`,
    });
  }

  return insights.sort((a, b) => (a.importance === 'high' ? -1 : b.importance === 'high' ? 1 : 0));
}

function generateRecommendations(
  cols: ColumnInfo[], stats: ColumnStats[], cleaning: CleaningResult,
  health: HealthReport, pairs: CorrelationPair[], rows: Record<string, CellValue>[],
): Recommendation[] {
  const recs: Recommendation[] = [];

  if (cleaning.before.duplicates > 0) {
    recs.push({
      id: 'rm-dup', title: 'Remove duplicate rows',
      text: `${cleaning.before.duplicates} exact duplicate rows were detected. Drop them to avoid biasing aggregates.`,
      category: 'cleaning', impact: 'high',
    });
  }

  for (const c of cols) {
    if (c.type === 'datetime') {
      recs.push({
        id: `dt-${c.name}`, title: `Use ${c.name} as datetime index`,
        text: `${c.name} was parsed as a date. Set it as the index for time-series resampling and trend analysis.`,
        category: 'feature', impact: 'medium',
      });
    }
  }

  for (const s of stats) {
    if (s.numeric && Math.abs(s.numeric.skewness) > 0.7) {
      recs.push({
        id: `skew-${s.name}`, title: `Use median for ${s.name}`,
        text: `${s.name} is skewed (skewness ${s.numeric.skewness.toFixed(2)}). Prefer the median over the mean for central tendency.`,
        category: 'modeling', impact: 'medium',
      });
    }
    if (s.numeric && s.numeric.outliers > 0) {
      recs.push({
        id: `out-${s.name}`, title: `Investigate outliers in ${s.name}`,
        text: `${s.numeric.outliers} outliers detected. Cap, transform, or review them before modeling.`,
        category: 'quality', impact: 'medium',
      });
    }
  }

  for (const p of pairs.slice(0, 2)) {
    if (p.strength === 'strong') {
      recs.push({
        id: `corr-${p.a}-${p.b}`, title: `Watch multicollinearity: ${p.a} & ${p.b}`,
        text: `These columns are strongly correlated (r=${p.r}). Drop one or combine them to avoid redundancy.`,
        category: 'feature', impact: 'medium',
      });
    }
  }

  for (const issue of cleaning.issues) {
    if (issue.category === 'Constant Column') {
      recs.push({
        id: issue.id, title: `Drop constant column ${issue.column}`,
        text: `${issue.column} has a single value and adds no information.`,
        category: 'cleaning', impact: 'low',
      });
    }
  }

  if (health.score < 80) {
    recs.push({
      id: 'health', title: 'Improve overall data quality',
      text: `Health score is ${health.score}/100. Address missing values and duplicates first for the biggest gains.`,
      category: 'quality', impact: 'high',
    });
  }

  return recs.sort((a, b) => (a.impact === 'high' ? -1 : b.impact === 'high' ? 1 : 0));
}

function round(n: number, d = 2): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}
