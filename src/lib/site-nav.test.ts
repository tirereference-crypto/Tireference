import { describe, expect, it } from 'vitest';
import { CALCULATOR_PATHS } from './calculator-links';
import { getActiveNavItem, NAV_CALCULATORS } from './site-nav';

describe('NAV_CALCULATORS', () => {
  it('maps each calculator label to its canonical href', () => {
    const byLabel = Object.fromEntries(NAV_CALCULATORS.map((item) => [item.label, item.href]));
    expect(byLabel['Gear Ratio Calculator']).toBe(CALCULATOR_PATHS.gearRatio);
    expect(byLabel['Wheel Offset Calculator']).toBe(CALCULATOR_PATHS.wheelOffset);
    expect(byLabel['Tire Size Calculator']).toBe(CALCULATOR_PATHS.tireSize);
    expect(byLabel['Tire Comparison Calculator']).toBe(CALCULATOR_PATHS.tireComparison);
    expect(byLabel['Tire Diameter Calculator']).toBe(CALCULATOR_PATHS.tireDiameter);
  });
});

describe('getActiveNavItem', () => {
  it('marks tire size hub pages', () => {
    expect(getActiveNavItem('/tire-sizes/')).toBe('tire-sizes');
    expect(getActiveNavItem('/tire-sizes/winter/')).toBe('tire-sizes');
    expect(getActiveNavItem('/tire-size/275-70r18/')).toBe('tire-sizes');
  });

  it('marks calculator pages', () => {
    expect(getActiveNavItem('/calculators/tire-size-calculator/')).toBe('calculators');
    expect(getActiveNavItem('/calculators/tire-size-calculator')).toBe('calculators');
    expect(getActiveNavItem('/calculators/gear-ratio-calculator/')).toBe('calculators');
  });

  it('marks comparison pages', () => {
    expect(getActiveNavItem('/calculators/tire-comparison-calculator/')).toBe('compare');
    expect(getActiveNavItem('/calculators/tire-comparison-calculator')).toBe('compare');
    expect(getActiveNavItem('/compare/275-70-r18-vs-305-70-r18')).toBe('compare');
  });

  it('marks fitment pages', () => {
    expect(getActiveNavItem('/calculators/wheel-offset-calculator/')).toBe('fitment');
    expect(getActiveNavItem('/calculators/wheel-offset-calculator')).toBe('fitment');
  });

  it('marks company pages', () => {
    expect(getActiveNavItem('/about')).toBe('about');
    expect(getActiveNavItem('/contact')).toBe('contact');
  });
});
