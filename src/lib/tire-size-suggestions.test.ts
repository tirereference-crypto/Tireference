import { describe, expect, it } from 'vitest';
import { TIRE_SIZES } from '../data/tire-sizes';
import { getTireSpecs } from './tire-math';
import { isValidTireSizePath } from './tire-size-url';
import {
  classifyTireSize,
  familyForClass,
  getDiameterDeltaPercent,
  getEquivalentSizes,
  getPopularUpgrades,
  getRelatedSizes,
  getTireSizeSuggestions,
} from './tire-size-suggestions';

describe('tire-size-suggestions', () => {
  it('classifies passenger vs truck sizes into different families', () => {
    expect(familyForClass(classifyTireSize('225/55R17'))).toBe('car');
    expect(familyForClass(classifyTireSize('205/55R16'))).toBe('car');
    expect(familyForClass(classifyTireSize('275/70R18'))).toBe('truck');
    expect(familyForClass(classifyTireSize('285/70R17'))).toBe('truck');
  });

  it('keeps 225/55R17 upgrades modest and excludes truck sizes', () => {
    const upgrades = getPopularUpgrades('225/55R17');
    const sizes = upgrades.map((u) => u.size);

    expect(sizes).not.toContain('275/55R20');
    expect(sizes).not.toContain('305/70R18');
    expect(sizes).not.toContain('315/70R17');
    expect(sizes).not.toContain('275/70R18');

    for (const u of upgrades) {
      expect(u.diameterDiffPercent).toBeGreaterThan(0);
      expect(u.diameterDiffPercent).toBeLessThanOrEqual(5);
      expect(familyForClass(u.sizeClass)).toBe('car');
      expect(isValidTireSizePath(u.href)).toBe(true);
    }
  });

  it('keeps 225/55R17 equivalents within ±3% diameter', () => {
    const equivalents = getEquivalentSizes('225/55R17');
    expect(equivalents.length).toBeGreaterThan(0);
    for (const e of equivalents) {
      expect(Math.abs(e.diameterDiffPercent)).toBeLessThanOrEqual(3);
      expect(familyForClass(e.sizeClass)).toBe('car');
      expect(isValidTireSizePath(e.href)).toBe(true);
    }
  });

  it('allows truck upgrades for 275/70R18', () => {
    const upgrades = getPopularUpgrades('275/70R18');
    expect(upgrades.length).toBeGreaterThan(0);
    for (const u of upgrades) {
      expect(familyForClass(u.sizeClass)).toBe('truck');
      expect(u.diameterDiffPercent).toBeGreaterThan(0);
      expect(u.diameterDiffPercent).toBeLessThanOrEqual(8);
      expect(isValidTireSizePath(u.href)).toBe(true);
    }
    const sizes = upgrades.map((u) => u.size);
    // Prefer same-class truck upsizes when present in catalog
    const allowed = ['285/70R18', '295/70R18', '305/70R18', '315/70R17', '285/70R17'];
    expect(sizes.some((s) => allowed.includes(s) || s.startsWith('28') || s.startsWith('30'))).toBe(
      true,
    );
  });

  it('keeps 205/55R16 suggestions in the car family', () => {
    const { equivalents, upgrades, related } = getTireSizeSuggestions('205/55R16');
    for (const s of [...equivalents, ...upgrades, ...related]) {
      expect(familyForClass(s.sizeClass)).toBe('car');
      expect(isValidTireSizePath(s.href)).toBe(true);
    }
  });

  it('keeps 285/70R17 suggestions in the truck family', () => {
    const { equivalents, upgrades, related } = getTireSizeSuggestions('285/70R17');
    for (const s of [...equivalents, ...upgrades, ...related]) {
      expect(familyForClass(s.sizeClass)).toBe('truck');
    }
  });

  it('keeps 225/65R17 related/upgrades away from extreme 35-inch truck sizes', () => {
    const { upgrades, related, equivalents } = getTireSizeSuggestions('225/65R17');
    const all = [...upgrades, ...related, ...equivalents];
    for (const s of all) {
      expect(s.size).not.toBe('305/70R18');
      expect(s.size).not.toBe('315/70R17');
      const diameter = getTireSpecs(s.size).overallDiameterIn;
      expect(diameter).toBeLessThan(33);
    }
  });

  it('related sizes stay within ±6% diameter', () => {
    for (const entry of TIRE_SIZES.slice(0, 12)) {
      for (const s of getRelatedSizes(entry.size)) {
        expect(Math.abs(s.diameterDiffPercent)).toBeLessThanOrEqual(6);
        expect(Math.abs(getDiameterDeltaPercent(entry.size, s.size))).toBeLessThanOrEqual(6);
      }
    }
  });

  it('does not invent sizes outside the catalog', () => {
    const catalog = new Set(TIRE_SIZES.map((e) => e.size.toUpperCase()));
    for (const entry of ['225/55R17', '275/70R18', '205/55R16'] as const) {
      const { equivalents, upgrades, related } = getTireSizeSuggestions(entry);
      for (const s of [...equivalents, ...upgrades, ...related]) {
        expect(catalog.has(s.size.toUpperCase())).toBe(true);
      }
    }
  });
});
