import { describe, expect, it } from 'vitest';
import {
  DATA_SOURCES,
  EDITORIAL_PROCESS,
  METHODOLOGY,
  SITE_CONTENT_UPDATED,
  formatEditorialDate,
} from './editorial';

describe('editorial methodology content', () => {
  it('methodology describes actual calculation steps', () => {
    const text = [METHODOLOGY.intro, ...METHODOLOGY.steps.map((s) => s.detail)].join(' ');
    expect(text).toMatch(/sidewall|circumference|revs per mile/i);
    expect(text).toMatch(/speedometer|ground clearance|fitment score/i);
    expect(text).not.toMatch(/\bcertified engineer\b|\bASE certified\b|\bDOT approved\b/i);
  });

  it('editorial process references validation gates', () => {
    const text = [EDITORIAL_PROCESS.intro, ...EDITORIAL_PROCESS.steps.map((s) => s.detail)].join(' ');
    expect(text).toMatch(/tire-math|structural|validator|contradict/i);
  });

  it('data sources are honest about limitations', () => {
    expect(DATA_SOURCES.some((s) => /variance|limitation|placard/i.test(s.detail))).toBe(true);
    expect(DATA_SOURCES.some((s) => /ETRTO|load index/i.test(s.detail))).toBe(true);
  });

  it('formats the site-wide update date', () => {
    expect(formatEditorialDate(SITE_CONTENT_UPDATED)).toMatch(/2026/);
  });
});
