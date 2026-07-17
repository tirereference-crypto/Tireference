import { describe, expect, it } from 'vitest';
import {
  buildCalculatorReportHref,
  reportIssuePath,
  REPORT_ISSUE_CATEGORIES,
} from './tire-size-calculator-report';
import { REPORT_ISSUE_PATH, DATA_STANDARDS_PATH } from './eeat-metadata';
import { hasPublishedValidationResults } from '../data/manufacturer-validation-records';

describe('eeat correction and standards routes', () => {
  it('builds report issue paths with calculator context', () => {
    const href = reportIssuePath({
      size: '275/70R18',
      calculator: 'Tire Size Calculator',
      category: 'incorrect_calculation',
    });
    expect(href.startsWith(REPORT_ISSUE_PATH)).toBe(true);
    expect(href).toContain('size=275%2F70R18');
    expect(href).toContain('category=incorrect_calculation');
    expect(REPORT_ISSUE_CATEGORIES.length).toBeGreaterThanOrEqual(5);
  });

  it('SSR report href stays on the report page', () => {
    expect(buildCalculatorReportHref('275/65R18')).toContain(REPORT_ISSUE_PATH);
  });

  it('keeps validation results unpublished until records exist', () => {
    expect(hasPublishedValidationResults()).toBe(false);
    expect(DATA_STANDARDS_PATH).toBe('/data-standards/');
  });
});
