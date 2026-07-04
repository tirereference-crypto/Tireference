import { describe, expect, it } from 'vitest';
import {
  CALCULATOR_PATHS,
  calculatorPathWithQuery,
  normalizeCalculatorHref,
  SITE_CALCULATORS,
} from './calculator-links';

describe('CALCULATOR_PATHS', () => {
  it('uses /calculators/ prefix with trailing slash', () => {
    for (const path of Object.values(CALCULATOR_PATHS)) {
      expect(path.startsWith('/calculators/')).toBe(true);
      expect(path.endsWith('/')).toBe(true);
    }
  });

  it('matches SITE_CALCULATORS hrefs', () => {
    for (const calc of SITE_CALCULATORS) {
      expect(calc.href.endsWith('/')).toBe(true);
    }
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
