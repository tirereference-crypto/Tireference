import { describe, expect, it } from 'vitest';
import {
  auditComparisonConsistency,
  formatConsistencyAuditReport,
} from './tire-comparison-consistency-audit';
import { getAllComparisonSlugs } from './tire-comparison-links';

describe('comparison system consistency audit', () => {
  it('all published comparison pages pass consistency checks', () => {
    const pageCount = getAllComparisonSlugs().length;
    expect(pageCount).toBeGreaterThan(0);

    const issues = auditComparisonConsistency();

    if (issues.length > 0) {
      // eslint-disable-next-line no-console -- intentional audit report
      console.log('\n' + formatConsistencyAuditReport(issues));
    }

    expect(
      issues,
      issues.map((i) => `[${i.category}] ${i.pair}: ${i.detail}`).join('\n'),
    ).toEqual([]);
  });
});
