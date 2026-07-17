import { describe, expect, it } from 'vitest';
import {
  formatDiameterInputValue,
  formatToleranceLabel,
  inchesFromUnit,
  MM_PER_INCH,
  valueFromInches,
} from './tire-diameter-search';
import {
  parseTireDiameterFromSearch,
  tireDiameterUrlValues,
} from './calculator-url-state';
import {
  countIndexedSizesInDiameterGroup,
  formatDiameterTargetChipMeta,
} from './tire-diameter-insights';

describe('diameter unit conversion (inches ↔ millimetres)', () => {
  it('converts millimetres to inches with 25.4 mm per inch', () => {
    expect(inchesFromUnit(33 * MM_PER_INCH, 'metric')).toBeCloseTo(33, 5);
    expect(inchesFromUnit(33, 'imperial')).toBe(33);
  });

  it('preserves physical value across a round-trip unit switch', () => {
    const inches = 33;
    const mmDisplay = formatDiameterInputValue(inches, 'metric');
    const back = inchesFromUnit(Number(mmDisplay), 'metric');
    expect(back).toBeCloseTo(inches, 2);
    expect(formatDiameterInputValue(back, 'imperial')).toBe('33');
  });

  it('formats tolerance labels in the active unit', () => {
    expect(formatToleranceLabel(1, 'imperial')).toBe('±1.0"');
    expect(formatToleranceLabel(1, 'metric')).toBe(`±${Math.round(MM_PER_INCH)} mm`);
  });

  it('converts valueFromInches to millimetres', () => {
    expect(valueFromInches(1, 'metric')).toBeCloseTo(25.4, 5);
  });
});

describe('diameter query restoration', () => {
  it('stores diameter in inches and restores unit + tolerance', () => {
    const values = tireDiameterUrlValues(33, 18, 'metric', 2);
    expect(values.d).toBe('33');
    expect(values.unit).toBe('mm');
    expect(values.tol).toBe('2');
    expect(values.rim).toBe('18');

    const params = new URLSearchParams(
      Object.entries(values)
        .filter(([, v]) => v != null)
        .map(([k, v]) => [k, String(v)]),
    );
    const parsed = parseTireDiameterFromSearch(params, { diameter: 31, rim: 17 });
    expect(parsed.diameter).toBe(33);
    expect(parsed.unit).toBe('metric');
    expect(parsed.tolerance).toBe(2);
    expect(parsed.rim).toBe(18);
  });
});

describe('popular target chip metadata', () => {
  it('labels wheel-filtered counts explicitly', () => {
    const count18 = countIndexedSizesInDiameterGroup(33, 18);
    expect(formatDiameterTargetChipMeta(count18, 18)).toMatch(/ on 18"/);
    expect(formatDiameterTargetChipMeta(0, 18)).toBe('None on 18"');
    expect(formatDiameterTargetChipMeta(0, 'any')).toBe('None');
  });

  it('uses compact size counts when wheel is any', () => {
    const count = countIndexedSizesInDiameterGroup(33, 'any');
    expect(formatDiameterTargetChipMeta(count, 'any')).toMatch(/^\d+ sizes?$|^None$/);
  });
});
