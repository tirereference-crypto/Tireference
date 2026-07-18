import { describe, expect, it } from 'vitest';
import {
  crawlableComparisonPath,
  isParameterizedComparisonUrl,
  preferredSizeCompareLink,
} from './crawlable-links';
import { CALCULATOR_PATHS } from './calculator-links';

describe('crawlable-links', () => {
  it('detects parameterized comparison calculator URLs', () => {
    expect(
      isParameterizedComparisonUrl(
        '/calculators/tire-comparison-calculator/?from=275%2F70R18&to=285%2F70R17',
      ),
    ).toBe(true);
    expect(
      isParameterizedComparisonUrl('/calculators/tire-comparison-calculator/?current=275/70R18'),
    ).toBe(true);
    expect(isParameterizedComparisonUrl(CALCULATOR_PATHS.tireComparison)).toBe(false);
    expect(isParameterizedComparisonUrl('/compare/275-70-r18-vs-285-70-r17/')).toBe(false);
  });

  it('only returns published comparison paths for crawlable pairs', () => {
    expect(crawlableComparisonPath('225/45R17', '235/40R18')).toBe(
      '/compare/225-45-r17-vs-235-40-r18/',
    );
    expect(crawlableComparisonPath('225/45R17', '305/70R18')).toBeNull();
  });

  it('prefers a published pair for size-level compare CTAs', () => {
    const link = preferredSizeCompareLink('275/70R18');
    expect(link.href.startsWith('/compare/')).toBe(true);
    expect(isParameterizedComparisonUrl(link.href)).toBe(false);
    expect(link.label.toLowerCase()).toContain('275/70r18');
    expect(link.isPublishedPair).toBe(true);
  });
});
