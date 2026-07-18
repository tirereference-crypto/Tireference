import { describe, expect, it } from 'vitest';
import {
  CALCULATOR_PATHS,
  CALCULATOR_REGISTRY,
  calculatorPathWithQuery,
  getPublishedCalculators,
  getRelatedCalculatorLinks,
  normalizeCalculatorHref,
  SITE_CALCULATORS,
} from './calculator-links';
import { formatMonthYear, toSchemaDateTime, CALCULATION_LOGIC_UPDATED } from './eeat-metadata';

describe('CALCULATOR_PATHS', () => {
  it('uses /calculators/ prefix with trailing slash', () => {
    for (const path of Object.values(CALCULATOR_PATHS)) {
      expect(path.startsWith('/calculators/')).toBe(true);
      expect(path.endsWith('/')).toBe(true);
    }
  });

  it('matches published registry hrefs', () => {
    for (const calc of getPublishedCalculators()) {
      expect(calc.href.endsWith('/')).toBe(true);
      expect(calc.status).toBe('published');
    }
    expect(SITE_CALCULATORS.length).toBe(getPublishedCalculators().length);
  });
});

describe('related calculator registry', () => {
  it('excludes the current calculator and never invents missing tools', () => {
    const related = getRelatedCalculatorLinks(CALCULATOR_PATHS.tireComparison);
    expect(related.every((c) => c.href !== CALCULATOR_PATHS.tireComparison)).toBe(true);
    expect(related.map((c) => c.href)).toEqual([
      CALCULATOR_PATHS.tireSize,
      CALCULATOR_PATHS.tireDiameter,
      CALCULATOR_PATHS.wheelOffset,
      CALCULATOR_PATHS.gearRatio,
    ]);
    expect(related.some((c) => /load index|aspect ratio|more calculators/i.test(c.label))).toBe(
      false,
    );
  });

  it('ignores hidden or deprecated registry rows', () => {
    expect(CALCULATOR_REGISTRY.every((c) => c.status === 'published')).toBe(true);
    expect(getPublishedCalculators().length).toBe(CALCULATOR_REGISTRY.length);
  });
});

describe('normalizeCalculatorHref', () => {
  it('adds trailing slash before query params', () => {
    expect(normalizeCalculatorHref('/calculators/tire-size-calculator?size=275-45r17')).toBe(
      '/calculators/tire-size-calculator/?size=275-45r17',
    );
  });

  it('preserves existing trailing slash', () => {
    expect(normalizeCalculatorHref('/calculators/tire-size-calculator/')).toBe(
      '/calculators/tire-size-calculator/',
    );
  });
});

describe('calculatorPathWithQuery', () => {
  it('places query params after the trailing slash', () => {
    expect(
      calculatorPathWithQuery(CALCULATOR_PATHS.tireSize, { size: '275/70R18' }),
    ).toBe('/calculators/tire-size-calculator/?size=275%2F70R18');
  });
});

describe('calculation logic freshness metadata', () => {
  it('renders July 2026 from the maintained YYYY-MM field', () => {
    expect(CALCULATION_LOGIC_UPDATED).toBe('2026-07');
    expect(formatMonthYear(CALCULATION_LOGIC_UPDATED)).toBe('July 2026');
    expect(toSchemaDateTime(CALCULATION_LOGIC_UPDATED)).toBe('2026-07-01T00:00:00Z');
  });
});
