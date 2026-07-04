import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  calculatorNameFromHref,
  createAnalyticsDedupTracker,
  getSourcePage,
  trackEvent,
  trackRelatedCalculatorClick,
  trackTireSizeSelected,
} from './analytics';
import { CALCULATOR_PATHS } from './calculator-links';

describe('analytics', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete (globalThis as { window?: Window }).window;
  });

  it('does not throw during SSR', () => {
    expect(() => trackEvent('calculator_started')).not.toThrow();
    expect(getSourcePage()).toBe('');
  });

  it('fails silently when gtag is unavailable', () => {
    vi.stubGlobal('window', { location: { pathname: '/calculators/tire-size-calculator/' } });
    expect(() =>
      trackEvent('calculator_started', { calculator_name: 'tire_size' }),
    ).not.toThrow();
  });

  it('sends sanitized events through gtag', () => {
    const gtag = vi.fn();
    vi.stubGlobal('window', {
      gtag,
      location: { pathname: '/calculators/tire-size-calculator/' },
    });

    trackEvent('calculator_completed', {
      calculator_name: 'tire_size',
      current_tire_size: '275/70R18',
      source_page: '/calculators/tire-size-calculator/',
    });

    expect(gtag).toHaveBeenCalledWith('event', 'calculator_completed', {
      calculator_name: 'tire_size',
      current_tire_size: '275/70R18',
      source_page: '/calculators/tire-size-calculator/',
    });
  });

  it('rejects invalid tire sizes and free-text payloads', () => {
    const gtag = vi.fn();
    vi.stubGlobal('window', {
      gtag,
      location: { pathname: '/calculators/tire-size-calculator/' },
    });

    trackTireSizeSelected('not a valid tire size', 'tire_size');
    expect(gtag).not.toHaveBeenCalled();
  });

  it('maps calculator hrefs to analytics names', () => {
    expect(calculatorNameFromHref(CALCULATOR_PATHS.tireSize)).toBe('tire_size');
    expect(calculatorNameFromHref(CALCULATOR_PATHS.tireComparison)).toBe('tire_comparison');
  });

  it('deduplicates completion events by signature', () => {
    const gtag = vi.fn();
    vi.stubGlobal('window', {
      gtag,
      location: { pathname: '/calculators/tire-comparison-calculator/' },
    });

    const tracker = createAnalyticsDedupTracker();
    const params = {
      calculator_name: 'tire_comparison' as const,
      current_tire_size: '275/70R18',
      new_tire_size: '285/70R17',
      source_page: '/calculators/tire-comparison-calculator/',
    };

    expect(tracker.trackComparisonCompleted('275/70R18|285/70R17', params)).toBe(true);
    expect(tracker.trackComparisonCompleted('275/70R18|285/70R17', params)).toBe(false);
    expect(gtag).toHaveBeenCalledTimes(1);
  });

  it('tracks related calculator clicks with destination mapping', () => {
    const gtag = vi.fn();
    vi.stubGlobal('window', {
      gtag,
      location: { pathname: '/calculators/tire-size-calculator/' },
    });

    trackRelatedCalculatorClick(CALCULATOR_PATHS.tireComparison, 'tire_size');

    expect(gtag).toHaveBeenCalledWith('event', 'related_calculator_clicked', {
      calculator_name: 'tire_size',
      destination_calculator: 'tire_comparison',
      source_page: '/calculators/tire-size-calculator/',
    });
  });
});
