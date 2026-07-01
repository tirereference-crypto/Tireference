import { describe, expect, it } from 'vitest';
import { getInsightForTire, hashTireSize } from './tire-logic-insights';

describe('tire-logic-insights', () => {
  it('hashTireSize is deterministic', () => {
    expect(hashTireSize('275/70R18')).toBe(hashTireSize('275/70R18'));
    expect(hashTireSize('275/70R18')).not.toBe(hashTireSize('285/70R17'));
  });

  it('getInsightForTire returns the same insight for the same size', () => {
    const first = getInsightForTire('off-road', '275/70R18');
    const second = getInsightForTire('off-road', '275/70R18');
    expect(first).toBe(second);
    expect(first.length).toBeGreaterThan(20);
  });

  it('getInsightForTire can vary by category for the same size string', () => {
    const offRoad = getInsightForTire('off-road', '275/70R18');
    const suv = getInsightForTire('SUV', '275/70R18');
    expect(offRoad).toBeTruthy();
    expect(suv).toBeTruthy();
  });
});
