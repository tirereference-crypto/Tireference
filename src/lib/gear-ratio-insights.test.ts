import { describe, expect, it } from 'vitest';
import { computeGearRatio, type GearRatioInput } from './gear-ratio-math';
import {
  buildFactualComparisonRows,
  buildGearRatioScaleMarkers,
  buildGearingChangeSummary,
  buildNearbyRatioExamples,
  buildResultCards,
  buildTireChangeInterpretation,
  GEAR_EDU_SECTIONS,
  GEAR_FAQS,
} from './gear-ratio-insights';

const baseInput: GearRatioInput = {
  currentDiameterIn: 31,
  stockGearRatio: 3.73,
  newDiameterIn: 35,
  transTopGear: null,
  firstGearRatio: null,
  transferLowRatio: null,
  speedMph: null,
  speedUnit: 'mph',
  lowSpeedBiasPercent: 5,
};

describe('gear ratio results copy helpers', () => {
  it('maps ~11.4% diameter jump to Large Gearing Change', () => {
    const result = computeGearRatio(baseInput);
    const summary = buildGearingChangeSummary(result);
    expect(summary.eyebrow).toBe('Effective Gearing Change');
    expect(summary.heading).toBe('Large Gearing Change');
    expect(summary.summary).toContain('11.4% taller');
    expect(summary.summary).not.toContain('Worth Regearing');
  });

  it('maps identical diameters to Minimal Gearing Change', () => {
    const result = computeGearRatio({
      ...baseInput,
      currentDiameterIn: 33,
      newDiameterIn: 33,
      stockGearRatio: 4.1,
    });
    const summary = buildGearingChangeSummary(result);
    expect(summary.heading).toBe('Minimal Gearing Change');
    expect(summary.absChangePct).toBeLessThan(0.05);
  });
  it('builds three factual result cards without legacy labels', () => {
    const result = computeGearRatio(baseInput);
    const cards = buildResultCards(result);
    expect(cards.map((c) => c.variant)).toEqual(['stock-like', 'deeper', 'current']);
    expect(cards[0].primaryLabel).toBe('Exact stock-like target');
    expect(cards[1].primaryLabel).toBe('5% deeper than stock-like target');
    expect(cards[2].primaryLabel).toBe('Effective axle ratio');
    const blob = JSON.stringify(cards);
    expect(blob).not.toMatch(/Ideal gear|Closest available|undergear|Worth Regearing/i);
  });

  it('omits deeper comparison rows when bias is 0', () => {
    const result = computeGearRatio({ ...baseInput, lowSpeedBiasPercent: 0 });
    const rows = buildFactualComparisonRows(result);
    expect(rows.some((r) => r.id === 'deeper')).toBe(false);
    expect(rows.some((r) => r.id === 'stock-like')).toBe(true);
    expect(rows).toHaveLength(4);
    expect(rows.every((r) => !/Excellent|Poor|Best|Ideal for/i.test(r.interpretation))).toBe(true);
    expect(rows.find((r) => r.id === 'stock-like')?.interpretation).toBe(
      'Original gearing restored mathematically',
    );
    expect(rows.find((r) => r.id === 'stock-like')?.differenceFromOriginal).toBe('0% difference');
    expect(rows.find((r) => r.id === 'stock-like')?.differencePercent).toBe(0);
    expect(rows.find((r) => r.id === 'stock-like')?.axleRatio).toBe('4.21');
    expect(rows.find((r) => r.id === 'stock-like')?.effectiveRatio).toBe('3.73');
  });

  it('formats the exact stock-like target difference as explicit zero', () => {
    const result = computeGearRatio(baseInput);
    const exact = buildFactualComparisonRows(result).find((r) => r.id === 'stock-like');
    expect(exact?.differenceFromOriginal).toBe('0% difference');
    expect(exact?.interpretation).toBe('Original gearing restored mathematically');
    expect(exact?.effectiveRatio).toBe('3.73');
    expect(exact?.axleRatio).toBe('4.21');
  });

  it('builds compact tire-change interpretation without repeating the target', () => {
    const result = computeGearRatio(baseInput);
    const copy = buildTireChangeInterpretation(result);
    expect(copy.heading).toBe('What Changes With the New Tires?');
    expect(copy.summary).toContain('11.4% taller');
    expect(copy.effectivePrimary).toBe('11.4% taller');
    expect(copy.rpmPrimary).toContain('lower');
    expect(JSON.stringify(copy)).not.toContain('4.21');
  });

  it('builds nearby ratio examples below and above the stock-like target', () => {
    const result = computeGearRatio(baseInput);
    const nearby = buildNearbyRatioExamples(result);
    expect(nearby.map((item) => item.ratio)).toEqual([4.11, 4.3]);
    expect(nearby.every((item) => /taller|deeper|Matches/.test(item.comparison))).toBe(true);
    expect(nearby.map((item) => item.side)).toEqual(['below', 'above']);
  });

  it('builds a numerical gear-ratio scale with a dominant exact target', () => {
    const result = computeGearRatio(baseInput);
    const markers = buildGearRatioScaleMarkers(result);
    expect(markers.some((m) => m.role === 'exact')).toBe(true);
    expect(markers.some((m) => m.role === 'current-effective')).toBe(true);
    expect(markers.some((m) => m.role === 'deeper')).toBe(true);
    const values = markers.map((m) => m.value);
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });

  it('keeps six FAQs and four educational subsections', () => {
    expect(GEAR_FAQS).toHaveLength(6);
    expect(GEAR_EDU_SECTIONS).toHaveLength(4);
  });
});
