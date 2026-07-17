import { describe, expect, it } from 'vitest';
import {
  gearRatioUrlValues,
  parseGearRatioFromSearch,
  parseTireComparisonFromSearch,
  parseTireDiameterFromSearch,
  parseTireSizeFromSearch,
  parseWheelOffsetFromSearch,
  syncCalculatorUrl,
  wheelOffsetUrlValues,
  tireComparisonUrlValues,
  tireDiameterUrlValues,
} from './calculator-url-state';
import { DEFAULT_GEAR_FIELDS } from './gear-ratio-insights';

describe('calculator-url-state', () => {
  it('parses tire size from search params', () => {
    const params = new URLSearchParams('size=275%2F70R18');
    expect(parseTireSizeFromSearch(params)).toBe('275/70R18');
    expect(parseTireSizeFromSearch(new URLSearchParams(), '225/45R17')).toBe('225/45R17');
    // Invalid explicit size must not fall back to a demo size
    expect(parseTireSizeFromSearch(new URLSearchParams('size=invalid'), '225/45R17')).toBe(
      undefined,
    );
    expect(parseTireSizeFromSearch(new URLSearchParams('size=33x12.50R17'))).toBe('33X12.50R17');
  });

  it('parses comparison params with legacy fallback', () => {
    expect(
      parseTireComparisonFromSearch(new URLSearchParams('from=225%2F45R17&to=235%2F40R18'), {
        from: '205/55R16',
        to: '215/55R17',
      }),
    ).toEqual({ from: '225/45R17', to: '235/40R18' });

    expect(
      parseTireComparisonFromSearch(new URLSearchParams('current=265%2F70R17&new=285%2F70R17'), {
        from: '205/55R16',
        to: '215/55R17',
      }),
    ).toEqual({ from: '265/70R17', to: '285/70R17' });
  });

  it('builds comparison share URLs', () => {
    expect(tireComparisonUrlValues('225/45R17', '235/40R18')).toEqual({
      from: '225/45R17',
      to: '235/40R18',
      third: null,
    });
    expect(tireComparisonUrlValues('225/45R17', '235/40R18', '265/70R17')).toEqual({
      from: '225/45R17',
      to: '235/40R18',
      third: '265/70R17',
    });
  });

  it('parses optional third comparison param', () => {
    expect(
      parseTireComparisonFromSearch(
        new URLSearchParams('from=225%2F45R17&to=235%2F40R18&third=265%2F70R17'),
        { from: '205/55R16', to: '215/55R17' },
      ),
    ).toEqual({ from: '225/45R17', to: '235/40R18', third: '265/70R17' });
  });

  it('parses diameter params with legacy fallback', () => {
    expect(
      parseTireDiameterFromSearch(new URLSearchParams('d=33&rim=18'), {
        diameter: 31,
        rim: 17,
      }),
    ).toEqual({ diameter: 33, rim: 18, unit: 'imperial', tolerance: 1 });

    expect(
      parseTireDiameterFromSearch(new URLSearchParams('diameter=35&wheel=20'), {
        diameter: 31,
        rim: 17,
      }),
    ).toEqual({ diameter: 35, rim: 20, unit: 'imperial', tolerance: 1 });
  });

  it('builds diameter share URLs', () => {
    expect(tireDiameterUrlValues(33, 18)).toEqual({
      d: '33',
      rim: '18',
      unit: 'in',
      tol: '1',
    });
    expect(tireDiameterUrlValues(35, 'any')).toEqual({
      d: '35',
      rim: 'any',
      unit: 'in',
      tol: '1',
    });
  });

  it('parses rim=any for diameter search', () => {
    expect(
      parseTireDiameterFromSearch(new URLSearchParams('d=35&rim=any'), {
        diameter: 31,
        rim: 17,
      }),
    ).toEqual({ diameter: 35, rim: 'any', unit: 'imperial', tolerance: 1 });
  });

  it('parses gear ratio share params', () => {
    const fields = parseGearRatioFromSearch(new URLSearchParams('stock=31.6&new=33.2&ratio=3.73'));
    expect(fields.currentDiameterIn).toBe('31.6');
    expect(fields.newDiameterIn).toBe('33.2');
    expect(fields.stockGearRatio).toBe('3.73');
  });

  it('builds gear ratio share URLs', () => {
    expect(
      gearRatioUrlValues({
        ...DEFAULT_GEAR_FIELDS,
        currentDiameterIn: '31.6',
        newDiameterIn: '33.2',
        stockGearRatio: '3.73',
      }),
    ).toMatchObject({ stock: '31.6', new: '33.2', ratio: '3.73' });
  });

  it('ignores legacy squat params when parsing gear ratio URLs', () => {
    const fields = parseGearRatioFromSearch(
      new URLSearchParams('stock=31&new=35&ratio=3.73&squat=1&squatpct=3'),
    );
    expect(fields.currentDiameterIn).toBe('31');
    expect(fields.newDiameterIn).toBe('35');
    expect(fields.stockGearRatio).toBe('3.73');
  });

  it('includes advanced gear params only when entered', () => {
    expect(
      gearRatioUrlValues({
        ...DEFAULT_GEAR_FIELDS,
        currentDiameterIn: '31',
        newDiameterIn: '35',
        stockGearRatio: '3.73',
        speed: '65',
        transTopGear: '1',
        lowSpeedBiasPercent: '8',
      }),
    ).toMatchObject({
      stock: '31',
      new: '35',
      ratio: '3.73',
      speed: '65',
      top: '1',
      bias: '8',
    });
    expect(
      gearRatioUrlValues({
        ...DEFAULT_GEAR_FIELDS,
        currentDiameterIn: '31',
        newDiameterIn: '35',
        stockGearRatio: '3.73',
      }).speed,
    ).toBeNull();
  });

  it('round-trips Case D advanced gear share state', () => {
    const values = gearRatioUrlValues({
      ...DEFAULT_GEAR_FIELDS,
      currentDiameterIn: '31',
      newDiameterIn: '35',
      stockGearRatio: '3.73',
      speed: '65',
      speedUnit: 'mph',
      transTopGear: '0.75',
      firstGearRatio: '4.71',
      transferLowRatio: '2.72',
      lowSpeedBiasPercent: '5',
    });
    expect(values).toMatchObject({
      stock: '31',
      new: '35',
      ratio: '3.73',
      speed: '65',
      top: '0.75',
      first: '4.71',
      low: '2.72',
    });
    expect(values.speedUnit).toBeNull();
    expect(values.bias).toBeNull();

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(values)) {
      if (value != null) params.set(key, value);
    }
    const restored = parseGearRatioFromSearch(params);
    expect(restored.currentDiameterIn).toBe('31');
    expect(restored.newDiameterIn).toBe('35');
    expect(restored.stockGearRatio).toBe('3.73');
    expect(restored.speed).toBe('65');
    expect(restored.transTopGear).toBe('0.75');
    expect(restored.firstGearRatio).toBe('4.71');
    expect(restored.transferLowRatio).toBe('2.72');
    expect(restored.lowSpeedBiasPercent).toBe('5');
    expect(restored.speedUnit).toBe('mph');
  });

  it('accepts legacy sunit/tcase aliases and prefers speedUnit/low', () => {
    const legacy = parseGearRatioFromSearch(
      new URLSearchParams('stock=31&new=35&ratio=3.73&speed=70&sunit=kmh&tcase=2.72&top=0.8'),
    );
    expect(legacy.speedUnit).toBe('kmh');
    expect(legacy.transferLowRatio).toBe('2.72');
    expect(legacy.transTopGear).toBe('0.8');

    const modern = parseGearRatioFromSearch(
      new URLSearchParams('stock=31&new=35&ratio=3.73&speed=70&speedUnit=kmh&low=2.5'),
    );
    expect(modern.speedUnit).toBe('kmh');
    expect(modern.transferLowRatio).toBe('2.5');

    expect(
      gearRatioUrlValues({
        ...DEFAULT_GEAR_FIELDS,
        currentDiameterIn: '31',
        newDiameterIn: '35',
        stockGearRatio: '3.73',
        speed: '70',
        speedUnit: 'kmh',
        transferLowRatio: '2.5',
        lowSpeedBiasPercent: '0',
      }),
    ).toMatchObject({
      speed: '70',
      speedUnit: 'kmh',
      low: '2.5',
      bias: '0',
    });
  });

  it('preserves boundary primary values including min diameter and ratio', () => {
    const fields = parseGearRatioFromSearch(
      new URLSearchParams('stock=15&new=15&ratio=2'),
    );
    expect(fields.currentDiameterIn).toBe('15');
    expect(fields.newDiameterIn).toBe('15');
    expect(fields.stockGearRatio).toBe('2');
  });
  it('parses wheel offset share params', () => {
    const parsed = parseWheelOffsetFromSearch(
      new URLSearchParams('w1=8&o1=35&w2=9&o2=20&rim=18'),
      {
        current: { widthIn: '7', diameterIn: '17', offsetMm: '0' },
        new: { widthIn: '7', diameterIn: '17', offsetMm: '0' },
      },
    );
    expect(parsed.current).toEqual({ widthIn: '8', diameterIn: '18', offsetMm: '35' });
    expect(parsed.new).toEqual({ widthIn: '9', diameterIn: '18', offsetMm: '20' });
  });

  it('parses separate rim diameters and decimal offsets', () => {
    const parsed = parseWheelOffsetFromSearch(
      new URLSearchParams('w1=7.5&o1=-12&w2=8.5&o2=0&rim=18&rim2=19'),
      {
        current: { widthIn: '8', diameterIn: '18', offsetMm: '35' },
        new: { widthIn: '9', diameterIn: '18', offsetMm: '20' },
      },
    );
    expect(parsed.current).toEqual({ widthIn: '7.5', diameterIn: '18', offsetMm: '-12' });
    expect(parsed.new).toEqual({ widthIn: '8.5', diameterIn: '19', offsetMm: '0' });
  });

  it('builds wheel offset share URLs with rim2 when diameters differ', () => {
    expect(
      wheelOffsetUrlValues(
        { widthIn: '8', diameterIn: '18', offsetMm: '35' },
        { widthIn: '9', diameterIn: '19', offsetMm: '20' },
      ),
    ).toEqual({
      w1: '8',
      o1: '35',
      w2: '9',
      o2: '20',
      rim: '18',
      rim2: '19',
    });
  });

  it('always emits separate rim and rim2 diameter params', () => {
    expect(
      wheelOffsetUrlValues(
        { widthIn: '8', diameterIn: '17', offsetMm: '35' },
        { widthIn: '9', diameterIn: '18', offsetMm: '20' },
      ),
    ).toEqual({
      w1: '8',
      o1: '35',
      w2: '9',
      o2: '20',
      rim: '17',
      rim2: '18',
    });

    expect(
      wheelOffsetUrlValues(
        { widthIn: '8', diameterIn: '18', offsetMm: '35' },
        { widthIn: '9', diameterIn: '18', offsetMm: '20' },
      ),
    ).toEqual({
      w1: '8',
      o1: '35',
      w2: '9',
      o2: '20',
      rim: '18',
      rim2: '18',
    });
  });

  it('parses d1/d2 diameter aliases', () => {
    const parsed = parseWheelOffsetFromSearch(
      new URLSearchParams('w1=8&o1=35&w2=9&o2=20&d1=17&d2=18'),
      {
        current: { widthIn: '7', diameterIn: '16', offsetMm: '0' },
        new: { widthIn: '7', diameterIn: '16', offsetMm: '0' },
      },
    );
    expect(parsed.current.diameterIn).toBe('17');
    expect(parsed.new.diameterIn).toBe('18');
  });

  it('preserves negative and zero offsets in share URLs', () => {
    expect(
      wheelOffsetUrlValues(
        { widthIn: '8', diameterIn: '18', offsetMm: '35' },
        { widthIn: '9', diameterIn: '18', offsetMm: '-12' },
      ),
    ).toMatchObject({ o2: '-12' });

    expect(
      wheelOffsetUrlValues(
        { widthIn: '8', diameterIn: '18', offsetMm: '0' },
        { widthIn: '8', diameterIn: '18', offsetMm: '0' },
      ),
    ).toMatchObject({ o1: '0', o2: '0' });
  });

  it('syncCalculatorUrl is a no-op during SSR', () => {
    expect(() => syncCalculatorUrl(['size'], { size: '275/70R18' })).not.toThrow();
  });
});
