import { describe, expect, it } from 'vitest';
import { compareTires, getTireSpecs } from './tire-math';
import { buildComparisonAnalysis } from './tire-comparison-engineering-analysis';
import {
  buildComparisonPerformanceImpactCards,
  buildRideComfortImpactCopy,
  formatImpactCopy,
} from './tire-real-world-impact';
import { buildPerformanceImpactCards } from './tire-performance-impact';

describe('tire-real-world-impact', () => {
  it('formats three-part impact copy', () => {
    const copy = formatImpactCopy({
      measurement: 'Sidewall +16 mm.',
      engineering: 'More air volume deflects under load.',
      practical: 'Ride comfort improves on rough roads.',
    });
    expect(copy).toContain('Sidewall +16 mm');
    expect(copy).toContain('Ride comfort improves');
  });

  it('ride comfort copy cites sidewall mm delta', () => {
    const specsA = getTireSpecs('225/45R17');
    const specsB = getTireSpecs('235/40R18');
    const comparison = compareTires('225/45R17', '235/40R18', 60);
    const copy = buildRideComfortImpactCopy('225/45R17', '235/40R18', comparison, specsA, specsB);
    const full = formatImpactCopy(copy);
    expect(full).toMatch(/\d+\s*mm/i);
    expect(full).not.toMatch(/Larger sidewalls improve comfort/i);
  });

  it('comparison performance cards have measurement-rich explanations', () => {
    const sizeA = '225/45R17';
    const sizeB = '235/40R18';
    const specsA = getTireSpecs(sizeA);
    const specsB = getTireSpecs(sizeB);
    const comparison = compareTires(sizeA, sizeB, 60);
    const analysis = buildComparisonAnalysis(sizeA, sizeB, comparison, specsA, specsB);
    const cards = buildComparisonPerformanceImpactCards(analysis);

    expect(cards).toHaveLength(6);
    for (const card of cards) {
      expect(card.explanation.length).toBeGreaterThan(80);
      expect(card.explanation).toMatch(/\d/);
      expect(card.explanation).not.toMatch(/improved handling|better grip|save \d+%/i);
    }

    const handling = cards.find((c) => c.id === 'handling')!;
    expect(handling.explanation).toMatch(/mm|aspect|sidewall/i);
  });

  it('single-size calculator cards use measured copy', () => {
    const cards = buildPerformanceImpactCards(getTireSpecs('275/70R18'));
    const comfort = cards.find((c) => c.id === 'comfort')!;
    expect(comfort.copy).toMatch(/\d/);
    expect(comfort.copy).not.toMatch(/More sidewall helps absorb potholes/i);
    expect(comfort.copy).not.toMatch(/Shorter sidewalls feel firmer/i);
  });
});
