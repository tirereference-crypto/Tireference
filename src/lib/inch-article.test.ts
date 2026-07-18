import { describe, expect, it } from 'vitest';
import { articleForInch, formatInchWheel } from './inch-article';

describe('inch-article', () => {
  it('uses an for 8, 11, and 18 inch wheels', () => {
    expect(articleForInch(8)).toBe('an');
    expect(articleForInch(11)).toBe('an');
    expect(articleForInch(18)).toBe('an');
    expect(formatInchWheel(18)).toBe('an 18-inch wheel');
  });

  it('uses a for 15, 16, 17, 19, and 20 inch wheels', () => {
    expect(articleForInch(15)).toBe('a');
    expect(articleForInch(16)).toBe('a');
    expect(articleForInch(17)).toBe('a');
    expect(articleForInch(19)).toBe('a');
    expect(articleForInch(20)).toBe('a');
    expect(formatInchWheel(17)).toBe('a 17-inch wheel');
  });
});
