import { describe, expect, it } from 'vitest';
import { buildTireSizeHubData } from './tire-size-hub';
import { buildTireSizeGuideData } from './tire-size-guide';
import { formatInchWheel } from './inch-article';
import { getExpertIntroBlockForTireSize } from './tire-size-expert-intro';

/** Routes that must share one structural template with size-specific data. */
const AUDIT_SIZES = [
  '205/55R16',
  '235/65R17',
  '265/70R17',
  '275/70R18',
  '285/70R17',
] as const;

const REQUIRED_GUIDE_KEYS = [
  'size',
  'displaySize',
  'glance',
  'bestFor',
  'considerIf',
  'realWorldImpact',
  'vehicles',
  'products',
  'equivalents',
  'upgrades',
  'related',
  'popularComparisons',
  'faq',
  'compareHref',
  'calculatorHref',
] as const;

describe('tire-size guide template consolidation', () => {
  it('builds the same structural guide shape for the audited sizes', () => {
    const shapes = AUDIT_SIZES.map((size) => {
      const hub = buildTireSizeHubData(size);
      expect(hub, `missing hub for ${size}`).toBeTruthy();
      const guide = buildTireSizeGuideData(hub!);
      return {
        size,
        keys: REQUIRED_GUIDE_KEYS.filter((key) => key in guide),
        glanceLabels: guide.glance.map((row) => row.label),
        rim: guide.glance.find((row) => row.label === 'Rim Diameter')?.value,
        expectedRim: `${hub!.specs.wheelDiameterIn}"`,
        hasProvenance: guide.glance.every((row) => Boolean(row.provenance)),
        displaySize: guide.displaySize,
        vehicleCount: guide.vehicles.length,
        productTotal: guide.productTotal,
      };
    });

    const firstKeys = shapes[0].keys;
    const firstGlance = shapes[0].glanceLabels;

    for (const shape of shapes) {
      expect(shape.keys).toEqual(firstKeys);
      expect(shape.glanceLabels).toEqual(firstGlance);
      expect(shape.rim).toBe(shape.expectedRim);
      expect(shape.hasProvenance).toBe(true);
      expect(shape.displaySize).toContain(shape.size.replace('/', '/'));
    }

    // Size-specific data must differ across the sample set.
    const displays = new Set(shapes.map((s) => s.displaySize));
    expect(displays.size).toBe(AUDIT_SIZES.length);

    const rims = shapes.map((s) => s.rim);
    expect(rims).toEqual(['16"', '17"', '17"', '18"', '17"']);
  });

  it('uses verified fitment data only (no invented 275 vehicle list)', () => {
    const hub = buildTireSizeHubData('275/70R18');
    const guide = buildTireSizeGuideData(hub!);
    const labels = guide.vehicles.map((v) => `${v.manufacturer} ${v.model}`);
    // Dataset OE platforms for 275/70R18 — not the old F-150 / 4Runner shortcut list.
    expect(labels.some((l) => l.includes('Land Cruiser'))).toBe(true);
    expect(labels.some((l) => l === 'Ford F-150')).toBe(false);
  });

  it('uses correct a/an wheel phrasing in expert intros', () => {
    for (const size of AUDIT_SIZES) {
      const hub = buildTireSizeHubData(size)!;
      const block = getExpertIntroBlockForTireSize({
        size: hub.entry.size,
        specs: hub.specs,
        category: hub.entry.category,
      });
      const wheel = formatInchWheel(hub.specs.wheelDiameterIn);
      expect(block?.paragraph).toContain(wheel);
      expect(block?.paragraph).not.toMatch(/\ba 18-inch wheel\b/);
      expect(block?.paragraph).not.toMatch(/\ban 17-inch wheel\b/);
      expect(block?.paragraph).not.toMatch(/\ban 16-inch wheel\b/);
    }
  });

  it('omits empty vehicle and product collections rather than inventing fillers', () => {
    for (const size of AUDIT_SIZES) {
      const guide = buildTireSizeGuideData(buildTireSizeHubData(size)!);
      // Arrays may be empty; template hides those sections — never invent rows.
      expect(Array.isArray(guide.vehicles)).toBe(true);
      expect(Array.isArray(guide.products)).toBe(true);
      for (const v of guide.vehicles) {
        expect(v.manufacturer.trim().length).toBeGreaterThan(0);
        expect(v.model.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
