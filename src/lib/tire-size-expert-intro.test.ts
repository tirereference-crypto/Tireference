import { describe, expect, it } from 'vitest';
import {
  getExpertIntroBlockForTireSize,
  getExpertIntroForTireSize,
} from './tire-size-expert-intro';
import { getTireSpecs } from './tire-math';
import { buildTireSizeHubData } from './tire-size-hub';
import { buildQuickTakeForSize } from './tire-size-quick-take';

describe('getExpertIntroForTireSize — 275/70R18', () => {
  it('returns a concise paragraph with calculated diameter', () => {
    const specs = getTireSpecs('275/70R18');
    const intro = getExpertIntroForTireSize({ size: '275/70R18', specs });
    expect(intro).toBeTruthy();
    expect(intro!).toContain('275/70R18');
    expect(intro!).toContain('33.2');
    expect(intro!.toLowerCase()).not.toContain('commonly used on');
    expect(intro!.toLowerCase()).not.toContain('perfect balance');
  });

  it('includes three short fitment notes', () => {
    const specs = getTireSpecs('275/70R18');
    const block = getExpertIntroBlockForTireSize({ size: '275/70R18', specs })!;
    expect(block.fitmentNotes).toHaveLength(3);
    expect(block.fitmentNotes.join(' ')).toMatch(/overland|pickup|SUV/i);
    expect(block.fitmentNotes.join(' ')).toMatch(/E-load|load range|towing/i);
    expect(block.fitmentNotes.join(' ')).toMatch(/speedometer|fuel|steering/i);
  });

  it('keeps the paragraph short', () => {
    const specs = getTireSpecs('275/70R18');
    const intro = getExpertIntroForTireSize({ size: '275/70R18', specs })!;
    const words = intro.trim().split(/\s+/).length;
    expect(words).toBeLessThanOrEqual(75);
  });

  it('wires into hub intro for 275/70R18', () => {
    const hub = buildTireSizeHubData('275/70R18');
    expect(hub).toBeTruthy();
    expect(hub!.intro).toContain('sweet spot');
    expect(hub!.intro).toContain('33.2');
  });

  it('returns a size-aware intro for other catalog sizes', () => {
    const specs = getTireSpecs('225/45R17');
    const intro = getExpertIntroForTireSize({
      size: '225/45R17',
      specs,
      category: 'performance',
    });
    expect(intro).toBeTruthy();
    expect(intro!).toContain('225/45R17');
    expect(intro!.toLowerCase()).toMatch(/performance|steering|contact patch/);
  });

  it('includes three fitment notes for non-275 sizes', () => {
    const specs = getTireSpecs('205/55R16');
    const block = getExpertIntroBlockForTireSize({
      size: '205/55R16',
      specs,
      category: 'passenger',
    })!;
    expect(block.fitmentNotes).toHaveLength(3);
  });
});

describe('Quick Take — 275/70R18', () => {
  it('uses expert-style best-for / consider copy', () => {
    const hub = buildTireSizeHubData('275/70R18')!;
    const qt = buildQuickTakeForSize(hub);
    expect(qt.bestFor.join(' ')).toMatch(/near-33|sidewall|load-range|all-terrain/i);
    expect(qt.considerAnotherSizeIf.join(' ')).toMatch(/fuel economy|ride comfort/i);
  });
});
