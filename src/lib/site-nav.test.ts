import { describe, expect, it } from 'vitest';
import { getActiveNavItem } from './site-nav';

describe('getActiveNavItem', () => {
  it('marks tire size hub pages', () => {
    expect(getActiveNavItem('/tire-sizes')).toBe('tire-sizes');
    expect(getActiveNavItem('/tire-size/275-70r18')).toBe('tire-sizes');
  });

  it('marks calculator pages', () => {
    expect(getActiveNavItem('/tire-size-calculator')).toBe('calculators');
    expect(getActiveNavItem('/calculators/gear-ratio-calculator')).toBe('calculators');
  });

  it('marks comparison pages', () => {
    expect(getActiveNavItem('/tire-size-comparison')).toBe('compare');
    expect(getActiveNavItem('/compare/275-70-r18-vs-305-70-r18')).toBe('compare');
  });

  it('marks fitment pages', () => {
    expect(getActiveNavItem('/wheel-offset-calculator')).toBe('fitment');
  });

  it('marks company pages', () => {
    expect(getActiveNavItem('/about')).toBe('about');
    expect(getActiveNavItem('/contact')).toBe('contact');
  });
});
