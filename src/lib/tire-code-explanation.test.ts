import { describe, expect, it } from 'vitest';
import { partsForSize } from '../components/calculators/tire-size-calculator/TireCodeVisuals';
import { getTireSpecs } from './tire-math';

describe('tire code explanation cards', () => {
  it('builds four metric cards matching the educational reference copy', () => {
    const specs = getTireSpecs('275/70R18');
    const parts = partsForSize('275/70R18', specs);

    expect(parts).toHaveLength(4);
    expect(parts.map((p) => p.title)).toEqual([
      'Width (mm)',
      'Aspect Ratio (%)',
      'Construction',
      'Wheel Diameter (in)',
    ]);
    expect(parts[0].value).toBe('275');
    expect(parts[0].body).toMatch(/section width/i);
    expect(parts[1].value).toBe('70');
    expect(parts[1].body).toMatch(/70%/);
    expect(parts[1].body).toMatch(/275 mm/);
    expect(parts[2].body).toMatch(/radial construction/i);
    expect(parts[3].value).toBe('18');
    expect(parts[3].body).toMatch(/rim diameter/i);
    expect(parts.every((p) => p.body.length < 140)).toBe(true);
  });

  it('builds four flotation cards with decimal values', () => {
    const specs = getTireSpecs('33x12.50R17');
    const parts = partsForSize('33x12.50R17', specs);

    expect(parts).toHaveLength(4);
    expect(parts[0].title).toBe('Width (in)');
    expect(parts[0].value).toBe('12.50');
    expect(parts[1].title).toBe('Overall Diameter (in)');
    expect(parts[1].value).toBe('33');
    expect(parts[2].value).toBe('R');
    expect(parts[3].value).toBe('17');
    expect(parts.every((p) => ['width', 'aspect', 'construction', 'wheel'].includes(p.visual))).toBe(
      true,
    );
  });
});
