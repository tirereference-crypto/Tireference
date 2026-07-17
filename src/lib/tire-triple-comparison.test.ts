import { describe, expect, it } from 'vitest';
import { buildComparisonInsights } from './tire-comparison-insights';
import { appendThirdTireSpecRows } from './tire-triple-comparison';
import { compareTires, getTireSpecs } from './tire-math';

describe('tire-triple-comparison', () => {
  it('extends spec rows with a third tire column vs current baseline', () => {
    const current = '225/45R17';
    const next = '235/40R18';
    const third = '265/70R17';

    const specsA = getTireSpecs(current);
    const specsB = getTireSpecs(next);
    const specsC = getTireSpecs(third);
    const comparison = compareTires(current, next, 60);
    const comparisonThird = compareTires(current, third, 60);
    const insights = buildComparisonInsights(current, next, comparison, specsA, specsB);

    const rows = appendThirdTireSpecRows(
      insights.specRows,
      current,
      third,
      comparisonThird,
      specsA,
      specsC,
      'imperial',
    );

    const diameterRow = rows.find((row) => row.label === 'Diameter');
    expect(diameterRow?.thirdTire).toBeTruthy();
    expect(diameterRow?.thirdDifference).toContain('%');
    expect(diameterRow?.difference).toBeTruthy();
  });
});
