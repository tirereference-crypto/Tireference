import { describe, expect, it } from 'vitest';
import { formatTireDiameterResults } from './format-tire-diameter';
import { getSpecsFromFields } from './tire-size-input';

describe('formatTireDiameterResults', () => {
  it('275/70R18 shows about 33.16 in diameter', () => {
    const specs = getSpecsFromFields({
      width: '275',
      aspectRatio: '70',
      wheelDiameter: '18',
    });
    expect(specs).not.toBeNull();

    const { diameter } = formatTireDiameterResults(specs!, 'imperial');
    expect(Number(diameter.value)).toBeCloseTo(33.16, 1);
    expect(Math.abs(Number(diameter.value) - 33.16)).toBeLessThanOrEqual(0.05);
    expect(diameter.unit).toBe('in');
  });
});
