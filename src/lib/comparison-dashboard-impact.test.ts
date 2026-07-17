import { describe, expect, it } from 'vitest';
import {
  buildDashboardImpactCards,
  buildDashboardWhatChangesContent,
  THINGS_TO_CHECK_BEFORE_CHANGING_SIZES,
} from './comparison-dashboard-impact';
import { formatDimensionDiff } from './tire-comparison-units';
import { compareTires, getTireSpecs } from './tire-math';

describe('comparison dashboard impact', () => {
  it('builds six interpretive impact cards for 225/45R17 vs 235/40R18', () => {
    const a = '225/45R17';
    const b = '235/40R18';
    const comparison = compareTires(a, b, 60);
    const specsA = getTireSpecs(a);
    const specsB = getTireSpecs(b);
    const cards = buildDashboardImpactCards({
      comparison,
      specsA,
      specsB,
      unitSystem: 'imperial',
    });

    expect(cards.map((c) => c.id)).toEqual([
      'speedometer',
      'clearance',
      'sidewall',
      'gearing',
      'wheel',
      'install',
    ]);
    expect(cards[0].title).toBe('Speedometer at selected speed');
    expect(cards[0].value).toContain('60 mph indicated ≈');
    expect(cards[0].value).toContain(`${comparison.speedometer.trueSpeed.toFixed(1)} mph actual`);
    expect(cards[0].detail).toMatch(/selected vehicle-speed input/i);
    expect(cards[1].value).toBe(
      `Approximately ${formatDimensionDiff(comparison.groundClearanceChangeIn, 'imperial')}`,
    );
    expect(cards[1].detail).toMatch(/Half of the overall diameter/i);
    expect(cards[2].value).toMatch(/Shorter sidewall/i);
    expect(cards[2].detail).toMatch(/impact harshness/i);
    expect(cards[3].value).toMatch(/taller/i);
    expect(cards[3].detail).toMatch(/Fewer wheel revolutions|fewer wheel revolutions/i);
    expect(cards[4].value).toBe('18-inch wheel required');
    expect(cards[4].detail).toMatch(/17-inch wheel cannot be reused/i);
    expect(cards[5].id).toBe('install');
    expect(cards[5].value).toMatch(/verification required|verification recommended|size check/i);
  });

  it('reflects indicated vehicle speed in the speedometer card', () => {
    const a = '275/70R18';
    const b = '285/70R18';
    const comparison = compareTires(a, b, 70);
    const cards = buildDashboardImpactCards({
      comparison,
      specsA: getTireSpecs(a),
      specsB: getTireSpecs(b),
      unitSystem: 'imperial',
    });
    expect(cards[0].value).toMatch(/70 mph indicated ≈/);
    expect(cards[4].value).toMatch(/Same 18-inch wheel/);
  });

  it('keeps visible insight copy in the 180–250 word band', () => {
    const pairs: [string, string][] = [
      ['225/45R17', '235/40R18'],
      ['275/70R18', '285/70R18'],
      ['225/45R17', '225/45R17'],
    ];
    for (const [a, b] of pairs) {
      const content = buildDashboardWhatChangesContent(
        a,
        b,
        compareTires(a, b, 60),
        getTireSpecs(a),
        getTireSpecs(b),
      );
      expect(content.heading).toBe(`What changes when switching from ${a} to ${b}?`);
      expect(content.wordCount).toBeGreaterThanOrEqual(180);
      expect(content.wordCount).toBeLessThanOrEqual(250);
      expect(content.paragraphs.length).toBe(5);
      expect(content.insights).toHaveLength(4);
      expect(content.insights.map((row) => row.id)).toEqual([
        'diameter',
        'width',
        'wheel',
        'gearing-clearance',
      ]);
      for (const insight of content.insights) {
        expect(insight.sentences.length).toBeGreaterThanOrEqual(2);
        expect(insight.sentences.length).toBeLessThanOrEqual(3);
      }
    }
  });

  it('exposes grouped pre-install checklist without claiming passes', () => {
    expect(THINGS_TO_CHECK_BEFORE_CHANGING_SIZES).toHaveLength(11);
    expect(THINGS_TO_CHECK_BEFORE_CHANGING_SIZES.some((item) => /rim-width/i.test(item))).toBe(
      true,
    );
    expect(THINGS_TO_CHECK_BEFORE_CHANGING_SIZES.some((item) => /TPMS/i.test(item))).toBe(true);
  });
});
